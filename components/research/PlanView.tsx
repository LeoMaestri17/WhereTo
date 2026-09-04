'use client';

import { useState } from 'react';
import { formatMoney, formatRange } from '@/lib/domain/logic';
import type {
  ConstraintFlag,
  ConstraintSeverity,
  LineItem,
  PlanOption,
  ResearchPlan,
} from '@/lib/research/types';
import { RESEARCH_STAGES, type ResearchStageId } from '@/lib/research/types';
import { formatDay, formatDayWithWeekday, formatLongDate, relativeDay } from '@/lib/util/dates';
import { OutboundLink, Panel } from '@/components/ui';

/* ------------------------------------------------------------------ provenance */

/**
 * Where the plan came from, said plainly and never hidden. A cached plan being presented as a
 * live one would be the single most dishonest thing this app could do.
 */
export function ProvenanceBanner({
  plan,
  fallbackReason,
}: {
  plan: ResearchPlan;
  fallbackReason?: string;
}) {
  if (plan.provenance === 'live') {
    return (
      <Panel tone="good" className="flex flex-wrap items-baseline gap-x-2">
        <span className="type-meta font-medium">Researched live just now</span>
        <span className="type-meta text-ink/70">
          Prices came from a web search run at {formatLongDate(plan.researchedAt)}.
        </span>
      </Panel>
    );
  }

  if (plan.provenance === 'partial') {
    return (
      <Panel tone="warn">
        <p className="type-meta font-medium">This research did not finish</p>
        <p className="type-meta mt-1 text-ink/75">
          {fallbackReason ?? 'The run stopped part-way.'} What is below was assembled from the
          price lookups that did complete, so it is thinner than a finished plan — but every
          figure in it was still checked. Running it again usually works.
        </p>
      </Panel>
    );
  }

  if (plan.provenance === 'cached-fallback') {
    return (
      <Panel tone="warn">
        <p className="type-meta font-medium">
          Live research failed, so this is the saved plan from{' '}
          {formatLongDate(plan.researchedAt)}
        </p>
        <p className="type-meta mt-1 text-ink/75">
          {fallbackReason ?? 'The research call did not complete.'} The costs below have been
          recalculated for your group and your constraints, but the prices themselves are from
          that date and will have moved.
        </p>
      </Panel>
    );
  }

  return (
    <Panel className="border-line">
      <p className="type-meta font-medium">
        Showing a saved plan researched on {formatLongDate(plan.researchedAt)}
      </p>
      <p className="type-meta mt-1 text-muted">
        No API key is set, so nothing was researched live. Every cost below has still been
        recalculated for your group size and your constraints — but the underlying prices are
        from that date.
      </p>
    </Panel>
  );
}

const CONFIDENCE_LABEL = {
  high: 'Confident in these numbers',
  medium: 'Reasonably confident',
  low: 'Treat these as a rough shape',
} as const;

export function ConfidenceBadge({ plan }: { plan: ResearchPlan }) {
  const dots = plan.confidence === 'high' ? 3 : plan.confidence === 'medium' ? 2 : 1;
  return (
    <div className="flex items-start gap-2.5">
      <span className="mt-1.5 flex gap-1" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className={`h-1.5 w-1.5 rounded-full ${i < dots ? 'bg-accent' : 'bg-surface-3'}`}
          />
        ))}
      </span>
      <span>
        <span className="type-meta block font-medium">{CONFIDENCE_LABEL[plan.confidence]}</span>
        <span className="type-meta block text-muted">{plan.confidenceNote}</span>
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ staged loading */

/**
 * A real loading experience rather than a spinner. Each stage names the work actually being
 * done and stays on screen once it has passed, so a 60-second wait reads as progress.
 */
export interface ToolLogEntry {
  label: string;
  status: 'started' | 'ok' | 'failed';
}

