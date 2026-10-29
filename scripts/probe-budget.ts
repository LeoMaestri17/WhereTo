/**
 * The budget guard, proved offline against fake data.
 *
 *   npx tsx scripts/probe-budget.ts
 *
 * Costs nothing: no key, no network, no model. The one case that reaches `serpApiSearch` replaces
 * `fetch` with a stub, so the wrapper is exercised end to end without a request leaving the
 * machine.
 *
 * This exists because "the guard works" is not something to find out by watching a month of quota
 * disappear. Every case below is an assertion. Case 7 is the one that matters most — it proves no
 * request is even built once the ceiling is reached, which is the difference between a guard and
 * a log line.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

/* The counter goes to a scratch file, and the keys are fakes set here rather than read from
   .env.local — a probe that can reach the real account is not a probe. */
const SCRATCH = fs.mkdtempSync(path.join(os.tmpdir(), 'whereto-budget-'));
const USAGE = path.join(SCRATCH, 'usage.json');
process.env.WHERETO_USAGE_FILE = USAGE;
/* Stubbed responses must never reach the committed fixture set, or a later dev server would
   serve a price this probe invented as though a provider had returned it. */
process.env.WHERETO_FIXTURE_DIR = path.join(SCRATCH, 'fixtures');
delete process.env.PRICING_CACHE_DIR;
delete process.env.SERPAPI_API_KEY;

let passed = 0;
let failed = 0;

