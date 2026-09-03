'use client';

import { useMemo, useState } from 'react';
import { EventCard } from '@/components/cards';
import { Button, Chip, EmptyState, ErrorState, LoadingState, Panel } from '@/components/ui';
import {
  EVENT_SOURCE_LABELS,
  INTEREST_LABELS,
  type EventSourceId,
  type InterestTag,
} from '@/lib/domain/types';
import { EVENT_SOURCES } from '@/lib/events';
import { useStore } from '@/lib/store/StoreProvider';
import {
  currentUser,
  eventSignal,
  filterEvents,
  myAttendance,
  personaliseEvents,
  type EventFilters,
} from '@/lib/store/selectors';

const DATE_WINDOWS: Array<{ label: string; days: number | null }> = [
  { label: 'Anytime', days: null },
  { label: 'Next 3 days', days: 3 },
  { label: 'This week', days: 7 },
  { label: 'Next two weeks', days: 14 },
];

export default function EventsPage() {
  const { state, dispatch, events, reloadEvents } = useStore();
  const me = currentUser(state);

  const [filters, setFilters] = useState<EventFilters>({
    interests: [],
    sources: [],
    withinDays: null,
    freeOnly: false,
  });

  const visible = useMemo(() => {
    const filtered = filterEvents(events.events, filters);
    // Personalisation only reorders — an event never disappears because of your interests.
    return personaliseEvents(filtered, filters.interests.length ? [] : (me?.interests ?? []));
  }, [events.events, filters, me?.interests]);

  const availableInterests = useMemo(() => {
    const set = new Set<InterestTag>();
    events.events.forEach((e) => e.tags.forEach((t) => set.add(t)));
    return [...set].sort();
  }, [events.events]);

  const anyFilter =
    filters.interests.length > 0 ||
    filters.sources.length > 0 ||
    filters.withinDays !== null ||
    filters.freeOnly;

  const toggle = <K extends 'interests' | 'sources'>(
    key: K,
    value: EventFilters[K][number],
  ) =>
    setFilters((f) => ({
      ...f,
      [key]: (f[key] as string[]).includes(value as string)
        ? (f[key] as string[]).filter((v) => v !== value)
        : [...(f[key] as string[]), value],
    }));

  return (
    <div className="space-y-8">
      <header>
        <p className="type-micro text-accent">Events</p>
        <h1 className="type-display mt-2 max-w-2xl">
          Everything already happening, and who else from the cohort is going.
        </h1>
        <p className="type-body mt-2 max-w-xl text-muted">
          Pulled from {EVENT_SOURCES.map((s) => s.label).join(', ')}. Information about things to
          do was never the scarce part — knowing somebody else will be there is.
        </p>
      </header>

      <div className="space-y-3">
        <FilterRow label="When">
          {DATE_WINDOWS.map((w) => (
            <Chip
              key={w.label}
              active={filters.withinDays === w.days}
              onClick={() => setFilters((f) => ({ ...f, withinDays: w.days }))}
            >
              {w.label}
            </Chip>
          ))}
          <span className="mx-1 w-px shrink-0 bg-line" aria-hidden="true" />
          <Chip
            active={filters.freeOnly}
            onClick={() => setFilters((f) => ({ ...f, freeOnly: !f.freeOnly }))}
          >
            Free only
          </Chip>
        </FilterRow>

        <FilterRow label="Source">
          {(Object.keys(EVENT_SOURCE_LABELS) as EventSourceId[]).map((s) => (
            <Chip
              key={s}
              active={filters.sources.includes(s)}
              onClick={() => toggle('sources', s)}
            >
              {EVENT_SOURCE_LABELS[s]}
            </Chip>
          ))}
        </FilterRow>

        {availableInterests.length > 0 ? (
          <FilterRow label="Interest">
            {availableInterests.map((t) => (
              <Chip
                key={t}
                active={filters.interests.includes(t)}
                onClick={() => toggle('interests', t)}
              >
                {INTEREST_LABELS[t]}
              </Chip>
            ))}
          </FilterRow>
        ) : null}

        <div className="flex items-center gap-3 pt-1">
          <p className="type-meta text-muted">
            {events.loading
              ? 'Checking four sources…'
              : `${visible.length} of ${events.events.length} events`}
            {!anyFilter && me?.interests.length
              ? ' · ordered by what you said you were into'
              : null}
          </p>
          {anyFilter ? (
            <Button
              tone="ghost"
              size="sm"
              onClick={() =>
                setFilters({ interests: [], sources: [], withinDays: null, freeOnly: false })
              }
            >
              Clear filters
            </Button>
          ) : null}
        </div>
      </div>

      {events.failed.length > 0 ? (
        <Panel tone="warn">
          <p className="type-heading text-warn">
            {events.failed.map((f) => f.label).join(' and ')} did not respond
          </p>
          <p className="type-body mt-1 text-ink/80">
            {events.failed.map((f) => f.message).join(' ')} Everything from the other sources is
            below.
          </p>
        </Panel>
      ) : null}

      {events.loading ? (
        <LoadingState label="Reading EngageSC, Luma, Partiful and Handshake." rows={6} />
      ) : events.error ? (
        <ErrorState
          title="None of the four sources responded"
          body={`${events.error} Nothing here is cached locally, so there is nothing to show until one of them comes back.`}
          onRetry={reloadEvents}
          retryLabel="Try the sources again"
        />
      ) : visible.length === 0 ? (
        <EmptyState
          title={anyFilter ? 'Nothing matches those filters' : 'Nothing upcoming'}
          body={
            anyFilter
              ? 'The combination you have picked has no events in it. Widening the date window is usually what does it.'
              : 'All four sources returned events, but every one of them has already happened. Check back after the next sync.'
          }
          action={
            anyFilter ? (
              <Button
                tone="quiet"
                onClick={() =>
                  setFilters({ interests: [], sources: [], withinDays: null, freeOnly: false })
                }
              >
                Clear the filters
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              signal={eventSignal(state, event)}
              attending={myAttendance(state, event.id)}
              onAttend={(next) =>
                dispatch({ type: 'setAttendance', eventId: event.id, state: next })
              }
            />
          ))}
        </div>
      )}

      <footer className="border-t border-line pt-6">
        <p className="type-meta text-faint">
          Each source has its own adapter behind one interface. All four are fixture-backed today
          — see the README for where each real integration goes.
        </p>
      </footer>
    </div>
  );
}

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span className="type-micro hidden w-16 shrink-0 text-faint sm:block">{label}</span>
      <div className="sq-rail -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
        {children}
      </div>
    </div>
  );
}