export function ResearchProgress({
  currentStage,
  mode,
  toolLog = [],
  notes = [],
}: {
  currentStage: ResearchStageId | null;
  mode: 'live' | 'cached' | null;
  /** Real lookups, as they happen. This is what makes a ninety-second wait legible. */
  toolLog?: ToolLogEntry[];
  notes?: string[];
}) {
  const index = currentStage ? RESEARCH_STAGES.findIndex((s) => s.id === currentStage) : -1;

  return (
    <div className="rounded-xl border border-line bg-surface p-5">
      <p className="type-heading">
        {mode === 'cached'
          ? 'Recalculating the saved plan for your group'
          : 'Researching this properly'}
      </p>
      <p className="type-meta mt-1 text-muted">
        {mode === 'cached'
          ? 'No API key, so this is composing the saved plan against your dates and constraints.'
          : 'Searching for current prices. This takes thirty to ninety seconds because it is reading real booking pages rather than guessing.'}
      </p>

      <ol className="mt-5 space-y-3">
        {RESEARCH_STAGES.map((stage, i) => {
          const done = i < index;
          const active = i === index;
          return (
            <li key={stage.id} className="flex items-center gap-3">
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                  done
                    ? 'border-accent bg-accent text-[var(--accent-text)]'
                    : active
                      ? 'border-accent'
                      : 'border-line'
                }`}
                aria-hidden="true"
              >
                {done ? (
                  <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                    <path
                      d="m2.5 6.2 2.3 2.3L9.5 3.8"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : active ? (
                  <span className="sq-pulse h-2 w-2 rounded-full bg-accent" />
                ) : null}
              </span>
              <span
                className={`type-body ${done ? 'text-muted' : active ? 'text-ink' : 'text-faint'}`}
              >
                {stage.label}
              </span>
            </li>
          );
        })}
      </ol>

      {toolLog.length > 0 ? (
        <div className="mt-5 border-t border-line pt-4">
          <p className="type-micro text-faint">What it is looking up</p>
          <ul className="mt-2 space-y-1">
            {toolLog.map((entry, i) => (
              <li key={i} className="flex items-baseline gap-2">
                <span
                  className={`type-meta shrink-0 ${
                    entry.status === 'ok'
                      ? 'text-good'
                      : entry.status === 'failed'
                        ? 'text-warn'
                        : 'text-faint'
                  }`}
                  aria-hidden="true"
                >
                  {entry.status === 'ok' ? '✓' : entry.status === 'failed' ? '·' : '⟳'}
                </span>
                <span
                  className={`type-meta ${entry.status === 'started' ? 'text-ink' : 'text-muted'}`}
                >
                  {entry.label}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {notes.length > 0 ? (
        <div className="mt-4 border-t border-line pt-3">
          {notes.map((note, i) => (
            <p key={i} className="type-meta text-warn">
              {note}
            </p>
          ))}
        </div>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ constraints */

const SEVERITY: Record<
  ConstraintSeverity,
  { tone: 'danger' | 'warn' | 'plain'; label: string }
> = {
  blocker: { tone: 'danger', label: 'Will stop you' },
  warning: { tone: 'warn', label: 'Costs you money' },
  info: { tone: 'plain', label: 'Worth knowing' },
};

export function ConstraintsPanel({ constraints }: { constraints: ConstraintFlag[] }) {
  if (constraints.length === 0) return null;
  const order: ConstraintSeverity[] = ['blocker', 'warning', 'info'];
  const sorted = [...constraints].sort(
    (a, b) => order.indexOf(a.severity) - order.indexOf(b.severity),
  );

  return (
    <section>
      <h2 className="type-title">What applies to you specifically</h2>
      <p className="type-meta mt-1 text-muted">
        These come from what you set in the planner. This is the part a general estimate leaves
        out, and it is usually where the extra few hundred dollars is hiding.
      </p>
      <div className="mt-4 space-y-3">
        {sorted.map((c, i) => {
          const s = SEVERITY[c.severity];
          return (
            <Panel key={`${c.trigger}-${i}`} tone={s.tone}>
              <div className="flex flex-wrap items-baseline gap-x-2">
                <span className="type-micro opacity-70">{s.label}</span>
                <h3 className="type-heading">{c.title}</h3>
              </div>
              <p className="type-body mt-1.5">{c.body}</p>
              {c.workaround ? (
                <p className="type-body mt-2 border-l-2 border-current/25 pl-3 opacity-90">
                  {c.workaround}
                </p>
              ) : null}
            </Panel>
          );
        })}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ options */

/**
 * Where this number came from, on every single costed line.
 *
 * `estimate` is deliberately the loudest of the three. It is the one the reader needs to
 * distrust, and burying it would defeat the point of labelling any of them.
 */
function ProvenanceChip({ item }: { item: LineItem }) {
  const { source, sourceLabel, checkedAt, cachedAt } = item.provenance;

  const tone =
    source === 'api'
      ? 'border-transparent bg-good-soft text-good'
      : source === 'web'
        ? 'border-line bg-surface-2 text-muted'
        : 'border-transparent bg-warn-soft text-warn';

  const text =
    source === 'api'
      ? `${sourceLabel} · checked ${relativeDay(checkedAt)}`
      : source === 'web'
        ? `${sourceLabel} · ${formatDay(checkedAt)}`
        : 'Estimated, not checked';

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[0.6875rem] font-medium ${tone}`}
      title={cachedAt ? `Served from cache stored ${formatDay(cachedAt)}` : undefined}
    >
      {text}
    </span>
  );
}

/** Only ever shown when a link was actually requested and did not resolve. */
function LinkNote({ item }: { item: LineItem }) {
  if (!item.url) return null;
  const status = item.link?.status;

  if (status === 'dead') {
    return <p className="type-meta mt-1 text-warn">This link no longer resolves.</p>;
  }
  return (
    <p className="type-meta mt-1">
      <OutboundLink href={item.url}>Book or check this</OutboundLink>
      {status === 'blocked' ? (
        <span className="text-faint"> · we could not verify it from here</span>
      ) : null}
    </p>
  );
}

function LineItemRow({ item }: { item: LineItem }) {
  return (
    <li className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-t border-line py-3 first:border-t-0">
      <div className="min-w-0 flex-1">
        <p className="type-body">
          <span className="font-medium">{item.label}</span>
          <span className="text-muted"> · {item.provider}</span>
        </p>
        <p className="type-meta mt-0.5 text-muted">{item.detail}</p>
        <p className="type-meta mt-1 text-faint">Assumes: {item.basis}</p>
        <LinkNote item={item} />
      </div>
      <span className="flex shrink-0 flex-col items-end gap-1">
        <span className="type-body whitespace-nowrap font-medium tabular-nums">
          {formatRange(item.perPersonMin, item.perPersonMax)}
        </span>
        <ProvenanceChip item={item} />
      </span>
    </li>
  );
}

/**
 * The product claim, made checkable in one sentence: how much of this plan was actually priced
 * against a live source rather than recalled.
 */
export function PriceSourceSummary({ plan }: { plan: ResearchPlan }) {
  const lines = plan.options.flatMap((o) => [...o.transport, ...o.accommodation, ...o.otherCosts]);
  if (lines.length === 0) return null;

  const counts = { api: 0, web: 0, estimate: 0 };
  for (const line of lines) counts[line.provenance.source] += 1;

  const dead = lines.filter((l) => l.link?.status === 'dead').length;
  const parts: string[] = [];
  if (counts.api) parts.push(`${counts.api} came from a live price API`);
  if (counts.web) parts.push(`${counts.web} from a web search`);
  if (counts.estimate) parts.push(`${counts.estimate} ${counts.estimate === 1 ? 'is an estimate' : 'are estimates'}`);

  return (
    <Panel tone={counts.api > 0 ? 'good' : 'plain'} className={counts.api > 0 ? '' : 'border-line'}>
      <p className="type-body">
        <span className="font-medium">
          Of {lines.length} costed {lines.length === 1 ? 'line' : 'lines'}, {parts.join(', ')}.
        </span>{' '}
        <span className="text-muted">
          {counts.api > 0
            ? 'A live line was priced by a real request for your dates and group size.'
            : 'Nothing here was priced against a live booking source, so treat every figure as a starting point.'}
        </span>
      </p>
      {dead > 0 ? (
        <p className="type-meta mt-1.5 text-warn">
          {dead} {dead === 1 ? 'link' : 'links'} in this plan no longer{' '}
          {dead === 1 ? 'resolves' : 'resolve'}.
        </p>
      ) : null}
    </Panel>
  );
}

function LineGroup({ title, items }: { title: string; items: LineItem[] }) {
  if (items.length === 0) return null;
  return (
    <div className="mt-4">
      <h4 className="type-micro text-faint">{title}</h4>
      <ul className="mt-1">
        {items.map((item, i) => (
          <LineItemRow key={`${item.label}-${i}`} item={item} />
        ))}
      </ul>
    </div>
  );
}

export function PlanOptionCard({
  option,
  cheapest,
}: {
  option: PlanOption;
  cheapest: boolean;
}) {
  const [open, setOpen] = useState(cheapest);
  return (
    <div className="rounded-xl border border-line bg-surface">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-start justify-between gap-4 p-4 text-left"
      >
        <div className="min-w-0">
          <div className="flex flex-wrap items-baseline gap-x-2">
            <h3 className="type-heading">{option.name}</h3>
            {cheapest ? <span className="type-micro text-accent">Cheapest</span> : null}
          </div>
          <p className="type-meta mt-1 text-muted">{option.bestFor}</p>
        </div>
        <div className="shrink-0 text-right">
          <p className="type-title tabular-nums">
            {formatRange(option.perPersonMin, option.perPersonMax)}
          </p>
          <p className="type-meta text-muted">each</p>
        </div>
      </button>

      {open ? (
        <div className="border-t border-line px-4 pb-4">
          <LineGroup title="Getting there" items={option.transport} />
          <LineGroup title="Where you sleep" items={option.accommodation} />
          <LineGroup title="Everything else" items={option.otherCosts} />
        </div>
      ) : (
        <p className="border-t border-line px-4 py-2.5 type-meta text-faint">
          {option.transport.length + option.accommodation.length + option.otherCosts.length} costed
          lines — tap to see the breakdown
        </p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ the rest */

export function AssumptionsPanel({ plan }: { plan: ResearchPlan }) {
  return (
    <section>
      <h2 className="type-title">What these numbers assume</h2>
      <p className="type-meta mt-1 text-muted">
        Every figure above rests on something. If one of these is wrong for you, the total is
        wrong for you.
      </p>
      <dl className="mt-4 divide-y divide-line rounded-xl border border-line bg-surface">
        {plan.assumptions.map((a, i) => (
          <div key={i} className="flex flex-col gap-1 p-4 sm:flex-row sm:gap-6">
            <dt className="type-meta w-40 shrink-0 font-medium">{a.label}</dt>
            <dd className="type-body text-muted">{a.detail}</dd>
          </div>
        ))}
      </dl>

      <h3 className="type-heading mt-6">Not included in any of the totals</h3>
      <ul className="mt-2 space-y-1.5">
        {plan.exclusions.map((e, i) => (
          <li key={i} className="type-body flex gap-2.5 text-muted">
            <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-line-strong" aria-hidden="true" />
            {e}
          </li>
        ))}
      </ul>
    </section>
  );
}

export function ItineraryTimeline({ plan }: { plan: ResearchPlan }) {
  if (plan.itinerary.length === 0) return null;
  return (
    <section>
      <h2 className="type-title">A day plan that is actually specific</h2>
      <p className="type-meta mt-1 text-muted">
        Named places and real timings, built around the constraints above.
      </p>
      <div className="mt-4 space-y-6">
        {plan.itinerary.map((day) => (
          <div key={day.dayNumber}>
            <div className="flex flex-wrap items-baseline gap-x-3">
              <h3 className="type-heading">Day {day.dayNumber}</h3>
              <span className="type-meta text-muted">{formatDayWithWeekday(day.date)}</span>
            </div>
            <p className="type-meta mt-0.5 text-muted">{day.label}</p>
            <ol className="mt-3 border-l border-line">
              {day.blocks.map((block, i) => (
                <li key={i} className="relative pb-4 pl-5 last:pb-0">
                  <span
                    className="absolute -left-[3px] top-2 h-1.5 w-1.5 rounded-full bg-line-strong"
                    aria-hidden="true"
                  />
                  <div className="flex flex-wrap items-baseline gap-x-2">
                    <span className="type-meta w-12 shrink-0 tabular-nums text-faint">
                      {block.time}
                    </span>
                    <span className="type-body font-medium">{block.title}</span>
                  </div>
                  <p className="type-body ml-0 mt-0.5 text-muted sm:ml-14">{block.detail}</p>
                  {block.place ? (
                    <p className="type-meta mt-0.5 text-faint sm:ml-14">{block.place}</p>
                  ) : null}
                </li>
              ))}
            </ol>
          </div>
        ))}
      </div>
    </section>
  );
}

export function SourcesList({ plan }: { plan: ResearchPlan }) {
  if (plan.sources.length === 0) return null;
  return (
    <section>
      <h2 className="type-heading">Where this came from</h2>
      <ul className="mt-2 space-y-1.5">
        {plan.sources.map((s, i) => (
          <li key={i} className="type-meta">
            <OutboundLink href={s.url}>{s.title}</OutboundLink>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function CostHeadline({ plan }: { plan: ResearchPlan }) {
  return (
    <div className="rounded-xl border border-line bg-surface p-5">
      <p className="type-micro text-faint">Per person, everything in</p>
      <p className="type-display mt-1 tabular-nums">
        {formatRange(plan.totalRangeMin, plan.totalRangeMax)}
      </p>
      <p className="type-meta mt-1 text-muted">
        Across {plan.options.length} option{plan.options.length === 1 ? '' : 's'} for{' '}
        {plan.request.groupSize} {plan.request.groupSize === 1 ? 'person' : 'people'}. The bottom
        of the range is the cheapest option done carefully; the top is the most comfortable one.
      </p>
      <div className="mt-4 border-t border-line pt-4">
        <ConfidenceBadge plan={plan} />
      </div>
    </div>
  );
}

export function formatTotal(value: number): string {
  return formatMoney(value);
}
