'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { IdeaCard, QuestCard } from '@/components/cards';
import { RotatingWord } from '@/components/RotatingWord';
import { Chip, EmptyState, LinkButton, SectionHeader } from '@/components/ui';
import { deriveQuestStatus, isJoinable } from '@/lib/domain/logic';
import { IDEA_SHAPE_LABELS, type IdeaShape } from '@/lib/domain/types';
import { cachedPlanSlugs } from '@/lib/research/cached';
import { IDEAS } from '@/lib/seed/ideas';
import { useStore } from '@/lib/store/StoreProvider';
import { completedQuests, currentUser, questView, upcomingQuests } from '@/lib/store/selectors';

const CACHED = new Set(cachedPlanSlugs());

/**
 * The home screen is the planning screen.
 *
 * The core loop is deliberately unchanged and sits near the top: browse ideas, click one, and it
 * goes and finds the real price. The guided picker above it is the way in for people who do not
 * know where they want to go — a door, not the main road.
 *
 * What the cohort is already doing comes after that, because it is context rather than the task.
 */
export default function HomePage() {
  const { state } = useStore();
  const me = currentUser(state);
  const [shape, setShape] = useState<IdeaShape | 'all'>('all');

  const quests = useMemo(() => upcomingQuests(state), [state]);

  /** Soonest deadline first — the useful order. Never by how many people are going. */
  const closingSoon = useMemo(
    () =>
      quests
        .filter((q) => isJoinable(deriveQuestStatus(q, state.memberships)))
        .sort((a, b) => a.signupDeadline.localeCompare(b.signupDeadline))
        .slice(0, 3),
    [quests, state.memberships],
  );

  const done = useMemo(() => completedQuests(state).slice(0, 3), [state]);
  const ideas = shape === 'all' ? IDEAS : IDEAS.filter((i) => i.shape === shape);

  return (
    <div className="space-y-14">
      <header className="pt-2">
        <p className="type-micro text-accent">USC SideQuest</p>
        <h1 className="type-display mt-3 max-w-3xl">
          {me ? `${me.name.split(' ')[0]}, what` : 'What'} should we plan for{' '}
          <RotatingWord words={['tonight', 'this weekend', 'next month', 'the winter break']} />?
        </h1>
        <p className="type-body mt-3 max-w-xl text-muted">
          Pick something below and it will go and find what it actually costs — real flights, a
          real hotel, and the surcharges nobody quotes a nineteen-year-old.
        </p>
      </header>

      {/* The way in for people with no destination in mind. */}
      <Link
        href="/plan"
        className="group flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl border border-line bg-surface p-5 transition-colors hover:border-accent sm:p-6"
      >
        <span className="min-w-0 flex-1">
          <span className="type-title block">Not sure yet — help me pick</span>
          <span className="type-body mt-1 block text-muted">
            A few questions about who you are going with, how long and what you can spend, then
            two or three places that actually fit.
          </span>
        </span>
        <span className="type-body shrink-0 font-medium text-accent transition-transform group-hover:translate-x-0.5">
          Start →
        </span>
      </Link>

      <section>
        <SectionHeader
          title="Where people go"
          detail="Costed for a student with no car who cannot hire one, not for a tourist with a credit card."
        />
        <div className="sq-rail -mx-4 mb-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
          <Chip active={shape === 'all'} onClick={() => setShape('all')}>
            Everything
          </Chip>
          {(['day', 'weekend', 'break'] as IdeaShape[]).map((s) => (
            <Chip key={s} active={shape === s} onClick={() => setShape(s)}>
              {IDEA_SHAPE_LABELS[s]}
            </Chip>
          ))}
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ideas.slice(0, 9).map((idea) => (
            <IdeaCard key={idea.slug} idea={idea} hasCached={CACHED.has(idea.slug)} />
          ))}
        </div>
        {ideas.length > 9 ? (
          <div className="mt-4">
            <LinkButton href="/ideas" tone="quiet">
              See all {ideas.length}
            </LinkButton>
          </div>
        ) : null}
      </section>

      <section>
        <SectionHeader
          title="Closing soonest"
          detail="Posted by people in the cohort. Waiting until next week means not going."
          action={
            <LinkButton href="/post" tone="quiet">
              Post your own
            </LinkButton>
          }
        />
        {closingSoon.length === 0 ? (
          <EmptyState
            title="Nothing is taking sign-ups right now"
            body="Everything the cohort has posted has either filled up or passed its deadline. That is usually the moment to post one of your own."
            action={<LinkButton href="/post">Post a trip or activity</LinkButton>}
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {closingSoon.map((q) => (
              <QuestCard key={q.id} view={questView(state, q)} />
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

      <footer className="border-t border-line pt-6">
        <p className="type-meta text-faint">
          {quests.length} trips and activities open across the cohort ·{' '}
          <Link href="/profile" className="underline">
            manage your demo data
          </Link>
        </p>
      </footer>
    </div>
  );
}
