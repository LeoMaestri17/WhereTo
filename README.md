# USC SideQuest

A social coordination app for exchange students at USC. Roughly 400 of them arrive in Los Angeles
at the same time, know nobody, and have about 16 weeks.

Information about things to do is not scarce. What is scarce is people to do them with, and
somebody willing to be the organiser. So the whole app rests on one primitive:

> Someone commits first, states a date and a capacity, sets a deadline, and others join before
> that deadline.

**Trips** are the multi-day version, **Plans** are the cheap local version, and **Events** are
things already happening that the app aggregates so you can see who else from the cohort is going.
All three render in the same visual language and share the same join mechanics.

The thing that makes this more than a group chat is that cost estimates here are
**constraints-aware for this specific user**: a 19 or 20 year old, on a foreign licence, with no US
credit history, often without a car. A general estimate misses the under-25 rental surcharge, the
deposit holds, the fact that six people are splitting two rooms, and the 21+ door policy. Those
omissions are where a "$300 weekend" becomes a $700 weekend.

---

## Running it

```bash
npm install && npm run dev
```

Open http://localhost:3000. That is the whole setup — no database, no API key, no seeding step.
Every screen is populated on first load: 25 seeded cohort members, 33 trips and plans covering
every lifecycle state, 20 events across four sources, 19 destinations in the idea bank and 8
pre-researched, costed plans.

On first load you pick who you are from the cohort (or add yourself) and answer three questions.
Those three questions — are you 21, do you have a car, do you have a US credit card — change every
cost estimate in the app, which is the point.

### Optional: the live research path

```bash
cp .env.example .env.local
# then put a key in it
```

With `ANTHROPIC_API_KEY` set, the planner runs live research against the Anthropic API with web
search enabled, server-side. Without it, the planner composes a saved plan instead and says so on
screen. Both paths are real; neither pretends to be the other.

Set `RESEARCH_MODE=cached` to force the saved-plan path even with a key present, which is useful
for demoing the offline experience.

### Other commands

| Command | What it does |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm run validate:seed` | Asserts the seed-data invariants (see below) |
| `npm run check` | All four, in order |

---

## What is real and what is mocked

Everything in the UI works against something. There are no dead buttons and nothing is stubbed
out — but several things that would be a network call in production are a fixture here.

| Area | Status | Where the boundary is |
|---|---|---|
| **Trip research (live)** | **Real.** Anthropic API, `claude-opus-5`, web search enabled, server-side only. | `lib/research/live.ts` |
| **Trip research (cached)** | Fixture. 8 hand-written costed plans, recomposed against your inputs. | `lib/research/cached.ts`, `lib/research/fixtures/` |
| **Event sources** | Fixture. Four adapters behind one interface. | `lib/events/adapters/*.ts` |
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
  page.tsx              / — the feed, ordered by which deadline is soonest
  ideas/                idea bank and the planner
  quests/[id]/          detail, join, host console, estimate vs actuals
  post/                 create a trip or plan
  events/               aggregated feed with filters
  profile/              identity, friends, host inbox, demo reset
  api/research/route.ts the only server code

lib/
  domain/               types.ts and logic.ts — the model, and every derived rule
  store/                reducer, localStorage persistence, selectors
  research/             service interface, live + cached implementations, fixtures
  events/               EventSource interface and the four adapters
  seed/                 users, quests, ideas, images
scripts/validate-seed.ts
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
- **The live research path could not be exercised end to end here**, because no API key was
  available in the build environment. The path up to the API boundary and the fallback were both
  tested against a deliberately invalid key: it attempts live, fails, falls back to the saved plan,
  and shows the reason. The model id (`claude-opus-5`) and the web search tool version
  (`web_search_20260209`) were taken from current Anthropic documentation rather than from memory.
