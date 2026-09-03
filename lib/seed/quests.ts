import type { Membership, Quest, TripActuals } from '@/lib/domain/types';
import { isoAt, isoDate } from '@/lib/util/dates';
import { PHOTOS } from './images';
import { COHORT_USERS } from './users';

/**
 * Seeded trips and plans.
 *
 * Two invariants hold here and are checked by lib/seed/validate.ts:
 *   1. Every cohort member hosts exactly one *active* quest, so whichever profile you pick at
 *      onboarding the host console has something in it.
 *   2. Between them the quests cover every derived status — open, filling, full, closed,
 *      cancelled and completed — because those states are most of what there is to get wrong.
 *
 * Dates are relative to the moment the demo data is generated, so deadlines are always live.
 */

interface SeedQuest extends Omit<Quest, 'createdAt'> {
  /** Approved joiners, excluding the host, who always occupies one seat. */
  approved: string[];
  createdDaysAgo: number;
}

const trips: SeedQuest[] = [
  {
    id: 'q-joshua-tree',
    kind: 'trip',
    title: 'Joshua Tree, two nights under the stars',
    destination: 'Joshua Tree National Park',
    cover: PHOTOS.joshuaTree,
    startDate: isoDate(12),
    endDate: isoDate(14),
    capacity: 7,
    hostId: 'u-jonas',
    description:
      'I have the Corolla and a four-person tent, so we need one more tent between the rest of us. Leaving Friday about 3pm to get there before dark, back Sunday evening. Black Rock campground is booked and paid for, you owe me $14 each for that. Bring layers, it drops to about 7°C at night and everyone always underestimates that.',
    signupDeadline: isoAt(6, 21, 0),
    costEstimate: { minPerPerson: 95, maxPerPerson: 140, basis: 'Camping, petrol split 5 ways, food from Stater Bros' },
    attachedPlanSlug: 'joshua-tree-weekend',
    lifecycle: 'active',
    tags: ['national-parks', 'hiking', 'photography', 'road-trips'],
    meetingPoint: 'Jefferson & Hoover, outside the 7-Eleven',
    approved: ['u-lukas', 'u-oskar', 'u-camila'],
    createdDaysAgo: 5,
  },
  {
    id: 'q-zion',
    kind: 'trip',
    title: 'Zion — Angels Landing if we get the permit',
    destination: 'Zion National Park, Utah',
    cover: PHOTOS.zionCanyon,
    startDate: isoDate(19),
    endDate: isoDate(21),
    capacity: 5,
    hostId: 'u-freya',
    description:
      'This is the long one. Six and a half hours of driving each way, leaving Thursday night and sleeping in Springdale. I have entered the Angels Landing permit lottery for five people — if it does not come through we do Observation Point instead, which is honestly the better view anyway. I have booked two rooms at the Zion Park Motel on my card, so you pay me back rather than the hotel.',
    signupDeadline: isoAt(9, 20, 0),
    costEstimate: { minPerPerson: 215, maxPerPerson: 290, basis: 'Two motel rooms split 5 ways, rental car, park entry, fuel' },
    attachedPlanSlug: 'zion-weekend',
    lifecycle: 'active',
    tags: ['national-parks', 'hiking', 'photography'],
    meetingPoint: 'Parkside Apartments loading zone',
    approved: ['u-nils', 'u-felix', 'u-marta'],
    createdDaysAgo: 9,
  },
  {
    id: 'q-vegas',
    kind: 'trip',
    title: 'Vegas, and yes I checked the age rules',
    destination: 'Las Vegas, Nevada',
    cover: PHOTOS.vegasStrip,
    startDate: isoDate(23),
    endDate: isoDate(25),
    capacity: 6,
    hostId: 'u-sofia',
    description:
      'FlixBus from Union Station, $34 return if you book this week. Two rooms at the Excalibur, four sharing. Everyone coming is over 21 — I am not organising a weekend where half the group waits outside. If you are under 21 message me anyway, there is a version of this trip that works and I will post it separately.',
    signupDeadline: isoAt(14, 22, 0),
    costEstimate: { minPerPerson: 165, maxPerPerson: 240, basis: 'Coach return, two rooms split 6 ways, resort fees included' },
    attachedPlanSlug: 'las-vegas-weekend',
    lifecycle: 'active',
    tags: ['nightlife', 'live-music', 'road-trips'],
    meetingPoint: 'Union Station, FlixBus bay 4',
    approved: ['u-rafael', 'u-diego', 'u-kwame', 'u-nadia', 'u-felix'],
    createdDaysAgo: 11,
  },
  {
    id: 'q-san-diego',
    kind: 'trip',
    title: 'San Diego by train, no car needed',
    destination: 'San Diego',
    cover: PHOTOS.sanDiegoHarbour,
    startDate: isoDate(30),
    endDate: isoDate(32),
    capacity: 8,
    hostId: 'u-emma',
    description:
      'The whole point of this one is that nobody needs a licence. Pacific Surfliner from Union Station, right along the water for the last hour. Hostel in Little Italy, eight-bed dorm, and everything after that is walkable or on the trolley. I am nineteen and this trip has nothing in it that turns me away at a door.',
    signupDeadline: isoAt(20, 21, 0),
    costEstimate: { minPerPerson: 140, maxPerPerson: 195, basis: 'Amtrak return, 2 nights hostel dorm, trolley day passes' },
    attachedPlanSlug: 'san-diego-weekend',
    lifecycle: 'active',
    tags: ['beaches', 'food', 'surfing'],
    meetingPoint: 'Union Station, under the departure board',
    approved: ['u-aisling', 'u-ines'],
    createdDaysAgo: 4,
  },
  {
    id: 'q-big-sur',
    kind: 'trip',
    title: 'Big Sur and Highway 1',
    destination: 'Big Sur, Central Coast',
    cover: PHOTOS.bigSurRoad,
    startDate: isoDate(9),
    endDate: isoDate(11),
    capacity: 5,
    hostId: 'u-nils',
    description:
      'Two nights, one road. Camping at Pfeiffer Big Sur, which I booked four months ago because that is how far ahead you have to book it. There is no phone signal from Carmel south, so anything we want to see has to be agreed before we leave.',
    signupDeadline: isoAt(-2, 20, 0),
    costEstimate: { minPerPerson: 185, maxPerPerson: 245, basis: 'Campsite split 4 ways, fuel, and one dinner out' },
    attachedPlanSlug: 'big-sur-weekend',
    lifecycle: 'active',
    tags: ['road-trips', 'national-parks', 'photography'],
    meetingPoint: 'Vermont & Exposition, north-east corner',
    approved: ['u-lukas', 'u-freya'],
    createdDaysAgo: 26,
  },
  {
    id: 'q-nyc-thanksgiving',
    kind: 'trip',
    title: 'New York for Thanksgiving week',
    destination: 'New York City',
    cover: PHOTOS.newYorkAutumn,
    startDate: isoDate(58),
    endDate: isoDate(63),
    capacity: 10,
    hostId: 'u-ana',
    description:
      'Flights are the entire cost of this trip and they go up every week we wait, so the deadline on this one is real. I am watching JetBlue out of Long Beach and Delta out of LAX. Accommodation is an Airbnb in Bed-Stuy, five nights, ten of us across two flats. If ten people commit the per-head cost drops by about $90, which is why the capacity is what it is.',
    signupDeadline: isoAt(25, 23, 0),
    costEstimate: { minPerPerson: 610, maxPerPerson: 840, basis: 'Return flight, 5 nights split 10 ways, subway pass' },
    attachedPlanSlug: 'new-york-thanksgiving',
    lifecycle: 'active',
    tags: ['art', 'food', 'photography', 'live-music'],
    meetingPoint: 'LAX Terminal 3 check-in, or meet us there',
    approved: ['u-mateo', 'u-camila', 'u-hugo', 'u-sofia'],
    createdDaysAgo: 14,
  },
  {
    id: 'q-san-francisco',
    kind: 'trip',
    title: 'San Francisco, flying up Friday',
    destination: 'San Francisco',
    cover: PHOTOS.goldenGate,
    startDate: isoDate(16),
    endDate: isoDate(18),
    capacity: 6,
    hostId: 'u-tom',
    description:
      'Cancelled, sorry. The $59 Southwest fare I built this around went to $181 while I was waiting for people to confirm, and at that price it stops being the trip I advertised. I would rather call it off than quietly let it become a $400 weekend. I will repost in three weeks and watch the fares properly this time.',
    signupDeadline: isoAt(7, 20, 0),
    costEstimate: { minPerPerson: 235, maxPerPerson: 320, basis: 'Return flight, 2 nights hostel, Muni pass' },
    attachedPlanSlug: 'san-francisco-weekend',
    lifecycle: 'cancelled',
    tags: ['art', 'food', 'photography'],
    meetingPoint: 'LAX Terminal 1',
    approved: ['u-mateo', 'u-rafael', 'u-liam'],
    createdDaysAgo: 18,
  },

  /* ------------------------------------------------ completed, with reported actuals */
  {
    id: 'q-southwest-loop',
    kind: 'trip',
    title: 'The Southwest loop — five days, four parks',
    destination: 'Arizona and Utah',
    cover: PHOTOS.grandCanyon,
    startDate: isoDate(-26),
    endDate: isoDate(-21),
    capacity: 5,
    hostId: 'u-felix',
    description:
      'Grand Canyon South Rim, Horseshoe Bend, Antelope Canyon and a night in Sedona on the way back. I rented in my own name because I am twenty-three and I have a US card, which is the only reason the numbers below work at all.',
    signupDeadline: isoAt(-34, 20, 0),
    costEstimate: { minPerPerson: 400, maxPerPerson: 520, basis: 'Rental split 5 ways, motels, park entry, fuel' },
    attachedPlanSlug: 'southwest-road-loop',
    lifecycle: 'completed',
    tags: ['road-trips', 'national-parks', 'photography', 'hiking'],
    meetingPoint: 'Enterprise on Figueroa',
    approved: ['u-lukas', 'u-nils', 'u-jonas', 'u-marta'],
    createdDaysAgo: 48,
  },
  {
    id: 'q-joshua-tree-past',
    kind: 'trip',
    title: 'Joshua Tree in the first week of term',
    destination: 'Joshua Tree National Park',
    cover: PHOTOS.joshuaTreeRocks,
    startDate: isoDate(-40),
    endDate: isoDate(-38),
    capacity: 6,
    hostId: 'u-lukas',
    description:
      'The first trip anyone in the cohort organised. Six of us, two cars, one of which belonged to somebody we met at the welcome mixer four days earlier. It worked out.',
    signupDeadline: isoAt(-46, 20, 0),
    costEstimate: { minPerPerson: 105, maxPerPerson: 150, basis: 'Camping, fuel split, supermarket food' },
    attachedPlanSlug: 'joshua-tree-weekend',
    lifecycle: 'completed',
    tags: ['national-parks', 'hiking', 'photography'],
    meetingPoint: 'Jefferson & Hoover',
    approved: ['u-jonas', 'u-oskar', 'u-camila', 'u-yuki', 'u-chloe'],
    createdDaysAgo: 54,
  },
  {
    id: 'q-san-diego-past',
    kind: 'trip',
    title: 'San Diego, the first attempt',
    destination: 'San Diego',
    cover: PHOTOS.sanDiegoCliffs,
    startDate: isoDate(-17),
    endDate: isoDate(-15),
    capacity: 6,
    hostId: 'u-hugo',
    description:
      'Surfliner down, hostel in Ocean Beach, two mornings in the water at Tourmaline. The train is genuinely the best part and I would do it again exactly the same way.',
    signupDeadline: isoAt(-24, 20, 0),
    costEstimate: { minPerPerson: 130, maxPerPerson: 180, basis: 'Amtrak return, 2 nights hostel, board hire' },
    attachedPlanSlug: 'san-diego-weekend',
    lifecycle: 'completed',
    tags: ['beaches', 'surfing', 'food'],
    meetingPoint: 'Union Station',
    approved: ['u-liam', 'u-tom', 'u-ana', 'u-emma'],
    createdDaysAgo: 31,
  },
];

