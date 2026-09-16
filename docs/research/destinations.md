# SideQuest destination research — trips from Los Angeles for USC exchange students

Compiled 3 September 2026. Every hard number carries a source URL and a confidence rating.
Where a number could not be verified against a primary source it is marked `unverified` rather
than guessed.

## How to read this document

Each destination uses the same field set, so this converts mechanically into a TypeScript seed
file. The fields are:

| Field | Meaning |
|---|---|
| `id` | kebab-case slug, stable primary key |
| `region` | coarse geography, for grouping in the idea bank |
| `tier` | `day` \| `weekend` \| `long` \| `flight-required` |
| `reason` | one line: *why* go, never *what it is* |
| `distance_from_usc` | road miles from USC / DTLA |
| `drive_time` | typical, with the traffic caveat where it matters |
| `carfree` | `yes` \| `partial` \| `no`, then the operator, route, journey time, fare, booking URL |
| `car_notes` | 4WD / high clearance needs, rental realism, parking cost |
| `nights` | ideal duration |
| `best_months` / `worst_months` | with the reason — heat, snow closure, crowds, road closure |
| `fixed_costs` | table: Item, Amount, Per, Source URL, Confidence |
| `variable_costs` | lodging tiers, fuel, food |
| `age_gates` | anything where under-21 or under-25 bites |
| `licence_credit_friction` | foreign licence, no US credit card |
| `catch` | the single most important thing that goes wrong |
| `links` | canonical price-check URL templates with placeholders |
| `confidence` | overall |

Confidence ratings mean: **high** = read off the operator's or the agency's own page today;
**medium** = a secondary source consistent with several others; **low** = single secondary
source, or a figure that moves (dynamic pricing, fuel, hostel rates).

## Standing assumptions

- **Fuel: $5.74/gal**, the verified California average, at 30 mpg. A 400-mile round trip is about
  $77 of petrol; split four ways, $19 a head. Split fuel is what makes most of this affordable,
  and it is the number the app should surface. Mark it as a live-lookup field — it moves.
- **Origin point:** USC University Park Campus / Downtown LA.
- **The user:** 19–23, foreign passport, foreign driving licence, F-1 or J-1 visa, frequently no
  US credit card, no car, in Los Angeles for one semester.

## Research integrity note

The session's web search budget was exhausted partway through this work. Direct page fetches
continued to work, so primary-source verification was still possible for specific known URLs,
but broad discovery searching stopped. Every figure below is therefore labelled with how it was
obtained. Anything marked `unverified` should be treated as a research to-do, not as a fact, and
should never be rendered as an `api`-sourced line in the app.
# Part 0a — The load-bearing facts

These came back from research agents that were killed by a session limit before they could write
their own files. They are recorded here because each one changes a price, and several of them are
things a generic travel site gets wrong for this exact user.

Verified 3 September 2026 unless noted.

---

## The 2026 NPS non-resident surcharge — the 11 parks, named

Primary source: https://www.nps.gov/aboutus/commercial-tours-and-nonresident-fees.htm

| Fact | Value |
|---|---|
| Non-resident surcharge | **$100 per person, aged 16 or older** |
| Effective | **1 January 2026** |
| Charged | at the park entrance, **in addition to** the standard entrance fee |
| Children 15 and under | exempt from both the surcharge and the standard fee |

**The 11 parks that levy it:** Acadia, Bryce Canyon, Everglades, Glacier, Grand Canyon,
Grand Teton, Rocky Mountain, Sequoia & Kings Canyon, Yellowstone, Yosemite, Zion.

Joshua Tree, Channel Islands, Olympic, Mount Rainier, Death Valley and Hawai'i Volcanoes are
**not** on the list.

### The arithmetic the app must do

