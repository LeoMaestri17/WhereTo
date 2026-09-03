import type { BudgetBand, IdeaShape, InterestTag } from '@/lib/domain/types';

/** What the planner form collects. Every field changes what comes back. */
export interface ResearchRequest {
  ideaSlug: string;
  ideaTitle: string;
  region: string;
  shape: IdeaShape;
  /** ISO date. */
  startDate: string;
  /** ISO date. Equal to startDate for a day trip. */
  endDate: string;
  groupSize: number;
  hasCar: boolean;
  isOver21: boolean;
  hasUsCreditCard: boolean;
  budgetBand: BudgetBand;
  moods: InterestTag[];
}

/** Where the plan on screen came from. Never hidden from the user. */
export type PlanProvenance = 'live' | 'cached' | 'cached-fallback';

export type Confidence = 'high' | 'medium' | 'low';

/**
 * A single costed row. `perPersonMin`/`perPersonMax` are always per person and always a
 * range — a point estimate is the thing this product exists to stop people from trusting.
 */
export interface LineItem {
  label: string;
  /** The named operator: 'Spirit Airlines', 'Under Canvas', 'Amtrak Pacific Surfliner'. */
  provider: string;
  detail: string;
  /** Real booking link. Rendered as an outbound link, so it must be a full URL. */
  url?: string;
  perPersonMin: number;
  perPersonMax: number;
  /** The assumption the number rests on, e.g. '4 sharing one room, 2 nights'. */
  basis: string;
}

export interface PlanOption {
  id: string;
  name: string;
  /** One line on who this option suits. */
  bestFor: string;
  perPersonMin: number;
  perPersonMax: number;
  transport: LineItem[];
  accommodation: LineItem[];
  otherCosts: LineItem[];
}

export interface Assumption {
  label: string;
  detail: string;
}

export type ConstraintTrigger =
  | 'under-21'
  | 'no-car'
  | 'no-us-credit-card'
  | 'budget'
  | 'group-size'
  | 'season'
  | 'foreign-licence';

export type ConstraintSeverity = 'blocker' | 'warning' | 'info';

/**
 * The differentiator. A general estimate misses the under-25 surcharge, the deposit hold and
 * the 21+ door. Each of these is tied to an input the user actually set.
 */
export interface ConstraintFlag {
  trigger: ConstraintTrigger;
  severity: ConstraintSeverity;
  title: string;
  body: string;
  /** What to do about it. Omitted when there is genuinely nothing to do. */
  workaround?: string;
}

export interface ItineraryBlock {
  time: string;
  title: string;
  detail: string;
  place?: string;
}

export interface ItineraryDay {
  dayNumber: number;
  /** ISO date. */
  date: string;
  label: string;
  blocks: ItineraryBlock[];
}

export interface SourceLink {
  title: string;
  url: string;
}

export interface ResearchPlan {
  ideaSlug: string;
  destination: string;
  /** ISO datetime the research actually ran. Shown next to the provenance. */
  researchedAt: string;
  provenance: PlanProvenance;
  confidence: Confidence;
  /** Why the confidence is what it is. */
  confidenceNote: string;
  /** Two or three sentences. The honest summary, including the catch. */
  summary: string;
  options: PlanOption[];
  totalRangeMin: number;
  totalRangeMax: number;
  assumptions: Assumption[];
  exclusions: string[];
  constraints: ConstraintFlag[];
  itinerary: ItineraryDay[];
  sources: SourceLink[];
  /** Echo of what was asked, so a saved plan can explain itself later. */
  request: ResearchRequest;
}

/** The interface. Two implementations: live (Anthropic + web search) and cached (fixtures). */
export interface TripResearchService {
  readonly kind: 'live' | 'cached';
  research(request: ResearchRequest): Promise<ResearchPlan>;
}

/** Named stages so the loading UI can say what is actually happening. */
export const RESEARCH_STAGES = [
  { id: 'transport', label: 'Pricing transport out of Los Angeles' },
  { id: 'stay', label: 'Finding places that take a group your size' },
  { id: 'constraints', label: 'Checking age, licence and card requirements' },
  { id: 'itinerary', label: 'Building the day plan' },
  { id: 'assemble', label: 'Adding up the range' },
] as const;

export type ResearchStageId = (typeof RESEARCH_STAGES)[number]['id'];
