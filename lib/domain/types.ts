/**
 * The USC SideQuest domain model.
 *
 * One primitive underlies every object here: someone commits first, states a date and a
 * capacity, sets a deadline, and others join before that deadline. Trips and Plans are that
 * primitive posted by a student. Events are that primitive discovered elsewhere and wrapped
 * in a coordination layer.
 */

export type ID = string;

/* ------------------------------------------------------------------ interests */

export const INTEREST_TAGS = [
  'hiking',
  'beaches',
  'nightlife',
  'live-music',
  'sports',
  'food',
  'art',
  'photography',
  'road-trips',
  'national-parks',
  'surfing',
  'thrifting',
  'film',
  'career',
  'volunteering',
  'wellness',
] as const;

export type InterestTag = (typeof INTEREST_TAGS)[number];

export const INTEREST_LABELS: Record<InterestTag, string> = {
  hiking: 'Hiking',
  beaches: 'Beaches',
  nightlife: 'Nightlife',
  'live-music': 'Live music',
  sports: 'Sports',
  food: 'Food',
  art: 'Art',
  photography: 'Photography',
  'road-trips': 'Road trips',
  'national-parks': 'National parks',
  surfing: 'Surfing',
  thrifting: 'Thrifting',
  film: 'Film',
  career: 'Career',
  volunteering: 'Volunteering',
  wellness: 'Wellness',
};

/* ------------------------------------------------------------------ people */

export interface CohortUser {
  id: ID;
  name: string;
  /** Unsplash portrait. SmartImage falls back to initials if it fails to load. */
  photo: string;
  homeCountry: string;
  homeUniversity: string;
  /** Drives the under-21 constraint logic, which is most of the point of this app. */
  age: number;
  interests: InterestTag[];
  hasCar: boolean;
  hasUsCreditCard: boolean;
  bio: string;
  /** USC term they arrived for, e.g. 'Fall 2026'. */
  cohort: string;
}

/* ------------------------------------------------------------------ quests */

export type QuestKind = 'trip' | 'activity';

/** Stored lifecycle. Everything else about status is derived — see deriveQuestStatus. */
export type QuestLifecycle = 'active' | 'cancelled' | 'completed';

/**
 * Derived, never stored. Storing this would let it drift out of sync with the
 * capacity and the deadline, which are the two things the whole product turns on.
 */
export type QuestStatus =
  | 'open'
  | 'filling'
  | 'full'
  | 'closed'
  | 'cancelled'
  | 'completed';

export interface CostEstimate {
  minPerPerson: number;
  maxPerPerson: number;
  /** Where the number came from, shown verbatim under the figure. */
  basis: string;
}

export interface ActualLineItem {
  label: string;
  estimated: number;
  actual: number;
  note?: string;
}

/** What participants reported actually paying, per person, after the trip ran. */
export interface TripActuals {
  reportedBy: number;
  participantCount: number;
  lineItems: ActualLineItem[];
  /** Free-text from the host, written after the fact. */
  hostNote: string;
  reportedAt: string;
}

/**
 * Who can see a post at all.
 *
 * The insight this exists to serve: people want to travel with people they like, not with
 * whoever answers an advert. A private post never appears in the feed — you send the link.
 */
export type QuestVisibility = 'public' | 'private';

export interface Quest {
  id: ID;
  kind: QuestKind;
  title: string;
  destination: string;
  cover: string;
  visibility: QuestVisibility;
  /** Private posts only. The people the host actually asked. */
  invitedUserIds: ID[];
  /** Private posts only. Anyone holding this can open the post. */
  inviteCode?: string;
  /** ISO date. For an activity this is the single date. */
  startDate: string;
  /** ISO date. Trips only. */
  endDate?: string;
  /** Human time for an activity, e.g. '7:10pm tip-off'. */
  timeLabel?: string;
  capacity: number;
  hostId: ID;
  description: string;
  /** ISO datetime. After this, no one else can join. */
  signupDeadline: string;
  costEstimate?: CostEstimate;
  /** Slug of the research plan this was posted from, if any. */
  attachedPlanSlug?: string;
  lifecycle: QuestLifecycle;
  tags: InterestTag[];
  actuals?: TripActuals;
  createdAt: string;
  meetingPoint: string;
}

