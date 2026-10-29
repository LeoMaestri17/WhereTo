import fs from 'node:fs';
import path from 'node:path';

/**
 * The hard budget guard.
 *
 * Two paid APIs, both on free or near-free tiers, and both small enough that one runaway loop
 * costs a month. SerpApi is 250 searches a month; the Anthropic credit is a few dollars. So there
 * is exactly one way to spend either, and it is this module.
 *
 * **Over the ceiling throws.** Everything else in the pricing layer returns an `Unavailable` and
 * degrades, because a run that loses one price source should carry on rather than collapse. Being
 * over budget is not that kind of failure: nothing should be calling a paid API at that point, so
 * a quiet `unavailable` would hide a bug rather than report one. The throw is the loud stop, and
 * it happens before the request is built.
 *
 * The counter is committed to the repo at `data/usage.json`. That reads oddly until you notice
 * where quota is legitimately spent: a `npm run warm` on a developer's machine, deliberately, and
 * nowhere else. Those runs commit their counter along with the prices they fetched. Vercel's
 * filesystem is read-only at runtime, so a write there fails — `usageReport().persisted` says so
 * rather than letting the count silently reset, and `fetchSerpApiAccount()` is the authoritative
 * figure when it matters.
 */

export type Api = 'serpapi' | 'anthropic';

const DEFAULT_CEILING: Record<Api, number> = { serpapi: 200, anthropic: 800 };

/** A function, not a constant: the probes set the env var before the first call. */
function usageFile(): string {
  return process.env.WHERETO_USAGE_FILE ?? path.join(process.cwd(), 'data', 'usage.json');
}

export function ceiling(api: Api): number {
  const raw =
    api === 'serpapi' ? process.env.SERPAPI_MONTHLY_MAX : process.env.ANTHROPIC_MONTHLY_MAX;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_CEILING[api];
}

/**
 * UTC, and zero-padded. The previous counter used `getMonth()` raw and wrote "2026-8" for
 * September, which is both off by one and unsortable.
 */
export function monthKey(now = new Date()): string {
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
}

export interface Usage {
  month: string;
  serpapi: number;
  anthropic: number;
}

let state: Usage | null = null;
let persisted = true;

function fresh(): Usage {
  return { month: monthKey(), serpapi: 0, anthropic: 0 };
}

/** Rolls the month on read, so a counter left over from last month never blocks this one. */
function load(): Usage {
  if (state && state.month === monthKey()) return state;

  if (state) {
    state = fresh();
    save();
    return state;
  }

  try {
    const parsed = JSON.parse(fs.readFileSync(usageFile(), 'utf8')) as Partial<Usage>;
    state =
      parsed.month === monthKey()
        ? { month: parsed.month, serpapi: parsed.serpapi ?? 0, anthropic: parsed.anthropic ?? 0 }
        : fresh();
  } catch {
    // Absent or unreadable. Starting the month at zero is the only safe reading, and the
    // provider's own account endpoint is the backstop against that being wrong.
    state = fresh();
  }
  return state;
}

function save(): void {
  if (!state) return;
  try {
    fs.mkdirSync(path.dirname(usageFile()), { recursive: true });
    fs.writeFileSync(usageFile(), `${JSON.stringify(state, null, 2)}\n`);
    persisted = true;
  } catch {
    persisted = false;
  }
}

export class BudgetExceededError extends Error {
  constructor(
    readonly api: Api,
    readonly spent: number,
    readonly limit: number,
  ) {
    super(
      `${api}: the monthly budget is spent — ${spent} of ${limit} used in ${monthKey()}. ` +
        'No request was made. Raise the ceiling in .env.local or wait for the month to roll.',
    );
    this.name = 'BudgetExceededError';
  }
}

/**
 * Claim `n` units of this month's budget, or throw.
 *
 * Synchronous all the way through, and that is the point rather than an accident. An earlier
 * version checked the budget, awaited the provider's account endpoint, then incremented — so five
 * concurrent callers all passed a check that only one of them should have, and a single run spent
 * eight searches against a cap of six. Nothing may await between the check and the increment.
 */
export function claim(api: Api, n = 1): void {
  const usage = load();
  const limit = ceiling(api);
  if (usage[api] + n > limit) throw new BudgetExceededError(api, usage[api], limit);
  usage[api] += n;
  save();
}

/** Give the units back when the request never happened — a timeout, a 500, a refused connection. */
export function release(api: Api, n = 1): void {
  const usage = load();
  usage[api] = Math.max(0, usage[api] - n);
  save();
}

export function remaining(api: Api): number {
  return Math.max(0, ceiling(api) - load()[api]);
}

export interface BudgetReport {
  month: string;
  serpapi: { spent: number; ceiling: number; remaining: number };
  anthropic: { spent: number; ceiling: number; remaining: number };
  /** False once a write has failed — a read-only filesystem, so the count is in memory only. */
  persisted: boolean;
  file: string;
}

export function usageReport(): BudgetReport {
  const usage = load();
  return {
    month: usage.month,
    serpapi: { spent: usage.serpapi, ceiling: ceiling('serpapi'), remaining: remaining('serpapi') },
    anthropic: {
      spent: usage.anthropic,
      ceiling: ceiling('anthropic'),
      remaining: remaining('anthropic'),
    },
    persisted,
    file: usageFile(),
  };
}

/** Probes only. Never called by anything that can reach production. */
export function resetUsage(): void {
  state = fresh();
  persisted = true;
  save();
}

/* ------------------------------------------------------------------ per run */

/**
 * A cap on one operation, on top of the monthly ceiling.
 *
 * The refresh button spends exactly two searches; a warm run spends what its matrix says. This
 * stops either from spending more because something upstream got confused, and unlike the monthly
 * ceiling it returns rather than throws — running out mid-operation is a result, not a bug.
 */
export class RunBudget {
  private used = 0;

  constructor(private readonly cap: number) {}

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

/* ------------------------------------------------------------------ account */

export interface SerpApiAccount {
  totalSearchesLeft: number;
  thisMonthUsage: number;
  searchesPerMonth: number;
  thisHourSearches: number;
  checkedAt: string;
}

/**
 * SerpApi's own count, which is authoritative and — importantly — free. Querying it is not itself
 * a search, so a warm run can afford to check before it starts rather than trusting our counter.
 */
export async function fetchSerpApiAccount(): Promise<SerpApiAccount | null> {
  const apiKey = process.env.SERPAPI_API_KEY;
  if (!apiKey) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(`https://serpapi.com/account?api_key=${apiKey}`, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) return null;
    const data = (await response.json()) as Record<string, number>;
    return {
      totalSearchesLeft: data.total_searches_left ?? 0,
      thisMonthUsage: data.this_month_usage ?? 0,
      searchesPerMonth: data.searches_per_month ?? 0,
      thisHourSearches: data.this_hour_searches ?? 0,
      checkedAt: new Date().toISOString(),
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
