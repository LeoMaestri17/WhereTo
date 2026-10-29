/**
 * The trip data model.
 *
 * One rule governs this file, and it is the product: **every figure says where it came from.**
 * `source` is the answer, and it is not optional — a price without one cannot be constructed,
 * which is the point. Three values:
 *
 *   api       a provider answered for these exact dates and this exact occupancy. From the warm
 *             cache, carrying the datetime it was fetched. This is the claim the product makes.
 *   operator  read off the operator's own page — a park fee, a published surcharge, a state fuel
 *             average. Real and checkable, but a rate card rather than a quote for your weekend.
 *   authored  our own estimate, collected by hand. The hire rates and the stay fallbacks.
 *
 * There was a boolean `verified` here once and it was removed for a good reason: a caveat the
 * interface must keep explaining teaches people to stop reading it. Three words on three kinds of
 * line is different from a warning on all of them, and the distinction is the one the reader
 * actually needs — "is this my price, or a price?".
 *
 * `url` is where to go and check. `source` is how much to trust it before you do.
 *
 * The other thing this file must get right is `unit`. A per-vehicle cost divided by party size
 * and a per-person cost left alone give very different answers, and that difference is the whole
 * reason the group-size control earns its place.
 */

export type Unit =
  /** Charged once per traveller. Park entry on foot, a train ticket, a museum. */
  | 'per-person'
  /** Charged once for the vehicle, whatever is in it. Park entry by car. Splits by party size. */
  | 'per-vehicle'
  /** Charged per day for the vehicle. Hire rate, the young-driver fee, parking. Splits. */
  | 'per-vehicle-day'
  /** Charged once for the whole group regardless of size. Splits by party size. */
  | 'per-party'
  /** Already a whole-stay total for one room. Multiplied by rooms, then split. */
  | 'per-room-stay';

export type PriceSource = 'api' | 'operator' | 'authored';

export interface CostLine {
  label: string;
  /** The named operator. "Zion National Park", "Enterprise", "Amtrak Pacific Surfliner". */
  provider: string;
  amount: number;
  unit: Unit;
  source: PriceSource;
  /** The page a reader can go and check it on. Rendered as an outbound link. */
  url: string;
  /** ISO date or datetime the figure was read or fetched. */
  checkedOn: string;
  note?: string;
}

/* ------------------------------------------------------------------ the group */

export const PARTY_SIZES = [1, 2, 3, 4, 5] as const;
export type PartySize = (typeof PARTY_SIZES)[number];

/**
 * What the control strip learns about driving.
 *
 * Two facts rather than one, because "the age of whoever holds a licence" has no answer when
 * nobody holds one — and in this cohort that is the common case, not the edge case.
 */
export type AgeBand = 'under-21' | '21-24' | '25-plus';

export interface Driver {
  hasLicence: boolean;
  /** Null when nobody in the group has a licence. */
  ageBand: AgeBand | null;
}

export const AGE_BAND_LABELS: Record<AgeBand, string> = {
  'under-21': 'Under 21',
  '21-24': '21 to 24',
  '25-plus': '25 or over',
};

/* ------------------------------------------------------------------ destinations */

/**
 * A photograph from Unsplash, stored rather than fetched.
 *
 * Unsplash's terms require the photographer to be credited with a link back, and require those
 * links to carry the referral parameters — so the author's profile URL is stored with them
 * already attached rather than assembled at render time, where it would eventually get dropped
 * by someone tidying up a component.
 */
export type Tone = 'peri' | 'coral' | 'sage' | 'butter' | 'rose' | 'peach' | 'sky';

export interface DestinationPhoto {
  /** The CDN URL, already sized. Served by Unsplash, never by us. */
  url: string;
  /** Their photo id, so a picture can be replaced deliberately rather than by re-rolling a search. */
  id: string;
  author: string;
  /** Profile link, referral parameters included, as their terms require. */
  authorUrl: string;
  /** The photographer's own description, used as alt text when there is one. */
  alt: string;
  fetchedAt: string;
}

export interface ItineraryItem {
  title: string;
  /** Tracked-out caps label. One to three words. */
  eyebrow: string;
  what: string;
  /** Human cost string: "Free, beyond park entry", "$6 per application". */
  cost: string;
  costSource: string;
  needsCar: boolean;
  timeNeeded: string;
  /** Required. The honest sentence about what goes wrong. */
  catch: string;
}

export interface TransitRoute {
  mode: 'train' | 'plane' | 'coach';
  /** "Amtrak Pacific Surfliner", "Fly LAX to SFO". */
  label: string;
  /** The headline leg, as the operator sells it. Never used for the comparison. */
  journeyTime: string;
  /** Door to door from campus. See the note on `Destination['drive'].hoursEachWay`. */
  hoursEachWay: number;
  hoursNote: string;
  /** The long-haul leg, per person. */
  fare: CostLine;
  /** Getting around once you are there, per person. */
  local?: CostLine;
}

