import type { PlanFixture } from './types';

export const newYork: PlanFixture = {
  ideaSlug: 'new-york-thanksgiving',
  destination: 'New York City',
  researchedDaysAgo: 19,
  confidence: 'low',
  confidenceNote:
    'Thanksgiving is the most expensive week of the American year to fly and fares move daily. The flight range below is the widest thing on this page and it is wide because the truth is.',
  summary:
    'The flight is the whole trip. Everything on the ground in New York can be done for $60 a day; the difference between a $520 trip and a $900 one is entirely which week you book the flight in. Fares out of Los Angeles for Thanksgiving climb from about mid-September and do not come back down.',
  options: [
    {
      id: 'budget-fly-airbnb',
      name: 'Budget airline, apartment shared between the group',
      bestFor: 'The cheapest honest version, if you book now',
      transport: [
        {
          label: 'Return flight, LAX to JFK or EWR',
          provider: 'JetBlue, Delta or Spirit',
          detail:
            'Five and a half hours out, about five back. Tuesday and Saturday departures are the cheap ones; Wednesday before Thanksgiving is the single busiest flying day in the country and priced like it.',
          url: 'https://www.google.com/travel/flights',
          basis: 'Return, per person, booked eight or more weeks ahead',
          price: { kind: 'per-person', min: 320, max: 620 },
        },
        {
          label: 'Airport transfers both ends',
          provider: 'FlyAway bus and the AirTrain',
          detail:
            'FlyAway from Union Station to LAX is $9.75. At the other end the AirTrain and subway from JFK is $11 and takes an hour.',
          url: 'https://www.flylax.com/flyaway-bus',
          basis: 'Per person, both ends, both directions',
          price: { kind: 'per-person', min: 42, max: 42 },
        },
        {
          label: 'Subway for the week',
          provider: 'MTA OMNY',
          detail:
            'Tap the same card twelve times in seven days and the rest of the week is free — the fare caps automatically, so there is no pass to buy.',
          url: 'https://www.mta.info/fares',
          basis: 'Per person, capped at the weekly maximum',
          price: { kind: 'per-person', min: 34, max: 34 },
        },
      ],
      accommodation: [
        {
          label: 'Apartment in Bed-Stuy or Bushwick',
          provider: 'Airbnb',
          detail:
            'Twenty-five minutes on the A or the L to Manhattan. A two-bedroom that sleeps five is the sweet spot; anything advertised as sleeping eight is a room with airbeds in it.',
          url: 'https://www.airbnb.com/s/Brooklyn--New-York/homes',
          basis: 'About $240 a night for a flat sleeping 5, {nights} nights, {n} of you',
          price: { kind: 'split', min: 240, max: 340, splitCap: 5 },
          perNight: true,
        },
      ],
      otherCosts: [
        {
          label: 'Food',
          provider: 'Mostly not restaurants',
          detail:
            'A slice is $3.50 and a bagel is $6. Eating like that for half the meals and properly for the other half is about $45 a day.',
          basis: 'Per person, {nights} days',
          price: { kind: 'per-person', min: 38, max: 62 },
          perNight: true,
        },
        {
          label: 'One museum, one view',
          provider: 'The Met, MoMA, Top of the Rock',
          detail:
            'The Met is pay-what-you-wish only for New York State residents — everyone else pays $30. MoMA is free on Friday evenings and the queue reflects that.',
          url: 'https://www.metmuseum.org/visit',
          basis: 'Per person across the trip',
          price: { kind: 'per-person', min: 30, max: 85 },
        },
      ],
    },
    {
      id: 'flexible-fly-hostel',
      name: 'Flexible flight, hostel in Manhattan',
      bestFor: 'Smaller groups, or if you are booking late and the apartment maths stops working',
      transport: [
        {
          label: 'Return flight, LAX to JFK, EWR or LGA',
          provider: 'Delta, American or United',
          detail:
            'Booking a main-cabin fare rather than basic economy costs more but includes a carry-on and lets you change if plans move. Over Thanksgiving that is worth more than usual.',
          url: 'https://www.google.com/travel/flights',
          basis: 'Return, per person',
          price: { kind: 'per-person', min: 420, max: 720 },
        },
        {
          label: 'Airport transfers and subway',
          provider: 'FlyAway, AirTrain, MTA',
          detail: 'Same as above, and the OMNY weekly cap still applies.',
          url: 'https://www.mta.info/fares',
          basis: 'Per person for the trip',
          price: { kind: 'per-person', min: 76, max: 76 },
        },
      ],
      accommodation: [
        {
          label: 'Dorm bed, Upper West Side or Lower East Side',
          provider: 'HI New York City or Q4 Hotel',
          detail:
            'Priced per bed, so it does not care how many of you there are — which is the reason to choose it over an apartment for a group of two or three.',
          url: 'https://www.hiusa.org/find-hostels/new-york/new-york-city',
          basis: 'About $75 a night per bed over Thanksgiving, {nights} nights',
          price: { kind: 'per-person', min: 68, max: 105 },
          perNight: true,
        },
      ],
      otherCosts: [
        {
          label: 'Food',
          provider: 'Mostly not restaurants',
          detail: 'Same maths as above.',
          basis: 'Per person, {nights} days',
          price: { kind: 'per-person', min: 38, max: 62 },
          perNight: true,
        },
        {
          label: 'One museum, one view',
          provider: 'The Met, MoMA, Top of the Rock',
          detail: 'Pick two rather than four; the walking between them is the trip.',
          url: 'https://www.metmuseum.org/visit',
          basis: 'Per person across the trip',
          price: { kind: 'per-person', min: 30, max: 85 },
        },
      ],
    },
  ],
  assumptions: [
    { label: 'Booking window', detail: 'Eight weeks or more before Thanksgiving. Inside four weeks the flight range above is simply wrong and you should assume the top of it or higher.' },
    { label: 'Occupancy', detail: 'The apartment option assumes five sharing a two-bedroom. At three or fewer, the hostel option is cheaper.' },
    { label: 'Weather', detail: 'Around 5°C and it gets dark before half four. This is a coat trip and half the cohort has not packed one.' },
    { label: 'Thanksgiving itself', detail: 'On the day itself a lot of the city is shut and the subway runs a Sunday timetable. It is a good day for the parade and a walk, and a bad day for plans.' },
  ],
  exclusions: [
    'Broadway. Rush tickets are $40 upwards and the digital lotteries are worth entering, but nothing here budgets for it.',
    'Taxis and rideshares, which in Manhattan traffic are slower than the subway as well as more expensive.',
    'Checked bags on a basic economy fare, at $40 each way and easy to forget.',
    'Anything at all on the day itself if you have not checked what is open.',
  ],
  sources: [
    { title: 'Google Flights, LAX to New York', url: 'https://www.google.com/travel/flights' },
    { title: 'MTA fares and the OMNY weekly cap', url: 'https://www.mta.info/fares' },
    { title: 'LAX FlyAway bus', url: 'https://www.flylax.com/flyaway-bus' },
    { title: 'The Met admission policy', url: 'https://www.metmuseum.org/visit' },
  ],
  itinerary: [
    {
      dayOffset: 0,
      label: 'Fly out and get your bearings',
      blocks: [
        { time: '07:00', title: 'FlyAway from Union Station', detail: '$9.75 and about forty minutes. Be at LAX three hours before a Thanksgiving-week departure, not two.', place: 'Union Station' },
        { time: '18:30', title: 'Land at JFK', detail: 'AirTrain to Jamaica, then the E or the J. An hour to Brooklyn.', place: 'JFK' },
        { time: '21:00', title: 'Walk your own neighbourhood', detail: 'Do not go straight to Manhattan on the first night. Eat where you are staying and get the shape of the place.', place: 'Bed-Stuy' },
      ],
    },
    {
      dayOffset: 1,
      label: 'Downtown Manhattan on foot',
      blocks: [
        { time: '09:00', title: 'Staten Island Ferry', detail: 'Free, twenty-five minutes each way, and it goes past the Statue of Liberty. Everything else that gets you that view costs $30.', place: 'Whitehall Terminal' },
        { time: '11:00', title: 'Walk north through the Financial District', detail: 'Up to the Oculus, then Tribeca and Soho. Two hours, and it is the best way to understand how the island is put together.', place: 'Lower Manhattan' },
        { time: '13:30', title: 'Lunch in Chinatown', detail: 'Cheaper than anything else in Manhattan by a wide margin.', place: 'Chinatown' },
        { time: '15:00', title: 'The Brooklyn Bridge, walking east', detail: 'Manhattan to Brooklyn is the right direction — the skyline is behind you and you turn round to it. It is packed; go anyway.', place: 'Brooklyn Bridge' },
        { time: '17:00', title: 'Dumbo at sunset', detail: 'Washington Street for the shot of the bridge framing the Empire State, then Brooklyn Bridge Park along the water.', place: 'Dumbo' },
      ],
    },
    {
      dayOffset: 2,
      label: 'Uptown, the park and a museum',
      blocks: [
        { time: '09:30', title: 'Central Park from the north', detail: 'Enter at 110th and walk south. The northern half has the Ravine and the Loch and almost nobody in it.', place: 'Central Park North' },
        { time: '12:00', title: 'The Met', detail: '$30 for non-residents. Three hours is enough; the Egyptian wing and the American period rooms are the ones to prioritise.', place: 'The Met' },
        { time: '15:30', title: 'Upper West Side and the Hudson', detail: 'Across the park, then Riverside Park for the sun going down over New Jersey.', place: 'Riverside Park' },
        { time: '19:00', title: 'Dinner somewhere unremarkable', detail: 'A neighbourhood restaurant on Amsterdam Avenue. Booking anywhere famous this week is not happening.', place: 'Upper West Side' },
      ],
    },
    {
      dayOffset: 3,
      label: 'Thanksgiving Day, when most of the city is shut',
      blocks: [
        { time: '08:00', title: 'The parade, or deliberately not', detail: 'Central Park West between 75th and 61st. You need to be in place by eight for a view, and it is cold. The alternative is that the rest of the city is emptier than it will ever be again.', place: 'Central Park West' },
        { time: '12:00', title: 'Walk the High Line and Chelsea', detail: 'Open on the day and quiet. Chelsea Market next to it is one of the few things reliably open.', place: 'The High Line' },
        { time: '16:00', title: 'Cook where you are staying', detail: 'Almost every restaurant is closed and the ones that are open are doing a $95 set menu. Buy food on Wednesday.', place: 'Bed-Stuy' },
      ],
    },
    {
      dayOffset: 4,
      label: 'Brooklyn, and the flight home',
      blocks: [
        { time: '10:00', title: 'Williamsburg and Bushwick', detail: 'The murals along Troutman Street, then the vintage shops on Bedford. Better on a Friday than a weekend.', place: 'Williamsburg' },
        { time: '13:00', title: 'Last lunch', detail: 'Somewhere in Greenpoint or Bushwick rather than Manhattan.', place: 'Greenpoint' },
        { time: '16:00', title: 'To the airport', detail: 'Two and a half hours before a domestic flight, plus an hour to get there. The Sunday after Thanksgiving is worse; Friday is manageable.', place: 'JFK' },
      ],
    },
  ],
};