const plans: SeedQuest[] = [
  {
    id: 'p-lakers',
    kind: 'plan',
    title: 'Lakers, upper bowl, whoever they are playing',
    destination: 'Crypto.com Arena',
    cover: PHOTOS.basketballArena,
    startDate: isoDate(8),
    timeLabel: '7:30pm tip-off',
    capacity: 6,
    hostId: 'u-mateo',
    description:
      'I check resale every morning and section 320 has been sitting around $42. I will buy all six together the moment it drops under $40 so we are actually sitting next to each other, then you pay me back. E Line from Expo Park to Pico, twelve minutes, no parking to think about.',
    signupDeadline: isoAt(6, 12, 0),
    costEstimate: { minPerPerson: 40, maxPerPerson: 58, basis: 'Upper bowl resale plus the Metro fare' },
    lifecycle: 'active',
    tags: ['sports', 'nightlife'],
    meetingPoint: 'Expo Park/USC station, southbound platform',
    approved: ['u-rafael', 'u-oskar', 'u-tom', 'u-kwame'],
    createdDaysAgo: 3,
  },
  {
    id: 'p-dodgers',
    kind: 'plan',
    title: 'Dodgers day game, top deck',
    destination: 'Dodger Stadium',
    cover: PHOTOS.baseballStadium,
    startDate: isoDate(4),
    timeLabel: '1:10pm first pitch',
    capacity: 10,
    hostId: 'u-rafael',
    description:
      'Top deck seats are $21 and the view of the hills behind the outfield is better up there than anywhere else in the stadium. The Dodger Stadium Express leaves Union Station every ten minutes and is free if you have a ticket in your hand. Bring sun cream, there is no shade at all until about the fifth inning.',
    signupDeadline: isoAt(2, 20, 0),
    costEstimate: { minPerPerson: 24, maxPerPerson: 45, basis: 'Ticket, free shuttle, one thing to eat' },
    lifecycle: 'active',
    tags: ['sports', 'food'],
    meetingPoint: 'Union Station, Patsaouras bus plaza',
    approved: ['u-mateo', 'u-kwame', 'u-oskar', 'u-priya', 'u-liam'],
    createdDaysAgo: 6,
  },
  {
    id: 'p-santa-monica',
    kind: 'plan',
    title: 'Santa Monica beach day and the pier at sunset',
    destination: 'Santa Monica',
    cover: PHOTOS.santaMonicaPier,
    startDate: isoDate(3),
    timeLabel: 'Meeting 10am',
    capacity: 12,
    hostId: 'u-camila',
    description:
      'The Rapid 10 from campus is $1.25 and takes about fifty minutes. Beach in the morning, walk north to the pier when it cools down, stay for the sun going into the water. I am bringing a speaker and too much fruit. No plan beyond that, which is sort of the point.',
    signupDeadline: isoAt(2, 22, 0),
    costEstimate: { minPerPerson: 8, maxPerPerson: 30, basis: 'Bus both ways, food if you buy it there' },
    lifecycle: 'active',
    tags: ['beaches', 'photography', 'food'],
    meetingPoint: 'Bus stop at Jefferson & Flower',
    approved: ['u-ana', 'u-emma', 'u-hugo', 'u-yuki', 'u-chloe', 'u-seoyeon'],
    createdDaysAgo: 2,
  },
  {
    id: 'p-griffith',
    kind: 'plan',
    title: 'Griffith Observatory when it gets dark',
    destination: 'Griffith Observatory',
    cover: PHOTOS.griffithObservatory,
    startDate: isoDate(6),
    timeLabel: 'Meeting 5:30pm',
    capacity: 8,
    hostId: 'u-yuki',
    description:
      'Entry is free and so is looking through the Zeiss telescope on the roof, you just queue for it. I want to get there before sunset so we can watch the lights come on across the whole basin — that half hour is the reason to go. Bring a jacket, it is genuinely cold up there after dark. I will be shooting film so I am slow, do not wait for me.',
    signupDeadline: isoAt(5, 18, 0),
    costEstimate: { minPerPerson: 5, maxPerPerson: 20, basis: 'Metro plus the DASH Observatory shuttle' },
    lifecycle: 'active',
    tags: ['photography', 'film', 'hiking'],
    meetingPoint: 'Vermont/Sunset station, by the DASH stop',
    approved: ['u-marta', 'u-chloe', 'u-camila'],
    createdDaysAgo: 4,
  },
  {
    id: 'p-runyon',
    kind: 'plan',
    title: 'Runyon Canyon before class',
    destination: 'Runyon Canyon, Hollywood',
    cover: PHOTOS.hikingTrail,
    startDate: isoDate(2),
    timeLabel: '6:15am, back by 9',
    capacity: 6,
    hostId: 'u-aisling',
    description:
      'It is an hour up and back and you are at your desk by half nine feeling smug about it. The loop from Fuller Avenue is the one with the view. I do this most weeks on my own and would rather not.',
    signupDeadline: isoAt(1, 21, 0),
    costEstimate: { minPerPerson: 0, maxPerPerson: 12, basis: 'Split an Uber up, walk down to the Metro' },
    lifecycle: 'active',
    tags: ['hiking', 'wellness', 'photography'],
    meetingPoint: 'Outside Parkside, 6:15am sharp',
    approved: ['u-freya', 'u-emma'],
    createdDaysAgo: 2,
  },
  {
    id: 'p-broad',
    kind: 'plan',
    title: 'The Broad, then Grand Central Market',
    destination: 'Bunker Hill, Downtown',
    cover: PHOTOS.artGallery,
    startDate: isoDate(5),
    timeLabel: 'Meeting 11:30am',
    capacity: 6,
    hostId: 'u-marta',
    description:
      'General admission is free but the timed tickets go about two weeks out, so I have six held for 12:15. The Infinity Room is a separate queue inside and it is worth the wait. Afterwards it is a ten-minute walk downhill to Grand Central Market, where I will be having the eggs from Eggslut and hearing nothing against it.',
    signupDeadline: isoAt(4, 20, 0),
    costEstimate: { minPerPerson: 12, maxPerPerson: 28, basis: 'Free entry, Metro fare, lunch at the market' },
    lifecycle: 'active',
    tags: ['art', 'food', 'photography'],
    meetingPoint: 'Grand Av Arts/Bunker Hill station exit',
    approved: ['u-yuki', 'u-ines', 'u-chloe'],
    createdDaysAgo: 7,
  },
  {
    id: 'p-kbbq',
    kind: 'plan',
    title: 'Korean barbecue in Koreatown, done properly',
    destination: 'Koreatown',
    cover: PHOTOS.koreanBbq,
    startDate: isoDate(7),
    timeLabel: '7pm booking',
    capacity: 8,
    hostId: 'u-seoyeon',
    description:
      'Not the place on the corner with the English menu in the window. We are going to Kang Ho Dong Baekjeong on 6th, and I have booked under my name for eight at seven. It is about $32 a head for the combination if we share, which we will, because that is how it works. Come hungry and do not eat lunch.',
    signupDeadline: isoAt(6, 12, 0),
    costEstimate: { minPerPerson: 32, maxPerPerson: 45, basis: 'Shared combination for 8, plus the Metro' },
    lifecycle: 'active',
    tags: ['food'],
    meetingPoint: 'Wilshire/Western station, street level',
    approved: ['u-yuki', 'u-priya', 'u-nadia', 'u-emma', 'u-marta', 'u-camila', 'u-ines'],
    createdDaysAgo: 8,
  },
  {
    id: 'p-smorgasburg',
    kind: 'plan',
    title: 'Smorgasburg at ROW DTLA',
    destination: 'ROW DTLA, Arts District',
    cover: PHOTOS.nightMarket,
    startDate: isoDate(10),
    timeLabel: 'Sunday, from 11am',
    capacity: 10,
    hostId: 'u-nadia',
    description:
      'Ninety-odd stalls in an old produce terminal, every Sunday. The rule I am imposing is that everybody buys one thing and we split all of it, otherwise you eat one mediocre burrito and go home. Budget about $25 and you will be uncomfortably full.',
    signupDeadline: isoAt(9, 20, 0),
    costEstimate: { minPerPerson: 20, maxPerPerson: 35, basis: 'Metro plus roughly three shared dishes each' },
    lifecycle: 'active',
    tags: ['food', 'photography'],
    meetingPoint: 'ROW DTLA main entrance on Alameda',
    approved: ['u-priya', 'u-seoyeon', 'u-ines', 'u-kwame'],
    createdDaysAgo: 5,
  },
  {
    id: 'p-surf-lesson',
    kind: 'plan',
    title: 'First surf lesson at Manhattan Beach',
    destination: 'Manhattan Beach',
    cover: PHOTOS.surfBeach,
    startDate: isoDate(11),
    timeLabel: 'Saturday 8am',
    capacity: 5,
    hostId: 'u-liam',
    description:
      'For people who have never stood on a board. I am not an instructor but I have surfed since I was nine and this break is about as forgiving as it gets. Board and wetsuit hire from the shop on Highland is $35 for three hours. You will not stand up on the first day and that is completely normal.',
    signupDeadline: isoAt(9, 20, 0),
    costEstimate: { minPerPerson: 38, maxPerPerson: 55, basis: 'Board and wetsuit hire, C Line and the local bus' },
    lifecycle: 'active',
    tags: ['surfing', 'beaches'],
    meetingPoint: 'Expo/Crenshaw station, 7am',
    approved: ['u-tom', 'u-hugo'],
    createdDaysAgo: 6,
  },
  {
    id: 'p-melrose',
    kind: 'plan',
    title: 'Thrifting the length of Melrose',
    destination: 'Melrose Avenue',
    cover: PHOTOS.thriftStore,
    startDate: isoDate(3),
    timeLabel: 'Meeting 12pm',
    capacity: 5,
    hostId: 'u-chloe',
    description:
      'Start at Crossroads on Melrose and work west. There is a Goodwill about halfway that nobody goes into and which is by some distance the best of them. Sign-ups have closed because I am not walking Melrose with more than five people, but I will run it again in a fortnight.',
    signupDeadline: isoAt(-1, 18, 0),
    costEstimate: { minPerPerson: 10, maxPerPerson: 60, basis: 'Bus fare, and whatever you cannot talk yourself out of' },
    lifecycle: 'active',
    tags: ['thrifting', 'photography'],
    meetingPoint: 'Crossroads Trading, 7409 Melrose',
    approved: ['u-yuki', 'u-marta', 'u-camila'],
    createdDaysAgo: 9,
  },
  {
    id: 'p-lafc',
    kind: 'plan',
    title: 'LAFC at BMO Stadium — we can walk there',
    destination: 'BMO Stadium, Exposition Park',
    cover: PHOTOS.concertCrowd,
    startDate: isoDate(13),
    timeLabel: '7:30pm kick-off',
    capacity: 8,
    hostId: 'u-kwame',
    description:
      'Fifteen minutes on foot from campus, which makes it the cheapest live sport any of us will see all semester. North end supporters section, standing the whole match, and it is loud. Tickets have been around $32 for that end. If you have not been to a match here you have been missing the one thing that is genuinely on our doorstep.',
    signupDeadline: isoAt(11, 20, 0),
    costEstimate: { minPerPerson: 32, maxPerPerson: 48, basis: 'Supporters section ticket, walking both ways' },
    lifecycle: 'active',
    tags: ['sports', 'nightlife'],
    meetingPoint: 'Tommy Trojan, 6:45pm',
    approved: ['u-mateo', 'u-rafael', 'u-oskar', 'u-hugo'],
    createdDaysAgo: 4,
  },
  {
    id: 'p-malibu',
    kind: 'plan',
    title: 'Malibu drive to El Matador',
    destination: 'El Matador State Beach',
    cover: PHOTOS.malibuRoad,
    startDate: isoDate(9),
    timeLabel: 'Leaving 2pm',
    capacity: 5,
    hostId: 'u-diego',
    description:
      'Four seats in my car. PCH the whole way with a stop at Point Dume, then El Matador for the last two hours of light — it is the one with the sea caves and the rock arches, and it is worth the stairs down. Parking is $12 which we split. Back by nine.',
    signupDeadline: isoAt(7, 20, 0),
    costEstimate: { minPerPerson: 14, maxPerPerson: 30, basis: 'Fuel and parking split 5 ways, dinner not included' },
    lifecycle: 'active',
    tags: ['road-trips', 'beaches', 'photography'],
    meetingPoint: 'McClintock Ave, outside the parking structure',
    approved: ['u-ana', 'u-sofia', 'u-camila'],
    createdDaysAgo: 5,
  },
  {
    id: 'p-huntington',
    kind: 'plan',
    title: 'The Huntington gardens, all sixteen of them',
    destination: 'San Marino',
    cover: PHOTOS.huntingtonGarden,
    startDate: isoDate(15),
    timeLabel: 'Meeting 10am',
    capacity: 8,
    hostId: 'u-ines',
    description:
      'Student tickets are $25 if you book online in advance and $29 at the gate, so book. The Japanese garden and the desert garden are at opposite ends of the site and both are worth the walk. Take the 81 up Figueroa then the 762 — about seventy-five minutes, so bring something to read.',
    signupDeadline: isoAt(13, 20, 0),
    costEstimate: { minPerPerson: 27, maxPerPerson: 42, basis: 'Advance student ticket, two buses each way, lunch' },
    lifecycle: 'active',
    tags: ['art', 'wellness', 'photography'],
    meetingPoint: 'Figueroa & Exposition, northbound stop',
    approved: ['u-marta', 'u-nadia', 'u-freya'],
    createdDaysAgo: 8,
  },
  {
    id: 'p-disneyland',
    kind: 'plan',
    title: 'Disneyland, the one we keep not doing',
    destination: 'Anaheim',
    cover: PHOTOS.disneylandCastle,
    startDate: isoDate(21),
    timeLabel: 'Rope drop, 7am start',
    capacity: 8,
    hostId: 'u-priya',
    description:
      'This has been talked about since orientation and it is never going to happen unless someone puts a date on it, so here is a date. Metrolink from Union Station to Anaheim then the ART shuttle, about ninety minutes door to door. A single-park ticket on a Tuesday is the cheapest it gets. It is a lot of money and I want everyone to know that before they join rather than after.',
    signupDeadline: isoAt(16, 22, 0),
    costEstimate: { minPerPerson: 128, maxPerPerson: 175, basis: 'Off-peak single-park ticket, Metrolink return, food inside the park' },
    lifecycle: 'active',
    tags: ['film', 'food'],
    meetingPoint: 'Union Station, 6:15am',
    approved: ['u-chloe', 'u-oskar', 'u-emma'],
    createdDaysAgo: 10,
  },
  {
    id: 'p-vista',
    kind: 'plan',
    title: 'Double bill at the Vista, Los Feliz',
    destination: 'Vista Theatre, Los Feliz',
    cover: PHOTOS.cinema,
    startDate: isoDate(12),
    timeLabel: 'From 6:45pm',
    capacity: 10,
    hostId: 'u-oskar',
    description:
      'Single screen, 1923, projected on film, and the whole thing costs less than a multiplex. Two features back to back with a gap in the middle for food on Hillhurst. It is a proper old cinema and it is the sort of thing you will not get around to on your own.',
    signupDeadline: isoAt(10, 20, 0),
    costEstimate: { minPerPerson: 18, maxPerPerson: 38, basis: 'Two tickets, Metro fare, something to eat between films' },
    lifecycle: 'active',
    tags: ['film', 'food'],
    meetingPoint: 'Vermont/Sunset station, 6:15pm',
    approved: ['u-marta', 'u-yuki', 'u-mateo', 'u-priya', 'u-chloe'],
    createdDaysAgo: 6,
  },
  {
    id: 'p-dockweiler',
    kind: 'plan',
    title: 'Bonfire at Dockweiler',
    destination: 'Dockweiler State Beach',
    cover: PHOTOS.beachCleanup,
    startDate: isoDate(14),
    timeLabel: 'From 5pm until they close it',
    capacity: 14,
    hostId: 'u-tom',
    description:
      'One of about three beaches in the county where fires are still legal, and the pits go on a first-come basis, so I am getting there at four to sit on one. Bring firewood if you can carry it, otherwise $10 towards a bundle. Planes come in over your head every ninety seconds, which sounds awful and is somehow the best part.',
    signupDeadline: isoAt(12, 20, 0),
    costEstimate: { minPerPerson: 10, maxPerPerson: 25, basis: 'Firewood and food split, C Line then the 232' },
    lifecycle: 'active',
    tags: ['beaches', 'food', 'live-music'],
    meetingPoint: 'Aviation/LAX station, 4:15pm',
    approved: ['u-liam', 'u-aisling', 'u-mateo', 'u-hugo', 'u-rafael'],
    createdDaysAgo: 3,
  },
  {
    id: 'p-angeles-crest',
    kind: 'plan',
    title: 'Stargazing drive up Angeles Crest',
    destination: 'Angeles National Forest',
    cover: PHOTOS.desertCamp,
    startDate: isoDate(17),
    timeLabel: 'Leaving 8pm, back around 1am',
    capacity: 5,
    hostId: 'u-felix',
    description:
      'Forty-five minutes of switchbacks and you are far enough from the city to see the Milky Way, which you cannot do from anywhere in the basin. I have four seats. It gets to about 4°C at 5,000 feet so this is a coat-and-blanket trip, not a jumper trip. New moon that week, which is the whole reason for that date.',
    signupDeadline: isoAt(15, 20, 0),
    costEstimate: { minPerPerson: 8, maxPerPerson: 18, basis: 'Fuel split 5 ways, bring your own flask' },
    lifecycle: 'active',
    tags: ['photography', 'road-trips', 'wellness'],
    meetingPoint: 'Parkside Apartments, 8pm',
    approved: ['u-lukas', 'u-freya', 'u-nils'],
    createdDaysAgo: 7,
  },
  {
    id: 'p-five-a-side',
    kind: 'plan',
    title: 'Five-a-side at Exposition Park',
    destination: 'Exposition Park',
    cover: PHOTOS.campusLawn,
    startDate: isoDate(5),
    timeLabel: 'Sunday 4pm',
    capacity: 12,
    hostId: 'u-hugo',
    description:
      'Every Sunday on the grass behind the Rose Garden. It is free, it is ten minutes from campus, and we have been playing four-a-side for three weeks because nobody else turns up. All abilities, and I mean that — half of us are bad.',
    signupDeadline: isoAt(4, 14, 0),
    costEstimate: { minPerPerson: 0, maxPerPerson: 0, basis: 'Free. Bring water' },
    lifecycle: 'active',
    tags: ['sports', 'wellness'],
    meetingPoint: 'Rose Garden, south lawn',
    approved: ['u-kwame', 'u-liam', 'u-mateo', 'u-rafael', 'u-oskar', 'u-tom'],
    createdDaysAgo: 2,
  },
  {
    id: 'p-vasquez',
    kind: 'plan',
    title: 'Sunrise at Vasquez Rocks',
    destination: 'Agua Dulce',
    cover: PHOTOS.hikingHills,
    startDate: isoDate(20),
    timeLabel: 'Leaving 4:30am',
    capacity: 6,
    hostId: 'u-lukas',
    description:
      'An hour north, and the light on those tilted slabs at sunrise is the single best photograph you will take this semester. Metrolink Antelope Valley line does not run early enough, so this needs two cars — I have one, we need someone with the other. Back on campus by eleven.',
    signupDeadline: isoAt(18, 20, 0),
    costEstimate: { minPerPerson: 9, maxPerPerson: 20, basis: 'Fuel split, and breakfast in Agua Dulce afterwards' },
    lifecycle: 'active',
    tags: ['photography', 'hiking', 'road-trips'],
    meetingPoint: 'Jefferson & Hoover, 4:30am',
    approved: ['u-jonas', 'u-yuki', 'u-nils'],
    createdDaysAgo: 5,
  },
];

