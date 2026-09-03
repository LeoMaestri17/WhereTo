import type {
  Attendance,
  CohortUser,
  Membership,
  Quest,
  QuestStatus,
  TripActuals,
} from './types';

/* ------------------------------------------------------------------ capacity and status */

export interface QuestCapacity {
  capacity: number;
  /** The host always occupies one seat. */
  taken: number;
  remaining: number;
}

export function questCapacity(quest: Quest, memberships: Membership[]): QuestCapacity {
  const approved = memberships.filter(
    (m) => m.questId === quest.id && m.state === 'approved',
  ).length;
  const taken = 1 + approved;
  return {
    capacity: quest.capacity,
    taken,
    remaining: Math.max(0, quest.capacity - taken),
  };
}

/**
 * Status is always computed, never stored, so it cannot drift away from the capacity and the
 * deadline — the two things the whole product turns on. Order matters: a cancelled trip is
 * cancelled even if it was also full.
 */
export function deriveQuestStatus(
  quest: Quest,
  memberships: Membership[],
  now = Date.now(),
): QuestStatus {
  if (quest.lifecycle === 'cancelled') return 'cancelled';
  if (quest.lifecycle === 'completed') return 'completed';

  const { remaining } = questCapacity(quest, memberships);
  if (remaining === 0) return 'full';
  if (new Date(quest.signupDeadline).getTime() <= now) return 'closed';
  if (remaining <= 2) return 'filling';
  return 'open';
}

export const STATUS_LABELS: Record<QuestStatus, string> = {
  open: 'Open',
  filling: 'Almost full',
  full: 'Full',
  closed: 'Sign-ups closed',
  cancelled: 'Cancelled',
  completed: 'Been and done',
};

/** Whether anybody at all can still ask to join. */
export function isJoinable(status: QuestStatus): boolean {
  return status === 'open' || status === 'filling';
}

/* ------------------------------------------------------------------ the viewer's position */

export type ViewerRelation =
  | 'host'
  | 'approved'
  | 'requested'
  | 'declined'
  | 'withdrawn'
  | 'none';

export function viewerRelation(
  quest: Quest,
  memberships: Membership[],
  userId: string | null,
): ViewerRelation {
  if (!userId) return 'none';
  if (quest.hostId === userId) return 'host';
  const m = memberships.find((x) => x.questId === quest.id && x.userId === userId);
  if (!m) return 'none';
  return m.state === 'approved'
    ? 'approved'
    : m.state === 'requested'
      ? 'requested'
      : m.state === 'declined'
        ? 'declined'
        : 'withdrawn';
}

/**
 * The single source of truth for what the join control says and whether it does anything.
 * Every edge state the brief calls for resolves here rather than in the component.
 */
export interface JoinAffordance {
  /** Rendered as a button only when `action` is set; otherwise it is a plain status line. */
  label: string;
  action: 'request' | 'withdraw' | 'none';
  detail?: string;
  tone: 'accent' | 'quiet' | 'warn';
}

export function joinAffordance(
  quest: Quest,
  memberships: Membership[],
  userId: string | null,
): JoinAffordance {
  const status = deriveQuestStatus(quest, memberships);
  const relation = viewerRelation(quest, memberships, userId);
  const noun = quest.kind === 'trip' ? 'trip' : 'plan';

  if (relation === 'host') {
    return {
      label: 'You are hosting this',
      action: 'none',
      detail:
        status === 'completed'
          ? 'Add what people actually paid so the next group has a real number to work from.'
          : 'Requests to join come to you.',
      tone: 'quiet',
    };
  }

  if (status === 'cancelled') {
    return {
      label: 'Called off by the host',
      action: 'none',
      detail: 'Nobody is going. The host has said why above.',
      tone: 'warn',
    };
  }

  if (status === 'completed') {
    return {
      label: relation === 'approved' ? 'You went on this' : 'This one has already run',
      action: 'none',
      detail:
        relation === 'approved'
          ? 'What you reported paying is in the breakdown below.'
          : 'What it actually cost is in the breakdown below.',
      tone: 'quiet',
    };
  }

  if (relation === 'approved') {
    return {
      label: `You are going`,
      action: 'withdraw',
      detail: `The host will see that you have dropped out and your seat goes back.`,
      tone: 'quiet',
    };
  }

  if (relation === 'requested') {
    return {
      label: 'Requested — waiting on the host',
      action: 'withdraw',
      detail: 'You can take the request back at any point before they decide.',
      tone: 'quiet',
    };
  }

  if (relation === 'declined') {
    return {
      label: 'The host said no to this one',
      action: 'none',
      detail: 'It usually means the group was already set rather than anything about you.',
      tone: 'quiet',
    };
  }

  if (status === 'full') {
    return {
      label: 'Full',
      action: 'none',
      detail: `Every seat is taken. If someone drops out this reopens on its own.`,
      tone: 'warn',
    };
  }

  if (status === 'closed') {
    return {
      label: 'Sign-ups have closed',
      action: 'none',
      detail: `The host set a deadline so they could book. It has passed.`,
      tone: 'warn',
    };
  }

  return {
    label: `Ask to join this ${noun}`,
    action: 'request',
    tone: 'accent',
  };
}