function check(name: string, condition: boolean, detail = ''): void {
  if (condition) {
    passed += 1;
    console.log(`  ok    ${name}`);
  } else {
    failed += 1;
    console.log(`  FAIL  ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

function heading(text: string): void {
  console.log(`\n${text}\n${'─'.repeat(text.length)}`);
}

function readUsageFile(): { month: string; serpapi: number; anthropic: number } {
  return JSON.parse(fs.readFileSync(USAGE, 'utf8'));
}

async function main(): Promise<void> {
  /* Case 0 runs before the guard is imported for the first time, because the disk read only
     happens once per process — module state is cached after that. */
  heading('0. A counter left over from a past month does not block this one');
  fs.writeFileSync(USAGE, JSON.stringify({ month: '2001-01', serpapi: 199, anthropic: 799 }));

  const guard = await import('../lib/budget/guard');
  const { claim, release, ceiling, remaining, usageReport, resetUsage, monthKey, RunBudget, BudgetExceededError } = guard;

  const start = usageReport();
  check('the stale month is discarded', start.month === monthKey(), `got ${start.month}`);
  check('serpapi starts at zero', start.serpapi.spent === 0, `got ${start.serpapi.spent}`);
  check('anthropic starts at zero', start.anthropic.spent === 0, `got ${start.anthropic.spent}`);

  heading('1. A claim increments, and survives to disk');
  resetUsage();
  claim('serpapi');
  claim('serpapi');
  claim('anthropic', 3);
  check('two serpapi claims count two', usageReport().serpapi.spent === 2);
  check('a claim of three counts three', usageReport().anthropic.spent === 3);
  check('the file on disk agrees', readUsageFile().serpapi === 2, JSON.stringify(readUsageFile()));

  heading('2. The ceiling throws, and does not increment');
  resetUsage();
  process.env.SERPAPI_MONTHLY_MAX = '3';
  claim('serpapi', 3);
  check('the ceiling is read from the environment', ceiling('serpapi') === 3);
  check('nothing is left', remaining('serpapi') === 0);

  let threw: unknown = null;
  try {
    claim('serpapi');
  } catch (err) {
    threw = err;
  }
  check('one over the ceiling throws', threw instanceof BudgetExceededError, String(threw));
  check('the refused claim did not count', usageReport().serpapi.spent === 3, `got ${usageReport().serpapi.spent}`);

  /* A claim of several is all-or-nothing. A partial claim would leave the caller believing it had
     budget it does not have, which is worse than refusing outright. */
  resetUsage();
  threw = null;
  try {
    claim('serpapi', 4);
  } catch (err) {
    threw = err;
  }
  check('a batch larger than the ceiling throws', threw instanceof BudgetExceededError);
  check('and claims none of it', usageReport().serpapi.spent === 0, `got ${usageReport().serpapi.spent}`);

  heading('3. A release gives the unit back');
  resetUsage();
  claim('serpapi', 2);
  release('serpapi');
  check('two claimed, one released, one spent', usageReport().serpapi.spent === 1);
  release('serpapi', 99);
  check('a release past zero floors at zero', usageReport().serpapi.spent === 0);

  heading('4. The per-run cap holds independently of the month');
  const run = new RunBudget(2);
  run.spend();
  run.spend();
  check('a cap of two allows two', run.spent === 2 && run.remaining === 0);
  run.refund();
  check('a refund frees a slot', run.remaining === 1);

  heading('5. Fixture mode cannot spend, whatever else is true');
  resetUsage();
  process.env.SERPAPI_MONTHLY_MAX = '200';
  process.env.SERPAPI_MODE = 'fixture';
  process.env.SERPAPI_API_KEY = 'a-real-looking-key';

  const { serpApiSearch } = await import('../lib/pricing/serpapi');
  const { isUnavailable } = await import('../lib/pricing/types');

  let fixtureFetches = 0;
  const realFetchEarly = globalThis.fetch;
  globalThis.fetch = (async () => {
    fixtureFetches += 1;
    throw new Error('fixture mode must never reach the network');
  }) as typeof fetch;

  const noFixture = await serpApiSearch({
    engine: 'google_hotels',
    params: { q: 'nowhere recorded', check_in_date: '2026-11-06', check_out_date: '2026-11-08' },
    ttlMs: 1000,
    budget: null,
  });
  check('a miss is reported as a miss', isUnavailable(noFixture) && noFixture.unavailable === 'no_fixture');
  check('it never reached the network', fixtureFetches === 0, `${fixtureFetches} requests`);
  check('even with a key present, nothing was spent', usageReport().serpapi.spent === 0, `got ${usageReport().serpapi.spent}`);
  globalThis.fetch = realFetchEarly;

  heading('5b. No key in live mode means no spend');
  resetUsage();
  process.env.SERPAPI_MODE = 'live';
  delete process.env.SERPAPI_API_KEY;

  const noKey = await serpApiSearch({
    engine: 'google_hotels',
    params: { q: 'nowhere', check_in_date: '2026-11-06', check_out_date: '2026-11-08' },
    ttlMs: 1000,
    budget: null,
  });
  check('it reports unavailable', isUnavailable(noKey) && noKey.unavailable === 'no_api_key');
  check('and spent nothing', usageReport().serpapi.spent === 0, `got ${usageReport().serpapi.spent}`);

  heading('6. A successful lookup spends exactly one');
  resetUsage();
  process.env.SERPAPI_API_KEY = 'fake-key-for-the-probe';

  let fetchCalls = 0;
  const realFetch = globalThis.fetch;
  globalThis.fetch = (async () => {
    fetchCalls += 1;
    return new Response(
      JSON.stringify({ properties: [{ name: 'Probe Inn', rate_per_night: { extracted_lowest: 90 }, total_rate: { extracted_lowest: 180 } }] }),
      { status: 200, headers: { 'content-type': 'application/json' } },
    );
  }) as typeof fetch;

  const hit = await serpApiSearch({
    engine: 'google_hotels',
    params: { q: 'Springdale, Utah', check_in_date: '2026-11-06', check_out_date: '2026-11-08' },
    ttlMs: 60_000,
    budget: null,
  });
  check('it succeeded', !isUnavailable(hit));
  check('one request went out', fetchCalls === 1, `got ${fetchCalls}`);
  check('one unit was spent', usageReport().serpapi.spent === 1, `got ${usageReport().serpapi.spent}`);

  /* The cache is the reason a month of development does not cost a month of quota, so an
     identical query must not reach the network or the counter a second time. */
  const cached = await serpApiSearch({
    engine: 'google_hotels',
    params: { q: 'Springdale, Utah', check_in_date: '2026-11-06', check_out_date: '2026-11-08' },
    ttlMs: 60_000,
    budget: null,
  });
  check('the same query again is free', !isUnavailable(cached) && fetchCalls === 1, `fetchCalls ${fetchCalls}`);
  check('and did not count', usageReport().serpapi.spent === 1, `got ${usageReport().serpapi.spent}`);

  heading('7. Over the ceiling, no request is built at all');
  resetUsage();
  process.env.SERPAPI_MONTHLY_MAX = '1';
  claim('serpapi');
  const callsBefore = fetchCalls;

  threw = null;
  try {
    await serpApiSearch({
      engine: 'google_hotels',
      params: { q: 'San Diego, California', check_in_date: '2026-12-04', check_out_date: '2026-12-06' },
      ttlMs: 1000,
      budget: null,
    });
  } catch (err) {
    threw = err;
  }
  check('the wrapper throws rather than degrading', threw instanceof BudgetExceededError, String(threw));
  check('and no request was made', fetchCalls === callsBefore, `${fetchCalls - callsBefore} requests slipped through`);

  heading('8. A failed request gives its unit back');
  resetUsage();
  process.env.SERPAPI_MONTHLY_MAX = '200';
  globalThis.fetch = (async () => {
    fetchCalls += 1;
    return new Response('upstream exploded', { status: 500 });
  }) as typeof fetch;

  const broken = await serpApiSearch({
    engine: 'google_flights',
    params: { departure_id: 'LAX', arrival_id: 'SFO', outbound_date: '2026-11-06' },
    ttlMs: 1000,
    budget: null,
  });
  check('it reports unavailable', isUnavailable(broken));
  check('and the unit was refunded', usageReport().serpapi.spent === 0, `got ${usageReport().serpapi.spent}`);

  globalThis.fetch = realFetch;

  /*
   * Case 9 is not about the budget, it is about the key, and it lives here because this is the
   * script that runs in `npm run check`.
   *
   * `server-only` cannot be the guard: it throws in plain Node, which would break every offline
   * harness that imports the pricing layer — that is why CLAUDE.md keeps it off lib/pricing/*. So
   * the boundary is enforced by looking. Every surface under app/ and components/ is a client
   * component, and one import of a module that reads process.env.SERPAPI_API_KEY would publish
   * the key in the browser bundle. The app reads lib/cache/quotes.ts, which holds no keys.
   */
  heading('9. No client surface can reach a key');
  const forbidden = ['lib/pricing', 'lib/budget', '@/lib/pricing', '@/lib/budget'];
  const offenders: string[] = [];

  const walk = (dir: string): void => {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (/\.(ts|tsx)$/.test(entry.name)) {
        const source = fs.readFileSync(full, 'utf8');
        for (const needle of forbidden) {
          if (source.includes(`from '${needle}`)) offenders.push(`${full} imports ${needle}`);
        }
      }
    }
  };

  walk('app');
  walk('components');
  check(
    'nothing under app/ or components/ imports the pricing or budget layer',
    offenders.length === 0,
    offenders.join('; '),
  );

  /* --------------------------------------------------------------- */

  fs.rmSync(SCRATCH, { recursive: true, force: true });
  console.log(`\n${'─'.repeat(60)}`);
  console.log(`${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
  console.log('The guard holds. No quota was spent proving it.\n');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
