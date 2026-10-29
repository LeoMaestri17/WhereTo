import raw from '@/data/cache/quotes.json';

/**
 * The committed price cache — the only thing a page load is allowed to read.
 *
 * Deliberately a single JSON file that is `import`ed rather than a directory read with `fs`. An
 * import is bundled at build time, so it works unchanged on Vercel, needs no filesystem tracing,
 * and cannot accidentally become a runtime read that misses and tempts someone into a live call.
 * At twenty-odd entries the size is irrelevant.
 *
 * It holds normalised quotes, not raw provider responses. Raw SerpApi JSON is hundreds of
 * itineraries deep and carries `search_metadata.json_endpoint` — a URL tied to the account — so
 * committing it would be both enormous and careless. The raw responses stay in the gitignored
 * `.pricing-cache/` where the warm script can reuse them without re-spending.
 *
 * MOCK BOUNDARY: nothing in here is estimated. Every figure was returned by the named provider
 * for the dates and occupancy in `searchedFor`, and `fetchedAt` says when. A miss returns null, and the
 * caller shows an honest empty state — it never falls through to a live lookup.
 */

export interface CachedFlight {
  airline: string;
  flightNumber: string;
  stops: number;
  durationMinutes: number;
  /** What the provider charged for one seat. */
  perPersonUsd: number;
  bookingLink?: string;
}

export interface CachedStay {
  name: string;
  type: string;
  ratePerNightUsd: number | null;
  /** The whole stay for ONE room at the occupancy in `searchedFor`. Multiply by rooms, never by people. */
  totalRateUsd: number | null;
  rating: number | null;
  link?: string;
}

interface Common {
  key: string;
  destination: string;
  /** The outbound date, which doubles as the window id: "2026-11-06". */
  window: string;
  provider: string;
  /** ISO datetime the provider actually answered. */
  fetchedAt: string;
  /** What was searched for, in words, for the line that explains the number. */
  searchedFor: string;
}

export type QuoteEntry =
  | (Common & {
      kind: 'flights';
      originAirport: string;
      destinationAirport: string;
      outboundDate: string;
      returnDate: string;
      adults: number;
      flights: CachedFlight[];
    })
  | (Common & {
      kind: 'stays';
      query: string;
      checkInDate: string;
      checkOutDate: string;
      /** Adults in ONE room. Google prices a room at a time; the group's room count is ours. */
      adultsPerRoom: number;
      stays: CachedStay[];
    });

export interface QuoteCache {
  version: number;
  /** ISO datetime of the last `npm run warm`, or null if it has never run. */
  warmedAt: string | null;
  entries: Record<string, QuoteEntry>;
}

const cache = raw as unknown as QuoteCache;

export function quoteKey(destination: string, window: string, kind: 'flights' | 'stays'): string {
  return `${destination}:${window}:${kind}`;
}

/** Null on a miss. There is no second place to look, and that is the design. */
export function getQuote(
  destination: string,
  window: string,
  kind: 'flights',
): Extract<QuoteEntry, { kind: 'flights' }> | null;
export function getQuote(
  destination: string,
  window: string,
  kind: 'stays',
): Extract<QuoteEntry, { kind: 'stays' }> | null;
export function getQuote(
  destination: string,
  window: string,
  kind: 'flights' | 'stays',
): QuoteEntry | null {
  return cache.entries[quoteKey(destination, window, kind)] ?? null;
}

/** Every window warmed for a destination, soonest first. Drives the calendar view. */
export function windowsFor(destination: string, kind: 'flights' | 'stays'): QuoteEntry[] {
  return Object.values(cache.entries)
    .filter((e) => e.destination === destination && e.kind === kind)
    .sort((a, b) => a.window.localeCompare(b.window));
}

export function allEntries(): QuoteEntry[] {
  return Object.values(cache.entries);
}

export function warmedAt(): string | null {
  return cache.warmedAt;
}

/* ------------------------------------------------------------------ freshness */

/**
 * How old a figure is, in the words the interface uses.
 *
 * This is the product's honesty feature and it gets stated plainly, not buried. "Checked 3 days
 * ago" next to a price is worth more than a fresher number nobody can audit.
 */
export function freshness(fetchedAt: string, now = new Date()): { days: number; label: string } {
  const then = new Date(fetchedAt).getTime();
  if (!Number.isFinite(then)) return { days: Number.POSITIVE_INFINITY, label: 'not checked' };

  const hours = Math.floor((now.getTime() - then) / 3_600_000);
  const days = Math.floor(hours / 24);

  if (hours < 1) return { days: 0, label: 'checked just now' };
  if (hours < 24) return { days: 0, label: `checked ${hours} ${hours === 1 ? 'hour' : 'hours'} ago` };
  if (days === 1) return { days, label: 'checked yesterday' };
  return { days, label: `checked ${days} days ago` };
}

export interface CacheStatus {
  entries: number;
  destinations: number;
  warmedAt: string | null;
  /** The staleness the UI should own up to: the age of the oldest figure on the board. */
  oldestDays: number | null;
}

export function cacheStatus(now = new Date()): CacheStatus {
  const entries = allEntries();
  const ages = entries.map((e) => freshness(e.fetchedAt, now).days).filter(Number.isFinite);
  return {
    entries: entries.length,
    destinations: new Set(entries.map((e) => e.destination)).size,
    warmedAt: cache.warmedAt,
    oldestDays: ages.length ? Math.max(...ages) : null,
  };
}