export type MembershipState = 'requested' | 'approved' | 'declined' | 'withdrawn';

export interface Membership {
  questId: ID;
  userId: ID;
  state: MembershipState;
  /** Optional note the requester wrote when asking to join. */
  message?: string;
  requestedAt: string;
  decidedAt?: string;
}

/* ------------------------------------------------------------------ events */

export type EventSourceId = 'engagesc' | 'luma' | 'partiful' | 'handshake';

export const EVENT_SOURCE_LABELS: Record<EventSourceId, string> = {
  engagesc: 'EngageSC',
  luma: 'Luma',
  partiful: 'Partiful',
  handshake: 'Handshake',
};

export type EventCategory =
  | 'campus'
  | 'nightlife'
  | 'outdoors'
  | 'culture'
  | 'career'
  | 'sports'
  | 'food';

export const EVENT_CATEGORY_LABELS: Record<EventCategory, string> = {
  campus: 'Campus',
  nightlife: 'Nightlife',
  outdoors: 'Outdoors',
  culture: 'Culture',
  career: 'Career',
  sports: 'Sports',
  food: 'Food',
};

/**
 * The shape every EventSource adapter must return. Adding a real integration means
 * writing one adapter that produces this — nothing downstream changes.
 */
export interface NormalizedEvent {
  id: ID;
  source: EventSourceId;
  /** The id this event carries in its own system, kept for de-duplication. */
  sourceEventId: string;
  title: string;
  description: string;
  image: string;
  /** ISO datetime. */
  startsAt: string;
  endsAt?: string;
  venueName: string;
  venueArea: string;
  /** Display string, e.g. 'Free', '$15', '$28–$60'. */
  costLabel: string;
  /** Lowest real cost in USD, or null when free. Used for the free-only filter. */
  costUsd: number | null;
  url: string;
  tags: InterestTag[];
  category: EventCategory;
  /** Who is putting it on, e.g. 'USC Ski & Snowboard Club'. */
  hostOrg: string;
  /** True when the door is 21+, which excludes a large slice of the cohort. */
  is21Plus: boolean;
}

export type AttendanceState = 'interested' | 'going';

export interface Attendance {
  eventId: ID;
  userId: ID;
  state: AttendanceState;
}

/* ------------------------------------------------------------------ idea bank */

export type IdeaShape = 'day' | 'weekend' | 'break';

export const IDEA_SHAPE_LABELS: Record<IdeaShape, string> = {
  day: 'Day trips',
  weekend: 'Weekend trips',
  break: 'Thanksgiving break',
};

export interface Idea {
  slug: string;
  title: string;
  /** Where it is, in the form a student would say it. */
  region: string;
  shape: IdeaShape;
  /** One line. The reason to go, not a description of the place. */
  hook: string;
  image: string;
  costBandLabel: string;
  costBandMin: number;
  costBandMax: number;
  durationLabel: string;
  /** Nights away. 0 for a day trip — used to prefill the planner's dates. */
  nights: number;
  tags: InterestTag[];
  /** Driving distance from USC, shown on the card and used by the no-car logic. */
  distanceLabel: string;
  needsCar: boolean;
}

/* ------------------------------------------------------------------ the user's own settings */

/** The constraints that make estimates specific to this user rather than generic. */
export interface UserConstraints {
  isOver21: boolean;
  hasCar: boolean;
  hasUsCreditCard: boolean;
}

export type BudgetBand = 'shoestring' | 'moderate' | 'comfortable';

export const BUDGET_BAND_LABELS: Record<BudgetBand, string> = {
  shoestring: 'As cheap as it goes',
  moderate: 'Reasonable',
  comfortable: 'Comfortable',
};