/* ------------------------------------------------------------------ attendance signal */

export interface AttendanceSignal {
  /** Friends going, in a stable order, capped at two for the sentence. */
  namedFriends: CohortUser[];
  friendCount: number;
  /** Everyone else from the cohort, excluding the named friends and the viewer. */
  otherCount: number;
  totalGoing: number;
  /** The whole line, already written. */
  sentence: string;
}

function buildSentence(
  named: CohortUser[],
  others: number,
  verb: string,
  viewerIsGoing: boolean,
): string {
  const firstNames = named.map((u) => u.name.split(' ')[0]);
  if (firstNames.length === 0) {
    if (others === 0) {
      // Your own post, before anyone has joined. "Nobody from the cohort yet" would be wrong —
      // you are somebody, and you are going.
      return viewerIsGoing ? `Just you so far` : `Nobody from the cohort yet`;
    }
    const line = `${others} exchange ${others === 1 ? 'student' : 'students'} ${verb}`;
    return viewerIsGoing ? `You and ${line}` : line;
  }
  const names =
    firstNames.length === 1 ? firstNames[0] : `${firstNames[0]} and ${firstNames[1]}`;
  const tail =
    others === 0
      ? `${names} ${verb}`
      : `${names}, plus ${others} other exchange ${others === 1 ? 'student' : 'students'} ${verb}`;
  return viewerIsGoing ? `You, ${tail}` : tail;
}

/**
 * "Ana and Jonas, plus 10 other exchange students going."
 *
 * This is logistics, not a score. It never ranks anything and it is never the reason one card
 * appears above another.
 */
export function attendanceSignal(
  goingUserIds: string[],
  usersById: Record<string, CohortUser>,
  friendIds: string[],
  viewerId: string | null,
  verb = 'going',
): AttendanceSignal {
  const friendSet = new Set(friendIds);
  const viewerIsGoing = viewerId !== null && goingUserIds.includes(viewerId);
  const going = goingUserIds.filter((id) => id !== viewerId);

  const friends = going
    .filter((id) => friendSet.has(id))
    .map((id) => usersById[id])
    .filter((u): u is CohortUser => Boolean(u));

  const namedFriends = friends.slice(0, 2);
  const otherCount = going.length - namedFriends.length;

  return {
    namedFriends,
    friendCount: friends.length,
    otherCount,
    totalGoing: going.length,
    sentence: buildSentence(namedFriends, otherCount, verb, viewerIsGoing),
  };
}

export function goingToQuest(quest: Quest, memberships: Membership[]): string[] {
  return [
    quest.hostId,
    ...memberships
      .filter((m) => m.questId === quest.id && m.state === 'approved')
      .map((m) => m.userId),
  ];
}

export function goingToEvent(eventId: string, attendance: Attendance[]): string[] {
  return attendance.filter((a) => a.eventId === eventId && a.state === 'going').map((a) => a.userId);
}

/* ------------------------------------------------------------------ actuals */

export interface ActualsSummary {
  estimatedTotal: number;
  actualTotal: number;
  difference: number;
  /** Positive means it cost more than the estimate said. */
  overBy: number;
  /** The single line item that moved the most, which is usually the interesting one. */
  biggestSurprise: TripActuals['lineItems'][number] | null;
}

export function summariseActuals(actuals: TripActuals): ActualsSummary {
  const estimatedTotal = actuals.lineItems.reduce((sum, l) => sum + l.estimated, 0);
  const actualTotal = actuals.lineItems.reduce((sum, l) => sum + l.actual, 0);
  const biggestSurprise = actuals.lineItems.reduce<TripActuals['lineItems'][number] | null>(
    (worst, l) =>
      !worst || Math.abs(l.actual - l.estimated) > Math.abs(worst.actual - worst.estimated)
        ? l
        : worst,
    null,
  );
  return {
    estimatedTotal,
    actualTotal,
    difference: actualTotal - estimatedTotal,
    overBy: Math.max(0, actualTotal - estimatedTotal),
    biggestSurprise,
  };
}

/* ------------------------------------------------------------------ money */

export function formatMoney(value: number): string {
  return `$${Math.round(value).toLocaleString('en-US')}`;
}

export function formatRange(min: number, max: number): string {
  if (min === max) return formatMoney(min);
  if (min === 0 && max === 0) return 'Free';
  return `${formatMoney(min)}–${formatMoney(max)}`;
}
