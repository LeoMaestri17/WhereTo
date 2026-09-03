import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Caching exists here for one reason: the SerpApi free tier is 250 searches a month, and a
 * single research run spends three to six of them. Without a cache, developing this feature
 * would exhaust a month's budget in an afternoon.
 *
 * Two layers:
 *  - an in-process Map, which is enough in production
 *  - an optional on-disk cache for development, because the dev server restarts constantly and
 *    module memory dies with it
 *
 * MOCK BOUNDARY: a real deployment would put this in Redis with the same interface.
 */

interface Entry {
  value: unknown;
  storedAt: number;
  expiresAt: number;
}

const memory = new Map<string, Entry>();

const DISK_DIR = process.env.PRICING_CACHE_DIR;

export function cacheKey(tool: string, args: Record<string, unknown>): string {
  // Sorted keys so argument order never produces a different key for the same query.
  const normalised = Object.keys(args)
    .sort()
    .filter((k) => args[k] !== undefined && args[k] !== null && args[k] !== '')
    .map((k) => `${k}=${String(args[k]).trim().toLowerCase()}`)
    .join('&');
  return `${tool}:${createHash('sha1').update(normalised).digest('hex').slice(0, 16)}`;
}

function diskPath(key: string): string | null {
  if (!DISK_DIR) return null;
  return path.join(DISK_DIR, `${key.replace(':', '_')}.json`);
}

export interface CacheHit<T> {
  value: T;
  storedAt: string;
}

export function readCache<T>(key: string): CacheHit<T> | null {
  const now = Date.now();

  const hit = memory.get(key);
  if (hit && hit.expiresAt > now) {
    return { value: hit.value as T, storedAt: new Date(hit.storedAt).toISOString() };
  }
  if (hit) memory.delete(key);

  const file = diskPath(key);
  if (file && fs.existsSync(file)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(file, 'utf8')) as Entry;
      if (parsed.expiresAt > now) {
        memory.set(key, parsed);
        return { value: parsed.value as T, storedAt: new Date(parsed.storedAt).toISOString() };
      }
      fs.unlinkSync(file);
    } catch {
      // A corrupt cache file is not worth failing a research run over.
    }
  }

  return null;
}

export function writeCache(key: string, value: unknown, ttlMs: number): void {
  const entry: Entry = { value, storedAt: Date.now(), expiresAt: Date.now() + ttlMs };
  memory.set(key, entry);

  const file = diskPath(key);
  if (!file) return;
  try {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, JSON.stringify(entry));
  } catch {
    // Disk cache is a development convenience; failing to write it is not an error.
  }
}

/**
 * TTLs are set by how fast each thing actually moves. Google Hotels' own cache expires after an
 * hour, so caching longer than that would serve staler data than the provider itself would.
 */
export const TTL = {
  flights: 6 * 60 * 60 * 1000,
  hotels: 60 * 60 * 1000,
  campgrounds: 7 * 24 * 60 * 60 * 1000,
  links: 24 * 60 * 60 * 1000,
} as const;

export function clearPricingCache(): void {
  memory.clear();
}
