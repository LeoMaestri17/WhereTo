import { freshness, getQuote } from '@/lib/cache/quotes';
import { carRules, compactRate, fuelBasis, type TripWindow } from './catalogue';
import type { Basis, CostLine, Destination, Driver, PartySize, TransitRoute } from './types';

/**
 * What a weekend actually costs this group.
 *
 * Pure and synchronous. Everything it needs is already committed — the warm cache for stays and
 * fares, cars.json for the hire and the surcharge, destinations.json for park fees. There is no
 * fetch in here and there must never be one: a page load that can reach the network is a page
 * load that can spend quota, and the architecture exists to make that impossible rather than
 * merely unlikely.
 *
 * Two things carry the product. The first is `basis` on every line, so a quoted figure and a
 * seeded one are never confused on screen. The second is the eligibility check: a group with no
 * licence, or one under 21, is told plainly that a hire is not available and why, rather than
 * being shown a price nobody in it can act on.
 */

/** Google prices a room at a time, and the warm run searched two adults in one room. */
const ADULTS_PER_ROOM = 2;

export function roomsFor(partySize: PartySize): number {
  return Math.ceil(partySize / ADULTS_PER_ROOM);
}

/** Reduce one line to what it costs each person. */
export function perPerson(
  line: CostLine,
  partySize: PartySize,
  nights: number,
  rooms = 1,
): number {
  switch (line.unit) {
    case 'per-person':
      return line.amount;
    case 'per-vehicle':
    case 'per-party':
      return line.amount / partySize;
    case 'per-vehicle-day':
      // A Friday-to-Sunday weekend is three hire days for two nights.
      return (line.amount * (nights + 1)) / partySize;
    case 'per-room-stay':
      return (line.amount * rooms) / partySize;
  }
}

/** The weakest claim in a set of lines is the claim the set can make. */
const RANK: Record<Basis, number> = { quoted: 0, published: 1, seeded: 2 };

export function weakestBasis(lines: CostLine[]): Basis {
  return lines.reduce<Basis>(
    (worst, l) => (RANK[l.basis] > RANK[worst] ? l.basis : worst),
    'quoted',
  );
}

/* ------------------------------------------------------------------ the rows */

export interface TripRow {
  kind: 'travel' | 'stay' | 'car';
  title: string;
  /** Two lines of detail for the row, as the build canvas renders them. */
  detail: string[];
  lines: CostLine[];
  perPersonTotal: number;
  available: boolean;
  /** Why not, when unavailable. Shown verbatim — a conflict surfaced, not an error afterwards. */
  blockedReason?: string;
  basis: Basis;
  /** "checked 3 days ago", when any line in the row came from a real lookup. */
  checkedLabel: string | null;
  bookingLink?: string;
  /** Door to door, one way. Only the travel row has one. */
  hoursEachWay?: number;
  hoursNote?: string;
}

function money(value: number): string {
  return `$${Math.round(value).toLocaleString('en-US')}`;
}

/** `6h 30m`, `45m`, `2h`. */
export function formatHours(hours: number): string {
  const whole = Math.floor(hours);
  const minutes = Math.round((hours - whole) * 60);
  if (whole === 0) return `${minutes}m`;
  return minutes === 0 ? `${whole}h` : `${whole}h ${minutes}m`;
}

/* ------------------------------------------------------------------ stay */

export function stayRow(
  dest: Destination,
  window: TripWindow,
  partySize: PartySize,
  now = new Date(),
): TripRow {
  const rooms = roomsFor(partySize);
  const cached = getQuote(dest.slug, window.id, 'stays');
  const cheapest = cached?.stays.find((s) => s.totalRateUsd !== null) ?? null;

  if (cached && cheapest && cheapest.totalRateUsd !== null) {
    const line: CostLine = {
      label: `${cheapest.name}, ${window.nights} nights`,
      provider: cached.provider,
      amount: cheapest.totalRateUsd,
      unit: 'per-room-stay',
      basis: 'quoted',
      source: cheapest.link ?? cached.query,
      checkedOn: cached.fetchedAt,
      note: cached.basis,
    };
    return {
      kind: 'stay',
      title: cheapest.name,
      detail: [
        `${rooms} ${rooms === 1 ? 'room' : 'rooms'}, ${window.nights} nights`,
        cheapest.rating ? `${cheapest.type}, rated ${cheapest.rating}` : cheapest.type,
      ],
      lines: [line],
      perPersonTotal: perPerson(line, partySize, window.nights, rooms),
      available: true,
      basis: 'quoted',
      checkedLabel: freshness(cached.fetchedAt, now).label,
      bookingLink: cheapest.link,
    };
  }

  /* No warm entry for this destination and window. Surface 3 must never show an empty row, so
     the seeded fallback stands in and says so — a figure the reader can see is seeded beats a
     blank where a price should be. A warm run replaces this with a quoted line. */
  const line: CostLine = {
    label: `${window.nights} nights, ${partySize} ${partySize === 1 ? 'person' : 'people'}`,
    provider: 'Collected by hand, not yet quoted',
    amount: dest.seededStayTotals[partySize - 1],
    unit: 'per-party',
    basis: 'seeded',
    source: `https://www.google.com/travel/hotels/${encodeURIComponent(dest.hotelQuery)}`,
    checkedOn: '2026-09-16',
  };
  return {
    kind: 'stay',
    title: `Beds in ${dest.hotelQuery.split(',')[0]}`,
    detail: [
      `${rooms} ${rooms === 1 ? 'room' : 'rooms'}, ${window.nights} nights`,
      'Not yet priced for these dates',
    ],
    lines: [line],
    perPersonTotal: perPerson(line, partySize, window.nights),
    available: true,
    basis: 'seeded',
    checkedLabel: null,
  };
}

