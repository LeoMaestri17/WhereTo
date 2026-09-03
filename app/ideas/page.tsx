'use client';

import { useState } from 'react';
import { IdeaCard } from '@/components/cards';
import { Chip, EmptyState, SectionHeader } from '@/components/ui';
import { IDEA_SHAPE_LABELS, type IdeaShape } from '@/lib/domain/types';
import { cachedPlanSlugs } from '@/lib/research/cached';
import { IDEAS } from '@/lib/seed/ideas';

const SHAPES: IdeaShape[] = ['day', 'weekend', 'break'];

const SHAPE_BLURB: Record<IdeaShape, string> = {
  day: 'Out and back in a day. Most of these need no car and no planning beyond turning up.',
  weekend: 'Two or three nights. Far enough that somebody has to organise it, which is the whole problem.',
  break: 'Thanksgiving week. The flight is the cost and it goes up every week you wait.',
};

const CACHED = new Set(cachedPlanSlugs());

export default function IdeasPage() {
  const [shape, setShape] = useState<IdeaShape | 'all'>('all');
  const [carlessOnly, setCarlessOnly] = useState(false);

  const filtered = IDEAS.filter((i) => (shape === 'all' ? true : i.shape === shape)).filter((i) =>
    carlessOnly ? !i.needsCar : true,
  );

  return (
    <div className="space-y-8">
      <header>
        <p className="type-micro text-accent">Idea bank</p>
        <h1 className="type-display mt-2 max-w-2xl">
          Somewhere to start, when nobody can think of anything.
        </h1>
        <p className="type-body mt-2 max-w-xl text-muted">
          Pick one and it opens a planner. Set your dates, your group and whether you have a car,
          and you get a costed plan with the surcharges nobody quotes you.
        </p>
      </header>

      <div className="sq-rail -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
        <Chip active={shape === 'all'} onClick={() => setShape('all')}>
          Everything
        </Chip>
        {SHAPES.map((s) => (
          <Chip key={s} active={shape === s} onClick={() => setShape(s)}>
            {IDEA_SHAPE_LABELS[s]}
          </Chip>
        ))}
        <span className="mx-1 w-px shrink-0 bg-line" aria-hidden="true" />
        <Chip active={carlessOnly} onClick={() => setCarlessOnly((v) => !v)}>
          Works without a car
        </Chip>
      </div>

      {shape === 'all' ? (
        SHAPES.map((s) => {
          const group = filtered.filter((i) => i.shape === s);
          if (group.length === 0) return null;
          return (
            <section key={s}>
              <SectionHeader title={IDEA_SHAPE_LABELS[s]} detail={SHAPE_BLURB[s]} />
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {group.map((idea) => (
                  <IdeaCard key={idea.slug} idea={idea} hasCached={CACHED.has(idea.slug)} />
                ))}
              </div>
            </section>
          );
        })
      ) : (
        <section>
          <SectionHeader title={IDEA_SHAPE_LABELS[shape]} detail={SHAPE_BLURB[shape]} />
          {filtered.length === 0 ? (
            <EmptyState
              title="Nothing in this shape works without a car"
              body="Every destination in this group needs a vehicle for at least part of it. Day trips and the San Diego, Vegas and San Francisco weekends all work on public transport."
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((idea) => (
                <IdeaCard key={idea.slug} idea={idea} hasCached={CACHED.has(idea.slug)} />
              ))}
            </div>
          )}
        </section>
      )}

      <p className="type-meta text-faint">
        &ldquo;Plan ready&rdquo; means there is a saved, costed plan for that destination that
        works with no API key. The rest need a key to research live.
      </p>
    </div>
  );
}
