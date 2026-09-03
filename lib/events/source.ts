import type { EventSourceId, NormalizedEvent } from '@/lib/domain/types';

/**
 * The one interface every event feed goes through.
 *
 * All four implementations today are fixture-backed. Each adapter owns the shape of its own
 * source and is responsible for normalising it — so replacing one with a real integration means
 * rewriting a single `fetchEvents` and touching nothing downstream. The per-adapter files each
 * name what would replace them.
 */
export interface EventSource {
  readonly id: EventSourceId;
  readonly label: string;
  /** What a real integration against this source would be, in one line. */
  readonly realIntegration: string;
  fetchEvents(): Promise<NormalizedEvent[]>;
}

export class EventSourceError extends Error {
  constructor(
    readonly sourceId: EventSourceId,
    message: string,
  ) {
    super(message);
    this.name = 'EventSourceError';
  }
}

export interface AggregateResult {
  events: NormalizedEvent[];
  /** Sources that failed, so the feed can say which part of it is missing rather than pretend. */
  failed: Array<{ sourceId: EventSourceId; label: string; message: string }>;
}

/**
 * Fan out across every source. One source failing degrades the feed, it does not empty it —
 * the UI names the source that is missing.
 */
export async function aggregate(sources: EventSource[]): Promise<AggregateResult> {
  const settled = await Promise.allSettled(
    sources.map(async (s) => ({ source: s, events: await s.fetchEvents() })),
  );

  const events: NormalizedEvent[] = [];
  const failed: AggregateResult['failed'] = [];

  settled.forEach((result, i) => {
    const source = sources[i];
    if (result.status === 'fulfilled') {
      events.push(...result.value.events);
    } else {
      failed.push({
        sourceId: source.id,
        label: source.label,
        message:
          result.reason instanceof Error ? result.reason.message : 'Source did not respond',
      });
    }
  });

  events.sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  return { events, failed };
}
