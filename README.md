# USC SideQuest

A trip planner for exchange students at USC. Roughly 400 of them arrive in Los Angeles at the same
time, know nobody, and have about 16 weeks.

Information about things to do is not scarce. What is scarce is people to do them with, somebody
willing to be the organiser, and — the part this app is actually about — **a price you can trust**.

> Someone commits first, states a date and a capacity, sets a deadline, and others join before
> that deadline.

**Trips** are multi-day, **activities** are a few hours. Both are hosted, both are joinable, both
render in the same visual language. You can publish either publicly to the cohort or privately by
link, because most people want to travel with people they already like.

## The claim is accuracy

Anyone can generate a plausible itinerary with a language model. The numbers on it will be
recollection dressed as research, and this cohort is exactly the group those numbers are wrong
for: a 19 or 20 year old, on a foreign licence, with no US credit history, usually without a car.
A general estimate misses the under-25 rental surcharge, the deposit hold, the six people
splitting two rooms and the 21+ door policy. That is where a "$300 weekend" becomes a $700 one.

So the planner does not guess. It calls real pricing APIs — Google Flights and Google Hotels via
SerpApi, campgrounds via Recreation.gov — for the exact dates and the exact occupancy, and every
costed line on screen says where its number came from:

```
Google Hotels · checked 2h ago     From a web search     Estimated, not checked
```

**And it is checkable.** The server keeps a ledger of every lookup it actually executed, and
reconciles the finished plan against it. A line claiming a live API price with no matching ledger
entry is downgraded to an estimate; a price more than 10% off every quote in its entry is
downgraded; a URL the model invented is replaced with the one the provider returned; and with no
API key present, no line may claim `api` at all. A tool loop on its own does not stop price
invention — the model can call a tool, ignore the answer and still label the line `api` — which is
why the ledger exists.

Each plan then carries one summary line: *"9 of 12 costed lines came from a live price API."*
That sentence is the product claim, made falsifiable.

---

## Running it

```bash
npm install && npm run dev
```

Open http://localhost:3000. That is the whole setup — no database, no API key, no seeding step.
Every screen is populated on first load: 25 seeded cohort members, 33 trips and activities
covering every lifecycle state, 20 suggested activities across four sources, 19 destinations in
the idea bank and 8 pre-researched, costed plans.

On first load you pick who you are from the cohort (or add yourself) and answer three questions.
Those three — are you 21, do you have a car, do you have a US credit card — change every cost
estimate in the app, which is the point.

### The two ways in

**If you know where you want to go:** the idea bank is the home screen. Click a destination, set
your dates and group, and it goes and prices it.

**If you do not:** the bar above the idea bank opens `/plan`, a guided picker. Seven questions,
all answered by clicking, each carrying one line on why it is being asked. It ends in two or three
destinations that actually fit, with the catch on each stated on the card. Picking one drops you
back into the normal loop with the form already filled in — the brief travels in the query string,
so the resulting URL is also the thing you send the people you want to come.

Who you are going with is the load-bearing question: it decides rooms and bedding, which is the
difference between quoting a couple a double and quoting them a hostel dorm, and it is sent
straight to the hotel lookup.

### Optional: the live paths

```bash
cp .env.example .env.local
```

| Key | What it turns on | Cost |
|---|---|---|
| `ANTHROPIC_API_KEY` | Live research instead of a saved plan | Per run |
| `SERPAPI_API_KEY` | Real Google Flights and Google Hotels prices | 250 searches/month, free tier |
| `RIDB_API_KEY` | Campground catalogue (availability works without it) | Free |

Without them the planner composes a saved plan and says so on screen. Both paths are real; neither
pretends to be the other.

`RESEARCH_MODE=cached` forces the saved-plan path even with a key present. **Keep it set during
development** — see the budget note in `CLAUDE.md`.

### Other commands

| Command | What it does |
|---|---|
| `npm run dev` | Dev server |
| `npm run check` | Typecheck, lint, seed validation, intake probe, build |
| `npm run probe:intake` | The guided picker, offline. Free. |
| `npm run validate:seed` | Asserts the seed-data invariants (see below) |
| `npx tsx scripts/probe-agent.ts` | The research agent and ledger, against recorded responses. Free. |
| `npx tsx scripts/probe-pricing.ts` | The pricing layer. Spends SerpApi quota. |
| `npx tsx scripts/probe-plan.ts` | The whole thing, live. The expensive one. |

---

## What is real and what is mocked

