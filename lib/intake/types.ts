import type { BudgetBand } from '@/lib/domain/types';

/**
 * The guided picker's brief.
 *
 * It is answered by clicking, not by writing. Every question is a small set of boxes with an
 * optional free-text box underneath for the thing that does not fit — a destination not in the
 * bank, a constraint nobody asked about. That shape matters: a blank prompt asks the user to do
 * the work of knowing what to say, and most people arriving here do not.
 */

export type Companions = 'solo' | 'partner' | 'friends' | 'family';

export const COMPANION_LABELS: Record<Companions, string> = {
  solo: 'On my own',
  partner: 'With my partner',
  friends: 'With friends',
  family: 'With family',
};

export type TripLength = 'evening' | 'day' | 'weekend' | 'long-weekend' | 'week';

export const TRIP_LENGTH_LABELS: Record<TripLength, string> = {
  evening: 'An evening',
  day: 'A day',
  weekend: 'A weekend',
  'long-weekend': 'A long weekend',
  week: 'A week or so',
};

/** Nights away implied by each length, used to prefill dates and price accommodation. */
export const TRIP_LENGTH_NIGHTS: Record<TripLength, number> = {
  evening: 0,
  day: 0,
  weekend: 2,
  'long-weekend': 3,
  week: 5,
};

export type WhenWindow = 'this-weekend' | 'next-2-weeks' | 'next-month' | 'the-break';

export const WHEN_LABELS: Record<WhenWindow, string> = {
  'this-weekend': 'This weekend',
  'next-2-weeks': 'In the next fortnight',
  'next-month': 'Sometime next month',
  'the-break': 'Over the break',
};

export type Vibe = 'outdoors' | 'city' | 'beach' | 'culture' | 'nightlife' | 'cheap-as-possible';

export const VIBE_LABELS: Record<Vibe, string> = {
  outdoors: 'Outdoors and hiking',
  city: 'A city to walk around',
  beach: 'Beach and sun',
  culture: 'Museums, film, music',
  nightlife: 'Going out',
  'cheap-as-possible': 'Whatever is cheapest',
};

export interface TripBrief {
  companions: Companions;
  partySize: number;
  length: TripLength;
  when: WhenWindow;
  budget: BudgetBand;
  vibes: Vibe[];
  /** The three that change every price. Prefilled from the profile, confirmed here. */
  isOver21: boolean;
  hasCar: boolean;
  hasUsCreditCard: boolean;
  /** The optional box: a destination not in the bank, or anything else that did not fit. */
  anythingElse: string;
}

/**
 * Occupancy is where "who are you going with" earns its place.
 *
 * It is the difference between pricing one double room and pricing two twins, and it feeds
 * straight into the hotel query as well as the sentence under every accommodation line. Getting
 * this wrong is how a plan ends up quoting a couple the price of a hostel dorm.
 */
export interface Occupancy {
  rooms: number;
  adultsPerRoom: number;
  bedding: 'double' | 'twin' | 'shared' | 'dorm-bed';
  allowDorms: boolean;
  /** Goes verbatim into the `basis` of every accommodation line. */
  note: string;
}

export function deriveOccupancy(companions: Companions, partySize: number): Occupancy {
  const n = Math.max(1, partySize);

  if (companions === 'solo') {
    return {
      rooms: 1,
      adultsPerRoom: 1,
      bedding: 'dorm-bed',
      allowDorms: true,
      note: 'One person, so nothing splits — this is the expensive way to do it per head',
    };
  }

  if (companions === 'partner') {
    return {
      rooms: 1,
      adultsPerRoom: 2,
      bedding: 'double',
      allowDorms: false,
      note: 'Two of you in one double room',
    };
  }

  if (companions === 'family') {
    const rooms = Math.max(2, Math.ceil(n / 2));
    return {
      rooms,
      adultsPerRoom: 2,
      bedding: 'twin',
      allowDorms: false,
      note: `Separate rooms, ${rooms} of them, rather than everyone sharing`,
    };
  }

  // Friends: share, and dorm beds are fair game.
  const rooms = Math.max(1, Math.ceil(n / 4));
  return {
    rooms,
    adultsPerRoom: Math.min(4, n),
    bedding: 'shared',
    allowDorms: true,
    note:
      rooms === 1
        ? `${n} sharing one room, or ${n} hostel beds`
        : `${n} across ${rooms} rooms, or ${n} hostel beds`,
  };
}
