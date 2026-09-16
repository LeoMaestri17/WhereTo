'use client';

import Link from 'next/link';
import type { Idea } from '@/lib/domain/types';
import { SmartImage } from './SmartImage';

const CARD =
  'group flex flex-col overflow-hidden rounded-xl border border-line bg-surface shadow-[var(--shadow-card)] transition-[border-color] hover:border-line-strong';

/**
 * The card leads with the reason to go, not a description of the place, and carries the two
 * numbers somebody actually decides on: what it costs each and how long it takes.
 */
export function IdeaCard({ idea, hasCached }: { idea: Idea; hasCached: boolean }) {
  return (
    <Link href={`/ideas/${idea.slug}`} className={CARD}>
      <div className="relative aspect-[4/3] overflow-hidden bg-surface-2">
        <SmartImage
          photoId={idea.image}
          alt={idea.title}
          width={720}
          height={540}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
        {hasCached ? (
          <span className="absolute left-3 top-3 rounded-full bg-surface/95 px-2.5 py-1 type-micro text-muted backdrop-blur-sm">
            Plan ready
          </span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="type-heading">{idea.title}</h3>
        <p className="type-meta mt-0.5 text-faint">{idea.region}</p>
        <p className="type-body mt-2 line-clamp-3 text-muted">{idea.hook}</p>
        <div className="mt-auto flex items-baseline justify-between gap-3 pt-4">
          <span className="type-meta font-medium text-ink">{idea.costBandLabel}</span>
          <span className="type-meta text-muted">{idea.durationLabel}</span>
        </div>
      </div>
    </Link>
  );
}
