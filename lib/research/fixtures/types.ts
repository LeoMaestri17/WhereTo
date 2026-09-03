import type {
  Assumption,
  Confidence,
  ConstraintFlag,
  ResearchRequest,
  SourceLink,
} from '../types';

/**
 * A cached plan is not a frozen answer. It is a costed skeleton that still reacts to the
 * planner's inputs: options drop out when the user cannot use them, split costs re-divide by
 * the real group size, and the itinerary swaps to the carless variant where one exists.
 *
 * That is what makes the no-API-key experience honest rather than a screenshot.
 */

export type FixturePrice =
  /** Already per person, e.g. a bus ticket. */
  | { kind: 'per-person'; min: number; max: number }
  /**
   * A cost for the whole group that divides. `splitCap` is the most people it can divide
   * across — one car seats five, one motel room sleeps four — so a group of eight pays for two.
   */
  | { kind: 'split'; min: number; max: number; splitCap: number };

export interface FixtureLineItem {
  label: string;
  provider: string;
  detail: string;
  url?: string;
  /** May contain {n} for group size and {nights} for the number of nights. */
  basis: string;
  price: FixturePrice;
  /** Scales with the number of nights rather than being a flat cost. */
  perNight?: boolean;
}

export interface FixtureOption {
  id: string;
  name: string;
  bestFor: string;
  /** The option involves driving. Unavailable when the group has no vehicle and this option supplies none. */
  requiresDriver?: boolean;
  /** The option includes hiring a vehicle, so it works for a group that owns no car. */
  providesVehicle?: boolean;
  /** Dropped entirely when the user is under 21. */
  requiresOver21?: boolean;
  transport: FixtureLineItem[];
  accommodation: FixtureLineItem[];
  otherCosts: FixtureLineItem[];
}

export interface FixtureBlock {
  time: string;
  title: string;
  detail: string;
  place?: string;
}

export interface FixtureDay {
  /** Days after the start date. */
  dayOffset: number;
  label: string;
  blocks: FixtureBlock[];
}

export interface PlanFixture {
  ideaSlug: string;
  destination: string;
  /** How many days ago this cached plan was generated. */
  researchedDaysAgo: number;
  confidence: Confidence;
  confidenceNote: string;
  summary: string;
  /** Used instead of `summary` when the group has no car. */
  summaryNoCar?: string;
  /** Used instead of `summary` when the user is under 21 and the destination cares. */
  summaryUnder21?: string;
  options: FixtureOption[];
  assumptions: Assumption[];
  exclusions: string[];
  sources: SourceLink[];
  itinerary: FixtureDay[];
  itineraryNoCar?: FixtureDay[];
  itineraryUnder21?: FixtureDay[];
  /** Destination-specific flags on top of the generic engine. */
  extraConstraints?: (request: ResearchRequest) => ConstraintFlag[];
}
