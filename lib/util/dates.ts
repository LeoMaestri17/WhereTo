/**
 * Every seed date is relative to the moment the demo data is generated, so the app is always
 * mid-semester: deadlines are counting down, some trips have already run, and nothing needs
 * re-seeding to stay plausible.
 */

export const DAY_MS = 86_400_000;

export function daysFromNow(days: number, hour = 9, minute = 0): Date {
  const d = new Date(Date.now() + days * DAY_MS);
  d.setHours(hour, minute, 0, 0);
  return d;
}

export function isoAt(days: number, hour = 9, minute = 0): string {
  return daysFromNow(days, hour, minute).toISOString();
}

/** Calendar date only, no time — used for trip start/end dates. */
export function isoDate(days: number): string {
  return toIsoDate(daysFromNow(days, 12));
}

export function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function parseIsoDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1, 12);
}

export function addDays(iso: string, days: number): string {
  const d = parseIsoDate(iso);
  d.setDate(d.getDate() + days);
  return toIsoDate(d);
}

export function daysBetween(startIso: string, endIso: string): number {
  return Math.round(
    (parseIsoDate(endIso).getTime() - parseIsoDate(startIso).getTime()) / DAY_MS,
  );
}

/**
 * US Thanksgiving is the fourth Thursday of November. Break trips prefill to the Wednesday
 * before through the Sunday after, which is the window the university actually closes for.
 */
export function nextThanksgiving(from: Date = new Date()): Date {
  const year =
    from.getMonth() > 10 || (from.getMonth() === 10 && from.getDate() > 28)
      ? from.getFullYear() + 1
      : from.getFullYear();
  const nov1 = new Date(year, 10, 1, 12);
  const firstThursdayOffset = (4 - nov1.getDay() + 7) % 7;
  return new Date(year, 10, 1 + firstThursdayOffset + 21, 12);
}

const WEEKDAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];
const MONTH_LONG = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/** '14 Nov' — the form a European exchange student writes without thinking. */
export function formatDay(iso: string): string {
  const d = parseIsoDate(iso.slice(0, 10));
  return `${d.getDate()} ${MONTH[d.getMonth()]}`;
}

/** 'Fri 14 Nov' */
export function formatDayWithWeekday(iso: string): string {
  const d = parseIsoDate(iso.slice(0, 10));
  return `${WEEKDAY[d.getDay()]} ${d.getDate()} ${MONTH[d.getMonth()]}`;
}

/** '14–16 Nov' or '30 Nov – 2 Dec' */
export function formatDateRange(startIso: string, endIso?: string): string {
  if (!endIso || endIso === startIso) return formatDay(startIso);
  const a = parseIsoDate(startIso.slice(0, 10));
  const b = parseIsoDate(endIso.slice(0, 10));
  if (a.getMonth() === b.getMonth()) {
    return `${a.getDate()}\u2013${b.getDate()} ${MONTH[a.getMonth()]}`;
  }
  return `${a.getDate()} ${MONTH[a.getMonth()]} \u2013 ${b.getDate()} ${MONTH[b.getMonth()]}`;
}

/** '7:10pm' */
export function formatTime(isoDateTime: string): string {
  const d = new Date(isoDateTime);
  let h = d.getHours();
  const m = d.getMinutes();
  const suffix = h >= 12 ? 'pm' : 'am';
  h = h % 12 || 12;
  return m === 0 ? `${h}${suffix}` : `${h}:${String(m).padStart(2, '0')}${suffix}`;
}

/** '12 October 2026' — used for the 'researched at' stamp, where precision reassures. */
export function formatLongDate(isoDateTime: string): string {
  const d = new Date(isoDateTime);
  return `${d.getDate()} ${MONTH_LONG[d.getMonth()]} ${d.getFullYear()}`;
}

export interface Countdown {
  totalMs: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  passed: boolean;
}

export function countdownTo(isoDateTime: string, now = Date.now()): Countdown {
  const totalMs = new Date(isoDateTime).getTime() - now;
  const clamped = Math.max(0, totalMs);
  return {
    totalMs,
    days: Math.floor(clamped / DAY_MS),
    hours: Math.floor((clamped % DAY_MS) / 3_600_000),
    minutes: Math.floor((clamped % 3_600_000) / 60_000),
    seconds: Math.floor((clamped % 60_000) / 1000),
    passed: totalMs <= 0,
  };
}

/**
 * Deadlines are the thing that makes people act, so they are written the way a person would
 * say them out loud rather than as a raw timestamp.
 */
export function formatCountdown(c: Countdown): string {
  if (c.passed) return 'Sign-ups closed';
  if (c.days >= 2) return `${c.days} days left to join`;
  if (c.days === 1) return `1 day ${c.hours}h left to join`;
  if (c.hours >= 1) return `${c.hours}h ${c.minutes}m left to join`;
  if (c.minutes >= 1) return `${c.minutes}m ${c.seconds}s left to join`;
  return `${c.seconds}s left to join`;
}

/** 'in 3 days' / 'today' / '2 weeks ago' */
export function relativeDay(iso: string, now = new Date()): string {
  const target = parseIsoDate(iso.slice(0, 10));
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12);
  const diff = Math.round((target.getTime() - today.getTime()) / DAY_MS);
  if (diff === 0) return 'today';
  if (diff === 1) return 'tomorrow';
  if (diff === -1) return 'yesterday';
  if (diff > 0 && diff < 7) return `in ${diff} days`;
  if (diff > 0 && diff < 14) return 'next week';
  if (diff > 0) return `in ${Math.round(diff / 7)} weeks`;
  if (diff > -7) return `${-diff} days ago`;
  if (diff > -14) return 'last week';
  return `${Math.round(-diff / 7)} weeks ago`;
}
