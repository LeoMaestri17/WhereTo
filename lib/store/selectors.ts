import type {
  CohortUser,
  EventSourceId,
  InterestTag,
  Membership,
  NormalizedEvent,
  Quest,
  QuestStatus,
} from '@/lib/domain/types';
import {
  attendanceSignal,
  deriveQuestStatus,
  goingToEvent,
  goingToQuest,
  questCapacity,
  type AttendanceSignal,
  type QuestCapacity,
} from '@/lib/domain/logic';
import type { AppState } from './state';

export function usersById(state: AppState): Record<string, CohortUser> {
  return Object.fromEntries(state.users.map((u) => [u.id, u]));
}

export function currentUser(state: AppState): CohortUser | null {
  if (!state.currentUserId) return null;
  return state.users.find((u) => u.id === state.currentUserId) ?? null;
}

export function friendIds(state: AppState): string[] {
  if (!state.currentUserId) return [];
  return state.friendships[state.currentUserId] ?? [];
}

/* ------------------------------------------------------------------ quests */

export interface QuestView {
  quest: Quest;
  status: QuestStatus;
  capacity: QuestCapacity;
  host: CohortUser | null;
  signal: AttendanceSignal;
}

/**
 * The tense has to match what happened. Saying people are "going" to a trip that was called off
 * contradicts the panel next to it, which says nobody is.
 */
function attendanceVerb(quest: Quest): string {
  if (quest.lifecycle === 'completed') return 'went';
  if (quest.lifecycle === 'cancelled') return 'were going';
  return 'going';
}

export function questView(state: AppState, quest: Quest): QuestView {
  const byId = usersById(state);
  return {
    quest,
    status: deriveQuestStatus(quest, state.memberships),
    capacity: questCapacity(quest, state.memberships),
    host: byId[quest.hostId] ?? null,
    signal: attendanceSignal(
      goingToQuest(quest, state.memberships),
      byId,
      friendIds(state),
      state.currentUserId,
      attendanceVerb(quest),
    ),
  };
}

export function questById(state: AppState, id: string): Quest | null {
  return state.quests.find((q) => q.id === id) ?? null;
}

/** Quests still ahead of us, soonest first. Never ordered by how many people are going. */
export function upcomingQuests(state: AppState): Quest[] {
  const today = new Date().setHours(0, 0, 0, 0);
  return state.quests
    .filter((q) => q.lifecycle !== 'completed')
    .filter((q) => new Date(q.endDate ?? q.startDate).getTime() >= today)
    .sort((a, b) => a.startDate.localeCompare(b.startDate));
}

export function completedQuests(state: AppState): Quest[] {
  return state.quests
    .filter((q) => q.lifecycle === 'completed')
    .sort((a, b) => b.startDate.localeCompare(a.startDate));
}

export function hostedBy(state: AppState, userId: string | null): Quest[] {
  if (!userId) return [];
  return state.quests
    .filter((q) => q.hostId === userId)
    .sort((a, b) => a.startDate.localeCompare(b.startDate));
}

export function pendingRequestsFor(state: AppState, questId: string): Membership[] {
  return state.memberships
    .filter((m) => m.questId === questId && m.state === 'requested')
    .sort((a, b) => a.requestedAt.localeCompare(b.requestedAt));
}

export function decidedRequestsFor(state: AppState, questId: string): Membership[] {
  return state.memberships
    .filter((m) => m.questId === questId && (m.state === 'approved' || m.state === 'declined'))
    .sort((a, b) => (a.decidedAt ?? '').localeCompare(b.decidedAt ?? ''));
}

/** Every request across everything the given user hosts. */
export function inboxFor(state: AppState, userId: string | null): Membership[] {
  if (!userId) return [];
  const hosted = new Set(hostedBy(state, userId).map((q) => q.id));
  return state.memberships
    .filter((m) => m.state === 'requested' && hosted.has(m.questId))
    .sort((a, b) => a.requestedAt.localeCompare(b.requestedAt));
}

export function questsJoinedBy(state: AppState, userId: string | null): Quest[] {
  if (!userId) return [];
  const ids = new Set(
    state.memberships
      .filter((m) => m.userId === userId && (m.state === 'approved' || m.state === 'requested'))
      .map((m) => m.questId),
  );
  return state.quests
    .filter((q) => ids.has(q.id))
    .sort((a, b) => a.startDate.localeCompare(b.startDate));
}

/* ------------------------------------------------------------------ events */

export function eventSignal(
  state: AppState,
  event: NormalizedEvent,
  verb = 'going',
): AttendanceSignal {
  return attendanceSignal(
    goingToEvent(event.id, state.attendance),
    usersById(state),
    friendIds(state),
    state.currentUserId,
    verb,
  );
}

export function myAttendance(state: AppState, eventId: string): 'going' | 'interested' | null {
  if (!state.currentUserId) return null;
  const a = state.attendance.find(
    (x) => x.eventId === eventId && x.userId === state.currentUserId,
  );
  return a?.state ?? null;
}

export interface EventFilters {
  interests: InterestTag[];
  sources: EventSourceId[];
  /** Days ahead of today, or null for everything upcoming. */
  withinDays: number | null;
  freeOnly: boolean;
}

export const EMPTY_EVENT_FILTERS: EventFilters = {
  interests: [],
  sources: [],
  withinDays: null,
  freeOnly: false,
};

export function filterEvents(
  events: NormalizedEvent[],
  filters: EventFilters,
): NormalizedEvent[] {
  const now = Date.now();
  const horizon = filters.withinDays === null ? null : now + filters.withinDays * 86_400_000;

  return events
    .filter((e) => new Date(e.endsAt ?? e.startsAt).getTime() >= now)
    .filter((e) => (horizon === null ? true : new Date(e.startsAt).getTime() <= horizon))
    .filter((e) => (filters.sources.length ? filters.sources.includes(e.source) : true))
    .filter((e) => (filters.freeOnly ? e.costUsd === null : true))
    .filter((e) =>
      filters.interests.length ? e.tags.some((t) => filters.interests.includes(t)) : true,
    );
}

/**
 * Personalisation, not ranking. Events matching the user's interests come first; inside each
 * group the order is by date. Nothing is ever sorted by how many people are going.
 */
export function personaliseEvents(
  events: NormalizedEvent[],
  interests: InterestTag[],
): NormalizedEvent[] {
  if (interests.length === 0) return events;
  const set = new Set(interests);
  const matching = events.filter((e) => e.tags.some((t) => set.has(t)));
  const rest = events.filter((e) => !e.tags.some((t) => set.has(t)));
  return [...matching, ...rest];
}
