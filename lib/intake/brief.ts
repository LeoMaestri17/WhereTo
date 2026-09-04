import type { BudgetBand } from '@/lib/domain/types';
import { addDays, isoDate, nextThanksgiving, toIsoDate } from '@/lib/util/dates';
import {
  TRIP_LENGTH_NIGHTS,
  type Companions,
  type TripBrief,
  type TripLength,
  type Vibe,
  type WhenWindow,
} from './types';

/**
 * Carrying a brief from the picker into the planner.
 *
 * The picker's whole point is that you answer the questions once. If clicking a recommendation
 * dropped you onto an idea page with the default four people and default dates, you would have
 * answered them for nothing — so the brief travels in the query string and the planner opens
 * already filled in.
 *
 * It is a query string rather than store state because the resulting URL is the thing people
 * send each other: "this is the one, look".
 */

export const EMPTY_BRIEF: TripBrief = {
  companions: 'friends',
  partySize: 4,
  length: 'weekend',
  when: 'next-2-weeks',
  budget: 'moderate',
  vibes: [],
  isOver21: false,
  hasCar: false,
  hasUsCreditCard: false,
  anythingElse: '',
};

const COMPANIONS: Companions[] = ['solo', 'partner', 'friends', 'family'];
const LENGTHS: TripLength[] = ['evening', 'day', 'weekend', 'long-weekend', 'week'];
const WHENS: WhenWindow[] = ['this-weekend', 'next-2-weeks', 'next-month', 'the-break'];
const BUDGETS: BudgetBand[] = ['shoestring', 'moderate', 'comfortable'];
const VIBES: Vibe[] = ['outdoors', 'city', 'beach', 'culture', 'nightlife', 'cheap-as-possible'];

export function encodeBrief(brief: TripBrief): string {
  const p = new URLSearchParams({
    who: brief.companions,
    n: String(brief.partySize),
    len: brief.length,
    when: brief.when,
    budget: brief.budget,
  });
  if (brief.vibes.length) p.set('vibes', brief.vibes.join('.'));
  if (brief.isOver21) p.set('over21', '1');
  if (brief.hasCar) p.set('car', '1');
  if (brief.hasUsCreditCard) p.set('card', '1');
  if (brief.anythingElse.trim()) p.set('note', brief.anythingElse.trim().slice(0, 200));
  return p.toString();
}

/**
 * Returns null when there is no brief in the URL at all, so the planner can tell "arrived from
 * the picker" apart from "arrived cold" and only show the carried-over note in the first case.
 * Anything unrecognised falls back to the default rather than throwing — a hand-edited or stale
 * link should still open a usable page.
 */
export function decodeBrief(params: URLSearchParams | null): TripBrief | null {
  if (!params || !params.get('who')) return null;

  const pick = <T extends string>(key: string, allowed: T[], fallback: T): T => {
    const raw = params.get(key);
    return allowed.includes(raw as T) ? (raw as T) : fallback;
  };

  const partySize = Number.parseInt(params.get('n') ?? '', 10);

  return {
    companions: pick('who', COMPANIONS, EMPTY_BRIEF.companions),
    partySize: Number.isFinite(partySize) ? Math.min(12, Math.max(1, partySize)) : 4,
    length: pick('len', LENGTHS, EMPTY_BRIEF.length),
    when: pick('when', WHENS, EMPTY_BRIEF.when),
    budget: pick('budget', BUDGETS, EMPTY_BRIEF.budget),
    vibes: (params.get('vibes') ?? '')
      .split('.')
      .filter((v): v is Vibe => VIBES.includes(v as Vibe)),
    isOver21: params.get('over21') === '1',
    hasCar: params.get('car') === '1',
    hasUsCreditCard: params.get('card') === '1',
    anythingElse: params.get('note') ?? '',
  };
}

/**
 * A window plus a length becomes two real dates, because every price downstream needs them.
 *
 * Departures land on a Friday wherever the length implies nights away — that is when this cohort
 * actually leaves, and a Tuesday-to-Thursday quote for "a weekend" would be a wrong number, not
 * an approximate one.
 */
export function datesFor(when: WhenWindow, length: TripLength, from = new Date()): {
  startDate: string;
  endDate: string;
} {
  const nights = TRIP_LENGTH_NIGHTS[length];

  if (when === 'the-break') {
    const thanksgiving = nextThanksgiving(from);
    const start = new Date(thanksgiving);
    start.setDate(start.getDate() - 1);
    const startIso = toIsoDate(start);
    return { startDate: startIso, endDate: addDays(startIso, Math.max(nights, 1)) };
  }

  const daysToFriday = (5 - from.getDay() + 7) % 7 || 7;
  const lead = when === 'this-weekend' ? 0 : when === 'next-2-weeks' ? 7 : 28;
  // A day trip does not need to be a Friday; anything with nights in it does.
  const offset = nights === 0 && when !== 'this-weekend' ? lead + 1 : daysToFriday + lead;
  const startIso = isoDate(offset);

  return { startDate: startIso, endDate: addDays(startIso, nights) };
}
