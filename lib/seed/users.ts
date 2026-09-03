import type { CohortUser, InterestTag } from '@/lib/domain/types';
import { PORTRAITS } from './images';

/**
 * The Fall exchange cohort. Ages straddle 21 deliberately — roughly half this group cannot get
 * through a Las Vegas casino door or rent a car without a surcharge, and that is the fact the
 * rest of the product is built around.
 */

interface SeedUser {
  id: string;
  name: string;
  homeCountry: string;
  homeUniversity: string;
  age: number;
  hasCar: boolean;
  hasUsCreditCard: boolean;
  interests: InterestTag[];
  bio: string;
}

const SEED: SeedUser[] = [
  {
    id: 'u-ana',
    name: 'Ana Ferreira',
    homeCountry: 'Brazil',
    homeUniversity: 'FGV São Paulo',
    age: 21,
    hasCar: false,
    hasUsCreditCard: false,
    interests: ['beaches', 'food', 'live-music', 'photography'],
    bio: 'Here until December. Will go anywhere there is a coastline and a bus that reaches it.',
  },
  {
    id: 'u-jonas',
    name: 'Jonas Berger',
    homeCountry: 'Germany',
    homeUniversity: 'LMU Munich',
    age: 20,
    hasCar: true,
    hasUsCreditCard: false,
    interests: ['hiking', 'national-parks', 'road-trips', 'photography'],
    bio: 'Bought a 2009 Corolla in week one for $3,200. It fits five and it has made it to Nevada twice.',
  },
  {
    id: 'u-freya',
    name: 'Freya Lindqvist',
    homeCountry: 'Sweden',
    homeUniversity: 'Lund University',
    age: 22,
    hasCar: false,
    hasUsCreditCard: true,
    interests: ['national-parks', 'hiking', 'wellness', 'photography'],
    bio: 'Planning the trips nobody else wants to plan. The spreadsheet exists, ask for the link.',
  },
  {
    id: 'u-mateo',
    name: 'Mateo Rossi',
    homeCountry: 'Italy',
    homeUniversity: 'Bocconi',
    age: 20,
    hasCar: false,
    hasUsCreditCard: false,
    interests: ['sports', 'food', 'nightlife', 'film'],
    bio: 'Trying to see every LA team play at least once before I fly home.',
  },
  {
    id: 'u-yuki',
    name: 'Yuki Tanaka',
    homeCountry: 'Japan',
    homeUniversity: 'Waseda University',
    age: 21,
    hasCar: false,
    hasUsCreditCard: false,
    interests: ['art', 'photography', 'film', 'thrifting'],
    bio: 'Shooting film all semester. Two rolls a week, mostly of parking lots and palm trees.',
  },
  {
    id: 'u-chloe',
    name: 'Chloé Marchand',
    homeCountry: 'France',
    homeUniversity: 'Sciences Po',
    age: 19,
    hasCar: false,
    hasUsCreditCard: false,
    interests: ['art', 'food', 'thrifting', 'live-music'],
    bio: 'Nineteen, which rules out about a third of this city. Working around it.',
  },
  {
    id: 'u-diego',
    name: 'Diego Herrera',
    homeCountry: 'Mexico',
    homeUniversity: 'Tec de Monterrey',
    age: 22,
    hasCar: true,
    hasUsCreditCard: true,
    interests: ['nightlife', 'road-trips', 'food', 'sports'],
    bio: 'Drove up from Monterrey in August. Happy to be the one with the car, less happy about parking.',
  },
  {
    id: 'u-aisling',
    name: 'Aisling Byrne',
    homeCountry: 'Ireland',
    homeUniversity: 'Trinity College Dublin',
    age: 20,
    hasCar: false,
    hasUsCreditCard: false,
    interests: ['hiking', 'beaches', 'live-music', 'volunteering'],
    bio: 'Signed up for the beach clean-up before I signed up for classes.',
  },
  {
    id: 'u-lukas',
    name: 'Lukáš Novák',
    homeCountry: 'Czechia',
    homeUniversity: 'Charles University',
    age: 21,
    hasCar: false,
    hasUsCreditCard: false,
    interests: ['national-parks', 'hiking', 'photography', 'road-trips'],
    bio: 'Came for the deserts. Everything else is a bonus.',
  },
  {
    id: 'u-priya',
    name: 'Priya Raghunathan',
    homeCountry: 'India',
    homeUniversity: 'Ashoka University',
    age: 20,
    hasCar: false,
    hasUsCreditCard: false,
    interests: ['career', 'art', 'food', 'film'],
    bio: 'Half my calendar is info sessions. The other half is trying to fix that.',
  },
  {
    id: 'u-tom',
    name: 'Tom Whitfield',
    homeCountry: 'United Kingdom',
    homeUniversity: 'University of Bristol',
    age: 20,
    hasCar: false,
    hasUsCreditCard: false,
    interests: ['sports', 'nightlife', 'food', 'surfing'],
    bio: 'Learning to surf badly at Manhattan Beach most Saturdays. Come and watch, it is funny.',
  },
  {
    id: 'u-sofia',
    name: 'Sofía Aguirre',
    homeCountry: 'Argentina',
    homeUniversity: 'Universidad de Buenos Aires',
    age: 23,
    hasCar: false,
    hasUsCreditCard: true,
    interests: ['live-music', 'nightlife', 'art', 'food'],
    bio: 'Over 21 and fully aware that makes me useful. I will get the table.',
  },
  {
    id: 'u-nils',
    name: 'Nils Haugen',
    homeCountry: 'Norway',
    homeUniversity: 'NTNU Trondheim',
    age: 22,
    hasCar: true,
    hasUsCreditCard: false,
    interests: ['road-trips', 'national-parks', 'hiking', 'photography'],
    bio: 'Rented a car once. The under-25 fee cost more than the car did. Ask me before you book.',
  },
  {
    id: 'u-emma',
    name: 'Emma Visser',
    homeCountry: 'Netherlands',
    homeUniversity: 'Erasmus Rotterdam',
    age: 19,
    hasCar: false,
    hasUsCreditCard: false,
    interests: ['beaches', 'wellness', 'food', 'thrifting'],
    bio: 'Everything I have done here has been reachable by Metro. It is more than people think.',
  },
  {
    id: 'u-kwame',
    name: 'Kwame Mensah',
    homeCountry: 'Ghana',
    homeUniversity: 'University of Ghana',
    age: 22,
    hasCar: false,
    hasUsCreditCard: true,
    interests: ['sports', 'career', 'live-music', 'food'],
    bio: 'Playing pick-up at the Lyon Center most evenings. Always short two players.',
  },
  {
    id: 'u-marta',
    name: 'Marta Kowalczyk',
    homeCountry: 'Poland',
    homeUniversity: 'University of Warsaw',
    age: 21,
    hasCar: false,
    hasUsCreditCard: false,
    interests: ['art', 'film', 'thrifting', 'photography'],
    bio: 'Keeping a list of every free museum day in this county. It is longer than you would guess.',
  },
  {
    id: 'u-hugo',
    name: 'Hugo Almeida',
    homeCountry: 'Portugal',
    homeUniversity: 'NOVA Lisbon',
    age: 20,
    hasCar: false,
    hasUsCreditCard: false,
    interests: ['surfing', 'beaches', 'food', 'live-music'],
    bio: 'Surfed at home for ten years and still cannot read this coastline. Learning.',
  },
  {
    id: 'u-seoyeon',
    name: 'Seo-yeon Park',
    homeCountry: 'South Korea',
    homeUniversity: 'Yonsei University',
    age: 21,
    hasCar: false,
    hasUsCreditCard: false,
    interests: ['food', 'art', 'photography', 'wellness'],
    bio: 'I will take you to the right places in Koreatown. Please stop going to the one on the corner.',
  },
  {
    id: 'u-liam',
    name: 'Liam O’Sullivan',
    homeCountry: 'Australia',
    homeUniversity: 'University of Melbourne',
    age: 20,
    hasCar: false,
    hasUsCreditCard: false,
    interests: ['surfing', 'sports', 'beaches', 'road-trips'],
    bio: 'Two semesters, one board, no car. Solvable problem.',
  },
  {
    id: 'u-nadia',
    name: 'Nadia Haddad',
    homeCountry: 'Lebanon',
    homeUniversity: 'American University of Beirut',
    age: 22,
    hasCar: false,
    hasUsCreditCard: true,
    interests: ['food', 'art', 'career', 'volunteering'],
    bio: 'Cooking for eight most Sundays. There is always a spare seat.',
  },
  {
    id: 'u-felix',
    name: 'Felix Weber',
    homeCountry: 'Switzerland',
    homeUniversity: 'ETH Zürich',
    age: 23,
    hasCar: true,
    hasUsCreditCard: true,
    interests: ['hiking', 'national-parks', 'road-trips', 'career'],
    bio: 'Twenty-three, US card, rental in my name. I am aware of what that makes me worth here.',
  },
  {
    id: 'u-camila',
    name: 'Camila Duarte',
    homeCountry: 'Chile',
    homeUniversity: 'PUC Chile',
    age: 20,
    hasCar: false,
    hasUsCreditCard: false,
    interests: ['beaches', 'photography', 'live-music', 'thrifting'],
    bio: 'Trying to leave campus at least twice a week. It is harder than it sounds.',
  },
  {
    id: 'u-oskar',
    name: 'Oskar Lehmann',
    homeCountry: 'Austria',
    homeUniversity: 'WU Vienna',
    age: 19,
    hasCar: false,
    hasUsCreditCard: false,
    interests: ['sports', 'film', 'food', 'hiking'],
    bio: 'Nineteen. Every plan I make starts with checking whether they will let me in.',
  },
  {
    id: 'u-ines',
    name: 'Inès Moreau',
    homeCountry: 'Belgium',
    homeUniversity: 'KU Leuven',
    age: 21,
    hasCar: false,
    hasUsCreditCard: false,
    interests: ['art', 'volunteering', 'wellness', 'food'],
    bio: 'Volunteering at the food bank on Vermont on Saturdays. Two more pairs of hands would help.',
  },
  {
    id: 'u-rafael',
    name: 'Rafael Santos',
    homeCountry: 'Spain',
    homeUniversity: 'IE Madrid',
    age: 22,
    hasCar: false,
    hasUsCreditCard: true,
    interests: ['nightlife', 'sports', 'live-music', 'career'],
    bio: 'If it involves a stadium or a queue outside a venue, I am probably already there.',
  },
];

