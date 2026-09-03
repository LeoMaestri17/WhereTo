# USC SideQuest — Build Plan

This is the plan the build followed, updated to match what was actually shipped. Where the
finished thing diverged from the original plan, the divergence and its reason are noted inline.

## Stack

**Next.js 16 (App Router) + React 19 + TypeScript (strict) + Tailwind CSS v4.**

The deciding constraint is the Anthropic API key. Research must run server-side so the key never
reaches the browser, and the app must still start with a single `npm run dev`. Next.js is the only
mainstream React setup where the server route and the client app are the same process and the same
dev command — a Vite SPA would need a second server and `vercel dev` to exercise `/api/research`
locally. Next also gives us streaming responses (the research call takes 30–90s), file-system
routing that maps cleanly onto our seven screens, and a zero-config Vercel deploy. Tailwind v4
keeps the design system in one `globals.css` token block. No component library: the visual language
here is images and whitespace, and a component kit would fight that.

State lives entirely on the client in a hand-rolled store persisted to `localStorage`. There is no
database — this is a prototype, and every server-shaped boundary is an explicit interface with a
fixture implementation behind it.

---

## Architecture

```
app/
  layout.tsx            root shell, StoreProvider, nav
  page.tsx              / — the feed, ordered by soonest deadline
  ideas/page.tsx        idea bank, three shapes
  ideas/[slug]/page.tsx planner form + research result
  quests/[id]/page.tsx  detail, join, host console, actuals
  post/page.tsx         post a trip or plan
  events/page.tsx       aggregated feed with filters
  profile/page.tsx      identity, friends, host inbox, demo reset
  api/research/route.ts GET, server-sent events — the only server code

lib/
  domain/types.ts       the whole domain model, no `any`
  domain/logic.ts       derived status, capacity, join affordance, attendance signal
  store/                state.ts (reducer), StoreProvider.tsx, selectors.ts
  research/             types.ts, constraints.ts, cached.ts, live.ts, service.ts, fixtures/
  events/               source.ts (interface), adapters/{engagesc,luma,partiful,handshake}.ts
  seed/                 users.ts, quests.ts, ideas.ts, images.ts
  util/dates.ts
components/             see inventory below
scripts/validate-seed.ts
```

### The three service boundaries

Each is an interface + a fixture implementation + a comment naming its real replacement.

| Boundary | Interface | Implementations | Real replacement |
|---|---|---|---|
| Trip research | `TripResearchService` | `LiveResearchService` (Anthropic, real), `CachedResearchService` (fixtures) | already real |
| Event ingestion | `EventSource` | 4 fixture adapters | EngageSC iCal, Luma API, Partiful account link, Handshake partner API |
| Persistence | `StoreProvider` | `localStorage` | Postgres + auth |

Research selection: live when `ANTHROPIC_API_KEY` is set and `RESEARCH_MODE` is not forced to
cached; otherwise saved plans. Any live failure — no key, timeout, HTTP error, unparseable JSON —
falls back to the saved plan and stamps it `cached-fallback`, which the UI shows verbatim. There is
no path through `service.ts` that presents cached data as fresh.

---

## Data model

```ts
CohortUser      id, name, photo, homeCountry, homeUniversity, age, interests[],
                hasCar, hasUsCreditCard, bio, cohort
Friendship      userId -> friendId[]   (symmetric, seeded)

Quest           id, kind: 'trip'|'plan', title, destination, cover, startDate, endDate?,
                timeLabel?, capacity, hostId, description, signupDeadline, meetingPoint,
                costEstimate?, attachedPlanSlug?, lifecycle: 'active'|'cancelled'|'completed',
                tags[], actuals?, createdAt
Membership      questId, userId, state: 'requested'|'approved'|'declined'|'withdrawn', message?
TripActuals     lineItems[{label, estimated, actual, note}], reportedBy, hostNote

NormalizedEvent id, source, sourceEventId, title, description, image, startsAt, endsAt?,
                venueName, venueArea, costLabel, costUsd, url, tags[], category,
                hostOrg, is21Plus
Attendance      eventId, userId, state: 'interested'|'going'

Idea            slug, title, region, shape: 'day'|'weekend'|'break', hook, image,
                costBand, duration, nights, tags[], distanceLabel, needsCar
ResearchPlan    destination, researchedAt, provenance, confidence, summary,
                options: PlanOption[], assumptions[], exclusions[], constraints[],
                itinerary: ItineraryDay[], sources[], totalRange, request
```

**Quest status is derived, never stored.** `open | filling | full | closed | cancelled | completed`
is computed from capacity, approved membership count, `signupDeadline` vs now, and `lifecycle`.
Storing it would let it drift. The host occupies one seat, so `spotsTaken = 1 + approvedCount` and
`filling` means ≤ 2 spots left.

Attendance for quests is derived from approved memberships; only events carry explicit `Attendance`
records. Both feed one `attendanceSignal` function, so the "Ana and Jonas, plus 10 other exchange
students going" line is computed identically everywhere.

---

## Route map

