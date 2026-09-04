import type { LineItem, ResearchPlan } from '@/lib/research/types';
import type { PriceOrigin } from './types';

/**
 * The provenance ledger — the thing that makes the "checked against a live source" badge mean
 * something.
 *
 * A tool loop on its own does not stop the model inventing prices. It can call `search_hotels`,
 * ignore the answer, write a number it recalled, and label the line `api`. The badge would then
 * be worse than no badge at all, because it launders a guess as a verified figure.
 *
 * So the server records every lookup it actually executed, and every quote that came back. After
 * the plan is assembled, each `api` claim is checked against that record. Anything that cannot be
 * matched is downgraded to `estimate`. The model cannot talk its way past this, because the check
 * does not read anything the model wrote except the numbers it is claiming.
 */

export interface LedgerQuote {
  label: string;
  priceUsd: number;
  url?: string;
}

export interface LedgerEntry {
  resultId: string;
  tool: string;
  args: unknown;
  checkedAt: string;
  cached: boolean;
  /** Every price the provider actually returned, and the link it came with. */
  quotes: LedgerQuote[];
}

export class PriceLedger {
  private readonly entries = new Map<string, LedgerEntry>();
  /** Hosts seen in web-search results, so a `web` claim can be sanity-checked too. */
  private readonly searchedHosts = new Set<string>();

  record(entry: LedgerEntry): void {
    this.entries.set(entry.resultId, entry);
  }

  recordSearchedUrl(url: string): void {
    try {
      this.searchedHosts.add(new URL(url).host.replace(/^www\./, ''));
    } catch {
      // A malformed URL in a search result is not worth failing over.
    }
  }

  get(resultId: string): LedgerEntry | undefined {
    return this.entries.get(resultId);
  }

  get size(): number {
    return this.entries.size;
  }

  all(): LedgerEntry[] {
    return [...this.entries.values()];
  }

  hasHost(url: string): boolean {
    try {
      return this.searchedHosts.has(new URL(url).host.replace(/^www\./, ''));
    } catch {
      return false;
    }
  }
}

/* ------------------------------------------------------------------ reconciliation */

export interface ReconcileResult {
  plan: ResearchPlan;
  /** What was changed, in plain language, for the log and for the plan's own exclusions. */
  downgrades: string[];
  counts: Record<PriceOrigin, number>;
}

/** A claimed price has to be within this of something the provider actually quoted. */
const PRICE_TOLERANCE = 0.1;

function reconcileLine(
  line: LineItem,
  ledger: PriceLedger,
  apiAvailable: boolean,
  downgrades: string[],
): LineItem {
  const { provenance } = line;

  if (provenance.source === 'api') {
    // Rule 5: with no pricing key on this run, no line can possibly be API-sourced.
    if (!apiAvailable) {
      downgrades.push(`"${line.label}" claimed a live price, but no pricing API ran.`);
      return downgrade(line, 'No pricing API was available on this run.');
    }

    const entry = provenance.sourceRef ? ledger.get(provenance.sourceRef) : undefined;

    // Rule 1: a claim with no matching lookup is a claim about nothing.
    if (!entry) {
      downgrades.push(`"${line.label}" cited a lookup that never ran.`);
      return downgrade(line, 'The lookup it cited was not one this run performed.');
    }

    // Rule 2: the number has to resemble something the provider actually said.
    const claimed = (line.perPersonMin + line.perPersonMax) / 2;
    const matched = entry.quotes.find(
      (q) => q.priceUsd > 0 && Math.abs(q.priceUsd - claimed) / q.priceUsd <= PRICE_TOLERANCE,
    );
    const anyQuoteMatches =
      entry.quotes.length === 0 ||
      matched !== undefined ||
      // Split costs legitimately differ from the quote: a $290 room across 4 people is $72.50.
      entry.quotes.some((q) => {
        for (let split = 2; split <= 12; split += 1) {
          if (Math.abs(q.priceUsd / split - claimed) / (q.priceUsd / split) <= PRICE_TOLERANCE) {
            return true;
          }
        }
        return false;
      });

    if (!anyQuoteMatches) {
      downgrades.push(
        `"${line.label}" claimed $${Math.round(claimed)}, which matches nothing ${entry.tool} returned.`,
      );
      return downgrade(line, 'The figure did not match any quote the provider returned.');
    }

    // Rule 3: the link must be one the provider gave us, never one the model composed.
    const providerUrl = matched?.url ?? entry.quotes.find((q) => q.url)?.url;
    return {
      ...line,
      url: providerUrl ?? line.url,
      provenance: { ...provenance, checkedAt: entry.checkedAt, cachedAt: entry.cached ? entry.checkedAt : undefined },
    };
  }

  // Rule 4: a `web` claim pointing at a host that never appeared in a search result is
  // indistinguishable from a recollection, so it is treated as one.
  if (provenance.source === 'web' && line.url && !ledger.hasHost(line.url)) {
    downgrades.push(`"${line.label}" cited ${hostOf(line.url)}, which no search returned.`);
    return downgrade(line, 'Its source did not appear in any search performed on this run.');
  }

  return line;
}

function downgrade(line: LineItem, why: string): LineItem {
  return {
    ...line,
    provenance: {
      source: 'estimate',
      sourceLabel: 'Unverified',
      checkedAt: line.provenance.checkedAt,
    },
    detail: `${line.detail} (${why})`,
  };
}

function hostOf(url: string): string {
  try {
    return new URL(url).host.replace(/^www\./, '');
  } catch {
    return url;
  }
}

/**
 * Runs over the assembled plan before anything reaches the client. Additive only in the sense
 * that it never *promotes* a line — it can only take a claim away.
 */
export function reconcileProvenance(
  plan: ResearchPlan,
  ledger: PriceLedger,
  apiAvailable: boolean,
): ReconcileResult {
  const downgrades: string[] = [];

  const options = plan.options.map((option) => ({
    ...option,
    transport: option.transport.map((l) => reconcileLine(l, ledger, apiAvailable, downgrades)),
    accommodation: option.accommodation.map((l) =>
      reconcileLine(l, ledger, apiAvailable, downgrades),
    ),
    otherCosts: option.otherCosts.map((l) => reconcileLine(l, ledger, apiAvailable, downgrades)),
  }));

  const lines = options.flatMap((o) => [...o.transport, ...o.accommodation, ...o.otherCosts]);
  const counts: Record<PriceOrigin, number> = { api: 0, web: 0, estimate: 0 };
  for (const line of lines) counts[line.provenance.source] += 1;

  // Confidence follows the evidence rather than the model's own opinion of itself.
  const priced = lines.length || 1;
  const apiShare = counts.api / priced;
  const confidence = apiShare >= 0.6 ? 'high' : apiShare >= 0.2 ? 'medium' : 'low';

  const exclusions = [...plan.exclusions];
  if (downgrades.length > 0) {
    exclusions.push(
      `${downgrades.length} ${downgrades.length === 1 ? 'figure was' : 'figures were'} marked as checked but could not be verified against a real quote, so ${downgrades.length === 1 ? 'it is' : 'they are'} shown as estimates.`,
    );
  }

  return {
    plan: {
      ...plan,
      options,
      confidence,
      exclusions,
      totalRangeMin: options.length ? Math.min(...options.map((o) => o.perPersonMin)) : 0,
      totalRangeMax: options.length ? Math.max(...options.map((o) => o.perPersonMax)) : 0,
    },
    downgrades,
    counts,
  };
}
