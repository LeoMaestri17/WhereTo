import { z } from 'zod';
import { searchCampgrounds } from './campgrounds';
import { searchFlights } from './flights';
import { searchHotels } from './hotels';
import { PriceLedger, type LedgerQuote } from './ledger';
import type { RunBudget } from './quota';
import { isUnavailable } from './types';

/**
 * The tools the research model can call.
 *
 * One zod schema per tool does double duty: it generates the JSON Schema the API is given, and
 * it validates what comes back before we act on it. Tool inputs arrive as untyped JSON, and a
 * model that hallucinates an argument name should get a clear error rather than a crash.
 *
 * Every executor returns a result carrying a `resultId`. The system prompt requires that any line
 * item claiming a live price cites the id it came from — which is what lib/pricing/ledger.ts then
 * verifies. Without that link the provenance badge would be unfalsifiable.
 */

const flightArgs = z.object({
  origin_airport: z.string().length(3).describe('Three-letter IATA code, e.g. LAX'),
  destination_airport: z.string().length(3).describe('Three-letter IATA code, e.g. LAS'),
  outbound_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  return_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  adults: z.number().int().min(1).max(20),
  travel_class: z.enum(['economy', 'premium', 'business', 'first']).optional(),
});

const hotelArgs = z.object({
  query: z
    .string()
    .min(2)
    .describe('An area, not an address: "Springdale, Utah" or "Ocean Beach, San Diego"'),
  check_in_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  check_out_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  adults: z.number().int().min(1).max(10).describe('Adults per room, not the whole party'),
  rooms: z.number().int().min(1).max(10).describe('How many of that room the group needs'),
  max_price_usd: z.number().int().positive().optional(),
  vacation_rentals: z.boolean().optional().describe('Whole flats and houses instead of rooms'),
});

const campgroundArgs = z.object({
  query: z.string().min(2).describe('A place name: "Joshua Tree", "Zion", "Big Sur"'),
  month: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .describe('Any date in the month you want availability for'),
});

/** The Anthropic tool definitions. Order is stable so the prompt cache prefix stays intact. */
export const PRICING_TOOLS = [
  {
    name: 'search_flights',
    description:
      'Real flight prices from Google Flights for a specific route and date. Returns named ' +
      'airlines, flight numbers, times, stops and the total price for the party. Use this ' +
      'rather than recalling or searching for fares — it is the only way to get a figure tied ' +
      'to these exact dates. Each result carries both totalPriceUsd for the whole party and ' +
      'perPersonUsd; costed lines are per person, so use perPersonUsd.',
    input_schema: toJsonSchema(flightArgs),
  },
  {
    name: 'search_hotels',
    description:
      'Real accommodation prices from Google Hotels for a specific area, date range and ' +
      'occupancy. Returns property names with nightly and total rates, ratings and booking ' +
      'links. Set vacation_rentals when a whole flat would suit the group better than rooms. ' +
      'Do not call this for a day trip.',
    input_schema: toJsonSchema(hotelArgs),
  },
  {
    name: 'search_campgrounds',
    description:
      'Campgrounds from Recreation.gov, with fee descriptions and how many nights in the month ' +
      'still have a free site. Use for any national or state park trip where camping is the ' +
      'cheap option.',
    input_schema: toJsonSchema(campgroundArgs),
  },
] as const;

/** zod v4 ships JSON Schema generation; the API wants an object schema with a literal type. */
function toJsonSchema(schema: z.ZodType): { type: 'object'; [key: string]: unknown } {
  const generated = z.toJSONSchema(schema, { target: 'draft-7' }) as Record<string, unknown>;
  return { ...generated, type: 'object', additionalProperties: false };
}

/* ------------------------------------------------------------------ execution */

export interface ToolExecution {
  /** What goes back to the model as the tool_result body. */
  result: unknown;
  isError: boolean;
  /** One line for the progress stream, written for a person watching it happen. */
  label: string;
  ok: boolean;
  cached: boolean;
}

export async function executeTool(
  name: string,
  rawInput: unknown,
  ledger: PriceLedger,
  budget: RunBudget | null,
): Promise<ToolExecution> {
  try {
    switch (name) {
      case 'search_flights':
        return await runFlights(flightArgs.parse(rawInput), ledger, budget);
      case 'search_hotels':
        return await runHotels(hotelArgs.parse(rawInput), ledger, budget);
      case 'search_campgrounds':
        return await runCampgrounds(campgroundArgs.parse(rawInput), ledger);
      default:
        return {
          result: { error: `No such tool: ${name}` },
          isError: true,
          label: `Unknown tool ${name}`,
          ok: false,
          cached: false,
        };
    }
  } catch (err) {
    // A schema failure is the model's mistake to fix, so tell it precisely what was wrong.
    const detail =
      err instanceof z.ZodError
        ? err.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')
        : err instanceof Error
          ? err.message
          : 'unknown error';
    return {
      result: { error: `Invalid arguments for ${name}: ${detail}` },
      isError: true,
      label: `${name} — bad arguments`,
      ok: false,
      cached: false,
    };
  }
}

