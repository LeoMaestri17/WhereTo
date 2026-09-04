'use client';

import Link from 'next/link';
import { notFound, useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { SmartImage } from '@/components/SmartImage';
import { PlannerForm, toResearchRequest, type PlannerValues } from '@/components/research/PlannerForm';
import {
  AssumptionsPanel,
  ConstraintsPanel,
  CostHeadline,
  ItineraryTimeline,
  PlanOptionCard,
  PriceSourceSummary,
  ProvenanceBanner,
  ResearchProgress,
  SourcesList,
  type ToolLogEntry,
} from '@/components/research/PlanView';
import { Button, EmptyState, ErrorState, LinkButton, Panel } from '@/components/ui';
import { INTEREST_LABELS, type Idea } from '@/lib/domain/types';
import { researchQuery, type ResearchPlan, type ResearchStageId } from '@/lib/research/types';
import { IDEAS_BY_SLUG } from '@/lib/seed/ideas';
import { useStore } from '@/lib/store/StoreProvider';
import { currentUser } from '@/lib/store/selectors';
import { addDays, isoDate, nextThanksgiving, toIsoDate } from '@/lib/util/dates';

type Phase =
  | { kind: 'idle' }
  | {
      kind: 'running';
      stage: ResearchStageId | null;
      mode: 'live' | 'cached' | null;
      toolLog: ToolLogEntry[];
      notes: string[];
    }
  | { kind: 'done'; plan: ResearchPlan; fallbackReason?: string }
  | { kind: 'error'; message: string; recoverable: boolean };

/** Break trips prefill to the Thanksgiving window; everything else to the next free weekend. */
function defaultDates(nights: number, shape: string): { startDate: string; endDate: string } {
  if (shape === 'break') {
    const thanksgiving = nextThanksgiving();
    const start = new Date(thanksgiving);
    start.setDate(start.getDate() - 1);
    const startIso = toIsoDate(start);
    return { startDate: startIso, endDate: addDays(startIso, Math.max(nights, 1)) };
  }
  // The next Friday that is at least a week out, so there is time to actually organise it.
  const now = new Date();
  const daysToFriday = (5 - now.getDay() + 7) % 7 || 7;
  const startIso = isoDate(daysToFriday + 7);
  return { startDate: startIso, endDate: addDays(startIso, nights) };
}

export default function IdeaPlannerPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const { state, dispatch } = useStore();
  const me = currentUser(state);
  const idea = IDEAS_BY_SLUG[params.slug];

  const cached = idea ? state.planCache[idea.slug] : undefined;

  const [values, setValues] = useState<PlannerValues>(() => {
    const dates = defaultDates(idea?.nights ?? 0, idea?.shape ?? 'day');
    return {
      ...dates,
      groupSize: 4,
      hasCar: me?.hasCar ?? false,
      isOver21: (me?.age ?? 20) >= 21,
      hasUsCreditCard: me?.hasUsCreditCard ?? false,
      budgetBand: 'moderate',
      moods: (idea?.tags ?? []).filter((t) => me?.interests.includes(t)).slice(0, 3),
    };
  });

  const [phase, setPhase] = useState<Phase>(
    cached ? { kind: 'done', plan: cached } : { kind: 'idle' },
  );
  const [submitted, setSubmitted] = useState<PlannerValues | null>(
    cached ? valuesFromPlan(cached) : null,
  );
  const sourceRef = useRef<EventSource | null>(null);

  const dirty = useMemo(
    () => (submitted ? JSON.stringify(submitted) !== JSON.stringify(values) : false),
    [submitted, values],
  );

  const run = useCallback(() => {
    if (!idea) return;
    sourceRef.current?.close();

    setPhase({ kind: 'running', stage: null, mode: null, toolLog: [], notes: [] });
    setSubmitted(values);

    const source = new EventSource(researchUrl(idea, values));
    sourceRef.current = source;
    let mode: 'live' | 'cached' | null = null;
    let settled = false;

    /** Closing on the terminal frame matters: EventSource otherwise reconnects and re-runs. */
    const finish = () => {
      settled = true;
      source.close();
      if (sourceRef.current === source) sourceRef.current = null;
    };

    source.addEventListener('mode', (e) => {
      const frame = JSON.parse((e as MessageEvent<string>).data) as { mode: 'live' | 'cached' };
      mode = frame.mode;
      setPhase((p) => (p.kind === 'running' ? { ...p, mode: frame.mode } : p));
    });

    source.addEventListener('stage', (e) => {
      const frame = JSON.parse((e as MessageEvent<string>).data) as { id: ResearchStageId };
      setPhase((p) => (p.kind === 'running' ? { ...p, stage: frame.id, mode } : p));
    });

    source.addEventListener('tool', (e) => {
      const frame = JSON.parse((e as MessageEvent<string>).data) as ToolLogEntry;
      setPhase((p) => {
        if (p.kind !== 'running') return p;
        // A finished lookup replaces its own 'started' line rather than adding a second one.
        const next = [...p.toolLog];
        const started = next.findIndex((t) => t.status === 'started' && sameLookup(t.label, frame.label));
        if (frame.status !== 'started' && started !== -1) next[started] = frame;
        else next.push(frame);
        return { ...p, toolLog: next.slice(-8) };
      });
    });

    source.addEventListener('note', (e) => {
      const frame = JSON.parse((e as MessageEvent<string>).data) as { text: string };
      setPhase((p) => (p.kind === 'running' ? { ...p, notes: [...p.notes, frame.text] } : p));
    });

    source.addEventListener('plan', (e) => {
      const frame = JSON.parse((e as MessageEvent<string>).data) as {
        plan: ResearchPlan;
        fallbackReason?: string;
      };
      finish();
      setPhase({ kind: 'done', plan: frame.plan, fallbackReason: frame.fallbackReason });
      dispatch({ type: 'cachePlan', key: idea.slug, plan: frame.plan });
    });

    source.addEventListener('error', (e) => {
      // Two different things arrive here: a frame the server sent deliberately, and a genuine
      // transport failure, which has no data on it.
      const data = (e as MessageEvent<string>).data;
      if (data) {
        const frame = JSON.parse(data) as { message: string; recoverable: boolean };
        finish();
        setPhase({ kind: 'error', message: frame.message, recoverable: frame.recoverable });
        return;
      }
      if (settled) return;
      finish();
      setPhase({
        kind: 'error',
        message:
          'The connection to the research endpoint dropped before a plan came back. That is usually the dev server restarting.',
        recoverable: true,
      });
    });
  }, [idea, values, dispatch]);

  useEffect(() => () => sourceRef.current?.close(), []);

  if (!idea) notFound();

  const plan = phase.kind === 'done' ? phase.plan : null;
  const cheapest = plan?.options.reduce(
    (best, o) => (best === null || o.perPersonMin < best ? o.perPersonMin : best),
    null as number | null,
  );

  return (
    <div className="space-y-10">
      <nav className="type-meta">
        <Link href="/ideas" className="text-muted hover:text-ink">
          ← Idea bank
        </Link>
      </nav>

      <header className="overflow-hidden rounded-2xl border border-line bg-surface">
        <div className="relative aspect-[21/9] bg-surface-2">
          <SmartImage
            photoId={idea.image}
            alt={idea.title}
            width={1400}
            height={600}
            priority
            sizes="(max-width: 1024px) 100vw, 1024px"
            className="h-full w-full object-cover"
          />
        </div>
        <div className="p-5 sm:p-6">
          <h1 className="type-display">{idea.title}</h1>
          <p className="type-meta mt-1 text-faint">{idea.region}</p>
          <p className="type-body mt-3 max-w-2xl">{idea.hook}</p>
          <dl className="mt-4 flex flex-wrap gap-x-8 gap-y-2">
            <Stat label="Typical cost" value={idea.costBandLabel} />
            <Stat label="How long" value={idea.durationLabel} />
            <Stat label="Getting there" value={idea.distanceLabel} />
            <Stat label="Car" value={idea.needsCar ? 'Needed' : 'Not needed'} />
          </dl>
          <p className="type-meta mt-3 text-muted">
            {idea.tags.map((t) => INTEREST_LABELS[t]).join(' · ')}
          </p>
        </div>
      </header>

      <section>
        <h2 className="type-title">Plan it for your group</h2>
        <p className="type-meta mt-1 text-muted">
          Everything here changes the answer. The defaults come from your profile.
        </p>
        <div className="mt-4 rounded-xl border border-line bg-surface p-5">
          <PlannerForm
            idea={idea}
            values={values}
            onChange={setValues}
            onSubmit={run}
            busy={phase.kind === 'running'}
            dirty={dirty}
            hasPlan={plan !== null}
          />
        </div>
      </section>

      {phase.kind === 'running' ? (
        <ResearchProgress
          currentStage={phase.stage}
          mode={phase.mode}
          toolLog={phase.toolLog}
          notes={phase.notes}
        />
      ) : null}

      {phase.kind === 'error' ? (
        phase.recoverable ? (
          <ErrorState
            title="That research did not complete"
            body={phase.message}
            onRetry={run}
            retryLabel="Run it again"
          />
        ) : (
          <EmptyState
            title="No saved plan for this destination"
            body={phase.message}
            action={<LinkButton href="/ideas" tone="quiet">Back to the ideas with plans ready</LinkButton>}
          />
        )
      ) : null}

      {phase.kind === 'idle' ? (
        <Panel className="border-dashed">
          <p className="type-heading">Nothing researched yet</p>
          <p className="type-body mt-1.5 text-muted">
            Set the dates and your group above, then run it. You will get two or three costed
            options with named operators, real booking links, and the surcharges that apply
            because of your age, your licence and your card.
          </p>
        </Panel>
      ) : null}

      {plan ? (
        <div className="space-y-10">
          <ProvenanceBanner
            plan={plan}
            fallbackReason={phase.kind === 'done' ? phase.fallbackReason : undefined}
          />

          <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div>
              <h2 className="type-title">What we found</h2>
              <p className="type-body mt-2 max-w-2xl">{plan.summary}</p>
            </div>
            <CostHeadline plan={plan} />
          </section>

          <PriceSourceSummary plan={plan} />

          <ConstraintsPanel constraints={plan.constraints} />

          <section>
            <h2 className="type-title">The options</h2>
            <p className="type-meta mt-1 text-muted">
              Only the ones this group can actually book. Options that need a driver you do not
              have, or an age you are not, have been left out rather than shown and caveated.
            </p>
            <div className="mt-4 space-y-3">
              {plan.options.length === 0 ? (
                <EmptyState
                  title="No option here works for this group"
                  body="Every way of doing this trip needs either a driver or somebody over 21, and you have said you have neither. Changing one of those above will open options up."
                />
              ) : (
                plan.options.map((option) => (
                  <PlanOptionCard
                    key={option.id}
                    option={option}
                    cheapest={option.perPersonMin === cheapest}
                  />
                ))
              )}
            </div>
          </section>

          <ItineraryTimeline plan={plan} />
          <AssumptionsPanel plan={plan} />
          <SourcesList plan={plan} />

          <section className="rounded-xl border border-line bg-surface-2 p-5">
            <h2 className="type-title">Now find the people</h2>
            <p className="type-body mt-1.5 max-w-2xl text-muted">
              A costed plan nobody is going on is still nobody going anywhere. Post it as a trip,
              set a capacity and a deadline, and this whole plan comes with it.
            </p>
            <Button
              size="lg"
              className="mt-4"
              onClick={() => router.push(`/post?idea=${idea.slug}`)}
            >
              Post this as a trip
            </Button>
          </section>
        </div>
      ) : null}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="type-micro text-faint">{label}</dt>
      <dd className="type-meta mt-0.5 font-medium">{value}</dd>
    </div>
  );
}

/** Tool labels change as a lookup completes, so match on the stable provider+target prefix. */
function sameLookup(a: string, b: string): boolean {
  const key = (s: string) => s.split(' · ').slice(0, 2).join(' · ');
  return key(a) === key(b);
}

function researchUrl(idea: Idea, values: PlannerValues): string {
  return researchQuery(toResearchRequest(idea, values));
}

function valuesFromPlan(plan: ResearchPlan): PlannerValues {
  const r = plan.request;
  return {
    startDate: r.startDate,
    endDate: r.endDate,
    groupSize: r.groupSize,
    hasCar: r.hasCar,
    isOver21: r.isOver21,
    hasUsCreditCard: r.hasUsCreditCard,
    budgetBand: r.budgetBand,
    moods: r.moods,
  };
}
