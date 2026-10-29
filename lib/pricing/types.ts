/**
 * The pricing layer.
 *
 * Everything in here exists to stop the model inventing numbers. A price that comes back from
 * one of these sources is a real quote, for real dates, at a real occupancy, and it carries a
 * link that the provider itself returned. Anything the model writes without one of these behind
 * it is an estimate, and the UI says so.
 */

/** Where a number actually came from. Rendered on every costed line. */
export type PriceOrigin =
  /** A real request to a pricing API returned this figure. */
  | 'api'
  /** The model found it by searching the web. Real, but not a quote for these exact dates. */
  | 'web'
  /** Nobody checked. A reasoned guess, and the loudest label of the three. */
  | 'estimate';

export interface PriceProvenance {
  source: PriceOrigin;
  /** 'Google Hotels', 'Google Flights', 'Recreation.gov', 'Web search', 'Saved plan'. */
  sourceLabel: string;
  /** ISO datetime the underlying lookup actually ran. */
  checkedAt: string;
  /** Set when the answer came from our cache rather than a fresh call. */
  cachedAt?: string;
  /**
   * The ledger entry this claim rests on. The model supplies it; the server verifies it and
   * downgrades the line to `estimate` if it does not match. See lib/pricing/ledger.ts.
   */
  sourceRef?: string;
}

/* ------------------------------------------------------------------ quotes */

export interface FlightLeg {
  airline: string;
  flightNumber: string;
  departAirport: string;
  arriveAirport: string;
  departTime: string;
  arriveTime: string;
  durationMinutes: number;
}

export interface FlightQuote {
  legs: FlightLeg[];
  stops: number;
  /** What Google charges for the WHOLE party. Not per person — that trap is why both exist. */
  totalPriceUsd: number;
  /** totalPriceUsd divided by the party size actually searched for. */
  perPersonUsd: number;
  /** Google's own booking link for this itinerary, when it gives one. */
  bookingLink?: string;
  carbonKg?: number;
}

export interface FlightResult {
  resultId: string;
  checkedAt: string;
  origin: string;
  destination: string;
  outboundDate: string;
  returnDate?: string;
  adults: number;
  flights: FlightQuote[];
  priceInsights?: {
    lowestUsd: number | null;
    priceLevel: string | null;
    typicalRangeUsd: [number, number] | null;
  };
}

export interface HotelQuote {
  name: string;
  type: string;
  ratePerNightUsd: number | null;
  totalRateUsd: number | null;
  rating: number | null;
  reviews: number | null;
  amenities: string[];
  link?: string;
}

export interface HotelResult {
  resultId: string;
  checkedAt: string;
  query: string;
  checkInDate: string;
  checkOutDate: string;
  adults: number;
  /** How many of these rooms the group needs. Set by the caller, echoed for the basis line. */
  rooms: number;
  properties: HotelQuote[];
}

export interface CampgroundQuote {
  name: string;
  facilityId: string;
  reservable: boolean;
  feeDescription?: string;
  url?: string;
  phone?: string;
  /** Nights in the requested month with at least one site free, when availability was checked. */
  availableNights?: number;
}

export interface CampgroundResult {
  resultId: string;
  checkedAt: string;
  query: string;
  campgrounds: CampgroundQuote[];
}

/* ------------------------------------------------------------------ failure */

/**
 * Why a lookup could not answer. These are returned, never thrown — a research run that loses
 * one price source should carry on and label those lines `web`, not collapse.
 */
export type UnavailableReason =
  | 'no_api_key'
  | 'quota'
  | 'run_budget'
  | 'timeout'
  | 'bad_request'
  | 'upstream_error'
  /** Fixture mode, and nothing recorded for this query. Never escalates to a live call. */
  | 'no_fixture';

export interface Unavailable {
  unavailable: UnavailableReason;
  detail: string;
  /** Told to the model verbatim, so it knows what to do instead. */
  fallback: string;
}

export type PriceLookup<T> = T | Unavailable;

export function isUnavailable<T>(value: PriceLookup<T>): value is Unavailable {
  return typeof value === 'object' && value !== null && 'unavailable' in value;
}

export function unavailable(reason: UnavailableReason, detail: string): Unavailable {
  return {
    unavailable: reason,
    detail,
    fallback:
      'Use web_search to find this price instead, and label that line "web" rather than "api".',
  };
}

/* ------------------------------------------------------------------ capability */

/**
 * What pricing is actually available on this run. Goes into the research prompt so the model
 * knows what it can rely on, and into the UI so the user does.
 */
export interface PricingCapability {
  flights: boolean;
  hotels: boolean;
  campgrounds: boolean;
  /** Human-readable, shown to the user when something is missing. */
  note: string;
}
