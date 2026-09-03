import type { NormalizedEvent } from '@/lib/domain/types';
import { isoAt } from '@/lib/util/dates';
import { PHOTOS } from '@/lib/seed/images';
import type { EventSource } from '../source';

/**
 * Luma — where the LA tech, film and creative scene posts its evenings.
 *
 * MOCK BOUNDARY: replace `fetchEvents` with a call to the Luma public API
 * (GET /public/v1/calendar/list-events with an API key per calendar) for the handful of LA
 * calendars worth following, then map each event through `normalise` unchanged.
 *
 * The raw shape below follows Luma's response: cents for money, a `geo_address_json` blob,
 * and a `visibility` flag we have to respect.
 */
interface LumaApiEvent {
  api_id: string;
  name: string;
  description_short: string;
  cover_url: string;
  start_at: string;
  end_at: string;
  geo_address_json: { address: string; city_state: string };
  price_cents: number | null;
  ticket_url: string;
  calendar_name: string;
  visibility: 'public' | 'private';
  age_restriction: number | null;
}

const RAW: LumaApiEvent[] = [
  {
    api_id: 'evt-8kd92mfa',
    name: 'LA Tech Week: opening night on the Santa Monica pier deck',
    description_short:
      'The kickoff for the week, and the only night of it that does not require you to already know somebody. Two hundred people, free drinks for the first hour, and a lot of students pretending they are not students.',
    cover_url: PHOTOS.rooftopNight,
    start_at: isoAt(7, 18, 30),
    end_at: isoAt(7, 22, 0),
    geo_address_json: { address: '1550 Pacific Coast Hwy', city_state: 'Santa Monica, CA' },
    price_cents: 0,
    ticket_url: 'https://lu.ma/la-tech-week-opening',
    calendar_name: 'LA Tech Week',
    visibility: 'public',
    age_restriction: null,
  },
  {
    api_id: 'evt-3nv71paq',
    name: 'Sunset Film Club: 16mm shorts in a Silver Lake back garden',
    description_short:
      'Six short films projected on a bedsheet strung between two jacarandas. Bring a cushion. It sells out at sixty people and there is a waiting list every month.',
    cover_url: PHOTOS.cinema,
    start_at: isoAt(5, 19, 0),
    end_at: isoAt(5, 22, 30),
    geo_address_json: { address: '2712 Griffith Park Blvd', city_state: 'Los Angeles, CA' },
    price_cents: 1200,
    ticket_url: 'https://lu.ma/sunset-film-club-nov',
    calendar_name: 'Sunset Film Club',
    visibility: 'public',
    age_restriction: null,
  },
  {
    api_id: 'evt-6bq04wze',
    name: 'Analogue photo walk: the Arts District at golden hour',
    description_short:
      'Three hours, one roll, no digital. Meet at the Sixth Street Viaduct and finish at a lab on Traction that will develop what you shot for $9. Bring a camera that takes film; there are two spares if you do not have one.',
    cover_url: PHOTOS.galleryWall,
    start_at: isoAt(3, 16, 0),
    end_at: isoAt(3, 19, 0),
    geo_address_json: { address: '1500 E 6th St', city_state: 'Los Angeles, CA' },
    price_cents: 0,
    ticket_url: 'https://lu.ma/arts-district-photo-walk',
    calendar_name: 'LA Film Photography',
    visibility: 'public',
    age_restriction: null,
  },
  {
    api_id: 'evt-9xr55tkb',
    name: 'Founders coffee, downtown',
    description_short:
      'Eight in the morning, forty people, no pitches allowed for the first half hour. Runs every fortnight above a coffee place on Spring Street. Genuinely useful if you are trying to find an internship here rather than at home.',
    cover_url: PHOTOS.conferenceRoom,
    start_at: isoAt(8, 8, 0),
    end_at: isoAt(8, 9, 30),
    geo_address_json: { address: '541 S Spring St', city_state: 'Los Angeles, CA' },
    price_cents: 500,
    ticket_url: 'https://lu.ma/founders-coffee-dtla',
    calendar_name: 'DTLA Founders',
    visibility: 'public',
    age_restriction: null,
  },
  {
    api_id: 'evt-2hm38gcy',
    name: 'Rooftop jazz above Grand Central Market',
    description_short:
      'A quartet, a bar and the whole downtown skyline from the eleventh floor. It is 21 and over at the door and they check, so this one is not for everybody in the cohort.',
    cover_url: PHOTOS.rooftopNight,
    start_at: isoAt(12, 20, 0),
    end_at: isoAt(12, 23, 30),
    geo_address_json: { address: '317 S Broadway', city_state: 'Los Angeles, CA' },
    price_cents: 2000,
    ticket_url: 'https://lu.ma/rooftop-jazz-broadway',
    calendar_name: 'Broadway Sessions',
    visibility: 'public',
    age_restriction: 21,
  },
];

const TAGS: Record<string, NormalizedEvent['tags']> = {
  'evt-8kd92mfa': ['career', 'nightlife'],
  'evt-3nv71paq': ['film', 'art'],
  'evt-6bq04wze': ['photography', 'art'],
  'evt-9xr55tkb': ['career'],
  'evt-2hm38gcy': ['live-music', 'nightlife'],
};

const CATEGORIES: Record<string, NormalizedEvent['category']> = {
  'evt-8kd92mfa': 'career',
  'evt-3nv71paq': 'culture',
  'evt-6bq04wze': 'culture',
  'evt-9xr55tkb': 'career',
  'evt-2hm38gcy': 'nightlife',
};

function normalise(raw: LumaApiEvent): NormalizedEvent {
  const dollars = raw.price_cents === null ? null : raw.price_cents / 100;
  return {
    id: `ev-${raw.api_id}`,
    source: 'luma',
    sourceEventId: raw.api_id,
    title: raw.name,
    description: raw.description_short,
    image: raw.cover_url,
    startsAt: raw.start_at,
    endsAt: raw.end_at,
    venueName: raw.geo_address_json.address,
    venueArea: raw.geo_address_json.city_state.replace(', CA', ''),
    costLabel: dollars === null ? 'Price on the door' : dollars === 0 ? 'Free' : `$${dollars}`,
    costUsd: dollars === 0 ? null : dollars,
    url: raw.ticket_url,
    tags: TAGS[raw.api_id] ?? [],
    category: CATEGORIES[raw.api_id] ?? 'culture',
    hostOrg: raw.calendar_name,
    is21Plus: raw.age_restriction === 21,
  };
}

export const lumaSource: EventSource = {
  id: 'luma',
  label: 'Luma',
  realIntegration: 'Luma public API, GET /public/v1/calendar/list-events per followed calendar',
  async fetchEvents() {
    return RAW.filter((e) => e.visibility === 'public').map(normalise);
  },
};
