import { TTL, cacheKey, readCache, writeCache } from './cache';

/**
 * Link verification.
 *
 * A plan full of dead booking links is worse than no links, so every URL is requested before the
 * plan is rendered. The trap is that booking sites — Expedia, Booking.com, most airlines — answer
 * a non-browser client with 403. A naive checker marks those dead and makes a perfectly correct
 * plan look broken, which is a worse failure than not checking at all.
 *
 * Hence five states rather than two: only a genuine 404/410 or a DNS failure is `dead`.
 */

export type LinkStatus = 'ok' | 'blocked' | 'dead' | 'timeout' | 'unchecked';

export interface LinkCheck {
  url: string;
  status: LinkStatus;
  checkedAt: string;
  httpStatus?: number;
}

const TIMEOUT_MS = 6_000;
const MAX_URLS = 40;
const CONCURRENCY = 8;
const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122 Safari/537.36';

async function checkOne(url: string): Promise<LinkCheck> {
  const key = cacheKey('link', { url });
  const hit = readCache<LinkCheck>(key);
  if (hit) return hit.value;

  const checkedAt = new Date().toISOString();
  const attempt = async (method: 'HEAD' | 'GET'): Promise<Response | null> => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      return await fetch(url, {
        method,
        redirect: 'follow',
        signal: controller.signal,
        headers: {
          'User-Agent': USER_AGENT,
          Accept: 'text/html,application/xhtml+xml',
          ...(method === 'GET' ? { Range: 'bytes=0-0' } : {}),
        },
      });
    } catch {
      return null;
    } finally {
      clearTimeout(timer);
    }
  };

  let result: LinkCheck;
  try {
    new URL(url);
  } catch {
    result = { url, status: 'dead', checkedAt };
    writeCache(key, result, TTL.links);
    return result;
  }

  let response = await attempt('HEAD');
  // Plenty of servers refuse HEAD outright; a ranged GET is the polite second try.
  if (!response || response.status === 405 || response.status === 501) {
    response = await attempt('GET');
  }

  if (!response) {
    result = { url, status: 'timeout', checkedAt };
  } else if (response.status === 404 || response.status === 410) {
    result = { url, status: 'dead', checkedAt, httpStatus: response.status };
  } else if (response.status === 401 || response.status === 403 || response.status === 429) {
    // The page is almost certainly fine; it just will not talk to us.
    result = { url, status: 'blocked', checkedAt, httpStatus: response.status };
  } else if (response.status >= 500) {
    result = { url, status: 'blocked', checkedAt, httpStatus: response.status };
  } else {
    result = { url, status: 'ok', checkedAt, httpStatus: response.status };
  }

  writeCache(key, result, TTL.links);
  return result;
}

export async function verifyLinks(urls: string[]): Promise<Map<string, LinkCheck>> {
  const unique = [...new Set(urls.filter(Boolean))].slice(0, MAX_URLS);
  const results = new Map<string, LinkCheck>();

  for (let i = 0; i < unique.length; i += CONCURRENCY) {
    const batch = unique.slice(i, i + CONCURRENCY);
    const checks = await Promise.all(batch.map(checkOne));
    for (const check of checks) results.set(check.url, check);
  }

  return results;
}

export function summariseLinks(checks: Iterable<LinkCheck>): {
  ok: number;
  blocked: number;
  dead: number;
  timeout: number;
  total: number;
} {
  const summary = { ok: 0, blocked: 0, dead: 0, timeout: 0, total: 0 };
  for (const check of checks) {
    summary.total += 1;
    if (check.status === 'ok') summary.ok += 1;
    else if (check.status === 'blocked') summary.blocked += 1;
    else if (check.status === 'dead') summary.dead += 1;
    else if (check.status === 'timeout') summary.timeout += 1;
  }
  return summary;
}
