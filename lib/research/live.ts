import 'server-only';
import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { daysBetween } from '@/lib/util/dates';
import { BUDGET_BAND_LABELS, INTEREST_LABELS } from '@/lib/domain/types';
import { ensureBaselineConstraints } from './constraints';
import { extractJson as extractJsonShared, JsonExtractionError } from './json';
import type { ResearchPlan, ResearchRequest, TripResearchService } from './types';

/**
 * The live research path. One substantial call to the Anthropic API with web search enabled,
 * server-side only — the key never reaches the browser.
 *
 * Model and tool versions were checked against the current Anthropic documentation rather than
 * recalled: `claude-opus-5` with the `web_search_20260209` server tool, adaptive thinking, and
 * streaming because a call this size will otherwise sit past the HTTP timeout.
 */
const MODEL = 'claude-opus-5';
const WEB_SEARCH_TOOL = {
  type: 'web_search_20260209' as const,
  name: 'web_search' as const,
  max_uses: 14,
};

/* ------------------------------------------------------------------ schema */

const lineItemSchema = z.object({
  label: z.string(),
  provider: z.string(),
  detail: z.string(),
  url: z.string().optional(),
  perPersonMin: z.number(),
  perPersonMax: z.number(),
  basis: z.string(),
});

const planSchema = z.object({
  summary: z.string(),
  confidence: z.enum(['high', 'medium', 'low']),
  confidenceNote: z.string(),
  options: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        bestFor: z.string(),
        perPersonMin: z.number(),
        perPersonMax: z.number(),
        transport: z.array(lineItemSchema),
        accommodation: z.array(lineItemSchema),
        otherCosts: z.array(lineItemSchema),
      }),
    )
    .min(1),
  assumptions: z.array(z.object({ label: z.string(), detail: z.string() })),
  exclusions: z.array(z.string()),
  constraints: z.array(
    z.object({
      trigger: z.enum([
        'under-21',
        'no-car',
        'no-us-credit-card',
        'budget',
        'group-size',
        'season',
        'foreign-licence',
      ]),
      severity: z.enum(['blocker', 'warning', 'info']),
      title: z.string(),
      body: z.string(),
      workaround: z.string().optional(),
    }),
  ),
  itinerary: z.array(
    z.object({
      dayNumber: z.number(),
      label: z.string(),
      blocks: z.array(
        z.object({
          time: z.string(),
          title: z.string(),
          detail: z.string(),
          place: z.string().optional(),
        }),
      ),
    }),
  ),
  sources: z.array(z.object({ title: z.string(), url: z.string() })),
});

export class LiveResearchError extends Error {
  constructor(
    message: string,
    readonly stage: 'auth' | 'api' | 'parse',
  ) {
    super(message);
    this.name = 'LiveResearchError';
  }
}

/* ------------------------------------------------------------------ prompt */

function buildPrompt(request: ResearchRequest): string {
  const tripDays = Math.max(1, daysBetween(request.startDate, request.endDate) + 1);
  const nights = Math.max(0, tripDays - 1);
  const interests = request.moods.length
    ? request.moods.map((m) => INTEREST_LABELS[m]).join(', ')
    : 'nothing in particular';

  return `Research a real, costed trip to ${request.region} for a group of exchange students at USC in Los Angeles.

THE GROUP
- ${request.groupSize} people travelling together, splitting shared costs
- Dates: ${request.startDate} to ${request.endDate} (${tripDays} days, ${nights} nights)
- Access to a car: ${request.hasCar ? 'yes, one of the group has a car' : 'NO — nobody in the group owns a car'}
- Age: ${request.isOver21 ? 'all 21 or over' : 'UNDER 21'}
- US credit card: ${request.hasUsCreditCard ? 'yes, at least one of the group has one' : 'NO — foreign debit cards only'}
- Budget: ${BUDGET_BAND_LABELS[request.budgetBand]}
- Interested in: ${interests}
- Starting from University Park Campus, Los Angeles

WHAT MAKES THIS DIFFERENT FROM A GENERIC TRIP PLAN
These are 19 and 20 year olds on foreign licences with no US credit history. A general estimate
misses the things that turn a $300 weekend into a $700 one. Search for and price the real
numbers, including:
- the under-25 young driver surcharge on any car hire, which is per day and never in the headline rate
- deposit and incidental holds, and whether a foreign debit card is accepted at all
- 21+ door policies on anything involving bars, clubs or casino floors
- what the trip actually costs when ${request.groupSize} people split accommodation and fuel
- resort fees, park entry, parking and any other charge added after booking

REQUIREMENTS
- Two or three genuinely different options at different price points. Every option must be one
  this specific group can actually book. If they cannot drive, do not offer a driving option
  unless it includes hiring a vehicle and somebody is old enough to hire it.
- Name real operators: specific airlines with rough times and fares, named coach and rail
  operators, named hotels or hostels or campgrounds. No "budget airline" or "a local hotel".
- Every line item needs a real booking or information URL that exists today.
- Every cost is a per-person RANGE, never a point estimate, and every line states the assumption
  it rests on in the "basis" field (occupancy, split, nights, fuel price).
- The itinerary must name actual places with realistic timings and travel times. Never write
  "explore the local area" or anything like it.
- The constraints array must react to the inputs above. If they are under 21, say exactly what
  will refuse them. If they have no US credit card, say exactly where that bites.
- Be honest about what does not work. If this destination is a bad idea for this group at these
  dates, the summary should say so.

OUTPUT
Return ONLY a single JSON object, no prose before or after it, no markdown fence, matching:

{
  "summary": string,
  "confidence": "high" | "medium" | "low",
  "confidenceNote": string,
  "options": [{
    "id": string, "name": string, "bestFor": string,
    "perPersonMin": number, "perPersonMax": number,
    "transport": [{"label","provider","detail","url","perPersonMin","perPersonMax","basis"}],
    "accommodation": [ same shape ],
    "otherCosts": [ same shape ]
  }],
  "assumptions": [{"label": string, "detail": string}],
  "exclusions": [string],
  "constraints": [{
    "trigger": "under-21"|"no-car"|"no-us-credit-card"|"budget"|"group-size"|"season"|"foreign-licence",
    "severity": "blocker"|"warning"|"info",
    "title": string, "body": string, "workaround": string
  }],
  "itinerary": [{"dayNumber": number, "label": string,
    "blocks": [{"time","title","detail","place"}]}],
  "sources": [{"title": string, "url": string}]
}

All money is US dollars as plain numbers, no symbols. Write in British English, plainly, the way
a well-informed friend would. No marketing language.`;
}

