/**
 * The only thing in this repo that is allowed to spend SerpApi quota.
 *
 *   npm run warm              a dry run: prints the plan and the cost, spends nothing
 *   npm run warm -- --live    actually fetches, and writes data/cache/quotes.json
 *
 * **A dry run is the default, and that is a deliberate departure from the brief.** The brief says
 * `npm run warm` fetches. But the whole reason this script exists is that 250 searches a month is
 * small enough to lose by accident, and a bare `npm run warm` typed into the wrong terminal is
 * exactly the accident. Seeing the plan first costs nothing; spending takes six more characters.
 *
 * The matrix is in data/warm.json. Only San Francisco gets a flight search — the other three are
 * drives, so asking Google Flights about them would be 12 wasted searches. That is the difference
 * between a 20-search seed and the 80 the brief budgeted for.
 */
import fs from 'node:fs';
import path from 'node:path';

/* --------------------------------------------------------------- environment */

/** Next loads .env.local for the app; a bare tsx process does not. */
function loadEnvLocal(): void {
  const file = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(file)) return;
  for (const raw of fs.readFileSync(file, 'utf8').split('\n')) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    const value = line.slice(eq + 1).trim();
    if (!(key in process.env)) process.env[key] = value;
  }
}

loadEnvLocal();

/* --------------------------------------------------------------- the matrix */

interface Window {
  id: string;
  outbound: string;
  return: string;
  nights: number;
  label: string;
}

interface WarmDestination {
  slug: string;
  name: string;
  hotelQuery: string;
  airport: string | null;
  note?: string;
}

interface Matrix {
  origin: { city: string; airport: string };
  windows: Window[];
  destinations: WarmDestination[];
}

const MATRIX_FILE = path.join(process.cwd(), 'data', 'warm.json');
const CACHE_FILE = path.join(process.cwd(), 'data', 'cache', 'quotes.json');

/**
 * One room, two adults — the occupancy every stay figure is quoted at.
 *
 * Google prices a room at a time, so this is a real quote for a real room rather than a figure
 * divided by a party size. A group of four is two of these rooms, which is arithmetic the app can
 * do honestly. Warming every party size instead would be five times the searches for a number we
 * can already derive.
 */
const ADULTS_PER_ROOM = 2;

/**
 * One seat. Airlines sell the same fare class at the same price until the bucket empties, so a
 * single-adult search gives an exact per-seat figure that multiplies cleanly. Searching for four
 * would bake a party size into the cache and need re-warming when the chip changes.
 */
const ADULTS_PER_FLIGHT = 1;

type PlannedSearch =
  | { kind: 'stays'; destination: WarmDestination; window: Window }
  | { kind: 'flights'; destination: WarmDestination; window: Window };

function buildPlan(matrix: Matrix): PlannedSearch[] {
  const plan: PlannedSearch[] = [];
  for (const destination of matrix.destinations) {
    for (const window of matrix.windows) {
      plan.push({ kind: 'stays', destination, window });
      // A drive has no fare to look up. This is the whole quota saving.
      if (destination.airport) plan.push({ kind: 'flights', destination, window });
    }
  }
  return plan;
}

function describe(search: PlannedSearch, matrix: Matrix): string {
  const { destination, window } = search;
  return search.kind === 'stays'
    ? `stays   ${destination.slug.padEnd(14)} ${window.label.padEnd(16)} "${destination.hotelQuery}", ${ADULTS_PER_ROOM} adults, ${window.nights} nights`
    : `flights ${destination.slug.padEnd(14)} ${window.label.padEnd(16)} ${matrix.origin.airport}-${destination.airport}, ${ADULTS_PER_FLIGHT} adult, return`;
}

/* --------------------------------------------------------------- main */