/* ------------------------------------------------------------------ travel */

function fuelLine(dest: Destination): CostLine {
  const fuel = fuelBasis();
  return {
    label: `Fuel, ${dest.drive.roundTripMiles} miles round trip`,
    provider: fuel.provider,
    amount: Math.round(dest.drive.roundTripMiles * fuel.usdPerMile),
    unit: 'per-party',
    basis: fuel.basis,
    source: fuel.source,
    checkedOn: fuel.checkedOn,
    note: 'The state average. The mileage is routed approximately.',
  };
}

interface TravelOption {
  id: 'drive' | 'transit';
  row: TripRow;
}

function driveOption(dest: Destination, window: TripWindow, partySize: PartySize): TravelOption {
  const line = fuelLine(dest);
  return {
    id: 'drive',
    row: {
      kind: 'travel',
      title: `Drive to ${dest.name}`,
      detail: [dest.drive.time, `${dest.drive.roundTripMiles} miles there and back`],
      lines: [line],
      perPersonTotal: perPerson(line, partySize, window.nights),
      available: true,
      basis: line.basis,
      checkedLabel: null,
      hoursEachWay: dest.drive.hoursEachWay,
      hoursNote: dest.drive.hoursNote,
    },
  };
}

function transitOption(
  dest: Destination,
  window: TripWindow,
  partySize: PartySize,
  now: Date,
): TravelOption | null {
  if (!dest.transit) return null;

  /* A flight has a real quote in the cache; a train does not, because SerpApi has no engine for
     one. So the same row is `quoted` for San Francisco and `seeded` for San Diego, and says so. */
  const cached = dest.airport ? getQuote(dest.slug, window.id, 'flights') : null;
  const cheapest = cached?.flights[0] ?? null;

  const fare: CostLine =
    cached && cheapest
      ? {
          label: `Return flight, ${cached.originAirport} to ${cached.destinationAirport}`,
          provider: `${cheapest.airline}, via ${cached.provider}`,
          amount: cheapest.perPersonUsd,
          unit: 'per-person',
          basis: 'quoted',
          source: cheapest.bookingLink ?? dest.transit.fare.source,
          checkedOn: cached.fetchedAt,
          note: cached.basis,
        }
      : dest.transit.fare;

  const lines = [fare, ...(dest.transit.local ? [dest.transit.local] : [])];

  return {
    id: 'transit',
    row: {
      kind: 'travel',
      title: dest.transit.label,
      detail: [
        `${formatHours(dest.transit.hoursEachWay)} each way, door to door`,
        dest.transit.local ? dest.transit.local.label : dest.transit.journeyTime,
      ],
      lines,
      perPersonTotal: lines.reduce((sum, l) => sum + perPerson(l, partySize, window.nights), 0),
      available: true,
      basis: weakestBasis(lines),
      checkedLabel: cached ? freshness(cached.fetchedAt, now).label : null,
      bookingLink: cheapest?.bookingLink,
      hoursEachWay: dest.transit.hoursEachWay,
      hoursNote: dest.transit.hoursNote,
    },
  };
}

/* ------------------------------------------------------------------ car */

