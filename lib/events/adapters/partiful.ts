import type { NormalizedEvent } from '@/lib/domain/types';
import { isoAt } from '@/lib/util/dates';
import { PHOTOS } from '@/lib/seed/images';
import type { EventSource } from '../source';

/**
 * Partiful — where the actual parties are. Invite-shaped rather than listing-shaped: everything
 * here is somebody's flat, somebody's birthday, somebody's bonfire.
 *
 * MOCK BOUNDARY: Partiful has no public API. A real integration means a per-user OAuth-style
 * link and reading the events that user has already been invited to — never scraping, because
 * these are private invites and the guest list is the sensitive part. Until that exists this
 * adapter returns the invites a member of the cohort would plausibly be holding.
 *
 * The raw shape mirrors a Partiful invite payload: emoji-led titles, a host handle, and an
 * RSVP count rather than a ticket price.
 */
interface PartifulInvite {
  event_id: string;
  emoji: string;
  title: string;
  blurb: string;
  hero_image: string;
  starts: string;
  ends: string;
  location_label: string;
  neighbourhood: string;
  host_handle: string;
  cost_note: string;
  bring: string | null;
  twenty_one_plus: boolean;
}

const RAW: PartifulInvite[] = [
  {
    event_id: 'ptf-halloween-palms',
    emoji: '🎃',
    title: 'Halloween at the Palms house',
    blurb:
      'Four flatmates, one house, a garden and a speaker that is too big for it. Costume is not optional and last year two people found that out the hard way. Neighbours have been warned; it ends at one.',
    hero_image: PHOTOS.rooftopNight,
    starts: isoAt(10, 21, 0),
    ends: isoAt(11, 1, 0),
    location_label: '3400 block, Vinton Ave',
    neighbourhood: 'Palms',
    host_handle: '@thepalmshouse',
    cost_note: 'Free, bring a bottle',
    bring: 'Something to share',
    twenty_one_plus: false,
  },
  {
    event_id: 'ptf-friendsgiving',
    emoji: '🦃',
    title: 'Friendsgiving for everyone not flying home',
    blurb:
      'For the half of us who cannot afford the Thanksgiving flight. One oven, fourteen people, and a spreadsheet of who is bringing what so we do not end up with six lots of potatoes again.',
    hero_image: PHOTOS.farmersMarket,
    starts: isoAt(57, 17, 0),
    ends: isoAt(57, 23, 0),
    location_label: 'Adams-Normandie, address on RSVP',
    neighbourhood: 'Adams-Normandie',
    host_handle: '@nadia.h',
    cost_note: '$12 towards the bird',
    bring: 'One dish, claim it on the list first',
    twenty_one_plus: false,
  },
  {
    event_id: 'ptf-karaoke-break-room',
    emoji: '🎤',
    title: 'Karaoke birthday at Break Room 86',
    blurb:
      'Private room booked from nine. It is behind a fake vending machine in the back of a hotel kitchen, which sounds made up and is not. Strictly 21 and over — they scan IDs at the front and there is no way around it.',
    hero_image: PHOTOS.smallVenue,
    starts: isoAt(9, 21, 0),
    ends: isoAt(10, 1, 30),
    location_label: 'Break Room 86, 630 S Ardmore Ave',
    neighbourhood: 'Koreatown',
    host_handle: '@rafa.santos',
    cost_note: '$25 towards the room',
    bring: null,
    twenty_one_plus: true,
  },
  {
    event_id: 'ptf-dockweiler-bonfire',
    emoji: '🔥',
    title: 'Bonfire at Dockweiler, third pit from the north',
    blurb:
      'We got there at four to hold a pit. Planes land directly over your head about every ninety seconds. Bring firewood or $10, a jumper, and something to sit on because the sand gets cold fast.',
    hero_image: PHOTOS.beachCleanup,
    starts: isoAt(4, 17, 30),
    ends: isoAt(4, 22, 0),
    location_label: 'Dockweiler State Beach, fire pit 3',
    neighbourhood: 'Playa del Rey',
    host_handle: '@tomwhitfield',
    cost_note: '$10 for wood',
    bring: 'Firewood if you can carry it',
    twenty_one_plus: false,
  },
  {
    event_id: 'ptf-village-flatwarming',
    emoji: '🔑',
    title: 'Flat-warming, USC Village block C',
    blurb:
      'We have finally got furniture. Small flat, so it is a rolling thing rather than everybody at once — come whenever between eight and midnight. There will be far too much hummus.',
    hero_image: PHOTOS.campusWalk,
    starts: isoAt(6, 20, 0),
    ends: isoAt(7, 0, 0),
    location_label: 'USC Village, block C',
    neighbourhood: 'University Park',
    host_handle: '@emma.visser',
    cost_note: 'Free',
    bring: 'Whatever you are drinking',
    twenty_one_plus: false,
  },
];

const TAGS: Record<string, NormalizedEvent['tags']> = {
  'ptf-halloween-palms': ['nightlife', 'live-music'],
  'ptf-friendsgiving': ['food'],
  'ptf-karaoke-break-room': ['nightlife', 'live-music'],
  'ptf-dockweiler-bonfire': ['beaches', 'food'],
  'ptf-village-flatwarming': ['food', 'nightlife'],
};

function parseCost(costNote: string): { label: string; usd: number | null } {
  const match = costNote.match(/\$(\d+)/);
  if (!match) return { label: costNote, usd: null };
  return { label: costNote, usd: Number(match[1]) };
}

function normalise(raw: PartifulInvite): NormalizedEvent {
  const cost = parseCost(raw.cost_note);
  return {
    id: `ev-${raw.event_id}`,
    source: 'partiful',
    sourceEventId: raw.event_id,
    title: `${raw.emoji} ${raw.title}`,
    description: raw.bring ? `${raw.blurb} Bring: ${raw.bring.toLowerCase()}.` : raw.blurb,
    image: raw.hero_image,
    startsAt: raw.starts,
    endsAt: raw.ends,
    venueName: raw.location_label,
    venueArea: raw.neighbourhood,
    costLabel: cost.label,
    costUsd: cost.usd,
    url: `https://partiful.com/e/${raw.event_id.replace('ptf-', '')}`,
    tags: TAGS[raw.event_id] ?? [],
    category: raw.event_id === 'ptf-friendsgiving' ? 'food' : 'nightlife',
    hostOrg: raw.host_handle,
    is21Plus: raw.twenty_one_plus,
  };
}

export const partifulSource: EventSource = {
  id: 'partiful',
  label: 'Partiful',
  realIntegration:
    'Per-user account link reading invites the student already holds — no scraping, the guest list is private',
  async fetchEvents() {
    return RAW.map(normalise);
  },
};
