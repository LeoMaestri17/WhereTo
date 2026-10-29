# WhereTo — what is in the tree, 28 October 2026

Written at the start of the rebuild, before any feature code. It records what exists, what the
rebuild can stand on, what has to go, and the eight places where the rebuild brief and the
committed code give different answers to the same question.

---

## 1. The shape of it today

Next.js 16.3.4 (App Router), React 19.2.8, TypeScript strict, Tailwind v4. Node 24. No test
runner, no component library, no database. `npm run check` is typecheck + lint + the intake probe
+ build, and it is green as of this commit. Branch is `master`; the remote's default is `main`.

**Four routes, all client components, all reading one hand-authored file.**

```
/                 app/page.tsx              hero, one sentence, one button → /survey
/survey           app/survey/page.tsx       5-question wizard, one question per screen
/trips            app/trips/page.tsx         4 destination cards + a "coming soon" tile
/trips/[slug]     app/trips/[slug]/page.tsx  itinerary, costed lines, drive-or-not verdict
```

There are **no route handlers and no server actions**. `app/api/research/route.ts` was deleted in
`ebe836d`. Nothing in `app/` or `components/` imports `lib/pricing`, `lib/research`, `lib/intake`
or `lib/domain` — verified by grep across the whole tree.

So: **the deployed app makes zero network calls of its own and contains no live pricing.** Every
figure on screen comes from `lib/mvp/data.ts`. That is a much better starting point for the cost
architecture in Part 1 of the brief than it sounds, because the hard rule — zero external calls on
a page load — is already true by construction. What is missing is the cache and the warm script
that would let it stay true while the numbers become real.

---

## 2. The live/dead split

### Live — on the critical path, four routes deep

| File | Lines | What it is |
|---|---|---|
| `lib/mvp/model.ts` | 354 | `CostLine`, `Unit`, `Destination`, the per-person arithmetic, `decideTravel()`, `quoteTrip()` |
| `lib/mvp/data.ts` | 523 | Four destinations, every price, every source URL, every check date |
| `lib/mvp/brief.ts` | 96 | The answers, in `sessionStorage`, via `useSyncExternalStore` |
| `app/globals.css` | 414 | The NOCTURNE design system — tokens, type scale, scrims, grain, motion |
| `components/nocturne/primitives.tsx` | 281 | `PillButton`, `PillLink`, `GlassPanel`, `PhotoFrame`, 9 inline SVG icons |
| `components/nocturne/measure.ts` | 16 | The page measure, in its own module for a good documented reason |
| `components/SmartImage.tsx` | 101 | Unsplash CDN loader with a local fallback placard |
| `lib/seed/images.ts` | 128 | ~70 Unsplash photo ids, hand-matched to subjects |
| `lib/util/dates.ts` | 218 | Month grids, weekday initials, range formatting |
| `lib/util/money.ts` | 11 | — |

### Built, correct, and unreachable

This is the part worth knowing about. Roughly 2,400 lines of pricing and research machinery with
no caller in the app. It is not abandoned work — it is good work whose entry point was deleted.

| File | Lines | Verdict |
|---|---|---|
| `lib/pricing/serpapi.ts` | 126 | **Keep as the wrapper.** Single chokepoint: no SerpApi request exists outside it. Cache read → quota reserve → fetch → cache write, with one retry on 429/5xx. |
| `lib/pricing/quota.ts` | 201 | **Keep, adapt.** Three independent brakes; claims its slot synchronously before any `await` because a parallel tool batch once spent eight searches against a cap of six. |
| `lib/pricing/cache.ts` | 101 | **Keep, change the backing store.** Memory Map + optional disk, sorted-key hashing, per-engine TTLs. |
| `lib/pricing/flights.ts` | 168 | **Keep.** `engine=google_flights`, keeps the cheapest 5, separates party total from per-person. |
| `lib/pricing/hotels.ts` | 150 | **Keep.** `engine=google_hotels`, keeps the cheapest 8, carries `rooms` through for the basis line. |
| `lib/pricing/types.ts` | 163 | **Keep.** `PriceOrigin`, `PriceProvenance`, `Unavailable` as a returned value. |
| `lib/pricing/links.ts` | 117 | **Keep.** Distinguishes 403-blocked from dead. |
| `lib/pricing/ledger.ts` | 219 | **Keep, park.** `PriceLedger` + `reconcileProvenance()`. Earns its place the moment a model is allowed near a price again; dead weight until then. |
| `lib/pricing/campgrounds.ts` | 150 | **Keep.** Recreation.gov, free key, no SerpApi cost. |
| `lib/pricing/tools.ts` | 287 | **Delete or park.** Anthropic tool-definition plumbing for the agent loop. |
| `lib/research/*` | ~2,000 | **Delete.** `agent.ts` (726) is a twelve-iteration Opus tool loop; `fixtures/weekends.ts` (951) is pre-generated plan JSON for destinations that no longer exist in the product. |
| `lib/intake/*` | ~650 | **Delete.** The guided picker that fed the agent. Its one good idea — `deriveOccupancy()`, turning "four friends" into one room with dorms allowed — is worth lifting out before the directory goes. |
| `lib/domain/types.ts` | 106 | **Delete.** Residue of the social layer removed in `703c95c`. |
| `lib/seed/ideas.ts`, `lib/seed/highlights.ts` | 446 | **Delete.** 19 ideas for the old idea bank. |
| `scripts/probe-{agent,plan,live}.ts` | 629 | **Delete** with the agent they probe. |
| `scripts/probe-{pricing,intake}.ts` | 359 | `probe-pricing` **keep and rename**; `probe-intake` goes with `lib/intake`. |

