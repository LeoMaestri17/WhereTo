'use client';

import Link from 'next/link';
import type { AttendanceSignal as Signal } from '@/lib/domain/logic';
import { formatRange } from '@/lib/domain/logic';
import type { Idea, NormalizedEvent } from '@/lib/domain/types';
import { EVENT_SOURCE_LABELS } from '@/lib/domain/types';
import type { QuestView } from '@/lib/store/selectors';
import { formatDateRange, formatDayWithWeekday, formatTime, relativeDay } from '@/lib/util/dates';
import { CapacityMeter, DeadlineCountdown } from './commitment';
import { AttendanceSignal } from './people';
import { SmartImage } from './SmartImage';
import { MetaRow, StatusPill } from './ui';

const CARD =
  'group flex flex-col overflow-hidden rounded-xl border border-line bg-surface shadow-[var(--shadow-card)] transition-[border-color] hover:border-line-strong';

/* ------------------------------------------------------------------ quests */

export function QuestCard({ view }: { view: QuestView }) {
  const { quest, status, capacity, signal } = view;
  const dimmed = status === 'cancelled' || status === 'closed';

  return (
    <Link href={`/quests/${quest.id}`} className={CARD}>
      <div className="relative aspect-[16/10] overflow-hidden bg-surface-2">
        <SmartImage
          photoId={quest.cover}
          alt={quest.destination}
          width={720}
          height={450}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className={`h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03] ${
            dimmed ? 'opacity-55 saturate-50' : ''
          }`}
        />
        <div className="absolute left-3 top-3 flex gap-2">
          <StatusPill status={status} />
        </div>
        <span className="absolute right-3 top-3 rounded-full bg-surface/95 px-2.5 py-1 type-micro text-muted backdrop-blur-sm">
          {quest.kind === 'trip' ? 'Trip' : 'Plan'}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="type-heading line-clamp-2">{quest.title}</h3>
        <MetaRow
          items={[
            quest.destination,
            formatDateRange(quest.startDate, quest.endDate),
            quest.timeLabel,
          ]}
        />

        <div className="mt-3 space-y-2">
          {status === 'completed' ? (
            <p className="type-meta text-muted">
              Ran {relativeDay(quest.startDate)} · {capacity.taken} went
            </p>
          ) : status === 'cancelled' ? (
            <p className="type-meta text-danger">Called off by the host</p>
          ) : (
            <>
              <CapacityMeter capacity={capacity} />
              <DeadlineCountdown deadline={quest.signupDeadline} />
            </>
          )}
        </div>

        <div className="mt-auto pt-3">
          <AttendanceSignal signal={signal} />
          {quest.costEstimate ? (
            <p className="type-meta mt-2 text-muted">
              <span className="font-medium text-ink">
                {formatRange(quest.costEstimate.minPerPerson, quest.costEstimate.maxPerPerson)}
              </span>{' '}
              each · {quest.costEstimate.basis}
            </p>
          ) : null}
        </div>
      </div>
    </Link>
  );
}

/* ------------------------------------------------------------------ events */

export function EventCard({
  event,
  signal,
  attending,
  onAttend,
}: {
  event: NormalizedEvent;
  signal: Signal;
  attending: 'going' | 'interested' | null;
  onAttend: (next: 'going' | 'interested' | null) => void;
}) {
  return (
    <article className={CARD}>
      <a
        href={event.url}
        target="_blank"
        rel="noopener noreferrer"
        className="relative block aspect-[16/10] overflow-hidden bg-surface-2"
      >
        <SmartImage
          photoId={event.image}
          alt={event.title}
          width={720}
          height={450}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
        <span className="absolute left-3 top-3 rounded-full bg-surface/95 px-2.5 py-1 type-micro text-ink backdrop-blur-sm">
          {EVENT_SOURCE_LABELS[event.source]}
        </span>
        {event.is21Plus ? (
          <span className="absolute right-3 top-3 rounded-full bg-warn-soft px-2.5 py-1 type-micro text-warn">
            21+
          </span>
        ) : null}
      </a>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="type-heading line-clamp-2">{event.title}</h3>
        <MetaRow
          items={[
            `${formatDayWithWeekday(event.startsAt)}, ${formatTime(event.startsAt)}`,
            event.venueArea,
          ]}
        />
        <p className="type-meta mt-2 line-clamp-2 text-muted">{event.description}</p>

        <div className="mt-3 flex items-center justify-between gap-3">
          <span className="type-meta font-medium text-ink">{event.costLabel}</span>
          <span className="type-meta text-muted">{event.hostOrg}</span>
        </div>

        <div className="mt-auto pt-3">
          <AttendanceSignal signal={signal} />
          <div className="mt-3 flex gap-2">
            <AttendButton
              active={attending === 'going'}
              onClick={() => onAttend(attending === 'going' ? null : 'going')}
            >
              Going
            </AttendButton>
            <AttendButton
              active={attending === 'interested'}
              onClick={() => onAttend(attending === 'interested' ? null : 'interested')}
            >
              Want to go
            </AttendButton>
            <ShareButton event={event} />
          </div>
        </div>
      </div>
    </article>
  );
}

function AttendButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-lg px-3 py-1.5 text-[0.8125rem] font-medium transition-colors ${
        active
          ? 'bg-accent text-[var(--accent-text)]'
          : 'border border-line bg-surface text-muted hover:text-ink'
      }`}
    >
      {children}
    </button>
  );
}

function ShareButton({ event }: { event: NormalizedEvent }) {
  return (
    <button
      type="button"
      className="ml-auto rounded-lg border border-line px-3 py-1.5 text-[0.8125rem] text-muted transition-colors hover:text-ink"
      onClick={async () => {
        const text = `${event.title} — ${formatDayWithWeekday(event.startsAt)}, ${event.venueName}`;
        try {
          if (navigator.share) {
            await navigator.share({ title: event.title, text, url: event.url });
          } else {
            await navigator.clipboard.writeText(`${text}\n${event.url}`);
          }
        } catch {
          // The user dismissed the share sheet, or the clipboard is unavailable. Nothing to do.
        }
      }}
    >
      Share
    </button>
  );
}

/* ------------------------------------------------------------------ ideas */

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