Everything in the UI works against something. There are no dead buttons and nothing is stubbed
out — but several things that would be a network call in production are a fixture here.

| Area | Status | Where the boundary is |
|---|---|---|
| **Flight and hotel prices** | **Real.** Google Flights and Google Hotels through SerpApi, for the exact dates and occupancy. | `lib/pricing/flights.ts`, `lib/pricing/hotels.ts` |
| **Campground availability** | **Real.** Recreation.gov's availability endpoint, which needs no key at all. | `lib/pricing/campgrounds.ts` |
| **Provenance** | **Real.** Every executed lookup is ledgered and the finished plan is reconciled against it. | `lib/pricing/ledger.ts` |
| **Trip research (live)** | **Real.** Anthropic API, `claude-opus-5`, tool loop plus web search, server-side only. | `lib/research/agent.ts` |
| **Trip research (cached)** | Fixture. 8 hand-written costed plans, recomposed against your inputs. | `lib/research/cached.ts`, `lib/research/fixtures/` |
| **Ground transport** | Mixed, and labelled. Rental and coach fares from web search; Uber estimated from distance, because no public price API exists. | `lib/research/agent.ts` |
| **Destination matching** | Real, and deliberately not a model call. Deterministic, runs in the browser. | `lib/intake/match.ts` |
| **Suggested activity sources** | Fixture. Four adapters behind one interface. | `lib/events/adapters/*.ts` |
| **Persistence** | Fixture. `localStorage`, one key. | `lib/store/StoreProvider.tsx` |
| **Identity / auth** | Fixture. Pick a profile, no password. | `components/Onboarding.tsx` |
| **Images** | Real. Unsplash CDN, with a locally drawn fallback. | `components/SmartImage.tsx` |

Each of those files carries a `MOCK BOUNDARY` comment naming exactly what would replace it.

### The cached plans are not screenshots

This is the part worth being clear about. A saved plan is a costed skeleton that is **recomputed
against the planner form every time you run it**:

- Options you cannot book disappear. Under 21 with no car, the Joshua Tree plan drops from four
  options to one, because the other three need a driver you do not have or a rental you are too
  young to sign for.
- Split costs re-divide by your real group size, capped at what one car, room or campsite actually
  holds — so eight people pay for two rooms, not one.
- The itinerary swaps to the carless or under-21 variant where the destination has one. The Las
  Vegas plan has a genuinely different itinerary for under-21s, because most of the Strip is not
  open to them.
- The constraint flags are generated from your inputs, not stored.

What is *not* recomputed is the underlying prices — those are from the date shown on the banner.
The UI says this plainly every time.

### Event sources

All four are fixture-backed, each modelling the shape its real API returns (Luma's response uses
cents and a `geo_address_json` blob; EngageSC's uses iCal `VEVENT` fields; Handshake separates
`employer` from the institution event). Replacing one means rewriting a single `fetchEvents` and
touching nothing downstream.

**EngageSC is the first real integration to build.** Its iCal feed is public, needs no key and no
partnership, and returns 200 right now:

```
https://engage.usc.edu/ical/usc/ical_usc.ics
```

Partiful deliberately is not a scraping target — those are private invites and the guest list is
the sensitive part, so a real integration means a per-user account link.

Because the seeded events are invented, their outbound links point at each source's real page
rather than a permalink that would 404. The adapters document the permalink shape a live adapter
would emit.

---

## How it is built

**Next.js 16 (App Router) + React 19 + TypeScript (strict) + Tailwind CSS v4.**

The deciding constraint was the API key: research has to run server-side so the key never reaches
the browser, and the app still has to start with one command. Next is the only mainstream React
setup where the server route and the client app are the same process and the same dev command.

```
app/
  page.tsx              / — the planning home screen: idea bank, closing soonest
  plan/                 the guided picker for people with no destination in mind
  ideas/                idea bank and the planner
  quests/[id]/          detail, join, host console, estimate vs actuals
  post/                 create a trip or activity
  events/               suggested activities with filters
  profile/              identity, friends, host inbox, demo reset
  api/research/route.ts the only server code

lib/
  domain/               types.ts and logic.ts — the model, and every derived rule
  store/                reducer, localStorage persistence, selectors
  intake/               the brief: occupancy, URL round trip, destination matching
  pricing/              SerpApi and Recreation.gov clients, quota, ledger, tools
  research/             service interface, the agent, cached fixtures
  events/               EventSource interface and the four adapters
  seed/                 users, quests, ideas, images
scripts/                probe-intake, probe-agent, probe-pricing, probe-plan, validate-seed
```