/**
 * The model-written half of a destination record.
 *
 * Filled by `npm run generate-content` at build time and committed. The running app never
 * regenerates it. Null until the script has run, and the interface renders the record without it
 * rather than waiting — none of this is load-bearing, which is the point of keeping it separate
 * from the costed data.
 */
export interface GeneratedContent {
  /** One line on what the place feels like. Not what it is. */
  vibe: string;
  /** Three or four short phrases. What you would actually tell a friend. */
  highlights: string[];
  /** "first trip", "no car", "under 21", "cheapest". Lower case, two or three words. */
  bestFor: string[];
  generatedAt: string;
  model: string;
}

export interface Destination {
  slug: string;
  name: string;
  region: string;
  /** "Utah · 430 miles". */
  eyebrow: string;
  /** One line: why go, never what it is. */
  hook: string;
  /** What early winter is actually like there. */
  whySeason: string;
  /**
   * Local artwork under /public, where we have our own.
   *
   * Only the first four destinations have this, and a photograph outranks it wherever one
   * exists. Missing file degrades to a palette gradient, never a grey box.
   */
  image: string | null;

  /**
   * The photograph, fetched once at catalogue build and committed.
   *
   * Null until `npm run fetch-photos` has run for this record. The running app never calls
   * Unsplash: it stores the CDN URL and serves from there, which is both free and what their
   * API terms ask for.
   */
  photo: DestinationPhoto | null;

  /** What to search Unsplash for. Specific enough that the top result is actually the place. */
  photoQuery: string;

  /** [longitude, latitude]. Geocoded once at catalogue build; drives the map pins. */
  coords?: [number, number];

  /**
   * The palette colour this destination carries.
   *
   * Red rock is rose, desert is sage, coast is sky. It tints the hover wash and the category
   * marker, so a board of twenty reads as twenty places rather than twenty cards with one
   * accent colour repeated. Presentation, but it belongs with the record: the alternative is a
   * lookup table in a component that nobody updates when a destination is added.
   */
  tone: Tone;
  /** The area string sent to Google Hotels by the warm script. */
  hotelQuery: string;
  /** Null when the trip is a drive, which is why most of these cost no flight searches. */
  airport: string | null;

  drive: {
    miles: number;
    roundTripMiles: number;
    time: string;
    /**
     * Door to door from campus, not the headline leg.
     *
     * A flight sold as "1h 25m in the air" is nothing like 1h 25m of your Friday, and comparing
     * that against a drive measured kerb to kerb is how every travel site makes flying look
     * better than it is. Both numbers here are the whole journey or neither is worth having.
     */
    hoursEachWay: number;
    /** How that figure is made up, so the reader can disagree with it. */
    hoursNote: string;
    /**
     * Where the mileage came from.
     *
     * 'routed' is a real road distance from a routing engine. 'authored' is our own estimate,
     * and the fuel figure derived from it is labelled accordingly rather than borrowing the AAA
     * price's credibility. A sourced price multiplied by a guessed distance is a guess.
     */
    distanceSource: 'routed' | 'authored';
    /** The editorial view, which the arithmetic does not always share. */
    verdict: string;
  };

  /** Entry and unavoidable on-the-ground costs. Park fees, the non-resident surcharge. */
  fees: CostLine[];

  /** Null when there is no viable way in without a car. */
  transit: TransitRoute | null;

  /** Overnight parking where a car costs you at the far end too. */
  parkingPerNight: CostLine | null;

  /**
   * The stay fallback, indexed by party size minus one, as a whole-party total.
   *
   * Used only when the warm cache has nothing for this destination and window. Surface 3 must
   * never show an empty row, and a `seeded` figure the reader can see is seeded beats a blank
   * where a price should be. A warm run replaces it with a `quoted` line.
   */
  seededStayTotals: [number, number, number, number, number];

  itinerary: ItineraryItem[];

  content: GeneratedContent | null;
}

/* ------------------------------------------------------------------ cars */

export interface Agency {
  name: string;
  minimumAge: number;
  url: string;
}

export interface CarRules {
  /** The lowest age any major agency in this city will rent to at all. */
  minimumAge: number;
  youngDriverFee: CostLine;
  /** Inclusive age range the fee applies to. */
  youngDriverAges: [number, number];
  agencies: Agency[];
  note: string;
}

export interface FuelRate {
  usdPerGallon: number;
  mpg: number;
  usdPerMile: number;
  provider: string;
  url: string;
  checkedOn: string;
  source: PriceSource;
}

export interface CarCatalogue {
  rules: Record<string, CarRules>;
  rates: Record<string, Record<string, CostLine>>;
  fuel: Record<string, FuelRate>;
}
