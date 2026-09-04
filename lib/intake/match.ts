import type { Idea, InterestTag } from '@/lib/domain/types';
import { IDEAS } from '@/lib/seed/ideas';
import { cachedPlanSlugs } from '@/lib/research/cached';
import { deriveOccupancy, TRIP_LENGTH_NIGHTS, type TripBrief, type Vibe } from './types';

/**
 * Turning a brief into two or three destinations worth looking at.
 *
 * This is deliberately deterministic and runs in the browser. Asking a model to pick from a list
 * of nineteen places we already know everything about would be slower, cost money, and be no
 * better at it — the interesting model work is the costing that happens *after* you choose.
 *
 * What it does encode is the honest reasoning a person would do: rule out what this group cannot
 * physically do, prefer what fits the length and the budget, then explain the choice in a
 * sentence that names the actual reason.
 */

export const VIBE_TAGS: Record<Vibe, InterestTag[]> = {
  outdoors: ['hiking', 'national-parks', 'road-trips'],
  city: ['art', 'food', 'photography'],
  beach: ['beaches', 'surfing'],
  culture: ['art', 'film', 'live-music', 'photography'],
  nightlife: ['nightlife', 'live-music'],
  'cheap-as-possible': [],
};

const CACHED = new Set(cachedPlanSlugs());

export interface Recommendation {
  idea: Idea;
  /** One line naming the actual reason this fits, not a description of the place. */
  why: string;
  /** The honest caveat. Present whenever there is one worth saying. */
  catch?: string;
  perPersonMin: number;
  perPersonMax: number;
  /** True for the one we would actually pick. */
  ourPick: boolean;
  hasSavedPlan: boolean;
}

function shapeForLength(nights: number): Idea['shape'] {
  if (nights === 0) return 'day';
  if (nights <= 3) return 'weekend';
  return 'break';
}

/** Budget ceilings per person, matching the ones the constraint engine uses. */
const CEILING = { shoestring: 160, moderate: 320, comfortable: 700 } as const;

export function recommendDestinations(brief: TripBrief): Recommendation[] {
  const nights = TRIP_LENGTH_NIGHTS[brief.length];
  const wantedShape = shapeForLength(nights);
  const ceiling = CEILING[brief.budget];
  const occupancy = deriveOccupancy(brief.companions, brief.partySize);

  const wantedTags = new Set(brief.vibes.flatMap((v) => VIBE_TAGS[v]));
  const cheapestFirst = brief.vibes.includes('cheap-as-possible');

  const scored = IDEAS
    // A group with no car and nobody who can hire one cannot do a place that needs driving.
    // This is a hard filter, not a penalty: recommending it would be recommending a trip they
    // cannot take.
    .filter((idea) => (idea.needsCar ? brief.hasCar || brief.isOver21 : true))
    .map((idea) => {
      let score = 0;

      if (idea.shape === wantedShape) score += 40;
      else if (Math.abs(nights - idea.nights) <= 2) score += 12;

      const matched = idea.tags.filter((t) => wantedTags.has(t)).length;
      score += matched * 14;

      if (idea.costBandMin <= ceiling) score += 20;
      if (idea.costBandMax <= ceiling) score += 10;
      if (cheapestFirst) score += Math.max(0, 40 - idea.costBandMin / 5);

      // A place we already have a costed plan for gives a better first experience, and with no
      // API key it is the difference between a plan and an apology.
      if (CACHED.has(idea.slug)) score += 8;

      // Being carless is the norm in this cohort, so a destination that does not need one is
      // worth something even when they could technically hire.
      if (!idea.needsCar) score += 6;

      return { idea, score, matched };
    })
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, 3).map(({ idea, matched }, index) => ({
    idea,
    why: buildWhy(idea, brief, matched, nights, occupancy.note),
    catch: buildCatch(idea, brief, nights),
    perPersonMin: idea.costBandMin,
    perPersonMax: idea.costBandMax,
    ourPick: index === 0,
    hasSavedPlan: CACHED.has(idea.slug),
  }));
}

/**
 * The reason, in the order a person would give it: what the place is, then why it suits this
 * particular group. Every clause is a fact off the brief, so if none of them hold the sentence
 * gets shorter rather than vaguer — "it fits your preferences" is not a reason.
 */
function buildWhy(
  idea: Idea,
  brief: TripBrief,
  matched: number,
  nights: number,
  occupancyNote: string,
): string {
  const clauses: string[] = [];

  if (idea.shape === shapeForLength(nights)) {
    clauses.push('it is the right length');
  }
  if (matched > 0) {
    clauses.push(`it is the sort of thing you picked`);
  }
  if (!idea.needsCar) {
    clauses.push('you can get there without a car');
  }
  if (idea.costBandMin <= CEILING[brief.budget]) {
    clauses.push(`it starts at $${idea.costBandMin} each, inside your budget`);
  }

  if (clauses.length === 0) return `${idea.hook} Priced as ${lower(occupancyNote)}.`;

  return `${idea.hook} ${capitalise(joinClauses(clauses))}. Priced as ${lower(occupancyNote)}.`;
}

/** "a, b and c" — the Oxford comma is not the house style here. */
function joinClauses(parts: string[]): string {
  if (parts.length === 1) return parts[0];
  return `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`;
}

function lower(s: string): string {
  return s.charAt(0).toLowerCase() + s.slice(1);
}

function capitalise(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function buildCatch(idea: Idea, brief: TripBrief, nights: number): string | undefined {
  if (idea.needsCar && !brief.hasCar && brief.isOver21) {
    return 'Nobody in the group has a car, so this only works if one of you hires one — and the under-25 surcharge is roughly $25 a day on top of the headline rate.';
  }
  if (idea.costBandMin > CEILING[brief.budget]) {
    return `The cheapest honest version is about $${idea.costBandMin} each, which is over the budget you picked.`;
  }
  // Recommending a day trip to somebody who asked for a weekend is fine, as long as it says so.
  if (idea.nights === 0 && nights > 0) {
    return 'This is a day out rather than a trip away — you would be home the same night, with the rest of the weekend still to fill.';
  }
  if (idea.nights < nights) {
    return `This is a ${idea.nights}-night trip and you have ${nights}, so there is a night spare at either end.`;
  }
  if (idea.nights > nights) {
    return `It wants ${idea.nights} nights and you said ${nights === 0 ? 'a day' : `${nights}`}, so it only works if the window stretches.`;
  }
  // Some hooks say it already, and saying it twice on one card reads as nagging.
  if (!brief.isOver21 && idea.tags.includes('nightlife') && !idea.hook.includes('21')) {
    return 'A lot of what this place is known for is 21 and over, so the evenings look different for you.';
  }
  if (brief.companions === 'partner' && idea.tags.includes('national-parks')) {
    return 'Priced as one room for the two of you rather than a shared dorm, which is the more expensive way per head.';
  }
  return undefined;
}