A few decisions worth explaining:

**Quest status is derived, never stored.** `open | filling | full | closed | cancelled | completed`
is computed from capacity, approved members, the deadline and the lifecycle. Storing it would let
it drift from the two things the product actually turns on.

**Every join edge state resolves in one function.** `joinAffordance` in `lib/domain/logic.ts`
decides what the control says and whether it does anything — host viewing their own post, already
requested, already joined, declined, full, deadline passed, cancelled, completed. Components render
its output rather than reimplementing the rules.

**Research streams over server-sent events.** A live call takes 30–90 seconds and a spinner for
that long is not a loading state. The server names each stage as it reaches it. SSE rather than a
hand-read `response.body` because the browser records a manually drained body stream as an aborted
request even on a clean 200.

**Images bypass `next/image`.** Unsplash already resizes and format-negotiates in the URL, so the
optimizer would add a server-side fetch in front of every photograph for no gain — and it breaks
outright on any machine behind a TLS-intercepting proxy. `SmartImage` loads directly and falls back
to a locally drawn placard that still carries the name of the thing.

**Seed dates are relative to now.** Deadlines are always counting down and some trips have already
run, without anyone needing to re-seed.

### Seed invariants

`npm run validate:seed` checks the things that are easy to break while editing content and
impossible to spot by clicking around:

- Every profile you can pick hosts something **joinable**, has somebody waiting on them, has joined
  something, and has a request outstanding — so no flow is unreachable depending on who you pick.
- Every derived status is reachable from the seed.
- No membership, attendance record or friendship points at a person or post that does not exist,
  and friendships are symmetric.
- No under-21 is seeded as going to a 21+ door.
- Every photo id is in the catalogue; every cached plan states its assumptions, exclusions and the
  basis behind each costed line.

---

## Design

Clean, minimalist, image-led. The browsing feel of a good social product without any of its
incentive machinery.

**There are no likes, hearts, upvotes, follower counts, view counts, streaks, badges or
leaderboards anywhere, and nothing is ever ranked by popularity.** The feed is ordered by which
deadline is soonest, because that is the useful order. The one social number — "Ana and Jonas, plus
10 other exchange students going" — is logistics: who else will be there. It never scores anything.

Deadlines and remaining capacity are the visual priority on every card, because they are what
drives action. The accent colour is reserved almost entirely for those two things.

Mobile-first: the nav sits at the bottom on a phone, where a thumb reaches it. This gets used
standing outside a lecture hall.

---

## Deploying

```bash
npx vercel
```

Zero config. Set `ANTHROPIC_API_KEY` in the Vercel project's environment variables if you want the
live research path; without it the deployment still works fully on saved plans.

`/api/research` is the only server-rendered route and runs on the Node runtime with
`maxDuration = 300`, since research with web search regularly runs past a minute. On a hobby plan
that ceiling is lower, and long live calls may be cut off — the fallback to a saved plan handles it
and says what happened.

Never commit `.env.local`. `.env.example` documents what goes in it.

---

## Known limits

This is a prototype, and these are deliberate rather than unfinished:

- **State is per-browser.** Two people on two machines do not see each other. Everything lives in
  `localStorage` under one key, and there is a reset control on the profile page.
- **Eleven of the nineteen destinations have no saved plan.** They work fully with an API key;
  without one they show a written state explaining that and pointing at the eight that are ready.
  Idea cards that have one are marked "Plan ready".
- **Actuals are reported, not collected.** Completed trips show what participants said they paid,
  but there is no form for submitting them — that flow would need real accounts to be worth
  anything.
- **Both live budgets are small and enforced.** SerpApi's free tier is 250 searches a month, which
  is roughly 40–80 research runs, so `lib/pricing/quota.ts` holds a per-run cap, a monthly budget
  checked against SerpApi's own account endpoint, a reserve floor and a disk-backed cache. The
  Anthropic budget is a few dollars, which is why development runs on the offline harnesses and
  `RESEARCH_MODE=cached`.
- **Ground transport is not live, and says so.** Uber and Lyft retired their public price APIs, and
  correct transit timings would need a billing-enabled Directions key. Those lines are labelled
  `Estimated, not checked` or `From a web search` rather than dressed up.
- **Booking.com is not reachable.** Its Demand API is Managed Affiliate Partner only and closed to
  new registrations; Google has no public flights API; Amadeus's free tier returns cached test
  data. SerpApi is the one legitimate route to live Google travel pricing, so that is what this
  uses rather than scraping anything.
