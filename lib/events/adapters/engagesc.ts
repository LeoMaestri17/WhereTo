import type { NormalizedEvent } from '@/lib/domain/types';
import { isoAt } from '@/lib/util/dates';
import { PHOTOS } from '@/lib/seed/images';
import type { EventSource } from '../source';

/**
 * EngageSC — the university's own student organisation calendar.
 *
 * MOCK BOUNDARY: replace `fetchEvents` with a fetch of the public iCal feed at
 * https://engage.usc.edu/ical/usc/ical_usc.ics, parsed with an ICS parser and mapped into
 * NormalizedEvent. This is the one source that needs no partnership or scraping, so it is
 * the first real integration to build.
 *
 * The raw shape below mirrors the VEVENT fields that feed actually carries, so the
 * normalisation step is the same one the real adapter will do.
 */
interface EngageScVEvent {
  uid: string;
  summary: string;
  description: string;
  dtstart: string;
  dtend: string;
  location: string;
  organizer: string;
  categories: string[];
  /** EngageSC has no image field in the iCal feed; the real adapter scrapes the event page. */
  imageHint: string;
  admission: string;
}

const RAW: EngageScVEvent[] = [
  {
    uid: 'engage-11842',
    summary: 'International Student Assembly: Fall Welcome Mixer',
    description:
      'Free food from six countries and a room full of people who also arrived three weeks ago and know nobody. Run by ISA every semester; it is the single easiest place to meet the rest of the exchange cohort.',
    dtstart: isoAt(2, 18, 0),
    dtend: isoAt(2, 21, 0),
    location: 'Ronald Tutor Campus Center, Grand Ballroom',
    organizer: 'International Student Assembly',
    categories: ['campus', 'social'],
    imageHint: PHOTOS.campusLawn,
    admission: 'Free',
  },
  {
    uid: 'engage-11907',
    summary: 'USC Outdoors Club: Sandstone Peak day hike',
    description:
      'The highest point in the Santa Monica Mountains, about six miles round trip with 1,100 feet of climb. Club vans leave campus at 7am and there are twelve seats. You need boots; trainers will not do on the scramble at the top.',
    dtstart: isoAt(6, 7, 0),
    dtend: isoAt(6, 16, 0),
    location: 'Departs from Lot 4, Jefferson Blvd',
    organizer: 'USC Outdoors Club',
    categories: ['outdoors'],
    imageHint: PHOTOS.hikingHills,
    admission: '$8 members / $15 non-members',
  },
  {
    uid: 'engage-12033',
    summary: 'Visions and Voices: A conversation on scoring for film',
    description:
      'The university arts initiative brings in a composer to talk through three of their scores with the orchestra playing excerpts live. Free, but the 1,200 seats in Bovard go within about two days of release.',
    dtstart: isoAt(9, 19, 30),
    dtend: isoAt(9, 21, 30),
    location: 'Bovard Auditorium',
    organizer: 'Visions and Voices',
    categories: ['culture', 'arts'],
    imageHint: PHOTOS.conferenceTalk,
    admission: 'Free with student ticket',
  },
  {
    uid: 'engage-12110',
    summary: 'Ski and Snowboard Club: Mammoth trip info night',
    description:
      'Details and deposits for the January Mammoth trip. Bus, four nights, lift passes, and about 200 people. The deposit is $150 and non-refundable, which is worth knowing before you walk in.',
    dtstart: isoAt(4, 20, 0),
    dtend: isoAt(4, 21, 30),
    location: 'Taper Hall of Humanities, Room 201',
    organizer: 'USC Ski and Snowboard Club',
    categories: ['outdoors', 'social'],
    imageHint: PHOTOS.conferenceRoom,
    admission: 'Free',
  },
  {
    uid: 'engage-12188',
    summary: 'Undergraduate Student Government: outdoor film night on McCarthy Quad',
    description:
      'Inflatable screen on the grass, free popcorn, and about four hundred people in blankets. They run it monthly and it is the most reliably good free thing on this campus.',
    dtstart: isoAt(11, 20, 0),
    dtend: isoAt(11, 22, 30),
    location: 'McCarthy Quad',
    organizer: 'USG Program Board',
    categories: ['campus', 'film'],
    imageHint: PHOTOS.campusWalk,
    admission: 'Free',
  },
];

function normalise(raw: EngageScVEvent): NormalizedEvent {
  const isFree = raw.admission.toLowerCase().startsWith('free');
  const priceMatch = raw.admission.match(/\$(\d+)/);
  return {
    id: `ev-${raw.uid}`,
    source: 'engagesc',
    sourceEventId: raw.uid,
    title: raw.summary,
    description: raw.description,
    image: raw.imageHint,
    startsAt: raw.dtstart,
    endsAt: raw.dtend,
    venueName: raw.location.split(',')[0].trim(),
    venueArea: 'University Park Campus',
    costLabel: raw.admission,
    costUsd: isFree ? null : priceMatch ? Number(priceMatch[1]) : null,
    url: `https://engage.usc.edu/event/${raw.uid.replace('engage-', '')}`,
    tags: CATEGORY_TAGS[raw.uid] ?? [],
    category: raw.categories.includes('outdoors')
      ? 'outdoors'
      : raw.categories.includes('culture')
        ? 'culture'
        : 'campus',
    hostOrg: raw.organizer,
    is21Plus: false,
  };
}

const CATEGORY_TAGS: Record<string, NormalizedEvent['tags']> = {
  'engage-11842': ['food', 'career'],
  'engage-11907': ['hiking', 'photography'],
  'engage-12033': ['film', 'live-music', 'art'],
  'engage-12110': ['road-trips', 'sports'],
  'engage-12188': ['film'],
};

export const engageScSource: EventSource = {
  id: 'engagesc',
  label: 'EngageSC',
  realIntegration: 'Public iCal feed at https://engage.usc.edu/ical/usc/ical_usc.ics',
  async fetchEvents() {
    return RAW.map(normalise);
  },
};
