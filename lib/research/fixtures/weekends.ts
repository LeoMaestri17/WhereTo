import type { PlanFixture } from './types';

export const joshuaTree: PlanFixture = {
  ideaSlug: 'joshua-tree-weekend',
  destination: 'Joshua Tree National Park',
  researchedDaysAgo: 16,
  confidence: 'high',
  confidenceNote:
    'Campground fees and park entry are fixed and published. Fuel and food are estimates from a 260-mile round trip and one supermarket shop.',
  summary:
    'Two hours and forty minutes each way, and the cheapest weekend away from Los Angeles by a wide margin — camping inside the park is $25 a night for a whole site. The catch is that there is no public transport inside the park, so the entire trip stands or falls on somebody having a car.',
  summaryNoCar:
    'Getting to Joshua Tree without a car is possible and getting around it is not. The Morongo Basin Transit Authority runs a real bus into the village, but the park itself has no shuttle, no taxis at the trailheads and no phone signal, and Hidden Valley is nine miles from the nearest bus stop. The carless version below is a good weekend in the town rather than in the park, and it is worth being clear about that before you book.',
  options: [
    {
      id: 'camp-own-car',
      name: 'Camping, one car between the group',
      bestFor: 'The cheapest version, if somebody already has a car',
      requiresDriver: true,
      transport: [
        {
          label: 'Fuel, round trip',
          provider: 'Interstate 10 east',
          detail: '260 miles there and back from University Park, roughly 28mpg on a small petrol car',
          basis: 'One car carrying {n} people, at $4.85 a gallon',
          price: { kind: 'split', min: 42, max: 56, splitCap: 5 },
        },
      ],
      accommodation: [
        {
          label: 'Black Rock Campground',
          provider: 'National Park Service',
          detail:
            'Tent site with water and flush toilets, on the north-west edge of the park. Reservable up to six months out and it does sell out for weekends.',
          url: 'https://www.nps.gov/jotr/planyourvisit/campgrounds.htm',
          basis: '$25 a night for the whole site, {nights} nights, up to 6 people per site',
          price: { kind: 'split', min: 25, max: 25, splitCap: 6 },
          perNight: true,
        },
      ],
      otherCosts: [
        {
          label: 'Park entry',
          provider: 'National Park Service',
          detail: 'Seven-day vehicle pass. One pass covers everyone in the car.',
          url: 'https://www.nps.gov/jotr/planyourvisit/fees.htm',
          basis: '$30 per vehicle, split across the {n} of you',
          price: { kind: 'split', min: 30, max: 30, splitCap: 5 },
        },
        {
          label: 'Food for the weekend',
          provider: 'Stater Bros, Yucca Valley',
          detail:
            'One shop on the way in. There is nothing to buy inside the park and the village shops close early.',
          basis: 'Per person, cooking two dinners and two breakfasts on a camp stove',
          price: { kind: 'per-person', min: 32, max: 48 },
        },
        {
          label: 'Firewood and water',
          provider: 'Park Rock Cafe or the village hardware shop',
          detail:
            'You cannot gather wood in the park and there is no potable water at most campgrounds. Everybody forgets both.',
          basis: 'Two bundles and four gallons, split {n} ways',
          price: { kind: 'split', min: 32, max: 44, splitCap: 6 },
        },
      ],
    },
    {
      id: 'camp-rental',
      name: 'Camping, with a rental car',
      bestFor: 'When nobody in the group owns a car but somebody is 21 or over',
      requiresDriver: true,
      requiresOver21: true,
      providesVehicle: true,
      transport: [
        {
          label: 'Rental car, 3 days',
          provider: 'Enterprise, Figueroa & Adams',
          detail:
            'A compact from the branch fifteen minutes from campus. Friday afternoon to Sunday evening.',
          url: 'https://www.enterprise.com/en/car-rental-locations/us/ca/los-angeles.html',
          basis: 'Base rate for 3 days, split across the {n} of you',
          price: { kind: 'split', min: 132, max: 186, splitCap: 5 },
        },
        {
          label: 'Young driver surcharge',
          provider: 'Enterprise',
          detail:
            'Charged on every rental where the named driver is 21 to 24. It is per day, and it is not shown in the headline price on any comparison site.',
          basis: '$25 a day for 3 days, split {n} ways',
          price: { kind: 'split', min: 75, max: 105, splitCap: 5 },
        },
        {
          label: 'Fuel',
          provider: 'Interstate 10 east',
          detail: '260 miles round trip',
          basis: 'One car carrying {n} people',
          price: { kind: 'split', min: 42, max: 56, splitCap: 5 },
        },
      ],
      accommodation: [
        {
          label: 'Black Rock Campground',
          provider: 'National Park Service',
          detail: 'Same site as the option above.',
          url: 'https://www.nps.gov/jotr/planyourvisit/campgrounds.htm',
          basis: '$25 a night for the site, {nights} nights, up to 6 people',
          price: { kind: 'split', min: 25, max: 25, splitCap: 6 },
          perNight: true,
        },
      ],
      otherCosts: [
        {
          label: 'Park entry',
          provider: 'National Park Service',
          detail: 'Seven-day vehicle pass.',
          url: 'https://www.nps.gov/jotr/planyourvisit/fees.htm',
          basis: '$30 per vehicle, split {n} ways',
          price: { kind: 'split', min: 30, max: 30, splitCap: 5 },
        },
        {
          label: 'Food for the weekend',
          provider: 'Stater Bros, Yucca Valley',
          detail: 'One shop on the way in.',
          basis: 'Per person',
          price: { kind: 'per-person', min: 32, max: 48 },
        },
      ],
    },
    {
      id: 'cabin',
      name: 'A cabin in Yucca Valley',
      bestFor: 'Groups who would rather not sleep at 4°C in a tent',
      requiresDriver: true,
      transport: [
        {
          label: 'Fuel, round trip',
          provider: 'Interstate 10 east',
          detail: '260 miles there and back, plus running in and out of the park each day',
          basis: 'One car carrying {n} people',
          price: { kind: 'split', min: 52, max: 68, splitCap: 5 },
        },
      ],
      accommodation: [
        {
          label: 'Two-bedroom desert cabin',
          provider: 'Airbnb, Yucca Valley',
          detail:
            'The stretch between Yucca Valley and Joshua Tree village is full of these. Twenty minutes from the west entrance.',
          url: 'https://www.airbnb.com/s/Yucca-Valley--California/homes',
          basis: 'About $185 a night before cleaning, {nights} nights, sleeps 6',
          price: { kind: 'split', min: 185, max: 240, splitCap: 6 },
          perNight: true,
        },
      ],
      otherCosts: [
        {
          label: 'Park entry',
          provider: 'National Park Service',
          detail: 'Seven-day vehicle pass.',
          url: 'https://www.nps.gov/jotr/planyourvisit/fees.htm',
          basis: '$30 per vehicle, split {n} ways',
          price: { kind: 'split', min: 30, max: 30, splitCap: 5 },
        },
        {
          label: 'Food and one dinner out',
          provider: 'Pappy & Harriet’s, Pioneertown',
          detail:
            'Worth the twenty-minute drive. No bookings for walk-ins, so get there before seven or wait an hour.',
          url: 'https://pappyandharriets.com/',
          basis: 'Per person, one dinner out and the rest cooked',
          price: { kind: 'per-person', min: 48, max: 72 },
        },
      ],
    },
    {
      id: 'no-car-village',
      name: 'By bus, staying in the village',
      bestFor: 'Groups with nobody who can drive — honest about what it does and does not get you',
      transport: [
        {
          label: 'Coach to Palm Springs',
          provider: 'FlixBus',
          detail:
            'Union Station to Palm Springs, about two and a half hours. Book a week out for the low fare.',
          url: 'https://www.flixbus.com/',
          basis: 'Return, per person',
          price: { kind: 'per-person', min: 34, max: 58 },
        },
        {
          label: 'Bus into Joshua Tree village',
          provider: 'Morongo Basin Transit Authority, Route 12',
          detail:
            'Palm Springs to Yucca Valley and on to Joshua Tree village. Runs a handful of times a day and not at all late in the evening, so the timetable dictates the trip.',
          url: 'https://mbtabus.com/',
          basis: 'Return, per person',
          price: { kind: 'per-person', min: 12, max: 12 },
        },
        {
          label: 'Getting to the trailheads',
          provider: 'Local taxi or a lift from the hostel',
          detail:
            'There is no transport inside the park at all. Hidden Valley is nine miles past the entrance and rideshare drivers will not take you out there and wait.',
          basis: 'Two trips into the park across the weekend, split {n} ways',
          price: { kind: 'split', min: 120, max: 190, splitCap: 4 },
        },
      ],
      accommodation: [
        {
          label: 'Bed in the village',
          provider: 'Harmony Motel or a village guesthouse',
          detail: 'Walking distance to the shops, the bus stop and two decent places to eat.',
          url: 'https://www.harmonymotel.com/',
          basis: 'About $120 a night for a twin room, {nights} nights',
          price: { kind: 'split', min: 120, max: 165, splitCap: 2 },
          perNight: true,
        },
      ],
      otherCosts: [
        {
          label: 'Park entry on foot',
          provider: 'National Park Service',
          detail: 'The per-person rate applies when you are not in a vehicle.',
          url: 'https://www.nps.gov/jotr/planyourvisit/fees.htm',
          basis: '$15 per person, seven-day pass',
          price: { kind: 'per-person', min: 15, max: 15 },
        },
        {
          label: 'Food',
          provider: 'Joshua Tree village',
          detail: 'Three places worth eating at and a small grocery. Everything shuts by nine.',
          basis: 'Per person for the weekend',
          price: { kind: 'per-person', min: 55, max: 85 },
        },
      ],
    },
  ],
  assumptions: [
    { label: 'Occupancy', detail: 'One campsite holds six people and one car seats five. Costs that split are divided by the smaller of your group size and that cap.' },
    { label: 'Fuel price', detail: '$4.85 a gallon, which is roughly the Los Angeles average, and 28mpg.' },
    { label: 'Season', detail: 'Autumn and spring. Daytime around 24°C, nights down to 4°C, and July would be a different and much worse trip.' },
    { label: 'Booking window', detail: 'Campsites go about six weeks out for a weekend. This is the one thing worth booking early.' },
  ],
  exclusions: [
    'Camping gear. Tent, sleeping mat and a stove between the group, borrowed or bought.',
    'Anything bought inside the park, because there is nothing to buy.',
    'Climbing gear or a guide, if that is why you are going.',
    'The cost of getting to and from Union Station at either end.',
  ],
  sources: [
    { title: 'Joshua Tree camping and fees, National Park Service', url: 'https://www.nps.gov/jotr/planyourvisit/campgrounds.htm' },
    { title: 'Morongo Basin Transit Authority timetables', url: 'https://mbtabus.com/' },
    { title: 'Recreation.gov campground reservations', url: 'https://www.recreation.gov/' },
  ],
  itinerary: [
    {
      dayOffset: 0,
      label: 'Drive out and get the tent up before dark',
      blocks: [
        { time: '15:00', title: 'Leave Los Angeles', detail: 'Anything later than four and you are in traffic on the 10 through San Bernardino for an extra hour.', place: 'University Park' },
        { time: '17:15', title: 'Shop in Yucca Valley', detail: 'Stater Bros on Twentynine Palms Highway. Water, firewood and everything for two dinners — the last chance to buy anything.', place: 'Yucca Valley' },
        { time: '18:15', title: 'Set up at Black Rock', detail: 'Pitch while there is still light. The site has flush toilets and drinking water, which most of the park’s campgrounds do not.', place: 'Black Rock Campground' },
        { time: '20:30', title: 'Stars', detail: 'It is a dark sky park and the difference from anywhere in the basin is not subtle. Give your eyes twenty minutes and stop looking at your phone.', place: 'The campsite' },
      ],
    },
    {
      dayOffset: 1,
      label: 'The full length of the park',
      blocks: [
        { time: '07:30', title: 'Hidden Valley loop', detail: 'A mile round, enclosed by rock on all sides. Do it early, it is the busiest trailhead in the park by ten.', place: 'Hidden Valley' },
        { time: '09:30', title: 'Scramble at Jumbo Rocks', detail: 'No route, no marked path. Park at Skull Rock and climb whatever looks climbable.', place: 'Jumbo Rocks' },
        { time: '12:00', title: 'Lunch out of the boot', detail: 'Shade is scarce; the picnic area at Live Oak is the exception.', place: 'Live Oak' },
        { time: '14:00', title: 'Cholla Cactus Garden', detail: 'Twenty minutes of boardwalk through a quarter of a million cholla. Do not touch anything.', place: 'Pinto Basin Road' },
        { time: '16:30', title: 'Keys View for sunset', detail: 'The whole Coachella Valley and the San Andreas Fault laid out below. It is a 5,185-foot lookout and it is cold up there.', place: 'Keys View' },
        { time: '19:00', title: 'Cook at the site', detail: 'One pot, whatever you bought. Firewood on afterwards.', place: 'Black Rock Campground' },
      ],
    },
    {
      dayOffset: 2,
      label: 'Barker Dam and back down the 10',
      blocks: [
        { time: '08:00', title: 'Pack up', detail: 'Checkout is eleven but the queue for the dump station is not worth joining late.', place: 'Black Rock Campground' },
        { time: '09:00', title: 'Barker Dam loop', detail: 'A mile and a half past petroglyphs to a dam the cattle ranchers built. Water in it only after rain.', place: 'Barker Dam' },
        { time: '11:30', title: 'Coffee in the village', detail: 'Joshua Tree Coffee Company on the highway, then the last of the shops.', place: 'Joshua Tree village' },
        { time: '13:00', title: 'Drive back', detail: 'Two and a half hours if you leave by one, three and a half if you leave at three.', place: 'Interstate 10 west' },
      ],
    },
  ],
  itineraryNoCar: [
    {
      dayOffset: 0,
      label: 'Coach out, and the timetable decides everything',
      blocks: [
        { time: '13:00', title: 'FlixBus from Union Station', detail: 'Two and a half hours to Palm Springs. There are only a few departures a day, so this time is not really negotiable.', place: 'Union Station' },
        { time: '16:00', title: 'Route 12 up the hill', detail: 'Morongo Basin Transit to Joshua Tree village. Check the last departure now — it is early, and missing it means a $90 taxi.', place: 'Palm Springs Transit Center' },
        { time: '17:30', title: 'Check in and walk the village', detail: 'The whole of it is four blocks. That is not a criticism.', place: 'Joshua Tree village' },
        { time: '19:30', title: 'Dinner at the Natural Sisters or Crossroads', detail: 'Both walkable, both shut by nine.', place: 'Twentynine Palms Highway' },
      ],
    },
    {
      dayOffset: 1,
      label: 'One arranged trip into the park',
      blocks: [
        { time: '08:00', title: 'Taxi to the west entrance', detail: 'Booked the night before. This is the part that costs money and there is no way around it — nine miles, no bus, no rideshare coverage at the trailheads.', place: 'Park Boulevard' },
        { time: '09:00', title: 'Hidden Valley and Barker Dam', detail: 'Both trailheads are within two miles of each other, which is why they are the pair to do on foot.', place: 'Hidden Valley' },
        { time: '13:00', title: 'Ryan Mountain if legs allow', detail: 'Three miles, a thousand feet up, and the best single view you can reach without a car waiting.', place: 'Ryan Mountain' },
        { time: '16:00', title: 'Arranged pickup', detail: 'Agree the time in the morning. There is no signal at the trailhead to call anyone from.', place: 'Park Boulevard' },
        { time: '19:00', title: 'Pappy & Harriet’s, if you can get a lift', detail: 'Twenty minutes away in Pioneertown and worth arranging. Otherwise the village is fine.', place: 'Pioneertown' },
      ],
    },
    {
      dayOffset: 2,
      label: 'Village morning, then the long way home',
      blocks: [
        { time: '09:00', title: 'Coffee and the Sunday market', detail: 'Joshua Tree Coffee Company, then whatever is set up along the highway.', place: 'Joshua Tree village' },
        { time: '11:00', title: 'Noah Purifoy Outdoor Desert Art Museum', detail: 'Ten acres of sculpture made from salvage, free, and a twenty-minute walk plus a short taxi from the village. The best thing here that is not the park.', place: 'Blair Lane' },
        { time: '14:00', title: 'Route 12 back down', detail: 'Allow an hour of slack. Missing the connection at Palm Springs costs you the evening.', place: 'Joshua Tree village' },
        { time: '17:30', title: 'FlixBus to Los Angeles', detail: 'Back at Union Station around eight.', place: 'Palm Springs Transit Center' },
      ],
    },
  ],
};

