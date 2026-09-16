# MVP itinerary content — Zion and Joshua Tree

Two weekend trips from Los Angeles, Friday to Sunday, two nights, early October 2026.
Written for a USC exchange student aged 19–25 on a foreign passport, often without a car,
budget-conscious, who has never been to the American west.

Compiled **15 September 2026**. Every cost carries a source URL and the words
"checked 15 Sep 2026". Anything that could not be read off an operator's or the agency's own
page is marked `unverified`, with a note on what was tried. Nothing here is a guessed number.

Fee constants are reused from `docs/research/destinations.md` rather than re-researched, and
that document's Part 0a warnings about the 2026 non-resident surcharge apply in full.

---

## The entrance-fee arithmetic, once, for both parks

This is the thing every generic travel site gets wrong for this user, so it belongs at the top.

| Park | Standard entry | Non-resident surcharge | What a foreign student actually pays |
|---|---|---|---|
| **Zion** | **$35.00 per private vehicle**, 7 days | **$100.00 per person aged 16+** | $35 for the car **plus $100 each** |
| **Joshua Tree** | **$30.00 per private vehicle**, 7 days | **none — not a surcharge park** | $30 for the car, split by however many are in it |

Zion: https://www.nps.gov/zion/planyourvisit/fees.htm — checked 15 Sep 2026.
Joshua Tree: https://www.nps.gov/jotr/planyourvisit/fees.htm — checked 15 Sep 2026.
The eleven surcharge parks and the $250 non-resident America the Beautiful pass:
https://www.nps.gov/aboutus/commercial-tours-and-nonresident-fees.htm — checked 15 Sep 2026.

**The consequence, stated plainly.** Three foreign students in one car at Zion pay
$35 + $300 = **$335** at the gate. The same three at Joshua Tree pay **$30 between them, $10
each**. That is a 33-fold difference in the cost of walking in, and it is the single largest
factor separating these two weekends on price. If the group is four, the **$250 non-resident
America the Beautiful pass** waives the surcharge for the holder and up to three additional
adults, so four people at Zion pay $250 rather than $435 — buy the pass at the gate.

**The trap:** Zion's own fee page says the surcharge is waived by "an Annual or America the
Beautiful Pass", and separately sells a **$70 Zion annual pass**. That $70 pass is described on
the same page as being for US citizens and residents. Do not let a student drive seven hours
expecting a $70 waiver. The pass that waives the surcharge is the $250 non-resident America the
Beautiful pass. Flag this `verify_before_quoting`.

---

# Zion National Park

**Distance from Los Angeles:** roughly 430 miles, six and a half to seven hours by road via
I-15 and Utah 9. This is a long Friday drive; it is the reason the Friday item below is a
short walk and not a summit.

**`hook`**
> The only place in the west where the scenery is genuinely vertical and you can still reach
> all of it without a car, because a free bus runs the length of the canyon and private
> vehicles are banned from it.

**`whyOctober`**
> October is the month Zion becomes comfortable rather than survivable: average high **79°F**
> against July's **100°F**, average low **48°F**, the August monsoon finished (thunderstorm
> days drop from 15 in August to 2 in October), and visitation "begins to slow down" after the
> summer peak. Fall colour has not reached the canyon floor yet — the park says that happens
> "at the end of October and early November" — so come for the temperature and the thinner
> crowds, not the leaves. Everything on this list is open; the shuttle runs a full October
> schedule and only the Human History Museum closes later, after Thanksgiving.
>
> Sources: https://www.nps.gov/zion/planyourvisit/upload/2021-Climate-Chart.pdf and
> https://www.nps.gov/zion/planyourvisit/seasons.htm — both checked 15 Sep 2026.

**`bestPhoto`** — `Zion Canyon Virgin River sandstone`

**The shuttle, once, because it governs everything below.** The Zion Canyon Scenic Drive is
closed to private cars for the whole of shuttle season, which covers both early-October
weekends. The shuttle is **free** and needs **no ticket or reservation**. In October the first
bus leaves the Visitor Center at **7:00 am**, the last leaves the Visitor Center at **6:00 pm**,
and the last bus down from Temple of Sinawava is **7:15 pm**. Miss that last one and you are
walking eight miles in the dark. Every `needsCar: false` below depends on this.

