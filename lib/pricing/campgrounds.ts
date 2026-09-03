import { randomUUID } from 'node:crypto';
import { TTL, cacheKey, readCache, writeCache } from './cache';
import {
  unavailable,
  type CampgroundQuote,
  type CampgroundResult,
  type PriceLookup,
} from './types';

/**
 * Campgrounds via Recreation.gov.
 *
 * Two endpoints, and they behave differently — I probed both:
 *  - the RIDB catalogue at ridb.recreation.gov needs a free key (401 without one), and is how you
 *    turn "Joshua Tree" into a facility id
 *  - the availability endpoint on recreation.gov itself answers with no auth at all, and returns
 *    every site's day-by-day state for a calendar month
 *
 * So the catalogue lookup degrades without a key while availability always works. Camping is the
 * cheapest way for this cohort to do a weekend, which is why it is worth having at all.
 *
 * Camping gear — where to hire a tent, stove and mat near campus and what it costs — is a
 * separate job and is deliberately not here yet.
 */

const RIDB_BASE = 'https://ridb.recreation.gov/api/v1';
const AVAILABILITY_BASE = 'https://www.recreation.gov/api/camps/availability/campground';
const TIMEOUT_MS = 12_000;
const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122 Safari/537.36';

interface RidbFacility {
  FacilityID?: string;
  FacilityName?: string;
  FacilityTypeDescription?: string;
  Reservable?: boolean;
  FacilityUseFeeDescription?: string;
  FacilityPhone?: string;
}

async function getJson(url: string, headers: Record<string, string>): Promise<unknown | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: 'application/json', 'User-Agent': USER_AGENT, ...headers },
    });
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export interface CampgroundSearchArgs {
  /** "Joshua Tree", "Zion", "Big Sur". */
  query: string;
  /** Optional: check availability for the month containing this date. */
  month?: string;
  limit?: number;
}

export async function searchCampgrounds(
  args: CampgroundSearchArgs,
): Promise<PriceLookup<CampgroundResult>> {
  const query = args.query.trim();
  if (!query) return unavailable('bad_request', 'A place name is required to find campgrounds.');

  const key = cacheKey('campgrounds', { query, month: args.month ?? '' });
  const hit = readCache<CampgroundResult>(key);
  if (hit) return hit.value;

  const apiKey = process.env.RIDB_API_KEY;
  if (!apiKey) {
    return unavailable(
      'no_api_key',
      'No RIDB_API_KEY is set, so campgrounds cannot be looked up by name. A free key comes from recreation.gov/use-our-data.',
    );
  }

  const url =
    `${RIDB_BASE}/facilities?query=${encodeURIComponent(query)}` +
    `&activity=CAMPING&limit=${args.limit ?? 6}&full=false`;
  const catalogue = (await getJson(url, { apikey: apiKey })) as
    | { RECDATA?: RidbFacility[] }
    | null;

  if (!catalogue?.RECDATA?.length) {
    return unavailable('upstream_error', `Recreation.gov returned no campgrounds for "${query}".`);
  }

  const campgrounds: CampgroundQuote[] = [];
  for (const facility of catalogue.RECDATA.slice(0, args.limit ?? 6)) {
    if (!facility.FacilityID || !facility.FacilityName) continue;
    const quote: CampgroundQuote = {
      name: facility.FacilityName,
      facilityId: facility.FacilityID,
      reservable: facility.Reservable ?? false,
      feeDescription: facility.FacilityUseFeeDescription?.slice(0, 200),
      url: `https://www.recreation.gov/camping/campgrounds/${facility.FacilityID}`,
      phone: facility.FacilityPhone,
    };

    if (args.month && quote.reservable) {
      quote.availableNights = await countAvailableNights(facility.FacilityID, args.month);
    }
    campgrounds.push(quote);
  }

  if (campgrounds.length === 0) {
    return unavailable('upstream_error', `No usable campground records for "${query}".`);
  }

  const result: CampgroundResult = {
    resultId: `cmp_${randomUUID().slice(0, 8)}`,
    checkedAt: new Date().toISOString(),
    query,
    campgrounds,
  };
  writeCache(key, result, TTL.campgrounds);
  return result;
}

/**
 * The no-auth availability endpoint. Returns one calendar month of per-site, per-day state; we
 * reduce it to "how many nights had at least one free site", which is the only part a costed
 * plan needs.
 */
async function countAvailableNights(
  facilityId: string,
  month: string,
): Promise<number | undefined> {
  const start = `${month.slice(0, 7)}-01T00:00:00.000Z`;
  const url = `${AVAILABILITY_BASE}/${facilityId}/month?start_date=${encodeURIComponent(start)}`;
  const data = (await getJson(url, {})) as
    | { campsites?: Record<string, { availabilities?: Record<string, string> }> }
    | null;
  if (!data?.campsites) return undefined;

  const freeNights = new Set<string>();
  for (const site of Object.values(data.campsites)) {
    for (const [date, state] of Object.entries(site.availabilities ?? {})) {
      if (state === 'Available') freeNights.add(date);
    }
  }
  return freeNights.size;
}
