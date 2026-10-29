import { RunBudget, claim, release } from '@/lib/budget/guard';
import { readCache, writeCache, cacheKey } from './cache';
import { readFixture, writeFixture } from './fixtures';
import { isUnavailable, unavailable, type PriceLookup, type Unavailable } from './types';

/**
 * The one way to reach SerpApi, and mostly the one way not to.
 *
 * SerpApi runs the scraping of Google Flights and Google Hotels and hands back structured JSON.
 * That matters because neither has a public API: Google retired QPX, and Booking.com's Demand API
 * is partner-only. This is the one route to live prices that does not involve breaking somebody's
 * terms of service.
 *
 * Free tier: 250 searches a month, 50 an hour, one key for both engines. Small enough that the
 * default here is **not to spend it**.
 *
 * ## Two modes, and fixture is the default
 *
 * `SERPAPI_MODE=fixture` (the default, including when the variable is unset) reads recorded
 * responses from `fixtures/` and makes no network call whatsoever. No key is read, no quota is
 * claimed, nothing can be spent. Every dev server, every probe and every page load in
 * development runs in this mode, so building the product costs nothing.
 *
 * `SERPAPI_MODE=live` is set by `npm run warm` and nothing else. A live answer is written to the
 * fixture set as well as the cache, so a search spent once improves the offline environment
 * permanently instead of evaporating with the process.
 *
 * If any other script, route or test can reach the network through here, that is a bug.
 */

const BASE = 'https://serpapi.com/search.json';
const TIMEOUT_MS = 15_000;
const RETRY_STATUSES = new Set([429, 500, 502, 503, 504]);

export type SerpMode = 'fixture' | 'live';

/** Anything other than an explicit "live" is fixture. Spending has to be asked for. */
export function serpMode(): SerpMode {
  return process.env.SERPAPI_MODE === 'live' ? 'live' : 'fixture';
}

export function hasSerpApiKey(): boolean {
  return Boolean(process.env.SERPAPI_API_KEY);
}

export interface SerpApiOptions {
  engine: string;
  params: Record<string, string | number | boolean | undefined>;
  /** How long an answer stays usable in the live-mode cache. */
  ttlMs: number;
  budget: RunBudget | null;
}

export interface SerpApiSuccess {
  data: Record<string, unknown>;
  checkedAt: string;
  cachedAt?: string;
  /** Where this answer came from, for the warm script's own reporting. */
  from: 'fixture' | 'cache' | 'network';
}

export async function serpApiSearch(
  options: SerpApiOptions,
): Promise<PriceLookup<SerpApiSuccess>> {
  const clean: Record<string, unknown> = { engine: options.engine };
  for (const [k, v] of Object.entries(options.params)) {
    if (v !== undefined && v !== null && v !== '') clean[k] = v;
  }
  const key = cacheKey(options.engine, clean);

  /* ---------------------------------------------------------------- fixture mode
   *
   * Returns before anything reads a key, claims a unit or opens a socket. A miss is reported as
   * a miss rather than quietly escalating to a live call — the whole point is that development
   * cannot spend, so falling through would defeat it.
   */
  if (serpMode() === 'fixture') {
    const fixture = readFixture(key);
    if (!fixture) {
      return unavailable(
        'no_fixture',
        `No recorded response for ${options.engine} with these parameters. ` +
          `Record one with: npm run warm -- --live --limit 1`,
      );
    }
    return { data: fixture.data, checkedAt: fixture.recordedAt, from: 'fixture' };
  }

  /* ---------------------------------------------------------------- live mode */

  const apiKey = process.env.SERPAPI_API_KEY;
  if (!apiKey) {
    return unavailable(
      'no_api_key',
      'SERPAPI_MODE is live but no SERPAPI_API_KEY is set.',
    );
  }

  const hit = readCache<Record<string, unknown>>(key);
  if (hit) {
    return { data: hit.value, checkedAt: hit.storedAt, cachedAt: hit.storedAt, from: 'cache' };
  }

  /*
   * Two brakes, and they fail differently on purpose. The per-run cap returns, because running
   * out mid-operation is a result the caller can work with. The monthly ceiling throws, because
   * nothing should be calling a paid API once the month is spent. Both are claimed synchronously,
   * before the request is built.
   */
  if (options.budget) {
    if (options.budget.remaining <= 0) {
      return unavailable('run_budget', 'This run has used its allowance of live price lookups.');
    }
    options.budget.spend();
  }
  claim('serpapi');

  const url = new URL(BASE);
  for (const [k, v] of Object.entries(clean)) url.searchParams.set(k, String(v));
  url.searchParams.set('api_key', apiKey);

  const attempt = async (): Promise<PriceLookup<SerpApiSuccess>> => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });

      if (!response.ok) {
        const body = await response.text().catch(() => '');
        if (RETRY_STATUSES.has(response.status)) {
          return unavailable('upstream_error', `SerpApi returned ${response.status}. Retryable.`);
        }
        return unavailable(
          response.status === 401 ? 'no_api_key' : 'bad_request',
          `SerpApi returned ${response.status}: ${body.slice(0, 160)}`,
        );
      }

      const data = (await response.json()) as Record<string, unknown>;
      if (typeof data.error === 'string') {
        return unavailable('bad_request', `SerpApi: ${data.error}`);
      }

      const checkedAt = new Date().toISOString();
      writeCache(key, data, options.ttlMs);
      // The unit is spent either way; recording it is what stops it being spent again.
      writeFixture(key, options.engine, clean, data);
      return { data, checkedAt, from: 'network' };
    } catch (err) {
      const aborted = err instanceof Error && err.name === 'AbortError';
      return unavailable(
        aborted ? 'timeout' : 'upstream_error',
        aborted
          ? `SerpApi did not answer within ${TIMEOUT_MS / 1000}s.`
          : `SerpApi request failed: ${err instanceof Error ? err.message : 'unknown'}`,
      );
    } finally {
      clearTimeout(timer);
    }
  };

  let result = await attempt();
  // One retry, and only for the statuses worth retrying. The unit is already claimed either way.
  if (isUnavailable(result) && result.unavailable === 'upstream_error') {
    await new Promise((r) => setTimeout(r, 900));
    result = await attempt();
  }

  /* SerpApi bills successful searches only, so a request that never produced an answer gives its
     unit back. Without this one flaky afternoon quietly eats a month of budget. */
  if (isUnavailable(result)) {
    options.budget?.refund();
    release('serpapi');
  }

  return result;
}

export type { Unavailable };
