import type { Attendance, NormalizedEvent } from '@/lib/domain/types';
import { COHORT_USERS } from '@/lib/seed/users';
import { engageScSource } from './adapters/engagesc';
import { handshakeSource } from './adapters/handshake';
import { lumaSource } from './adapters/luma';
import { partifulSource } from './adapters/partiful';
import { aggregate, type AggregateResult, type EventSource } from './source';

export const EVENT_SOURCES: EventSource[] = [
  engageScSource,
  lumaSource,
  partifulSource,
  handshakeSource,
];

export async function loadAllEvents(): Promise<AggregateResult> {
  return aggregate(EVENT_SOURCES);
}

/**
 * Attendance is seeded rather than random so the "two named friends plus N others" line always
 * has names in it. Every event gets between four and eighteen people, drawn deterministically
 * from the cohort by an offset that depends on the event id — so the same event always shows
 * the same faces, and no event is empty.
 */
export function buildAttendance(events: NormalizedEvent[]): Attendance[] {
  const attendance: Attendance[] = [];
  const total = COHORT_USERS.length;

  events.forEach((event, eventIndex) => {
    const hash = [...event.id].reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
    const goingCount = 4 + (hash % 11);
    const interestedCount = 2 + ((hash >> 2) % 6);
    const stride = 3 + (eventIndex % 5);

    const taken = new Set<number>();
    for (let i = 0; i < goingCount + interestedCount; i += 1) {
      let idx = (hash + i * stride) % total;
      let guard = 0;
      while (taken.has(idx) && guard < total) {
        idx = (idx + 1) % total;
        guard += 1;
      }
      if (taken.has(idx)) break;
      taken.add(idx);

      const user = COHORT_USERS[idx];
      // Under-21s do not turn up as "going" to a door that will refuse them.
      if (event.is21Plus && user.age < 21) continue;

      attendance.push({
        eventId: event.id,
        userId: user.id,
        state: i < goingCount ? 'going' : 'interested',
      });
    }
  });

  return attendance;
}

export type { AggregateResult, EventSource };