### Worth reading before writing any data

`docs/research/mvp/costs.md` (125 lines) is a sourced table of every park fee, surcharge, fuel
average and age rule for the four destinations, with a confidence column saying what was checked
and when. `docs/research/destinations.md` (1,004) and `destinations-recovered.md` (577) are the
same for a wider set. `docs/research/ui.md` (1,379) is the NOCTURNE art direction in full.

**Do not re-research what is in these files.** The Zion $100 non-resident surcharge, the fact that
the $70 Zion annual pass does not waive it, the free Zion shuttle, Enterprise's 21-year floor —
all primary-sourced with URLs and dates.

### Delete count

About 4,100 lines of the 14,200 in `app`/`components`/`lib`/`scripts`, leaving the pricing layer,
the MVP model, the design system and the research notes.

---

## 3. What already answers the brief

**Part 1 rule 1, zero external calls on a page load.** Already true. The job is to keep it true.

**Part 1 rule 5, server-side only.** Already true, but only because nothing calls the pricing
layer at all. `lib/pricing/*` deliberately carries no `server-only` so the probes can import it,
which means nothing stops a client component importing `serpapi.ts` tomorrow. One wrong import and
`process.env.SERPAPI_API_KEY` is in the browser bundle. Needs a real guard, not an absence.

**Part 1 rule 6, "checked N days ago".** Every `CostLine` already carries `provider`, `source` and
`checkedOn`, and the detail page already renders provider and date per line as an outbound link.
The shape the brief asks for exists; the figures behind it are the problem (§4.8).

**Part 1, car rental has no engine → seed it.** Already done, and better than seeded: the
under-25 surcharge is in the headline, not a footnote. `decideTravel()` blocks under-21 outright
with the agency names in the reason, adds Enterprise's $25/day to the 21–24 band, and `perPerson()`
charges a Friday-to-Sunday weekend as three hire days. `lib/mvp/data.ts` is `/data/cars.json` with
types.

**Part 2, scope destinations to the photos.** Already aligned by accident: the four seeded
destinations are Zion, San Francisco, Joshua Tree and San Diego — exactly the four JPGs.

**Part 4, the control strip.** `/trips` already has the strip as a filter bar: weekend, party
size, driver, each repricing the page in place with no round trip. It is the brief's strip, one
surface too low and missing departure city and budget.

---

## 4. Where the brief and the code disagree

Eight of these. The first two are large.

### 4.1 Brand: NOCTURNE is dark, the brief is cream

`globals.css` is a complete, documented dark warm system — `--ground: #16160f`, no pure black or
white anywhere, three weighted gradient scrims measured against where type actually lands, an
feTurbulence grain layer, a glow-not-shadow depth rule. Part 3 specifies the opposite: cream
`--ground: #F8F2E6`, `--paper` cards, peri as the action colour, coral reserved for the total.

Not reconcilable by editing tokens. The scrims, the grain, the `.sq-graded` photo filter and the
glow shadows are all built on darkness; moving to cream means `globals.css` and
`primitives.tsx` are rewritten and `docs/research/ui.md` becomes history. That is a real cost and
also exactly what the brief asks for. **Which palette survives?**

Same question for the font: `layout.tsx` self-hosts Plus Jakarta Sans with a note explaining it
stands in for General Sans and Satoshi, whose licence forbids redistribution. The brief says
Figtree — also Google Fonts, also fine, a one-line change if the palette goes.

