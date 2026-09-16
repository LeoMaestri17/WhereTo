import type { AgeBand, Driver, PartySize, WeekendId } from './model';
import { WEEKENDS } from './model';

/**
 * The survey's answers, and how they survive a page change.
 *
 * A `useSyncExternalStore` source rather than an effect that reads storage into state: on the
 * server `getServerSnapshot` returns null, so the markup rendered there is the unanswered state
 * and React swaps in the saved answers after hydration — no flash of the wrong screen and no
 * hydration mismatch.
 *
 * Session storage, not local. These answers are about one trip being planned now; coming back a
 * fortnight later to last fortnight's dates would be worse than being asked again.
 */

/**
 * Where the trip starts.
 *
 * A single-member union rather than a boolean or a hardcoded constant, so that adding a second
 * city later is a data change and not a refactor of everything that reads the brief.
 */
export type OriginId = 'la';

export const ORIGINS: { id: OriginId; name: string; detail: string }[] = [
  { id: 'la', name: 'Los Angeles', detail: 'LAX, Union Station and the freeways out' },
];

export interface Brief {
  origin: OriginId;
  weekend: WeekendId;
  partySize: PartySize;
  driver: Driver;
}

export const DEFAULT_BRIEF: Brief = {
  origin: 'la',
  weekend: WEEKENDS[0].id,
  partySize: 2,
  driver: { hasLicence: false, ageBand: null },
};

const KEY = 'whereto.brief.v3';

let cached: Brief | null | undefined;
const listeners = new Set<() => void>();

function read(): Brief | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Brief;
    // A hand-edited or stale value should not crash the page.
    if (!WEEKENDS.some((w) => w.id === parsed.weekend)) return null;
    // A brief saved before the origin field existed would render an undefined city.
    return parsed.origin ? parsed : { ...parsed, origin: 'la' };
  } catch {
    // A private window, or a browser told to block site data. Starting fresh is right.
    return null;
  }
}

export function subscribeToBrief(onChange: () => void): () => void {
  listeners.add(onChange);
  return () => listeners.delete(onChange);
}

/** Must return a stable reference between calls, or React re-renders forever. */
export function getBriefSnapshot(): Brief | null {
  if (cached === undefined) cached = read();
  return cached;
}

export function getBriefServerSnapshot(): Brief | null {
  return null;
}

export function saveBrief(brief: Brief | null): void {
  cached = brief;
  try {
    if (brief) sessionStorage.setItem(KEY, JSON.stringify(brief));
    else sessionStorage.removeItem(KEY);
  } catch {
    // Not being able to remember is survivable; the answers are still in the store above.
  }
  for (const listener of listeners) listener();
}

export function describeDriver(driver: Driver): string {
  if (!driver.hasLicence) return 'no licence';
  const labels: Record<AgeBand, string> = {
    'under-21': 'driver under 21',
    '21-24': 'driver 21 to 24',
    '25-plus': 'driver 25 or over',
  };
  return driver.ageBand ? labels[driver.ageBand] : 'no licence';
}