/* ------------------------------------------------------------------ actuals */

const ACTUALS: Record<string, TripActuals> = {
  'q-southwest-loop': {
    reportedBy: 5,
    participantCount: 5,
    hostNote:
      'The rental was the whole story. I am twenty-three so there was no young-driver fee, but the $200 deposit hold sat on my card for eleven days after we got back and two people could not pay me until it cleared. Fuel was worse than I estimated because nobody accounts for the climb up to the South Rim. Everything else came in about right.',
    reportedAt: isoAt(-19, 18, 0),
    lineItems: [
      { label: 'Rental car, 6 days', estimated: 118, actual: 141, note: 'Base rate rose after we extended by half a day' },
      { label: 'Fuel', estimated: 62, actual: 88, note: '1,410 miles, not the 1,200 I planned for' },
      { label: 'Motels, 5 nights', estimated: 145, actual: 138, note: 'Sedona was cheaper midweek than quoted' },
      { label: 'Park entry', estimated: 14, actual: 14, note: '$70 vehicle pass split 5 ways' },
      { label: 'Antelope Canyon tour', estimated: 65, actual: 78, note: 'Only the pricier slot was left by the time we booked' },
      { label: 'Food', estimated: 90, actual: 112, note: 'We ate out more than planned — no kitchen anywhere' },
    ],
  },
  'q-joshua-tree-past': {
    reportedBy: 4,
    participantCount: 6,
    hostNote:
      'Came in almost exactly on estimate, which surprised everyone. The one thing we got wrong was firewood — you cannot collect any in the park and the shop in Twentynine Palms charges $12 a bundle, so budget for that rather than assuming.',
    reportedAt: isoAt(-35, 20, 0),
    lineItems: [
      { label: 'Campsite, 2 nights', estimated: 14, actual: 14, note: '$40 a night across 6 people' },
      { label: 'Fuel', estimated: 22, actual: 19, note: 'Two cars, 260 miles round trip' },
      { label: 'Food and drink', estimated: 45, actual: 41, note: 'One Stater Bros shop on the way out' },
      { label: 'Firewood', estimated: 0, actual: 8, note: 'Nobody costed this and you cannot gather it in the park' },
      { label: 'Park entry', estimated: 5, actual: 5, note: '$30 vehicle pass, two cars, split 6' },
    ],
  },
  'q-san-diego-past': {
    reportedBy: 5,
    participantCount: 5,
    hostNote:
      'The train was $2 cheaper than I quoted because we booked the Saver fare eight days out. Board hire was the only real overrun — the shop wanted a card on file for the security hold and three of us do not have a US card, so we paid the higher no-deposit rate. Worth knowing before you go.',
    reportedAt: isoAt(-13, 19, 0),
    lineItems: [
      { label: 'Amtrak Surfliner, return', estimated: 42, actual: 40, note: 'Saver fare, booked 8 days ahead' },
      { label: 'Hostel, 2 nights', estimated: 58, actual: 58, note: '8-bed dorm in Ocean Beach' },
      { label: 'Board and wetsuit hire', estimated: 30, actual: 45, note: 'No-deposit rate because we had no US card' },
      { label: 'Food', estimated: 40, actual: 47, note: 'Two dinners out rather than one' },
      { label: 'Local transport', estimated: 12, actual: 9, note: 'Trolley day pass, and we walked more than expected' },
    ],
  },
};

