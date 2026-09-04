import type { BudgetBand, IdeaShape, InterestTag } from '@/lib/domain/types';
import type { Companions } from '@/lib/intake/types';
import type { PriceProvenance } from '@/lib/pricing/types';

export type { PriceOrigin, PriceProvenance } from '@/lib/pricing/types';

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
  /**
   * Who the group is to each other, when we know. It is the difference between quoting one
   * double room and quoting two twins, so it goes to the hotel lookup rather than staying a
   * UI detail. Absent when the planner was opened cold rather than through the picker.
   */
  companions?: Companions;
  /** The picker's one free-text box. Verbatim, capped, and never load-bearing. */
  note?: string;
}

/**
 * Where the plan on screen came from. Never hidden from the user.
 *
 * `partial` means the research run failed part-way and what you are seeing was assembled from
 * the price lookups that did complete. Better than an error wall, but it must say so.
 */
export type PlanProvenance = 'live' | 'cached' | 'cached-fallback' | 'partial';

export type Confidence = 'high' | 'medium' | 'low';

/**
 * A single costed row. `perPersonMin`/`perPersonMax` are always per person and always a
 * range — a point estimate is the thing this product exists to stop people from trusting.
 *
 * `provenance` is required on purpose. Every producer of a costed line — the live path, the
 * cached fixtures, a partial assembly — has to state where its number came from, so there is no
 * way to add a price to this app without saying whether anybody checked it.
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
  provenance: PriceProvenance;
  /** Result of requesting `url` before the plan was rendered. */
  link?: LinkCheckResult;
}

/** Mirrors lib/pricing/links.ts, redeclared here so the domain types do not import the server. */
export type LinkStatus = 'ok' | 'blocked' | 'dead' | 'timeout' | 'unchecked';

export interface LinkCheckResult {
  status: LinkStatus;
  checkedAt: string;
  httpStatus?: number;
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

/** Builds the EventSource URL for a research run. Kept next to the schema it has to satisfy. */
export function researchQuery(request: ResearchRequest): string {
  const params = new URLSearchParams({
    ideaSlug: request.ideaSlug,
    ideaTitle: request.ideaTitle,
    region: request.region,
    shape: request.shape,
    startDate: request.startDate,
    endDate: request.endDate,
    groupSize: String(request.groupSize),
    hasCar: String(request.hasCar),
    isOver21: String(request.isOver21),
    hasUsCreditCard: String(request.hasUsCreditCard),
    budgetBand: request.budgetBand,
  });
  for (const mood of request.moods) params.append('mood', mood);
  if (request.companions) params.set('companions', request.companions);
  if (request.note?.trim()) params.set('note', request.note.trim().slice(0, 200));
  return `/api/research?${params.toString()}`;
}
