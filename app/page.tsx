'use client';

import Link from 'next/link';
import { useState } from 'react';
import { IdeaCard } from '@/components/cards';
import { RotatingWord } from '@/components/RotatingWord';
import { Chip, LinkButton, SectionHeader } from '@/components/ui';
import { IDEA_SHAPE_LABELS, type IdeaShape } from '@/lib/domain/types';
import { cachedPlanSlugs } from '@/lib/research/cached';
import { IDEAS } from '@/lib/seed/ideas';

const CACHED = new Set(cachedPlanSlugs());

/**
 * The home screen is the planning screen.
 *
 * The core loop: browse trips, click one, and it goes and finds what it really costs. The guided
 * questions above it are the way in for people who do not yet know where they want to go.
 *
 * Phase 2 replaces this with the intake flow proper — this is the interim landing while the
 * social layer comes out.
 */
export default function HomePage() {
  const [shape, setShape] = useState<IdeaShape | 'all'>('all');
  const ideas = shape === 'all' ? IDEAS : IDEAS.filter((i) => i.shape === shape);

  return (
    <div className="space-y-14">
      <header className="pt-2">
        <p className="type-micro text-accent">SideQuest</p>
        <h1 className="type-display mt-3 max-w-3xl">
          Where should you go{' '}
          <RotatingWord words={['this weekend', 'next month', 'over the break', 'before you fly home']} />?
        </h1>
        <p className="type-body mt-3 max-w-xl text-muted">
          Pick something below and it will go and find what it actually costs — real flights, a
          real hotel, and the surcharges nobody quotes a nineteen-year-old.
        </p>
      </header>

      <Link
        href="/plan"
        className="group flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl border border-line bg-surface p-5 transition-colors hover:border-accent sm:p-6"
      >
        <span className="min-w-0 flex-1">
          <span className="type-title block">Not sure yet — help me pick</span>
          <span className="type-body mt-1 block text-muted">
            A few questions about when you are free, who is going and what you can spend, then the
            places that actually fit.
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
    </div>
  );
}
