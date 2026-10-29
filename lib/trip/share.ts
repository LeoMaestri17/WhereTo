import { WINDOWS } from './catalogue';
import type { TripBrief } from './brief';
import type { AgeBand, PartySize } from './types';

/**
 * The trip, in the URL.
 *
 * Group trips are decided socially — somebody finds the weekend and sends it to four people, and
 * what they send has to arrive as the same trip rather than as a destination the recipient then
 * has to re-answer four questions about. So the whole brief travels in the query string, and
 * opening a shared link reproduces the exact figures the sender was looking at.
 *
 * Short keys because this gets pasted into a group chat, and total fidelity because a link that
 * drops the driver's age shows a different price to the person who received it.
 */

export interface SharedTrip {
  brief: Partial<TripBrief>;
  /** The travel option the sender had chosen, when they had changed it from the default. */
  prefer: 'drive' | 'transit' | null;
}

const AGE_CODE: Record<AgeBand, string> = {
  'under-21': 'u21',
  '21-24': '21',
  '25-plus': '25',
};

const AGE_FROM: Record<string, AgeBand> = {
  u21: 'under-21',
  '21': '21-24',
  '25': '25-plus',
};

export function encodeTrip(brief: TripBrief, prefer: 'drive' | 'transit' | null): string {
  const p = new URLSearchParams();
  p.set('n', String(brief.partySize));
  p.set('d', brief.driver.hasLicence && brief.driver.ageBand ? AGE_CODE[brief.driver.ageBand] : 'no');
  if (brief.windowId) p.set('w', brief.windowId);
  if (brief.budgetPerPerson) p.set('b', String(brief.budgetPerPerson));
  if (prefer) p.set('m', prefer);
  return p.toString();
}

/**
 * Anything unrecognised is dropped rather than defaulted loudly.
 *
 * A link that has been edited, truncated by a chat client, or built by an older version of this
 * function must still open a working page — it simply falls back to whatever the recipient's own
 * control strip says for the parts it could not read.
 */
export function decodeTrip(params: URLSearchParams): SharedTrip {
  const brief: Partial<TripBrief> = {};

  const n = Number(params.get('n'));
  if (Number.isInteger(n) && n >= 1 && n <= 5) brief.partySize = n as PartySize;

  const d = params.get('d');
  if (d === 'no') brief.driver = { hasLicence: false, ageBand: null };
  else if (d && AGE_FROM[d]) brief.driver = { hasLicence: true, ageBand: AGE_FROM[d] };

  const w = params.get('w');
  if (w && WINDOWS.some((x) => x.id === w)) brief.windowId = w;

  const b = Number(params.get('b'));
  if (Number.isFinite(b) && b > 0) brief.budgetPerPerson = b;

  const m = params.get('m');
  const prefer = m === 'drive' || m === 'transit' ? m : null;

  return { brief, prefer };
}