/* ------------------------------------------------------------------ parsing */

/**
 * Models sometimes wrap JSON in a fence or add a sentence either side, so we find the outermost
 * balanced object rather than trusting the whole response to parse.
 */
export function extractJson(text: string): unknown {
  try {
    return extractJsonShared(text);
  } catch (err) {
    if (err instanceof JsonExtractionError) throw new LiveResearchError(err.message, 'parse');
    throw err;
  }
}

function collectText(content: Anthropic.Messages.ContentBlock[]): string {
  return content
    .filter((b): b is Anthropic.Messages.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('\n');
}

/* ------------------------------------------------------------------ the service */

export class LiveResearchService implements TripResearchService {
  readonly kind = 'live' as const;
  private readonly client: Anthropic;

  constructor(apiKey: string) {
    if (!apiKey) throw new LiveResearchError('No ANTHROPIC_API_KEY is set.', 'auth');
    this.client = new Anthropic({ apiKey });
  }

  async research(request: ResearchRequest): Promise<ResearchPlan> {
    const tripDays = Math.max(1, daysBetween(request.startDate, request.endDate) + 1);
    const nights = Math.max(0, tripDays - 1);

    let message: Anthropic.Messages.Message;
    try {
      const stream = this.client.messages.stream({
        model: MODEL,
        max_tokens: 32000,
        thinking: { type: 'adaptive' },
        output_config: { effort: 'high' },
        tools: [WEB_SEARCH_TOOL],
        system:
          'You research trips for exchange students on a budget and you are precise about money. ' +
          'You search the web for real current prices rather than recalling them, you name real ' +
          'operators and real venues, and you state the assumption behind every number. You are ' +
          'never optimistic about cost. You return strictly valid JSON and nothing else.',
        messages: [{ role: 'user', content: buildPrompt(request) }],
      });
      message = await stream.finalMessage();
    } catch (err) {
      throw new LiveResearchError(
        err instanceof Error ? err.message : 'The research call failed.',
        'api',
      );
    }

    if (message.stop_reason === 'refusal') {
      throw new LiveResearchError('The model declined to answer this request.', 'api');
    }

    const parsed = planSchema.safeParse(extractJson(collectText(message.content)));
    if (!parsed.success) {
      throw new LiveResearchError(
        `The plan did not match the expected shape: ${parsed.error.issues
          .slice(0, 3)
          .map((i) => `${i.path.join('.')} ${i.message}`)
          .join('; ')}`,
        'parse',
      );
    }

    const data = parsed.data;
    const itinerary = data.itinerary.map((day, i) => ({
      dayNumber: day.dayNumber || i + 1,
      date: addDaysIso(request.startDate, (day.dayNumber || i + 1) - 1),
      label: day.label,
      blocks: day.blocks,
    }));

    const researchedAt = new Date().toISOString();

    // This path prices everything by web search, so every line says so. Nothing here may claim
    // `api` — that label is reserved for figures a real pricing call returned, and is stamped by
    // the tool loop in agent.ts, which verifies each claim against its ledger entry.
    const webProvenance = {
      source: 'web' as const,
      sourceLabel: 'Web search',
      checkedAt: researchedAt,
    };
    const stamp = (items: (typeof data.options)[number]['transport']) =>
      items.map((item) => ({ ...item, provenance: webProvenance }));
    const options = data.options.map((option) => ({
      ...option,
      transport: stamp(option.transport),
      accommodation: stamp(option.accommodation),
      otherCosts: stamp(option.otherCosts),
    }));

    const plan: ResearchPlan = {
      ideaSlug: request.ideaSlug,
      destination: request.region,
      researchedAt,
      provenance: 'live',
      confidence: data.confidence,
      confidenceNote: data.confidenceNote,
      summary: data.summary,
      options,
      totalRangeMin: Math.min(...data.options.map((o) => o.perPersonMin)),
      totalRangeMax: Math.max(...data.options.map((o) => o.perPersonMax)),
      assumptions: data.assumptions,
      exclusions: data.exclusions,
      constraints: data.constraints,
      itinerary,
      sources: data.sources,
      request,
    };

    // The model usually gets the young-driver fee and the deposit hold right. When it does not,
    // silence would be the worst failure this product could have, so we add them back.
    return { ...plan, constraints: ensureBaselineConstraints(plan, request, nights) };
  }
}

function addDaysIso(iso: string, days: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(y, (m ?? 1) - 1, (d ?? 1) + days, 12);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate(),
  ).padStart(2, '0')}`;
}
