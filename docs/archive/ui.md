# SideQuest — UI/art-direction research

Compiled 2026-09-04. Every claim carries a URL. Written for a mobile-first Next.js 16 / React 19 /
Tailwind v4 trip planner for USC exchange students, whose product claim is *verified prices with
provenance*. The design has to look art-directed, not generated.

---

## 1. "Doesn't look AI-generated" — the tells, and the inverse

This section is first because it is the crux. The useful framing, from several working designers, is
that no single choice condemns a page — it is **the cluster of untouched defaults** that reads as
generated. Utsubo call it "the stacked defaults" problem; Sailop call it *distributional convergence*
— an LLM emits the modal token, so millions of pages converge on one aesthetic.

- <https://www.utsubo.com/blog/built-with-ai-trust-signals-2026>
- <https://www.sailop.com/blog/ai-slop-encyclopedia>
- <https://prg.sh/ramblings/Why-Your-AI-Keeps-Building-the-Same-Purple-Gradient-Website>
- <https://www.925studios.co/blog/ai-slop-web-design-guide>
- <https://uxplanet.org/how-to-spot-ai-generated-design-697aaabe76c8>
- <https://sikora.software/blog/ai-website-design>
- <https://growthguys.tech/blog/genuine-website-vs-ai-slop.html>
- <https://www.monet.design/blog/posts/escape-ai-slop-landing-page-design>
- <https://vibecodekit.dev/ai-slop-design>
- <https://rohitraj.tech/en/notes/anti-ai-slop-design-skill-hallmark-guide-2026>
- <https://uxskill.laithjunaidy.com/what-is-ai-slop.html>

### 1a. Colour tells

