import { randomUUID } from 'node:crypto';
import { TTL } from './cache';
import type { RunBudget } from './quota';
import { serpApiSearch } from './serpapi';
import {
  isUnavailable,
  unavailable,
  type FlightLeg,
  type FlightQuote,
  type FlightResult,
  type PriceLookup,
} from './types';

/**
 * Live flight prices via SerpApi's Google Flights engine.
 *
 * Responses are large — hundreds of itineraries with full carrier metadata — so we keep only the
 * cheapest handful. A twelve-iteration research loop cannot afford to carry raw responses in its
 * context, and the model only ever needs the few options it will actually write up.
 */

export interface FlightSearchArgs {
  originAirport: string;
  destinationAirport: string;
  outboundDate: string;
  returnDate?: string;
  adults: number;
  travelClass?: 'economy' | 'premium' | 'business' | 'first';
  currency?: string;
}

const TRAVEL_CLASS: Record<string, number> = {
  economy: 1,
  premium: 2,
  business: 3,
  first: 4,
};

const MAX_FLIGHTS = 5;

interface RawLeg {
  airline?: string;
  flight_number?: string;
  departure_airport?: { id?: string; time?: string };
  arrival_airport?: { id?: string; time?: string };
  duration?: number;
}

interface RawItinerary {
  flights?: RawLeg[];
  price?: number;
  total_duration?: number;
  carbon_emissions?: { this_flight?: number };
  booking_token?: string;
  layovers?: unknown[];
}

function toQuote(raw: RawItinerary, adults: number): FlightQuote | null {
  const rawLegs = raw.flights ?? [];
  if (rawLegs.length === 0 || typeof raw.price !== 'number') return null;

  const legs: FlightLeg[] = rawLegs.map((l) => ({
    airline: l.airline ?? 'Unknown airline',
    flightNumber: l.flight_number ?? '',
    departAirport: l.departure_airport?.id ?? '',
    arriveAirport: l.arrival_airport?.id ?? '',
    departTime: l.departure_airport?.time ?? '',
    arriveTime: l.arrival_airport?.time ?? '',
    durationMinutes: l.duration ?? 0,
  }));

  return {
    legs,
    stops: Math.max(0, legs.length - 1),
    totalPriceUsd: raw.price,
    perPersonUsd: Math.round((raw.price / Math.max(1, adults)) * 100) / 100,
    // Google's booking flow needs the token; the deep link is the honest thing to hand a user.
    bookingLink: raw.booking_token
      ? `https://www.google.com/travel/flights?tfs=${encodeURIComponent(raw.booking_token)}`
      : undefined,
    carbonKg:
      typeof raw.carbon_emissions?.this_flight === 'number'
        ? Math.round(raw.carbon_emissions.this_flight / 1000)
        : undefined,
  };
}

export async function searchFlights(
  args: FlightSearchArgs,
  budget: RunBudget | null,
): Promise<PriceLookup<FlightResult>> {
  const origin = args.originAirport.trim().toUpperCase();
  const destination = args.destinationAirport.trim().toUpperCase();

  if (!/^[A-Z]{3}$/.test(origin) || !/^[A-Z]{3}$/.test(destination)) {
    return unavailable(
      'bad_request',
      `Airport codes must be three letters. Got "${args.originAirport}" and "${args.destinationAirport}".`,
    );
  }
  if (origin === destination) {
    return unavailable('bad_request', 'Origin and destination airports are the same.');
  }

  const response = await serpApiSearch({
    engine: 'google_flights',
    ttlMs: TTL.flights,
    budget,
    params: {
      departure_id: origin,
      arrival_id: destination,
      outbound_date: args.outboundDate,
      return_date: args.returnDate,
      // 1 is a round trip, 2 is one way. Sending a return date on a one-way is rejected.
      type: args.returnDate ? 1 : 2,
      adults: Math.max(1, args.adults),
      travel_class: args.travelClass ? TRAVEL_CLASS[args.travelClass] : undefined,
      currency: args.currency ?? 'USD',
      hl: 'en',
      gl: 'us',
    },
  });

  if (isUnavailable(response)) return response;

  const data = response.data;
  const best = Array.isArray(data.best_flights) ? (data.best_flights as RawItinerary[]) : [];
  const other = Array.isArray(data.other_flights) ? (data.other_flights as RawItinerary[]) : [];

  const flights = [...best, ...other]
    .map((raw) => toQuote(raw, args.adults))
    .filter((q): q is FlightQuote => q !== null)
    .sort((a, b) => a.totalPriceUsd - b.totalPriceUsd)
    .slice(0, MAX_FLIGHTS);

  if (flights.length === 0) {
    return unavailable(
      'upstream_error',
      `Google Flights returned no itineraries for ${origin}→${destination} on ${args.outboundDate}.`,
    );
  }

  const insights = data.price_insights as
    | { lowest_price?: number; price_level?: string; typical_price_range?: number[] }
    | undefined;

  return {
    resultId: `flt_${randomUUID().slice(0, 8)}`,
    checkedAt: response.checkedAt,
    origin,
    destination,
    outboundDate: args.outboundDate,
    returnDate: args.returnDate,
    adults: args.adults,
    flights,
    priceInsights: insights
      ? {
          lowestUsd: insights.lowest_price ?? null,
          priceLevel: insights.price_level ?? null,
          typicalRangeUsd:
            Array.isArray(insights.typical_price_range) &&
            insights.typical_price_range.length === 2
              ? [insights.typical_price_range[0], insights.typical_price_range[1]]
              : null,
        }
      : undefined,
  };
}
