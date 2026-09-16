import { INTEREST_LABELS, type Idea, type InterestTag } from '@/lib/domain/types';
import { IDEAS } from '@/lib/seed/ideas';
import { HIGHLIGHTS } from '@/lib/seed/highlights';
import { cachedPlanSlugs } from '@/lib/research/cached';
import { canDrive, isOver21, type IntakeBrief, type Vibe } from './types';
import { daysBetween } from '@/lib/util/dates';

/**
 * Turning the six answers into an ordered list.
 *
 * The previous version scored everything and showed the lot, which meant you could answer
 * "beaches, under $150, no car" and still be handed a $360 national park that needs a vehicle.
 * The answers have to visibly govern the result or there was no point asking.
 *
 * So there are three real filters, applied in order, each of which relaxes rather than returning
 * an empty screen:
 *
 *   1. CAN YOU PHYSICALLY GO — no car and nobody able to hire one removes every driving trip.
 *      This one never relaxes. Recommending a trip they cannot take is the worst failure here.
 *   2. DOES IT FIT THE MONEY — over the budget ceiling is dropped, unless dropping it would
 *      leave fewer than three, in which case it stays and says it is over.
 *   3. IS IT THE SORT OF THING THEY ASKED FOR — with vibes picked, something has to match, on
 *      the same relax-rather-than-empty rule.
 *
 * Everything after that is ordering, and the ordering is explained on the card in a sentence made
 * of the user's own answers. Never by popularity: this app has no popularity signal.
 */

const CACHED = new Set(cachedPlanSlugs());

/** Budget ceilings per person, all in. These are the numbers the intake screen quotes. */
const CEILING = { shoestring: 150, moderate: 320, comfortable: 700 } as const;

const VIBE_TAGS: Record<Vibe, InterestTag[]> = {
  outdoors: ['hiking', 'national-parks', 'road-trips'],
  city: ['art', 'food', 'photography'],
  beach: ['beaches', 'surfing'],
  culture: ['art', 'film', 'live-music', 'photography'],
  nightlife: ['nightlife', 'live-music'],
  'cheap-as-possible': [],
};

/** Below this the list stops filtering and starts explaining instead. */
const MIN_RESULTS = 3;

export interface Ranked {
  idea: Idea;
  /** One line naming the actual reason, built from the answers. Never "matches your preferences". */
  why: string;
  /** What the trip is made of. Three or four lines. */
  highlights: string[];
  /** The honest problem, when there is one. */
  snag?: string;
  overBudget: boolean;
  hasSavedPlan: boolean;
}

export function rankIdeas(brief: IntakeBrief): Ranked[] {
  const nights =
    brief.startDate && brief.endDate ? Math.max(0, daysBetween(brief.startDate, brief.endDate)) : 2;
  const wantedShape: Idea['shape'] = nights === 0 ? 'day' : nights <= 3 ? 'weekend' : 'break';
  const ceiling = CEILING[brief.budget];
  const driving = canDrive(brief);

  const wantedTags = new Set(brief.vibes.flatMap((v) => VIBE_TAGS[v]));
  const cheapestFirst = brief.vibes.includes('cheap-as-possible');

  // 1. Can you physically go. Never relaxed.
  const reachable = IDEAS.filter((idea) => (idea.needsCar ? driving : true));

  /* 2. Does it fit the window, and this has to come BEFORE the money.
     Getting this order wrong produced the worst bug this thing has had: ask for Thanksgiving
     week on a moderate budget and you were handed a Lakers game, Griffith and Santa Monica. No
     six-night trip exists under $320, so the budget filter quietly deleted every break trip and
     the list backfilled with day trips. Duration is the thing the user actually asked for — a
     trip that does not fit the dates is not a cheaper answer to the question, it is a different
     question. */
  const fitsWindow = reachable.filter((idea) => idea.nights <= nights);
  const exactShape = fitsWindow.filter((idea) => idea.shape === wantedShape);
  const afterWindow = exactShape.length >= MIN_RESULTS ? exactShape : fitsWindow;

  // 3. Money. Over-budget entries are kept and labelled rather than dropped when dropping them
  //    would leave nothing that fits the dates.
  const affordable = afterWindow.filter((idea) => idea.costBandMin <= ceiling);
  const afterBudget = affordable.length >= MIN_RESULTS ? affordable : afterWindow;

  // 4. Vibes, same relax-rather-than-empty rule. With nothing picked this is a no-op.
  const onTheme =
    wantedTags.size === 0
      ? afterBudget
      : afterBudget.filter((idea) => idea.tags.some((t) => wantedTags.has(t)));
  const pool = onTheme.length >= MIN_RESULTS ? onTheme : afterBudget;

  return pool
    .map((idea) => {
      const matchedTags = idea.tags.filter((t) => wantedTags.has(t));
      let score = 0;

      /* Shape dominates every other signal. A cheap day trip must never outrank a real trip when
         the window is a week — that is the whole point of asking for the dates first. */
      if (idea.shape === wantedShape) score += 400;
      score -= 12 * Math.abs(nights - idea.nights);

      score += matchedTags.length * 25;
      if (idea.costBandMin <= ceiling) score += 20;
      if (idea.costBandMax <= ceiling) score += 15;
      if (cheapestFirst) score += Math.max(0, 60 - idea.costBandMin / 4);
      // Being carless is the norm in this cohort, so needing no car is worth something even when
      // somebody could technically hire.
      if (!idea.needsCar) score += 10;
      if (CACHED.has(idea.slug)) score += 5;

      return { idea, score, matchedTags };
    })
    .sort((a, b) => b.score - a.score)
    .map(({ idea, matchedTags }) => ({
      idea,
      why: buildWhy(idea, brief, matchedTags, nights, ceiling),
      highlights: HIGHLIGHTS[idea.slug] ?? [],
      snag: buildSnag(idea, brief, nights, ceiling),
      overBudget: idea.costBandMin > ceiling,
      hasSavedPlan: CACHED.has(idea.slug),
    }));
}

