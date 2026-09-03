import type { PlanFixture } from './types';

export const santaMonica: PlanFixture = {
  ideaSlug: 'santa-monica-beach-day',
  destination: 'Santa Monica',
  researchedDaysAgo: 6,
  confidence: 'high',
  confidenceNote:
    'Bus and pier prices are published and fixed. The only variable is how much you spend on food once you are there.',
  summary:
    'The cheapest good day out from campus and the one that needs the least organising. The Big Blue Bus Rapid 10 runs from near campus straight to Santa Monica for $1.25 and takes about fifty minutes. Everything after that is free unless you decide otherwise.',
  options: [
    {
      id: 'bus-day',
      name: 'Bus there, beach, pier at sunset',
      bestFor: 'The default. No car, no planning, no reason not to.',
      transport: [
        {
          label: 'Big Blue Bus Rapid 10, return',
          provider: 'Santa Monica Big Blue Bus',
          detail:
            'Picks up on Flower Street near campus and runs to 4th and Colorado, two blocks from the pier. About fifty minutes.',
          url: 'https://www.bigbluebus.com/Routes-and-Schedules/Route.aspx?rt=R10',
          basis: 'Return, per person',
          price: { kind: 'per-person', min: 2.5, max: 2.5 },
        },
      ],
      accommodation: [],
      otherCosts: [
        {
          label: 'Food and coffee',
          provider: 'Santa Monica Place food hall, or the pier',
          detail:
            'The pier is priced for tourists. Two blocks inland on Santa Monica Boulevard is half the price for better food.',
          basis: 'Per person, lunch and something in the afternoon',
          price: { kind: 'per-person', min: 12, max: 28 },
        },
        {
          label: 'Pacific Park, if you go on anything',
          provider: 'Pacific Park, Santa Monica Pier',
          detail:
            'The Ferris wheel on its own is $5. An unlimited wristband is $45 and is not worth it for a group that will do three rides.',
          url: 'https://pacpark.com/tickets-and-pricing/',
          basis: 'Per person, two or three rides',
          price: { kind: 'per-person', min: 0, max: 18 },
        },
      ],
    },
    {
      id: 'bike-the-strand',
      name: 'Bus there, then bikes down to Venice',
      bestFor: 'Getting further than the pier, which most people never do',
      transport: [
        {
          label: 'Big Blue Bus Rapid 10, return',
          provider: 'Santa Monica Big Blue Bus',
          detail: 'Same bus.',
          url: 'https://www.bigbluebus.com/Routes-and-Schedules/Route.aspx?rt=R10',
          basis: 'Return, per person',
          price: { kind: 'per-person', min: 2.5, max: 2.5 },
        },
        {
          label: 'Bike hire on the Strand',
          provider: 'Perry’s Café or a beach rental stand',
          detail:
            'Flat, paved, twenty-two miles of it. Santa Monica to Venice and back is about an hour of actual riding.',
          url: 'https://perryscafe.com/rentals/',
          basis: 'Per person, two hours',
          price: { kind: 'per-person', min: 14, max: 22 },
        },
      ],
      accommodation: [],
      otherCosts: [
        {
          label: 'Food',
          provider: 'Venice, Abbot Kinney or the boardwalk',
          detail:
            'Abbot Kinney is a street of expensive shops with two very good and reasonable places to eat on it.',
          basis: 'Per person',
          price: { kind: 'per-person', min: 15, max: 35 },
        },
      ],
    },
  ],
  assumptions: [
    { label: 'Transport', detail: 'The Rapid 10 runs about every twenty minutes on weekends and stops running north around ten in the evening.' },
    { label: 'Season', detail: 'The marine layer usually clears by noon. Mornings on this coast are grey more often than people expect, and the water is about 17°C.' },
    { label: 'Group size', detail: 'Nothing here splits, so the per-head cost is the same whether two of you go or twelve.' },
  ],
  exclusions: [
    'Parking, because this plan does not use a car. If you drive it is $15 to $20 for the day in the pier structures.',
    'Beach chair or umbrella hire, about $25 for the day.',
    'Anything on Third Street Promenade, which is a shopping street rather than a thing to do.',
  ],
  sources: [
    { title: 'Big Blue Bus Rapid 10 timetable', url: 'https://www.bigbluebus.com/Routes-and-Schedules/Route.aspx?rt=R10' },
    { title: 'Pacific Park ticket prices', url: 'https://pacpark.com/tickets-and-pricing/' },
    { title: 'Santa Monica Beach visitor information', url: 'https://www.santamonica.gov/places/beaches' },
  ],
  itinerary: [
    {
      dayOffset: 0,
      label: 'A day at the beach that does not need a car',
      blocks: [
        { time: '10:00', title: 'Rapid 10 from Flower Street', detail: '$1.25, about fifty minutes, and it drops you two blocks from the sand.', place: 'Flower St & Jefferson Blvd' },
        { time: '11:00', title: 'Walk out on the pier first', detail: 'Get it out of the way while it is quiet. The aquarium underneath the pier is $5 and better than it sounds.', place: 'Santa Monica Pier' },
        { time: '12:30', title: 'Lunch two streets inland', detail: 'Anything on the pier costs double. Santa Monica Boulevard between 2nd and 5th is where to go.', place: 'Santa Monica Boulevard' },
        { time: '14:00', title: 'The beach itself', detail: 'North of the pier is quieter and the sand is wider. It is a fifteen-minute walk to get away from the crowd.', place: 'North Beach' },
        { time: '16:30', title: 'Walk south towards Venice', detail: 'Forty minutes along the Strand. Muscle Beach and the skate park are on the way and the skate park at golden hour is the photograph everyone takes here.', place: 'The Strand' },
        { time: '18:00', title: 'Sunset from the pier', detail: 'Back up to the pier for the sun going into the water. The Ferris wheel lights come on about the same time.', place: 'Santa Monica Pier' },
        { time: '19:30', title: 'Last bus back', detail: 'Check the time before you settle in. The Rapid 10 thins out early in the evening and after that it is a $35 rideshare.', place: '4th St & Colorado Ave' },
      ],
    },
  ],
};

