# MVP cost research — four destinations, two October weekends

All figures checked **15 Sep 2026** unless a row says otherwise. Every row carries its primary
source. Where a figure could not be reached at its primary source the Amount reads `unverified`
and the Confidence column says what was tried.

**Scope.** Los Angeles (USC, downtown LA) as origin. Zion National Park, San Francisco, Joshua
Tree National Park, San Diego. Two weekends only: **Fri 2 – Sun 4 October 2026** and
**Fri 9 – Sun 11 October 2026**, two nights each.

**The user.** USC exchange student, 19–25, foreign passport, foreign driving licence, no US credit
history, usually no car. Every figure below is chosen for that person, not for a generic traveller.

**The `Unit` column is load-bearing.** The app divides per-vehicle costs by party size and
multiplies per-room-night costs by rooms and nights. A wrong unit is wrong at every party size.

Facts already verified in `docs/research/destinations.md` (3 Sep 2026) are reused rather than
re-researched, and marked *reused* in the Confidence column.

---

## A. Park and entrance fees

| Item | Amount | Unit | Source URL | Confidence |
|---|---|---|---|---|
| Zion entrance — private vehicle | $35.00 | per-vehicle, valid 7 days | https://www.nps.gov/zion/planyourvisit/fees.htm | high, checked 15 Sep 2026 |
| Zion entrance — per person on foot or bicycle | $20.00 | per-person, valid 7 days | https://www.nps.gov/zion/planyourvisit/fees.htm | high, checked 15 Sep 2026 |
| Zion entrance — motorcycle | $30.00 | per-vehicle (up to 2 motorcycles, 4 people), 7 days | https://www.nps.gov/zion/planyourvisit/fees.htm | high, checked 15 Sep 2026 |
| Zion entrance — children under 16 | $0.00 | per-person | https://www.nps.gov/zion/planyourvisit/fees.htm | high, checked 15 Sep 2026 |
| **Zion non-resident surcharge** | **$100.00** | **per-person, aged 16 or older, on top of the entrance fee** | https://www.nps.gov/zion/planyourvisit/fees.htm and https://www.nps.gov/aboutus/commercial-tours-and-nonresident-fees.htm | high, checked 15 Sep 2026 |
| Zion Annual Pass ($70) as a surcharge waiver | **not available to this user** | — | https://www.nps.gov/zion/planyourvisit/fees.htm | high — the page states the $70 Zion Annual Pass is for US citizens and residents only |
| America the Beautiful annual pass, non-resident | $250.00 | per-pass; covers the whole vehicle where fees are per-vehicle, or the holder plus three additional adults where fees are per-person | https://www.nps.gov/planyourvisit/passes.htm | high, checked 15 Sep 2026 |
| America the Beautiful annual pass, US resident | $80.00 | per-pass | https://www.nps.gov/planyourvisit/passes.htm | high, checked 15 Sep 2026 |
| Zion Canyon shuttle fare | **$0.00 — free, no ticket, no reservation** | per-person | https://www.nps.gov/zion/planyourvisit/zion-canyon-shuttle-system.htm | high, checked 15 Sep 2026 |
| Zion Canyon shuttle running 2–4 and 9–11 Oct 2026 | **yes** | — | https://www.nps.gov/zion/learn/news/2026-02-06-shuttle-schedule.htm | high, checked 15 Sep 2026 |
| Joshua Tree entrance — private vehicle | $30.00 | per-vehicle, valid 7 days | https://www.nps.gov/jotr/planyourvisit/fees.htm | high, checked 15 Sep 2026 — confirms the figure in destinations.md |
| Joshua Tree entrance — motorcycle | $25.00 | per-vehicle (up to 2 motorcycles, 4 people), 7 days | https://www.nps.gov/jotr/planyourvisit/fees.htm | high, checked 15 Sep 2026 |
| Joshua Tree entrance — per person on foot or bicycle | $15.00 | per-person, valid 7 days | https://www.nps.gov/jotr/planyourvisit/fees.htm | high, checked 15 Sep 2026 |
| Joshua Tree Annual Pass | $55.00 | per-pass, 12 months | https://www.nps.gov/jotr/planyourvisit/fees.htm | high, checked 15 Sep 2026 |
| Joshua Tree non-resident surcharge | **$0.00 — does not apply** | — | https://www.nps.gov/aboutus/commercial-tours-and-nonresident-fees.htm | high, checked 15 Sep 2026 |

### The three things about Zion that change the price

