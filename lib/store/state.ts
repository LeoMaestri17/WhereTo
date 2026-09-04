import type {
  Attendance,
  AttendanceState,
  CohortUser,
  InterestTag,
  Membership,
  Quest,
  UserConstraints,
} from '@/lib/domain/types';
import type { ResearchPlan } from '@/lib/research/types';
import { buildFriendships, COHORT_USERS } from '@/lib/seed/users';
import { buildMemberships, buildQuests } from '@/lib/seed/quests';

/**
 * Everything the app remembers between reloads. Events are deliberately not in here: they come
 * from the source adapters on every boot, because that is what they would do against a real API.
 */
export interface AppState {
  version: number;
  /** False until local state has been read back. Not persisted — the reducer always sets it. */
  hydrated: boolean;
  currentUserId: string | null;
  onboarded: boolean;
  users: CohortUser[];
  friendships: Record<string, string[]>;
  quests: Quest[];
  memberships: Membership[];
  attendance: Attendance[];
  /** Research plans kept alongside the quest that was posted from them. */
  savedPlans: Record<string, ResearchPlan>;
  /** The last plan the user researched, so returning to an idea does not re-run the call. */
  planCache: Record<string, ResearchPlan>;
}

// Bumped when the persisted shape changes: readPersisted returns null on a mismatch and the
// seed is rebuilt. Version 2 added quest visibility, invitedUserIds and the trip/activity rename.
export const STATE_VERSION = 2;

export function buildSeedState(): AppState {
  return {
    version: STATE_VERSION,
    hydrated: false,
    currentUserId: null,
    onboarded: false,
    users: COHORT_USERS,
    friendships: buildFriendships(),
    quests: buildQuests(),
    memberships: buildMemberships(),
    attendance: [],
    savedPlans: {},
    planCache: {},
  };
}

/* ------------------------------------------------------------------ actions */

export type Action =
  | { type: 'hydrate'; state: AppState }
  | { type: 'seedAttendance'; attendance: Attendance[] }
  | { type: 'chooseProfile'; userId: string }
  | {
      type: 'createProfile';
      user: Omit<CohortUser, 'id' | 'photo' | 'cohort'> & { photo?: string };
    }
  | { type: 'completeOnboarding'; interests: InterestTag[]; constraints: UserConstraints }
  | { type: 'updateProfile'; interests: InterestTag[]; constraints: UserConstraints }
  | { type: 'toggleFriend'; userId: string }
  | { type: 'requestJoin'; questId: string; message?: string }
  | { type: 'withdrawRequest'; questId: string }
  | { type: 'decideRequest'; questId: string; userId: string; approve: boolean }
  | { type: 'cancelQuest'; questId: string; reason: string }
  | { type: 'createQuest'; quest: Quest; plan?: ResearchPlan }
  | { type: 'setAttendance'; eventId: string; state: AttendanceState | null }
  | { type: 'cachePlan'; key: string; plan: ResearchPlan }
  | { type: 'reset' };

function withMembership(
  memberships: Membership[],
  questId: string,
  userId: string,
  next: Membership | null,
): Membership[] {
  const rest = memberships.filter((m) => !(m.questId === questId && m.userId === userId));
  return next ? [...rest, next] : rest;
}

export function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'hydrate':
      // One dispatch does the whole handover, so there is never a render where the app is
      // considered hydrated but is still showing seed data.
      return { ...action.state, hydrated: true };

    case 'seedAttendance':
      return state.attendance.length > 0 ? state : { ...state, attendance: action.attendance };

    case 'chooseProfile':
      return { ...state, currentUserId: action.userId };

    case 'createProfile': {
      const id = `u-new-${Date.now().toString(36)}`;
      const user: CohortUser = {
        ...action.user,
        id,
        photo: action.user.photo ?? '',
        cohort: 'Fall exchange',
      };
      return {
        ...state,
        users: [...state.users, user],
        friendships: { ...state.friendships, [id]: [] },
        currentUserId: id,
      };
    }

    case 'completeOnboarding':
    case 'updateProfile': {
      if (!state.currentUserId) return state;
      const id = state.currentUserId;
      return {
        ...state,
        onboarded: action.type === 'completeOnboarding' ? true : state.onboarded,
        users: state.users.map((u) =>
          u.id === id
            ? {
                ...u,
                interests: action.interests,
                age: action.constraints.isOver21 ? Math.max(u.age, 21) : Math.min(u.age, 20),
                hasCar: action.constraints.hasCar,
                hasUsCreditCard: action.constraints.hasUsCreditCard,
              }
            : u,
        ),
      };
    }

    case 'toggleFriend': {
      if (!state.currentUserId || state.currentUserId === action.userId) return state;
      const me = state.currentUserId;
      const mine = state.friendships[me] ?? [];
      const theirs = state.friendships[action.userId] ?? [];
      const isFriend = mine.includes(action.userId);
      return {
        ...state,
        friendships: {
          ...state.friendships,
          [me]: isFriend ? mine.filter((f) => f !== action.userId) : [...mine, action.userId],
          [action.userId]: isFriend ? theirs.filter((f) => f !== me) : [...theirs, me],
        },
      };
    }

    case 'requestJoin': {
      if (!state.currentUserId) return state;
      return {
        ...state,
        memberships: withMembership(state.memberships, action.questId, state.currentUserId, {
          questId: action.questId,
          userId: state.currentUserId,
          state: 'requested',
          message: action.message,
          requestedAt: new Date().toISOString(),
        }),
      };
    }

    case 'withdrawRequest': {
      if (!state.currentUserId) return state;
      return {
        ...state,
        memberships: withMembership(state.memberships, action.questId, state.currentUserId, null),
      };
    }

    case 'decideRequest': {
      const existing = state.memberships.find(
        (m) => m.questId === action.questId && m.userId === action.userId,
      );
      if (!existing) return state;
      return {
        ...state,
        memberships: withMembership(state.memberships, action.questId, action.userId, {
          ...existing,
          state: action.approve ? 'approved' : 'declined',
          decidedAt: new Date().toISOString(),
        }),
      };
    }

    case 'cancelQuest':
      return {
        ...state,
        quests: state.quests.map((q) =>
          q.id === action.questId
            ? {
                ...q,
                lifecycle: 'cancelled',
                description: `${action.reason.trim()}\n\n${q.description}`,
              }
            : q,
        ),
      };

    case 'createQuest':
      return {
        ...state,
        quests: [action.quest, ...state.quests],
        savedPlans: action.plan
          ? { ...state.savedPlans, [action.quest.id]: action.plan }
          : state.savedPlans,
      };

    case 'setAttendance': {
      if (!state.currentUserId) return state;
      const me = state.currentUserId;
      const rest = state.attendance.filter(
        (a) => !(a.eventId === action.eventId && a.userId === me),
      );
      return {
        ...state,
        attendance: action.state
          ? [...rest, { eventId: action.eventId, userId: me, state: action.state }]
          : rest,
      };
    }

    case 'cachePlan':
      return { ...state, planCache: { ...state.planCache, [action.key]: action.plan } };

    case 'reset':
      // Back to the seed, but still hydrated — the boot screen is for the first read only.
      return { ...buildSeedState(), hydrated: true };

    default:
      return state;
  }
}
