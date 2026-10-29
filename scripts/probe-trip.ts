/**
 * The trip model, proved offline against the committed data.
 *
 *   npx tsx scripts/probe-trip.ts
 *
 * Free. No key, no network, no model.
 *
 * The arithmetic is where this product is either right or worthless, and the failures are quiet:
 * a per-vehicle fee treated as per-person is wrong by a factor of the party size and still looks
 * like a price. So these are assertions rather than output to eyeball, and the ones that matter
 * most are the unit cases and the eligibility cases.
 */
import { DESTINATIONS, DESTINATIONS_BY_SLUG, WINDOWS, carRules, compactRate } from '../lib/trip/catalogue';
import { perPerson, quoteTrip, roomsFor, weakestSource } from '../lib/trip/quote';
import type { CostLine, Driver, Unit } from '../lib/trip/types';

let passed = 0;
let failed = 0;

function check(name: string, condition: boolean, detail = ''): void {
  if (condition) {
    passed += 1;
    console.log(`  ok    ${name}`);
  } else {
    failed += 1;
    console.log(`  FAIL  ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

function heading(text: string): void {
  console.log(`\n${text}\n${'─'.repeat(text.length)}`);
}

const NO_LICENCE: Driver = { hasLicence: false, ageBand: null };
const UNDER_21: Driver = { hasLicence: true, ageBand: 'under-21' };
const YOUNG: Driver = { hasLicence: true, ageBand: '21-24' };
const OLDER: Driver = { hasLicence: true, ageBand: '25-plus' };

const WINDOW = WINDOWS[0];
const VALID_UNITS: Unit[] = ['per-person', 'per-vehicle', 'per-vehicle-day', 'per-party', 'per-room-stay'];

function allLines(): CostLine[] {
  const lines: CostLine[] = [];
  for (const d of DESTINATIONS) {
    lines.push(...d.fees);
    if (d.transit) lines.push(d.transit.fare, ...(d.transit.local ? [d.transit.local] : []));
    if (d.parkingPerNight) lines.push(d.parkingPerNight);
  }
  lines.push(compactRate(), carRules().youngDriverFee);
  return lines;
}

function main(): void {
  heading('1. The committed data is the shape the model expects');
  check('four destinations', DESTINATIONS.length === 4, `got ${DESTINATIONS.length}`);
  check('four windows', WINDOWS.length === 4, `got ${WINDOWS.length}`);
  check(
    'every window is a Friday',
    WINDOWS.every((w) => new Date(`${w.outbound}T12:00:00Z`).getUTCDay() === 5),
    WINDOWS.map((w) => w.outbound).join(', '),
  );
  check(
    'every window is in the future',
    WINDOWS.every((w) => w.outbound > new Date().toISOString().slice(0, 10)),
    'a window in the past prices a trip nobody can take',
  );
  check(
    'every destination has an image path',
    DESTINATIONS.every((d) => d.image.startsWith('/assets/') && d.image.endsWith('.webp')),
  );
  check(
    'every destination has five seeded stay totals',
    DESTINATIONS.every((d) => d.seededStayTotals.length === 5 && d.seededStayTotals.every((n) => n > 0)),
  );
  check(
    'every itinerary item states its catch',
    DESTINATIONS.every((d) => d.itinerary.every((i) => i.catch.trim().length > 20)),
  );

  heading('2. Every figure says where it came from');
  const lines = allLines();
  check(`all ${lines.length} lines say where they came from`, lines.every((l) => ['api', 'operator', 'authored'].includes(l.source)));
  check('all lines carry a valid unit', lines.every((l) => VALID_UNITS.includes(l.unit)), lines.filter((l) => !VALID_UNITS.includes(l.unit)).map((l) => l.label).join(', '));
  check('all lines link to a page you can check', lines.every((l) => /^https?:\/\//.test(l.url)));
  check('all lines carry a check date', lines.every((l) => /^\d{4}-\d{2}-\d{2}/.test(l.checkedOn)));
  check('the park fees are operator-sourced, not authored', DESTINATIONS_BY_SLUG.zion.fees.every((f) => f.source === 'operator'));
  check('the hire rate owns up to being authored', compactRate().source === 'authored');
  check('the under-25 fee is operator-sourced', carRules().youngDriverFee.source === 'operator');
  check('the weakest claim wins', weakestSource([{ source: 'api' } as CostLine, { source: 'authored' } as CostLine]) === 'authored');

  heading('3. Units split the way they are charged');
  const nights = 2;
  const perVehicle: CostLine = { label: '', provider: '', amount: 40, unit: 'per-vehicle', source: 'operator', url: '', checkedOn: '' };
  const perHead: CostLine = { ...perVehicle, unit: 'per-person' };
  const perDay: CostLine = { ...perVehicle, amount: 50, unit: 'per-vehicle-day' };
  const perRoom: CostLine = { ...perVehicle, amount: 300, unit: 'per-room-stay' };

  check('per-vehicle splits four ways', perPerson(perVehicle, 4, nights) === 10);
  check('per-person does not split', perPerson(perHead, 4, nights) === 40);
  check('a two-night weekend is three hire days', perPerson(perDay, 1, nights) === 150);
  check('and that splits too', perPerson(perDay, 3, nights) === 50);
  check('a room total multiplies by rooms, then splits', perPerson(perRoom, 4, nights, 2) === 150);

  heading('4. Rooms follow the group, not the headcount');
  check('one person, one room', roomsFor(1) === 1);
  check('two share one room', roomsFor(2) === 1);
  check('three need two rooms', roomsFor(3) === 2);
  check('four need two rooms', roomsFor(4) === 2);
  check('five need three rooms', roomsFor(5) === 3);

  heading('5. The Zion surcharge behaves like the trap it is');
  const zion = DESTINATIONS_BY_SLUG.zion;
  const surcharge = zion.fees.find((f) => f.label === 'Non-resident surcharge');
  check('Zion levies it', surcharge !== undefined && surcharge.amount === 100);
  check('and it is per person, so it does not split', surcharge !== undefined && perPerson(surcharge, 4, nights) === 100);
  const jt = DESTINATIONS_BY_SLUG['joshua-tree'];
  check(
    'Joshua Tree does not levy it',
    jt.fees.every((f) => f.label !== 'Non-resident surcharge' || f.amount === 0),
  );

  heading('6. A group that cannot hire is told, not quoted');
  const zionNoLicence = quoteTrip(zion, WINDOW, 4, NO_LICENCE);
  check('a drive-only trip with no licence is unreachable', !zionNoLicence.reachable);
  check('and has no total rather than a wrong one', zionNoLicence.perPersonTotal === null);
  check('and says why in words', zionNoLicence.verdict.includes('cannot hire'), zionNoLicence.verdict);

  const zionUnder21 = quoteTrip(zion, WINDOW, 4, UNDER_21);
  check('under 21 is blocked too', !zionUnder21.reachable);
  check(
    'and names the agencies rather than refusing vaguely',
    zionUnder21.verdict.includes('Enterprise') || zionUnder21.verdict.includes('21'),
    zionUnder21.verdict,
  );

  const zionOlder = quoteTrip(zion, WINDOW, 4, OLDER);
  check('at 25 or over it is reachable', zionOlder.reachable && zionOlder.perPersonTotal !== null);

  heading('7. The under-25 surcharge lands in the total, not a footnote');
  const young = quoteTrip(zion, WINDOW, 4, YOUNG);
  const older = quoteTrip(zion, WINDOW, 4, OLDER);
  check('a 21-to-24 driver pays more than a 25-plus one', (young.perPersonTotal ?? 0) > (older.perPersonTotal ?? 0));
  const gap = (young.perPersonTotal ?? 0) - (older.perPersonTotal ?? 0);
  // $25/day over three hire days, split four ways.
  check('the gap is exactly the fee, split', Math.abs(gap - (25 * 3) / 4) < 0.01, `got ${gap.toFixed(2)}`);
  const carRowYoung = young.rows.find((r) => r.kind === 'car');
  check('and the car row says so on its face', carRowYoung?.detail.some((d) => d.includes('under-25')) === true, JSON.stringify(carRowYoung?.detail));

  heading('8. A carless group still gets San Diego');
  const sd = DESTINATIONS_BY_SLUG['san-diego'];
  const sdNoLicence = quoteTrip(sd, WINDOW, 4, NO_LICENCE);
  check('it is reachable without a licence', sdNoLicence.reachable);
  check('by the Surfliner', sdNoLicence.rows[0].title.includes('Surfliner'), sdNoLicence.rows[0].title);
  check('and the car row does not block it', sdNoLicence.rows[2].available);
  check('it costs something', (sdNoLicence.perPersonTotal ?? 0) > 0);

  heading('9. Three rows, always, and a total that adds up');
  for (const dest of DESTINATIONS) {
    const q = quoteTrip(dest, WINDOW, 4, OLDER);
    check(`${dest.slug}: three rows`, q.rows.length === 3);
    check(`${dest.slug}: travel, stay, car in order`, q.rows.map((r) => r.kind).join(',') === 'travel,stay,car');
    check(`${dest.slug}: no row is empty of detail`, q.rows.every((r) => r.detail[0].length > 0));
    const sum = q.rows.reduce((s, r) => s + r.perPersonTotal, 0) + q.fees.perPersonTotal;
    check(`${dest.slug}: the total is the sum of its rows`, Math.abs((q.perPersonTotal ?? 0) - sum) < 0.01, `${q.perPersonTotal} vs ${sum}`);
    check(`${dest.slug}: the party total is the per-person times the party`, Math.abs((q.partyTotal ?? 0) - (q.perPersonTotal ?? 0) * 4) < 0.01);
  }

  heading('10. With an empty cache every stay is honestly seeded');
  for (const dest of DESTINATIONS) {
    const q = quoteTrip(dest, WINDOW, 2, OLDER);
    const stay = q.rows[1];
    check(`${dest.slug}: the stay row is marked authored until a warm run`, stay.source === 'authored', stay.source);
    check(`${dest.slug}: and claims no check date`, stay.checkedLabel === null);
  }

  heading('11. A bigger group is cheaper a head, because the car splits');
  for (const dest of DESTINATIONS) {
    const solo = quoteTrip(dest, WINDOW, 1, OLDER).perPersonTotal ?? 0;
    const four = quoteTrip(dest, WINDOW, 4, OLDER).perPersonTotal ?? 0;
    check(`${dest.slug}: four costs less a head than one`, four < solo, `${four.toFixed(0)} vs ${solo.toFixed(0)}`);
  }

  heading('12. Hours are door to door, or they are worth nothing');
  for (const dest of DESTINATIONS) {
    check(`${dest.slug}: the drive has a door-to-door figure`, dest.drive.hoursEachWay > 0);
    check(`${dest.slug}: and says how it is made up`, dest.drive.hoursNote.length > 20);
    if (dest.transit) {
      check(`${dest.slug}: so does ${dest.transit.label}`, dest.transit.hoursEachWay > 0);
      /* The trap this exists to avoid: comparing "1h 25m in the air" against a drive measured
         kerb to kerb. A flight door to door is always more than its headline leg. */
      const headlineHours = Number(/(\d+)h/.exec(dest.transit.journeyTime)?.[1] ?? 0);
      check(
        `${dest.slug}: and it exceeds the headline leg of ${dest.transit.journeyTime}`,
        dest.transit.hoursEachWay > headlineHours,
        `${dest.transit.hoursEachWay} vs ${headlineHours}`,
      );
    }
  }
  const travelRows = DESTINATIONS.map((d) => quoteTrip(d, WINDOW, 4, OLDER).rows[0]);
  check('every travel row carries its hours', travelRows.every((r) => (r.hoursEachWay ?? 0) > 0));

  heading('13. Nothing puts a price on an hour');
  const allQuotes = DESTINATIONS.flatMap((d) =>
    [OLDER, YOUNG, NO_LICENCE].map((drv) => quoteTrip(d, WINDOW, 4, drv)),
  );
  check(
    'no cost line is a time charge',
    allQuotes.every((q) =>
      [...q.rows.flatMap((r) => r.lines), ...q.fees.lines].every(
        (l) => !/\b(hour|time|wage)\b/i.test(l.label),
      ),
    ),
    'an invented hourly rate next to a real price would undo the whole claim',
  );

  heading('14. A real trade is handed to the person going');
  const sf = DESTINATIONS_BY_SLUG['san-francisco'];
  const sfQuote = quoteTrip(sf, WINDOW, 4, OLDER);
  check('San Francisco has two ways in', sfQuote.alternative !== null);
  check(
    'driving is cheaper but flying is quicker, so it is a close call',
    sfQuote.closeCall,
    `drive ${sfQuote.rows[0].title}, alternative ${sfQuote.alternative?.label}`,
  );
  check('and the verdict asks rather than tells', sfQuote.verdict.startsWith('Your call'), sfQuote.verdict);
  check('the cheaper one is pre-filled, so no row is empty', sfQuote.perPersonTotal !== null);
  check(
    'the alternative costs more but saves hours',
    (sfQuote.alternative?.perPersonTotal ?? 0) > (sfQuote.perPersonTotal ?? 0) - (sfQuote.rows[1].perPersonTotal + sfQuote.fees.perPersonTotal) &&
      (sfQuote.alternative?.hoursEachWay ?? 99) < sfQuote.rows[0].hoursEachWay!,
  );

  const sdQuote = quoteTrip(DESTINATIONS_BY_SLUG['san-diego'], WINDOW, 4, OLDER);
  check('San Diego is a close call the other way round', sdQuote.closeCall, sdQuote.verdict);
  check('the train is the cheaper default', sdQuote.rows[0].title.includes('Surfliner'), sdQuote.rows[0].title);
  check('and driving is offered as the quicker alternative', sdQuote.alternative?.id === 'drive');

  heading('15. With one way in there is nothing to ask');
  for (const slug of ['zion', 'joshua-tree']) {
    const q = quoteTrip(DESTINATIONS_BY_SLUG[slug], WINDOW, 4, OLDER);
    check(`${slug}: no alternative exists`, q.alternative === null);
    check(`${slug}: so it is not a close call`, !q.closeCall);
    check(`${slug}: and the verdict states the case for driving`, q.verdict === DESTINATIONS_BY_SLUG[slug].drive.verdict);
  }
  const sdNoLicenceAgain = quoteTrip(DESTINATIONS_BY_SLUG['san-diego'], WINDOW, 4, NO_LICENCE);
  check('a group with no licence is never asked to choose', !sdNoLicenceAgain.closeCall);
  check('and is told why the train is the only option', sdNoLicenceAgain.verdict.includes('licence'), sdNoLicenceAgain.verdict);

  heading('16. The written verdict is kept, not overwritten');
  check(
    'every quote carries the researched view alongside the arithmetic',
    allQuotes.every((q) => q.writtenVerdict === q.destination.drive.verdict),
  );

  console.log(`\n${'─'.repeat(60)}`);
  console.log(`${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
  console.log('The arithmetic holds.\n');
}

main();