/* ------------------------------------------------------------------ assembly */

const ALL_SEED: SeedQuest[] = [...trips, ...plans];

export function buildQuests(): Quest[] {
  return ALL_SEED.map(({ approved: _approved, createdDaysAgo, ...quest }) => ({
    ...quest,
    createdAt: isoAt(-createdDaysAgo, 14, 0),
    actuals: ACTUALS[quest.id],
  }));
}

/**
 * Approved memberships come straight from the seed. Pending requests are then distributed so
 * that every cohort member has one outstanding request somewhere — that is what makes the
 * "you have already asked to join" state reachable no matter which profile you pick.
 */
export function buildMemberships(): Membership[] {
  const memberships: Membership[] = [];

  for (const q of ALL_SEED) {
    for (const userId of q.approved) {
      memberships.push({
        questId: q.id,
        userId,
        state: 'approved',
        requestedAt: isoAt(-(q.createdDaysAgo - 1), 16, 0),
        decidedAt: isoAt(-(q.createdDaysAgo - 1), 20, 0),
      });
    }
  }

  const joinable = ALL_SEED.filter(
    (q) => q.lifecycle === 'active' && new Date(q.signupDeadline).getTime() > Date.now(),
  );

  const REQUEST_NOTES = [
    'I have never been and I would rather not go on my own.',
    'Free that whole day. Happy to drive if you still need a second car.',
    'Two of us if there is room — my flatmate would come as well.',
    'I can bring a tent and a stove if that helps.',
    'Do you know yet whether this works without a US card?',
    'I am under 21, is that a problem for this one?',
    '',
  ];

  COHORT_USERS.forEach((user, i) => {
    const start = (i * 7 + 3) % joinable.length;
    for (let step = 0; step < joinable.length; step += 1) {
      const q = joinable[(start + step) % joinable.length];
      const alreadyIn = q.hostId === user.id || q.approved.includes(user.id);
      const spotsLeft = q.capacity - 1 - q.approved.length;
      if (alreadyIn || spotsLeft <= 0) continue;
      const note = REQUEST_NOTES[(i + step) % REQUEST_NOTES.length];
      memberships.push({
        questId: q.id,
        userId: user.id,
        state: 'requested',
        message: note || undefined,
        requestedAt: isoAt(-((i % 3) + 1), 11 + (i % 8), 0),
      });
      break;
    }
  });

  return memberships;
}
