/**
 * The guided picker, offline.
 *
 * The picker has to be right before it is worth spending a research call on what it produces —
 * if it hands the planner two people when four answered, the live price is wrong and the price
 * layer will never know. So this asserts the properties that matter rather than printing output
 * for a human to eyeball: occupancy actually differs by who you are going with, the carless case
 * never recommends a trip that needs a car, dates land on a Friday when there are nights away,
 * and a brief survives a round trip through the URL.
 *
 *   npx tsx scripts/probe-intake.ts
 *
 * Costs nothing. No API key, no model, no network.
 */

let failures = 0;

function check(label: string, condition: boolean, detail = '') {
  if (condition) {
    console.log(`  ok    ${label}`);
  } else {
    failures += 1;
    console.log(`  FAIL  ${label}${detail ? ` — ${detail}` : ''}`);
  }
}

async function main() {
  const { deriveOccupancy, TRIP_LENGTH_NIGHTS } = await import('../lib/intake/types');
  const { datesFor, decodeBrief, encodeBrief, EMPTY_BRIEF } = await import('../lib/intake/brief');
  const { recommendDestinations } = await import('../lib/intake/match');
  const { daysBetween, parseIsoDate } = await import('../lib/util/dates');

  /* ---------------------------------------------------------------- occupancy */
  console.log('\nOccupancy — who you go with has to change the room count');
  const four = 4;
  const friends = deriveOccupancy('friends', four);
  const family = deriveOccupancy('family', four);
  const partner = deriveOccupancy('partner', 2);

  check('four friends take one room', friends.rooms === 1, `got ${friends.rooms}`);
  check('four family take two', family.rooms === 2, `got ${family.rooms}`);
  check('friends may use dorms, family may not', friends.allowDorms && !family.allowDorms);
  check(
    'the basis text differs between them',
    friends.note !== family.note && family.note !== partner.note,
  );
  check('a partner is one double', partner.rooms === 1 && partner.bedding === 'double');
  check('eight friends need two rooms', deriveOccupancy('friends', 8).rooms === 2);

  /* ---------------------------------------------------------------- dates */
  console.log('\nDates — a window plus a length becomes two real dates');
  for (const when of ['this-weekend', 'next-2-weeks', 'next-month'] as const) {
    const { startDate, endDate } = datesFor(when, 'weekend');
    const nights = daysBetween(startDate, endDate);
    check(
      `${when}: two nights, departing Friday`,
      nights === 2 && parseIsoDate(startDate).getDay() === 5,
      `${startDate} → ${endDate} (${nights} nights, day ${parseIsoDate(startDate).getDay()})`,
    );
  }
  // The break is the exception, and deliberately: Thanksgiving is a Thursday, and the cohort
  // travels the Wednesday before it. A Friday departure would miss the point of the window.
  const breakDates = datesFor('the-break', 'weekend');
  check(
    'the break departs the Wednesday before Thanksgiving',
    parseIsoDate(breakDates.startDate).getDay() === 3,
    `${breakDates.startDate} is day ${parseIsoDate(breakDates.startDate).getDay()}`,
  );
  const dayTrip = datesFor('next-month', 'day');
  check('a day trip starts and ends the same day', dayTrip.startDate === dayTrip.endDate);
  check(
    'a week is five nights',
    daysBetween(datesFor('next-month', 'week').startDate, datesFor('next-month', 'week').endDate) ===
      TRIP_LENGTH_NIGHTS.week,
  );
  const soon = parseIsoDate(datesFor('this-weekend', 'weekend').startDate);
  const later = parseIsoDate(datesFor('next-month', 'weekend').startDate);
  check('next month is after this weekend', later > soon);

  /* ---------------------------------------------------------------- the URL round trip */
  console.log('\nURL round trip — the answers have to survive the click');
  const brief = {
    ...EMPTY_BRIEF,
    companions: 'family' as const,
    partySize: 5,
    length: 'long-weekend' as const,
    when: 'the-break' as const,
    budget: 'comfortable' as const,
    vibes: ['outdoors' as const, 'culture' as const],
    isOver21: true,
    anythingElse: 'One of us cannot drive.',
  };
  const round = decodeBrief(new URLSearchParams(encodeBrief(brief)));
  check('decoded brief equals the encoded one', JSON.stringify(round) === JSON.stringify(brief), JSON.stringify(round));
  check('no brief in the URL reads as no brief', decodeBrief(new URLSearchParams('')) === null);
  check(
    'a hand-mangled brief still opens',
    decodeBrief(new URLSearchParams('who=friends&n=nonsense&len=fortnight'))?.partySize === 4,
  );
  check(
    'an absurd party size is clamped',
    decodeBrief(new URLSearchParams('who=friends&n=900'))?.partySize === 12,
  );

  /* ---------------------------------------------------------------- recommendations */
  console.log('\nRecommendations — never suggest a trip this group cannot take');
  const carless = recommendDestinations({
    ...EMPTY_BRIEF,
    isOver21: false,
    hasCar: false,
    vibes: ['outdoors'],
  });
  check(
    'nobody over 21 and no car: nothing needing a car is offered',
    carless.every((r) => !r.idea.needsCar),
    carless.filter((r) => r.idea.needsCar).map((r) => r.idea.slug).join(', '),
  );

  const withDriver = recommendDestinations({
    ...EMPTY_BRIEF,
    isOver21: true,
    hasCar: false,
    vibes: ['outdoors'],
  });
  check('a driver over 21 opens up more', withDriver.length >= carless.length);
  check(
    'a car they do not have is called out',
    withDriver
      .filter((r) => r.idea.needsCar)
      .every((r) => (r.catch ?? '').includes('hires one')),
  );

  const evening = recommendDestinations({ ...EMPTY_BRIEF, length: 'evening' });
  check('an evening gets day trips', evening.every((r) => r.idea.shape === 'day'), evening.map((r) => `${r.idea.slug}:${r.idea.shape}`).join(', '));

  const week = recommendDestinations({ ...EMPTY_BRIEF, length: 'week', budget: 'comfortable' });
  check('a week gets longer trips', week.some((r) => r.idea.shape === 'break'), week.map((r) => `${r.idea.slug}:${r.idea.shape}`).join(', '));

  const cheap = recommendDestinations({ ...EMPTY_BRIEF, budget: 'shoestring', vibes: ['cheap-as-possible'] });
  check(
    'shoestring leads with something affordable',
    (cheap[0]?.perPersonMin ?? 999) <= 160,
    `${cheap[0]?.idea.slug} from $${cheap[0]?.perPersonMin}`,
  );

  const beach = recommendDestinations({ ...EMPTY_BRIEF, vibes: ['beach'] });
  const outdoors = recommendDestinations({ ...EMPTY_BRIEF, vibes: ['outdoors'] });
  check(
    'different vibes give different top picks',
    beach[0]?.idea.slug !== outdoors[0]?.idea.slug,
    `${beach[0]?.idea.slug} vs ${outdoors[0]?.idea.slug}`,
  );

  check('exactly one is our pick', beach.filter((r) => r.ourPick).length === 1);
  check('every recommendation says why', beach.every((r) => r.why.trim().length > 20));

  /* ---------------------------------------------------------------- what it looks like */
  console.log('\nA worked example — four friends, a weekend, outdoors, nobody over 21:');
  const example = recommendDestinations({
    ...EMPTY_BRIEF,
    companions: 'friends',
    partySize: 4,
    length: 'weekend',
    when: 'next-2-weeks',
    budget: 'moderate',
    vibes: ['outdoors'],
  });
  const exampleDates = datesFor('next-2-weeks', 'weekend');
  console.log(`  ${exampleDates.startDate} → ${exampleDates.endDate}`);
  for (const r of example) {
    console.log(`\n  ${r.ourPick ? '★' : '·'} ${r.idea.title} — $${r.perPersonMin}–${r.perPersonMax} each`);
    console.log(`    ${r.why}`);
    if (r.catch) console.log(`    catch: ${r.catch}`);
  }

  console.log(
    failures === 0 ? '\nAll checks passed.\n' : `\n${failures} check(s) failed.\n`,
  );
  process.exit(failures === 0 ? 0 : 1);
}

void main();
