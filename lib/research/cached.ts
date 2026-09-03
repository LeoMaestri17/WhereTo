import { addDays, daysBetween, isoAt } from '@/lib/util/dates';
import { IDEAS_BY_SLUG } from '@/lib/seed/ideas';
import { INTEREST_LABELS } from '@/lib/domain/types';
import { deriveConstraints, readPlanShape } from './constraints';
import type {
  Assumption,
  ItineraryDay,
  LineItem,
  PlanOption,
  PlanProvenance,
  ResearchPlan,
  ResearchRequest,
  TripResearchService,
} from './types';
import type { FixtureDay, FixtureLineItem, FixtureOption, PlanFixture } from './fixtures/types';
import { griffith, lakers, santaMonica } from './fixtures/days';
import { joshuaTree, lasVegas, sanDiego, zion } from './fixtures/weekends';
import { newYork } from './fixtures/breaks';

/**
 * MOCK BOUNDARY: pre-generated research.
 *
 * These are saved plans rather than live ones, but they are not screenshots — the options, the
 * per-head costs, the constraints and the itinerary are all recomputed against what the planner
 * form was actually set to. Change the group size and every split cost moves; say you have no
 * car and the options that need one disappear.
 */
export const FIXTURES: PlanFixture[] = [
  santaMonica,
  griffith,
  lakers,
  joshuaTree,
  zion,
  sanDiego,
  lasVegas,
  newYork,
];

const BY_SLUG: Record<string, PlanFixture> = Object.fromEntries(
  FIXTURES.map((f) => [f.ideaSlug, f]),
);

export function hasCachedPlan(ideaSlug: string): boolean {
  return ideaSlug in BY_SLUG;
}

export function cachedPlanSlugs(): string[] {
  return FIXTURES.map((f) => f.ideaSlug);
}

/** Thrown when there is no saved plan for a destination and no key to research one live. */
export class NoCachedPlanError extends Error {
  constructor(readonly ideaSlug: string) {
    super(`No saved plan for ${ideaSlug}`);
    this.name = 'NoCachedPlanError';
  }
}

/* ------------------------------------------------------------------ costing */

function interpolate(text: string, groupSize: number, nights: number): string {
  return text
    .replaceAll('{n}', String(groupSize))
    .replaceAll('{nights}', String(Math.max(nights, 1)));
}

function priceLine(
  item: FixtureLineItem,
  groupSize: number,
  nights: number,
): { min: number; max: number } {
  const multiplier = item.perNight ? Math.max(nights, 1) : 1;
  if (item.price.kind === 'per-person') {
    return { min: item.price.min * multiplier, max: item.price.max * multiplier };
  }
  // A split cost divides across the smaller of the group and what one unit holds — one car
  // seats five, one room sleeps three — so a group of eight pays for two of them.
  const divisor = Math.max(1, Math.min(groupSize, item.price.splitCap));
  return {
    min: (item.price.min / divisor) * multiplier,
    max: (item.price.max / divisor) * multiplier,
  };
}

function toLineItem(item: FixtureLineItem, groupSize: number, nights: number): LineItem {
  const { min, max } = priceLine(item, groupSize, nights);
  return {
    label: item.label,
    provider: item.provider,
    detail: item.detail,
    url: item.url,
    basis: interpolate(item.basis, groupSize, nights),
    perPersonMin: Math.round(min * 100) / 100,
    perPersonMax: Math.round(max * 100) / 100,
  };
}

function toOption(option: FixtureOption, groupSize: number, nights: number): PlanOption {
  const transport = option.transport.map((l) => toLineItem(l, groupSize, nights));
  const accommodation = option.accommodation.map((l) => toLineItem(l, groupSize, nights));
  const otherCosts = option.otherCosts.map((l) => toLineItem(l, groupSize, nights));
  const all = [...transport, ...accommodation, ...otherCosts];
  return {
    id: option.id,
    name: option.name,
    bestFor: option.bestFor,
    perPersonMin: Math.round(all.reduce((s, l) => s + l.perPersonMin, 0)),
    perPersonMax: Math.round(all.reduce((s, l) => s + l.perPersonMax, 0)),
    transport,
    accommodation,
    otherCosts,
  };
}

/**
 * Which options the group can actually book. An option that needs a vehicle is only offered
 * when the group already has one or the option hires one, and hiring one needs somebody 21+.
 */
function availableOptions(fixture: PlanFixture, request: ResearchRequest): FixtureOption[] {
  return fixture.options.filter((o) => {
    if (o.requiresOver21 && !request.isOver21) return false;
    if (o.requiresDriver && !request.hasCar && !o.providesVehicle) return false;
    return true;
  });
}