/**
 * The reason, assembled from facts the user supplied.
 *
 * Every clause is checkable against an answer they gave, so if none of them hold the sentence
 * gets shorter rather than vaguer. It names the interest that actually matched, because "matches your
 * interests" is the kind of sentence that makes people stop believing the rest of the page.
 */
function buildWhy(
  idea: Idea,
  brief: IntakeBrief,
  matchedTags: InterestTag[],
  nights: number,
  ceiling: number,
): string {
  const wantedShape: Idea['shape'] = nights === 0 ? 'day' : nights <= 3 ? 'weekend' : 'break';
  const clauses: string[] = [];

  /* Name the tag that actually matched, not the label of the bucket it came from. Saying "you
     picked museums, film, music" under a photograph of Joshua Tree is technically true —
     photography sits in that bucket — and reads as a machine that has not looked at the place. */
  if (matchedTags.length > 0) {
    clauses.push(`you asked for ${INTEREST_LABELS[matchedTags[0]].toLowerCase()}`);
  }
  if (idea.shape === wantedShape) {
    clauses.push(nights === 0 ? 'it fits in a day' : `it fits your ${nights} nights`);
  }
  if (!idea.needsCar) clauses.push('it works with no car');
  else if (canDrive(brief)) clauses.push('you have a driver for it');
  if (idea.costBandMin <= ceiling) clauses.push(`it starts at $${idea.costBandMin} each`);

  if (clauses.length === 0) return idea.hook;

  const joined =
    clauses.length === 1
      ? clauses[0]
      : `${clauses.slice(0, -1).join(', ')} and ${clauses[clauses.length - 1]}`;
  return `${idea.hook} Here because ${joined}.`;
}

function buildSnag(
  idea: Idea,
  brief: IntakeBrief,
  nights: number,
  ceiling: number,
): string | undefined {
  if (idea.costBandMin > ceiling) {
    return `The cheapest honest version is about $${idea.costBandMin} each, which is over the budget you picked.`;
  }
  if (idea.needsCar && brief.car === 'can-hire' && brief.ageYears < 25) {
    const days = Math.max(1, nights);
    return `Somebody has to hire the car, and under 25 that is roughly $25 a day on top — about $${25 * days} across these dates.`;
  }
  if (idea.nights === 0 && nights > 0) {
    return 'This is a day out rather than a trip away, so the rest of your window stays empty.';
  }
  if (idea.nights > nights && nights > 0) {
    return `It wants ${idea.nights} nights and you have ${nights}, so it only works if the dates stretch.`;
  }
  if (!isOver21(brief) && idea.tags.includes('nightlife')) {
    return 'Most of what this place is known for after dark is 21 and over, so the evenings look different for you.';
  }
  return undefined;
}