| Tell | Concrete form | Source |
|---|---|---|
| The violet→blue gradient | `bg-gradient-to-r from-indigo-500 to-purple-500`; Sailop measure blue→purple as the single gradient type on 41% of AI-built sites | sailop, utsubo |
| Tailwind `blue-600` (#2563EB) as primary | present on 34% of sampled AI sites | sailop |
| `indigo-500/600` accent | 22% | sailop |
| Pure `#000000` text on pure `#FFFFFF` | no hue tint anywhere in the neutral ramp | sailop |
| The whole grey ramp is Tailwind `slate` | every neutral from one family, 0% saturation | sailop |
| One accent colour only | primary + greys, no secondary, no tertiary | sailop |
| Gradient always left-to-right | `bg-gradient-to-r`, never radial/conic/odd angle | sailop |
| No `::selection` colour, no `:focus-visible` styling | the two cheapest signs nobody hand-finished it | sailop |

### 1b. Typography tells

- **Inter at default weights everywhere.** Sailop measure Inter in 47% of AI output. No display face,
  no pairing, only weights 400 and 700. Geist (Vercel's) is the 2025–26 successor tell — same
  problem, newer wrapper. <https://www.sailop.com/blog/ai-slop-encyclopedia>
- Poppins deployed whenever the brief says "friendly"; Roboto as the fallback. Same source.
- **Tracking never touched.** Large headings not tightened (should be ~`-0.02em`), all-caps labels not
  loosened (~`0.05em`). Same source.
- Type scale is Tailwind's default 1.25 ratio, untouched; no `text-wrap: balance` on headings, so
  every h1 has an orphan. Same source.
- No italic used as a real variation — emphasis is only ever bold.

### 1c. Layout tells

- **Centred hero, headline + subhead + paired CTA** ("Get started" / "Learn more"). Utsubo list the
  copy tell too: "Build the future of work", "Your all-in-one platform".
- **Three equal cards, `grid-cols-3`, identical 16px radius, identical 24px padding, identical
  heights.** Utsubo signal #4; sailop list `grid-cols-3` and `1fr 1fr` as separate patterns.
- `max-w-7xl` container on literally every section; `py-20`/`py-24` on every section regardless of
  importance; `gap-6` everywhere; `px-4` everywhere.
- Perfect symmetry — no 60/40 or 2fr/1fr split, nothing deliberately off-grid, no element allowed to
  break the column.
- Everything on a 4px grid with no optical corrections (never `padding: 0.875rem`).
- Div soup: 200+ `<div>`, no `<header>/<main>/<article>/<nav>`.

### 1d. Component & iconography tells

- **Uniform `rounded-2xl` (16px) on every surface** and `rounded-full` on every button.
- `shadow-lg` / a 0.1-opacity shadow on every card — prg.sh names "subtle shadows, exactly 0.1
  opacity" as a tell in itself.
- **Glassmorphism cards over a dark hero** — `backdrop-blur-md` sticky nav plus glowing card borders
  and an animated accent glow; vibecodekit call neon-on-dark cyan/violet "the v0/Cursor signature".
- The **Lucide `Sparkles` icon** next to anything AI-adjacent, and a pulsing "New / Announcing v2"
  badge above the hero. Sailop list the badge-with-pulse pattern; the Sparkles convention is the
  icon-level version of "AI-powered" badge copy.
- **Emoji standing in for icons** in feature bullets (🚀 ✨ 💡) — utsubo signal #10.
- Terminal mockup with three coloured dots (61% of dev-tool sites), fake dashboard cards with
  invented numbers ("Total Revenue: $12,345 ↑"), a stats row of round numbers ("10K+ users"), a
  greyscale "Trusted by" logo bar, a three-column pricing table with the middle one highlighted.
- **Stock photography of nobody**: diverse group at laptops in a well-lit office; or **abstract 3D
  blobs floating in space**; or AI illustration that is "slightly too smooth, slightly too
  symmetrical", with a plastic sheen and uncanny lighting.

### 1e. Motion tells

- `duration-300` on everything; `ease-in-out` as the only curve; `transition-all`.
- Fade-up-on-scroll applied to every element, with **linear stagger** (0/100/200/300ms) — mechanical.
- `animate-pulse` for every loading state; no custom `@keyframes`.
- No `:active` state; no hover change on cards; **no `prefers-reduced-motion` block at all**.
- Buttons that snap rather than ease (925studios).

### 1f. Copy tells (they matter — the app's voice guide already fights this)

Em-dash confetti; "seamless / robust / cutting-edge / unlock value / elevate"; hedges ("may help",
"can potentially"); "In today's fast-paced world"; "Get started" as the CTA on 38% of AI sites; alt
text that says "image"; duplicate meta descriptions. (utsubo, sailop.)

### 1g. The positive inverse — what actually reads as art-directed

Stated as concretely as the tells, because "make it look designed" is not actionable.

1. **Asymmetry with a reason.** A 2fr/1fr or 62/38 split where the wide column carries the thing that
   matters. One element deliberately breaking the grid — an image bleeding past the container, a
   caption hanging in the margin. `grid-template-areas` rather than three equal columns.
   <https://www.sailop.com/blog/ai-slop-encyclopedia>
2. **An opinionated typeface pairing**, not one neutral grotesque. A display face with actual
   character for headings and destination names, a workhorse text face for body, and a genuinely
   different face — tabular, monospaced or grotesque-numeric — for prices. Extreme weight contrast
   (300 against 800) rather than 400/700. 925studios and prg.sh both name specific escape routes:
   Fraunces, Crimson Pro, Playfair Display, Bricolage Grotesque, JetBrains Mono, Satoshi, General
   Sans. <https://www.925studios.co/blog/ai-slop-web-design-guide>
3. **Genuinely large type.** Editorial hierarchy means an h1 that is 3–5× the body size and tight
   (`-0.02em` to `-0.03em`), not 1.8× and loose. 2026 editorial trend reporting describes
   "intentional, oversized type … more like an art-directed publication than a business website".
   <https://maxibestof.one/websites/editorial>, <https://www.sayenkodesign.com/web-design-trends-2026/>
4. **Real photography with grain and a colour grade.** The named 2026 counter-trend is explicitly
   anti-smooth: CSS/SVG noise and film-grain overlays, soft vignettes, dated colour grading, bordered
   photography, travel ephemera. Cheap to do and instantly non-generated.
   <https://studio2am.co/blogs/news/naive-grainy-and-blurred-on-purpose-2026s-pushback-against-ai-smooth-design>,
   <https://www.creativebloq.com/design/graphic-design/texture-warmth-and-tactile-rebellion-the-big-graphic-design-trends-for-2026>,
   <https://crea8ivesolution.net/anti-ai-design-trends-2026/>
5. **A palette derived from a real source** rather than a Tailwind ramp — hue-tinted neutrals (3–5%
   of the brand hue mixed into every grey), an off-white ground (`#FAFAF8` warm, not `#FFFFFF`), a
   near-black with a hue (`#1A1A2E`-family, not `#000`), and a secondary sitting 60°+ away from the
   primary on the wheel. <https://www.sailop.com/blog/ai-slop-encyclopedia>
6. **Deliberate density.** Vary section padding by importance (`py-12` / `py-20` / `py-32`), tighten
   gaps between related items and widen them between unrelated ones, use `clamp()` for fluid
   spacing. A page where everything breathes equally reads as a template.
7. **Hand-set detail.** `::selection` in a brand colour; a custom `:focus-visible` ring; `text-wrap:
   balance` on headings and `pretty` on body; optical off-grid values; varied radii by role (buttons
   6px, cards 12px, images 20px) rather than one number; a real `<figcaption>`.
8. **Motion with correct easing and correct restraint.** Vary duration by travel distance (150ms for
   small state changes, 400–500ms for large elements), use an asymmetric curve such as
   `cubic-bezier(0.16, 1, 0.3, 1)` rather than `ease-in-out`, add `transform: scale(0.98)` on
   `:active`, and **do not animate high-frequency interactions** — Rauno Freiberg's point is that an
   animation you see for the hundredth time becomes a cognitive tax.
   <https://rauno.me/craft/interaction-design>, <https://www.sailop.com/blog/ai-slop-encyclopedia>
9. **Proof instead of decoration.** Utsubo signal #7: real screenshots, real named places, real
   numbers. This app is unusually lucky here — its entire differentiator *is* real numbers with
   provenance. The provenance line ("Google Hotels · checked 2h ago") is the anti-AI design element:
   no generated marketing page has one.

---

## 2. Award-winning reference sweep

Sources: Awwwards Sites of the Day and Sites of the Month, the Awwwards travel category, siteinspire,
Minimal.gallery. (Godly.website now redirects to `recent.design`, which blocks non-browser clients —
noted so you know why it is absent.)

- <https://www.awwwards.com/websites/sites_of_the_day/>
- <https://www.awwwards.com/websites/sites_of_the_month/>
- <https://www.awwwards.com/inspiration_search/travel/?page=1>
- <https://www.siteinspire.com/websites>
- <https://minimal.gallery/>

### 2a. The single most useful finding of the whole sweep

Look at the palettes Awwwards actually lists for 2026 winners. Not one is a violet gradient. Almost
every one is **a warm off-white ground, a near-black that has a hue in it, and exactly one saturated
accent**:

| Site | Ground | Ink | Accent |
|---|---|---|---|
| Illoca (Unseen Studio, SOTD 4 Sep 2026) | `#FDF2DE` cream | — | `#3B60C5` blue |
| Lama Lama (SOTM Jul 2026) | `#F9F4EB` | `#1A1C1C` | — |
| Flyward (Humbleteam) | `#FBF8F3` | `#3D2D20` warm brown-black | — |
| Here & Away (Duo Studio) | `#F0EFED` | `#00151A` blue-black | — |
| Floema (Burocratik, SOTD 13 May 2026) | — | `#241F21` | `#E9E778` acid yellow |
| Lightship (Locomotive) | — | `#29525E` slate teal | `#FA5C40` coral |
| Decathlon Yestalgia (index, SOTD 28 Aug 2026) | — | `#000` | `#F3AFCC` pink |

Sources: <https://www.awwwards.com/sites/illoca>, <https://www.awwwards.com/sites/lama-lama-2>,
<https://www.awwwards.com/sites/flyward>, <https://www.awwwards.com/sites/here-away>,
<https://www.awwwards.com/sites/floema>, <https://www.awwwards.com/sites/lightship>,
<https://www.awwwards.com/sites/decathlon-yestalgia>

The corollary: `bg-white` + `text-black` + `indigo-500` is three defaults; `#FBF8F3` + `#3D2D20` +
one hot accent is three decisions. Moving from the first to the second costs about twenty minutes of
token editing and wins most of the "doesn't look generated" battle.

### 2b. Travel and destination discovery

1. **Here & Away** — <https://www.here-away.com/> — Duo Studio + Andrea Jelic. Awwwards HM.
   Curated design-led stays. `#00151A` on `#F0EFED`; Next.js front-end on WordPress. Structure worth
   stealing: an *inspiration-view* gallery kept separate from the *filtered* property list, and
   property pages that are deliberately bare — one big photograph, a few facts, no chrome. Directly
   analogous to SideQuest's idea bank versus researched plan.
   <https://www.awwwards.com/sites/here-away>
2. **Hedwig: Curated Travel** — <https://hedwigtravel.com/> — catarisso, Awwwards HM 19 Apr 2026.
   "Editorial storytelling and a refined visual language" over photography-rich layouts. Built in
   Readymag, which is instructive: the craft here is art direction, not engineering.
   <https://www.awwwards.com/sites/hedwig-curated-travel>
3. **Cabot Cape Breton** — <https://cabotcapebreton.com/> — Channel 13, Awwwards nominee Oct 2025.
   WordPress + Nuxt + GSAP. Notable for content architecture: it merges three incompatible audiences
   (golf, stays, real estate) into one story-driven navigation instead of three tabs.
   <https://www.awwwards.com/sites/cabot-cape-breton>
4. **Lightship** — <https://lightshiprv.com> — Locomotive + Malvah Studio, SOTD. Electric travel
   trailers. `#FA5C40` coral against `#29525E` slate-teal. Scored 8.80/10 on animation *and* 8.40 on
   responsive design — the rare combination worth copying, because the motion survives the phone.
   <https://www.awwwards.com/sites/lightship>
5. **Flyward** — <https://www.flyward.com> — Humbleteam, HM 2 May 2026. Travel management. Cream
   `#FBF8F3` on brown-black `#3D2D20`. Reads premium without a single glass card.
   <https://www.awwwards.com/sites/flyward>
6. **When to Travel** (InsideAsia) — <https://www.insideasiatours.com/when-to-travel> — Unseen
   Studio. React + Laravel + GSAP. Structurally the most relevant reference in the sweep: a
   *timeline selection interface* plus horizontal slide menus for choosing when to go, on a strict
   three-colour palette (`#49C5B6` teal, `#DF6C4F` coral, white). It is an intake wizard disguised as
   a discovery tool. <https://www.awwwards.com/sites/when-to-travel>
7. **Vita Travels** — vita-travel.webflow.io — Phenomenon Studio.
8. **Snami Travel** — snamitravel.com — Lime Creative.
9. **Spain Collection Travel** — spaincollection.com — Dgrees.
10. **armenia.travel** — <https://armenia.travel> — Concept Studio. A tourism board done as editorial
    rather than brochure.
11. **Lithuania Travel** — <https://lithuania.travel/en>.
12. **Paris by Emily** — parisbyemily.com — LOOP. A one-person city guide; useful for tone.
13. **Primland Residences** — ownprimland.com — Outpost.
14. **Villas Tamarindo / 1001 Luxury** — villas-tamarindo.com — Ocitocine.
15. **Project Aperture** — project-aperture.com — Isaak De Coninck.
    (7–15 all listed at <https://www.awwwards.com/inspiration_search/travel/?page=1>)

### 2c. Editorial product sites and card-based browsing

16. **Aardvark Book Club** — <https://aardvarkbookclub.com> — FUTURE THREE®, SOTD 30 Aug 2026.
    Webflow + GSAP + Barba.js + custom 3D. Stated intent: "interactions that make every page feel
    like an unboxing" — scroll-driven reveals and real page transitions rather than fade-ins. The
    closest reference for a browsable bank of curated cards.
    <https://www.awwwards.com/sites/aardvark-book-club>
17. **Illoca** — <https://illoca.unseen.co/> — Unseen Studio, SOTD 4 Sep 2026. The listed
    interactions are worth stealing by name: *reveal interaction*, *feature demo pullout*,
    *interactive blocks*, *overlapping sections*. Overlapping sections is precisely the
    anti-symmetry move. <https://www.awwwards.com/sites/illoca>
18. **Floema** — <https://www.floema.com/en> — Burocratik, SOTD 13 May 2026. Nuxt + GSAP + WebGL.
    Acid yellow `#E9E778` on `#241F21`: proof that one weird accent can carry an entire identity.
    <https://www.awwwards.com/sites/floema>
19. **Decathlon Yestalgia** — <https://decathlonyestalgia.com/> — index + Jonathan Da Costa + Quentin
    Hocdé. Black and `#F3AFCC` pink, plain HTML5 + GSAP, no framework. An outdoors brand being loud
    and typographic. <https://www.awwwards.com/sites/decathlon-yestalgia>
20. **Terminal Industries** — terminal-industries.com — REJOUICE®, SOTM Sep 2025.
21. **Dropbox Brand** — brand.dropbox.com — Daybreak Studio, SOTM Feb 2025. The reference for
    treating a design system as an editorial object.
22. **Shopify, The Renaissance Edition** — <https://www.shopify.com/editions/winter2026> — Shopify
    Design, SOTM Feb 2026. 150 product updates presented as generative-painting editorial rather
    than a changelog. The lesson for SideQuest: a page that is fundamentally a list of facts can
    still be art-directed.
23. **Siena Film Foundation** — <https://siena.film> — Niccolò Miranda, SOTM Mar 2025.
24. **Oimachi** — <https://www.oimachi.co> — SOTD 21 Aug 2026. Webflow + GSAP, pure `#000`/`#FFF`,
    carried entirely by typography. Proof you do not need a palette if you have a typeface.
    <https://www.awwwards.com/sites/oimachi>
25. **Porto Rocha** — portorocha.com — and **Locomotive** — locomotive.ca — both via
    <https://minimal.gallery/>, for restrained type-led grids.
26. **Susanne Kaufmann** — susannekaufmann.com — and **Lift Foils** — liftfoils.com — via
    <https://www.siteinspire.com/websites>: product cards that carry a spec/caveat line gracefully.
27. **Lama Lama** — <https://lamalama.com/> — SOTM Jul 2026. WebGL + GSAP content-morphing on
    `#F9F4EB`/`#1A1C1C`. <https://www.awwwards.com/sites/lama-lama-2>

### 2d. Map-driven interfaces

28. **Komoot** — the redesigned web route planner shipped Sep 2025. Their own writeup is explicit
    that the redesign targeted "the user journey" while keeping navigation and workflows familiar to
    returning users — the correct posture for a planner: change the surface, not the muscle memory.
    <https://newsroom.komoot.com/254252-komoot-unveils-modern-design-as-part-of-ambitious-product-roadmap/>
29. **onX Backcountry** — 24k topo plus satellite/hybrid/3D, with *expert-curated content pinned to
    the map*. That pairing — a map plus editorial cards anchored to it — is the pattern to take if
    SideQuest ever puts trips on a map.
    <https://unstar.app/blog/alltrails-komoot-gaia-gps-onx-backcountry-farout-hiking-apps-ranked-2026>
30. **Gaia GPS** — the counter-example: maximum data density, minimum art direction. Useful as the
    thing not to become. Same source.
31. **Wanderlog** — praised specifically because "the visual map helps reveal when an itinerary makes
    geographic sense". SideQuest's plan view should likewise make geographic nonsense visible.
    <https://www.travelwithtmc.com/best-travel-apps/>
32. **Hipcamp** — the benchmark for map + filters + alerts + host messaging in one browse surface.
    <https://www.travelwithtmc.com/best-travel-apps/>

### 2e. What recurs across the winners (the pattern to copy)

- **GSAP is still the house animation library** for award sites (Aardvark, Floema, Decathlon,
  Cabot, Lama Lama, When to Travel). Motion (ex-Framer Motion) is the React-native equivalent and is
  what a Next.js app should use — see §5.
- **Webflow/Nuxt/Next are all represented.** Nobody wins on stack. They win on type, palette and one
  memorable interaction.
- **One memorable interaction per site, not twelve.** Aardvark's unboxing reveal; Illoca's pullout;
  Floema's scroll-triggered video zoom; When to Travel's timeline scrubber. SideQuest should pick
  one — the obvious candidate is the moment a soft estimate resolves into a verified price.

---

## 3. Typography — six pairings that read as designed

All free, all self-hostable via `next/font/google` or `next/font/local`.

### A licence warning that changes the shortlist

**Fontshare (Satoshi, General Sans, Clash Display, Switzer, Sentient, Gambetta, Zodiak, Chillax) is
mostly not safely self-hostable.** 64 of Fontshare's ~100 families ship under the ITF Free Font
Licence rather than OFL, and under ITF FFL you may not redistribute the files — self-hosting as a
webfont requires ITF's written consent, and you are expected to use their CDN. That conflicts with
`next/font/local` and with any offline build. Check each family's licence tab before adopting one;
the 36 OFL families are fine.
<https://madegooddesigns.com/fontshare/>, <https://www.fontshare.com/fonts/bespoke-serif>

So the shortlist below leans on **Google Fonts (OFL)** and two independent OFL releases.

### The unusually good, unusually on-brief find

**The National Park Service open-source font set** — <https://github.com/national-park-service/fonts>
— six typefaces drawn from US public-lands signage, all under **SIL OFL 1.1**:

- **NPS 2026** — a 1930s WPA-era art-deco display face, *variable 100–900*.
- **Switchback** — routed-trail display capitals, with a **Rough (distressed) cut** as well as clean.
- **Redwood Serif** — early-20th-century field-journal old-style transitional, one regular cut.
- **Campmate Script** — hand-painted trailhead-board brush lettering, 19 ligatures.
- **Sequoia Sans** — humanist display sans for park field guides, four cuts.
- **NPS Symbols** — 23 wayfinding pictographs (tent, campfire, compass, arrowhead, bear, trail
  markers, weather) on PUA codepoints.

That last one matters more than it looks: **it is an escape route from Lucide.** Icons drawn from
park signage instead of the same 1,400-glyph set every AI-built app uses is one of the cheapest
"this was art-directed" signals available, and it is thematically exact for a California trip app.

Separately, **the original National Park Typeface** (nationalparktypeface.com) — traced from pencil
rubbings of routed NPS signs by Jeremy Shellhorn's team at the University of Kansas, light/regular/
heavy/outline, released under OFL because "our National Parks belong to the People, so this typeface
should too." <https://nationalparktypeface.com/>,
<https://www.mentalfloss.com/article/573172/national-parks-typeface-has-been-digitized-and-its-free-to-download>,
<https://www.openculture.com/2019/06/download-iconic-national-park-fonts-theyre-now-digitized-free-to-use.html>

And **Redaction** (MCKL, for Titus Kaphar and Reginald Dwayne Betts' *The Redaction* at MoMA PS1,
creative direction Forest Young) — a display serif shipped in **seven grades of degradation**
(Redaction 10 / 20 / 35 / 50 / 70 / 100), 21 fonts, under the Open Font Licence. The grain is *in
the outlines*, so it survives at any size with no overlay hack. Genuinely impossible to mistake for
generated. <https://www.redaction.us/>, <https://www.mckltype.com/typefaces/redaction>,
<https://usemodify.com/fonts/redaction/>

### The six pairings

Baseline note: every pairing below assumes weight contrast wider than 400/700, tracking set by hand
(headings `-0.02em` to `-0.03em`, all-caps labels `+0.05em`), and `text-wrap: balance` on headings.
Those three moves alone separate a pairing from a default. <https://www.sailop.com/blog/ai-slop-encyclopedia>

**1. Fraunces (Display, `SOFT`/`WONK` axes) + Schibsted Grotesk (text) + IBM Plex Mono (numerals)**
*Mood: warm, well-read, slightly wry — a good print magazine that knows what it is talking about.*
Fraunces is a variable soft serif with optical-size, softness and "wonk" axes; run it at large sizes
with `WONK 1` for destination names and headlines, and dial the wonk off at small sizes. Schibsted
Grotesk is a media company's UI face, tuned for long-form reading with newspaper-derived proportions
— it does not look like Inter. Plex Mono carries prices with a dotted zero.
<https://fonts.google.com/specimen/Fraunces>, <https://fonts.google.com/specimen/Schibsted+Grotesk>,
<https://www.typewolf.com/google-fonts>, <https://fontcompressor.com/blog/best-variable-fonts>

**2. Instrument Serif (display) + Instrument Sans (text) + Instrument Sans tabular numerals**
*Mood: assured, contemporary, editorial-but-modern — a design studio's own site.*
A matched serif/sans superfamily, so the pairing is authored rather than assembled; Instrument Serif
is condensed and reads *big*, which is exactly what an editorial hierarchy needs. One family means
one download and a small bundle — good for a phone.
<https://fonts.google.com/specimen/Instrument+Serif>, <https://fontpair.co/fonts/google/instrument-serif>

**3. NPS 2026 (display) + Sequoia Sans or Public Sans (text) + Space Mono (numerals)**
*Mood: WPA poster, park signage, government-issue confidence. The most distinctive option here, and
the one nobody else's AI will produce.*
NPS 2026's variable 100–900 range gives real weight contrast; Switchback Rough is available for the
single largest word on a screen. Space Mono's slightly odd digits keep prices from reading as a
spreadsheet. <https://github.com/national-park-service/fonts>, <https://www.typewolf.com/google-fonts>

**4. Redaction 35 (display) + Newsreader (text) + Redaction's own figures or Martian Mono**
*Mood: printed, weathered, serious. Grain in the letterforms themselves.*
Use Redaction 35 or 50 for the largest type only; Newsreader is a screen-first news serif that holds
up in long paragraphs — the pairing gives you an editorial travel voice with no glossiness anywhere.
The catch to state on the card: Redaction is display-only, so it needs a real text face beneath it.
<https://www.redaction.us/>, <https://maxibestof.one/typefaces/newsreader>

**5. Bricolage Grotesque (display, variable `wdth`/`opsz`) + Source Serif 4 (text) + JetBrains Mono**
*Mood: contemporary editorial with an awkward, human edge — the opposite of a neutral grotesque.*
Bricolage is deliberately irregular and has a width axis, so a headline can be set genuinely wide or
condensed to fit a phone without faux-scaling. Source Serif 4 underneath keeps body copy calm.
Named as an escape route from Inter by 925studios.
<https://www.925studios.co/blog/ai-slop-web-design-guide>, <https://fonts.google.com/specimen/Bricolage+Grotesque>

**6. Archivo Expanded / Archivo (display + text, one variable superfamily) + IBM Plex Mono**
*Mood: sports-desk, timetable, transit board — factual and loud. Suits a product whose hero content
is a deadline and a number of seats.*
Archivo ships a `wdth` axis from condensed to expanded within one file, so `ARCHIVO Expanded 700` at
48px and `Archivo 400` at 15px are the same font — very small bundle, very large contrast.
<https://fonts.google.com/specimen/Archivo>, <https://www.typewolf.com/google-fonts>

### Numerals specifically — the app shows a lot of prices

The requirement is **tabular figures**, not necessarily a monospace. Misaligned decimals in a column
of quotes destroys the exact thing SideQuest is selling.

- Cheapest correct fix: `font-variant-numeric: tabular-nums;` on every price and every table cell.
  Inter, IBM Plex Sans, Archivo and Schibsted Grotesk all carry real tabular sets.
  <https://dev.to/alanwest/tabular-numbers-in-css-font-variant-numeric-vs-monospace-hacks-25cn>
- If you want the numbers to *look* different from the prose (recommended here, because the numbers
  are the product): **IBM Plex Mono** is the pick — "every digit aligning automatically and a dotted
  zero that keeps figures crisp at small sizes", OFL, on Google Fonts and github.com/IBM/plex.
  <https://madegooddesigns.com/best-fonts-for-spreadsheets/>,
  <https://fontalternatives.com/best-fonts-for/fintech/>
- Alternatives with more character: **Space Mono** (Typewolf's list, body-text-safe), **Martian
  Mono** (variable, wide), **Roboto Mono** (neutral). Avoid **Geist Mono** — it is Vercel's, it is
  the current default of every AI-scaffolded Next.js app, and it carries the same tell as Inter.
  <https://www.typewolf.com/google-fonts>, <https://www.sailop.com/blog/ai-slop-encyclopedia>
- Provenance labels ("Google Hotels · checked 2h ago") want a *third* register: 11–12px, all-caps or
  small-caps, `+0.06em` tracking, in the mono face at a muted ink. That is a hand-set detail and
  costs nothing.

### Fonts to avoid outright

Inter, Geist, Roboto, Poppins, Montserrat, Raleway, Open Sans — the first four because they are the
measured AI-output defaults, the last three because Typewolf flags them as so ubiquitous they read
as unbranded. <https://www.sailop.com/blog/ai-slop-encyclopedia>, <https://www.typewolf.com/google-fonts>

---

## 4. Colour — four defensible palettes, none of them purple

### Where these come from

- **WPA / National Park Service poster art.** The 1930s posters used Modernist type, bold flat
  graphics and a deliberately limited screen-printed palette — some designs ran up to ten screens
  with a stabilising base coat.
  <https://www.loc.gov/collections/works-progress-administration-posters/about-this-collection/>,
  <https://www.swanngalleries.com/news/vintage-posters/2020/04/wpa-poster-art-graphic-design-national-park-vintage-posters/>,
  <https://www.rangerdoug.com/>
- **Measured hex values from those posters.** Katie Jolly's `nationalparkcolors` extracts real
  palettes from WPA originals and modern remakes. Relevant to California:
  **Yosemite** `#9FC2B2 #DFDED3 #A49A69 #3F5B66 #869144`;
  **Redwoods** `#769370 #BDB2A7 #F1C646 #6E687E #F17236`;
  **DeathValley** `#B23539 #FAB57C #F7E790 #73652D #E79498 #514289`;
  **ChannelIslands** `#F5D2E6 #554C6C #EB8D43 #70646E #7397CB #CEA347`;
  **Saguaro** `#847CA3 #E45A5A #F4A65E #80792B #F2D56F #1A1237`;
  **CraterLake** `#7DCCD3 #4E7147 #BE9C9D #F7ECD8 #376597 #9888A5 #DBA662`.
  <https://www.katiejolly.io/nationalparkcolors/>,
  <https://raw.githubusercontent.com/katiejolly/nationalparkcolors/master/R/colors.R>
- **Ed Ruscha, *Standard Station* (1966).** Red / white / blue against a **split-fountain sky
  graduating deep orange to pale blue** — the gradient is a printing technique, not a CSS
  convenience, and Ruscha reprinted the same image in *Mocha* and *Cheese* to change its emotional
  register entirely. <https://www.moma.org/collection/works/76637>,
  <https://www.composition.gallery/journal/ed-ruscha-s-standard-station-1966-an-icon-of-american-pop-art/>,
  <https://guyhepner.com/news/532-ed-ruscha-standard-station-a-guide>
- **Kodak Portra 400.** Warm, medium contrast, naturally saturated without being garish; creamy
  highlights, soft blues. Worth noting what is *not* true: the real Portra look **does not** have
  teal shadows — that is a preset affectation, and copying it is its own cliché.
  <https://metergeist.com/film/kodak-portra-400>, <https://www.decafjournal.com/kodak-portra-400-review/>
- **The structural rule from §2a**: warm off-white ground, hue-tinted near-black, one saturated
  accent. Plus Sailop's neutral rule — tint every grey with 3–5% of the brand hue, never `#000` or
  `#FFF`. <https://www.sailop.com/blog/ai-slop-encyclopedia>

All contrast ratios below were computed from the hex pairs given (WCAG 2.1 relative luminance).

---

### Palette 1 — "Ranger" (WPA park poster, Yosemite-derived)

Restrained, institutional, trustworthy. The obvious fit for a product whose claim is accuracy.

**Light**
| Token | Hex | Notes |
|---|---|---|
| `--paper` | `#F4EFE2` | warm poster stock, not `#FFF` |
| `--paper-raised` | `#FBF8EF` | cards sit *lighter* than the page |
| `--ink` | `#1E2A24` | pine-tinted near-black — **12.96:1** on paper |
| `--ink-muted` | `#4A5751` | **6.60:1** — safe for provenance labels |
| `--slate` | `#3F5B66` (Yosemite) | **6.31:1** — links, verified state |
| `--sage` | `#5C6B2E` (from `#869144`) | **5.08:1** — "checked live" |
| `--clay` | `#9E2F27` (from Death Valley `#B23539`) | **6.33:1** — deadline / caveat. White on clay = **7.27:1** |
| `--rule` | `#D9D2C0` | hairlines, 1px, never a shadow |

**Dark**
| Token | Hex | Notes |
|---|---|---|
| `--ink` (bg) | `#161C19` | **15.06:1** against paper text |
| `--surface` | `#1F2723` | |
| `--paper` (text) | `#F4EFE2` | |
| `--sage` | `#A6B36B` | **7.64:1** |
| `--ember` | `#E5822F` (Denali `#E16509`, lifted) | **6.23:1** |

Every value clears WCAG AA for body text; the accents clear AA Large comfortably and most clear AA
normal. **Refuses:** shadows (uses 1px rules and paper-tone steps instead), and gradients entirely.

---

### Palette 2 — "Marine Layer" (Pacific light, June gloom to golden hour)

The honest LA palette: it is grey until 11am and then it is not. Cool ground, warm accent — the
opposite polarity of the AI default (cool accent on white).

**Light**
| Token | Hex | Contrast on `--fog` |
|---|---|---|
| `--fog` | `#EDEEEC` | ground |
| `--fog-raised` | `#F6F7F5` | |
| `--deep` | `#12212B` | **14.12:1** |
| `--deep-muted` | `#465661` | ~7:1 |
| `--pacific` | `#2F5A86` | **6.16:1**; white on pacific **7.17:1** |
| `--sun` | `#E08A2E` | golden-hour accent (use at ≥18px or as a fill) |
| `--coral` | `#C0453F` | **4.33:1** — AA for large text and UI only, not for 13px body |

**Dark** (this palette is better dark than light — it is a night palette by nature)
| Token | Hex | Contrast on `--deep` |
|---|---|---|
| `--deep` (bg) | `#0E1A22` | |
| `--fog` (text) | `#EDEEEC` | **15.17:1** |
| `--sun` | `#F4A65E` (Saguaro) | **8.80:1** |
| `--sky` | `#8FC0CE` (Voyageurs) | **8.91:1** |

**Refuses:** photography without a grade. Every image gets pushed toward the marine-layer cyan in
the shadows and the golden-hour amber in the highlights, so the photo set reads as one roll of film.

---

### Palette 3 — "Standard" (Ed Ruscha, the bold one)

Gas-station red, signal blue, cream paper, and one *earned* gradient — the split-fountain sky, used
exactly once per session (see the motion signature in Direction C). Flat, printed, no shadow, no
blur.

**Light**
| Token | Hex | Contrast on `--cream` |
|---|---|---|
| `--cream` | `#F2E7D3` | |
| `--ink` | `#171310` | **15.08:1** |
| `--standard-red` | `#C6362F` | **4.32:1** — headline/large/UI only. Cream on red **4.32:1** |
| `--signal-blue` | `#2B4C8C` | **6.82:1** — the workhorse; body links, verified state |
| `--split-a` → `--split-b` | `#F0A03C` → `#7FA9CE` | the one permitted gradient, `180deg` only |

**Dark**
| Token | Hex | Contrast on `#141110` |
|---|---|---|
| `--ink` (bg) | `#141110` | |
| `--cream` (text) | `#F2E7D3` | **15.34:1** |
| `--red` | `#E4574B` | **5.16:1** |
| `--amber` | `#F0A03C` | **8.77:1** |

**Caveat to state up front:** `#C6362F` on cream is 4.32:1 — that passes AA for large text (≥18.66px
bold / 24px) and for UI components, and fails AA for small body text. So red is a *display and
state* colour here, never a paragraph colour. That constraint is what keeps the direction disciplined.

---

### Palette 4 — "Desert Night" (dark-first, Portra-warm, Joshua Tree after sundown)

For a phone used one-handed in the evening while three people argue about dates. Dark is the primary
mode; light is the derived one.

**Dark (primary)**
| Token | Hex | Contrast on `--night` |
|---|---|---|
| `--night` | `#141A22` | ground |
| `--night-raised` | `#1C242E` | cards |
| `--sand` | `#E8DDCB` | **13.02:1** — primary text |
| `--sand-muted` | `#A69C8C` | ~6.4:1 — provenance labels |
| `--cactus` | `#7FA37A` | **6.18:1** — verified / live-API state |
| `--dusk` | `#9B8FC4` (Saguaro `#847CA3` lifted) | **5.93:1** — *this is the only violet in the entire document, and it is earned: it is the Saguaro poster's dusk, not a Tailwind indigo* |
| `--signal` | `#F2D56F` (Saguaro) | **12.10:1** — deadlines, the loudest thing on screen |

**Light (derived)**
| Token | Hex | |
|---|---|---|
| `--sand` (bg) | `#E8DDCB` | |
| `--ink` | `#241E18` | **12.27:1** |
| `--cactus` | `#4A6B48` | darkened for light mode |
| `--signal` | `#B8890E` | darkened for light mode |

**Refuses:** pure white anywhere, and any surface that glows. Contrast between surfaces comes from
2–3% luminance steps and a 1px `#2A333E` rule, not from `shadow-lg` and not from `backdrop-blur`.

---

### Rules that apply to all four

1. **No `#FFFFFF`, no `#000000`, no zero-saturation grey.** Every neutral carries 3–5% of the
   palette's hue. <https://www.sailop.com/blog/ai-slop-encyclopedia>
2. **The accent is a state, not a decoration.** Green means "this number came from a live API"; amber
   means "web search"; muted ink means "estimated". Colour maps to the provenance ladder the product
   already has, which means the palette is doing product work, not styling work. That is also the
   rule Sailop give: name tokens `--color-action-primary`, never `--color-gradient-start`.
   <https://www.925studios.co/blog/ai-slop-web-design-guide>
3. **A gradient, if any, is radial or angled and appears once.** `bg-gradient-to-r` from violet to
   blue is 41% of AI output. <https://www.sailop.com/blog/ai-slop-encyclopedia>
4. **Style `::selection` and `:focus-visible` in the accent.** Two lines of CSS, and their absence is
   a documented tell. Same source.

---

## 5. Motion — real numbers

The single best concrete reference is Emil Kowalski's published animation standards (he wrote
animations.dev and the Sonner/Vaul libraries). Everything in 5a is from
<https://github.com/emilkowalski/skills/blob/main/skills/review-animations/STANDARDS.md>
and <https://github.com/emilkowalski/skills/blob/main/skills/emil-design-eng/SKILL.md>.

### 5a. The numbers

**Durations**

| Element | Duration |
|---|---|
| Button press feedback | 100–160ms |
| Tooltip, popover | 125–200ms |
| Dropdown | 150–250ms |
| Modal, drawer, sheet | 200–500ms |

Hard rule: **UI animations stay under 300ms** except drawers/modals, which may run to 500ms because
they travel further. Duration scales with distance, which is why `duration-300` on everything is a
tell.

**Easing — replace the CSS defaults, they are too weak**

```css
--ease-out:     cubic-bezier(0.23, 1,     0.32, 1);   /* entering, exiting */
--ease-in-out:  cubic-bezier(0.77, 0,     0.175, 1);  /* moving, morphing */
--ease-drawer:  cubic-bezier(0.32, 0.72,  0,    1);   /* iOS-feel sheets */
```

Decision order: entering/exiting → `ease-out`; moving/morphing → `ease-in-out`; hover and colour →
`ease`; constant motion → `linear`. **Never `ease-in` on UI** — it delays the exact moment the user
is watching, so `ease-out` at 200ms feels faster than `ease-in` at 200ms.

**Springs (Motion / ex-Framer Motion v11–v12)**

Motion's documented defaults: `type` is a dynamic spring; tween duration `0.3s` (`0.8s` with
multiple keyframes); spring `bounce` `0.25`; physics `stiffness` `1`, `damping` `10`, `mass` `1`;
`restSpeed` `0.1`, `restDelta` `0.01`. <https://motion.dev/docs/react-transitions>

Use the **duration-based** spring API, not raw physics — it is far easier to keep tasteful:

```js
// Apple-feel, the default for almost everything
{ type: "spring", duration: 0.5, bounce: 0.2 }
// visualDuration overrides duration and specifies when the bulk of the motion is done
{ type: "spring", visualDuration: 0.3, bounce: 0.15 }
```

Keep `bounce` in **0.1–0.3**. Reserve anything above that for drag-to-dismiss. The classic
"bouncy-cheap" preset — `stiffness: 300, damping: 10` — is exactly what makes a page feel like a
toy. <https://stacknotice.com/blog/framer-motion-react-animations-2026>

**Physicality**

- Never `scale(0)`. Enter from `scale(0.9–0.97)` + `opacity: 0`.
- Popovers scale from their trigger via `transform-origin`; modals stay `center`.
- `:active` on a button: `scale(0.97)`, 160ms, `ease-out`. Its absence is a documented AI tell.
- Stagger **30–80ms** between items, and never block interaction while it plays. Linear
  0/100/200/300ms cascades read mechanical.

**Performance**

Animate `transform` and `opacity` only. Avoid animating `height`/`width`/`padding`/`top`/`left`.
Kowalski's sharper note: prefer full transform strings over Motion's `x`/`y`/`scale` shorthands,
which run on the main thread.

### 5b. Direction-aware step transitions for a wizard

The canonical Motion pattern, and the one to implement:

```jsx
const [[step, dir], setStep] = useState([0, 0]);   // dir: +1 forward, -1 back

<AnimatePresence mode="popLayout" custom={dir} initial={false}>
  <motion.section
    key={step}
    custom={dir}
    variants={{
      enter: (d) => ({ x: d > 0 ? 24 : -24, opacity: 0 }),
      center: { x: 0, opacity: 1 },
      exit:   (d) => ({ x: d > 0 ? -24 : 24, opacity: 0 }),
    }}
    initial="enter" animate="center" exit="exit"
    transition={{ type: "spring", visualDuration: 0.28, bounce: 0.12,
                  opacity: { duration: 0.15, ease: [0.23, 1, 0.32, 1] } }}
  />
</AnimatePresence>
```

Four things make this read as expensive rather than cheap:

1. **The travel is small — 24–32px, not 100%.** A full-viewport slide is a phone-carousel cliché and
   it costs 400ms you do not have. The direction is *legible* at 24px.
2. **`custom` threads the direction into the variants** so back genuinely reverses. Motion resolves
   `custom` on exiting children too, which is why the exit variant knows the direction.
   <https://motion.dev/docs/react-transitions>
3. **Opacity is faster than position** (per-value transitions, `transition.opacity`). Motion supports
   per-value config with a `default` key. Cross-fading at the same rate as the slide is what makes
   transitions look muddy.
4. **`mode="popLayout"`** so the outgoing step is popped from flow and the layout does not jump when
   two steps of different heights overlap. `mode="wait"` doubles the perceived latency — avoid it in
   a wizard where speed is the point.

Also animate the container height with a spring rather than letting it snap, and measure it with
`useMeasure`/`ResizeObserver` — a wizard whose card height jumps between a 3-option step and a
12-option step is the single most common "cheap" tell in this pattern.

### 5c. Progress indication

- A determinate bar, animated `transform: scaleX()` (not `width`), 200ms `ease-out`. Never
  `animate-pulse`.
- Kowalski's frequency table matters here: a progress bar updates every step, i.e. **tens of times
  per session — "remove or drastically reduce"**. So the bar animates, the number does not; the
  step counter should just change.
- Never animate keyboard-initiated actions. If someone is pressing Enter through the wizard, the
  animation is pure latency.

### 5d. Reduced motion

The rule is **"fewer and gentler animations, not zero"** — keep the animations that aid
comprehension (a cross-fade tells you the content changed), drop the ones that move things.

```css
@media (prefers-reduced-motion: reduce) {
  * { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
}
/* better: keep opacity, drop translation */
@media (prefers-reduced-motion: reduce) {
  .step { transition: opacity 150ms ease; transform: none !important; }
}
```

In Motion, wrap the app in `<MotionConfig reducedMotion="user">` — Motion then automatically drops
`transform` animations while keeping `opacity` and colour. Also gate hover effects, because touch
devices fire false hovers:

```css
@media (hover: hover) and (pointer: fine) { .card:hover { transform: translateY(-2px); } }
```

### 5e. View Transitions API — the 2026 status

- **Same-document transitions are Baseline as of October 2025**: Chrome 111+, Safari 18+, Firefox
  144+. `:active-view-transition` became Baseline Newly Available on **13 January 2026**.
- **Cross-document (MPA) transitions are NOT Baseline**: Chrome/Edge 126+ and Safari 18.2+, Firefox
  not shipped in stable. MDN's status line for `@view-transition` is "Limited availability".
- Caveats that bite: a **four-second timeout** — if the incoming document does not render in time the
  transition silently fails; only same-origin user-initiated navigations qualify; snapshots scale
  independently, so put `object-fit: cover` on `::view-transition-old()` and `::view-transition-new()`
  or your destination photos will distort mid-transition.
  <https://brainstormsandraves.com/css/view-transitions-2026/>,
  <https://css-tricks.com/cross-document-view-transitions-part-1/>,
  <https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API>

**In Next.js 16 specifically:** set `viewTransition: true` in `next.config.ts`, wrap the root layout
in React's `<ViewTransition>` (still `unstable_`-prefixed, React 19.2 / Canary), and — the part that
matters for a wizard — **`<Link>` in Next.js 16.2 accepts a `transitionTypes` prop**, an array of
strings passed to `React.addTransitionType`, which is how you get *direction-aware* transitions
declaratively (`transitionTypes={['forward']}` vs `['back']`) and branch on them with
`:active-view-transition-type()`. Expect renames: the APIs are unstable because VT Level 2 is still
moving.
<https://dev.to/x4nent/complete-guide-to-nextjs-16-react-192-in-production-rsc-security-view-transitions-turbopack-5090>,
<https://www.digitalapplied.com/blog/react-19-2-view-transitions-animate-navigation-nextjs-16>,
<https://www.devya.dev/blogs/view-transitions-nextjs-app-router-field-notes>

**Recommendation for SideQuest:** use View Transitions for *route* changes (idea card → detail page,
where a shared-element morph of the destination photograph and title is genuinely impressive and
costs almost no code), and Motion for the *in-page* wizard steps, where you need interruptibility and
direction-aware variants that VT cannot express as cleanly. Progressive-enhance:
`if (!document.startViewTransition) { update(); return; }`.

### 5f. What makes motion read as expensive rather than bouncy-cheap

1. **Restraint by frequency.** Kowalski's table: 100+ times a day → no animation at all. The idea
   bank scrolling should not animate. The one moment that *should* is rare and meaningful — an
   estimate resolving into a verified price.
2. **Short travel, strong curve.** 24px on `cubic-bezier(0.23, 1, 0.32, 1)` reads confident; 100% on
   `ease-in-out` reads like a template carousel.
3. **Low bounce.** 0.1–0.2. Overshoot is the single loudest cheapness signal.
4. **Interruptibility.** CSS transitions and springs retarget from the current value; keyframes
   restart from zero. Anything the user can trigger twice quickly must be a transition or a spring.
5. **Asymmetric timing.** Slow on the decision (a press-and-hold confirm), fast on the release.
6. **Nothing animates that the user did not cause.** No scroll-triggered fade-up on every element.
7. **`@starting-style`** for entry animations gets you interruptible entrances with no JS at all —
   worth using for toasts and the price-resolved state.

---

## 6. Onboarding and intake flow patterns

### 6a. One question per screen versus grouped — the evidence

The data is lopsided in favour of one-at-a-time, *for long forms*:

- Typeform's one-question-at-a-time interface reports ~47% average completion against a ~21.5%
  industry average, and 40–60% against Google Forms' 15–20% on identical questions.
  <https://hackceleration.com/typeform-review>, <https://gnosari.com/blog/conversational-completion-rates>
- Formstack, across 650,000+ submissions: multi-step forms completed **25.4% more often** than
  single-page forms. <https://rowform.io/blog/single-question-vs-long-forms-the-data-on-why-single-question-forms-win/>
- Mobile widens the gap: SurveySparrow's 2025 in-app study found 85% completion for conversational
  versus 22% for traditional. <https://tinycommand.com/blogs/conversational-forms-vs-traditional-forms-which-is-better-for-your-business>
- **But**: the advantage only shows above ~6 fields. Below 5, grouped forms perform equally well or
  better. Same source.

**Implication for SideQuest:** `/plan` should be one question per screen — but the number of screens
is the thing to fight over, not the pattern. Onboarding guidance converges on **5–7 steps**, most
users expect to finish in **under a minute**, and every extra step costs users.
<https://userpilot.com/blog/best-user-onboarding-experience/>,
<https://formbricks.com/blog/user-onboarding-best-practices>

Group the cheap, related questions (dates + party size belong on one screen — they are one thought)
and isolate the expensive ones (budget; what kind of trip). Nubank's structure is the model: start
*light* (email/phone) and escalate to heavier questions once there is sunk cost, and insert a reward
moment after the heaviest step to hold momentum.
<https://craftinnovations.global/banking-onboarding-best-practices-revolut-nubank-monzo/>

### 6b. What makes a multi-question flow feel fast rather than like a form

1. **Auto-advance on single-select.** Tap an option, the step commits, the next slides in. This is
   the single biggest perceived-speed lever, and it is what makes Typeform and Duolingo feel unlike
   a form. Constraints below.
2. **No visible "Next" button on single-select steps** — but keep one on multi-select and text steps,
   otherwise the user does not know how to commit.
3. **Keyboard affordances.** Typeform's convention is worth copying literally: number/letter keys
   pick an option (`1`, `2`, `3` or `A`, `B`, `C` printed in the option chip), `Enter` advances,
   `Shift+Enter`/`Esc` goes back. On desktop this makes a 7-step flow a 7-keystroke flow.
4. **Everything visible without scrolling.** Baymard: when users must scroll to reach part of a
   booking search, error rate and effort both rise. On a phone this means the question, the options
   and the commit control fit above the fold at 375×667.
   <https://baymard.com/blog/travel-accommodations-booking-search>
5. **Answers persist and are editable.** Back must restore the previous answer, not blank it. Answers
   already given should be visible as a compact summary strip, tappable to jump back — Monzo's
   checklist model ("That's 1 section down, 3 to go") made spatial.
6. **Optimistic transitions.** Do not block the step change on a network call. Start the research
   request when the answer commits and let the wizard keep moving.
7. **Skip is allowed and visible.** Onboarding research is consistent that letting users skip beats
   forcing completeness. <https://userpilot.com/blog/best-user-onboarding-experience/>

### 6c. Progress indication

- Prefer **"Step 3 of 6"** in text plus a thin determinate bar. Monzo's explicit section counting is
  the reference; Revolut's implicit progress (no counter during verification) works only when the
  user cannot judge the length anyway.
  <https://craftinnovations.global/banking-onboarding-best-practices-revolut-nubank-monzo/>
- Animate the bar with `transform: scaleX()`, 200ms `ease-out`, and *do not* animate the counter (see
  §5c — it changes every step, which puts it in the "reduce or remove" band).
- Accessibility: `aria-valuenow` / `aria-valuemax` / `aria-label` on the progress element, and
  `aria-current="step"` on the active step. <https://www.accessibility.chat/articles/multi-step-forms-where-user-experience-and-accessibility-collide>

### 6d. Back navigation

- Back must be present on every step after the first, and must be the browser back button as well as
  a control — a wizard that traps the browser back button is the fastest way to lose a phone user.
  Push a history entry per step.
- Back reverses the transition direction (§5b). This is the whole point of direction-aware motion:
  it is the only cue that tells the user the flow has a shape.
- Back never re-asks. Restore the answer and place focus on it.

### 6e. The date-range picker specifically

This is the hardest control in the flow and the one most often botched on mobile.

- **Two-tap range on a single scrolling calendar** is the pattern: tap start, tap end, the range
  fills. Continuous vertical scroll of months (Airbnb's mobile model) beats paged month-by-month on
  a phone, because a trip 6 weeks out is a scroll, not five taps of a chevron.
  <https://mobbin.com/glossary/date-picker>, <https://www.storyly.io/post/best-user-experience-datepicker-examples-for-mobile-and-web>
- **Show adjacent months' dates rather than empty cells** at the boundaries.
  <https://www.storyly.io/post/best-user-experience-datepicker-examples-for-mobile-and-web>
- **Put availability and price *in* the calendar cells.** Airbnb showing available/unavailable dates
  in the picker eliminates the zero-results dead end. For SideQuest this is a gift: the calendar can
  carry a cheap/expensive signal per date once prices are known, which is a genuine differentiator
  and not something a template does. <https://uxplanet.org/date-picker-design-best-practices-41bd522f10a5>
- **Offer "flexible" shortcuts** above the calendar — *a weekend*, *a week*, *next month* — because a
  student planning a side quest often has a duration, not a date.
- **Never a triple dropdown** (day/month/year) and never a raw `<input type="date">` pair on desktop;
  do accept typed input as an escape hatch.
  <https://uxplanet.org/date-picker-design-best-practices-41bd522f10a5>
- Accessibility: the calendar grid is a `role="grid"` with arrow-key navigation, `aria-selected` on
  the range, a live region announcing the selected range in full prose ("14 to 17 November, 3
  nights"), and every date cell must be reachable by keyboard. The range itself must be stated in
  text somewhere outside the grid.

### 6f. Asking party size well

- **Use a horizontal input stepper (− / +)**, not a dropdown. NN/g: steppers suit fields with a
  common default and small discrete adjustments — passenger and guest counts are the canonical
  example — and *horizontal* placement with separated buttons prevents accidental double-taps on a
  phone. Airbnb's mobile app uses exactly this.
  <https://www.nngroup.com/articles/input-steppers/>
- Minimum target **1cm × 1cm** on touch. State the max explicitly. Support long-press acceleration
  and keyboard arrows. Same source.
- Avoid steppers where the value varies widely or is continuous — so *party size* yes, *budget* no
  (budget wants a slider with typed override, or better, a set of named bands).
- SideQuest-specific: party size is not one number. "3 people, 2 of whom are under 25 and cannot
  hire the car" is the actual product-relevant fact. Consider a stepper for the count plus one
  follow-up chip row ("anyone over 25 with a US licence?", "anyone over 21?") — those two questions
  are what make the app's answers different from every other travel site, so they deserve a screen.

### 6g. Accessibility requirements for the flow

- **Focus management is the whole game.** On step change, move focus to the new step's heading (an
  `<h2>` with `tabIndex={-1}`), not to the first input — moving focus to an input skips the question
  text for a screen-reader user. Announce "Step 2 of 6" as part of that heading.
  <https://design.va.gov/templates/forms/accessibility-guidelines>,
  <https://www.accessibility.chat/articles/multi-step-forms-where-user-experience-and-accessibility-collide>
- **Do not use `aria-live` and a focus move for the same announcement.** A newly focused element is
  prioritised in screen-reader output and will swallow the live region. Pick one — the focused
  heading is the more reliable.
  <https://medium.com/@python-javascript-php-html-css/enhancing-multi-step-form-accessibility-with-aria-live-78d2459e415a>
- **Auto-advance is an accessibility hazard on radio groups.** Arrow keys move between radios in a
  group; if selection auto-advances, a keyboard user can never reach option 3. Fix: auto-advance
  only on *pointer/tap* selection, or on `Enter`, never on arrow-key change. Announce the advance.
- `aria-live="polite"` for validation, never `assertive`.
  <https://www.reform.app/blog/accessible-form-validation-best-practices>
- Every step is a real `<form>` with a real `<fieldset>`/`<legend>` for the question; options are
  real `<input type="radio">`, not divs. The "everything in divs" pattern is both an AI tell and an
  a11y failure. <https://www.sailop.com/blog/ai-slop-encyclopedia>
- WCAG 2.2 additions that hit this flow: 2.4.11 Focus Not Obscured (the sticky bottom bar must not
  cover the focused element — a real risk on a mobile wizard), 3.3.7 Redundant Entry (do not re-ask
  anything), 3.2.6 Consistent Help. <https://www.thewcag.com/examples/forms>

### 6h. Named reference flows worth studying

| Flow | Why |
|---|---|
| **Typeform** | The origin of one-question-per-screen with letter-key selection and Enter-to-advance. <https://hackceleration.com/typeform-review> |
| **Monzo** | Explicit checklist progress, conversational human language, separate screen per genuinely separate question. <https://craftinnovations.global/banking-onboarding-best-practices-revolut-nubank-monzo/> |
| **Nubank** | Light-to-heavy escalation and a reward moment placed after the worst step. Same source. |
| **Revolut** | Implicit progress plus a stated time budget ("in under 15 minutes") — set expectations instead of showing a bar. Same source. |
| **Duolingo** | Auto-advance, immediate feedback, and a flow that never shows a keyboard when a tap will do. <https://userguiding.com/blog/user-onboarding-best-practices> |
| **Arc browser** | Onboarding as a guided *first use* rather than a questionnaire — each step advances only when the user does the thing. <https://www.saasui.design/pattern/onboarding/arc-browser>, <https://pageflows.com/post/mac-os/onboarding/arc/> |
| **Hinge** | The reference for asking personal questions on a phone without it feeling like a form. <https://pageflows.com/ios/products/hinge/> |
| **Airbnb search** | Date range + guest stepper done properly on mobile; availability shown in the picker. <https://mobbin.com/glossary/date-picker> |
| **InsideAsia "When to Travel"** | A timeline-scrubber intake that reads as a discovery toy. <https://www.awwwards.com/sites/when-to-travel> |

Note the general finding that **user-triggered flows outperform auto-triggered ones by 2–3x** — so
`/plan` should be a door the user chooses, which is exactly how CLAUDE.md already frames it.
<https://userpilot.com/blog/best-user-onboarding-experience/>

---

## 7. Destination cards and destination detail pages

### 7a. The regulatory fact that should shape the price display

Since **12 May 2025** the FTC's Rule on Unfair or Deceptive Fees has required short-term lodging and
live-event sellers to display the **total price including all mandatory fees before checkout**, and
bans drip pricing in advertising. Taxes may be deferred to checkout but must appear before payment
details are entered. Airbnb responded in April 2025 by making total-price display the default
worldwide — no toggle — across search results, maps, filters and listing pages.
<https://www.ftc.gov/business-guidance/resources/rule-unfair-or-deceptive-fees-frequently-asked-questions>,
<https://www.hoteldive.com/news/ftc-junk-fees-rule-takes-effect-hotels/747738/>,
<https://www.cnn.com/2025/04/21/business/airbnb-total-pricing>,
<https://developers.booking.com/demand/docs/compliance/ftc-compliance>

Two consequences for SideQuest:

1. **The card's headline number should be an all-in total for the party and the dates, not a "from
   $X/night".** That is now the industry default, it is what the audience expects, and it is the
   number the app's research actually produces.
2. **"Excludes taxes" is itself a provenance statement** and belongs in the same line as
   "Google Hotels · checked 2h ago". The app already has the vocabulary for this; it just needs one
   more rung on the ladder.

### 7b. How the best travel cards are structured

**Airbnb (the baseline everyone's users have already learned).** Photo-first, full-bleed image with
rounded corners dominating the grid; a single variable typeface (Airbnb Cereal VF) doing the whole
hierarchy; one coral accent (`#FF385C`, "Rausch") used *sparingly* — logo, search CTA, key
interactive elements only. The booking column's fixed order is: **price headline → dates → guest
selector → CTA → "You won't be charged yet" disclaimer.** The interface deliberately recedes so the
listings breathe. <https://superdesign.dev/blog/airbnb-design-system>,
<https://open-design.ai/plugins/design-system-airbnb/>

The transferable lesson is not the look — copying Airbnb's coral-on-white would be its own kind of
generic — it is the **fixed field order** and the **single sparing accent**. And note that the
disclaimer sits *inside* the price block, not in a footnote. Caveats live with the number they
qualify.

**Here & Away** separates an *inspiration view* (photographic, unfiltered, browsable) from a
*filtered property list* (structured, comparable), and keeps its property pages deliberately bare:
one large photograph, a handful of facts, no chrome. That is precisely SideQuest's idea bank vs.
researched-plan split. <https://www.awwwards.com/sites/here-away>

**Hedwig** leads with editorial storytelling rather than specs — the card says *why to go*.
<https://www.awwwards.com/sites/hedwig-curated-travel>

**Hipcamp** reorganised its detail pages around "land orientation" in 2022: the user meets the
**property as a whole** first, then the individual sites within it. Before that, sub-listings hid
behind a breadcrumb and users formed wrong expectations. The general principle — *establish the
container before the item* — maps directly onto trip → activities within a trip.
<https://www.hipcamp.com/journal/engineering/landing-the-perfect-experience>

**Lift Foils / Susanne Kaufmann** (siteinspire) are the reference for a product card that carries a
spec or constraint line without looking like a spreadsheet: the constraint is set in a smaller,
tracked, muted register directly beneath the name, and it never gets its own coloured badge.
<https://www.siteinspire.com/websites>

### 7c. A recommended card structure for SideQuest

Ordered by what should win a glance on a 375px-wide phone. Deliberately asymmetric — no three-equal-
column grid, no uniform card heights (§1c).

```
┌─────────────────────────────────────────┐
│  [photograph, 4:5, graded, grain]       │   full-bleed, one corner radius (20px)
│                                         │
│  ┌───────────────────────────────────┐  │
│  │ 11 DAYS LEFT · 3 OF 6 PLACES      │  │   deadline + capacity — the visual
│  └───────────────────────────────────┘  │   priority per CLAUDE.md; sits on the
│                                         │   image, not below it
├─────────────────────────────────────────┤
│  Joshua Tree, two nights                │   display face, 24–28px, -0.02em
│  Because the granite at Hidden Valley   │   text face, 15px — the REASON, not
│  is warm until nine at night.           │   the description (voice guide)
│                                         │
│  $186  per person, all in               │   mono/tabular, 30px, ink
│  Google Hotels · checked 2h ago         │   mono, 11px, +0.06em, muted, with a
│                                         │   2px dot in the provenance colour
│  Nobody under 25 can hire the car.      │   the CATCH, stated on the card, in
│                                         │   the caveat colour, never a badge
└─────────────────────────────────────────┘
```

Design rules embedded in that:

- **Deadline and capacity outrank everything**, including the price, per the product's own design
  constraints. They go on the image so they survive a fast scroll.
- **Reason before description.** One sentence, specific, no adjective doing the work of a fact.
- **Price is one number with a unit**, in the numeric register (§3), with `font-variant-numeric:
  tabular-nums` so a column of cards aligns.
- **Provenance is a fixed slot, always present, never optional.** Three states, three colours,
  one vocabulary:
  `● Google Hotels · checked 2h ago` (live API — accent green)
  `◐ From a web search` (soft — muted ink)
  `○ Estimated, not checked` (unverified — muted ink, hollow mark)
  The mark is a small filled/half/hollow disc, not an icon from a library. That is a hand-set detail
  and it is unfakeable.
- **The catch is a first-class field**, in text, in the caveat colour, never hidden behind a "see
  details". A caveat the user finds later is a broken promise.
- **Vary card heights.** Cards with a catch are taller. Uniform card heights is a listed AI tell;
  here the variation is *meaningful*, which is the difference between asymmetry and mess.
  <https://www.sailop.com/blog/ai-slop-encyclopedia>
- **Ordering by soonest deadline**, per CLAUDE.md, and the sort order should be *stated on screen*
  ("soonest deadline first") because an unexplained order reads as an algorithm.

### 7d. A recommended detail page structure

1. **Photograph and the two facts that make it a commitment** — deadline, places left. Above the
   fold, no exceptions.
2. **The reason to go**, 2–3 sentences, editorial voice, genuinely large type.
3. **The total, prominently, all-in** — with the party size and dates it was computed for restated
   next to it, because a number without its assumptions is not a number.
4. **The provenance summary line** — *"9 of 12 costed lines came from a live price API."* This is
   the product claim and it should be typeset as a claim: its own band, larger than a caption,
   with the ratio in the numeric face. It is the single most distinctive element the app has and
   nothing on any AI-generated page looks like it.
5. **The line-item table.** Right-aligned tabular figures; a provenance mark per row; the row's
   source and timestamp on hover/tap, not permanently. Zebra striping is unnecessary if the numeric
   face is monospaced and the rules are 1px.
6. **The catches, gathered.** Under-25 surcharge, 21+ venues, card requirements. A short list, in
   prose, in the caveat colour. Named specifically — "Hertz adds $27/day under 25", not "age
   restrictions may apply".
7. **What is not covered** — the honest negative space. Excludes taxes; excludes anything the
   research could not price.
8. **Commit** — the join/host action, sticky at the bottom on mobile, with the deadline repeated in
   it. Watch WCAG 2.2 SC 2.4.11: a sticky bar must not obscure a focused element.
   <https://www.thewcag.com/examples/forms>

### 7e. How the good ones show a caveat (and how the bad ones do)

| Good | Bad |
|---|---|
| Caveat in prose, in the same block as the number it qualifies (Airbnb's "You won't be charged yet") | A coloured pill badge that says "Note" |
| Named, quantified, and attributed | "Restrictions may apply" |
| Present on the *card*, not only the detail page | Revealed after the user commits |
| Rendered as "couldn't verify from here" when a checker gets a 403 | Rendered as "broken link" — a 403 is a booking site refusing a non-browser client, and a naive checker marks half a correct plan broken |
| A distinct, muted colour that is not the error colour | Red, which trains people to ignore it |

---

# THREE ART DIRECTIONS

Each is fully specified and each refuses something the other two allow. They are not three
minimalisms: A is printed and institutional, B is photographic and cinematic, C is flat, loud and
pop. Pick one and commit — the failure mode is blending them, which produces exactly the averaged
look the whole document is trying to avoid.

All three assume: mobile-first at 375px, one-handed use, `font-variant-numeric: tabular-nums` on
every price, a fixed provenance slot on every costed line, `prefers-reduced-motion` honoured, and
`::selection` + `:focus-visible` styled in the accent.

---

## Direction A — **FIELD NOTES**

> **The idea in one sentence:** SideQuest as a National Park Service field guide — routed signage,
> permit paper, hairline rules and a total that reads like a stamped figure, because the product's
> claim is accuracy and nothing on earth looks more accurate than a park sign.

### Typeface pairing
| Role | Family | Weights | Source |
|---|---|---|---|
| Display / destination names | **NPS 2026** (variable 100–900, WPA art-deco) | 700–800, `-0.02em` | <https://github.com/national-park-service/fonts> (OFL 1.1) |
| The one huge word | **Switchback Rough** (routed caps, distressed cut) | Regular | same repo |
| Text | **Schibsted Grotesk** | 400 / 500 / 700 | Google Fonts (OFL) |
| Numerals, provenance, tables | **IBM Plex Mono** | 400 / 500 | Google Fonts (OFL) |
| Icons | **NPS Symbols** (23 pictographs: tent, campfire, compass, arrowhead, bear, trail markers, weather) | — | same repo |

The icon decision is the direction's signature. **No Lucide anywhere.** A tent glyph traced from park
signage instead of the same icon set as every scaffolded app is the cheapest and most complete escape
from the generated look. Where NPS Symbols has no glyph, draw the missing one — there will be four or
five, and hand-drawing them is the point.

### Palette (Ranger, §4 Palette 1)
```css
:root {                          /* light */
  --paper:        #F4EFE2;   --paper-raised: #FBF8EF;
  --ink:          #1E2A24;   /* 12.96:1 on paper */
  --ink-muted:    #4A5751;   /* 6.60:1  — provenance labels */
  --slate:        #3F5B66;   /* 6.31:1  — links, "verified" */
  --sage:         #5C6B2E;   /* 5.08:1  — live-API state */
  --clay:         #9E2F27;   /* 6.33:1  — deadline, caveat; white on clay 7.27:1 */
  --rule:         #D9D2C0;   /* 1px hairlines — the only separator that exists */
}
:root[data-theme="dark"] {
  --paper:        #F4EFE2;   /* now the text */
  --ink:          #161C19;   /* now the ground; 15.06:1 */
  --paper-raised: #1F2723;
  --sage:         #A6B36B;   /* 7.64:1 */
  --ember:        #E5822F;   /* 6.23:1 */
  --rule:         #2C3531;
}
```

### Grid philosophy
A **two-column asymmetric field-guide grid, 2fr / 1fr**, that holds on desktop and collapses to a
single column with a **hanging margin** on mobile: labels, dates and provenance marks live in a 56px
left gutter, content in the rest. Section padding varies by importance — `py-12` for a list,
`py-32` for the plan summary. Separation is **always a 1px rule in `--rule`**, never a shadow, never
a filled card. Radii: buttons 4px, cards 8px, images 2px. Nothing is `rounded-2xl`.

### Imagery
Duotoned photography — `--ink` to `--paper`, with a 4% SVG feTurbulence grain overlay — so every
photograph in the app looks like it was printed on the same press. Photographs are **cropped hard and
placed off-axis**, one bleeding past the container per screen. No 3D, no illustration, no stock.
Where a photo is missing, a routed-sign block of Switchback Rough type takes its place — a deliberate
non-image rather than a grey rectangle.

### Motion signature
**Almost none, and then one.** No scroll animation at all. Everything is 1px rules and instant state
changes at 120–160ms `ease-out`. The single animation in the product is **the price stamp**: when a
line resolves from estimate to verified, the number cross-fades (150ms) while the provenance mark
fills from hollow to solid over 220ms `cubic-bezier(0.23, 1, 0.32, 1)`, and the row's left rule
briefly thickens to 2px in `--sage`. That is it. Restraint *is* the motion design here, and it maps
exactly onto Kowalski's frequency rule.

### One onboarding step — "How many of you, and how old?"
Full-bleed `--paper`. In the left gutter, `03 / 06` in IBM Plex Mono 11px, `+0.06em`, `--ink-muted`,
with a 1px rule beneath spanning 50% of the width (the progress bar — a rule that grows, not a
pill). The question in NPS 2026 700 at 32px, `-0.02em`, two lines maximum. Beneath it a horizontal
stepper: `−  3  +`, each button 48×48px, 1px `--rule` border, no fill, the number in Plex Mono at
40px. Beneath that, two chip rows, each a real radio group: *"Anyone 25 or over with a licence?"* /
*"Anyone 21 or over?"* — with the consequence printed under each in 13px `--ink-muted`: *"Under 25,
every rental adds a surcharge."* Bottom: a text link *Back* on the left and a `--clay` filled button
*Next* on the right, 4px radius. Tap a chip and it commits and advances; arrow keys move within the
group without advancing.

### Destination card
No image container radius, no shadow. A 4:5 duotone photograph, then a 1px `--rule`, then: an
all-caps Plex Mono line `11 DAYS LEFT · 3 OF 6 PLACES` in `--clay`; the name in NPS 2026 700 at
26px; the reason in Schibsted 15px; a 1px rule; the total in Plex Mono 500 at 30px with `per person,
all in` in 12px beside it; the provenance line with its filled disc in `--sage`; and the catch in
`--clay` at 14px. Cards are separated by a single 1px rule and nothing else — no gaps, no cards, a
continuous printed list.

### It deliberately refuses
Shadows, gradients, blur, glass, filled cards, colour photography, Lucide icons, any radius above
8px, any scroll-triggered animation, and any accent that is not one of three. If a problem seems to
need a shadow, it needs a rule.

---

## Direction B — **MARINE LAYER**

> **The idea in one sentence:** A dark, photographic, cinematic app where full-bleed graded imagery
> carries the emotion and the interface is a thin layer of precise type over the top — LA as it
> actually looks: grey until eleven, then gold.

### Typeface pairing
| Role | Family | Weights | Source |
|---|---|---|---|
| Display | **Fraunces** variable, `opsz`/`SOFT`/`WONK` | 600–700 at large sizes, `WONK 1` above 32px only | Google Fonts (OFL) |
| Text | **Source Serif 4** for editorial body, **Archivo** 400/500 for UI | | Google Fonts (OFL) |
| Numerals, provenance | **Archivo** with `tabular-nums`, tracked `+0.02em` | 500 | Google Fonts (OFL) |

Deliberately *not* a mono for the numbers: this direction wants the prices to sit inside the prose,
not in a terminal. Archivo's tabular set handles the alignment. A width axis is available if a
headline needs to be condensed to fit a phone rather than shrunk.

### Palette (Marine Layer, §4 Palette 2 — dark is primary)
```css
:root {                          /* dark, the default */
  --deep:      #0E1A22;   --deep-raised: #16242E;
  --fog:       #EDEEEC;   /* 15.17:1 */
  --fog-muted: #97A3AA;   /* provenance labels */
  --sun:       #F4A65E;   /* 8.80:1 — golden hour, the primary accent */
  --sky:       #8FC0CE;   /* 8.91:1 — verified/live state */
  --coral:     #E0665E;   /* deadlines */
  --rule:      #24333D;
}
:root[data-theme="light"] {
  --fog:       #EDEEEC;   --fog-raised: #F6F7F5;   /* ground */
  --deep:      #12212B;   /* 14.12:1 — text */
  --deep-muted:#465661;
  --pacific:   #2F5A86;   /* 6.16:1; white on pacific 7.17:1 */
  --sun:       #E08A2E;   /* large text and fills only */
  --coral:     #C0453F;   /* 4.33:1 — AA Large / UI only, never 13px body */
  --rule:      #D8DBD9;
}
```

### Grid philosophy
**Full-bleed by default; the grid is an exception, not a rule.** Content sits in a 12-column grid
with a 62/38 split at desktop and text held to a `max-w-[58ch]` measure, but photographs always
break the container to the viewport edge. On mobile the entire app is edge-to-edge with 20px inset
text blocks floating over imagery. Vertical rhythm is generous — `clamp(3rem, 9vw, 8rem)` between
sections. Radii: 0 on images (they bleed), 12px on the few floating panels. Overlapping sections
(the Illoca move) — a text block sitting 40px over the top of the image above it — is the
signature layout gesture.

### Imagery
The direction *is* the imagery, so it lives or dies on the grade. One LUT for everything: shadows
pushed toward `--deep`'s blue-cyan, highlights toward `--sun`'s amber, mid-contrast, saturation held
back. Note the Portra caveat from §4 — real Portra has warm highlights and does **not** have teal
shadows, so this is an explicit stylistic choice, made once, applied uniformly, not a preset
accident. 3% film grain, a soft vignette, and every photograph in a 3:4 or 16:9 crop with a subject
placed off-centre. Photos of *places at a specific hour*, never of people smiling at laptops.

### Motion signature
**Slow, heavy, cinematic — but short in distance.** The signature is a **shared-element photograph
morph** on route change: tapping an idea card runs a View Transition that carries the photograph and
the destination name from card to detail page, 420ms on `cubic-bezier(0.32, 0.72, 0, 1)`, with
`object-fit: cover` on `::view-transition-old()` and `::view-transition-new()` so the crop does not
distort. Text below arrives 60ms later at 240ms `ease-out`, 16px of travel. Wizard steps use
Motion with `{ type: "spring", visualDuration: 0.28, bounce: 0.12 }`, 24px directional travel,
opacity at 150ms. Scroll does nothing. Progressive-enhance the View Transition —
`if (!document.startViewTransition) { update(); return; }` — and note the 4-second timeout and the
Firefox cross-document gap from §5e.

### One onboarding step — "When?"
The photograph of the last-answered destination fills the screen at 40% opacity behind
`--deep`. Question in Fraunces 700, 34px, `WONK 1`, white, sitting at the optical bottom third —
thumb-reachable. Three flexible chips first (*A weekend* / *A week* / *Next month*), then a
continuously scrolling vertical calendar of months in `--deep-raised` with 90% opacity, adjacent
months' dates shown greyed rather than blank, and once prices are known a 2px `--sun` underline
under cheap dates. Range selection fills with `--sky` at 18% and the endpoints solid. A live region
outside the grid states the range in prose: *"14 to 17 November, 3 nights."* Progress is a 2px
`--sun` line across the very top of the viewport, `scaleX`, 200ms.

### Destination card
Full-bleed 3:4 graded photograph, no radius, no border. Over the bottom third, a `--deep` gradient
scrim (linear, 180deg, 0 → 85% — the one gradient this direction permits, and it is functional).
On the scrim: `11 DAYS LEFT · 3 OF 6` in Archivo 500, 11px, `+0.08em`, `--coral`; the name in
Fraunces 700 at 30px; one line of reason in Source Serif 4 italic at 15px. Below the image, on
`--deep`: the total in Archivo 500 tabular at 28px, the provenance line in `--fog-muted` 11px with a
`--sky` disc, and the catch in `--coral` 14px. Card height varies with whether a catch exists.

### It deliberately refuses
Any interface chrome that competes with a photograph: no borders, no cards-within-cards, no filled
buttons over imagery (ghost buttons with a 1px `--fog` border only), no icon set at all beyond a
chevron and the provenance discs, and **no light mode by default** — light exists for accessibility
and daylight, but the product's identity is dark. It also refuses stock photography absolutely: if
there is no real photograph of a place, the card runs a solid `--deep-raised` panel with the
destination name set huge, and says so.

---

## Direction C — **STANDARD** *(the bold one)*

> **The idea in one sentence:** Ed Ruscha's *Standard Station* as an app — flat screen-printed
> colour, enormous condensed type, a receipt-like obsession with numerals, and exactly one gradient
> in the entire product, used once, as a reward.

This is the direction that will make someone stop scrolling. It is also the one with the least room
for error: it has no photography to hide behind and no shadows to add depth, so every measurement
has to be right.

### Typeface pairing
| Role | Family | Weights | Source |
|---|---|---|---|
| Display | **Archivo Expanded** (variable `wdth` axis, one file) | 800, `wdth` 110–125, `-0.03em`, ALL CAPS | Google Fonts (OFL) |
| Secondary display / editorial pull-quote | **Redaction 35** (grain in the outlines, 7 degradation grades) | Regular / Italic | <https://www.redaction.us/> (OFL) |
| Text | **Archivo** | 400 / 500 | Google Fonts (OFL) |
| Numerals — **the hero element** | **Space Mono** | 400 / 700 | Google Fonts (OFL) |

One superfamily doing display and text from a single variable file keeps the bundle tiny — which
matters, because this direction sets type at 72px on a phone. Redaction appears at most twice per
screen and never below 24px; its grain is in the letterforms, so it needs no overlay and survives
any scale.

### Palette (Standard, §4 Palette 3)
```css
:root {                          /* light */
  --cream:   #F2E7D3;   --cream-2: #E8DAC0;   /* second flat tone, used as a block fill */
  --ink:     #171310;   /* 15.08:1 */
  --red:     #C6362F;   /* 4.32:1 — display, fills and UI only. NEVER body text */
  --blue:    #2B4C8C;   /* 6.82:1 — the workhorse: links, verified state, body accents */
  --split-a: #F0A03C;   --split-b: #7FA9CE;   /* the one permitted gradient */
}
:root[data-theme="dark"] {
  --ink:   #141110;   /* ground */
  --cream: #F2E7D3;   /* 15.34:1 — text */
  --red:   #E4574B;   /* 5.16:1 */
  --amber: #F0A03C;   /* 8.77:1 */
  --blue:  #7FA9CE;
}
```
The 4.32:1 on red is a real constraint, stated openly: red is a *display and state* colour, never a
paragraph colour. That constraint is what stops the direction becoming a shouting match.

### Grid philosophy
**Hard-edged flat colour blocks on a strict 4-column mobile / 12-column desktop grid, with a
deliberate off-grid break once per screen.** Sections are full-width bands of flat colour that butt
directly against each other with no gap and no rule — the separation is the colour change, exactly
as in a screen print. Type is set to the grid edge-to-edge, often with a single word per line.
Radius: **0 everywhere**, with one exception — the primary commit button is a `rounded-full` pill in
`--red`, and it is the only round thing in the product, which is why it reads as a button.

### Imagery
**Photography is secondary and heavily treated.** Images are two-colour posterised — `--ink` and
one flat palette colour — at high contrast, so they read as printed rather than photographed.
Alternatively, no photograph at all: a destination is represented by a colour block and its name set
at 96px. Icons are drawn as flat geometry from the same 4-unit grid as the layout — a tent is a
triangle, a car is two rectangles and two circles. Nothing has a gradient except the one thing that
does.

### Motion signature
**Hard cuts and one split-fountain sweep.** Almost everything changes state instantly or over 120ms
— colour block swaps, type snapping into place, no easing you can perceive. The exception, and the
whole point, is **the resolve**: when the plan finishes researching and the summary line lands
(*"9 of 12 costed lines came from a live price API"*), a `180deg` linear gradient from `--split-a`
to `--split-b` sweeps once across the summary band over 900ms on
`cubic-bezier(0.77, 0, 0.175, 1)` and then settles to flat colour. Once per plan. That is a direct
lift of Ruscha's split-fountain printing technique, it is memorable, and because it happens exactly
once it never becomes a tax. Wizard steps cut with a 90ms colour-block wipe (`clip-path`, WAAPI,
`cubic-bezier(0.77, 0, 0.175, 1)`) rather than sliding. Under `prefers-reduced-motion`, the sweep
becomes a 200ms opacity fade and the wipes become instant.

### One onboarding step — "What's the budget?"
The whole screen is a flat `--red` band with `--cream` type. The question is one word — **BUDGET** —
in Archivo Expanded 800 at 72px, `wdth` 120, `-0.03em`, cropped so the descender of the Y touches the
bottom of its block. Beneath, four named bands as full-width `--cream` blocks with `--ink` type,
each 64px tall, butted with no gaps: `UNDER $150` / `$150–300` / `$300–600` / `IT DEPENDS`, each with
its keyboard letter (A/B/C/D) set in Space Mono 700 in the left 48px in `--red`. Tapping a block
inverts it to `--ink` on `--red` for 120ms, then wipes to the next question. Progress is a row of
six 8px squares along the top, filled `--cream`, empty `--cream` at 25% — countable, not a bar. Back
is the word BACK in Space Mono at 12px, `+0.1em`, top-left.

### Destination card
No photograph required. A `--cream-2` block, 0 radius, butted against its neighbours with a 2px
`--ink` divider. Top-left, in `--red` Space Mono 700 at 11px, `+0.1em`: `11 DAYS LEFT · 3/6`.
Beneath, the name in Archivo Expanded 800 at 34px, ALL CAPS, wrapping to two lines, `text-wrap:
balance`. Beneath, the reason in Archivo 400 at 15px, held to 40 characters a line so it forms a
tight text block, not a paragraph. Then — the hero — the total in **Space Mono 700 at 44px** in
`--ink`, with `PER PERSON · ALL IN` under it at 10px `+0.12em`. Then the provenance line in Space
Mono 400 at 11px in `--blue` with a filled square (not a disc — this direction has no circles),
and the catch in `--red` at 14px, set in Redaction 35 italic so it visually reads as annotation.
Every fourth card in the list flips to `--ink` ground with `--cream` type, breaking the rhythm — a
deliberate, rule-based asymmetry.

### It deliberately refuses
Photographs as decoration, any border radius other than 0 and the one pill, every shadow, every
blur, all glassmorphism, drop caps, serif body text, subtle anything. It refuses to be quiet. It
also refuses more than **five** flat colours in the entire product — a screen print has a fixed
number of screens, and that limit is the discipline that keeps it from becoming a carnival.

---

## Choosing between them

| | A · Field Notes | B · Marine Layer | C · Standard |
|---|---|---|---|
| Feels like | a park permit | a film still | a 1966 silkscreen |
| Carries the emotion | typography + paper | photography | flat colour + scale |
| Risk | can read austere | dies without good photography | can read as a shout |
| Best if | you want *credible* above all | you have strong imagery | you want to be remembered |
| Numbers | Plex Mono, stamped | Archivo, inside the prose | Space Mono, the hero |
| Hardest part | drawing the missing icons | sourcing and grading the photos | holding the 5-colour limit |
| Distance from AI default | far | medium (dark + glass is the v0 look — this must stay *flat* dark, no glow, no blur) | furthest |

If the priority is "must not look AI-generated" above all else, **C** is the strongest answer and
**A** the safest good one. **B** is the most likely to look like every other dark SaaS site if its
discipline slips, so it should only be chosen if there is a real photography plan.