**The shuttle season closes the canyon to cars, which inverts the usual advice.** The 2026 shuttle
season runs 7 March to 2 January, and the park states plainly that "personal vehicles are not
allowed on the Zion Canyon Scenic Drive during shuttle season"
(https://www.nps.gov/zion/learn/news/2026-02-06-shuttle-schedule.htm, checked 15 Sep 2026). Both
October weekends fall inside it. The shuttle itself is free and needs no ticket, so the car earns
its keep on the 430 miles from Los Angeles, not inside the park. Someone arriving without a car
pays the **$20 per-person** fee, not the $35 vehicle fee, and loses nothing at all in access.

**October hours, from the park's own calendar:** 13 September – 24 October runs first shuttle
7:00 am, last from the Visitor Center 6:00 pm, last from Temple of Sinawava 7:15 pm. Both target
weekends sit in that block.

**The surcharge is where a foreign passport gets expensive, and the pass arithmetic is not
obvious.** A party of four non-residents in one car pays $35 + 4 × $100 = **$435**. One $250
non-resident America the Beautiful pass covers the vehicle and waives the surcharge for the holder
plus three additional adults, so the same four pay **$250** — a saving of $185 on this single
weekend, before any second park. A solo student pays $35 + $100 = $135 and should not buy the pass
for one trip.

One caveat on the surcharge wording, recorded because it decides that arithmetic: the
non-resident-fees page frames the holder-plus-three waiver in the context of group travel, while
the passes page states it as "the passholder plus three additional adults in their party where
per-person rather than per-vehicle fees are charged". Zion charges per vehicle, so the plain
reading is that the pass admits the vehicle and clears the surcharge for up to four adults in it.
The app should carry this as a computed line with the source, not as an unqualified promise.


---

## B. Car hire from Los Angeles — the rules, verified at source

Gathered in the main session on 15 Sep 2026 after three research agents died on network errors.

| Item | Amount | Unit | Source URL | Confidence |
|---|---|---|---|---|
| Enterprise minimum rental age, California | **21** | — | https://www.enterprise.com/en/car-rental-faqs/us-renter-requirements/car-rental-under-25.html | high, checked 15 Sep 2026 |
| Enterprise young renter fee, ages 21–24, California | **~$25.00** ("approximately $25.00 per day but can be higher or lower based on the rental location" — their words) | per-day | same | high on the wording, medium on the exact figure because Enterprise itself declines to fix it |
| Enterprise young renter fee, Michigan / New York | $15.50 / $33.25 | per-day | same | high — quoted only to show the shape of the fee |
| States where Enterprise rents to 18–20 | **Michigan and New York only** | — | same | high |
| Enterprise payment | "A valid debit or credit card. Some Enterprise locations may require a credit card." | — | same | high |
| Vehicle classes open to 21–24 | economy, compact, intermediate, standard, full size; cargo vans and minivans; pickups; compact, small and standard SUVs seating up to 5 | — | same | high |
| Base daily rate, compact, LA, 2–4 and 9–11 Oct 2026 | `unverified` | per-day | — | none — rates sit behind a booking engine that refuses non-browser clients. Needs a browser session or a cars API. |
| Hertz minimum rental age, California | 20 | — | reused from `docs/research/destinations.md` | medium, not re-checked today |

**What this means for the app.** A 19- or 20-year-old cannot hire from Enterprise in California at
all, and only Hertz will consider a 20-year-old. From 21 the hire is possible and carries roughly
$25 a day on top — on a Friday-to-Sunday weekend that is **about $75**, which is over half the
base rate again on a cheap compact. The "some locations may require a credit card" clause is the
one that cannot be resolved online in advance, and it is where a student with no US credit history
gets turned away at the counter having already paid.

## C. Fuel and driving

| Item | Amount | Unit | Source URL | Confidence |
|---|---|---|---|---|
| California regular average | **$6.0175/gal** | per-gallon | https://gasprices.aaa.com/state-gas-price-averages/ | high, checked 15 Sep 2026 |

**This moved.** `docs/research/destinations.md` recorded $5.74/gal on 3 September. Twelve days
later AAA has California at **$6.0175**, up about 4.8%. At 30 mpg that is **$0.2006 a mile**, and
it is the reason the fuel line has to be a named constant with a check date rather than a number
typed into four different files.

Round-trip fuel at 30 mpg and $6.0175/gal, mileage still to be confirmed per route:

| Route | Round trip | Fuel, whole vehicle | Confidence |
|---|---|---|---|
| LA → Zion | ~860 mi | ~$173 | medium — mileage approximate, not yet routed |
| LA → San Francisco | ~760 mi | ~$152 | medium |
| LA → Joshua Tree | ~290 mi | ~$58 | medium |
| LA → San Diego | ~240 mi | ~$48 | medium |

Split four ways the Zion drive is about $43 a head in fuel alone, before the hire.

## D–F. Still outstanding

Not yet gathered: Amtrak Pacific Surfliner fares for the exact dates; BART SFO→downtown (the
calculator is JavaScript-only and there is an SFO surcharge on top of the January 2026 6.2% rise,
so this needs a browser session); Muni and MTS passes; Zion and Joshua Tree access without a car;
San Francisco and San Diego parking; campground fees; hostel rates.

**Marked `unverified` rather than estimated**, deliberately. Every one of these is a number the
app will state with certainty, so a plausible guess here becomes a false promise on screen.
