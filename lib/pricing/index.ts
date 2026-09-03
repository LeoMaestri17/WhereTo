import { searchCampgrounds } from './campgrounds';
import { searchFlights } from './flights';
import { searchHotels } from './hotels';
import { hasSerpApiKey } from './serpapi';
import type { PricingCapability } from './types';

/**
 * What pricing this run can actually do.
 *
 * This descriptor goes into the research prompt so the model knows what to rely on, and into the
 * UI so the user does. It is the difference between "we could not price this" and silently
 * showing a guess as though it were checked.
 */
export function pricingCapability(): PricingCapability {
  const serp = hasSerpApiKey();
  const ridb = Boolean(process.env.RIDB_API_KEY);

  const missing: string[] = [];
  if (!serp) missing.push('flights and hotels (no SERPAPI_API_KEY)');
  if (!ridb) missing.push('campgrounds by name (no RIDB_API_KEY)');

  return {
    flights: serp,
    hotels: serp,
    campgrounds: ridb,
    note:
      missing.length === 0
        ? 'Live pricing is available for flights, hotels and campgrounds.'
        : `Live pricing is unavailable for ${missing.join(', ')}. Those costs come from web search and are labelled as estimates.`,
  };
}

export { searchFlights, searchHotels, searchCampgrounds, hasSerpApiKey };
export { verifyLinks, summariseLinks, type LinkCheck, type LinkStatus } from './links';
export { quotaStatus, RunBudget, resetQuota } from './quota';
export { clearPricingCache } from './cache';
export * from './types';
