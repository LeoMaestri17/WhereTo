/**
 * Exercises the pricing layer directly, with no model call and no Anthropic credit spent.
 *
 * The expensive, slow part of this app is the research call. This script proves the half that
 * actually produces the numbers — flights, hotels, campgrounds, link checking — so that layer can
 * be built and debugged without touching the Anthropic API at all.
 *
 *   npx tsx scripts/probe-pricing.ts            all sources
 *   npx tsx scripts/probe-pricing.ts flights    just one
 *
 * With no SERPAPI_API_KEY set it exercises the degradation path instead, which is the behaviour
 * that must never throw.
 */
import fs from 'node:fs';
import path from 'node:path';

function loadEnvLocal(): void {
  const file = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (match && !process.env[match[1]]) process.env[match[1]] = match[2].trim();
  }
}
loadEnvLocal();


/** Far enough out that fares exist, close enough that they are real. */
function inDays(days: number): string {
  const d = new Date(Date.now() + days * 86_400_000);
  return d.toISOString().slice(0, 10);
}

type Mod = Awaited<ReturnType<typeof loadModules>>;
let M: Mod;

async function loadModules() {
  return {
    ...(await import('../lib/pricing/flights')),
    ...(await import('../lib/pricing/hotels')),
    ...(await import('../lib/pricing/campgrounds')),
    ...(await import('../lib/pricing/links')),
    ...(await import('../lib/budget/guard')),
    ...(await import('../lib/pricing/types')),
    ...(await import('../lib/pricing/index')),
  };
}

const only = process.argv[2];
const want = (name: string) => !only || only === name;
let budget: InstanceType<Mod['RunBudget']>;

function heading(text: string) {
  console.log(`\n${'─'.repeat(70)}\n${text}\n${'─'.repeat(70)}`);
}

async function probeFlights() {
  heading('FLIGHTS — SerpApi Google Flights · LAX → JFK');
  const result = await M.searchFlights(
    {
      originAirport: 'LAX',
      destinationAirport: 'JFK',
      outboundDate: inDays(45),
      returnDate: inDays(50),
      adults: 4,
    },
    budget,
  );

  if (M.isUnavailable(result)) {
    console.log(`unavailable (${result.unavailable}): ${result.detail}`);
    return;
  }

  console.log(`checked ${result.checkedAt} · ${result.flights.length} itineraries kept`);
  for (const f of result.flights) {
    const first = f.legs[0];
    const last = f.legs[f.legs.length - 1];
    console.log(
      `  $${f.totalPriceUsd.toString().padStart(5)} · ${first.airline} ${first.flightNumber} · ` +
        `${first.departTime} → ${last.arriveTime} · ${f.stops} stop(s)`,
    );
  }
  if (result.priceInsights) {
    console.log(`  insights: lowest $${result.priceInsights.lowestUsd}, ${result.priceInsights.priceLevel}`);
  }
}

async function probeHotels() {
  heading('HOTELS — SerpApi Google Hotels · Springdale, Utah · 2 nights, 2 adults');
  const result = await M.searchHotels(
    {
      query: 'Springdale, Utah',
      checkInDate: inDays(45),
      checkOutDate: inDays(47),
      adults: 2,
      rooms: 2,
    },
    budget,
  );

  if (M.isUnavailable(result)) {
    console.log(`unavailable (${result.unavailable}): ${result.detail}`);
    return;
  }

  console.log(`checked ${result.checkedAt} · ${result.properties.length} properties kept`);
  for (const p of result.properties) {
    console.log(
      `  $${String(p.ratePerNightUsd ?? '?').padStart(4)}/night · ` +
        `$${String(p.totalRateUsd ?? '?').padStart(5)} total · ${p.rating ?? '—'}★ · ${p.name}`,
    );
  }
}

async function probeCampgrounds() {
  heading('CAMPGROUNDS — Recreation.gov · Joshua Tree');
  const result = await M.searchCampgrounds({ query: 'Joshua Tree', month: inDays(45) });

  if (M.isUnavailable(result)) {
    console.log(`unavailable (${result.unavailable}): ${result.detail}`);
    return;
  }

  console.log(`checked ${result.checkedAt} · ${result.campgrounds.length} campgrounds`);
  for (const c of result.campgrounds) {
    console.log(
      `  ${c.reservable ? 'reservable' : 'first-come '} · ` +
        `${c.availableNights !== undefined ? `${c.availableNights} nights free` : 'availability not checked'} · ${c.name}`,
    );
  }
}

async function probeLinks() {
  heading('LINKS — the checker, including the 403 trap');
  const urls = [
    'https://www.nps.gov/zion/planyourvisit/fees.htm',
    'https://www.booking.com/',
    'https://www.nps.gov/this-page-does-not-exist-abc123',
    'https://www.recreation.gov/',
  ];
  const results = await M.verifyLinks(urls);
  for (const [url, check] of results) {
    console.log(`  ${check.status.padEnd(9)} ${check.httpStatus ?? '—'}  ${url}`);
  }
  const summary = M.summariseLinks(results.values());
  console.log(
    `\n  ${summary.ok} ok · ${summary.blocked} blocked · ${summary.dead} dead · ${summary.timeout} timeout`,
  );
  console.log('  (a booking site answering 403 must read "blocked", never "dead")');
}

async function main() {
  M = await loadModules();
  budget = new M.RunBudget(10);
  const capability = M.pricingCapability();
  console.log(`capability: ${capability.note}`);

  if (want('flights')) await probeFlights();
  if (want('hotels')) await probeHotels();
  if (want('campgrounds')) await probeCampgrounds();
  if (want('links')) await probeLinks();

  const report = M.usageReport();
  const account = await M.fetchSerpApiAccount();
  heading('BUDGET');
  console.log(`  spent this run: ${budget.spent}`);
  console.log(
    `  serpapi: ${report.serpapi.spent} of ${report.serpapi.ceiling} used in ${report.month} · ` +
      `${report.serpapi.remaining} left`,
  );
  if (!report.persisted) console.log('  (counter is in memory only — the file could not be written)');
  if (account) {
    console.log(
      `  SerpApi says: ${account.totalSearchesLeft} of ${account.searchesPerMonth} left · ` +
        `${account.thisMonthUsage} used this month · ${account.thisHourSearches} this hour`,
    );
  }
  console.log('  Re-running should cost 0 — the disk cache answers identical queries for free.');
}

main().catch((e) => { console.error(e); process.exit(1); });