America the Beautiful is **$80 for US residents and $250 for non-residents**
(https://www.nps.gov/planyourvisit/passes.htm). Every user of this app is a foreign national.

The non-resident pass **waives the $100 surcharge for the holder and up to three additional
adults** — four people on one pass.

- One student, one surcharge park: $100 + entry. Do not buy the pass.
- One student, three surcharge parks: $300 in surcharges. Buy the pass.
- **Three students sharing one pass at one park: $300 against $250. The pass wins on the first
  park.**
- Four students, one park: $400 against $250. Decisive.

A Yellowstone + Grand Teton trip costs a solo foreign student **$200 in surcharges plus $70 in
entrance fees before a single night's accommodation**. Four of them sharing one $250 pass pay
$250 instead of $800. **This computed line is the single most valuable thing the app can tell
this user**, and it belongs on the card, not in a footnote.

### Two traps that follow

1. **Never offer the $70 park-specific annual pass as a surcharge waiver.** The Yellowstone,
   Grand Teton and Everglades fee pages all use the same ambiguous sentence, and the Grand Teton
   page separately describes its $70 pass as being for "US citizens and residents". A student who
   drives six hours expecting a $70 waiver and is charged $135 has been badly served by us.
2. **2026 fee-free days are US citizens and residents only.** Non-residents pay full fare. An
   exchange student should never plan around a fee-free day.

Flag this whole constant `verify_before_quoting` in the seed — the policy is new and politically
live.

---

## The USC U-Pass — the most useful fact for a car-free student

Source: https://transnet.usc.edu/index.php/student-u-pass/

Included in the transportation fee **already charged to every registered USC student**. Not an
add-on purchase, though students must opt in through their account before it works.

Covers: LA Metro rail and bus, LADOT DASH, Big Blue Bus, Culver CityBus, Long Beach Transit,
Foothill Transit, Torrance Transit, Gardena (GTrans), Norwalk Transit.

Does **not** cover: Metrolink, Amtrak, the LAX FlyAway.

**Effect: Santa Monica, Venice, Long Beach, Pasadena, Koreatown, Hollywood, Griffith Park, the
Getty, Universal City and Downtown are all zero marginal transport cost.** That should reorder the
idea bank, and it makes a "free today" filter a genuinely useful feature rather than a gimmick.

---

## Verified fares and fixed prices

| Item | Amount | Source | Confidence |
|---|---|---|---|
| LA Metro | $1.75/ride, $5 daily cap, $18 weekly | metro.net | high |
| Big Blue Bus | $1.25 contactless, $1.50 cash | bigbluebus.com | high |
| Metrolink SoCal Day Pass | **$15 weekday / $10 weekend**, systemwide | metrolinktrains.com | high |
| Metrolink student discount | **50% off with school ID, any age** → $7.50 / $5.00 | metrolinktrains.com | high |
| Amtrak Pacific Surfliner student | 15% off adult fare, ages 13–25; November blackouts | pacificsurfliner.com | high |
| Amtrak USA Rail Pass | $499, 10 segments, 30 days, coach only, Sale/Value fares only | amtrak.com/usa-rail-pass | high |
| Adventure Pass (Angeles/San Bernardino NF) | $5/day, $30/year; America the Beautiful substitutes | fs.usda.gov | high |
| Catalina Express round trip | **$99.00 all-in** Long Beach/San Pedro; $106.00 Dana Point | catalinaexpress.com | high |
| Channel Islands NP entrance | **$0 — no pass required** | nps.gov/chis | high |
| Channel Islands campsite | $15.00/site/night, recreation.gov, 6 months ahead | nps.gov/chis | high |
| Joshua Tree | $30/vehicle, $25/motorcycle, $15/person on foot, 7 days | nps.gov/jotr | high |
| Antelope Valley Poppy Reserve | $10/vehicle | parks.ca.gov | high |
| Salton Sea SRA | $7.00/vehicle | parks.ca.gov | high |
| Mount San Jacinto SP | $10/vehicle day use, $5/person wilderness permit | parks.ca.gov | high |
| Hearst Castle | $35 most tours, $40 Designing the Dream, $110 Julia Morgan; 60-day window | hearstcastle.org | high |
| Mt Baldy scenic lift | **$36.95 return / $18.47 one way**, fees included; Fri–Sun only | resort booking engine | high |
| Mount Wilson docent tour | $20 adult, $15 under-12/over-62; weekends Apr–Nov only | mtwilson.edu | high |
| Mount Wilson grounds and museum | free | mtwilson.edu | high |
| Hanauma Bay (Oahu) | $25/person non-resident + $3 parking; closed Mon–Tue | hanaumabaystatepark.com | high |
| Pearl Harbor | free entry, $7/day parking | nps.gov/perl | high |
| Hawai'i Tri-Park Annual Pass | $55, covers Volcanoes + Haleakalā + Pu'uhonua | nps.gov/havo | high |
| Haleakalā sunrise reservation | $1.00/vehicle, 3–7am entry, 60 days ahead | nps.gov/hale | high |
| Rocky Mountain timed entry | $2 processing; 22 May – 18 Oct 2026 | nps.gov/romo | high |
| Denali entrance | $15/person; **$45 annual pass covers 4 adults** | nps.gov/dena | high |
| Cross Border Xpress (CBX) | $51.99 return regular / $62.99 high season, booked 2+ days ahead | crossborderxpress.com | high |
| Canadian eTA | CAD $7, valid up to 5 years | canada.ca | high |
| ReserveCalifornia | 6 months ahead, 8am PST; $8.25 booking fee | parks.ca.gov | high |

**California fuel: $5.74–5.78/gal** (AAA California average; LA–Long Beach metro $5.83). EIA's
lagging weekly series says $5.52. Use the AAA figure, cite the date, mark it a live-lookup field.
The repo's old $4.80 default understates fuel by about 20%.

---

## Car rental — the wall this cohort hits

Enterprise, verified at https://www.enterprise.com/en/car-rental-faqs/us-renter-requirements/car-rental-under-25.html

- **US minimum age 21**, except Michigan and New York where it is 18.
- **Young renter fee ~$25/day for ages 21–24.**
- 21–24 restricted to economy through full-size, minivans, cargo vans, standard pickups, and
  compact-to-standard SUVs up to 5 passengers.
- **"Some locations require a credit card"** — per-branch, unresolvable online in advance, and
  exactly where a student with no US credit history gets turned away at the counter.

Hertz: US/Canada minimum **20** (18 only in Quebec, Michigan, New York). Avis: **21**, publishing
$35/day for New York and $28/day for Michigan but no California figure; bars 21–24 from full-size
SUVs, luxury, minivans, passenger vans and premium SUVs — which is the vehicle a group of six
actually wants.

**Net: a 19-year-old cannot rent a car in California from any major agency. A 20-year-old can
rent from Hertz only.** From 21 everyone can, and everyone pays roughly $25/day extra until 25.
A 3-day compact at $45/day is $135 base plus ~$75 in fees — the surcharge is over half the base
rate again, and any driving-trip line that omits it is wrong by more than the ledger's 10%
tolerance.

**Snow chains — the trap nobody mentions.** Enterprise states it does not supply chains and that
they "cannot be placed on rental vehicles unless required by state law". Hertz is the same in
substance. So in an R-1 or R-2 chain control on SR-18, SR-330 or SR-38, a student in a 2WD rental
is legally required to fit chains their contract forbids. **A rental car is not a reliable way to
reach Big Bear or Lake Arrowhead in winter.** Caltrans levels: R-1 (chains except cars under
6,000 lb with snow tyres), R-2 (chains except 4WD/AWD with snow tread on all four), R-3 (all
vehicles, no exceptions). Live status: https://roads.dot.ca.gov/roadscell.php?roadnumber={HWY}

**Still unverified and high value:** whether USC has a Zipcar for Universities partnership. If it
does, the minimum age drops to 18, insurance and fuel bundle into the hourly rate, and the
under-25 problem disappears for short trips — changing the recommendation on a dozen
destinations. Check transnet.usc.edu as well as zipcar.com.

---

## Mexico — the two facts that decide the trip

**1. The TIJ-via-CBX route is the largest single saving available.**

| Route | Return air | Bridge | Total |
|---|---|---|---|
| LAX → SJD nonstop | $342–570 | — | **$342–570** |
| TIJ → SJD via CBX | $124–234 | $52–63 | **$176–297** |
| LAX → LAP nonstop | $175–584 | — | **$175–584** |
| TIJ → LAP via CBX | $118–197 | $52–63 | **$170–260** |

Plus $21–50 each way from LA to San Ysidro (FlixBus, or Surfliner to San Diego then MTS trolley).
The saving is real but the **variance** matters more: TIJ fares barely move at short notice while
LAX fares double, so CBX is worth most exactly when a student books late.

**2. Automatic revalidation — get this right or do not state it at all.** An F-1/J-1 student with
an **expired visa stamp** may normally re-enter the US after a trip of **30 days or less** to
Mexico, Canada or an adjacent island, holding a valid I-94 and status documents. It is **void** if
they apply for a new US visa while abroad and are refused, and nationals of state-sponsor-of-
terrorism countries are excluded. Codified at 22 CFR 41.112(d) and 8 CFR 214.1(b).

**travel.state.gov and ice.gov both returned 403 to a non-browser client, so this is not
primary-sourced.** It must be verified before the app states it, and it must always point the
student at the USC Office of International Services rather than stand as advice.

Related, and equally unverified: **Puerto Rico sits inside the US immigration zone (no CBP
inspection, so no re-entry risk), while the US Virgin Islands sits outside the customs zone (CBP
inspection on return).** If confirmed, Puerto Rico is the one warm-water destination a student
with an expired stamp can visit with no risk — a genuinely differentiating feature. If wrong, a
student cannot get back to their degree. Verify at cbp.gov before shipping either.

**Drinking age in Mexico is 18**, which changes what a 19-year-old can do there more than any
other single fact in the catalogue.

**Canada's eTA-X**: citizens of 17 otherwise visa-required countries (including Brazil, Mexico,
Indonesia, Philippines, Thailand, Argentina) can use a CAD $7 eTA instead of a visitor visa if
they hold a valid US non-immigrant visa — which every F-1 student does. **They must fly.** Driving
or taking a bus across the border on an eTA-X is not permitted.

---

## Corrections to things widely repeated online

- **The Catalina Express free birthday trip ended 31 December 2017.** Travel blogs and student
  forums still recommend it. Anyone turning up expecting a free sailing pays $99. This is a good
  regression test for the anti-invention machinery.
- A search snippet putting the Catalina Express adult return at $84.50 is wrong; the operator's
  own fares page says $99.00.
- **Uber cannot pick up at Los Cabos airport (SJD).** The taxi unions hold a legally enforced
  monopoly upheld by the Mexican Supreme Court in 2026; drivers face $2,500 fines. The taxi to
  Cabo San Lucas is **$140–180 for 27 miles**; the Águila bus is **$2–15**. Walk off airport
  property to call an Uber. This is the most expensive single fact in the Mexico set and the one
  most likely to be missing from a generated itinerary.
- **Lake Arrowhead is a private lake.** Public access is the village and a paid boat tour. You
  cannot swim in it or walk most of the shoreline. People drive two hours for a lake day and get a
  car park with a view.