export const COHORT_USERS: CohortUser[] = SEED.map((u, i) => ({
  ...u,
  photo: PORTRAITS[i % PORTRAITS.length],
  cohort: 'Fall exchange',
}));

/**
 * A hand-built friendship graph rather than a random one, so that whichever profile you pick at
 * onboarding you already have friends who are going to things. The attendance signal is only
 * worth anything when it renders populated.
 */
const FRIEND_PAIRS: Array<[string, string]> = [
  ['u-ana', 'u-jonas'], ['u-ana', 'u-mateo'], ['u-ana', 'u-camila'], ['u-ana', 'u-hugo'],
  ['u-ana', 'u-sofia'], ['u-ana', 'u-emma'], ['u-ana', 'u-diego'],
  ['u-jonas', 'u-freya'], ['u-jonas', 'u-lukas'], ['u-jonas', 'u-nils'], ['u-jonas', 'u-oskar'],
  ['u-jonas', 'u-felix'], ['u-jonas', 'u-tom'],
  ['u-freya', 'u-emma'], ['u-freya', 'u-nils'], ['u-freya', 'u-aisling'], ['u-freya', 'u-marta'],
  ['u-freya', 'u-felix'], ['u-freya', 'u-ines'],
  ['u-mateo', 'u-rafael'], ['u-mateo', 'u-tom'], ['u-mateo', 'u-kwame'], ['u-mateo', 'u-oskar'],
  ['u-mateo', 'u-diego'],
  ['u-yuki', 'u-marta'], ['u-yuki', 'u-seoyeon'], ['u-yuki', 'u-chloe'], ['u-yuki', 'u-camila'],
  ['u-yuki', 'u-priya'],
  ['u-chloe', 'u-ines'], ['u-chloe', 'u-marta'], ['u-chloe', 'u-emma'], ['u-chloe', 'u-oskar'],
  ['u-diego', 'u-rafael'], ['u-diego', 'u-sofia'], ['u-diego', 'u-camila'], ['u-diego', 'u-kwame'],
  ['u-aisling', 'u-tom'], ['u-aisling', 'u-liam'], ['u-aisling', 'u-ines'], ['u-aisling', 'u-emma'],
  ['u-lukas', 'u-nils'], ['u-lukas', 'u-felix'], ['u-lukas', 'u-marta'], ['u-lukas', 'u-oskar'],
  ['u-priya', 'u-nadia'], ['u-priya', 'u-seoyeon'], ['u-priya', 'u-kwame'], ['u-priya', 'u-rafael'],
  ['u-tom', 'u-liam'], ['u-tom', 'u-hugo'], ['u-tom', 'u-rafael'],
  ['u-sofia', 'u-rafael'], ['u-sofia', 'u-nadia'], ['u-sofia', 'u-camila'],
  ['u-nils', 'u-felix'], ['u-nils', 'u-liam'],
  ['u-emma', 'u-camila'], ['u-emma', 'u-ines'], ['u-emma', 'u-seoyeon'],
  ['u-kwame', 'u-nadia'], ['u-kwame', 'u-liam'], ['u-kwame', 'u-felix'],
  ['u-marta', 'u-ines'], ['u-marta', 'u-seoyeon'],
  ['u-hugo', 'u-liam'], ['u-hugo', 'u-camila'], ['u-hugo', 'u-oskar'],
  ['u-seoyeon', 'u-nadia'], ['u-seoyeon', 'u-camila'],
  ['u-nadia', 'u-ines'], ['u-nadia', 'u-felix'],
  ['u-felix', 'u-rafael'], ['u-oskar', 'u-liam'], ['u-ines', 'u-priya'],
];

export function buildFriendships(): Record<string, string[]> {
  const graph: Record<string, string[]> = {};
  for (const u of COHORT_USERS) graph[u.id] = [];
  for (const [a, b] of FRIEND_PAIRS) {
    if (!graph[a] || !graph[b]) continue;
    if (!graph[a].includes(b)) graph[a].push(b);
    if (!graph[b].includes(a)) graph[b].push(a);
  }
  return graph;
}

export const USERS_BY_ID: Record<string, CohortUser> = Object.fromEntries(
  COHORT_USERS.map((u) => [u.id, u]),
);
