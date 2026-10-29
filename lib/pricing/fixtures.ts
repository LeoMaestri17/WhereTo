import fs from 'node:fs';
import path from 'node:path';

/**
 * Recorded SerpApi responses, committed to the repository.
 *
 * This is what makes development free. Every dev server, every probe and every page load in
 * development reads from here and makes no network call at all, so the UI and the logic can be
 * built and rebuilt as many times as it takes without touching the 250-a-month budget.
 *
 * The rule that keeps it useful: **a live run writes here as well as to the cache.** Spending a
 * search must permanently improve the offline environment rather than evaporating into one
 * session. The fixture set only ever grows, and it grows out of real runs rather than being
 * hand-written — a hand-written fixture proves the code parses a shape we invented, which is the
 * one thing worth not knowing.
 *
 * Raw responses live here and are committed, unlike the normalised cache in data/cache. They
 * carry `search_metadata.json_endpoint`, a serpapi.com URL tied to the account, so the recorder
 * strips that before writing.
 */

/** A function, not a constant: the probes redirect this to a scratch directory before the first
 *  call, so a stubbed response can never be written into the committed fixture set. */
function dir(): string {
  return process.env.WHERETO_FIXTURE_DIR ?? path.join(process.cwd(), 'fixtures');
}

export interface Fixture {
  engine: string;
  /** The query that produced it, so a human can see what this file is. */
  params: Record<string, unknown>;
  /** ISO datetime the live call actually ran. */
  recordedAt: string;
  data: Record<string, unknown>;
}

function fileFor(key: string): string {
  return path.join(dir(), `${key.replace(":", "_")}.json`);
}

export function readFixture(key: string): Fixture | null {
  const file = fileFor(key);
  if (!fs.existsSync(file)) return null;
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8')) as Fixture;
  } catch {
    // A corrupt fixture is a broken offline environment, not a pricing failure. Say so loudly
    // rather than silently behaving as though the recording never happened.
    console.warn(`[fixtures] ${path.basename(file)} could not be parsed and was ignored.`);
    return null;
  }
}

/**
 * Account-tied URLs are stripped on the way in. They identify the key holder, they are useless
 * offline, and they have no business in a committed file.
 */
function scrub(data: Record<string, unknown>): Record<string, unknown> {
  const copy: Record<string, unknown> = { ...data };
  delete copy.search_metadata;
  delete copy.serpapi_pagination;
  return copy;
}

export function writeFixture(
  key: string,
  engine: string,
  params: Record<string, unknown>,
  data: Record<string, unknown>,
): void {
  try {
    fs.mkdirSync(dir(), { recursive: true });
    const fixture: Fixture = {
      engine,
      params: { ...params, api_key: undefined },
      recordedAt: new Date().toISOString(),
      data: scrub(data),
    };
    fs.writeFileSync(fileFor(key), `${JSON.stringify(fixture, null, 2)}\n`);
  } catch (err) {
    // Losing the recording does not fail the lookup, but it does waste the search, so it is
    // worth a line on the console rather than a silent catch.
    console.warn(`[fixtures] could not record ${key}: ${err instanceof Error ? err.message : err}`);
  }
}

export function fixtureCount(): number {
  try {
    return fs.readdirSync(dir()).filter((f) => f.endsWith('.json')).length;
  } catch {
    return 0;
  }
}