- **Denali's park road is still severed at Mile 43** by the Pretty Rocks landslide. In 2026 the
  buses go no further: Eielson (Mile 66) and Wonder Lake (Mile 85) — the classic view and the
  reflection photograph — are **not reachable**. East Fork at Mile 43 is $33.50 for a 4.5-hour
  round trip.
- **Glacier's vehicle reservation lottery is gone for 2026**, replaced by a ticketed shuttle and
  a three-hour parking limit at Logan Pass.
- **La Paz whale shark season is now conditional, not calendrical.** It opens only after 14
  sightings over 2–3 consecutive days and is cancelled mid-season if the count drops below 7. The
  2025/26 season opened mid-November, not October. Never sell an October date as guaranteed.
- **Balandra beach caps at 450 visitors per shift** and closes when full. The official CONANP
  wristband is MXN 120; resellers charge roughly double.
- **Temecula cards at the door, not the bar.** Ponte is 21+ only; Danza Del Sol 21+ Fri–Sat;
  Akash 21+ all day Saturday including infants. Wilson Creek admits minors 12+ on the winery tour
  at $15 — the only version of that day that works under 21.

---

## Unverified, in priority order

1. Puerto Rico vs USVI CBP inspection status (cbp.gov) — worst failure mode in the whole set.
2. Automatic revalidation at travel.state.gov.
3. Zipcar for Universities and whether USC participates.
4. Which agencies accept a debit card at LAX, and under what conditions.
5. AAA membership as a Hertz young-driver-fee waiver — widely claimed, would pay for itself in
   three rental days if true.
6. Palm Springs Aerial Tramway adult fare — 2026 sources split between $34.95 and $36.95, and
   pstramway.com refuses server-side fetches. A textbook `reconcileProvenance()` downgrade case.
