@AGENTS.md

# SideQuest

A trip planner for USC exchange students. Read this before writing anything.

## What the product actually is

**The claim is accuracy.** Anyone can generate a plausible-looking itinerary with a language
model; the numbers on it will be recollection dressed as research. This app exists because a
nineteen-year-old on a foreign licence with no US credit history gets systematically wrong answers
from every travel site there is — the rental quote omits the under-25 surcharge, the hotel
quietly assumes a card they do not have, the bar list assumes an age they are not.

So the differentiator is not the itinerary. It is that a line saying `$415` came from a real
request to a real provider for those exact dates and that exact occupancy, and that the app can
prove it.

**The core loop, which does not change:** browse the idea bank → click one → it goes and finds
what it really costs. `/plan` is a door for people with no destination in mind, not the main road.

**One bucket, two shapes.** *Trips* are multi-day, *activities* are a few hours. Both are hosted,
both are joinable. The word "event" is not product vocabulary — where it survives in code it is a
legacy name in `lib/events/`, not a concept.

## The accuracy rules

These are not style preferences. Breaking one makes the product's only claim false.

1. **Never let a model author a booking URL.** For any line marked `api`, the URL comes from the
   tool result. Model-authored booking links are the single commonest source of dead links.
2. **Never show `api` without a matching ledger entry.** `lib/pricing/ledger.ts` records every
   tool call the server actually executed. `reconcileProvenance()` runs after assembly and
   downgrades any line that claims a source it cannot back. A tool loop on its own does not stop
   price invention — the model can call a tool, ignore the answer, and still label the line `api`.
3. **No key means no `api` line.** Unconditionally, regardless of what the model says.
4. **A price more than 10% off every quote in its ledger entry is not that quote.** Downgrade it.
   (There is a split-tolerance loop for per-person versus party totals; see the ledger.)
5. **Say which numbers are soft.** `Google Hotels · checked 2h ago` / `From a web search` /
   `Estimated, not checked`. A plan carries one summary line — *"9 of 12 costed lines came from a
   live price API"* — and that sentence is the product claim, made checkable.
6. **A 403 is not a dead link.** Booking sites refuse non-browser clients. Render it as
   "couldn't verify from here". A naive checker marks half a correct plan broken.

## Budgets — both are real and both are small

| Budget | Limit | Enforced by |
|---|---|---|
| Anthropic | a few dollars total | `RESEARCH_MODE=cached` in `.env.local` during development |
| SerpApi | **250 searches/month, hard** | `lib/pricing/quota.ts` |

**Do not spend either casually.** Development work happens against the offline harnesses:

- `npm run probe:intake` — the guided picker. Free.
- `npx tsx scripts/probe-agent.ts` — the research agent and ledger against stub responses. Free.
- `npx tsx scripts/probe-pricing.ts` — the pricing layer. Costs SerpApi quota; cached after the
  first run.
- `npx tsx scripts/probe-plan.ts` — the whole thing, live. **This is the expensive one.** Run it
  when there is something to prove, not to check your work compiles.

`quota.ts` claims its slot synchronously before any `await`. That is deliberate: an earlier
version checked the budget, awaited the account endpoint, then incremented, so five concurrent
callers all passed a check only one of them should have.

## Voice

Write like a well-informed friend who has actually done the trip. Specific, unhurried, never
chirpy.

- **Name the real thing.** "The Big Blue Bus runs there for $1.25", not "affordable transit
  options are available".
- **Lead with the reason, not the description.** A card says why to go, not what the place is.
- **State the catch.** If a recommendation has a problem — nobody can hire the car, half the venue
  is 21+, the cheapest version is over budget — say so on the card. A caveat the user finds later
  is a broken promise.
- **No exclamation marks, no emoji, no "amazing", no second person plural cheerleading.**
- British spelling in prose ("organise", "realise"); American in place names and quoted prices.
- Numbers are concrete or absent. "About $140" is fine; "affordable" is not.

## Design constraints

- **No engagement metrics.** No likes, no follower counts, no streaks, no leaderboards, no "12
  people viewed this". The app is for arranging real trips; a popularity signal turns it into
  something else. This has been decided — do not add one back.
- **Deadlines and capacity are the visual priority.** The organising primitive is: somebody
  commits first, names a date and a number of places, and sets a deadline. Everything on a card
  serves that.
- **Mobile first.** This gets used one-handed on a phone.
- **Ordering is never by popularity.** Soonest deadline first, because that is the useful order.
- Type scale and colour live in `app/globals.css` as `@theme` tokens. Use `type-*` classes; do not
  invent one-off font sizes.

## Conventions

- **The mock boundary is explicit.** Anything seeded, fixtured or estimated says so in the file's
  doc comment and in the UI. `lib/research/cached.ts` is fixtures; `lib/research/live.ts` is real.
  The user must always be able to tell which they are looking at.
- **Status is derived, never stored.** `deriveQuestStatus()` is the only place it is computed.
  Stored lifecycle is `active | cancelled | completed` and nothing else.
- **Selectors filter visibility, not ownership.** `canSee()` applies to the feed selectors only —
  applying it to `hostedBy`/`questsJoinedBy` would hide your own private post from you.
- **Comments explain why, not what.** A comment restating the code is noise. A comment recording
  the reasoning behind a non-obvious choice, or the bug that a line prevents, is the point.
- **`server-only` stays off `lib/pricing/*` and `lib/intake/*`** so the offline harnesses can
  import them. It belongs on `lib/research/{live,service}.ts`.
- Prose in this repo, including commit messages, follows the voice guide above.

## Commands

```
npm run dev            # http://localhost:3000
npm run check          # typecheck + lint + intake probe + build
npm run probe:intake   # the guided picker, offline and free
```

`npm run check` must be green before a commit.

## Environment

`.env.local`, git-ignored:

```
ANTHROPIC_API_KEY=...     # rotate after the demo, it has been through a chat log
SERPAPI_API_KEY=...       # free tier, 250/month, no card
RESEARCH_MODE=cached      # keep this set unless you are deliberately spending
RIDB_API_KEY=...          # optional, campground catalogue
```