### 4.2 Images: Unsplash CDN vs `/public/assets`

`next.config.ts` has no `images` block *on purpose*, and `SmartImage.tsx` bypasses `next/image`
*on purpose* — both carry comments saying the optimiser adds a server-side fetch to every
photograph and fails outright behind a TLS-intercepting proxy. Part 2 requires `next/image` with
WebP and responsive sizes.

With local files the original objection mostly evaporates: no CDN round trip, and the optimiser's
output is cached on Vercel. I would go local. Two things to know:

- **`/public` is empty.** None of `logo.jpg`, `hero-canyon.jpg`, the four squares, `av1–5.jpg` or
  `texture.jpg` is in the tree. Nothing can be converted until they are placed.
- **`ImagePlacard`, the no-image fallback, is already broken.** It styles itself with
  `bg-surface-2`, `text-line-strong`, `type-meta` and `text-muted` — four classes that were
  renamed out of `globals.css` in the NOCTURNE commit and now resolve to nothing. The fallback has
  never been seen because Unsplash has never failed in testing. It is the exact "never show a grey
  box" path Part 2 asks for, and it currently renders an unstyled box.

### 4.3 The budget guard returns; the brief says throw

`reserve()` returns `{ok: false, reason}` and `types.ts` documents why: *"these are returned, never
thrown — a research run that loses one price source should carry on and label those lines `web`,
not collapse."* Part 1 rule 3 says the wrapper must throw when over the ceiling.

Both are right about different callers. The warm script wants a throw — stop, loudly, before
spending. A page load wants neither, because a page load must never reach the wrapper at all.
I would keep the returned verdict as the wrapper's contract and have the warm script throw on it,
which satisfies the rule where it matters without making a lost price source fatal. **Say if you
want a literal throw.**

### 4.4 `/data/usage.json` cannot be a persisted counter on Vercel

The counter is at `.pricing-cache/quota-counter.json` and reads `{"month":"2026-8","spent":19}` —
a stale month, so it would reset on the next call. The brief wants `/data/usage.json`, committed.

Committing it has two problems. A committed counter resets to the committed value on every deploy,
and **Vercel's filesystem is read-only at runtime**, so `fs.writeFileSync` throws in production.
The counter only ever increments where writes work — the warm script, on your machine, committed
deliberately. That is also the only place quota is meant to be spent, so it fits. The exception is
Part 1 rule 7's "Refresh this price" button, which spends 2 searches *from a server action in
production* and therefore cannot persist its own count. Options: drop the counter to
best-effort-in-memory in production and rely on SerpApi's own account endpoint (free to query, and
already wired up in `fetchAccountStatus()`); or keep the button out of production. **Your call.**

### 4.5 The cache must be committed, and the current one holds raw responses

`.pricing-cache/` is gitignored and holds 20 raw SerpApi JSON responses, each carrying
`search_metadata.json_endpoint` — a serpapi.com URL tied to your account. Part 1 rule 2 wants the
cache committed so Vercel serves it statically.

I would not commit raw responses. Instead: the warm script writes a **normalised** cache —
property or airline name, price, link, `fetched_at` — under `/data/cache/`, which is what the UI
actually reads, much smaller, and contains nothing account-specific. Raw responses stay in the
gitignored dev cache. Flagging it because it is a change to what the brief literally asks for.

### 4.6 Opus is hardcoded in the research layer

`lib/research/agent.ts:32` and `live.ts:18` both pin `claude-opus-5`, with `max_tokens: 32000` on
the assembly call. The brief says Haiku, never Opus or Sonnet at runtime. Moot if `lib/research`
is deleted as planned (§2) — worth stating because the only Anthropic code in the tree today
violates the rule, so the new content-generation and preference-parsing calls start from nothing.

### 4.7 `/survey` is the wizard Part 4 forbids

Part 4 opens: no routing questions, no "do you know where you want to go" modal, no wizard. The
landing page's only button goes to a five-screen wizard, and `/trips` is unreachable without
answering it or already holding a `sessionStorage` key. The brief's reading is right and the
wizard should become the control strip. Two notes:

- `CLAUDE.md` agrees with the brief, not with the code: *"the core loop, which does not change:
  browse the idea bank → click one → it goes and finds what it really costs."*
- `brief.ts` persists to **session** storage on purpose — "coming back a fortnight later to last
  fortnight's dates would be worse than being asked again." A control strip with a geolocated
  departure city probably wants that guess to persist. Easy change, deliberate decision being
  reversed, so: noted.

