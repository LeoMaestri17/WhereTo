/**
 * Build-time destination copy, written once and committed.
 *
 *   npm run generate-content              a dry run: prints the prompts, spends nothing
 *   npm run generate-content -- --live    calls Haiku once per destination and writes the file
 *   npm run generate-content -- --live --force   regenerates destinations that already have copy
 *
 * The running app never calls this. Every figure the product leans on is in the costed data; this
 * fills the three soft fields — a vibe line, a few highlights, some "best for" tags — that help
 * someone choose between four places they have never been.
 *
 * Haiku, and never anything larger. The brief's budget is a few dollars total and this is a
 * four-sentence classification job; a larger model would be slower and no better at it.
 *
 * **It will not touch the itineraries.** Those were researched against the operators' own pages,
 * with a sourced cost and a stated catch on every item, and a model rewriting them would quietly
 * replace research with recollection. The prompt gets them as context and is told to describe,
 * not to invent.
 */
import fs from 'node:fs';
import path from 'node:path';
import type { Destination, GeneratedContent } from '../lib/trip/types';

const MODEL = 'claude-haiku-5-5';
const MAX_TOKENS = 500;

function loadEnvLocal(): void {
  const file = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(file)) return;
  for (const raw of fs.readFileSync(file, 'utf8').split('\n')) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    if (!(key in process.env)) process.env[key] = line.slice(eq + 1).trim();
  }
}

loadEnvLocal();

const FILE = path.join(process.cwd(), 'data', 'destinations.json');

const SYSTEM = `You write for WhereTo, a trip planner used by exchange students in Los Angeles who are 19 to 25, usually on a foreign licence, usually without a US credit card.

Voice: a well-informed friend who has actually done the trip. Specific, unhurried, never chirpy.
- Lead with the reason to go, not a description of the place.
- British spelling in prose. American spelling in place names.
- No exclamation marks, no emoji, no "amazing", no "vibrant", no "hidden gem", no second-person cheerleading.
- Concrete or absent. "About $140" is fine; "affordable" is not.
- If something has a catch, say it.

Reply with JSON only, no prose around it, in exactly this shape:
{"vibe": "one sentence, under 20 words", "highlights": ["three or four phrases, each under 8 words"], "bestFor": ["two to four tags, lower case, two or three words each"]}

bestFor tags describe who the trip suits: things like "no car", "under 21", "first trip out", "cheapest weekend", "long drive".`;

function promptFor(dest: Destination): string {
  return [
    `Destination: ${dest.name}, ${dest.region}.`,
    `Distance from Los Angeles: ${dest.drive.miles} miles, ${dest.drive.time}.`,
    `How you get there: ${dest.transit ? dest.transit.label : 'drive only, there is no scheduled service worth taking'}.`,
    `What we already say about it: "${dest.hook}"`,
    `The season: ${dest.whySeason}`,
    `What people actually do there: ${dest.itinerary.map((i) => i.title).join('; ')}.`,
    dest.fees.some((f) => f.amount >= 100)
      ? `Note: a non-resident surcharge of $${dest.fees.find((f) => f.amount >= 100)?.amount} per person applies here, which makes it the expensive one.`
      : '',
    '',
    'Write the vibe line, the highlights and the bestFor tags. Do not repeat the hook verbatim.',
  ]
    .filter(Boolean)
    .join('\n');
}

interface AnthropicResponse {
  content: { type: string; text?: string }[];
  usage?: { input_tokens: number; output_tokens: number };
}

function parseContent(text: string): Omit<GeneratedContent, 'generatedAt' | 'model'> {
  // Haiku sometimes wraps JSON in a fenced block however firmly it is told not to.
  const cleaned = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  const parsed = JSON.parse(cleaned) as {
    vibe?: string;
    highlights?: string[];
    bestFor?: string[];
  };
  if (!parsed.vibe || !Array.isArray(parsed.highlights) || !Array.isArray(parsed.bestFor)) {
    throw new Error(`reply did not have the three fields: ${cleaned.slice(0, 200)}`);
  }
  return {
    vibe: parsed.vibe.trim(),
    highlights: parsed.highlights.map((h) => String(h).trim()).slice(0, 4),
    bestFor: parsed.bestFor.map((b) => String(b).trim().toLowerCase()).slice(0, 4),
  };
}

async function main(): Promise<void> {
  const live = process.argv.includes('--live');
  const force = process.argv.includes('--force');

  const destinations = JSON.parse(fs.readFileSync(FILE, 'utf8')) as Destination[];
  const todo = destinations.filter((d) => force || d.content === null);

  const guard = await import('../lib/budget/guard');
  const before = guard.usageReport();

  console.log('');
  console.log(`WhereTo — generate-content${live ? '' : ' (dry run)'}`);
  console.log('─'.repeat(78));
  console.log(`${todo.length} of ${destinations.length} destinations need copy · model ${MODEL} · max_tokens ${MAX_TOKENS}`);
  console.log(
    `budget: ${before.anthropic.spent} of ${before.anthropic.ceiling} calls used in ${before.month}, ` +
      `${before.anthropic.remaining} left`,
  );
  console.log('─'.repeat(78));

  if (todo.length === 0) {
    console.log('Nothing to do. Pass --force to regenerate copy that already exists.\n');
    return;
  }

  if (!live) {
    for (const dest of todo) {
      console.log(`\n### ${dest.slug}\n`);
      console.log(promptFor(dest));
    }
    console.log('\n' + '─'.repeat(78));
    console.log(`Dry run. ${todo.length} calls were NOT made and nothing was spent.`);
    console.log(`To generate for real:  npm run generate-content -- --live\n`);
    return;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('Refusing to start: no ANTHROPIC_API_KEY is set.');
    process.exit(1);
  }

  const Anthropic = (await import('@anthropic-ai/sdk')).default;
  const client = new Anthropic({ apiKey });

  let ok = 0;
  for (const dest of todo) {
    // Throws if the month is spent, before the request is built. See lib/budget/guard.ts.
    guard.claim('anthropic');
    try {
      const response = (await client.messages.create({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        system: SYSTEM,
        messages: [{ role: 'user', content: promptFor(dest) }],
      })) as unknown as AnthropicResponse;

      const text = response.content.find((b) => b.type === 'text')?.text ?? '';
      const parsed = parseContent(text);

      dest.content = { ...parsed, generatedAt: new Date().toISOString(), model: MODEL };
      ok += 1;

      console.log(`  ok   ${dest.slug.padEnd(15)} "${parsed.vibe}"`);
      console.log(`       ${parsed.bestFor.join(' · ')}`);
      if (response.usage) {
        console.log(`       ${response.usage.input_tokens} in, ${response.usage.output_tokens} out`);
      }
    } catch (err) {
      /* The call was made and billed even if the reply was unusable, so the unit is not
         released — only a request that never happened gets refunded. */
      console.log(`  FAIL ${dest.slug.padEnd(15)} ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  fs.writeFileSync(FILE, `${JSON.stringify(destinations, null, 2)}\n`);

  const after = guard.usageReport();
  console.log('─'.repeat(78));
  console.log(`${ok} of ${todo.length} generated. data/destinations.json written.`);
  console.log(`budget: ${after.anthropic.spent} of ${after.anthropic.ceiling} calls used, ${after.anthropic.remaining} left.\n`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