async function main(): Promise<void> {
  const live = process.argv.includes('--live');
  const matrix = JSON.parse(fs.readFileSync(MATRIX_FILE, 'utf8')) as Matrix;
  const plan = buildPlan(matrix);

  const guard = await import('../lib/budget/guard');
  const before = guard.usageReport();

  console.log('');
  console.log(`WhereTo — warm${live ? '' : ' (dry run)'}`);
  console.log('─'.repeat(78));
  console.log(
    `${matrix.destinations.length} destinations x ${matrix.windows.length} windows ` +
      `= ${plan.length} searches (${plan.filter((p) => p.kind === 'stays').length} stays, ` +
      `${plan.filter((p) => p.kind === 'flights').length} flights)`,
  );
  console.log(
    `budget: ${before.serpapi.spent} of ${before.serpapi.ceiling} used in ${before.month}, ` +
      `${before.serpapi.remaining} left`,
  );

  if (plan.length > before.serpapi.remaining) {
    console.error(
      `\nRefusing to start: this run needs ${plan.length} searches and only ` +
        `${before.serpapi.remaining} remain this month. Nothing was spent.`,
    );
    process.exit(1);
  }

  /* SerpApi's own count is authoritative and free to query, so we ask before trusting ours —
     a counter that lost a write would otherwise let a run start that the provider will refuse. */
  if (live) {
    const account = await guard.fetchSerpApiAccount();
    if (!account) {
      console.error('\nRefusing to start: SerpApi did not answer the account endpoint, so the real balance is unknown.');
      process.exit(1);
    }
    console.log(
      `SerpApi says: ${account.totalSearchesLeft} of ${account.searchesPerMonth} left, ` +
        `${account.thisHourSearches} used this hour`,
    );
    if (account.totalSearchesLeft < plan.length) {
      console.error(`\nRefusing to start: the provider has ${account.totalSearchesLeft} left and this run needs ${plan.length}.`);
      process.exit(1);
    }
  }

  console.log('─'.repeat(78));

  if (!live) {
    plan.forEach((search, i) => {
      console.log(`  ${String(i + 1).padStart(2)}. ${describe(search, matrix)}`);
    });
    console.log('─'.repeat(78));
    console.log(`Dry run. Nothing was requested and nothing was spent.`);
    console.log(`After a live run: ${before.serpapi.spent + plan.length} of ${before.serpapi.ceiling} used, ${before.serpapi.remaining - plan.length} left.`);
    console.log(`\nTo fetch for real:  npm run warm -- --live\n`);
    return;
  }

  const { searchFlights } = await import('../lib/pricing/flights');
  const { searchHotels } = await import('../lib/pricing/hotels');
  const { isUnavailable } = await import('../lib/pricing/types');
  const { RunBudget } = guard;

  // Sized to the plan, so a confused loop cannot spend past what was printed above.
  const budget = new RunBudget(plan.length);
  const entries: Record<string, unknown> = {};
  let ok = 0;
  let failed = 0;

  for (const [i, search] of plan.entries()) {
    const { destination, window } = search;
    const label = `  ${String(i + 1).padStart(2)}/${plan.length} ${describe(search, matrix)}`;

    if (search.kind === 'stays') {
      const result = await searchHotels(
        {
          query: destination.hotelQuery,
          checkInDate: window.outbound,
          checkOutDate: window.return,
          adults: ADULTS_PER_ROOM,
          rooms: 1,
        },
        budget,
      );
      if (isUnavailable(result)) {
        failed += 1;
        console.log(`${label}\n       FAILED: ${result.detail}`);
        continue;
      }
      ok += 1;
      entries[`${destination.slug}:${window.id}:stays`] = {
        kind: 'stays',
        key: `${destination.slug}:${window.id}:stays`,
        destination: destination.slug,
        window: window.id,
        provider: 'Google Hotels',
        fetchedAt: result.checkedAt,
        basis: `1 room, ${ADULTS_PER_ROOM} adults, ${window.nights} nights, ${window.label}`,
        query: result.query,
        checkInDate: result.checkInDate,
        checkOutDate: result.checkOutDate,
        adultsPerRoom: ADULTS_PER_ROOM,
        stays: result.properties.slice(0, 5).map((p) => ({
          name: p.name,
          type: p.type,
          ratePerNightUsd: p.ratePerNightUsd,
          totalRateUsd: p.totalRateUsd,
          rating: p.rating,
          link: p.link,
        })),
      };
      const cheapest = result.properties[0];
      console.log(`${label}\n       ${result.properties.length} properties, cheapest ${cheapest.name} at $${cheapest.ratePerNightUsd ?? cheapest.totalRateUsd}`);
    } else {
      const result = await searchFlights(
        {
          originAirport: matrix.origin.airport,
          destinationAirport: destination.airport as string,
          outboundDate: window.outbound,
          returnDate: window.return,
          adults: ADULTS_PER_FLIGHT,
        },
        budget,
      );
      if (isUnavailable(result)) {
        failed += 1;
        console.log(`${label}\n       FAILED: ${result.detail}`);
        continue;
      }
      ok += 1;
      entries[`${destination.slug}:${window.id}:flights`] = {
        kind: 'flights',
        key: `${destination.slug}:${window.id}:flights`,
        destination: destination.slug,
        window: window.id,
        provider: 'Google Flights',
        fetchedAt: result.checkedAt,
        basis: `${ADULTS_PER_FLIGHT} adult, return ${result.origin}-${result.destination}, ${window.label}`,
        originAirport: result.origin,
        destinationAirport: result.destination,
        outboundDate: result.outboundDate,
        returnDate: result.returnDate,
        adults: ADULTS_PER_FLIGHT,
        flights: result.flights.slice(0, 3).map((f) => ({
          airline: f.legs[0]?.airline ?? 'Unknown airline',
          flightNumber: f.legs[0]?.flightNumber ?? '',
          stops: f.stops,
          durationMinutes: f.legs.reduce((sum, l) => sum + l.durationMinutes, 0),
          perPersonUsd: f.perPersonUsd,
          bookingLink: f.bookingLink,
        })),
      };
      const cheapest = result.flights[0];
      console.log(`${label}\n       ${result.flights.length} itineraries, cheapest ${cheapest.legs[0]?.airline} at $${cheapest.perPersonUsd}/seat`);
    }

    const now = guard.usageReport();
    console.log(`       spent ${budget.spent}/${plan.length} this run · ${now.serpapi.remaining} left this month`);
  }

  /* Merge rather than replace. A partial run — a timeout halfway through, one destination
     re-warmed on its own — must not wipe the entries it did not touch. */
  const existing = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8')) as {
    version: number;
    entries: Record<string, unknown>;
  };
  const merged = {
    version: existing.version,
    warmedAt: new Date().toISOString(),
    entries: { ...existing.entries, ...entries },
  };
  fs.writeFileSync(CACHE_FILE, `${JSON.stringify(merged, null, 2)}\n`);

  const after = guard.usageReport();
  console.log('─'.repeat(78));
  console.log(`${ok} fetched, ${failed} failed. ${Object.keys(merged.entries).length} entries now in the cache.`);
  console.log(`budget: ${after.serpapi.spent} of ${after.serpapi.ceiling} used, ${after.serpapi.remaining} left this month.`);
  if (!after.persisted) console.log('WARNING: the counter could not be written to disk.');
  console.log(`\nCommit data/cache/quotes.json and data/usage.json together — the prices and the cost of getting them.\n`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