export function carRow(
  dest: Destination,
  window: TripWindow,
  partySize: PartySize,
  driver: Driver,
): TripRow {
  const rules = carRules();
  const rate = compactRate();

  const blockedReason = !driver.hasLicence
    ? 'Nobody in the group has a driving licence, so a hire is not an option.'
    : driver.ageBand === 'under-21'
      ? rules.note
      : undefined;

  const canHire = driver.hasLicence && driver.ageBand !== null && driver.ageBand !== 'under-21';

  const lines: CostLine[] = [rate];
  /* The surcharge goes in the headline, not a footnote. It is the single cost other travel sites
     hide from exactly this cohort, and it is often larger than the saving they came for. */
  if (driver.ageBand === '21-24') lines.push(rules.youngDriverFee);
  if (dest.parkingPerNight) lines.push(dest.parkingPerNight);

  const days = window.nights + 1;

  return {
    kind: 'car',
    title: canHire ? `${rate.provider}, ${days} days` : 'No hire available',
    detail: canHire
      ? [
          driver.ageBand === '21-24'
            ? `Includes the ${money(rules.youngDriverFee.amount)}/day under-25 fee`
            : 'No young-driver fee at 25 or over',
          dest.parkingPerNight ? `Plus ${money(dest.parkingPerNight.amount)}/night to park it` : `${days} hire days for ${window.nights} nights`,
        ]
      : [blockedReason ?? '', ''],
    lines: canHire ? lines : [],
    perPersonTotal: canHire
      ? lines.reduce((sum, l) => sum + perPerson(l, partySize, window.nights), 0)
      : 0,
    available: canHire,
    blockedReason: canHire ? undefined : blockedReason,
    basis: canHire ? weakestBasis(lines) : 'published',
    checkedLabel: null,
  };
}

/* ------------------------------------------------------------------ the whole thing */

/** A complete way of doing the trip: how you get there, and what the car costs under it. */
export interface TravelChoice {
  id: 'drive' | 'transit';
  /** The full name, for a heading: "Fly LAX to SFO". */
  label: string;
  /**
   * The name as it reads mid-sentence: "flying", "the train", "driving".
   *
   * Not `label.toLowerCase()`, which turns "Fly LAX to SFO" into "fly lax to sfo" and makes the
   * airport codes look like a typo.
   */
  shortLabel: string;
  travel: TripRow;
  car: TripRow;
  /** Travel plus car, per person. The stay and the fees are the same either way. */
  perPersonTotal: number;
  hoursEachWay: number;
}

export interface TripQuote {
  destination: Destination;
  window: TripWindow;
  partySize: PartySize;
  driver: Driver;
  rooms: number;
  /** Travel, stay, car — in the order the build canvas shows them. Always three. */
  rows: [TripRow, TripRow, TripRow];
  fees: { lines: CostLine[]; perPersonTotal: number };
  /** Null when this group cannot reach this destination at all. */
  perPersonTotal: number | null;
  partyTotal: number | null;
  /** The claim the whole total can make. */
  basis: Basis;
  /** The other way in, when there is one. The build canvas offers it behind Change. */
  alternative: TravelChoice | null;
  /**
   * True when neither option wins on both money and time, so there is a real trade and the
   * person going should make it rather than us.
   */
  closeCall: boolean;
  /** What the numbers say, with the numbers in it. A question when it is a close call. */
  verdict: string;
  /** The researched editorial view, which the arithmetic does not always share. */
  writtenVerdict: string;
  reachable: boolean;
}

const SHORT_LABEL: Record<TransitRoute['mode'], string> = {
  plane: 'flying',
  train: 'the train',
  coach: 'the coach',
};

