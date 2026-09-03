# USC SideQuest — Build Plan

## Stack

**Next.js 16 (App Router) + React 19 + TypeScript (strict) + Tailwind CSS v4.**

The deciding constraint is the Anthropic API key. Research must run server-side so the key never
reaches the browser, and the app must still start with a single `npm run dev`. Next.js is the only
mainstream React setup where the server route and the client app are the same process and the same
dev command — a Vite SPA would need a second server and `vercel dev` to exercise `/api/research`
locally. Next also gives us streaming responses out of the box (the research call takes 30–90s and
we progressively reveal sections as they arrive), file-system routing that maps cleanly onto our
seven screens, and a zero-config Vercel deploy. Tailwind v4 keeps the design system in one
`globals.css` token block rather than a config file. No component library: the visual language here
is images and whitespace, and a component kit would fight that.

State lives entirely on the client in a hand-rolled store persisted to `localStorage`. There is no
database — this is a prototype, and every server-shaped boundary is an explicit interface with a
fixture implementation behind it.

---

## Architecture

```
app/
  layout.tsx            root shell, StoreProvider, bottom nav
  page.tsx              / — Happening feed (quests + events, personalised)
  ideas/page.tsx        idea bank, three shapes
  ideas/[slug]/page.tsx planner form + research result
  quests/[id]/page.tsx  trip/plan detail, join, host console, actuals
  post/page.tsx         post a trip or plan
  events/page.tsx       event feed with filters
  profile/page.tsx      identity, friends, my quests, my requests
  api/research/route.ts POST — server-side research (the only server code)

lib/
  domain/types.ts       the whole domain model, no `any`
  store/                store.ts, persistence.ts, selectors.ts, StoreProvider.tsx
  research/             types.ts, service.ts (interface), live.ts, cached.ts, fixtures/
  events/               source.ts (interface), adapters/{engagesc,luma,partiful,handshake}.ts
  seed/                 users.ts, quests.ts, events.ts, ideas.ts, images.ts
components/             see inventory below
```

### The three service boundaries

Each is an interface + a fixture implementation + a one-line comment naming its real replacement.

| Boundary | Interface | Implementations | Real replacement |
|---|---|---|---|
| Trip research | `TripResearchService` | `LiveResearchService` (Anthropic API, real), `CachedResearchService` (fixtures) | already real |
| Event ingestion | `EventSource` | 4 fixture adapters | EngageSC iCal, Luma API, Partiful scrape, Handshake API |
| Persistence | `StorePersistence` | `localStorage` | Postgres + auth |

Research selection: `LiveResearchService` when `ANTHROPIC_API_KEY` is set, else `CachedResearchService`.
On any live failure — no key, bad JSON, timeout, HTTP error — fall back to cached and stamp the
result `provenance: 'cached-fallback'`. The UI always renders provenance honestly; there is no
silent fallback path.

---

## Data model

```ts
CohortUser      id, name, photo, homeCountry, homeUniversity, age, interests[],
                hasCar, hasUsCreditCard, bio
Friendship      userId -> friendId[]   (symmetric, seeded)

Quest           id, kind: 'trip'|'plan', title, destination, cover, startDate, endDate?,
                timeLabel?, capacity, hostId, description, signupDeadline,
                costEstimate?, attachedPlanId?, lifecycle: 'active'|'cancelled'|'completed',
                tags[], actuals?
Membership      questId, userId, state: 'requested'|'approved'|'declined'|'withdrawn'
TripActuals     lineItems[{label, estimated, actual, note}], reportedBy, totals

NormalizedEvent id, source: 'engagesc'|'luma'|'partiful'|'handshake', title, description,
                image, startsAt, endsAt?, venueName, venueArea, costLabel, costUsd, url, tags[]
Attendance      subjectType: 'event', subjectId, userId, state: 'interested'|'going'

Idea            slug, title, shape: 'day'|'weekend'|'break', hook, image, costBand, duration, tags[]
ResearchPlan    destination, researchedAt, provenance, confidence, summary,
                options: PlanOption[2..3], assumptions[], exclusions[], constraints[],
                itinerary: ItineraryDay[], sources[], totalRange
```

