import type { IntakeBrief } from './types';

/**
 * The brief, kept across a refresh.
 *
 * This is a `useSyncExternalStore` source rather than an effect that reads storage into state.
 * The difference matters on the server: `getServerSnapshot` returns null, so the markup rendered
 * on the server is the question flow, and React swaps in the saved results after hydration
 * without a flash of the wrong screen and without a hydration mismatch.
 *
 * Session storage, not local: answers are about one trip you are planning now. Coming back a
 * fortnight later and being shown last fortnight's dates would be worse than being asked again.
 */

const KEY = 'whereto.brief.v1';

let cached: IntakeBrief | null | undefined;
const listeners = new Set<() => void>();

function read(): IntakeBrief | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as IntakeBrief) : null;
  } catch {
    // A private window, or a browser told to block site data. Starting fresh is the right answer.
    return null;
  }
}

export function subscribeToBrief(onChange: () => void): () => void {
  listeners.add(onChange);
  return () => listeners.delete(onChange);
}

/** Must return a stable reference between calls, or React re-renders forever. */
export function getBriefSnapshot(): IntakeBrief | null {
  if (cached === undefined) cached = read();
  return cached;
}

export function getBriefServerSnapshot(): IntakeBrief | null {
  return null;
}

export function saveBrief(brief: IntakeBrief | null): void {
  cached = brief;
  try {
    if (brief) sessionStorage.setItem(KEY, JSON.stringify(brief));
    else sessionStorage.removeItem(KEY);
  } catch {
    // Not being able to remember is survivable — the answers are still in the store above.
  }
  for (const listener of listeners) listener();
}
