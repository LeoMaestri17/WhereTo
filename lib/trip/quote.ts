import { freshness, getQuote } from '@/lib/cache/quotes';
import { carRules, compactRate, fuelBasis, type TripWindow } from './catalogue';
import type { Basis, CostLine, Destination, Driver, PartySize } from './types';

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
}

function money(value: number): string {
  return `$${Math.round(value).toLocaleString('en-US')}`;
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
        dest.transit.journeyTime,
        dest.transit.local ? dest.transit.local.label : 'Long-haul leg only',
      ],
      lines,
      perPersonTotal: lines.reduce((sum, l) => sum + perPerson(l, partySize, window.nights), 0),
      available: true,
      basis: weakestBasis(lines),
      checkedLabel: cached ? freshness(cached.fetchedAt, now).label : null,
      bookingLink: cheapest?.bookingLink,
    },
  };
}

/* ------------------------------------------------------------------ car */

export function carRow(
  dest: Destination,
  window: TripWindow,
  partySize: PartySize,
  driver: Driver,
  needed: boolean,
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
  /** Why driving or not driving, with the numbers in it. */
  verdict: string;
  reachable: boolean;
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

  const drive = driveOption(dest, window, partySize);
  const transit = transitOption(dest, window, partySize, now);
  const stay = stayRow(dest, window, partySize, now);

  const feeLines = dest.fees.filter((f) => f.amount > 0);
  const fees = {
    lines: feeLines,
    perPersonTotal: feeLines.reduce((sum, l) => sum + perPerson(l, partySize, window.nights), 0),
  };

  /* Driving costs the fuel AND the vehicle, so the comparison has to count both or it flatters
     the car. This is the line that decides San Diego and San Francisco. */
  const hire = carRow(dest, window, partySize, driver, true);
  const driveTotal = canHire ? drive.row.perPersonTotal + hire.perPersonTotal : Infinity;
  const transitTotal = transit ? transit.row.perPersonTotal : Infinity;

  const useTransit = transitTotal < driveTotal;
  const reachable = Number.isFinite(Math.min(driveTotal, transitTotal));

  const travelRow = useTransit && transit ? transit.row : drive.row;
  const carNeeded = !useTransit;

  const car: TripRow = carNeeded
    ? hire
    : {
        ...carRow(dest, window, partySize, driver, false),
        title: 'No car needed',
        detail: [dest.drive.verdict.split('.')[0] + '.', ''],
        lines: [],
        perPersonTotal: 0,
        available: true,
        blockedReason: undefined,
      };

  const delta = Math.abs(driveTotal - transitTotal);
  const verdict = !reachable
    ? `${dest.name} has no realistic way in without a car, and this group cannot hire one. ${hire.blockedReason ?? ''}`.trim()
    : !transit
      ? dest.drive.verdict
      : !canHire
        ? `${dest.transit!.label} is the way in — ${hire.blockedReason}`
        : useTransit
          ? `${dest.transit!.label} is ${money(delta)} a head cheaper than driving once the hire, the fuel and the parking are counted — and you arrive without a car to put anywhere.`
          : `Split ${partySize} ways the car comes out ${money(delta)} a head cheaper than ${dest.transit!.label.toLowerCase()}, and it goes where the timetable does not.`;

  const rows: [TripRow, TripRow, TripRow] = [travelRow, stay, car];

  const perPersonTotal = reachable
    ? travelRow.perPersonTotal + stay.perPersonTotal + car.perPersonTotal + fees.perPersonTotal
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
    verdict,
    reachable,
  };
}

/** `$1,240`. Whole dollars — this app never shows cents, and never shows a range. */
export { money };
