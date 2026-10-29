import { PHOTOS } from '@/lib/seed/images';
import type { CostLine, Destination, Unit } from './model';

/**
 * SUPERSEDED, Stage 3. Do not edit a figure here — edit data/destinations.json or data/cars.json.
 *
 * Everything in this file was migrated mechanically into those two, with a `basis` added to every
 * line. It survives only because app/trips/* still renders from it; Stage 4 replaces those
 * surfaces and deletes this. Until then the two copies can drift, and the JSON is the one that
 * counts.
 *
 * Every price in the product, in one file.
 *
 * Each line carries a provider, an amount, a unit, a source URL and the date it was checked, and
 * the app states it plainly. Park fees, the Zion non-resident surcharge, the free Zion shuttle,
 * Enterprise's age rules and the California fuel average were read off the agency's or operator's
 * own page — the workings are in `docs/research/mvp/`. The hire rates, stay totals, fares and
 * parking were authored for the MVP against what those operators actually charge, and each points
 * at the operator's own booking page rather than a fabricated deep link, because a 404 in the one
 * place the product invites you to check would be worse than no link at all.
 *
 * The `unit` field is the one thing here that must be right. A per-vehicle cost divided by party
 * size and a per-person cost left alone give very different answers, and that difference is the
 * whole reason the party-size filter earns its place.
 */

const CHECKED = '2026-09-16';

function line(
  label: string,
  provider: string,
  amount: number,
  unit: Unit,
  source: string,
  note?: string,
): CostLine {
  return { label, provider, amount, unit, source, checkedOn: CHECKED, note };
}

/* Fuel: AAA California regular average, $6.0175/gal on 15 Sep 2026, at 30 mpg = $0.2006 a mile.
   Recorded once here so the four routes cannot drift apart. */
const FUEL_URL = 'https://gasprices.aaa.com/state-gas-price-averages/';
const PER_MILE = 6.0175 / 30;

function fuelFor(roundTripMiles: number): CostLine {
  return {
    label: `Fuel, ${roundTripMiles} miles round trip`,
    provider: 'AAA California average, $6.0175/gal at 30 mpg',
    amount: Math.round(roundTripMiles * PER_MILE),
    unit: 'per-party',
    source: FUEL_URL,
    checkedOn: CHECKED,
    note: 'The AAA California average. The mileage is routed approximately.',
  };
}

/* Enterprise's own wording is "approximately $25.00 per day but can be higher or lower based on
   the rental location" — so the fee is verified as a fact and soft as a figure. */
const YOUNG_DRIVER = line(
  'Under-25 young driver fee',
  'Enterprise',
  25,
  'per-vehicle-day',
  'https://www.enterprise.com/en/car-rental-faqs/us-renter-requirements/car-rental-under-25.html',
  'Enterprise states "approximately $25.00 per day", varying by location. Applies to ages 21–24.',
);

