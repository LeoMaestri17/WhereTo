import type { NormalizedEvent } from '@/lib/domain/types';
import { isoAt } from '@/lib/util/dates';
import { PHOTOS } from '@/lib/seed/images';
import type { EventSource } from '../source';

/**
 * Handshake — careers. Exchange students are usually told to ignore this because they cannot
 * take a US job, which is wrong: the info sessions are free food and a room full of people, and
 * several of these companies recruit in Europe too.
 *
 * MOCK BOUNDARY: replace `fetchEvents` with Handshake's partner Events API
 * (GET /partner/v1/events, OAuth client credentials scoped to the USC institution id). Their
 * payload separates `employer` from `institution_event`, which is why both appear below.
 */
interface HandshakeEvent {
  id: number;
  name: string;
  summary: string;
  banner_image_url: string;
  start_date_time: string;
  end_date_time: string;
  location: { name: string; room: string | null };
  employer: { name: string } | null;
  event_type: 'employer_info_session' | 'career_fair' | 'workshop' | 'networking';
  registration_required: boolean;
  open_to_international: boolean;
}

const RAW: HandshakeEvent[] = [
  {
    id: 4820117,
    name: 'Spring 2027 Internship and Careers Fair',
    summary:
      'Around 180 employers across two floors. Bring printed CVs; about a third of the stands still ask for one. Several of these firms have European graduate schemes, which is the reason to go if you are only here for a semester.',
    banner_image_url: PHOTOS.conferenceRoom,
    start_date_time: isoAt(14, 11, 0),
    end_date_time: isoAt(14, 16, 0),
    location: { name: 'Ronald Tutor Campus Center', room: 'Grand Ballroom' },
    employer: null,
    event_type: 'career_fair',
    registration_required: true,
    open_to_international: true,
  },
  {
    id: 4831902,
    name: 'Riot Games: campus coffee chat',
    summary:
      'Twenty places, sign-up only, with two engineers and a producer from the Santa Monica studio. Informal, an hour, and they do talk about the Dublin office if you ask.',
    banner_image_url: PHOTOS.conferenceTalk,
    start_date_time: isoAt(5, 15, 0),
    end_date_time: isoAt(5, 16, 0),
    location: { name: 'Viterbi Career Connections', room: 'RTH 218' },
    employer: { name: 'Riot Games' },
    event_type: 'employer_info_session',
    registration_required: true,
    open_to_international: true,
  },
  {
    id: 4842355,
    name: 'Deloitte Consulting: information session and case walkthrough',
    summary:
      'They walk a live case for forty minutes, which is more useful than the pitch that precedes it. Dinner is provided and it is a proper dinner. US roles need work authorisation but the London and Zurich offices recruit from these sessions too.',
    banner_image_url: PHOTOS.conferenceRoom,
    start_date_time: isoAt(8, 18, 0),
    end_date_time: isoAt(8, 20, 0),
    location: { name: 'Fertitta Hall', room: 'JFF 327' },
    employer: { name: 'Deloitte' },
    event_type: 'employer_info_session',
    registration_required: true,
    open_to_international: true,
  },
  {
    id: 4855018,
    name: 'CV lab: drop-in review, no appointment',
    summary:
      'Forty-five minutes with a careers adviser, first come first served. Worth it specifically for exchange students, because a European CV needs restructuring before any US employer will read it properly.',
    banner_image_url: PHOTOS.campusWalk,
    start_date_time: isoAt(3, 13, 0),
    end_date_time: isoAt(3, 17, 0),
    location: { name: 'USC Career Center', room: 'STU 110' },
    employer: null,
    event_type: 'workshop',
    registration_required: false,
    open_to_international: true,
  },
  {
    id: 4867441,
    name: 'SpaceX engineering meet and greet',
    summary:
      'Hawthorne is twenty minutes down the 105 and they hire hard from this campus. Be aware before you queue: their engineering roles are ITAR-restricted, so almost none of us are eligible. Go for the conversation, not the application.',
    banner_image_url: PHOTOS.conferenceTalk,
    start_date_time: isoAt(16, 17, 30),
    end_date_time: isoAt(16, 19, 30),
    location: { name: 'Michelson Center', room: 'MCB 101' },
    employer: { name: 'SpaceX' },
    event_type: 'networking',
    registration_required: true,
    open_to_international: false,
  },
];

function normalise(raw: HandshakeEvent): NormalizedEvent {
  const registrationNote = raw.registration_required ? 'Free, sign-up required' : 'Free, drop in';
  return {
    id: `ev-hs-${raw.id}`,
    source: 'handshake',
    sourceEventId: String(raw.id),
    title: raw.name,
    description: raw.open_to_international
      ? raw.summary
      : `${raw.summary} Handshake has this one flagged as not open to international students.`,
    image: raw.banner_image_url,
    startsAt: raw.start_date_time,
    endsAt: raw.end_date_time,
    venueName: raw.location.room
      ? `${raw.location.name}, ${raw.location.room}`
      : raw.location.name,
    venueArea: 'University Park Campus',
    costLabel: registrationNote,
    costUsd: null,
    url: `https://usc.joinhandshake.com/stu/events/${raw.id}`,
    tags: ['career'],
    category: 'career',
    hostOrg: raw.employer?.name ?? 'USC Career Center',
    is21Plus: false,
  };
}

export const handshakeSource: EventSource = {
  id: 'handshake',
  label: 'Handshake',
  realIntegration:
    'Handshake partner Events API, GET /partner/v1/events with OAuth client credentials scoped to USC',
  async fetchEvents() {
    return RAW.map(normalise);
  },
};