async function runFlights(
  args: z.infer<typeof flightArgs>,
  ledger: PriceLedger,
  budget: RunBudget | null,
): Promise<ToolExecution> {
  const route = `${args.origin_airport.toUpperCase()} → ${args.destination_airport.toUpperCase()}`;
  const result = await searchFlights(
    {
      originAirport: args.origin_airport,
      destinationAirport: args.destination_airport,
      outboundDate: args.outbound_date,
      returnDate: args.return_date,
      adults: args.adults,
      travelClass: args.travel_class,
    },
    budget,
  );

  if (isUnavailable(result)) {
    return {
      result,
      isError: true,
      label: `Google Flights · ${route} · ${result.unavailable}`,
      ok: false,
      cached: false,
    };
  }

  // Both figures go in the ledger: the model may legitimately quote either the party total or
  // the per-person share, and neither should have to survive on a split heuristic.
  const quotes: LedgerQuote[] = result.flights.flatMap((f) => {
    const name = `${f.legs[0]?.airline ?? ''} ${f.legs[0]?.flightNumber ?? ''}`.trim();
    return [
      { label: `${name} (party of ${result.adults})`, priceUsd: f.totalPriceUsd, url: f.bookingLink },
      { label: `${name} (per person)`, priceUsd: f.perPersonUsd, url: f.bookingLink },
    ];
  });
  ledger.record({
    resultId: result.resultId,
    tool: 'search_flights',
    args,
    checkedAt: result.checkedAt,
    cached: false,
    quotes,
  });

  const cheapest = Math.min(...result.flights.map((f) => f.perPersonUsd));
  return {
    result,
    isError: false,
    label: `Google Flights · ${route} · ${result.flights.length} fares, cheapest ${Math.round(cheapest)} each`,
    ok: true,
    cached: false,
  };
}

async function runHotels(
  args: z.infer<typeof hotelArgs>,
  ledger: PriceLedger,
  budget: RunBudget | null,
): Promise<ToolExecution> {
  const result = await searchHotels(
    {
      query: args.query,
      checkInDate: args.check_in_date,
      checkOutDate: args.check_out_date,
      adults: args.adults,
      rooms: args.rooms,
      maxPriceUsd: args.max_price_usd,
      vacationRentals: args.vacation_rentals,
    },
    budget,
  );

  if (isUnavailable(result)) {
    return {
      result,
      isError: true,
      label: `Google Hotels · ${args.query} · ${result.unavailable}`,
      ok: false,
      cached: false,
    };
  }

  const quotes: LedgerQuote[] = result.properties.flatMap((p) => {
    const rows: LedgerQuote[] = [];
    if (p.ratePerNightUsd !== null) {
      rows.push({ label: `${p.name} (per night)`, priceUsd: p.ratePerNightUsd, url: p.link });
    }
    if (p.totalRateUsd !== null) {
      rows.push({ label: `${p.name} (total)`, priceUsd: p.totalRateUsd, url: p.link });
    }
    return rows;
  });
  ledger.record({
    resultId: result.resultId,
    tool: 'search_hotels',
    args,
    checkedAt: result.checkedAt,
    cached: false,
    quotes,
  });

  return {
    result,
    isError: false,
    label: `Google Hotels · ${args.query} · ${args.rooms} room(s), ${result.properties.length} properties`,
    ok: true,
    cached: false,
  };
}

async function runCampgrounds(
  args: z.infer<typeof campgroundArgs>,
  ledger: PriceLedger,
): Promise<ToolExecution> {
  const result = await searchCampgrounds({ query: args.query, month: args.month });

  if (isUnavailable(result)) {
    return {
      result,
      isError: true,
      label: `Recreation.gov · ${args.query} · ${result.unavailable}`,
      ok: false,
      cached: false,
    };
  }

  ledger.record({
    resultId: result.resultId,
    tool: 'search_campgrounds',
    args,
    checkedAt: result.checkedAt,
    cached: false,
    // Campground fees are text rather than numbers, so there is nothing to price-match against.
    quotes: result.campgrounds.map((c) => ({ label: c.name, priceUsd: 0, url: c.url })),
  });

  return {
    result,
    isError: false,
    label: `Recreation.gov · ${args.query} · ${result.campgrounds.length} campgrounds`,
    ok: true,
    cached: false,
  };
}