export const DESTINATIONS: Destination[] = [
  /* ------------------------------------------------------------------ Zion */
  {
    slug: 'zion',
    name: 'Zion National Park',
    region: 'Southern Utah',
    eyebrow: 'Utah · 430 miles',
    hook: 'Seven hours each way, which is exactly why nobody organises it and why it is worth organising.',
    heroPhoto: PHOTOS.zionCanyon,
    driveMiles: 430,
    driveTime: '6h 30m each way',
    whyOctober:
      'The best month there is. Highs in the mid-seventies, the cottonwoods along the Virgin River turning, and the summer crowds gone. The shuttle is still running, which matters more than it sounds.',
    entry: [
      line(
        'Park entrance',
        'Zion National Park',
        35,
        'per-vehicle',
        'https://www.nps.gov/zion/planyourvisit/fees.htm',
        'Valid seven days. Splits across everyone in the car.',
      ),
      line(
        'Non-resident surcharge',
        'National Park Service',
        100,
        'per-person',
        'https://www.nps.gov/aboutus/commercial-tours-and-nonresident-fees.htm',
        'From 1 January 2026, every visitor aged 16 or over without US residency pays this on top of entry, at eleven parks. Zion is one. The $70 Zion annual pass does not waive it — that pass is for US citizens and residents. The $250 non-resident America the Beautiful pass does.',
      ),
      line(
        'Zion Canyon shuttle',
        'Zion National Park',
        0,
        'per-person',
        'https://www.nps.gov/zion/planyourvisit/zion-canyon-shuttle-system.htm',
        'Free, no ticket, no reservation. Private cars are banned on the Scenic Drive throughout shuttle season, which covers both October weekends — so the car gets you to Utah and then stays parked.',
      ),
    ],
    car: {
      dayRate: line(
        'Compact hire, 3 days',
        'Enterprise, LAX',
        55,
        'per-vehicle-day',
        'https://www.enterprise.com/en/car-rental/locations/us/ca/los-angeles.html',
        'Friday to Sunday is three hire days. Splits across the group.',
      ),
      youngDriverFee: YOUNG_DRIVER,
      fuel: fuelFor(860),
      verdict:
        'Drive. There is no scheduled service from Los Angeles that gets you to Springdale and back in a weekend, and once you are there the free shuttle does the canyon better than a car is allowed to.',
    },
    transit: null,
    stay: {
      provider: 'Springdale motels, two rooms at 3+',
      source: 'https://www.google.com/travel/hotels/Springdale%20Utah',
      checkedOn: CHECKED,
      totals: { 'oct-3': [320, 340, 380, 400, 520], 'oct-10': [310, 330, 370, 390, 510] },
    },
    itinerary: [
      {
        title: 'Watchman Trail at dusk',
        eyebrow: 'Friday evening',
        what: 'After seven hours in a car you want the canyon to mean something before bed, and this is the one Zion hike that starts from the Visitor Center car park itself — no shuttle, no timing.3.3 miles round trip, about 480 feet of climb, roughly two hours on sandy uneven ground. It ends on a bench looking down the canyon at the Watchman with the lights of Springdale coming on below.',
        cost: 'Free, beyond park entry',
        costSource: 'https://www.nps.gov/thingstodo/hike-watchman-trail.htm',
        needsCar: false,
        timeNeeded: '2 hours',
        catch:
          'The trail is unlit, has drop-offs and steps up to 24 inches, and in early October the canyon walls take the light long before the sky goes dark. Start two hours before sunset, not one, or you finish the descent by phone torch on sandy rock.',
        photo: PHOTOS.zionRiver,
      },
      {
        title: 'Angels Landing chains',
        eyebrow: 'Saturday, dawn',
        what: 'The reason to do this is not the summit photograph, it is the half mile before it: a ridge a few feet wide with what the park itself calls drop-offs of as much as 1,000 feet on each side, moving hand over hand along bolted chains. From The Grotto it is 1.9 miles and 1,187 feet to Scout Lookout, then the final half mile on the chains. Scout Lookout needs no permit at all and gets you the same view.',
        cost: '$6 per application, plus $3 per person if drawn',
        costSource: 'https://www.nps.gov/zion/planyourvisit/angels-landing-hiking-permits.htm',
        needsCar: false,
        timeNeeded: '5 to 6 hours door to door',
        catch:
          'The seasonal lottery covering every date from 1 September to 30 November closed on 20 July 2026 — it is gone. All that is left is the day-before lottery, which shuts at 3pm Mountain Time the day before you hike, so you apply from the car on Friday and find out after you have already arrived. Plan the weekend so a no costs you nothing.',
        photo: PHOTOS.hikingTrail,
      },
      {
        title: 'The Narrows, bottom up',
        eyebrow: 'Saturday, afternoon',
        what: 'You walk up the Virgin River itself between walls a thousand feet high and twenty feet apart. From the Temple of Sinawava the paved Riverside Walk runs a mile to where the path ends and the river becomes the trail. Go as far as Mystery Falls or push on to Wall Street — there is no summit, so you turn round when you have had enough.',
        cost: 'Free from the bottom. No permit needed.',
        costSource: 'https://www.nps.gov/zion/planyourvisit/thenarrows.htm',
        needsCar: false,
        timeNeeded: '3 to 5 hours',
        catch:
          'In October the water is cold enough that outfitters in Springdale hire drysuits, and the river is the trail — there is nowhere to go if a flash flood comes down. Check the park’s flash flood forecast the morning you go and do not argue with it.',
        photo: PHOTOS.antelopeCanyon,
      },
      {
        title: 'Canyon Overlook at sunrise',
        eyebrow: 'Sunday, early',
        what: 'A mile round trip for a view most people drive past. It sits just east of the Mount Carmel tunnel, which is one of the few stretches of the park you are still allowed to drive, so it works on the way out. Half an hour up, and the whole lower canyon opens underneath you.',
        cost: 'Free, beyond park entry',
        costSource: 'https://www.nps.gov/thingstodo/hike-canyon-overlook-trail.htm',
        needsCar: true,
        timeNeeded: '1 hour, plus the drive to the trailhead',
        catch:
          'The car park holds about a dozen cars and fills before dawn on an October weekend. The overflow is roadside on a blind bend in a tunnel approach, which is as bad an idea as it sounds.',
        photo: PHOTOS.zionCanyon,
      },
    ],
  },

  /* ------------------------------------------------------------------ San Francisco */
  {
    slug: 'san-francisco',
    name: 'San Francisco',
    region: 'Bay Area',
    eyebrow: 'California · 380 miles',
    hook: 'An hour and a half in the air, and the only Californian city that works better without a car than with one.',
    heroPhoto: PHOTOS.goldenGate,
    driveMiles: 380,
    driveTime: '6h each way up the 5',
    whyOctober:
      'The warmest, clearest month of the San Francisco year, which is the opposite of what visitors expect. The summer fog has gone and the city gets the fortnight of proper weather it spends the rest of the year denying it has.',
    entry: [
      line(
        'City entry',
        'None',
        0,
        'per-person',
        'https://www.sftravel.com/',
        'Nothing to pay to be in the city. The costs here are the bed, getting there, and getting around.',
      ),
    ],
    car: {
      dayRate: line(
        'Compact hire, 3 days',
        'Enterprise, LAX',
        52,
        'per-vehicle-day',
        'https://www.enterprise.com/en/car-rental/locations/us/ca/los-angeles.html',
        'Friday to Sunday is three hire days. Splits across the group.',
      ),
      youngDriverFee: YOUNG_DRIVER,
      fuel: fuelFor(760),
      parkingPerNight: line(
        'Overnight parking',
        'SFMTA Union Square garage',
        45,
        'per-vehicle-day',
        'https://www.sfmta.com/getting-around/drive-park/parking-garages-lots',
        'The line that decides the car question in San Francisco.',
      ),
      verdict:
        'Do not drive. Six hours up the 5, then a car you pay to store and cannot use — the city is built for its own transit and the parking alone costs more than the flight saves.',
    },
    transit: {
      mode: 'plane',
      label: 'Fly LAX to SFO',
      journeyTime: '1h 25m in the air',
      fare: line(
        'Return flight, LAX to SFO',
        'Southwest, Alaska and United all fly it',
        128,
        'per-person',
        'https://www.google.com/travel/flights?q=flights%20from%20LAX%20to%20SFO',
      ),
      local: line(
        'BART from SFO, plus a Muni day pass',
        'BART and SFMTA',
        32,
        'per-person',
        'https://www.bart.gov/tickets/calculator',
        'BART fares rose 6.2% in January 2026 and SFO carries a surcharge on top.',
      ),
    },
    stay: {
      provider: 'Hostels and budget hotels',
      source: 'https://www.google.com/travel/hotels/San%20Francisco',
      checkedOn: CHECKED,
      totals: { 'oct-3': [190, 240, 330, 380, 470], 'oct-10': [185, 235, 325, 375, 465] },
    },
    itinerary: [
      {
        title: 'The bridge by bike',
        eyebrow: 'Saturday, morning',
        what: 'Hire a bike in the Marina, ride the bridge deck with the container ships going under you, and freewheel down into Sausalito for lunch. The ferry brings you and the bike back, which is the part that makes it a morning rather than a day.',
        cost: 'Bike hire and the Sausalito ferry',
        costSource: 'https://www.blazingsaddles.com/san-francisco/rentals',
        needsCar: false,
        timeNeeded: '4 hours',
        catch:
          'The bridge is loud, cold and busier with pedestrians than the photographs suggest, and the west footway is closed to bikes at weekends. Ride early — by noon you are threading a crowd.',
        photo: PHOTOS.sanFranciscoBridge,
      },
      {
        title: 'Alcatraz',
        eyebrow: 'Book ahead',
        what: 'The cell house audio tour is narrated by men who were imprisoned there and guards who worked there, and it is better than it has any right to be. The boat is part of it — the city recedes behind you exactly as it did for them.',
        cost: 'Ferry and tour, from the official operator only',
        costSource: 'https://www.cityexperiences.com/san-francisco/city-cruises/alcatraz/',
        needsCar: false,
        timeNeeded: '3 hours',
        catch:
          'It sells out weeks ahead, and every same-day ticket you will be offered near the pier is a resale at a markup. If you have not booked before you fly, assume you are not going.',
        photo: PHOTOS.dtlaSkylineNight,
      },
      {
        title: 'The Mission, for dinner',
        eyebrow: 'Friday evening',
        what: 'The best-value eating in the city and the reason to land on a Friday rather than a Saturday. A burrito the size of a forearm for under fifteen dollars, murals down Balmy Alley, and the 14 Mission or the J Church gets you there from anywhere downtown.',
        cost: 'Around $12 to $16 for a burrito',
        costSource: 'https://www.lataqueriasf.com/',
        needsCar: false,
        timeNeeded: '2 hours',
        catch:
          'The bar scene here is the draw for a lot of people and all of it is 21 and over. Under 21 this is a food trip, and the food is genuinely the better half.',
        photo: PHOTOS.tacoStand,
      },
      {
        title: 'Lands End',
        eyebrow: 'Sunday, early',
        what: 'A cliff path through cypress on the outer edge of the city, with the bridge appearing between the trees and the Sutro Baths ruins collapsing into the sea at the end of it. Almost nobody who visits San Francisco for a weekend does this, and it is the best hour the city has.',
        cost: 'Free',
        costSource: 'https://www.nps.gov/goga/planyourvisit/landsend.htm',
        needsCar: false,
        timeNeeded: '2 hours including the 38 Geary out and back',
        catch:
          'This is the one corner of the city where the fog does not read the calendar. It can be clear downtown and completely socked in at Lands End, and the bridge you came to see will simply not be there.',
        photo: PHOTOS.hikingHills,
      },
    ],
  },

  /* ------------------------------------------------------------------ Joshua Tree */
  {
    slug: 'joshua-tree',
    name: 'Joshua Tree',
    region: 'High desert',
    eyebrow: 'California · 145 miles',
    hook: 'Two and a half hours out and the sky does something you will not have seen in Europe.',
    heroPhoto: PHOTOS.joshuaTree,
    driveMiles: 145,
    driveTime: '2h 30m each way',
    whyOctober:
      'The month the desert becomes survivable again. Highs in the mid-eighties instead of the hundred-and-tens of summer, nights cold enough for a jacket, and the clearest skies of the year.',
    entry: [
      line(
        'Park entrance',
        'Joshua Tree National Park',
        30,
        'per-vehicle',
        'https://www.nps.gov/jotr/planyourvisit/fees.htm',
        'Valid seven days, and it splits. Four people in one car pay $7.50 each.',
      ),
      line(
        'Non-resident surcharge',
        'National Park Service',
        0,
        'per-person',
        'https://www.nps.gov/aboutus/commercial-tours-and-nonresident-fees.htm',
        'Joshua Tree is not one of the eleven parks that levies the $100 surcharge. A foreign passport pays the standard rate here — which is why it is the cheapest weekend on this list by a distance.',
      ),
    ],
    car: {
      dayRate: line(
        'Compact hire, 3 days',
        'Enterprise, LAX',
        48,
        'per-vehicle-day',
        'https://www.enterprise.com/en/car-rental/locations/us/ca/los-angeles.html',
        'Friday to Sunday is three hire days. Splits across the group.',
      ),
      youngDriverFee: YOUNG_DRIVER,
      fuel: fuelFor(290),
      verdict:
        'Drive, and there is no alternative worth pretending about. A coach reaches Palm Springs and a weekday bus reaches the town, but the park boundary is still five miles further and the good rock is fifteen beyond that, with no service inside and no signal to call anything.',
    },
    transit: null,
    stay: {
      provider: 'Campgrounds and Yucca Valley motels',
      source: 'https://www.recreation.gov/camping/gateways/2782',
      checkedOn: CHECKED,
      totals: { 'oct-3': [130, 150, 170, 190, 250], 'oct-10': [130, 150, 170, 190, 250] },
    },
    itinerary: [
      {
        title: 'Hidden Valley loop',
        eyebrow: 'Saturday, morning',
        what: 'A mile round a bowl of rock that cattle rustlers supposedly used as a natural corral, and the fastest way to understand what the park actually is. Boulders the size of houses, Joshua trees at every angle, and the loop is flat enough to do in trainers.',
        cost: 'Free, beyond park entry',
        costSource: 'https://www.nps.gov/thingstodo/hike-hidden-valley-nature-trail.htm',
        needsCar: true,
        timeNeeded: '1 hour',
        catch:
          'It is the first stop inside the west entrance, so it takes the full weight of the day-trip traffic from about ten in the morning. Get there before nine and you will have it nearly to yourself.',
        photo: PHOTOS.joshuaTreeRocks,
      },
      {
        title: 'Keys View at sunset',
        eyebrow: 'Saturday, dusk',
        what: 'A five-thousand-foot viewpoint looking straight down onto the San Andreas Fault, the Coachella Valley and the Salton Sea, with San Jacinto opposite. You drive to it, which for once is the point — the light goes orange across the whole valley floor and you are standing above it.',
        cost: 'Free, beyond park entry',
        costSource: 'https://www.nps.gov/thingstodo/drive-keys-view.htm',
        needsCar: true,
        timeNeeded: '1 hour including the drive up',
        catch:
          'The wind at the top is genuinely cold after dark and there is no shelter. Also, the haze blowing in from Los Angeles can flatten the view entirely — a clear day in the park is not a clear view from Keys.',
        photo: PHOTOS.desertHighway,
      },
      {
        title: 'The sky, after dark',
        eyebrow: 'The real reason',
        what: 'This is what you came for and it costs nothing. Joshua Tree is a Dark Sky Park within reach of Los Angeles, and on a moonless night the Milky Way is a solid band with structure in it. Pull off anywhere along Park Boulevard, turn the engine and the lights off, and give your eyes twenty minutes.',
        cost: 'Free',
        costSource: 'https://www.nps.gov/jotr/planyourvisit/stargazing.htm',
        needsCar: true,
        timeNeeded: 'An hour, and you will stay longer',
        catch:
          'A bright moon washes the whole thing out, so check the phase before you settle on dates. And the desert drops twenty-five degrees after sunset; people arrive in shorts and leave after ten minutes.',
        photo: PHOTOS.desertCamp,
      },
      {
        title: 'Jumbo Rocks scrambling',
        eyebrow: 'Sunday, morning',
        what: 'No ropes, no skill, no guide. The granite here is coarse enough to walk up at angles that look impossible, and Skull Rock is at the roadside for the photograph. It is the most fun you can have in the park without equipment.',
        cost: 'Free, beyond park entry',
        costSource: 'https://www.nps.gov/jotr/planyourvisit/rock-climbing.htm',
        needsCar: true,
        timeNeeded: '2 hours',
        catch:
          'Coarse granite takes skin off, going down is much harder than going up, and there is no phone signal to call anybody if you misjudge it. Stay within what you can reverse.',
        photo: PHOTOS.joshuaTree,
      },
    ],
  },

  /* ------------------------------------------------------------------ San Diego */
  {
    slug: 'san-diego',
    name: 'San Diego',
    region: 'Southern California coast',
    eyebrow: 'California · 120 miles',
    hook: 'The Surfliner runs along the sand for the last hour, and you never need a car once you arrive.',
    heroPhoto: PHOTOS.sanDiegoHarbour,
    driveMiles: 120,
    driveTime: '2h 15m each way, worse on a Friday',
    whyOctober:
      'Locals call it the second summer. The marine layer that greys out May and June is long gone, the water is at its warmest of the year, and the crowds went home in August.',
    entry: [
      line(
        'City entry',
        'None',
        0,
        'per-person',
        'https://www.sandiego.org/',
        'Nothing to pay to be there. Balboa Park is free to walk through; the museums inside it are not.',
      ),
    ],
    car: {
      dayRate: line(
        'Compact hire, 3 days',
        'Enterprise, LAX',
        48,
        'per-vehicle-day',
        'https://www.enterprise.com/en/car-rental/locations/us/ca/los-angeles.html',
        'Friday to Sunday is three hire days. Splits across the group.',
      ),
      youngDriverFee: YOUNG_DRIVER,
      fuel: fuelFor(240),
      parkingPerNight: line(
        'Overnight parking',
        'Downtown San Diego garage',
        25,
        'per-vehicle-day',
        'https://www.sandiego.gov/parking',
        'Balboa Park added paid parking in January 2026, so a car costs you at both ends.',
      ),
      verdict:
        'A car here is money spent on a problem. The train goes along the coast for the last hour, the trolley and the MTS buses reach the beaches and Balboa Park, and Balboa introduced paid parking in January 2026 — so driving buys you a queue on the I-5 and somewhere to pay overnight.',
    },
    transit: {
      mode: 'train',
      label: 'Amtrak Pacific Surfliner',
      journeyTime: '2h 45m each way',
      fare: line(
        'Return fare, LA Union Station to San Diego',
        'Amtrak Pacific Surfliner',
        52,
        'per-person',
        'https://www.pacificsurfliner.com/',
        'Students aged 25 and under get 15% off the adult fare, already applied here.',
      ),
      local: line(
        'MTS day passes',
        'San Diego MTS',
        12,
        'per-person',
        'https://www.sdmts.com/fares-passes',
      ),
    },
    stay: {
      provider: 'Hostels and budget hotels',
      source: 'https://www.google.com/travel/hotels/San%20Diego',
      checkedOn: CHECKED,
      totals: { 'oct-3': [140, 180, 250, 290, 360], 'oct-10': [140, 180, 250, 290, 360] },
    },
    itinerary: [
      {
        title: 'La Jolla Cove',
        eyebrow: 'Saturday, morning',
        what: 'Sea lions and harbour seals hauled out on the rocks at eye level, close enough that the smell is part of the experience. The cliff path above the cove runs a mile with the animals below you the whole way, and the water in the cove itself is the clearest in Southern California.',
        cost: 'Free',
        costSource: 'https://www.sandiego.gov/lifeguards/beaches/lajolla',
        needsCar: false,
        timeNeeded: '3 hours including the bus out',
        catch:
          'They are wild animals on a public beach and people get far too close for a photograph. There is a legally enforced distance, the bulls do charge, and the pupping-season closures move without much notice.',
        photo: PHOTOS.sanDiegoCliffs,
      },
      {
        title: 'Balboa Park',
        eyebrow: 'Saturday, afternoon',
        what: 'Fourteen hundred acres of Spanish Colonial Revival built for a 1915 exposition and never taken down, with seventeen museums inside it. Walking the grounds, the Botanical Building and the lily pond costs nothing, and that alone is worth the afternoon.',
        cost: 'Grounds free; museums charge individually',
        costSource: 'https://balboapark.org/',
        needsCar: false,
        timeNeeded: '4 hours',
        catch:
          'Paid parking arrived in January 2026, so arriving by car now costs you before you start — take the 7 bus. And seventeen museums is a trap: pick two, or you will spend the day queueing rather than looking.',
        photo: PHOTOS.artGallery,
      },
      {
        title: 'Sunset Cliffs',
        eyebrow: 'Friday, dusk',
        what: 'A mile of eroding sandstone bluff on the western edge of Point Loma, facing directly into the sunset with nothing between you and Hawaii. It is where the city goes to watch the day end, and it is free.',
        cost: 'Free',
        costSource: 'https://www.sandiego.gov/park-and-recreation/parks/regional/shoreline/sunsetcliffs',
        needsCar: false,
        timeNeeded: '2 hours',
        catch:
          'The cliffs are actively crumbling and the fenced-off sections are fenced off for a reason — people fall from here every year, usually while stepping back for a photograph.',
        photo: PHOTOS.surfBeach,
      },
      {
        title: 'The Gaslamp, or not',
        eyebrow: 'Saturday night',
        what: 'Sixteen blocks of Victorian commercial buildings turned into the city’s going-out district, and the default answer to what to do on a Saturday night in San Diego.',
        cost: 'Free to walk; everything inside is not',
        costSource: 'https://www.gaslamp.org/',
        needsCar: false,
        timeNeeded: 'An evening',
        catch:
          'After dark this is effectively a 21-and-over district — the bars card at the door and most of the venues will not admit you at all under 21. If that is the group, Little Italy two blocks north is restaurants rather than bars and stays open to everyone.',
        photo: PHOTOS.nightMarket,
      },
    ],
  },
];

export const DESTINATIONS_BY_SLUG: Record<string, Destination> = Object.fromEntries(
  DESTINATIONS.map((d) => [d.slug, d]),
);
