import fs from 'node:fs';
import path from 'node:path';

/**
 * Quota control for SerpApi.
 *
 * The free tier is 250 searches a month, total. That is small enough that a single runaway
 * research loop, or a week of development with a dev server that restarts every save, could eat
 * the lot. So there are three independent brakes:
 *
 *  1. The provider's own account endpoint, which is the authoritative count and — importantly —
 *     is free to query. We ask it before spending, and refuse when the balance is near the floor.
 *  2. A local counter persisted to disk, as a backstop between account checks and for the case
 *     where the account endpoint is unreachable. In-memory alone was wrong: it reset on every
 *     dev-server restart, which is precisely when you most want the count to survive.
 *  3. A per-run cap, so one research call cannot make twenty lookups however confused it gets.
 *
 * Hitting any of them returns `unavailable` to the caller rather than throwing. The run then
 * falls back to web search and says so.
 */

const ACCOUNT_URL = 'https://serpapi.com/account';
/** Searches deliberately left unspent, so an accounting slip cannot take the balance to zero. */
const RESERVE_FLOOR = Number(process.env.SERPAPI_RESERVE ?? 15);
const PER_RUN_CAP = Number(process.env.PRICING_MAX_CALLS_PER_RUN ?? 4);
const ACCOUNT_TTL_MS = 60_000;

const COUNTER_FILE = process.env.PRICING_CACHE_DIR
  ? path.join(process.env.PRICING_CACHE_DIR, 'quota-counter.json')
  : null;

interface Counter {
  month: string;
  spent: number;
}

function currentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${now.getMonth()}`;
}

function readCounter(): Counter {
  const fresh: Counter = { month: currentMonth(), spent: 0 };
  if (!COUNTER_FILE || !fs.existsSync(COUNTER_FILE)) return fresh;
  try {
    const parsed = JSON.parse(fs.readFileSync(COUNTER_FILE, 'utf8')) as Counter;
    return parsed.month === fresh.month ? parsed : fresh;
  } catch {
    return fresh;
  }
}

function writeCounter(counter: Counter): void {
  if (!COUNTER_FILE) return;
  try {
    fs.mkdirSync(path.dirname(COUNTER_FILE), { recursive: true });
    fs.writeFileSync(COUNTER_FILE, JSON.stringify(counter));
  } catch {
    // The account endpoint is the real guard; losing the backstop is not fatal.
  }
}

let counter = readCounter();

/* ------------------------------------------------------------------ account */

export interface AccountStatus {
  totalSearchesLeft: number;
  thisMonthUsage: number;
  searchesPerMonth: number;
  thisHourSearches: number;
  checkedAt: string;
}

let cachedAccount: { value: AccountStatus; at: number } | null = null;

/** Free to call — it is not itself a search. */
export async function fetchAccountStatus(force = false): Promise<AccountStatus | null> {
  const apiKey = process.env.SERPAPI_API_KEY;
  if (!apiKey) return null;
  if (!force && cachedAccount && Date.now() - cachedAccount.at < ACCOUNT_TTL_MS) {
    return cachedAccount.value;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(`${ACCOUNT_URL}?api_key=${apiKey}`, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) return null;
    const data = (await response.json()) as Record<string, number>;
    const value: AccountStatus = {
      totalSearchesLeft: data.total_searches_left ?? 0,
      thisMonthUsage: data.this_month_usage ?? 0,
      searchesPerMonth: data.searches_per_month ?? 0,
      thisHourSearches: data.this_hour_searches ?? 0,
      checkedAt: new Date().toISOString(),
    };
    cachedAccount = { value, at: Date.now() };
    return value;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/* ------------------------------------------------------------------ per run */

export class RunBudget {
  private used = 0;

  constructor(private readonly cap: number = PER_RUN_CAP) {}

  get remaining(): number {
    return Math.max(0, this.cap - this.used);
  }

  get spent(): number {
    return this.used;
  }

  spend(): void {
    this.used += 1;
  }

  refund(): void {
    this.used = Math.max(0, this.used - 1);
  }
}

export type QuotaVerdict = { ok: true } | { ok: false; reason: 'quota' | 'run_budget' };

/**
 * Called immediately before a billable request. Cache hits never reach here, which is the point
 * of the cache.
 */
export async function reserve(budget: RunBudget | null): Promise<QuotaVerdict> {
  if (counter.month !== currentMonth()) counter = { month: currentMonth(), spent: 0 };

  /*
   * The slot is claimed synchronously, before any `await`.
   *
   * This matters more than it looks. The model issues tool calls in parallel batches, and they
   * are executed with Promise.all. An earlier version checked the budget, then awaited the
   * account endpoint, then incremented — so five concurrent callers all passed a check that only
   * one of them should have. A single run spent eight searches against a cap of six, which on a
   * 250-a-month budget is not a rounding error.
   */
  if (budget) {
    if (budget.remaining <= 0) return { ok: false, reason: 'run_budget' };
    budget.spend();
  }
  counter = { month: counter.month, spent: counter.spent + 1 };
  if (cachedAccount) cachedAccount.value.totalSearchesLeft -= 1;

  const release = () => {
    budget?.refund();
    counter = { month: counter.month, spent: Math.max(0, counter.spent - 1) };
    if (cachedAccount) cachedAccount.value.totalSearchesLeft += 1;
  };

  const account = await fetchAccountStatus();
  if (account && account.totalSearchesLeft <= RESERVE_FLOOR) {
    release();
    return { ok: false, reason: 'quota' };
  }
  // If the account endpoint is unreachable, fall back to the local count so we still stop.
  if (!account && counter.spent >= 250 - RESERVE_FLOOR) {
    release();
    return { ok: false, reason: 'quota' };
  }

  writeCounter(counter);
  return { ok: true };
}

export interface QuotaStatus {
  reserveFloor: number;
  perRunCap: number;
  localSpentThisMonth: number;
  account: AccountStatus | null;
}

export async function quotaStatus(): Promise<QuotaStatus> {
  return {
    reserveFloor: RESERVE_FLOOR,
    perRunCap: PER_RUN_CAP,
    localSpentThisMonth: counter.spent,
    account: await fetchAccountStatus(true),
  };
}

/** Test and probe support only. */
export function resetQuota(): void {
  counter = { month: currentMonth(), spent: 0 };
  writeCounter(counter);
  cachedAccount = null;
}