function toItinerary(days: FixtureDay[], startDate: string, tripDays: number): ItineraryDay[] {
  return days
    .filter((d) => d.dayOffset < Math.max(tripDays, 1))
    .map((d) => ({
      dayNumber: d.dayOffset + 1,
      date: addDays(startDate, d.dayOffset),
      label: d.label,
      blocks: d.blocks.map((b) => ({
        time: b.time,
        title: b.title,
        detail: b.detail,
        place: b.place,
      })),
    }));
}

function pickItinerary(fixture: PlanFixture, request: ResearchRequest): FixtureDay[] {
  if (!request.hasCar && fixture.itineraryNoCar) return fixture.itineraryNoCar;
  if (!request.isOver21 && fixture.itineraryUnder21) return fixture.itineraryUnder21;
  return fixture.itinerary;
}

function pickSummary(fixture: PlanFixture, request: ResearchRequest): string {
  if (!request.hasCar && fixture.summaryNoCar) return fixture.summaryNoCar;
  if (!request.isOver21 && fixture.summaryUnder21) return fixture.summaryUnder21;
  return fixture.summary;
}

/** What the plan covers of what the user actually asked for, said plainly either way. */
function interestAssumption(request: ResearchRequest): Assumption | null {
  if (request.moods.length === 0) return null;
  const idea = IDEAS_BY_SLUG[request.ideaSlug];
  const covered = request.moods.filter((m) => idea?.tags.includes(m));
  const missed = request.moods.filter((m) => !idea?.tags.includes(m));
  const label = (list: typeof request.moods) =>
    list.map((m) => INTEREST_LABELS[m].toLowerCase()).join(', ');

  if (missed.length === 0) {
    return {
      label: 'What you asked for',
      detail: `This covers ${label(covered)}, which is everything you picked.`,
    };
  }
  if (covered.length === 0) {
    return {
      label: 'What you asked for',
      detail: `You picked ${label(missed)}, and this destination is not really about any of it. Worth checking the idea bank for somewhere that is.`,
    };
  }
  return {
    label: 'What you asked for',
    detail: `This covers ${label(covered)}. It does not do much for ${label(missed)}, so plan those separately.`,
  };
}

/* ------------------------------------------------------------------ the service */

export function composeCachedPlan(
  fixture: PlanFixture,
  request: ResearchRequest,
  provenance: PlanProvenance,
): ResearchPlan {
  const tripDays = Math.max(1, daysBetween(request.startDate, request.endDate) + 1);
  const nights = Math.max(0, tripDays - 1);
  const groupSize = Math.max(1, request.groupSize);

  const options = availableOptions(fixture, request).map((o) => toOption(o, groupSize, nights));
  const fixtureDays = pickItinerary(fixture, request);
  const itinerary = toItinerary(fixtureDays, request.startDate, tripDays);

  const shape = readPlanShape({ options }, nights);
  const constraints = deriveConstraints(
    request,
    shape,
    fixture.extraConstraints?.(request) ?? [],
  );

  const assumptions: Assumption[] = [
    ...fixture.assumptions,
    {
      label: 'Group size',
      detail: `Everything that splits has been divided by ${groupSize}, capped at what one car, room or campsite actually holds. Change the group size and these numbers move.`,
    },
  ];

  const interests = interestAssumption(request);
  if (interests) assumptions.push(interests);

  if (fixtureDays.length > tripDays) {
    assumptions.push({
      label: 'Trip length',
      detail: `The saved plan runs to ${fixtureDays.length} days and you asked for ${tripDays}. The days beyond yours have been left off rather than compressed.`,
    });
  }

  return {
    ideaSlug: fixture.ideaSlug,
    destination: fixture.destination,
    researchedAt: isoAt(-fixture.researchedDaysAgo, 10, 20),
    provenance,
    confidence: fixture.confidence,
    confidenceNote: fixture.confidenceNote,
    summary: pickSummary(fixture, request),
    options,
    totalRangeMin: options.length ? Math.min(...options.map((o) => o.perPersonMin)) : 0,
    totalRangeMax: options.length ? Math.max(...options.map((o) => o.perPersonMax)) : 0,
    assumptions,
    exclusions: fixture.exclusions,
    constraints,
    itinerary,
    sources: fixture.sources,
    request,
  };
}

export class CachedResearchService implements TripResearchService {
  readonly kind = 'cached' as const;

  constructor(private readonly provenance: PlanProvenance = 'cached') {}

  async research(request: ResearchRequest): Promise<ResearchPlan> {
    const fixture = BY_SLUG[request.ideaSlug];
    if (!fixture) throw new NoCachedPlanError(request.ideaSlug);
    return composeCachedPlan(fixture, request, this.provenance);
  }
}