export const griffith: PlanFixture = {
  ideaSlug: 'griffith-observatory-night',
  destination: 'Griffith Observatory',
  researchedDaysAgo: 13,
  confidence: 'high',
  confidenceNote:
    'Admission and the shuttle fare are published and have not changed. Only the planetarium show price and the walk timings are estimates.',
  summary:
    'Entry to the building, the exhibits and the roof telescope are all free, which makes this the best value evening in the city. Getting there without a car is the only awkward part, and the DASH Observatory shuttle from Vermont/Sunset solves it for 50 cents.',
  options: [
    {
      id: 'metro-dash',
      name: 'Metro and the Observatory shuttle',
      bestFor: 'Anybody without a car, which is most people',
      transport: [
        {
          label: 'Metro B Line and the DASH shuttle',
          provider: 'LA Metro and LADOT',
          detail:
            'E Line to 7th Street, B Line to Vermont/Sunset, then the DASH Observatory shuttle up the hill. About an hour door to door.',
          url: 'https://www.ladottransit.com/dash/routes/observatory/observatory.html',
          basis: 'Return, per person, including both fares',
          price: { kind: 'per-person', min: 4.5, max: 4.5 },
        },
      ],
      accommodation: [],
      otherCosts: [
        {
          label: 'Admission',
          provider: 'Griffith Observatory',
          detail:
            'The building, every exhibit, the Foucault pendulum and the Zeiss telescope on the roof are free. They have been free since 1935 and the terms of the bequest mean they have to stay that way.',
          url: 'https://griffithobservatory.org/visit/hours-admission-directions/',
          basis: 'Per person',
          price: { kind: 'per-person', min: 0, max: 0 },
        },
        {
          label: 'Planetarium show',
          provider: 'Samuel Oschin Planetarium',
          detail:
            'The one thing that costs money. Tickets are sold at the door on the day only, and the evening shows go.',
          url: 'https://griffithobservatory.org/exhibits/samuel-oschin-planetarium/',
          basis: 'Per person, optional',
          price: { kind: 'per-person', min: 0, max: 10 },
        },
        {
          label: 'Food afterwards',
          provider: 'Los Feliz, at the bottom of the hill',
          detail:
            'The café inside closes early. Hillhurst and Vermont in Los Feliz are ten minutes down and open late.',
          basis: 'Per person',
          price: { kind: 'per-person', min: 0, max: 25 },
        },
      ],
    },
    {
      id: 'hike-up',
      name: 'Walk up from Fern Dell and back down after dark',
      bestFor: 'Making an evening of it, and it costs almost nothing',
      transport: [
        {
          label: 'Metro to Vermont/Sunset',
          provider: 'LA Metro',
          detail: 'Then a fifteen-minute walk to the bottom of the Fern Dell trail.',
          url: 'https://www.metro.net/riding/fares/',
          basis: 'Return, per person',
          price: { kind: 'per-person', min: 3.5, max: 3.5 },
        },
      ],
      accommodation: [],
      otherCosts: [
        {
          label: 'Admission',
          provider: 'Griffith Observatory',
          detail: 'Still free.',
          url: 'https://griffithobservatory.org/visit/hours-admission-directions/',
          basis: 'Per person',
          price: { kind: 'per-person', min: 0, max: 0 },
        },
        {
          label: 'Food in Los Feliz',
          provider: 'Hillhurst Avenue',
          detail: 'You will have earned it. The walk is 1.5 miles up with 500 feet of climb.',
          basis: 'Per person',
          price: { kind: 'per-person', min: 12, max: 30 },
        },
      ],
    },
  ],
  assumptions: [
    { label: 'Opening', detail: 'Closed on Mondays. Open until 10pm Thursday to Sunday, which is when the telescope is worth queuing for.' },
    { label: 'Weather', detail: 'The roof telescope only opens on clear nights, and the marine layer can sit over the hill even when the basin is clear.' },
    { label: 'Timing', detail: 'Arriving an hour before sunset is the whole trick — you get the daylight view, the sunset and the lit city for one trip.' },
  ],
  exclusions: [
    'Parking, which is $10 an hour on the road up and full by four in the afternoon at weekends. This plan avoids it entirely.',
    'The Hollywood sign hike, which starts elsewhere and is a separate three hours.',
    'Dinner, unless you count the Los Feliz line above.',
  ],
  sources: [
    { title: 'Griffith Observatory hours and admission', url: 'https://griffithobservatory.org/visit/hours-admission-directions/' },
    { title: 'DASH Observatory shuttle', url: 'https://www.ladottransit.com/dash/routes/observatory/observatory.html' },
    { title: 'LA Metro fares', url: 'https://www.metro.net/riding/fares/' },
  ],
  itinerary: [
    {
      dayOffset: 0,
      label: 'Up the hill for sunset and stay for the telescope',
      blocks: [
        { time: '16:00', title: 'Leave campus', detail: 'E Line to 7th Street/Metro Center, change to the B Line north. Allow an hour.', place: 'Expo Park/USC station' },
        { time: '17:00', title: 'DASH Observatory shuttle', detail: 'From Vermont/Sunset station. Fifty cents, every twenty minutes, and it saves you a 500-foot climb.', place: 'Vermont/Sunset station' },
        { time: '17:30', title: 'The lawn before sunset', detail: 'Get to the west-facing lawn while there is still light. This is the view of the basin everybody has seen and has not stood in.', place: 'Observatory lawn' },
        { time: '18:15', title: 'Sunset', detail: 'The whole grid comes on underneath you over about twenty minutes. Do not spend it looking at a screen.', place: 'Observatory terrace' },
        { time: '19:00', title: 'Inside — the pendulum and the Tesla coil', detail: 'Free, and the coil demonstration runs a few times an evening. The Gunther Depths of Space hall downstairs is the good one.', place: 'Griffith Observatory' },
        { time: '20:00', title: 'The Zeiss telescope on the roof', detail: 'Free, first come first served, and the queue is thirty to forty-five minutes on a clear night. More people have looked through this telescope than any other on Earth.', place: 'Observatory roof' },
        { time: '21:30', title: 'Down to Los Feliz', detail: 'The last DASH is around ten. Hillhurst Avenue at the bottom is open late.', place: 'Los Feliz' },
      ],
    },
  ],
};