### 4.8 The existing prices are not all what the brief calls real

This is the one I would most want settled before Stage 3.

`CLAUDE.md` records it plainly: park fees, the Zion surcharge, the free shuttle, Enterprise's age
rules and the AAA fuel average were read off the operator's own page. **The hire rates, stay
totals, fares and parking were authored by hand** against what those operators charge, pointing at
the operator's booking page rather than a fabricated deep link. A `verified` flag existed on every
line and was removed on purpose.

The brief says never display an estimate as if it were a price. Today `/trips/[slug]` renders
`Springdale motels, two rooms at 3+ · checked 16 Sep 2026` with a link, and a reader cannot tell
that total from the $35 Zion entrance fee. Three ways out:

1. **The warm script overwrites them.** Stay totals become real `google_hotels` figures per
   destination × date window. This is what Part 1 is for and it fixes the accommodation row
   completely.
2. **Fares too, where flying is real.** Only San Francisco is a flight from LA. The other three
   are drives, and `google_flights` has nothing to say about them.
3. **Hire rates and parking stay seeded**, because Part 1 says car rental is seeded data. They
   need a label that distinguishes "Enterprise's published rate, collected by hand on this date"
   from a live quote — which is the `verified` flag coming back under a better name, and against
   the reason it was removed. The reason it was removed is good: a caveat on every line teaches
   people to ignore it. A label on the three lines that need it is different.

**The quota consequence.** Part 1 budgets the seed at 10 destinations × 4 windows × 2 engines = 80
searches. That over-buys by about a third: three of the four destinations are drives and need no
flight search at all. 4 destinations × 4 windows × 1 hotel search = 16, plus 4 flight searches for
San Francisco, is **20 searches** for a complete seed of what is actually in the product. Against
250/month, that is room to re-warm ten times. I would start there and spend the rest on more
destinations once there are photos for them.

---

## 5. Risks worth naming

**The key can still reach the browser.** `lib/pricing/*` has no `server-only` marker, by design,
so the probes can import it. Every app surface is `'use client'`. Nothing but attention prevents
`import { searchHotels } from '@/lib/pricing'` in a client component, and the failure mode is a
published API key. Needs an enforced boundary: `server-only` on a thin server-side module that
re-exports, with the probes importing the inner modules; plus a grep in `npm run check`.

**SerpApi's real remaining balance is unknown.** The local counter says 19 spent in a month that
has passed. `fetchAccountStatus()` queries the authoritative figure and is free — not itself a
search. Worth running once before the first warm.

**`npm run check` runs `probe:intake`**, which goes when `lib/intake` does. The check script needs
updating in the same commit or it breaks.

**Vercel builds `main`; the work is on `master`.** Needs resolving before anything deploys.

---

## 6. Decisions, 28 October 2026

**§4.1 — cream wins.** NOCTURNE is retired. `globals.css` and `components/nocturne/` are rewritten
in Stage 4 against the Part 3 palette, with Figtree in place of Plus Jakarta Sans.
`docs/research/ui.md` becomes a record of a direction not taken rather than a specification.

**§4.2 — the assets are illustrations, not photographs.** This is the larger half of the same
decision and it was not in the brief. What arrived is a flat illustrated set in the exact Part 3
palette: a mark (peri disc, coral four-point star), a wide canyon landscape, four square
destination scenes matching the four seeded destinations, six cost-category marks (plane, bed,
car, fuel, parking, ticket, one per accent colour), a map, an arch, a price tag and a paper
texture. No avatars are needed — there is no social layer.

Three consequences:

- **The photographic machinery goes entirely.** `.sq-graded`, the three gradient scrims, the film
  grain and `sq-text-glow` all exist to make a saturated photograph survive under dark type.
  Illustrations on cream need none of it. `SmartImage`, `lib/seed/images.ts` and the ~70 Unsplash
  ids go with them, which also retires the broken `ImagePlacard` rather than fixing it.
- **The cost icons are data, not UI chrome.** The brief says icons come from lucide-react. That
  still holds for interface affordances — chevrons, close, edit. The six illustrated marks belong
  to cost categories and are part of the brand, so they ship as assets and lucide covers the rest.
- **Nothing is on disk yet.** `/public` is still empty. The files have to be placed before Stage 4
  can render anything.

**§4.3 — the ceiling throws, everything else degrades.** Built in `lib/budget/guard.ts`. Over the
monthly ceiling raises `BudgetExceededError` before the request is built, because nothing should
be calling a paid API in that state and a quiet `unavailable` would hide the bug. A timeout, a
500, a missing key or an exhausted per-run cap still return `Unavailable` and degrade. Proved by
`npm run probe:budget` cases 2 and 7.

