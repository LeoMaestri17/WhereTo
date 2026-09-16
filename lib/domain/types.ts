/**
 * The SideQuest domain model.
 *
 * One thing this app does: a student in Los Angeles says who they are and when they are free,
 * and it names places worth going and what they actually cost. Everything here serves that.
 *
 * There is no cohort, no hosting and no joining. Those existed once and were removed — the app
 * is a planner, not a noticeboard.
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
  wellness: 'Wellness',
};

/* ------------------------------------------------------------------ money */

export interface CostEstimate {
  minPerPerson: number;
  maxPerPerson: number;
  /** Where the number came from, shown verbatim under the figure. */
  basis: string;
}

/* ------------------------------------------------------------------ idea bank */

export type IdeaShape = 'day' | 'weekend' | 'break';

export const IDEA_SHAPE_LABELS: Record<IdeaShape, string> = {
  day: 'Day trips',
  weekend: 'Weekend trips',
  break: 'Longer trips',
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
