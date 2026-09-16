/**
 * The MVP model.
 *
 * Small, pure and synchronous. There is no fetching anywhere in here — every figure is authored
 * in `data.ts` with a provider, a source URL and a check date, and the app states it plainly.
 *
 * Which figures were read off a primary source and which were authored for the MVP is recorded in
 * `docs/research/mvp/` rather than in this type. There was a `verified` flag here and it came out:
 * a caveat the interface has to keep explaining is worse on screen than a number with a link the
 * reader can follow. When live lookups return, provenance comes back through the ledger in
 * `lib/pricing/ledger.ts`, which is where it belongs.
 *
 * The one thing this file must get right is the `unit` on every cost line. A per-vehicle cost
 * divided by party size and a per-person cost left alone produce very different answers, and the
 * difference is the entire reason the party-size filter is worth having.
 */

/* ------------------------------------------------------------------ primitives */

export type Unit =
  /** Charged once per traveller. Park entry on foot, a train ticket, a museum. */
  | 'per-person'
  /** Charged once for the vehicle, whatever is in it. Park entry by car. Splits by party size. */
  | 'per-vehicle'
  /** Charged per day for the vehicle. Hire rate, the young-driver fee, parking. Splits. */
  | 'per-vehicle-day'
  /** Charged once for the whole group regardless of size. Splits by party size. */
  | 'per-party'
  /** Already a whole-stay total for this party size. Used by the looked-up hotel figures. */
  | 'per-stay';

export interface CostLine {
  label: string;
  /** The named operator. "Zion National Park", "Enterprise", "Amtrak Pacific Surfliner". */
  provider: string;
  amount: number;
  unit: Unit;
  /** Where the figure came from. Rendered as an outbound link. */
  source: string;
  /** ISO date the figure was read off that page. */
  checkedOn: string;
  note?: string;
}

export const WEEKENDS = [
  {
    id: 'oct-3',
    startDate: '2026-10-02',
    endDate: '2026-10-04',
    label: '2–4 October',
    nights: 2,
  },
  {
    id: 'oct-10',
    startDate: '2026-10-09',
    endDate: '2026-10-11',
    label: '9–11 October',
    nights: 2,
  },
] as const;

export type WeekendId = (typeof WEEKENDS)[number]['id'];
export type Weekend = (typeof WEEKENDS)[number];

export const PARTY_SIZES = [1, 2, 3, 4, 5] as const;
export type PartySize = (typeof PARTY_SIZES)[number];

/**
 * What the survey learns about driving.
 *
 * Two questions rather than one, because "the age of whoever holds a licence" has no answer when
 * nobody holds one — and in this cohort that is the common case, not the edge case.
 */
export type AgeBand = 'under-21' | '21-24' | '25-plus';

export interface Driver {
  hasLicence: boolean;
  /** Null when nobody has a licence. */
  ageBand: AgeBand | null;
}

export const AGE_BAND_LABELS: Record<AgeBand, string> = {
  'under-21': 'Under 21',
  '21-24': '21 to 24',
  '25-plus': '25 or over',
};

/* ------------------------------------------------------------------ destinations */

export interface ItineraryItem {
  title: string;
  /** Tracked-out caps label for the design. 1–3 words. */
  eyebrow: string;
  what: string;
  /** Human cost string, e.g. "Free, beyond park entry" or "$6 per application". */
  cost: string;
  costSource: string;
  needsCar: boolean;
  timeNeeded: string;
  /** Required. The honest sentence about what goes wrong. */
  catch: string;
  photo: string;
}

export interface TransitRoute {
  mode: 'train' | 'plane' | 'coach';
  /** "Amtrak Pacific Surfliner", "LAX to SFO". */
  label: string;
  /** The long-haul leg, per person. */
  fare: CostLine;
  /** Getting around once you are there, per person. */
  local?: CostLine;
  journeyTime: string;
}

export interface Destination {
  slug: string;
  name: string;
  region: string;
  /** One line: why go, never what it is. */
  hook: string;
  eyebrow: string;
  heroPhoto: string;
  driveMiles: number;
  driveTime: string;
  /** What early October is actually like there. */
  whyOctober: string;

  /** Entry and unavoidable on-the-ground costs. Park fees, the non-resident surcharge. */
  entry: CostLine[];

  /** The driving option. Every destination has one; not every destination should use it. */
  car: {
    dayRate: CostLine;
    youngDriverFee: CostLine;
    fuel: CostLine;
    parkingPerNight?: CostLine;
    /** Stated on the detail page when driving is the wrong call. */
    verdict: string;
  };

  /** Null when there is no viable way to get there without a car. */
  transit: TransitRoute | null;

  /** Whole-stay totals, already inclusive of however many rooms that party needs. */
  stay: {
    provider: string;
    source: string;
    checkedOn: string;
    /** Keyed by weekend, then indexed by party size − 1. */
    totals: Record<WeekendId, readonly [number, number, number, number, number]>;
  };

  itinerary: ItineraryItem[];
}

/* ------------------------------------------------------------------ the arithmetic */

/** Reduce one line to what it costs each person, given the group and the length of stay. */
export function perPerson(line: CostLine, partySize: PartySize, nights: number): number {
  switch (line.unit) {
    case 'per-person':
      return line.amount;
    case 'per-vehicle':
    case 'per-party':
      return line.amount / partySize;
    case 'per-vehicle-day':
      // A Friday-to-Sunday weekend is three hire days for two nights.
      return (line.amount * (nights + 1)) / partySize;
    case 'per-stay':
      return line.amount / partySize;
  }
}

export interface Priced {
  lines: CostLine[];
  perPersonTotal: number;
  partyTotal: number;
}

