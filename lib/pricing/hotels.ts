import { randomUUID } from 'node:crypto';
import { TTL } from './cache';
import type { RunBudget } from './quota';
import { serpApiSearch } from './serpapi';
import {
  isUnavailable,
  unavailable,
  type HotelQuote,
  type HotelResult,
  type PriceLookup,
} from './types';

/**
 * Live accommodation prices via SerpApi's Google Hotels engine.
 *
 * This is the answer to "how do we actually find the hotel". We send the area, the real dates and
 * the real occupancy; we get back property names that are genuinely bookable for those nights,
 * with a nightly rate, a total, and the link Google itself returned. Vacation rentals come from
 * the same engine with one flag, which matters because a four-person group is often better off
 * in a whole flat than in two rooms.
 */

export interface HotelSearchArgs {
  /** An area, not an address: "Springdale, Utah", "Ocean Beach, San Diego". */
  query: string;
  checkInDate: string;
  checkOutDate: string;
  /** Adults per room, not the whole party — Google prices one room at a time. */
  adults: number;
  /** How many of that room the group needs. Used for the split, not sent upstream. */
  rooms: number;
  children?: number;
  maxPriceUsd?: number;
  minRating?: number;
  vacationRentals?: boolean;
  currency?: string;
}

const MAX_PROPERTIES = 8;

interface RawRate {
  lowest?: string;
  extracted_lowest?: number;
}

interface RawProperty {
  name?: string;
  type?: string;
  rate_per_night?: RawRate;
  total_rate?: RawRate;
  overall_rating?: number;
  reviews?: number;
  amenities?: string[];
  link?: string;
  serpapi_property_details_link?: string;
}

function toQuote(raw: RawProperty): HotelQuote | null {
  if (!raw.name) return null;
  const perNight = raw.rate_per_night?.extracted_lowest ?? null;
  const total = raw.total_rate?.extracted_lowest ?? null;
  // A property with no price is decoration — it cannot appear as a costed line.
  if (perNight === null && total === null) return null;

  return {
    name: raw.name,
    type: raw.type ?? 'hotel',
    ratePerNightUsd: perNight,
    totalRateUsd: total,
    rating: raw.overall_rating ?? null,
    reviews: raw.reviews ?? null,
    amenities: (raw.amenities ?? []).slice(0, 5),
    link: raw.link,
  };
}

export async function searchHotels(
  args: HotelSearchArgs,
  budget: RunBudget | null,
): Promise<PriceLookup<HotelResult>> {
  if (!args.query.trim()) {
    return unavailable('bad_request', 'A destination area is required to search for hotels.');
  }
  // Google Hotels rejects a zero-night stay, and a day trip has no accommodation anyway.
  if (args.checkInDate >= args.checkOutDate) {
    return unavailable(
      'bad_request',
      `Check-out (${args.checkOutDate}) must be after check-in (${args.checkInDate}). A day trip needs no accommodation.`,
    );
  }

  const response = await serpApiSearch({
    engine: 'google_hotels',
    ttlMs: TTL.hotels,
    budget,
    params: {
      q: args.query.trim(),
      check_in_date: args.checkInDate,
      check_out_date: args.checkOutDate,
      adults: Math.max(1, args.adults),
      children: args.children && args.children > 0 ? args.children : undefined,
      max_price: args.maxPriceUsd,
      rating: args.minRating ? ratingFilter(args.minRating) : undefined,
      vacation_rentals: args.vacationRentals ? true : undefined,
      currency: args.currency ?? 'USD',
      hl: 'en',
      gl: 'us',
    },
  });

  if (isUnavailable(response)) return response;

  const data = response.data;
  const raw = [
    ...(Array.isArray(data.properties) ? (data.properties as RawProperty[]) : []),
    ...(Array.isArray(data.ads) ? (data.ads as RawProperty[]) : []),
  ];

  const properties = raw
    .map(toQuote)
    .filter((p): p is HotelQuote => p !== null)
    .sort((a, b) => (a.ratePerNightUsd ?? Infinity) - (b.ratePerNightUsd ?? Infinity))
    .slice(0, MAX_PROPERTIES);

  if (properties.length === 0) {
    return unavailable(
      'upstream_error',
      `Google Hotels returned no priced properties for "${args.query}" on those dates.`,
    );
  }

  return {
    resultId: `htl_${randomUUID().slice(0, 8)}`,
    checkedAt: response.checkedAt,
    query: args.query.trim(),
    checkInDate: args.checkInDate,
    checkOutDate: args.checkOutDate,
    adults: args.adults,
    rooms: Math.max(1, args.rooms),
    properties,
  };
}

/** Google's rating filter is a small enum, not a number. */
function ratingFilter(minRating: number): number | undefined {
  if (minRating >= 4.5) return 9;
  if (minRating >= 4.0) return 8;
  if (minRating >= 3.5) return 7;
  return undefined;
}