| Route | Purpose | Key states |
|---|---|---|
| `/` | Personalised feed of open quests + upcoming events | onboarding gate, empty-after-filter |
| `/ideas` | Idea bank, tabs: day / weekend / break, carless filter | empty-after-filter |
| `/ideas/[slug]` | Planner form → research | idle, staged loading, success, error, no-cached-plan, cached notice, fallback notice |
| `/quests/[id]` | Detail, join, host console, actuals | open, filling, full, deadline passed, requested, joined, declined, own post, cancelled, completed |
| `/post` | Create trip or plan | per-field validation, prefill from research |
| `/events` | Feed with source / date / interest / free filters | loading, error, partial-source-failure, empty-after-filter |
| `/profile` | Identity, interests, constraints, friends, host inbox, reset | no requests, no hosted, no joined, no friend matches |
| `/api/research` | GET, SSE, server-only | — |

## Component inventory

Cards & feed — `QuestCard`, `EventCard`, `IdeaCard`, `SectionHeader`
Commitment primitives — `DeadlineCountdown`, `CapacityMeter`, `StatusPill`
Social — `Avatar`, `AvatarStack`, `AttendanceSignal`, `FriendPicker`
Research — `PlannerForm`, `ResearchProgress`, `PlanOptionCard`, `ConstraintsPanel`,
`AssumptionsPanel`, `ItineraryTimeline`, `ProvenanceBanner`, `ConfidenceBadge`, `CostHeadline`,
`SourcesList`
Host — `HostConsole`, `RequestRow`, `CancelControl`, `ActualsTable`
Chrome & async — `AppShell`, `Onboarding`, `Toggle`, `Chip`, `SmartImage`, `ImagePlacard`,
`EmptyState`, `ErrorState`, `LoadingState`, `Panel`, `Button`, `MetaRow`, `OutboundLink`

`SmartImage` wraps every image: Unsplash URL, `onError` → a locally drawn placard carrying the name
of the thing, so the app degrades gracefully offline without ever showing a grey box.

---

## Build order & verification

Each phase ended with `tsc --noEmit` clean and a git commit.

1. **Foundation** — design tokens, `domain/types.ts`, nav shell. *Verified:* app boots, tokens
   render light and dark.
2. **Seed data** — 25 users, 33 quests, 20 events, 19 ideas, friendship graph, 3 sets of actuals.
   Every image id HTTP-checked and visually confirmed against its subject on a contact sheet.
   *Verified:* `validate-seed.ts` asserts counts, referential integrity and status coverage.
3. **Store** — reducer, localStorage persistence with schema version, selectors, reset.
   *Verified:* mutate, reload, state survives; reset restores seed.
4. **Feed, events, adapters** — four adapters, normalisation, filters, attendance signal.
   *Verified:* every filter combination including one that returns nothing.
5. **Quests** — detail, join/approve/decline, all edge states, actuals. *Verified:* walked every
   state in the table above by hand.
6. **Posting** — create trip and plan, validation, prefill from research. *Verified:* post →
   appears in feed → open detail → countdown correct.
7. **Research** — planner, service interface, 8 cached fixtures, live route, staged SSE UI.
   *Verified:* cached path with no key; under-21/no-car changes the output; forced failure falls
   back visibly.
8. **Polish & audit** — empty/loading/error on every async surface, mobile at 375px, a grep for
   forbidden engagement metrics, console and network clean, `npm run build`.

## Verification results

| Acceptance criterion | Result |
|---|---|
| `npm install && npm run dev`, no key, every screen populated | Pass |
| Typecheck and production build, zero errors | Pass — both clean, build warning-free |
| Zero console errors or failed network requests | Pass — verified on fresh tabs |
| Idea bank across all three shapes, real image on every card | Pass — 19 ideas, all 85 photo ids HTTP-verified |
| Research returns costed plan with named transport, accommodation, working links, range, assumptions, constraints, itinerary | Pass — all 40 fixture booking links return non-404 |
| Under-21 + no car visibly changes constraints and options | Pass — Joshua Tree 4 options → 1; Las Vegas 2 → 1 with a different itinerary |
| Live path with key; cached with honest indicator without | Partial — cached and fallback verified; the live call itself could not run (no key available in this environment) |
| Post a trip and a plan end to end | Pass |
| Join request sent, approved and declined from host view | Pass — approve took a seat, decline left it open |
| All edge states render | Pass |
| Completed trip shows estimate vs actuals | Pass |
| Event feed filters by interest, date and source; attendance in named form | Pass — 20 → 5 → 0 with designed empty state |
| Empty, loading, success and error states on every async surface | Pass |
| No likes, follower counts or engagement metrics | Pass — audited by grep |
| State survives reload | Pass |
| README and PLAN accurate | This document |

### Divergences from the original plan

- **~8 trips / 15 plans became 10 trips / 23 plans.** Four extra plans were added so that all 25
  profiles host something *joinable* — otherwise picking one of four particular people made the
  approve/decline flow unreachable.
- **NDJSON streaming became server-sent events.** Reading `response.body` by hand works, but the
  browser records it as an aborted request even on a clean 200, which would fail the "no failed
  network requests" criterion on inspection.
- **`next/image` was dropped for a direct CDN load.** Unsplash already serves the right size and
  format; the optimizer added a server-side fetch in front of every photograph and failed outright
  behind a TLS-intercepting proxy.
- **A seed validation script was added** beyond the original plan, after two invariant breaks
  (mismatched request notes, uncovered hosts) got through manual checking.