**Quest status is derived, never stored.** `open | filling | full | closed | cancelled | completed`
is computed from capacity, approved membership count, `signupDeadline` vs now, and `lifecycle`.
Storing it would let it drift. The host occupies one seat, so
`spotsTaken = 1 + approvedCount` and `filling` means ≤ 2 spots left.

Attendance for quests is derived from approved memberships; only events carry explicit
`Attendance` records. Both feed one `AttendanceSignal` component, so the
"Ana and Jonas, plus 10 other exchange students going" line is computed identically everywhere.

---

## Route map

| Route | Purpose | Key states |
|---|---|---|
| `/` | Personalised feed of open quests + upcoming events | onboarding gate, empty-after-filter |
| `/ideas` | Idea bank, tabs: day / weekend / break | — |
| `/ideas/[slug]` | Planner form → research | idle, staged loading, success, error, cached-notice |
| `/quests/[id]` | Detail, join, host console, actuals | open, filling, full, deadline passed, requested, joined, declined, own post, cancelled, completed |
| `/post` | Create trip or plan | validation, prefill from research |
| `/events` | Feed with interest / date / source filters | empty-after-filter |
| `/profile` | Identity, interests, constraints, friends, my quests, incoming requests | no requests, no friends |
| `/api/research` | POST, server-only | — |

## Component inventory

Cards & feed — `QuestCard`, `EventCard`, `IdeaCard`, `CardGrid`, `SectionHeader`
Commitment primitives — `DeadlineCountdown`, `CapacityMeter`, `StatusPill`, `JoinButton`
Social — `Avatar`, `AvatarStack`, `AttendanceSignal`, `FriendPicker`, `SourceBadge`
Research — `PlannerForm`, `ResearchProgress`, `PlanOptionCard`, `LineItemRow`, `ConstraintsPanel`,
`AssumptionsPanel`, `ItineraryTimeline`, `ProvenanceBanner`, `ConfidenceBadge`
Host — `HostRequestQueue`, `RequestRow`, `ActualsTable`
Chrome & async — `AppNav`, `FilterBar`, `SmartImage`, `EmptyState`, `ErrorState`, `LoadingState`,
`ResetDemoData`, `OnboardingFlow`

`SmartImage` wraps every image: Unsplash URL, `onError` → local SVG fallback keyed by a seed so the
app degrades gracefully offline without ever showing a grey box.

---

## Build order & verification

Each phase ends with `npx tsc --noEmit` clean and a git commit.

1. **Foundation** — design tokens in `globals.css`, `domain/types.ts`, `SmartImage`, nav shell.
   *Verify:* app boots, tokens render in light and dark.
2. **Seed data** — 25 users, 8 trips, 15 plans, 20 events, ~18 ideas, friendship graph, 3 sets of
   actuals. Every image URL HTTP-checked and visually confirmed against its subject.
   *Verify:* a script asserts counts, referential integrity, and status coverage
   (open/filling/full/closed/cancelled/completed all present).
3. **Store** — reducer, localStorage persistence with schema version, selectors, reset control.
   *Verify:* mutate, reload, state survives; reset restores seed.
4. **Feed, events, event adapters** — four adapters, normalisation, filters, attendance signal.
   *Verify:* every filter combination, including one that returns nothing.
5. **Quests** — detail, join/approve/decline, all edge states, actuals.
   *Verify:* walk every state in the table above by hand.
6. **Posting** — create trip and plan, validation, prefill from research.
   *Verify:* post → appears in feed → open detail → countdown correct.
7. **Research** — planner, service interface, 4+ cached fixtures, live route, staged streaming UI.
   *Verify:* cached path with no key; live path with key; under-21/no-car changes the output;
   forced failure falls back visibly.
8. **Polish & audit** — empty/loading/error on every async surface, mobile at 375px, dark mode,
   a grep for forbidden engagement metrics, console and network clean, `npm run build`.

## Verification checklist (maps to acceptance criteria)

- `npm ci && npm run dev` with no `.env.local` → every screen populated
- `npx tsc --noEmit` and `npm run build` → zero errors
- Browser walkthrough of all seven routes → zero console errors, zero failed requests
- Research with under-21 + no-car vs over-21 + car → visibly different constraints and options
- Post → join → approve → decline → reload → state intact
- Grep the UI for `like|heart|upvote|follower|streak|badge|leaderboard|views` → no engagement metrics