export const zion: PlanFixture = {
  ideaSlug: 'zion-weekend',
  destination: 'Zion National Park, Utah',
  researchedDaysAgo: 22,
  confidence: 'medium',
  confidenceNote:
    'Park fees and the shuttle are fixed. Springdale room rates move a lot week to week, so the accommodation range is wide on purpose.',
  summary:
    'Six and a half hours of driving each way, which is the whole reason this trip does not happen by accident. Do it as two nights with a Thursday-evening departure and you get two full days in the canyon; do it Friday-to-Sunday and you get one, and you will have driven thirteen hours for it.',
  summaryNoCar:
    'There is no way to reach Zion from Los Angeles without a vehicle for at least part of it. The realistic carless version is a coach to St George and a shuttle into Springdale, which works but adds about $70 a head and ties you to two departures a day. Once you are in Springdale the park’s own shuttle covers the canyon, so the carless problem is entirely about getting there.',
  options: [
    {
      id: 'drive-motel',
      name: 'Drive, two nights in Springdale',
      bestFor: 'The standard version, and the one most groups end up doing',
      requiresDriver: true,
      transport: [
        {
          label: 'Fuel, round trip',
          provider: 'Interstate 15 north',
          detail: '860 miles there and back through Las Vegas and St George',
          basis: 'One car carrying {n} people at 28mpg and $4.60 a gallon on the I-15',
          price: { kind: 'split', min: 140, max: 165, splitCap: 5 },
        },
      ],
      accommodation: [
        {
          label: 'Zion Park Motel, Springdale',
          provider: 'Zion Park Motel',
          detail:
            'Five minutes’ walk from the park shuttle stop, which matters more than anything else about a Springdale room.',
          url: 'https://www.zionparkmotel.com/',
          basis: 'Two rooms at about $145 a night, {nights} nights, {n} of you sharing',
          price: { kind: 'split', min: 145, max: 195, splitCap: 3 },
          perNight: true,
        },
      ],
      otherCosts: [
        {
          label: 'Park entry',
          provider: 'National Park Service',
          detail: 'Seven-day vehicle pass, covers everyone in the car.',
          url: 'https://www.nps.gov/zion/planyourvisit/fees.htm',
          basis: '$35 per vehicle, split {n} ways',
          price: { kind: 'split', min: 35, max: 35, splitCap: 5 },
        },
        {
          label: 'Angels Landing permit lottery',
          provider: 'Recreation.gov',
          detail:
            'You cannot walk the chains section without one. The seasonal lottery is $6 to enter plus $3 a head if you win, and roughly a third of applications succeed.',
          url: 'https://www.nps.gov/zion/planyourvisit/angels-landing-hiking-permits.htm',
          basis: 'Per person, whether or not you win',
          price: { kind: 'per-person', min: 6, max: 9 },
        },
        {
          label: 'Food',
          provider: 'Springdale and a shop in St George',
          detail:
            'Springdale is a tourist strip and priced like one. Stopping at a supermarket in St George for breakfasts and lunches saves about $40 a head.',
          basis: 'Per person, two dinners out and the rest bought in',
          price: { kind: 'per-person', min: 65, max: 95 },
        },
      ],
    },
    {
      id: 'drive-camp',
      name: 'Drive and camp at Watchman',
      bestFor: 'Cutting the biggest cost, if the forecast is dry',
      requiresDriver: true,
      transport: [
        {
          label: 'Fuel, round trip',
          provider: 'Interstate 15 north',
          detail: '860 miles there and back',
          basis: 'One car carrying {n} people',
          price: { kind: 'split', min: 140, max: 165, splitCap: 5 },
        },
      ],
      accommodation: [
        {
          label: 'Watchman Campground',
          provider: 'National Park Service',
          detail:
            'Inside the park, walking distance to the visitor centre and the first shuttle stop. Reservable six months ahead and it goes.',
          url: 'https://www.nps.gov/zion/planyourvisit/watchman-campground.htm',
          basis: '$30 a night per site, {nights} nights, up to 6 per site',
          price: { kind: 'split', min: 30, max: 30, splitCap: 6 },
          perNight: true,
        },
      ],
      otherCosts: [
        {
          label: 'Park entry',
          provider: 'National Park Service',
          detail: 'Seven-day vehicle pass.',
          url: 'https://www.nps.gov/zion/planyourvisit/fees.htm',
          basis: '$35 per vehicle, split {n} ways',
          price: { kind: 'split', min: 35, max: 35, splitCap: 5 },
        },
        {
          label: 'Food',
          provider: 'Supermarket in St George',
          detail: 'Cooking everything on a stove. Springdale for one dinner at the end.',
          basis: 'Per person',
          price: { kind: 'per-person', min: 42, max: 62 },
        },
      ],
    },
    {
      id: 'coach-shuttle',
      name: 'Coach to St George, shuttle into Springdale',
      bestFor: 'Groups with no driver at all',
      transport: [
        {
          label: 'Coach to St George',
          provider: 'FlixBus or Greyhound',
          detail:
            'Union Station to St George, about eight and a half hours with a change in Las Vegas. Two departures a day.',
          url: 'https://www.flixbus.com/',
          basis: 'Return, per person, booked ten days out',
          price: { kind: 'per-person', min: 96, max: 148 },
        },
        {
          label: 'St George to Springdale shuttle',
          provider: 'St George Shuttle',
          detail: 'An hour, booked ahead, and the only scheduled service that covers this leg.',
          url: 'https://stgshuttle.com/',
          basis: 'Return, per person',
          price: { kind: 'per-person', min: 70, max: 70 },
        },
        {
          label: 'Zion Canyon shuttle',
          provider: 'National Park Service',
          detail:
            'Free, and mandatory for most of the year — the canyon road is closed to private cars, which is the one way being carless costs you nothing.',
          url: 'https://www.nps.gov/zion/planyourvisit/zion-canyon-shuttle-system.htm',
          basis: 'Included in park entry',
          price: { kind: 'per-person', min: 0, max: 0 },
        },
      ],
      accommodation: [
        {
          label: 'Zion Park Motel, Springdale',
          provider: 'Zion Park Motel',
          detail: 'Walking distance to the shuttle stop, which is the whole point without a car.',
          url: 'https://www.zionparkmotel.com/',
          basis: 'Two rooms at about $145 a night, {nights} nights',
          price: { kind: 'split', min: 145, max: 195, splitCap: 3 },
          perNight: true,
        },
      ],
      otherCosts: [
        {
          label: 'Park entry on foot',
          provider: 'National Park Service',
          detail: 'The per-person rate rather than the vehicle rate.',
          url: 'https://www.nps.gov/zion/planyourvisit/fees.htm',
          basis: '$20 per person, seven-day pass',
          price: { kind: 'per-person', min: 20, max: 20 },
        },
        {
          label: 'Food',
          provider: 'Springdale',
          detail: 'No supermarket stop on the way, so everything is bought at Springdale prices.',
          basis: 'Per person',
          price: { kind: 'per-person', min: 85, max: 120 },
        },
      ],
    },
  ],
  assumptions: [
    { label: 'Occupancy', detail: 'Motel rooms are costed as two rooms with three sharing each. A group of two pays a lot more per head than a group of six.' },
    { label: 'Nights', detail: 'Two nights with a Thursday-evening departure. A Friday departure gives you one day in the canyon, not two.' },
    { label: 'Shuttle season', detail: 'The canyon shuttle runs roughly March to November and the road is closed to cars while it does. Outside that you drive the canyon yourself.' },
    { label: 'Fuel', detail: '$4.60 a gallon averaged across California and Utah, at 28mpg.' },
  ],
  exclusions: [
    'The Narrows. Dry-suit and canyoneering boot hire is $45 to $60 a day on top, and in autumn you want it.',
    'Any second driver on a rental, which most companies charge for.',
    'The Angels Landing permit if you do not win the lottery — there is no way to buy one.',
    'Meals on the drive itself, which for thirteen hours of road is not nothing.',
  ],
  sources: [
    { title: 'Zion fees and passes, National Park Service', url: 'https://www.nps.gov/zion/planyourvisit/fees.htm' },
    { title: 'Angels Landing permits', url: 'https://www.nps.gov/zion/planyourvisit/angels-landing-hiking-permits.htm' },
    { title: 'Zion Canyon shuttle system', url: 'https://www.nps.gov/zion/planyourvisit/zion-canyon-shuttle-system.htm' },
    { title: 'St George Shuttle timetables and fares', url: 'https://stgshuttle.com/' },
  ],
  itinerary: [
    {
      dayOffset: 0,
      label: 'Drive through the night and wake up in the canyon',
      blocks: [
        { time: '17:00', title: 'Leave after class', detail: 'Out of Los Angeles before six or you lose an hour to the 15 through the Cajon Pass.', place: 'University Park' },
        { time: '21:00', title: 'Stop in Las Vegas', detail: 'Fuel and food. It is the halfway point and the last place open late.', place: 'Las Vegas' },
        { time: '00:30', title: 'Arrive Springdale', detail: 'Six and a half hours with two stops. Tell the motel you are checking in late.', place: 'Springdale' },
      ],
    },
    {
      dayOffset: 1,
      label: 'The canyon floor, top to bottom',
      blocks: [
        { time: '06:30', title: 'First shuttle', detail: 'The queue at the visitor centre is thirty minutes long by eight and an hour by nine. This is the single best decision of the trip.', place: 'Zion Canyon Visitor Center' },
        { time: '07:15', title: 'Angels Landing, if the permit came through', detail: 'Five and a half miles, 1,500 feet, and half a mile of chain-assisted scramble along an exposed ridge. If heights are a problem, get off at Scout Lookout — that is where the view is anyway.', place: 'The Grotto' },
        { time: '07:15', title: 'Observation Point via East Mesa, if it did not', detail: 'Seven miles, almost flat, and it looks down on Angels Landing. Needs a taxi to the East Mesa trailhead, about $40 for the car.', place: 'East Mesa trailhead' },
        { time: '13:30', title: 'Lunch at Zion Lodge lawn', detail: 'The only food inside the canyon. Sit on the grass under the cottonwoods.', place: 'Zion Lodge' },
        { time: '15:00', title: 'Riverside Walk to the mouth of the Narrows', detail: 'Two miles, paved, and it ends where the canyon closes to twenty feet wide. Going further needs a dry suit.', place: 'Temple of Sinawava' },
        { time: '19:00', title: 'Dinner in Springdale', detail: 'Everything on the strip stops serving by nine.', place: 'Springdale' },
      ],
    },
    {
      dayOffset: 2,
      label: 'Short walk, long drive',
      blocks: [
        { time: '07:00', title: 'Watchman Trail', detail: 'Three miles round from the visitor centre, an hour and a half, and the best light of the day on the west temples.', place: 'Zion Canyon Visitor Center' },
        { time: '10:00', title: 'Check out and go', detail: 'Anything later than eleven and you are driving the last two hours in the dark.', place: 'Springdale' },
        { time: '13:00', title: 'Stop at Valley of Fire', detail: 'Fifty minutes off the 15 north of Las Vegas and worth every one of them if you have the daylight.', place: 'Valley of Fire State Park' },
        { time: '19:30', title: 'Back in Los Angeles', detail: 'Six and a half hours plus whatever the 15 does to you south of Barstow.', place: 'University Park' },
      ],
    },
  ],
};