---
## Zion 1 — Watchman Trail, on arrival

- **`title`** — Watchman Trail At Dusk
- **`eyebrow`** — `FRIDAY EVENING`
- **`what`** — After seven hours in a car you want the canyon to mean something before you go
  to bed, and this is the one Zion hike that starts from the Visitor Center car park itself, so
  it needs no shuttle and no timing. **3.3 miles round trip, about 480 feet of climb to the
  overlook, roughly two hours** on a sandy, uneven, unpaved trail. It ends on a bench looking
  straight down the canyon at the Watchman, the Towers of the Virgin and the lights of
  Springdale coming on below you — the view that makes the drive stop feeling stupid. If you
  arrive too late or too tired, the **Pa'rus Trail** from the same plaza is paved, **3.5 miles
  end to end with 50 feet of climb**, walkable in sandals, and the only trail in the park that
  takes bikes, wheelchairs and dogs.
- **`cost`** — **Free**, beyond park entry. No permit, no ticket, no shuttle fare.
  https://www.nps.gov/thingstodo/hike-watchman-trail.htm and
  https://www.nps.gov/thingstodo/hike-pa-rus-trail.htm — checked 15 Sep 2026.
- **`needsCar`** — `false` — once you are at the Visitor Center this is the one canyon walk
  that never touches the Scenic Drive.
- **`timeNeeded`** — 2 hours for the Watchman; 1 hour for a Pa'rus out-and-back to Canyon
  Junction bridge. No shuttle queue for either.
- **`catch`** — The trail is unlit, has "several moderate drop-offs" and steps up to 24 inches,
  and in early October the canyon walls take the light away well before the sky goes dark, so
  people who set off at what feels like a sensible hour finish the descent by phone torch on
  sandy rock — carry a head torch or start two hours before sunset, not one.
- **`photoQuery`** — `Watchman Zion sunset Virgin River`

---
## Zion 2 — Angels Landing, and the lottery you have already missed

- **`title`** — Angels Landing Chains
- **`eyebrow`** — `SATURDAY, DAWN`
- **`what`** — The reason to do this is not the summit photograph, it is the half mile before
  it: a knife-edge ridge a few feet wide where the park's own page admits "sheer drop-offs of
  as much as 1,000 feet on each side" and you move hand over hand along bolted chains. From
  **The Grotto, shuttle stop 6**, it is **1.9 miles and 1,187 feet of climb to Scout Lookout**
  on concrete switchbacks, then the **final 0.5 mile on the chains** — about **4.8 miles round
  trip, four to five hours** if the chains are queueing, and they always queue. **Scout Lookout
  needs no permit at all**, gets you the same 1,000-foot canyon view and the same Walter's
  Wiggles, and is the plan you should assume you are doing.
- **`cost`** — **$6 per application** (covers up to 6 people including the applicant), plus
  **$3 per person** charged only if you are drawn. Non-refundable.
  https://www.nps.gov/zion/planyourvisit/angels-landing-hiking-permits.htm and
  https://www.recreation.gov/permits/4675325 — checked 15 Sep 2026.
- **`needsCar`** — `false` — The Grotto is shuttle stop 6 and cars cannot drive there in any
  case.
- **`timeNeeded`** — 5 to 6 hours door to door: the 7:00 am shuttle from the Visitor Center,
  20 minutes to The Grotto, four to five hours walking, plus a 30-to-45-minute queue for the
  first buses on an October Saturday.
- **`catch`** — **The seasonal lottery for every hiking date from 1 September to 30 November
  2026 opened on 1 July and closed on 20 July 2026** — it is gone, and anyone planning this
  trip today cannot enter it. The only route left is the **day-before lottery, which opens at
  12:01 am and closes at 3:00 pm Mountain Time the day before your hike, with results after
  4:00 pm MT** — so for a Saturday attempt you must apply from the car on Friday morning,
  before 3 pm Utah time, and you will not know until you have already arrived in Springdale.
  Plan the weekend so that a "no" costs you nothing, and note that since 1930 the majority of
  the park's deadly accidents have happened on the chains section.
  (2026 lottery dates: https://www.nps.gov/zion/learn/news/2026-02-11-angels-landing.htm —
  checked 15 Sep 2026.)
- **`photoQuery`** — `Angels Landing chains ridge hiker`

---
