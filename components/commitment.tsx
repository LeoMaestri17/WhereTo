'use client';

import { useEffect, useState } from 'react';
import { countdownTo, formatCountdown } from '@/lib/util/dates';
import type { QuestCapacity } from '@/lib/domain/logic';

/**
 * The deadline is the thing that makes anyone act, so it ticks. It only starts ticking after
 * mount — the server has no business rendering a clock it cannot keep.
 */
export function DeadlineCountdown({
  deadline,
  className = '',
  emphasis = 'auto',
}: {
  deadline: string;
  className?: string;
  /** 'auto' turns urgent under 48 hours. 'quiet' never does. */
  emphasis?: 'auto' | 'quiet';
}) {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const remaining = new Date(deadline).getTime() - Date.now();
    // Tick every second inside the last hour, every half minute otherwise. There is no reason
    // to re-render a "12 days left" label sixty times a minute.
    const interval = remaining > 0 && remaining < 3_600_000 ? 1000 : 30_000;
    const id = setInterval(() => setNow(Date.now()), interval);
    return () => clearInterval(id);
  }, [deadline]);

  if (now === null) {
    // Matches the server render exactly, so there is nothing for hydration to disagree about.
    return <span className={`type-meta text-muted ${className}`}>Sign-ups close soon</span>;
  }

  const c = countdownTo(deadline, now);
  const urgent = emphasis === 'auto' && !c.passed && c.totalMs < 48 * 3_600_000;

  return (
    <span
      className={`type-meta font-medium ${
        c.passed ? 'text-muted' : urgent ? 'text-accent' : 'text-ink'
      } ${className}`}
    >
      {formatCountdown(c)}
    </span>
  );
}

/**
 * Remaining spots, shown as a figure and a bar. The bar exists so a card can be read at a
 * glance from a phone held at waist height, which is how this gets used.
 */
export function CapacityMeter({
  capacity,
  compact = false,
  className = '',
}: {
  capacity: QuestCapacity;
  compact?: boolean;
  className?: string;
}) {
  const pct = Math.min(100, Math.round((capacity.taken / Math.max(1, capacity.capacity)) * 100));
  const tight = capacity.remaining > 0 && capacity.remaining <= 2;

  const label =
    capacity.remaining === 0
      ? `All ${capacity.capacity} spots taken`
      : capacity.remaining === 1
        ? '1 spot left'
        : `${capacity.remaining} spots left`;

  if (compact) {
    return (
      <span
        className={`type-meta font-medium ${tight ? 'text-accent' : 'text-ink'} ${className}`}
      >
        {label}
      </span>
    );
  }

  return (
    <div className={className}>
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <span className={`type-meta font-medium ${tight ? 'text-accent' : 'text-ink'}`}>
          {label}
        </span>
        <span className="type-meta text-muted">
          {capacity.taken} of {capacity.capacity} going
        </span>
      </div>
      <div
        className="h-1.5 w-full overflow-hidden rounded-full bg-surface-3"
        role="img"
        aria-label={`${capacity.taken} of ${capacity.capacity} spots taken`}
      >
        <div
          className={`h-full rounded-full transition-[width] duration-300 ${
            capacity.remaining === 0 ? 'bg-line-strong' : tight ? 'bg-accent' : 'bg-ink/45'
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
