import { WINDOWS } from './catalogue';
import type { AgeBand, Driver, PartySize } from './types';

/**
 * What the control strip knows, and how it survives a page change.
 *
 * A `useSyncExternalStore` source rather than a context with an effect that reads storage into
 * state. On the server `getServerSnapshot` returns null, so the markup rendered there is the
 * default and React swaps in the saved answers after hydration — no flash of the wrong prices and
 * no hydration mismatch. A context would also work, but every surface would then need a provider
 * boundary for state that is genuinely global.
 *
 * Session storage, not local. These answers are about one trip being planned now; coming back a
 * fortnight later to last fortnight's dates would be worse than being asked again. The one thing
 * worth remembering longer is the departure city, and there is only one of those.
 */

/**
 * Where the trip starts.
 *
 * A single-member union rather than a hardcoded constant, so adding a second city later is a data
 * change and not a refactor of everything that reads the brief. There is no geolocation call: it
 * would ask for a permission in order to arrive at the only answer available.
 */
export type OriginId = 'la';

export const ORIGINS: { id: OriginId; name: string; detail: string }[] = [
  { id: 'la', name: 'Los Angeles', detail: 'LAX, Union Station and the freeways out' },
];

export interface TripBrief {
  origin: OriginId;
  partySize: PartySize;
  driver: Driver;
  /** Null when no dates are chosen yet. The board then prices the cheapest warmed window. */
  windowId: string | null;
  /** Null when no budget is set. Never a filter that hides things — only a flag. */
  budgetPerPerson: number | null;
}

export const DEFAULT_BRIEF: TripBrief = {
  origin: 'la',
  partySize: 4,
  driver: { hasLicence: false, ageBand: null },
  windowId: null,
  budgetPerPerson: null,
};

const KEY = 'whereto.brief.v4';

let cached: TripBrief | null | undefined;
const listeners = new Set<() => void>();

function read(): TripBrief | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<TripBrief>;

    // A hand-edited or stale value must not crash a page. Anything unrecognised falls back.
    const windowId =
      parsed.windowId && WINDOWS.some((w) => w.id === parsed.windowId) ? parsed.windowId : null;

    return {
      origin: 'la',
      partySize: (parsed.partySize ?? DEFAULT_BRIEF.partySize) as PartySize,
      driver: parsed.driver ?? DEFAULT_BRIEF.driver,
      windowId,
      budgetPerPerson:
        typeof parsed.budgetPerPerson === 'number' && parsed.budgetPerPerson > 0
          ? parsed.budgetPerPerson
          : null,
    };
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
export function getBriefSnapshot(): TripBrief | null {
  if (cached === undefined) cached = read();
  return cached;
}

export function getBriefServerSnapshot(): TripBrief | null {
  return null;
}

export function saveBrief(brief: TripBrief): void {
  cached = brief;
  try {
    sessionStorage.setItem(KEY, JSON.stringify(brief));
  } catch {
    // Not being able to remember is survivable; the answers are still in the store above.
  }
  for (const listener of listeners) listener();
}

/* ------------------------------------------------------------------ wording */

export function describeParty(brief: TripBrief): string {
  return `${brief.partySize} ${brief.partySize === 1 ? 'person' : 'people'}`;
}

export function describeDriver(driver: Driver): string {
  if (!driver.hasLicence) return 'nobody drives';
  const labels: Record<AgeBand, string> = {
    'under-21': 'driver under 21',
    '21-24': 'driver 21 to 24',
    '25-plus': 'driver 25 or over',
  };
  return driver.ageBand ? labels[driver.ageBand] : 'nobody drives';
}

export function describeWindow(windowId: string | null): string {
  if (!windowId) return 'Any weekend';
  return WINDOWS.find((w) => w.id === windowId)?.label ?? 'Any weekend';
}

export function describeBudget(budget: number | null): string {
  return budget === null ? 'No budget set' : `Under $${budget} each`;
}