**§4.4 — the counter is committed, and says when it could not be.** `data/usage.json`, month-keyed
`YYYY-MM`, tracking both APIs. It increments where writes work — a `npm run warm` on a developer's
machine, which is the only place quota is legitimately spent — and those runs commit the counter
beside the prices they bought. On Vercel the write fails and `usageReport().persisted` reports
false rather than letting the count silently reset; `fetchSerpApiAccount()` is the authoritative
figure, and it is free to call. **The refresh button in Part 1 rule 7 therefore cannot persist its
own count in production.** Still open.

**§4.5 — the committed cache holds normalised quotes.** `data/cache/quotes.json`, one file,
`import`ed rather than read with `fs` so it is bundled at build time and cannot degrade into a
runtime miss. Raw provider responses stay in the gitignored `.pricing-cache/`.

**The dead stack is deleted.** `lib/research/`, `lib/intake/`, `lib/domain/`, `lib/pricing/`
`{tools,ledger,quota}.ts`, `lib/seed/{ideas,highlights}.ts` and four probe scripts: about 4,100
lines. The trigger was `new RunBudget()` in the dead agent, which no longer compiles against a cap
with no default — contorting live code to keep dead code building is the wrong trade. `ledger.ts`
went with it because it depends on `lib/research/types` and has no future caller: the only runtime
model call in this architecture parses preferences into filters, and never authors a price. All of
it is recoverable from `8f613fa`.

**§4.8 — three words, not a flag.** Every `CostLine` carries a `basis`:

| | means | on |
|---|---|---|
| `quoted` | a provider answered for these exact dates and this occupancy | warm-cache stays and flights |
| `published` | read off the operator's own page | park fees, the Zion surcharge, Enterprise's under-25 fee, the AAA fuel average |
| `seeded` | collected by hand, not checked since | hire rates, train fares, parking, the stay fallbacks |

This is the `verified` flag returning under a better name, and against the reason it was removed.
The reason was good — a caveat on every line teaches people to ignore it — but it does not apply
here, because these are three different claims rather than one warning repeated. A reader needs to
know whether a figure is *their* price or *a* price, and `weakestBasis()` rolls the rows up so one
seeded line downgrades the total rather than hiding inside it.

**Surface 3 never shows an empty row**, so a destination with no warm entry falls back to
`seededStayTotals` marked `seeded`, rather than a blank where a price should be. A warm run
replaces it with `quoted`.

### Two things Stage 3 turned up

**~~The model recommends driving to San Francisco, and the research says do not.~~ Settled: when
neither option wins outright, the person going decides.**

No price is put on an hour. Any figure for that would be invented, and a made-up hourly rate
rendered next to real prices would undo the only claim this product makes. Instead both options
carry **door-to-door** hours — a flight sold as "1h 25m in the air" is nothing like 1h 25m of your
Friday, and comparing that against a drive measured kerb to kerb is how every travel site makes
flying look better than it is — and the rule is plain dominance:

- One option cheaper **and** no slower → recommend it, and say by how much on both axes.
- Each wins on one axis → `closeCall: true`. State both sides and let the person choose. The
  cheaper one is pre-filled so Surface 3 never opens on an empty row, and the other is offered as
  `alternative` behind Change.
- One option only → no question to ask.

San Francisco comes out "Your call. Driving saves $49 a head; flying saves 1h 15m each way, 2h 30m
across the weekend." San Diego is the same shape reversed — the train saves $6, driving saves 2h 30m
across the weekend. Zion and Joshua Tree have one way in and are stated, not asked.

`writtenVerdict` keeps the researched editorial view on every quote alongside the arithmetic, so
"Do not drive" is still there to render; it no longer silently loses an argument it was never
given.

**Surface 2 wants five or six photographs of things to do, and there is one illustration per
destination.** The itineraries carry four items each with a sourced cost and a stated catch, so
the copy is there; the pictures are not. Either the panel renders them as text against the single
destination illustration, or the set needs more artwork.

## 7. Stage order

Stage 2 is done. Stage 3's `destinations.json` has `lib/mvp/data.ts` and
`docs/research/mvp/costs.md` behind it. Stage 4 inherits a filter bar that is already the control
strip, and a palette decision already made.

Open before Stage 3: §4.8, and whether the stay totals in `lib/mvp/data.ts` are replaced by warm
output or relabelled. Open before Stage 4: the asset files in `/public/assets`.
