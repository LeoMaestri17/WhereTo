/**
 * Two ceilings, because the free tier is small enough that one runaway research run can eat a
 * meaningful share of the month.
 *
 *  - a monthly budget, defaulting below the 250 the free tier gives, so there is headroom
 *  - a per-run cap, because a single run left unchecked will happily make twenty lookups
 *
 * Hitting either returns `unavailable` to the model rather than throwing. The run continues on
 * web search and says so.
 *
 * MOCK BOUNDARY: the monthly counter is in process memory and resets when the server does. A
 * real deployment reads the true figure from SerpApi's own account endpoint.
 */

const MONTHLY_BUDGET = Number(process.env.SERPAPI_MONTHLY_BUDGET ?? 200);
const PER_RUN_CAP = Number(process.env.PRICING_MAX_CALLS_PER_RUN ?? 6);

let monthKey = currentMonth();
let spentThisMonth = 0;

function currentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${now.getMonth()}`;
}

function rollOverIfNeeded(): void {
  const now = currentMonth();
  if (now !== monthKey) {
    monthKey = now;
    spentThisMonth = 0;
  }
}

/** Per-run budget. One of these is created for each research run. */
export class RunBudget {
  private used = 0;

  constructor(private readonly cap: number = PER_RUN_CAP) {}

  get remaining(): number {
    return Math.max(0, this.cap - this.used);
  }

  get spent(): number {
    return this.used;
  }
}

export type QuotaVerdict = { ok: true } | { ok: false; reason: 'quota' | 'run_budget' };

/** Checked immediately before a billable call; cache hits never come through here. */
export function reserve(budget: RunBudget | null): QuotaVerdict {
  rollOverIfNeeded();

  if (spentThisMonth >= MONTHLY_BUDGET) {
    return { ok: false, reason: 'quota' };
  }
  if (budget && budget.remaining <= 0) {
    return { ok: false, reason: 'run_budget' };
  }

  spentThisMonth += 1;
  if (budget) {
    // RunBudget keeps its own count; `used` is private so it is incremented through here.
    (budget as unknown as { used: number }).used += 1;
  }
  return { ok: true };
}

export function quotaStatus(): {
  monthlyBudget: number;
  spentThisMonth: number;
  remaining: number;
  perRunCap: number;
} {
  rollOverIfNeeded();
  return {
    monthlyBudget: MONTHLY_BUDGET,
    spentThisMonth,
    remaining: Math.max(0, MONTHLY_BUDGET - spentThisMonth),
    perRunCap: PER_RUN_CAP,
  };
}

/** Test and probe support only. */
export function resetQuota(): void {
  spentThisMonth = 0;
  monthKey = currentMonth();
}
