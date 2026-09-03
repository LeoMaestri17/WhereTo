'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { EventCard, QuestCard } from '@/components/cards';
import { EmptyState, LinkButton, LoadingState, Panel, SectionHeader } from '@/components/ui';
import { deriveQuestStatus, isJoinable } from '@/lib/domain/logic';
import { useStore } from '@/lib/store/StoreProvider';
import {
  completedQuests,
  currentUser,
  eventSignal,
  myAttendance,
  personaliseEvents,
  questView,
  upcomingQuests,
} from '@/lib/store/selectors';
import { relativeDay } from '@/lib/util/dates';

export default function HappeningPage() {
  const { state, dispatch, events } = useStore();
  const me = currentUser(state);

  const quests = useMemo(() => upcomingQuests(state), [state]);

  /**
   * Ordered by how soon the deadline is, because that is the useful order — the thing you have
   * two days left to join should not be below the thing you have three weeks to join. Nothing
   * here is ever ordered by how many people are going.
   */
  const closingSoon = useMemo(
    () =>
      quests
        .filter((q) => isJoinable(deriveQuestStatus(q, state.memberships)))
        .sort((a, b) => a.signupDeadline.localeCompare(b.signupDeadline))
        .slice(0, 3),
    [quests, state.memberships],
  );

  const closingIds = new Set(closingSoon.map((q) => q.id));
  const trips = quests.filter((q) => q.kind === 'trip' && !closingIds.has(q.id)).slice(0, 6);
  const plans = quests.filter((q) => q.kind === 'plan' && !closingIds.has(q.id)).slice(0, 6);
  const done = useMemo(() => completedQuests(state).slice(0, 3), [state]);

  const forYou = useMemo(
    () =>
      personaliseEvents(events.events, me?.interests ?? [])
        .filter((e) => new Date(e.startsAt).getTime() > Date.now())
        .slice(0, 3),
    [events.events, me?.interests],
  );

  return (
    <div className="space-y-12">
      <header>
        <p className="type-micro text-accent">Happening</p>
        <h1 className="type-display mt-2 max-w-2xl">
          {me ? `${me.name.split(' ')[0]}, here is what has a deadline on it.` : 'What is on'}
        </h1>
        <p className="type-body mt-2 max-w-xl text-muted">
          Everything below was posted by somebody in the cohort who committed first. Join before
          the deadline they set, or post your own.
        </p>
      </header>

      <section>
        <SectionHeader
          title="Closing soonest"
          detail="The ones where waiting until next week means not going."
          action={<LinkButton href="/post" tone="quiet">Post something</LinkButton>}
        />
        {closingSoon.length === 0 ? (
          <EmptyState
            title="Nothing is taking sign-ups right now"
            body="Every trip and plan in the cohort has either filled up or passed its deadline. That is usually the moment to post one of your own."
            action={<LinkButton href="/ideas">Look through the ideas</LinkButton>}
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {closingSoon.map((q) => (
              <QuestCard key={q.id} view={questView(state, q)} />
            ))}
          </div>
        )}
      </section>

      <section>
        <SectionHeader
          title="Trips"
          detail="Multi-day, and they need booking further ahead than anyone expects."
        />
        {trips.length === 0 ? (
          <EmptyState
            title="No trips on the board"
            body="Nobody has posted a multi-day trip that is still open. The idea bank has costed plans for eight destinations if you want to be the one who does."
            action={<LinkButton href="/ideas">Open the idea bank</LinkButton>}
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {trips.map((q) => (
              <QuestCard key={q.id} view={questView(state, q)} />
            ))}
          </div>
        )}
      </section>

      <section>
        <SectionHeader title="Plans" detail="Local, cheap, and mostly happening this week." />
        {plans.length === 0 ? (
          <EmptyState
            title="No local plans yet"
            body="A plan is a low-stakes thing: a date, a place and a number of spots. It takes about a minute to post one."
            action={<LinkButton href="/post">Post a plan</LinkButton>}
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {plans.map((q) => (
              <QuestCard key={q.id} view={questView(state, q)} />
            ))}
          </div>
        )}
      </section>

      <section>
        <SectionHeader
          title="Events for you"
          detail={
            me?.interests.length
              ? 'Pulled from EngageSC, Luma, Partiful and Handshake, ordered by what you said you were into.'
              : 'Pulled from EngageSC, Luma, Partiful and Handshake.'
          }
          action={<LinkButton href="/events" tone="quiet">All events</LinkButton>}
        />
        {events.loading ? (
          <LoadingState label="Checking four sources for what is on." rows={3} />
        ) : events.error ? (
          <Panel tone="danger">
            <p className="type-heading text-danger">The event sources are not responding</p>
            <p className="type-body mt-1.5 text-ink/80">{events.error}</p>
          </Panel>
        ) : forYou.length === 0 ? (
          <EmptyState
            title="Nothing upcoming from the four sources"
            body="Everything the adapters returned has already happened. The trips and plans above are posted by people rather than pulled in, so they are unaffected."
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {forYou.map((event) => (
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
      </section>

      {done.length > 0 ? (
        <section>
          <SectionHeader
            title="Already been and done"
            detail="What these actually cost, reported by the people who went. This is the part that makes the next estimate better."
          />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {done.map((q) => (
              <QuestCard key={q.id} view={questView(state, q)} />
            ))}
          </div>
        </section>
      ) : null}

      {events.failed.length > 0 ? (
        <Panel tone="warn">
          <p className="type-meta">
            {events.failed.map((f) => f.label).join(' and ')} did not respond, so this feed is
            missing whatever they had. Everything else is here.
          </p>
        </Panel>
      ) : null}

      <footer className="border-t border-line pt-6">
        <p className="type-meta text-faint">
          {quests.length} trips and plans open across the cohort · next deadline{' '}
          {closingSoon[0] ? relativeDay(closingSoon[0].signupDeadline) : 'none set'} ·{' '}
          <Link href="/profile" className="underline">
            manage your demo data
          </Link>
        </p>
      </footer>
    </div>
  );
}