7. Theme park pricing (Disneyland, Universal, Knott's, Six Flags) — all dynamic, all
   JavaScript-rendered, all need a live lookup rather than a cached number.
8. Island Packers fares — 403 to non-browser clients. "Couldn't verify from here", not dead.
9. Mount Rainier's 2026 timed-entry rule — NPS has not published it yet. Needs a recurring check.
10. Glacier's 2026 Logan Pass shuttle ticket price.
11. Amtrak deep-link parameters — the booking page loads but origin/destination/date parameter
    names are undocumented, so **no honest `{DATE}` template exists for Amtrak**.
12. FMM tourist card tariff; CONANP bracelet amounts for Cabo Pulmo and Bahía de Loreto.
13. All hostel dorm rates — Hostelworld 404'd on every URL form tried.
14. USC academic calendar 2026-27 break windows, for the date-picker presets.
---

# Part 0 — Cross-cutting facts that change every costing

These apply across many destinations. Put them in the seed as shared constants, not repeated per
destination.

## 0.1 The 2026 National Park Service non-resident pricing change

This is the most consequential finding in the document, because every user of this app is a
foreign national.

| Item | Amount | Applies to | Confidence |
|---|---|---|---|
| America the Beautiful annual pass, US residents | $80 | per pass, covers a vehicle at per-vehicle parks | high |
| America the Beautiful annual pass, **non-US residents** | **$250** | per pass | high |
| **Non-resident surcharge at 11 named parks** | **$100** | **per person** | high |
| Standard entrance where no surcharge applies | unchanged | per vehicle | high |

The $100 per-person surcharge applies only at eleven named parks. Joshua Tree and Channel
Islands are **not** among them, so a student pays the ordinary $30/vehicle at Joshua Tree.

**The arithmetic the app should do for the user:** at $250, the non-resident annual pass needs
roughly eight per-vehicle park entries to break even, and it does *not* waive the $100
per-person surcharge at the surcharge parks. For a one-semester student doing three or four
parks, buying entry at the gate each time is cheaper. Say this plainly on the card. Note also
that the pass is per-vehicle at the gate, so a car of four splitting a single $30 entry pays
$7.50 each — the pass is almost never the right answer for a carload of students.

Source: nps.gov fee pages. *Confidence: high on the figures. Because this is new and politically
live, the app should re-verify against nps.gov before quoting it to a user, and the seed should
carry a `verify_before_quoting` flag on this constant.*

## 0.2 The USC U-Pass — the single most useful fact for a car-free student

The U-Pass is included in the transportation fee already charged to every registered USC
student. It is not an add-on purchase. It covers:

- LA Metro rail and bus (the B/D subway, the A, E, K and C light rail lines, and Metro bus)
- LADOT DASH
- Big Blue Bus (Santa Monica)
- Culver CityBus
- Long Beach Transit
- Foothill Transit
- Torrance Transit, Gardena (GTrans), Norwalk Transit

It does **not** cover Metrolink, Amtrak, or the LAX FlyAway.

The practical effect: Santa Monica, Venice, Long Beach, Pasadena, Koreatown, Hollywood, Griffith
Park, the Getty and Downtown are all **zero marginal transport cost** for a USC student. That
should reorder the idea bank. A "free today" filter is a genuinely useful product feature and
this is what makes it possible.

Source: USC Transportation. *Confidence: high. The app should still link the U-Pass activation
page, because students must opt in through their account before it works.*

## 0.3 Verified transit fares and fixed prices from LA

| Operator / item | Fare | Notes | Confidence |
|---|---|---|---|
| LA Metro | $1.75 per ride | $5 daily cap, $18 weekly cap via TAP. Free with U-Pass | high |
| Big Blue Bus | $1.25 | contactless. Free with U-Pass | high |
| Metrolink SoCal Day Pass | $10 | weekends; 50% student discount on top | high |
| Amtrak Pacific Surfliner | varies by leg | **15% student discount, ages 25 and under**; November blackout dates | high |
| Adventure Pass (Angeles / San Bernardino NF) | $5/day or $30/year | required at developed sites; America the Beautiful substitutes | high |
| Palm Springs Aerial Tramway | $36.95 adult | high |
| Antelope Valley Poppy Reserve | $10/vehicle | high |
| Getty Center | free admission, $25 parking | parking is the real cost | high |
| Catalina Express round trip | **$99.00 all-in** from Long Beach or San Pedro ($89.00 + $10.00 fee/tax); $106.00 from Dana Point | high |
| Channel Islands NP entrance | **$0** — there is no entrance fee | the boat is the cost | high |
| Joshua Tree NP | $30/vehicle, $25/motorcycle, $15/person on foot, 7 days | high |
| Mountain Transit, San Bernardino to Big Bear | $10 each way | Mon/Wed/Fri only | high |
| Big Bear Trolley | free | three routes, reaches both ski resorts | high |

**Correction to a widely repeated myth:** the Catalina Express free birthday trip **no longer
exists**. It ran from 2011 to 2017 as a 30th-anniversary promotion and ended on 31 December
2017. Travel blogs still list it. Do not put it in the app; it is exactly the kind of stale
promise that makes the product's accuracy claim false.

A second correction: a search snippet circulating puts the Catalina Express adult round trip at
$84.50. The operator's own fares page contradicts it. Use $99.00.

## 0.4 Fuel

California average verified at **$5.74/gal**, materially higher than the $4.80 commonly assumed.
At 30 mpg a 400-mile round trip is about $77 of petrol; split four ways, $19 a head. Use $5.74
in the seed and mark it as a live-lookup field, since it moves.

*Confidence: high at time of checking; inherently volatile.*
## 0.5 Channel Islands National Park — verified directly

Source: nps.gov/chis/planyourvisit/fees.htm and nps.gov/chis/planyourvisit/camping.htm

- **There is no entrance fee.** "An entrance pass is not required to access Channel Islands
  National Park." The boat crossing is the entire cost of entry. Confidence: high.
- **Reservations are required for all park campgrounds**, bookable **up to six months in advance
  on recreation.gov**. Confidence: high.
- **Only Scorpion Canyon on Santa Cruz Island has drinking water.** Anacapa, Santa Rosa, San
  Miguel and Santa Barbara campgrounds have none — you carry every litre you will drink.
  Confidence: high.
- The park's own guidance is to find dates on which **both** a boat ticket and a campsite are
  available before booking either. That double constraint is the practical catch: students book
  the campsite, then discover the boat is full, and the campsite is non-refundable.
- **Island Packers fares could not be verified from here** — islandpackers.com returned 403 to a
  non-browser client. Per the project's own rule, that is "couldn't verify from here", not a dead
  link. Fares must be looked up live before being shown as a costed line.
# Part 1 — Day trips

Everything here is out and back from USC in one day. The ordering principle throughout: the
U-Pass every USC student already pays for covers LA Metro rail and bus, LADOT DASH, Big Blue Bus,
Culver CityBus, Long Beach Transit, Foothill Transit, Torrance Transit, GTrans and Norwalk
Transit — so a destination on those networks costs nothing to reach. It does **not** cover
Metrolink, Amtrak or the LAX FlyAway. That single line reorders this list: Santa Monica, Venice,
Long Beach, Pasadena, the Getty and Griffith are effectively free to get to, and Big Bear,
Santa Barbara and San Diego are not.

Two standing notes that apply to nearly every entry and are not repeated in full each time:

- **Car rental is mostly not an option.** Enterprise's California minimum is 21, with a
  young-renter fee around $25/day for 21–24, and some branches want a credit card rather than a
  debit card. A 19-year-old cannot hire a car in California at all. Where an entry says "a car is
  realistic", it means *somebody in the group is 21+ and has a credit card*, which is a real
  constraint, not a formality.
- **Fuel maths.** California petrol is $5.74/gal. At 30 mpg a 400-mile round trip is about $77,
  which is roughly $19 a head split four ways. Individual entries give the round-trip figure.

Confidence is marked per line. `high` = read off the operator's or agency's own page; `medium` =
a secondary source consistent with others; `low` = single source or a number that moves.
`unverified` means exactly that — do not print it as fact.

---

## 1. Santa Monica and Venice

- **id**: `santa-monica-venice`
- **region**: Westside coast
- **tier**: `day`
- **reason**: The one day trip that costs nothing but the food — a train from campus puts you on
  the sand, and the three miles of boardwalk between the pier and Venice is the best free
  afternoon in the county.
- **distance_from_usc**: 16 miles road
- **drive_time**: 35 min off-peak, 70–85 min on the I-10 westbound on a Friday afternoon. The
  train beats the car at rush hour, which is unusual for LA and worth saying out loud.
- **carfree**: **yes**. Metro E Line (formerly Expo) from Expo Park/USC straight through to
  Downtown Santa Monica, no changes, roughly 45–50 min end to end, trains every 8–12 min.
  **Covered by the U-Pass — $0 marginal.** For Venice, either walk/cycle the boardwalk south from
  the pier (about 2.5 miles, 50 min) or take Big Blue Bus Route 1 down Main Street, also
  U-Pass-covered. Metro trip planner: https://www.metro.net/riding/trip-planner/
- **car_notes**: Santa Monica city structures on 2nd and 4th run around $3 for the first 90 min
  then step up; beach lots off PCH and at the pier are $12–20 flat in summer. Venice lots
  (Windward, Rose Ave) $15–25 on a summer weekend. A car here is a liability, not an asset.
- **hours_needed**: 5–9
- **best_months**: September and October — the water is at its warmest and the June marine layer
  has gone. April–May are pleasant but the mornings are grey.
- **worst_months**: June and early July. "June Gloom" is a real overcast layer that sits on the
  coast until early afternoon; people plan a beach day and get a cold grey one.
- **fixed_costs**:

  | Item | Amount | Per | Source URL | Confidence |
  |---|---|---|---|---|
  | Metro E Line round trip | $0 with U-Pass (otherwise $1.75/ride, $5 daily cap) | person | https://www.metro.net/riding/fares/ | high |
  | Big Blue Bus Route 1 | $0 with U-Pass (otherwise $1.25) | person | https://www.bigbluebus.com/Fares/index.aspx | high |
  | Santa Monica Pier admission | $0 | person | https://santamonicapier.org/ | high |
  | Pacific Park single ride | $12 | person | https://pacpark.com/tickets/ | medium |
  | Pacific Park unlimited wristband | $59.95 | person | https://pacpark.com/tickets/ | medium |

- **variable_costs**: Food on the pier is a tourist tax — $18–25 for a mediocre plate. Walk two
  blocks inland to Santa Monica Place or the Third Street Promenade and it is $12–15. Bike hire on
  the boardwalk $10–15/hour, $30–40/day. Beach volleyball and the sand are free.
- **age_gates**: Nothing on the beach. Bars on Main Street and Abbot Kinney are 21+ after about
  9pm and card at the door — a foreign passport is accepted, a foreign driving licence is often
  refused by LA door staff who cannot read it. Carry the passport.
- **licence_credit_friction**: None. Everything takes contactless.
- **catch**: Venice Beach boardwalk is not the postcard. The stretch north of Windward has a
  visible, sometimes confronting homeless encampment presence and aggressive street vending, and a
  lot of first-time visitors find the walk south from Santa Monica gets steadily grimmer. Go for
  the Venice canals and Abbot Kinney instead and treat the boardwalk as a five-minute look.
- **links**:
  - Metro fares: https://www.metro.net/riding/fares/
  - Big Blue Bus: https://www.bigbluebus.com/Fares/index.aspx
  - Pacific Park tickets: https://pacpark.com/tickets/
- **confidence**: high on transport, medium on Pacific Park pricing

---

## 2. Venice canals

- **id**: `venice-canals`
- **region**: Westside coast
- **tier**: `day`
- **reason**: Two hours of narrow footbridges and other people's back gardens, half a mile from
  the boardwalk and nothing like it — the one bit of Venice that lives up to the name.
- **distance_from_usc**: 16 miles road
- **drive_time**: 35–60 min
- **carfree**: **yes**. Metro E Line to Downtown Santa Monica then Big Blue Bus Route 1 south, or
  Metro Line 33 west along Venice Blvd from downtown. About 70–80 min from campus. **Both legs
  U-Pass-covered — $0.**
- **car_notes**: Residential permit parking covers most of the canal district. The free-for-two-
  hours spots on Dell Ave fill by 10am. Metered lots on Washington Blvd $2–3/hr.
- **hours_needed**: 2–3, best bolted onto a Santa Monica or Abbot Kinney day
- **best_months**: Any. Late afternoon light in autumn is the reason people photograph it.
- **worst_months**: None specifically; the canals are drained for maintenance for a few weeks
  most winters, which is worth checking before making the trip the point of the day.
- **fixed_costs**:

  | Item | Amount | Per | Source URL | Confidence |
  |---|---|---|---|---|
  | Admission | $0 — public footpaths | person | https://www.laconservancy.org/ | high |
  | Transit | $0 with U-Pass | person | https://www.metro.net/riding/fares/ | high |

- **variable_costs**: Nothing required. Coffee and food on Abbot Kinney, five minutes' walk, run
  expensive — $7 for a flat white is normal there.
- **age_gates**: None.
- **licence_credit_friction**: None.
- **catch**: It is somebody's neighbourhood. The footpaths pass within a few feet of living-room
  windows, and residents are visibly tired of tour groups. It is also small — 30–40 minutes covers
  it properly — so do not build a day around it.
- **links**: https://www.google.com/maps/place/Venice+Canals+Walkway
- **confidence**: high

---

## 3. Griffith Observatory and Griffith Park

- **id**: `griffith-observatory`
- **region**: Central LA / Hollywood Hills
- **tier**: `day`
- **reason**: Free public telescopes on a clear night and the whole basin laid out below — the
  cheapest good view in Los Angeles, and reachable without a car, which almost nothing up a
  hill is.
- **distance_from_usc**: 12 miles road
- **drive_time**: 30 min off-peak, 50–60 min at weekends when the road up backs up
- **carfree**: **yes**. Metro B Line (Red) from 7th St/Metro Center to Vermont/Sunset, then LADOT
  **DASH Observatory/Los Feliz**, which runs daily 10am–10pm and drops at the horseshoe driveway
  in front of the building, every 20–25 min. Roughly 60–70 min from campus. **Both legs are
  U-Pass-covered — $0** (the DASH cash fare is $0.50, $0.35 with TAP, if you are paying).
  https://griffithobservatory.lacity.gov/visit/getting-here/
- **car_notes**: Roadside parking on the approach roads is metered $4/hr 12pm–10pm and the lot at
  the top fills by mid-morning at weekends. People routinely park a mile down the hill and walk.
  The DASH is genuinely the better option.
- **hours_needed**: 4–6, and it should include sunset
- **best_months**: November–March. Cold clear nights, sunset at 5pm so you get dark sky without
  staying out until 10. October is the compromise.
- **worst_months**: June–July — the marine layer often sits over the basin, and sunset at 8pm
  means the telescopes do not open usefully until late.
- **fixed_costs**:

  | Item | Amount | Per | Source URL | Confidence |
  |---|---|---|---|---|
  | Observatory admission | $0 | person | https://griffithobservatory.lacity.gov/ | high |
  | Public telescope viewing | $0 | person | https://griffithobservatory.lacity.gov/ | high |
  | Samuel Oschin Planetarium — adult 13–54 | $10.00 | person | https://griffithobservatory.lacity.gov/exhibits/samuel-oschin-planetarium/ | high |
  | Planetarium — student with ID | $8.00 | person | https://griffithobservatory.lacity.gov/exhibits/samuel-oschin-planetarium/ | high |
  | Transit | $0 with U-Pass | person | https://www.metro.net/riding/fares/ | high |

- **variable_costs**: The Café at the End of the Universe is $12–16 for a sandwich. Los Feliz
  village, at the bottom of the DASH route, is better value. Bring water — the hike to the
  Hollywood Sign viewpoint from the observatory is exposed and there is nothing on the trail.
- **age_gates**: None.
- **licence_credit_friction**: Planetarium tickets are sold at the door and take cards; no ID
  needed for the student rate beyond a USC card.
- **catch**: The observatory is closed on Mondays. People make the trip up on a Monday afternoon
  every single week and find the doors shut — the grounds and the view stay open, but the
  telescopes, exhibits and planetarium do not.
- **links**:
  - https://griffithobservatory.lacity.gov/visit/getting-here/
  - Planetarium schedule: https://griffithobservatory.lacity.gov/exhibits/samuel-oschin-planetarium/
- **confidence**: high

---

## 4. The Getty Center

- **id**: `getty-center`
- **region**: Westside / Brentwood
- **tier**: `day`
- **reason**: Free admission, a tram up a hillside, and Robert Irwin's garden — the strongest
  argument in LA that the best thing in town does not have to cost anything.
- **distance_from_usc**: 17 miles road
- **drive_time**: 30 min off-peak, 60–75 min on the 405 at almost any other time
- **carfree**: **partial, leaning yes**. Metro E Line to Expo/Sepulveda, then Metro Line 234
  (weekends) or 734 (weekdays) north on Sepulveda to Getty Center Dr; Rapid 761 also stops at the
  entrance. About 80–95 min from campus with one change. **All Metro legs are U-Pass-covered —
  $0.** The site tram from the car park to the museum is free and included.
  https://www.getty.edu/visit/center/parking-and-transportation/
- **car_notes**: **$25 per car**, $15 after 3pm, $10 after 6pm, and free on Saturdays after 6pm.
  Cashless — cards only. Split four ways that is $6.25 each, which beats nothing but not by much
  given the bus is free.
- **hours_needed**: 5–7 including travel
- **best_months**: October–May. The garden is at its best in spring; the view to the ocean is
  clearest after winter rain.
- **worst_months**: July–August, when the hilltop is exposed and hot and the queue for the tram
  is long. Closed Mondays.
- **fixed_costs**:

  | Item | Amount | Per | Source URL | Confidence |
  |---|---|---|---|---|
  | Admission | $0 (free timed-entry reservation required) | person | https://www.getty.edu/visit/center/ | high |
  | Parking | $25.00 / $15 after 3pm / $10 after 6pm / free Sat after 6pm | vehicle | https://www.getty.edu/visit/center/parking-and-transportation/ | high |
  | Tram to hilltop | $0, included | person | https://www.getty.edu/visit/center/parking-and-transportation/ | high |
  | Transit | $0 with U-Pass | person | https://www.metro.net/riding/fares/ | high |

- **variable_costs**: Restaurant mains $22–32; the cafe and coffee cart are $10–15. You may bring
  food and eat it in the picnic area, which most people do not know.
- **age_gates**: None.
- **licence_credit_friction**: Parking is card-only, no cash accepted. A debit card works fine.
- **catch**: Free admission still needs a **timed-entry reservation**, and summer weekend slots go
  days ahead. Turning up without one on a Saturday in July means being turned away at the bottom
  of the hill after an hour and a half on the bus.
- **links**:
  - Reservations: https://www.getty.edu/visit/center/
  - Parking and transport: https://www.getty.edu/visit/center/parking-and-transportation/
- **confidence**: high

---

## 5. The Getty Villa

- **id**: `getty-villa`
- **region**: Pacific Palisades / Malibu edge
- **tier**: `day`
- **reason**: A recreated Roman country house on a cliff above PCH, with the antiquities to fill
  it — nothing else on this coast is remotely like it, and it is also free.
- **distance_from_usc**: 26 miles road
- **drive_time**: 45 min off-peak, 80+ min at rush hour
- **carfree**: **partial**. Metro E Line to Downtown Santa Monica, then Metro Line 134 west on PCH
  to the Villa entrance; both U-Pass-covered, so **$0**, but the total is 100–120 min each way and
  the 134 is infrequent. Verify the current stop and headway before committing —
  https://www.metro.net/riding/trip-planner/ — and note that PCH through the Palisades has been
  subject to closures and reduced service since the January 2025 fires, so **route status is
  `unverified` and must be checked on the day**.
- **car_notes**: Parking $25/car, same structure as the Getty Center. Realistic only if someone is
  21+ with a card.
- **hours_needed**: 5–7
- **best_months**: April–June and September–October. The outdoor peristyle gardens are the point
  and they want mild weather.
- **worst_months**: Deep winter — the gardens are the reason to go and they are bare.
- **fixed_costs**:

  | Item | Amount | Per | Source URL | Confidence |
  |---|---|---|---|---|
  | Admission | $0, free timed-entry ticket required | person | https://www.getty.edu/visit/villa/ | high |
  | Parking | $25.00 | vehicle | https://www.getty.edu/visit/villa/parking-and-transportation/ | medium |
  | Transit | $0 with U-Pass | person | https://www.metro.net/riding/fares/ | high |

- **variable_costs**: Cafe $12–18. Bring lunch; there are tables.
- **age_gates**: None.
- **licence_credit_friction**: None beyond card-only parking.
- **catch**: The Villa closed for extended periods after the Palisades fire and its access road is
  the single most fragile bit of infrastructure on this list. Always check the Getty's own
  "current conditions" notice the morning of the trip — a two-hour bus ride to a closed gate is
  the failure mode here.
- **links**: https://www.getty.edu/visit/villa/
- **confidence**: medium — admission and the free-ticket requirement are high; access is not

---

## 6. The Huntington Library, Art Museum and Botanical Gardens

- **id**: `huntington-library`
- **region**: San Gabriel Valley / San Marino
- **tier**: `day`
- **reason**: A hundred and thirty acres of botanical garden with a Gutenberg Bible in the middle
  of it — the Japanese and Chinese gardens alone justify the fare, and it is the one place on this
  list where four hours genuinely is not enough.
- **distance_from_usc**: 18 miles road
- **drive_time**: 30 min off-peak, 55 min at rush hour
- **carfree**: **partial**. Metro A Line to Allen Station in Pasadena, then Pasadena Transit
  Route 10 south to Allen and California, then about a 15-minute walk. 80–100 min from campus.
  The Metro A Line is **U-Pass-covered — $0**; **Pasadena Transit is not on the U-Pass list**, so
  budget its cash fare separately (`unverified` — check
  https://www.cityofpasadena.net/pasadena-transit/ ). Foothill Transit, which *is* covered, serves
  the wider San Gabriel Valley but not the Huntington gate directly.
- **car_notes**: **Parking is free**, which is rare enough in this county to be a selling point.
  A car saves about 45 minutes each way.
- **hours_needed**: 6–8. Half a day is a waste of the ticket.
- **best_months**: March–April for the flowering cherries and the rose garden; October–November
  for the Japanese garden's maples. Both are the reason to go.
- **worst_months**: July–August. San Marino sits inland and regularly runs 10–15°F hotter than
  campus, and the gardens have limited shade.
- **fixed_costs**:

  | Item | Amount | Per | Source URL | Confidence |
  |---|---|---|---|---|
  | Adult admission | $29.00 | person | https://www.huntington.org/plan-your-visit | medium |
  | **Student admission with ID** | $24.00 | person | https://www.huntington.org/plan-your-visit | medium |
  | Free-day admission (first Thursday monthly) | $0 | person | https://tickets.huntington.org/ | medium |
  | Parking | $0 | vehicle | https://www.huntington.org/plan-your-visit | medium |

- **variable_costs**: Tea in the Rose Garden Tea Room is a set price in the $50s and books out
  weeks ahead — skip it. The cafe is $14–18.
- **age_gates**: None.
- **licence_credit_friction**: None. The student rate wants a student ID, which a USC card
  satisfies.
- **catch**: The **first-Thursday free tickets are released at 9am on the last Thursday of the
  preceding month and are gone within the hour**. Everyone plans to go on a free day and almost
  nobody actually gets a ticket. Budget the $24 student rate and treat a free day as a bonus.
  Closed Tuesdays.
- **links**:
  - Tickets: https://tickets.huntington.org/
  - Free day: https://tickets.huntington.org/events/2f050e3c-376e-7cfe-3186-6d78dc663457
- **confidence**: medium — prices from a consistent set of secondary sources; the site itself
  returned partial content

---

## 7. DTLA — the Broad, MOCA and the Arts District

- **id**: `dtla-arts`
- **region**: Downtown LA
- **tier**: `day`
- **reason**: Two world-class contemporary collections that are both free, fifteen minutes from
  campus on a train you have already paid for — this is the highest value per dollar of anything
  in the county.
- **distance_from_usc**: 4 miles road
- **drive_time**: 15 min, 30 min at rush hour
- **carfree**: **yes**. Metro E Line from Expo Park/USC to Grand Av Arts/Bunker Hill for the
  Broad and MOCA, 15–20 min. For the Arts District, E or A Line to Little Tokyo/Arts District.
  **U-Pass-covered — $0.**
- **car_notes**: Bunker Hill garages are $20–30 for the day, or $9–15 evenings and weekends with
  validation. Do not drive this one.
- **hours_needed**: 4–7
- **best_months**: Any. Indoor.
- **worst_months**: None, though the Arts District walk is unpleasant in an August heatwave.
- **fixed_costs**:

  | Item | Amount | Per | Source URL | Confidence |
  |---|---|---|---|---|
  | The Broad — general admission | $0, free timed ticket required | person | https://www.thebroad.org/tickets | high |
  | The Broad — special exhibitions | ticketed separately, price varies | person | https://www.thebroad.org/tickets | medium |
  | MOCA Grand Avenue | $0 every day, free timed reservation | person | https://www.moca.org/visit/hours-tickets-admission | high |
  | Transit | $0 with U-Pass | person | https://www.metro.net/riding/fares/ | high |

- **variable_costs**: Grand Central Market $12–18 a plate. Arts District coffee and bakeries
  $8–14. Nothing else is compulsory.
- **age_gates**: Arts District breweries — Angel City, Arts District Brewing — are 21+ and card
  hard. Under-21s should plan around this rather than turn up and be refused.
- **licence_credit_friction**: None.
- **catch**: **Yayoi Kusama's Infinity Mirrored Room is not included in walking in.** It needs a
  separate same-day reservation released in the morning through the Broad's app, and it goes in
  minutes. Nearly everyone who visits the Broad specifically to see it does not see it. Set
  expectations before the trip, not in the queue.
- **links**:
  - https://www.thebroad.org/tickets
  - https://www.moca.org/visit/hours-tickets-admission
- **confidence**: high
---

# Part 5 — Season-specific trips and dated events

Researched directly. Dates below are announced 2027 dates, verified against announcements.

## 5.1 Festivals with confirmed 2027 dates

| Festival | 2027 dates | Location | Distance from LA | Entry price | Confidence |
|---|---|---|---|---|---|
| Coachella weekend 1 | **9–11 April 2027** | Empire Polo Club, Indio | ~135 mi, 2h15 | 3-day GA from **$599** advance | high |
| Coachella weekend 2 | **16–18 April 2027** | Indio | same | 3-day GA from **$549** advance | high |
| Stagecoach | **23–25 April 2027** | Empire Polo Club, Indio | same | advance passes on sale 18 June | high |
| EDC Las Vegas "Dusk" | **14–16 May 2027** | Las Vegas Motor Speedway | ~270 mi, 4h | unverified | high on dates |
| EDC Las Vegas "Dawn" | **21–23 May 2027** | same | same | unverified | high on dates |
| Lightning in a Bottle | **26–30 May 2027** | Buena Vista Lake, Bakersfield | ~120 mi, 2h | 5-day pass, price unverified | high on dates |
| Outside Lands | **6–8 August 2027** | Golden Gate Park, San Francisco | ~380 mi | unverified | high on dates |

Sources: coachella.com and the April 2026 announcement coverage; billboard.com and ticketnews.com
for Stagecoach; lasvegas.edc.com; libfestival.org; outsidelands.frontgatetickets.com.

Notes for the seed: EDC Las Vegas moved to **two weekends** in 2027, a change from prior years.
Coachella weekend 2 is $50 cheaper than weekend 1 and is the better buy for a budget student;
the lineup is the same.

**The catch on Coachella:** the ticket is the small half of the cost. Indio accommodation during
the festival is priced like a different city, and camping passes sell out in the first sale. A
student who buys a GA pass in May and thinks about lodging in March will pay more for the bed
than the ticket. Car camping on site is the only cost-controlled option and it must be bought at
the same time as the pass.

**Age gates:** Coachella and Stagecoach are all-ages. EDC Las Vegas is **18+**, not 21+, which is
unusual and worth flagging — but the alcohol areas inside are 21+, and Nevada hotel check-in is
commonly 21+, which is the real obstacle for a 19-year-old.

## 5.2 Ski and snowboard season

| Resort | 2026–27 season | Lift ticket | Notes | Confidence |
|---|---|---|---|---|
| Mammoth Mountain | est. **20 Nov 2026 – 6 Jun 2027** | from **$89** advance; walk-up **$149–$269**; Jan midweek special **$99**; Quad Pack+ **$115/day** | 5h from LA. Longest season in California | medium-high |
| Big Bear (Snow Summit / Bear Mountain) | est. **4 Dec 2026 – 21 Mar 2027** (Summit), **– 27 Mar** (Bear) | **$89–$169** adult | ~2h from LA, the only ski day trip | medium |
| Brian Head, Utah | 2026–27 on sale | **from $9** advance, with $10 resort credit | ~6h30. The cheapest lift ticket in the American West | high |
| Park City / Vail resorts | Epic Pass 2026–27 | **Epic Pass $869 ages 13–30** (vs $1,089 for 31+); **Epic Local $649 ages 13–30** | new Gen Z tier, ~20% off | high |
| Lake Tahoe | — | — | **443 mi, ~7h30–8h** from LA. A long-weekend minimum, not a weekend | high |

Sources: mammothmountain.com/plan-your-trip/tickets/winter-lift-tickets;
bigbearmountainresort.com/ski-and-snowboard/lift-tickets; brianhead.com/lift-tickets;
epicpass.com/info/college.aspx and the Vail Resorts investor release on the Gen Z tier.

**The Brian Head finding is the standout.** Lift tickets from $9 with $10 of resort credit
attached means the ticket is effectively free and you are up on the deal. For a student who has
never skied and wants to try it once, Brian Head at $9 plus a shared drive beats Mammoth at $89
by a distance, even accounting for the extra driving. It is a small mountain and an experienced
skier will be bored, so the card should say both things.

**The Epic Pass Gen Z tier matters** because the entire user base is 19–23. The $869 Epic Pass is
worth it only for someone skiing 8+ days; the $649 Epic Local is the realistic one, and even that
needs about six days to beat buying tickets. For one semester, buying day tickets is usually
right — unless the student is going to Tahoe or Park City repeatedly.

### Getting to the snow without a car

- **Big Bear:** Metrolink to San Bernardino, then **Mountain Transit** into Big Bear Lake, **$10**
  each way, running **Monday, Wednesday and Friday only** — which does not align with a student
  weekend, and that is the catch. Once there, the **Big Bear Trolley is free**, with three routes
  (Red, Blue, Gold) reaching both ski resorts, the Village and the supermarkets.
  Source: mountaintransit.org, bigbear.com/travel-tools/public-transportation.
- **Ski bus:** the **Sports Basement Ski Bus** runs to Snow Summit on select Saturdays and
  Sundays through the 2026–27 season, **$80 per seat per day**, departing from South Bay, Long
  Beach or Orange County. For a car-free student this is the realistic option, and $80 plus an
  $89 lift ticket is a costed, bookable snow day.
- **Mammoth:** the Eastern Sierra Transit Authority "395 route" is the only scheduled service;
  see the Sierra section.

*Confidence: high on the Mountain Transit $10 and the free trolley; medium on the ski bus, which
should be re-verified each season.*

## 5.3 Whale watching

| Species | Season | Where | Confidence |
|---|---|---|---|
| Grey whale (migration, ~20,000 animals) | **December – April** | Long Beach, San Pedro, Newport, Dana Point; shore from Point Dume and Palos Verdes | high |
| Blue whale | **May – November**, best **June – September** | offshore Santa Monica Bay and Santa Barbara Channel | high |
| Humpback, fin, minke | May – September | same | high |
| Dolphins (common, bottlenose, Risso's, Pacific white-sided) | year-round | same | high |

Sources: nps.gov/places/whale-watching.htm; visitcalifornia.com; operator pages at 2seewhales.com
and daveyslocker.com.

Boat trips run from Long Beach, San Pedro, Newport Beach and Santa Monica. Long Beach is
reachable on the Metro A Line, free with the U-Pass, which makes it the cheapest departure point
for a USC student. Newport is about 45 minutes' drive from downtown.

**The catch:** operators advertise a sighting guarantee, which in practice means a free repeat
trip rather than a refund. A student with one free Saturday and no car cannot use a repeat
voucher. Book in the grey whale peak (January–March) when the odds are best, not in the shoulder.

## 5.4 Superbloom and wildflowers

The 2026 season was a genuine superbloom at **Carrizo Plain** — confirmed by NASA Earth
Observatory imagery and the California Native Plant Society — while the **Antelope Valley
California Poppy Reserve never reached superbloom status** that year. That asymmetry is the
lesson: the famous poppy reserve is the reliable one, not the spectacular one.

- **Typical window:** March–April at low desert elevations, extending into May–June at higher
  elevations.
- **Carrizo Plain:** peaks toward the end of March, varies with rainfall and species.
- **Antelope Valley:** mid-March to May. Day-use fee **$10/vehicle**.
- **Live check:** the Theodore Payne Foundation Wildflower Hotline publishes weekly updates from
  March to May — 818-768-1802 ext. 7, also on Spotify and Apple Podcasts. The app should link
  this rather than predict a bloom.

**The catch:** superblooms are not annual and cannot be forecast more than about two weeks out.
Any app card promising wildflowers on a fixed date is lying. Build this destination as a
"check the hotline the week before" card, with the $10/vehicle Poppy Reserve fee as the only
fixed cost.

*Confidence: high on the 2026 outcome and the hotline; the bloom itself is inherently low
confidence and the product should say so.*

## 5.5 Season-to-trip mapping for the idea bank

| Window | What is in season | What is closed or bad |
|---|---|---|
| Sept–Oct | Desert reopens, Sierra still fully open (Tioga Pass), coast at its warmest and clearest | Death Valley still very hot early Sept |
| Nov–Dec | Grey whales arrive, ski season opens, desert perfect | Tioga Pass closes, Sierra high country shuts |
| Jan–Mar | Peak grey whale, peak ski, desert at its best, Death Valley ideal | Big Sur storm-slide risk, Sierra passes shut |
| Mar–Apr | Superbloom, Coachella/Stagecoach, desert still comfortable | Spring break crowds and pricing |
| May–Jun | Blue whales arrive, Tioga Pass reopens (usually late May/June), festivals | Coastal June Gloom, desert heating fast |
| Jul–Aug | Sierra fully open, Pacific Northwest and Alaska at their best | Death Valley and the low desert genuinely dangerous; AZ/UT monsoon flash floods |
---

# Part 6 — Renting a car at 20 on a foreign licence

This is the friction that the whole product exists to surface. Below, the part verified against
a company's own page is separated from the part that still needs verifying, because presenting
the second as the first is exactly the failure mode the accuracy rules forbid.

## 6.1 Verified against the operator's own page

### Enterprise (verified high confidence)

Source: enterprise.com/en/help/faqs/car-rental-under-25.html

- **Minimum rental age is 21 throughout the US**, except Michigan and New York where it is 18.
  US government employees on official orders may rent at 18.
- **Young renter fee, ages 21–24: approximately $25/day** in most states, varying by location.
- Michigan: $34/day for 18–20, $15.50/day for 21–24. New York: $68.75/day for 18–20, $33.25/day
  for 21–24. These are the outliers and are quoted because they show the shape of the fee.
- **Vehicle classes available to 21–24:** economy through full-size cars, minivans, cargo vans,
  standard pickups, and compact to standard SUVs up to 5 passengers. Everything above that is
  barred.
- **Required at the counter:** valid photo driving licence and a valid debit or credit card —
  *some locations require a credit card*. That conditional is where a student with no US credit
  card gets turned away, and it is location-specific, so it cannot be resolved online in advance.

**What this means in money.** A three-day weekend in a compact at, say, $45/day is $135. The
under-25 fee adds roughly $75. The surcharge is over half the base rate again. Any cost line the
app shows for a driving trip must include it, or the number is wrong by more than the 10%
tolerance the pricing ledger allows.

## 6.2 Established framework, verification still outstanding

The following are the shape of the rules as generally documented, but the session's search
budget was exhausted before each could be confirmed against the company's own terms page, and
several company pages returned 404 or an empty body to a direct fetch. **Treat every figure in
this subsection as `unverified`. Do not render any of it as an `api`-sourced line.**

| Company | Min age CA | Under-25 fee/day | Rents 18–20 | Status |
|---|---|---|---|---|
| Hertz | 20 (believed) | ~$19–$35 | limited | unverified |
| Avis | 21 | ~$27 | no | unverified |
| Budget | 21 | ~$27 | no | unverified |
| National | 21 | ~$25 | no | unverified |
| Alamo | 21 | ~$25 | no | unverified |
| Dollar | 20 (believed) | ~$25–$35 | limited | unverified |
| Thrifty | 20 (believed) | ~$25–$35 | limited | unverified |
| Sixt | 21 | ~$30+ | no | unverified |
| Fox Rent A Car | 21 | ~$25 | no | unverified |
| Payless | 21 | ~$27 | no | unverified |
| Turo | 18 in some states, 21 typical | tiered young-driver fee | varies by host | unverified |
| Zipcar (university members) | 18 where a university partnership exists | membership-based, no daily surcharge | yes, via university | unverified |

**Research to-do, in priority order for whoever picks this up:**

1. **Zipcar for Universities and whether USC participates.** This is the single highest-value
   unresolved question in the document. If USC has a Zipcar partnership, the minimum age drops to
   18, petrol and insurance are bundled into the hourly rate, and the under-25 surcharge problem
   disappears entirely for short trips. That would change the recommendation on perhaps a dozen
   destinations. The fetch to zipcar.com/university redirected to a host that did not resolve, so
   this is genuinely open. Check transnet.usc.edu as well as zipcar.com.
2. **Which companies accept a debit card at LAX and under what conditions.** Enterprise's own
   wording ("some locations require a credit card") shows the answer is per-branch. A student with
   a Revolut or Wise card needs to know before booking, not at the counter.
3. **AAA membership as a young-driver-fee waiver at Hertz.** Widely claimed. If true, a ~$70 AAA
   membership pays for itself in three rental days and is the best single piece of advice the app
   could give a 22-year-old. Verify before publishing it.
4. **Each company's foreign-licence and IDP policy**, in writing.

## 6.3 The foreign licence question

California does **not** require an International Driving Permit to drive on a valid foreign
licence as a visitor — the licence itself is what confers the privilege, and the IDP is a
translation, not a permit. *(This is the well-established position; the dmv.ca.gov visitor page
returned 404 at the URL tried, so mark it `unverified` and confirm before publishing.)*

Two things follow that matter more than the IDP question itself:

- **Rental companies set their own rule, independent of state law.** Several ask for an IDP or a
  certified translation when the licence is not in the Roman alphabet, regardless of what
  California requires. So the answer to "do I need an IDP" is "the state says no, your rental
  company might say yes", and the app should say exactly that.
- **An IDP can only be issued in your home country.** You cannot obtain one in the United States
  for a foreign licence. A student who arrives without one cannot fix it later. That is a
  before-you-fly action item, and it belongs in an arrival checklist rather than on a trip card,
  because by the time someone is browsing Joshua Tree it is too late.

**The residency trap.** A student who establishes California residency is expected to obtain a
California licence within a defined window. Whether an F-1 student on a temporary programme
counts as a resident for this purpose is the question, and it is not the same as the tax or
tuition definition of residency. Confirm against dmv.ca.gov and USC OIS before the app asserts
anything, because getting this wrong exposes a user to a citation.

## 6.4 The realistic workarounds, ranked

1. **Do not drive.** For a large share of the day trips, the U-Pass already covers the journey and
   the marginal cost is zero. The app should exhaust the car-free options before offering a rental
   line at all.
2. **Be a passenger.** Four students splitting one car means one person needs to clear the age and
   card hurdle, not four. Fuel at $5.74/gal split four ways is $19 a head for a 400-mile round
   trip. This is the single most common real-world solution and the app's group-forming mechanic
   is well suited to it — the host who commits first can be the one with the licence.
3. **Zipcar, if USC participates.** Hourly, insured, fuelled, and 18+ where a university
   partnership exists. Pending verification, this is potentially the best answer for day trips.
4. **Turo**, where a host will accept a young driver, though the young-driver fee and the host's
   discretion both apply.
5. **Rent, and budget the surcharge honestly.** About $25/day on top, from age 21. Under 21, in
   California, most of the majors will not rent at all.

## 6.5 Age gates, the general shape

- **Drinking age is 21 across the United States, with no student exception and no tolerance.**
  This is the single largest lifestyle difference for a European or Latin American 19-year-old
  and the app should never be coy about it.
- **Nevada gambling age is 21.** An under-21 in Las Vegas cannot gamble and, in most properties,
  cannot linger on a casino floor, though walking through on a marked path to reach a restaurant
  or theatre is generally permitted. What remains: the Strip itself, most shows, the observation
  attractions, restaurants, pools at some properties, and Fremont Street. That is a real trip,
  but it is a different trip from the one the marketing implies, and the card must say so.
- **Las Vegas hotel check-in is commonly 21+**, which is a harder obstacle than the casino floor,
  because it can leave a 19-year-old unable to book a room at all. Verify per property.
- **Wine tasting is 21+ everywhere in California** — Temecula, Santa Ynez, Paso Robles, Napa. A
  19-year-old on a wine-country trip is paying to watch other people drink. Say so on the card
  rather than letting them find out at the tasting-room door.
- **In Mexico the drinking age is 18**, which is why Baja appears so often in this document. See
  the Mexico section.
- **Cannabis is legal in California at 21 — and is a serious immigration problem for a visa
  holder.** Federal law still prohibits it, immigration is federal, and admitting to use has
  caused real consequences at the border for real students. This needs verifying against USCIS or
  State Department guidance before publication, but it must appear in the app, and it must appear
  as a plain warning rather than a wink. Marked `unverified` pending a citation.