export const sanDiego: PlanFixture = {
  ideaSlug: 'san-diego-weekend',
  destination: 'San Diego',
  researchedDaysAgo: 11,
  confidence: 'high',
  confidenceNote:
    'Amtrak fares and hostel rates are published and stable. The only soft number is food, which depends entirely on how much of it you buy at the beach.',
  summary:
    'The best weekend on this list for anybody without a car, and it is not close. The Pacific Surfliner runs from Union Station along the water for the last hour, San Diego has a trolley that actually goes where you want, and nothing in the whole trip requires a licence, a credit card or being 21.',
  options: [
    {
      id: 'train-hostel',
      name: 'Train down, hostel in Little Italy',
      bestFor: 'The default, and the cheapest way to do it properly',
      transport: [
        {
          label: 'Pacific Surfliner, return',
          provider: 'Amtrak',
          detail:
            'Two hours fifty each way from Union Station. Book the Saver fare seven days out; the walk-up fare is nearly double.',
          url: 'https://www.amtrak.com/pacific-surfliner-train',
          basis: 'Return, per person, Saver fare booked a week ahead',
          price: { kind: 'per-person', min: 38, max: 62 },
        },
        {
          label: 'Trolley day passes',
          provider: 'San Diego MTS',
          detail:
            'Covers the trolley and every bus. The Blue Line runs from downtown to the border and the Green Line to Old Town.',
          url: 'https://www.sdmts.com/fares',
          basis: '$6 a day, {nights} days',
          price: { kind: 'per-person', min: 6, max: 6 },
          perNight: true,
        },
      ],
      accommodation: [
        {
          label: 'Bed in an eight-share dorm',
          provider: 'HI San Diego Downtown or ITH Beach Bungalow',
          detail:
            'Little Italy and Ocean Beach respectively. The downtown one is better placed for the trolley; the beach one is better placed for everything else.',
          url: 'https://www.hiusa.org/find-hostels/',
          basis: 'About $46 a night per bed, {nights} nights',
          price: { kind: 'per-person', min: 42, max: 58 },
          perNight: true,
        },
      ],
      otherCosts: [
        {
          label: 'Food',
          provider: 'Little Italy, Barrio Logan and the beach',
          detail:
            'Two dinners, two breakfasts and as many fish tacos as the weekend can hold. Las Cuatro Milpas in Barrio Logan is worth the queue and takes cash only.',
          basis: 'Per person for the weekend',
          price: { kind: 'per-person', min: 55, max: 95 },
        },
        {
          label: 'Balboa Park museums',
          provider: 'Balboa Park',
          detail:
            'The gardens, the Botanical Building and the architecture are free. Individual museums are $15 to $25 each, and residents get in free on rotating Tuesdays.',
          url: 'https://balboapark.org/',
          basis: 'Per person, assuming one museum',
          price: { kind: 'per-person', min: 0, max: 25 },
        },
      ],
    },
    {
      id: 'train-surf',
      name: 'Train down, and two mornings in the water',
      bestFor: 'Anybody who came to California to surf and has not yet',
      transport: [
        {
          label: 'Pacific Surfliner, return',
          provider: 'Amtrak',
          detail: 'Same train. Get off at Solana Beach on the way back for an afternoon if you have time.',
          url: 'https://www.amtrak.com/pacific-surfliner-train',
          basis: 'Return, per person',
          price: { kind: 'per-person', min: 38, max: 62 },
        },
        {
          label: 'Buses in Ocean Beach and Pacific Beach',
          provider: 'San Diego MTS',
          detail: 'The 35 and the 8 cover the whole beach strip.',
          url: 'https://www.sdmts.com/fares',
          basis: '$6 a day, {nights} days',
          price: { kind: 'per-person', min: 6, max: 6 },
          perNight: true,
        },
      ],
      accommodation: [
        {
          label: 'Bed in a beach hostel dorm',
          provider: 'ITH Beach Bungalow, Ocean Beach',
          detail: 'Two streets back from the water and it lends boards to guests.',
          url: 'https://www.ithhostels.com/',
          basis: 'About $48 a night per bed, {nights} nights',
          price: { kind: 'per-person', min: 44, max: 60 },
          perNight: true,
        },
      ],
      otherCosts: [
        {
          label: 'Board and wetsuit hire',
          provider: 'Ocean Beach surf shops',
          detail:
            'About $30 a day for a soft-top and a 3/2 suit. Most shops want a card on file for the security hold — several will take a passport instead if you ask, which matters if you have no US card.',
          basis: 'Per person, two mornings',
          price: { kind: 'per-person', min: 45, max: 70 },
        },
        {
          label: 'Food',
          provider: 'Ocean Beach and Barrio Logan',
          detail: 'Cheaper than downtown, and the Wednesday farmers market on Newport Avenue if the dates line up.',
          basis: 'Per person for the weekend',
          price: { kind: 'per-person', min: 50, max: 85 },
        },
      ],
    },
  ],
  assumptions: [
    { label: 'Booking window', detail: 'Amtrak Saver fares need seven days and sell out on Friday afternoon departures. Booking two weeks out is the difference between $38 and $62.' },
    { label: 'Occupancy', detail: 'Dorm beds are priced per person, so unlike every other trip here the group size barely changes the per-head cost.' },
    { label: 'Getting around', detail: 'Everything is on the trolley, a bus or a walk. No rideshare is costed in.' },
    { label: 'Season', detail: 'Water is about 18°C in autumn, which is a 3/2 wetsuit rather than shorts.' },
  ],
  exclusions: [
    'A day in Tijuana. The trolley reaches the border for $3, but re-entry needs a visa or ESTA that permits it — check yours before you go, not at the turnstile.',
    'SeaWorld and the Zoo, both around $70, both deliberately left out.',
    'Anything on the Gaslamp Quarter after ten, because most of it is 21 and over.',
  ],
  sources: [
    { title: 'Amtrak Pacific Surfliner fares and timetable', url: 'https://www.amtrak.com/pacific-surfliner-train' },
    { title: 'San Diego MTS day passes', url: 'https://www.sdmts.com/fares' },
    { title: 'Balboa Park admission', url: 'https://balboapark.org/' },
  ],
  itinerary: [
    {
      dayOffset: 0,
      label: 'Down the coast and into Little Italy',
      blocks: [
        { time: '10:00', title: 'Surfliner from Union Station', detail: 'Sit on the right going south. From San Clemente the track runs on the sand for forty minutes.', place: 'Union Station' },
        { time: '12:50', title: 'Arrive Santa Fe Depot', detail: 'The station is in the middle of town and the hostel is a ten-minute walk.', place: 'Santa Fe Depot' },
        { time: '14:00', title: 'Walk Little Italy and the waterfront', detail: 'The Saturday market on India Street is one of the better ones in the state.', place: 'Little Italy' },
        { time: '17:00', title: 'Sunset at Sunset Cliffs', detail: 'The 35 bus out to Ocean Beach then twenty minutes on foot along the top. Do not stand near the edge, the sandstone gives way.', place: 'Sunset Cliffs' },
        { time: '20:00', title: 'Dinner in Ocean Beach', detail: 'Newport Avenue, and the whole street is cheap.', place: 'Ocean Beach' },
      ],
    },
    {
      dayOffset: 1,
      label: 'Balboa Park and the south of the city',
      blocks: [
        { time: '09:00', title: 'Balboa Park on foot', detail: 'The buildings are a 1915 exposition set that was never taken down. The Botanical Building and the gardens cost nothing.', place: 'Balboa Park' },
        { time: '12:30', title: 'Lunch in Barrio Logan', detail: 'Las Cuatro Milpas, cash only, queue down the block, worth it. Chicano Park is next door and the murals under the bridge are the reason to come.', place: 'Barrio Logan' },
        { time: '15:00', title: 'Coronado on the ferry', detail: '$7 each way from the Broadway Pier, fifteen minutes, and the skyline behind you on the way back is the photograph.', place: 'Coronado' },
        { time: '19:30', title: 'Evening in North Park', detail: 'The 7 bus. All-ages venues and food, and unlike the Gaslamp it does not card you at the door of a restaurant.', place: 'North Park' },
      ],
    },
    {
      dayOffset: 2,
      label: 'Morning in the water and the train home',
      blocks: [
        { time: '08:00', title: 'Surf or swim at Ocean Beach', detail: 'Gentle enough at the pier end. Boards from the shop on Newport.', place: 'Ocean Beach Pier' },
        { time: '11:30', title: 'Breakfast and pack', detail: 'The hostel will hold bags after checkout.', place: 'Ocean Beach' },
        { time: '14:30', title: 'Surfliner north', detail: 'Left-hand side going back. Home by half five.', place: 'Santa Fe Depot' },
      ],
    },
  ],
};