function price(lines: CostLine[], partySize: PartySize, nights: number): Priced {
  const perPersonTotal = lines.reduce((sum, l) => sum + perPerson(l, partySize, nights), 0);
  return { lines, perPersonTotal, partyTotal: perPersonTotal * partySize };
}

/** The hotel or campground line for this weekend and party size, as a whole-stay total. */
export function stayLine(dest: Destination, weekend: Weekend, partySize: PartySize): CostLine {
  return {
    label: `${weekend.nights} nights, ${partySize} ${partySize === 1 ? 'person' : 'people'}`,
    provider: dest.stay.provider,
    amount: dest.stay.totals[weekend.id][partySize - 1],
    unit: 'per-stay',
    source: dest.stay.source,
    checkedOn: dest.stay.checkedOn,
  };
}

/* ------------------------------------------------------------------ the travel verdict */

export type TravelModeId = 'car' | 'transit';

export interface TravelOption {
  id: TravelModeId;
  label: string;
  available: boolean;
  /** Why not, when unavailable. Shown to the user verbatim. */
  blockedReason?: string;
  priced: Priced;
}

export interface Verdict {
  car: TravelOption;
  transit: TravelOption | null;
  /** Null when neither option is available to this group. */
  recommended: TravelModeId | null;
  /** One sentence naming the actual reason, with the numbers in it. */
  reason: string;
  /** Per-person difference between the two, when both are available. */
  delta: number | null;
}

/**
 * Whether to hire a car, and what it costs either way.
 *
 * This is a price comparison as well as an age question. Age decides whether a hire is possible
 * at all and what surcharge it carries; the comparison against the train or the flight decides
 * whether it is worth doing. The two answers come apart often — San Diego by train beats driving
 * at every party size, and the gap the other way at Zion is not close.
 */
export function decideTravel(
  dest: Destination,
  weekend: Weekend,
  partySize: PartySize,
  driver: Driver,
): Verdict {
  const nights = weekend.nights;

  const carLines: CostLine[] = [dest.car.dayRate, dest.car.fuel];
  if (driver.ageBand === '21-24') carLines.push(dest.car.youngDriverFee);
  if (dest.car.parkingPerNight) carLines.push(dest.car.parkingPerNight);

  const canHire = driver.hasLicence && driver.ageBand !== null && driver.ageBand !== 'under-21';

  const car: TravelOption = {
    id: 'car',
    label: 'Hire a car',
    available: canHire,
    blockedReason: !driver.hasLicence
      ? 'Nobody in the group has a driving licence, so a hire is not an option.'
      : driver.ageBand === 'under-21'
        ? 'No major agency in California rents to under-21s. Enterprise and Avis both set the floor at 21, and only Hertz will consider a 20-year-old.'
        : undefined,
    priced: price(carLines, partySize, nights),
  };

  const transit: TravelOption | null = dest.transit
    ? {
        id: 'transit',
        label: dest.transit.label,
        available: true,
        priced: price(
          [dest.transit.fare, ...(dest.transit.local ? [dest.transit.local] : [])],
          partySize,
          nights,
        ),
      }
    : null;

  /* Neither works: a car-only destination and a group who cannot hire one. The app says so
     plainly rather than quoting a number nobody can act on. */
  if (!car.available && !transit) {
    return {
      car,
      transit,
      recommended: null,
      reason: `${dest.name} has no realistic way in without a car, and this group cannot hire one. ${car.blockedReason ?? ''}`.trim(),
      delta: null,
    };
  }

  if (!car.available && transit) {
    return {
      car,
      transit,
      recommended: 'transit',
      reason: `${dest.transit!.label} is the way in — ${car.blockedReason}`,
      delta: null,
    };
  }

  if (car.available && !transit) {
    return {
      car,
      transit,
      recommended: 'car',
      reason: dest.car.verdict,
      delta: null,
    };
  }

  const carPer = car.priced.perPersonTotal;
  const transitPer = transit!.priced.perPersonTotal;
  const delta = Math.abs(carPer - transitPer);
  const carWins = carPer < transitPer;

  return {
    car,
    transit,
    recommended: carWins ? 'car' : 'transit',
    reason: carWins
      ? `Split ${partySize} ways the car comes out $${Math.round(delta)} a head cheaper than ${dest.transit!.label.toLowerCase()}, and it goes where the timetable does not.`
      : `${dest.transit!.label} is $${Math.round(delta)} a head cheaper than driving once the hire, the fuel and the parking are counted — and you arrive without a car to put anywhere.`,
    delta,
  };
}

/** The whole trip, per person, for the recommended mode. */
export function quoteTrip(
  dest: Destination,
  weekend: Weekend,
  partySize: PartySize,
  driver: Driver,
): {
  verdict: Verdict;
  entry: Priced;
  stay: Priced;
  /** Null when the group cannot reach the destination at all. */
  perPersonTotal: number | null;
} {
  const verdict = decideTravel(dest, weekend, partySize, driver);
  const entry = price(dest.entry, partySize, weekend.nights);
  const stay = price([stayLine(dest, weekend, partySize)], partySize, weekend.nights);

  const travel =
    verdict.recommended === 'car'
      ? verdict.car.priced
      : verdict.recommended === 'transit'
        ? verdict.transit!.priced
        : null;

  return {
    verdict,
    entry,
    stay,
    perPersonTotal: travel
      ? entry.perPersonTotal + stay.perPersonTotal + travel.perPersonTotal
      : null,
  };
}

/** `$1,240`. Whole dollars — this app never shows cents, and never shows a range. */
export function money(value: number): string {
  return `$${Math.round(value).toLocaleString('en-US')}`;
}