export const lakers: PlanFixture = {
  ideaSlug: 'lakers-game',
  destination: 'Crypto.com Arena, Downtown Los Angeles',
  researchedDaysAgo: 4,
  confidence: 'medium',
  confidenceNote:
    'The Metro fare and the arena’s policies are fixed. Ticket prices move daily on resale and depend entirely on the opponent, so the range is wide and honest.',
  summary:
    'Fifteen minutes from campus on the E Line, which makes this the easiest professional sport any of us can get to. Upper bowl resale settles in the twenty-four hours before tip-off and the difference between buying two weeks out and buying that morning is routinely $40 a seat.',
  options: [
    {
      id: 'upper-bowl',
      name: 'Upper bowl, bought the day before',
      bestFor: 'Seeing a game without it becoming an expensive evening',
      transport: [
        {
          label: 'Metro E Line, return',
          provider: 'LA Metro',
          detail:
            'Expo Park/USC to Pico station, twelve minutes, and the arena is across the road. There is no reason to drive to this.',
          url: 'https://www.metro.net/riding/fares/',
          basis: 'Return, per person',
          price: { kind: 'per-person', min: 3.5, max: 3.5 },
        },
      ],
      accommodation: [],
      otherCosts: [
        {
          label: 'Upper bowl ticket',
          provider: 'Ticketmaster resale or SeatGeek',
          detail:
            'Sections 300 to 334. Against a weak opponent midweek these sit around $35; a Sunday game against a name team is $110 and up for the same seat.',
          url: 'https://www.ticketmaster.com/los-angeles-lakers-tickets/artist/805959',
          basis: 'Per person, resale bought within 48 hours of tip-off',
          price: { kind: 'per-person', min: 35, max: 110 },
        },
        {
          label: 'Food inside the arena',
          provider: 'Crypto.com Arena',
          detail:
            'A beer is $16 and a hot dog is $9. Eating in Little Tokyo or at Grand Central Market beforehand saves most of that.',
          basis: 'Per person, if you buy anything inside',
          price: { kind: 'per-person', min: 0, max: 30 },
        },
      ],
    },
    {
      id: 'lower-bowl',
      name: 'Lower bowl, once, properly',
      bestFor: 'The one game you actually want to see close up',
      transport: [
        {
          label: 'Metro E Line, return',
          provider: 'LA Metro',
          detail: 'Same twelve minutes.',
          url: 'https://www.metro.net/riding/fares/',
          basis: 'Return, per person',
          price: { kind: 'per-person', min: 3.5, max: 3.5 },
        },
      ],
      accommodation: [],
      otherCosts: [
        {
          label: 'Lower bowl ticket',
          provider: 'Ticketmaster resale',
          detail:
            'Sections 101 to 121, corner or baseline. Centre court at this level is several times this and is not worth it.',
          url: 'https://www.ticketmaster.com/los-angeles-lakers-tickets/artist/805959',
          basis: 'Per person, resale',
          price: { kind: 'per-person', min: 130, max: 320 },
        },
        {
          label: 'Dinner in Little Tokyo first',
          provider: 'Little Tokyo, two stops away',
          detail: 'Better and cheaper than anything in the arena, and it is on the way.',
          basis: 'Per person',
          price: { kind: 'per-person', min: 18, max: 35 },
        },
      ],
    },
  ],
  assumptions: [
    { label: 'Ticket pricing', detail: 'Resale, not face value. Prices are quoted after fees, which add roughly 25 per cent and are the reason listed prices look lower than what you pay.' },
    { label: 'Buying together', detail: 'Six seats together in the upper bowl are usually available up to a day out. Beyond that you get split across rows.' },
    { label: 'Entry', detail: 'Mobile ticket only, in a phone wallet. Screenshots are refused at the gate and this catches people out every time.' },
    { label: 'Season', detail: 'The NBA regular season runs from late October to April. Outside that this is not a plan.' },
  ],
  exclusions: [
    'Parking, at $30 to $60 in the arena structures. The E Line makes it pointless.',
    'Merchandise, which is expensive and which everybody buys anyway.',
    'Alcohol, which is 21 and over inside the arena and checked at the counter.',
  ],
  sources: [
    { title: 'Los Angeles Lakers tickets, Ticketmaster', url: 'https://www.ticketmaster.com/los-angeles-lakers-tickets/artist/805959' },
    { title: 'Crypto.com Arena A to Z guide', url: 'https://www.cryptoarena.com/arena-info/a-z-guide' },
    { title: 'LA Metro fares', url: 'https://www.metro.net/riding/fares/' },
  ],
  itinerary: [
    {
      dayOffset: 0,
      label: 'Eat first, then twelve minutes on the train',
      blocks: [
        { time: '17:00', title: 'Buy the tickets together', detail: 'One person buys all of them so the group is not split across four rows. Transfer them in the app before anyone leaves.', place: 'Wherever you are' },
        { time: '17:45', title: 'Eat before you go', detail: 'Grand Central Market or Little Tokyo, both two stops further on. A meal there costs what a hot dog and a drink costs inside.', place: 'Downtown' },
        { time: '18:45', title: 'E Line to Pico', detail: 'Twelve minutes from Expo Park/USC. Doors open ninety minutes before tip-off and the queue at Pico is longest right at seven.', place: 'Expo Park/USC station' },
        { time: '19:10', title: 'In your seats for the anthem', detail: 'The upper bowl fills late. Getting in early gets you the warm-ups, which are more watchable than they sound.', place: 'Crypto.com Arena' },
        { time: '19:30', title: 'Tip-off', detail: 'Two and a half hours including the breaks. The fourth quarter is the only one where the crowd matters.', place: 'Crypto.com Arena' },
        { time: '22:15', title: 'Train back', detail: 'Do not join the crush at Pico immediately. Twenty minutes in the plaza and the platform clears.', place: 'Pico station' },
      ],
    },
  ],
};