/** Sentence case for a label that has to start a clause. */
function opening(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** The opposite, for a reason that has to follow a colon. Leaves acronyms alone. */
function continuing(text: string): string {
  return /^[A-Z][a-z]/.test(text) ? text.charAt(0).toLowerCase() + text.slice(1) : text;
}

function noCarRow(dest: Destination): TripRow {
  return {
    kind: 'car',
    title: 'No car needed',
    detail: [`${dest.drive.verdict.split('.')[0]}.`, 'Nothing to hire, nothing to park.'],
    lines: [],
    perPersonTotal: 0,
    available: true,
    basis: 'published',
    checkedLabel: null,
  };
}

export function quoteTrip(
  dest: Destination,
  window: TripWindow,
  partySize: PartySize,
  driver: Driver,
  now = new Date(),
): TripQuote {
  const rooms = roomsFor(partySize);
  const canHire = driver.hasLicence && driver.ageBand !== null && driver.ageBand !== 'under-21';

  const stay = stayRow(dest, window, partySize, now);
  const feeLines = dest.fees.filter((f) => f.amount > 0);
  const fees = {
    lines: feeLines,
    perPersonTotal: feeLines.reduce((sum, l) => sum + perPerson(l, partySize, window.nights), 0),
  };

  const hire = carRow(dest, window, partySize, driver);

  /* Driving costs the fuel AND the vehicle, so the comparison counts both or it flatters the
     car. The hire and the parking are most of it, and the parking is the whole argument in
     San Francisco. */
  const driveRow = driveOption(dest, window, partySize).row;
  const drive: TravelChoice | null = canHire
    ? {
        id: 'drive',
        label: 'Driving',
        shortLabel: 'driving',
        travel: driveRow,
        car: hire,
        perPersonTotal: driveRow.perPersonTotal + hire.perPersonTotal,
        hoursEachWay: dest.drive.hoursEachWay,
      }
    : null;

  const transitOpt = transitOption(dest, window, partySize, now);
  const transit: TravelChoice | null =
    transitOpt && dest.transit
      ? {
          id: 'transit',
          label: dest.transit.label,
          shortLabel: SHORT_LABEL[dest.transit.mode],
          travel: transitOpt.row,
          car: noCarRow(dest),
          perPersonTotal: transitOpt.row.perPersonTotal,
          hoursEachWay: dest.transit.hoursEachWay,
        }
      : null;

  /* ---------------------------------------------------------------- the decision
   *
   * No price is put on an hour. Any figure for that would be invented, and this product does not
   * put invented numbers next to real ones — that is the whole of its claim.
   *
   * So: if one option is cheaper AND no slower, it wins outright and we say so plainly. If each
   * wins on one axis there is a genuine trade between money and a Friday afternoon, and the
   * person going is better placed to settle it than we are. Some people will spend six hours in
   * a car to save fifty dollars and some will not, and neither of them is wrong. We state both
   * sides and let them pick.
   *
   * The pre-filled default when it is close is the cheaper one, because cost is what this
   * product is for, and because Surface 3 must never open on an empty row.
   */
  let chosen: TravelChoice | null;
  let alternative: TravelChoice | null = null;
  let closeCall = false;

  if (drive && transit) {
    const driveCheaper = drive.perPersonTotal <= transit.perPersonTotal;
    const driveFaster = drive.hoursEachWay <= transit.hoursEachWay;
    closeCall = driveCheaper !== driveFaster;
    chosen = driveCheaper ? drive : transit;
    alternative = driveCheaper ? transit : drive;
  } else {
    chosen = drive ?? transit;
  }

  const reachable = chosen !== null;

  const rows: [TripRow, TripRow, TripRow] = reachable
    ? [chosen!.travel, stay, chosen!.car]
    : [
        {
          kind: 'travel',
          title: 'No way in for this group',
          detail: [hire.blockedReason ?? 'Nobody in the group has a licence.', ''],
          lines: [],
          perPersonTotal: 0,
          available: false,
          blockedReason: hire.blockedReason,
          basis: 'published',
          checkedLabel: null,
        },
        stay,
        hire,
      ];

  const perPersonTotal = reachable
    ? chosen!.perPersonTotal + stay.perPersonTotal + fees.perPersonTotal
    : null;

  return {
    destination: dest,
    window,
    partySize,
    driver,
    rooms,
    rows,
    fees,
    perPersonTotal,
    partyTotal: perPersonTotal === null ? null : perPersonTotal * partySize,
    basis: weakestBasis([...rows.flatMap((r) => r.lines), ...fees.lines]),
    alternative,
    closeCall,
    verdict: buildVerdict(dest, chosen, alternative, closeCall, hire, partySize),
    writtenVerdict: dest.drive.verdict,
    reachable,
  };
}

function buildVerdict(
  dest: Destination,
  chosen: TravelChoice | null,
  alternative: TravelChoice | null,
  closeCall: boolean,
  hire: TripRow,
  partySize: PartySize,
): string {
  if (!chosen) {
    return `${dest.name} has no realistic way in without a car, and this group cannot hire one. ${hire.blockedReason ?? ''}`.trim();
  }

  if (!alternative) {
    return chosen.id === 'drive'
      ? dest.drive.verdict
      : `${chosen.label} is the way in: ${continuing(hire.blockedReason ?? '')}`;
  }

  const moneyGap = Math.abs(chosen.perPersonTotal - alternative.perPersonTotal);
  const hoursGap = Math.abs(chosen.hoursEachWay - alternative.hoursEachWay);

  if (closeCall) {
    return (
      `Your call. ${opening(chosen.shortLabel)} saves ${money(moneyGap)} a head; ` +
      `${alternative.shortLabel} saves ${formatHours(hoursGap)} each way, ` +
      `${formatHours(hoursGap * 2)} across the weekend.`
    );
  }

  if (moneyGap < 1) {
    return `${opening(chosen.shortLabel)} and ${alternative.shortLabel} cost about the same a head, and ${chosen.shortLabel} is ${formatHours(hoursGap)} shorter each way.`;
  }

  return hoursGap < 0.25
    ? `${opening(chosen.shortLabel)} is ${money(moneyGap)} a head cheaper split ${partySize} ways, and takes about as long. There is nothing to weigh up.`
    : `${opening(chosen.shortLabel)} is ${money(moneyGap)} a head cheaper split ${partySize} ways and ${formatHours(hoursGap)} shorter each way. There is nothing to weigh up.`;
}

/** `$1,240`. Whole dollars — this app never shows cents, and never shows a range. */
export { money };