export const lasVegas: PlanFixture = {
  ideaSlug: 'las-vegas-weekend',
  destination: 'Las Vegas, Nevada',
  researchedDaysAgo: 9,
  confidence: 'medium',
  confidenceNote:
    'Coach fares and resort fees are published. Room rates swing by a factor of three depending on what is on at the convention centre that weekend, so the accommodation range is genuinely that wide.',
  summary:
    'Four and a quarter hours by coach for about $40 return, and rooms on the Strip that go for $45 a night midweek. The number nobody quotes you is the resort fee — $35 to $50 a night, charged at check-in, not included in any price you saw online, and it is why a $45 room is really a $90 room.',
  summaryUnder21:
    'Read the constraints below before you book anything. Under 21 you cannot set foot on a casino gaming floor, and since the gaming floor is the route between the lobby and the lifts in most Strip hotels, several of them will not check you in at all without a 21-plus guest on the booking. This is not a rule anybody bends. The plan below is built around the version of Las Vegas that is actually open to you, which is a real trip, just not the one in the adverts.',
  options: [
    {
      id: 'coach-strip',
      name: 'Coach up, two nights on the Strip',
      bestFor: 'The straightforward version',
      requiresOver21: true,
      transport: [
        {
          label: 'Coach, return',
          provider: 'FlixBus',
          detail:
            'Union Station to the South Strip Transit Terminal, four and a quarter hours each way. Friday afternoon departures are the expensive ones.',
          url: 'https://www.flixbus.com/',
          basis: 'Return, per person, booked ten days ahead',
          price: { kind: 'per-person', min: 34, max: 68 },
        },
        {
          label: 'Deuce bus, 3-day pass',
          provider: 'RTC Southern Nevada',
          detail:
            'Runs the length of the Strip and down to Fremont Street all night. The Strip is four miles long and looks like one.',
          url: 'https://www.rtcsnv.com/ways-to-travel/bus-routes-schedules/',
          basis: 'Per person, 3-day pass',
          price: { kind: 'per-person', min: 20, max: 20 },
        },
      ],
      accommodation: [
        {
          label: 'Twin room, Excalibur or Luxor',
          provider: 'MGM Resorts',
          detail:
            'South end of the Strip, walking distance to the coach terminal. Two rooms for six, four sharing where they allow it.',
          url: 'https://excalibur.mgmresorts.com/',
          basis: 'About $58 a night before fees, {nights} nights, {n} of you across two rooms',
          price: { kind: 'split', min: 58, max: 165, splitCap: 3 },
          perNight: true,
        },
        {
          label: 'Resort fee',
          provider: 'MGM Resorts',
          detail:
            'Charged per room per night at check-in whatever you booked online. It covers wifi and the pool, neither of which you asked for. Every Strip hotel does this.',
          basis: '$45 per room per night, {nights} nights, split across the room',
          price: { kind: 'split', min: 45, max: 50, splitCap: 3 },
          perNight: true,
        },
      ],
      otherCosts: [
        {
          label: 'Food',
          provider: 'Off-Strip, mostly',
          detail:
            'Anything on the Strip is priced for people who have just won. Walk two blocks east to Spring Mountain Road and it halves.',
          basis: 'Per person for the weekend',
          price: { kind: 'per-person', min: 70, max: 130 },
        },
        {
          label: 'One thing worth paying for',
          provider: 'Sphere, a show, or the Neon Museum',
          detail:
            'The Neon Museum is $20 and genuinely good. Sphere is $99 upwards. Pick one rather than drifting.',
          url: 'https://www.neonmuseum.org/',
          basis: 'Per person, one booked thing',
          price: { kind: 'per-person', min: 20, max: 99 },
        },
      ],
    },
    {
      id: 'coach-offstrip',
      name: 'Coach up, off-Strip motel, no casino floor needed',
      bestFor: 'Under-21 groups, and it is cheaper as well',
      transport: [
        {
          label: 'Coach, return',
          provider: 'FlixBus',
          detail: 'Union Station to the South Strip Transit Terminal.',
          url: 'https://www.flixbus.com/',
          basis: 'Return, per person',
          price: { kind: 'per-person', min: 34, max: 68 },
        },
        {
          label: 'Deuce bus, 3-day pass',
          provider: 'RTC Southern Nevada',
          detail: 'The Strip and Fremont Street, all night.',
          url: 'https://www.rtcsnv.com/ways-to-travel/bus-routes-schedules/',
          basis: 'Per person',
          price: { kind: 'per-person', min: 20, max: 20 },
        },
      ],
      accommodation: [
        {
          label: 'Non-gaming hotel off the Strip',
          provider: 'Hampton Inn Tropicana or similar',
          detail:
            'No casino floor between the door and the lift, which means no age problem at check-in and no resort fee. Ten minutes on the Deuce from the middle of the Strip.',
          url: 'https://www.hilton.com/en/hampton/',
          basis: 'About $95 a night for a twin, {nights} nights, {n} of you sharing',
          price: { kind: 'split', min: 95, max: 145, splitCap: 2 },
          perNight: true,
        },
      ],
      otherCosts: [
        {
          label: 'Food',
          provider: 'Chinatown on Spring Mountain Road',
          detail:
            'Three miles of it, no age restrictions anywhere, and the best eating in the city by some distance.',
          basis: 'Per person for the weekend',
          price: { kind: 'per-person', min: 60, max: 110 },
        },
        {
          label: 'Things that do not card you',
          provider: 'Neon Museum, Seven Magic Mountains, Red Rock Canyon',
          detail:
            'The Neon Museum is $20 and all ages. Seven Magic Mountains is free and half an hour south. Red Rock is $15 a vehicle and the best thing within an hour of the Strip.',
          url: 'https://www.neonmuseum.org/',
          basis: 'Per person across the weekend',
          price: { kind: 'per-person', min: 25, max: 55 },
        },
      ],
    },
  ],
  assumptions: [
    { label: 'Occupancy', detail: 'Strip rooms are costed as two rooms with three sharing. Most Strip hotels cap at four and charge for the fourth.' },
    { label: 'Resort fee', detail: 'Shown as its own line because it is never in the advertised rate. It is per room per night and it is not optional.' },
    { label: 'Booking window', detail: 'Ten days out for the coach. Rooms are cheapest Sunday to Thursday and roughly triple when a big convention is in.' },
    { label: 'No car', detail: 'The whole plan is on the Deuce and on foot. The Strip is four miles end to end, so budget more walking than you expect.' },
  ],
  exclusions: [
    'Gambling, obviously, and it is worth setting a number before you arrive rather than after.',
    'Clubs and pool parties. Entry is $30 to $75, strictly 21 and over, and the queue is not the fun part.',
    'The Grand Canyon. Every tour advertised on the Strip is a five-hour round trip to the West Rim, which is not the Grand Canyon people mean.',
    'Checked baggage on the coach beyond one bag.',
  ],
  sources: [
    { title: 'FlixBus Los Angeles to Las Vegas', url: 'https://www.flixbus.com/' },
    { title: 'RTC Southern Nevada passes and routes', url: 'https://www.rtcsnv.com/ways-to-travel/bus-routes-schedules/' },
    { title: 'Nevada gaming age rules, Nevada Gaming Control Board', url: 'https://gaming.nv.gov/' },
    { title: 'Neon Museum admission', url: 'https://www.neonmuseum.org/' },
  ],
  itinerary: [
    {
      dayOffset: 0,
      label: 'Coach up, and the Strip at night',
      blocks: [
        { time: '13:00', title: 'FlixBus from Union Station', detail: 'Four and a quarter hours through the Mojave. Sit on the left for the Ivanpah solar towers.', place: 'Union Station' },
        { time: '17:30', title: 'Check in at the south end', detail: 'Excalibur and Luxor are both a short walk from the terminal. Resort fee is taken here, in cash or on a card.', place: 'South Strip' },
        { time: '19:30', title: 'Walk north as far as the Bellagio', detail: 'A mile and a half and it takes two hours because you keep stopping. The fountains run every fifteen minutes after eight.', place: 'The Strip' },
        { time: '22:30', title: 'Fremont Street on the Deuce', detail: 'Old Las Vegas, forty minutes north, and better than the Strip after midnight.', place: 'Fremont Street' },
      ],
    },
    {
      dayOffset: 1,
      label: 'Out of the city and back into it',
      blocks: [
        { time: '08:30', title: 'Red Rock Canyon', detail: 'Twenty miles west. The thirteen-mile scenic loop, and the Calico Tanks walk off it, are the reason to get up. Timed entry is required and books out.', place: 'Red Rock Canyon' },
        { time: '13:00', title: 'Lunch on Spring Mountain Road', detail: 'Las Vegas Chinatown. Cheaper and better than anything on the Strip.', place: 'Chinatown' },
        { time: '16:00', title: 'Neon Museum', detail: 'The boneyard of every sign the city has thrown away. Book the last slot before dark and they light some of them.', place: 'Neon Museum' },
        { time: '20:00', title: 'The evening', detail: 'A show, the Sphere, or walking the length of the Strip again. Pick before you leave the hotel or you will do none of them.', place: 'The Strip' },
      ],
    },
    {
      dayOffset: 2,
      label: 'Late checkout and the coach home',
      blocks: [
        { time: '10:00', title: 'Seven Magic Mountains', detail: 'Half an hour south on the 15, thirty-foot stacks of fluorescent boulders in the desert. Free, and ten minutes is enough.', place: 'Jean Dry Lake' },
        { time: '13:00', title: 'Last food', detail: 'In-N-Out by the terminal, which is a rite of passage and costs $9.', place: 'South Strip' },
        { time: '15:00', title: 'Coach back', detail: 'Home for half seven if the 15 is kind, half nine if it is not.', place: 'South Strip Transit Terminal' },
      ],
    },
  ],
  itineraryUnder21: [
    {
      dayOffset: 0,
      label: 'Coach up, check in somewhere that will have you',
      blocks: [
        { time: '13:00', title: 'FlixBus from Union Station', detail: 'Four and a quarter hours across the Mojave.', place: 'Union Station' },
        { time: '17:30', title: 'Check in off-Strip', detail: 'A non-gaming hotel, so there is no casino floor to cross and no age question at the desk. This is the single decision that makes the weekend work.', place: 'Tropicana Avenue' },
        { time: '19:00', title: 'Dinner in Chinatown', detail: 'Spring Mountain Road. No age restrictions anywhere on it and the best food in the city.', place: 'Chinatown' },
        { time: '21:30', title: 'The Strip on foot', detail: 'Walking the Strip, the fountains, the Bellagio conservatory and the Venetian canals are all open to you. It is the gaming floors and the clubs that are not.', place: 'The Strip' },
      ],
    },
    {
      dayOffset: 1,
      label: 'The desert, which does not card anyone',
      blocks: [
        { time: '08:30', title: 'Red Rock Canyon', detail: 'The best thing within an hour of Las Vegas and entirely unaffected by how old you are. Timed entry, book it.', place: 'Red Rock Canyon' },
        { time: '13:30', title: 'Lunch back in town', detail: 'Chinatown again, or the food hall at Area15.', place: 'Chinatown' },
        { time: '15:30', title: 'Area15', detail: 'Omega Mart is all ages until nine in the evening and is genuinely strange. $55, and the one paid thing here worth it.', place: 'Area15' },
        { time: '20:00', title: 'Fremont Street', detail: 'The overhead screen and the street performers are open air and open to everyone. Stay out of the casinos either side of it.', place: 'Fremont Street' },
      ],
    },
    {
      dayOffset: 2,
      label: 'One last stop on the way out',
      blocks: [
        { time: '10:00', title: 'Seven Magic Mountains', detail: 'Free, half an hour south, and ten minutes is enough.', place: 'Jean Dry Lake' },
        { time: '13:00', title: 'Last food', detail: 'In-N-Out by the terminal.', place: 'South Strip' },
        { time: '15:00', title: 'Coach back', detail: 'Home for half seven.', place: 'South Strip Transit Terminal' },
      ],
    },
  ],
  extraConstraints: (request) =>
    request.isOver21
      ? []
      : [
          {
            trigger: 'under-21',
            severity: 'blocker',
            title: 'Most Strip hotels will not check you in',
            body: 'In most Strip resorts the lifts are reached across the gaming floor, and Nevada law keeps under-21s off it entirely. Several will refuse the booking outright unless somebody 21 or over is on it, and security does move people on.',
            workaround:
              'Book a non-gaming hotel off the Strip. There is no casino floor to cross, no resort fee, and it costs less. The option above is built around exactly this.',
          },
          {
            trigger: 'under-21',
            severity: 'info',
            title: 'What is still open to you',
            body: 'Walking the Strip, the Bellagio fountains and conservatory, the Venetian canals, Fremont Street, the Neon Museum, Area15 before nine, Red Rock Canyon and Seven Magic Mountains. That is a full weekend and none of it involves standing outside somewhere.',
          },
        ],
};
