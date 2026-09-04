import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { daysBetween } from '@/lib/util/dates';
import { BUDGET_BAND_LABELS, INTEREST_LABELS } from '@/lib/domain/types';
import { PriceLedger, reconcileProvenance } from '@/lib/pricing/ledger';
import { PRICING_TOOLS, executeTool } from '@/lib/pricing/tools';
import { RunBudget } from '@/lib/pricing/quota';
import { pricingCapability } from '@/lib/pricing/index';
import { verifyLinks } from '@/lib/pricing/links';
import { ensureBaselineConstraints } from './constraints';
import { extractJson } from './json';
import type { ResearchPlan, ResearchRequest } from './types';

/**
 * The research agent.
 *
 * Two phases, deliberately separated:
 *
 *  A. Research. The model calls real pricing tools and web search until it has what it needs.
 *     It is explicitly told not to write the plan yet, because a model asked to research and
 *     compose at the same time does both worse.
 *  B. Assembly. One more call over the same history, with no tools and a structured output
 *     schema. This removes the "return ONLY JSON, no markdown fence" fragility entirely.
 *
 * A manual loop rather than the SDK's tool runner, for three reasons: we need a progress event
 * *before* each tool executes, we need a ledger of what actually ran, and we need to handle
 * `pause_turn` ourselves — the runner does not auto-resume it, and mixing server-side web search
 * with custom tools is exactly the case where it occurs.
 */

const MODEL = 'claude-opus-5';
const MAX_ITERATIONS = 6;
/** The pricing APIs do the heavy lifting now, so far fewer searches are needed than before. */
const WEB_SEARCH_TOOL = {
  type: 'web_search_20260209' as const,
  name: 'web_search' as const,
  max_uses: 6,
};

export type AgentStage =
  | 'brief'
  | 'flights'
  | 'stays'
  | 'extras'
  | 'assemble'
  | 'verify-links';

export type AgentEvent =
  | { type: 'stage'; stage: AgentStage; label: string }
  | { type: 'tool'; label: string; status: 'started' | 'ok' | 'failed' }
  | { type: 'note'; text: string };

export type OnAgentEvent = (event: AgentEvent) => void;

/**
 * The slice of the Anthropic client this module needs. Narrowing it to one method is what lets
 * the whole loop — including the ledger and reconciliation — be driven offline from recorded
 * responses, so none of this has to be developed against a paid API.
 *
 * Note that the real implementation must stream underneath: the SDK refuses a non-streaming
 * request whose `max_tokens` implies it could run past ten minutes, and the assembly call is
 * exactly that size. `messageClient()` below wraps `.stream().finalMessage()` for that reason.
 */
export interface MessageClient {
  create(params: Anthropic.Messages.MessageCreateParamsNonStreaming): Promise<Anthropic.Messages.Message>;
}

/** Adapts a real Anthropic client into the narrow interface above, streaming underneath. */
export function messageClient(client: Anthropic): MessageClient {
  return {
    create: (params) => client.messages.stream(params).finalMessage(),
  };
}

export class AgentError extends Error {
  constructor(
    message: string,
    readonly stage: 'auth' | 'api' | 'parse',
  ) {
    super(message);
    this.name = 'AgentError';
  }
}

/* ------------------------------------------------------------------ output schema */

const provenanceSchema = z.object({
  source: z.enum(['api', 'web', 'estimate']),
  sourceLabel: z.string(),
  sourceRef: z
    .string()
    .optional()
    .describe('The resultId of the tool call this price came from. Required when source is api.'),
});

/**
 * One flat array of lines with a category, rather than three parallel arrays per option.
 *
 * The nested version was rejected outright: "the compiled grammar is too large". Flattening cuts
 * the biggest repeated structure to a third of its size, and the server sorts the lines back into
 * transport / accommodation / other on the way out, so nothing downstream changes.
 */
const lineItemSchema = z.object({
  category: z.enum(['transport', 'accommodation', 'other']),
  label: z.string(),
  provider: z.string(),
  detail: z.string(),
  url: z.string().optional(),
  perPersonMin: z.number(),
  perPersonMax: z.number(),
  basis: z.string(),
  provenance: provenanceSchema,
});

const planSchema = z.object({
  summary: z.string(),
  confidenceNote: z.string(),
  options: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        bestFor: z.string(),
        perPersonMin: z.number(),
        perPersonMax: z.number(),
        lines: z.array(lineItemSchema),
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

/* ------------------------------------------------------------------ prompts */

const RESEARCH_SYSTEM = `You research trips for exchange students at USC in Los Angeles, and you are precise about money.

The single thing that makes you useful is that you do not guess prices. You have tools that return
real quotes from real providers for real dates. Use them:

- search_flights and search_hotels return live Google Flights and Google Hotels data. A figure
  from these is tied to the exact dates and occupancy asked for. Nothing you recall is.
- search_campgrounds returns real campgrounds with fees and availability.
- web_search is for everything an API cannot answer: coach and shuttle operators, park entry
  fees, rental car rates and the under-25 surcharge, 21+ door policies, transit fares.

Call the pricing tools before you reason about cost. If a tool returns "unavailable", do not
retry it — fall back to web_search for that figure and remember that it is now a web-sourced
number, not an API-sourced one.

The pricing lookups are metered and the budget is small. Be economical: one flight search for the
best airport rather than one for each, and one or two hotel searches for the areas you would
actually recommend, not a survey of every neighbourhood. Two or three lookups is a good run.

Web search is NOT metered, and you are currently under-using it. Everything the pricing APIs do
not cover still has to be checked, not recalled: local transit fares, airport transfers, park and
venue entry, rental rates and the under-25 surcharge, and the age policy of anywhere you send
them. A figure you looked up can be labelled "web" and kept; a figure you merely remember becomes
an unverified estimate and is worth much less to the reader. Search for the ones that matter.

These travellers are 19 and 20 year olds on foreign licences with no US credit history. The
things that turn a $300 weekend into a $700 one are the under-25 young-driver surcharge, deposit
and incidental holds, resort fees, park entry, and 21+ door policies. Find them.

This phase is research only. Do not write the final plan yet.`;

const ASSEMBLE_SYSTEM = `Now write the costed plan from what you found.

Rules that are checked by the server after you answer, so breaking them only wastes the run:

- provenance.source is "api" ONLY for a figure that came back from search_flights,
  search_hotels or search_campgrounds. Set provenance.sourceRef to that tool result's resultId.
  A line claiming "api" without a matching resultId, or with a number that does not match what
  the tool returned, is downgraded to an unverified estimate.
- provenance.source is "web" for a figure found by web_search. Its url must be a page that
  actually appeared in your search results.
- provenance.source is "estimate" for anything you reasoned out. That is allowed and honest;
  claiming otherwise is not.
- Never write a booking URL from memory. For an "api" line, use the link the tool returned.
- Every cost is per person and a range, never a point estimate.
- Every line states in "basis" the assumption it rests on: occupancy, split, nights, fuel price.
- The itinerary names real places with realistic timings. Never "explore the local area".
- If this trip is a bad idea for this group at these dates, say so in the summary.

Write in British English, plainly, as a well-informed friend would. No marketing language.

Return ONLY a JSON object, no prose around it and no markdown fence, in this shape:

{
  "summary": string,
  "confidenceNote": string,
  "options": [{
    "id": string, "name": string, "bestFor": string,
    "perPersonMin": number, "perPersonMax": number,
    "lines": [{
      "category": "transport" | "accommodation" | "other",
      "label": string, "provider": string, "detail": string, "url": string,
      "perPersonMin": number, "perPersonMax": number, "basis": string,
      "provenance": {
        "source": "api" | "web" | "estimate",
        "sourceLabel": string,
        "sourceRef": string
      }
    }]
  }],
  "assumptions": [{ "label": string, "detail": string }],
  "exclusions": [string],
  "constraints": [{
    "trigger": "under-21"|"no-car"|"no-us-credit-card"|"budget"|"group-size"|"season"|"foreign-licence",
    "severity": "blocker"|"warning"|"info",
    "title": string, "body": string, "workaround": string
  }],
  "itinerary": [{ "dayNumber": number, "label": string,
    "blocks": [{ "time": string, "title": string, "detail": string, "place": string }] }],
  "sources": [{ "title": string, "url": string }]
}

All money is US dollars as plain numbers, no symbols.`;

function buildResearchPrompt(request: ResearchRequest): string {
  const tripDays = Math.max(1, daysBetween(request.startDate, request.endDate) + 1);
  const nights = Math.max(0, tripDays - 1);
  const interests = request.moods.length
    ? request.moods.map((m) => INTEREST_LABELS[m]).join(', ')
    : 'nothing in particular';
  const capability = pricingCapability();

  return `Research a trip to ${request.region} for a group of USC exchange students.

THE GROUP
- ${request.groupSize} people, splitting shared costs
- Dates: ${request.startDate} to ${request.endDate} (${tripDays} days, ${nights} nights)
- Car: ${request.hasCar ? 'yes, one of the group has one' : 'NO — nobody owns a car'}
- Age: ${request.isOver21 ? 'all 21 or over' : 'UNDER 21'}
- US credit card: ${request.hasUsCreditCard ? 'at least one of them has one' : 'NO — foreign debit cards only'}
- Budget: ${BUDGET_BAND_LABELS[request.budgetBand]}
- Interested in: ${interests}
- Starting from University Park Campus, Los Angeles (nearest airport LAX)

PRICING AVAILABLE ON THIS RUN
${capability.note}

WHAT TO FIND
Two or three genuinely different options at different price points, each one this group can
actually book. If they cannot drive, do not offer a driving option unless it includes hiring a
vehicle and somebody is old enough to hire it.

Price the transport and the accommodation with the tools. ${nights === 0 ? 'This is a day trip, so do not search for hotels.' : `Search hotels for the area you would actually stay in, for ${nights} night(s), with the occupancy this group needs.`}

Then research the rest with web_search: local transport and fares, park or venue entry, and the
age and card rules that apply to this group.`;
}

/* ------------------------------------------------------------------ the loop */

export interface AgentResult {
  plan: ResearchPlan;
  ledgerSize: number;
  toolCalls: number;
  downgrades: string[];
}

export async function runResearchAgent(
  client: MessageClient,
  request: ResearchRequest,
  onEvent: OnAgentEvent = () => {},
): Promise<AgentResult> {
  const tripDays = Math.max(1, daysBetween(request.startDate, request.endDate) + 1);
  const nights = Math.max(0, tripDays - 1);
  const ledger = new PriceLedger();
  const budget = new RunBudget();
  const capability = pricingCapability();
  const apiAvailable = capability.flights || capability.hotels || capability.campgrounds;

  const messages: Anthropic.Messages.MessageParam[] = [
    { role: 'user', content: buildResearchPrompt(request) },
  ];

  onEvent({ type: 'stage', stage: 'brief', label: 'Reading the brief' });

  let toolCalls = 0;
  let stagedFlights = false;
  let stagedStays = false;
  /** What the model wrote in prose while researching — the qualitative half of its findings. */
  const researchNotes: string[] = [];
  /**
   * `web_search_20260209` does its dynamic filtering with code execution, which allocates a
   * container. Once that has happened the transcript contains tool uses belonging to it, and
   * every later request in the same conversation must name it — otherwise the API rejects the
   * call with "container_id is required when there are pending tool uses".
   */
  let containerId: string | undefined;

  /* -------------------------------------------------- phase A: research */

  for (let i = 0; i < MAX_ITERATIONS; i += 1) {
    let message: Anthropic.Messages.Message;
    try {
      message = await client.create({
        model: MODEL,
        // The research phase only decides what to look up and jots findings; it does not write
        // prose. Low effort and a small ceiling here is most of the difference between a
        // five-minute run and a one-minute one.
        max_tokens: 8000,
        thinking: { type: 'adaptive' },
        output_config: { effort: 'low' },
        // The tool list and system prompt are byte-identical every iteration, so caching the
        // prefix means only the growing tail is billed as fresh input after the first pass.
        system: [
          { type: 'text', text: RESEARCH_SYSTEM, cache_control: { type: 'ephemeral' } },
        ],
        tools: [...PRICING_TOOLS, WEB_SEARCH_TOOL],
        messages,
        ...(containerId ? { container: containerId } : {}),
      });
    } catch (err) {
      throw new AgentError(
        err instanceof Error ? err.message : 'The research call failed.',
        'api',
      );
    }

    if (message.stop_reason === 'refusal') {
      throw new AgentError('The model declined to research this trip.', 'api');
    }

    if (message.container?.id) containerId = message.container.id;

    const noteText = message.content
      .filter((b): b is Anthropic.Messages.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('\n')
      .trim();
    if (noteText) researchNotes.push(noteText);

    messages.push({ role: 'assistant', content: message.content });

    // A paused turn is the server saying "I am not finished"; it must be continued, not treated
    // as an answer. This is the case the SDK's tool runner does not handle for you.
    if (message.stop_reason === 'pause_turn') continue;
    if (message.stop_reason !== 'tool_use') break;

    const uses = message.content.filter(
      (b): b is Anthropic.Messages.ToolUseBlock => b.type === 'tool_use',
    );
    if (uses.length === 0) break;

    for (const use of uses) {
      if (use.name === 'search_flights' && !stagedFlights) {
        stagedFlights = true;
        onEvent({ type: 'stage', stage: 'flights', label: 'Pricing the way there' });
      }
      if (use.name === 'search_hotels' && !stagedStays) {
        stagedStays = true;
        onEvent({ type: 'stage', stage: 'stays', label: 'Finding somewhere to stay' });
      }
      onEvent({ type: 'tool', label: describeCall(use), status: 'started' });
    }

    // All results go back in ONE user message — splitting them trains the model out of making
    // parallel calls at all.
    const results = await Promise.all(
      uses.map(async (use) => {
        toolCalls += 1;
        const execution = await executeTool(use.name, use.input, ledger, budget);
        onEvent({
          type: 'tool',
          label: execution.label,
          status: execution.ok ? 'ok' : 'failed',
        });
        return {
          type: 'tool_result' as const,
          tool_use_id: use.id,
          content: JSON.stringify(execution.result),
          is_error: execution.isError,
        };
      }),
    );

    messages.push({ role: 'user', content: results });
  }

  /* -------------------------------------------------- phase B: assembly */

  onEvent({ type: 'stage', stage: 'assemble', label: 'Adding up the range' });

  /*
   * Assembly starts a fresh conversation rather than replaying the research transcript.
   *
   * Two reasons. The practical one: web_search_20260209 runs code execution internally, so its
   * results are bound to a container, and replaying that history into another call fails with
   * "container_id is required when there are pending tool uses". The better one: the transcript
   * is mostly raw API payloads the model has already read, and re-sending it costs a great deal
   * of input for no gain. The ledger already holds the part that matters — every quote, with the
   * resultId the model has to cite — so we hand it that, compactly.
   */
  const digest = buildDigest(ledger, researchNotes.join('\n\n'), request);

  let assembled: z.infer<typeof planSchema>;
  try {
    const message = await client.create({
      model: MODEL,
      max_tokens: 32000,
      thinking: { type: 'adaptive' },
      // Deliberately not using structured outputs. A schema this shape compiles to a grammar the
      // API rejects as too large, and slimming it far enough would mean giving up fields the plan
      // actually needs. Prompted JSON plus defensive extraction and zod validation gets the same
      // guarantee without the ceiling.
      output_config: { effort: 'medium' },
      system: [{ type: 'text', text: ASSEMBLE_SYSTEM }],
      messages: [{ role: 'user', content: digest }],
    });

    if (message.stop_reason === 'refusal') {
      throw new AgentError('The model declined to write the plan.', 'api');
    }

    const text = message.content
      .filter((b): b is Anthropic.Messages.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('');
    assembled = planSchema.parse(extractJson(text));
  } catch (err) {
    if (err instanceof AgentError) throw err;
    throw new AgentError(
      `The plan did not come back in a usable shape: ${err instanceof Error ? err.message : 'unknown'}`,
      'parse',
    );
  }

  /* -------------------------------------------------- assemble, reconcile, verify */

  const researchedAt = new Date().toISOString();

  const draft: ResearchPlan = {
    ideaSlug: request.ideaSlug,
    destination: request.region,
    researchedAt,
    provenance: 'live',
    confidence: 'medium',
    confidenceNote: assembled.confidenceNote,
    summary: assembled.summary,
    options: assembled.options.map(({ lines, ...option }) => ({
      ...option,
      // The flat array is sorted back into the three groups the UI renders.
      transport: lines.filter((l) => l.category === 'transport').map((l) => withCheckedAt(l, researchedAt)),
      accommodation: lines
        .filter((l) => l.category === 'accommodation')
        .map((l) => withCheckedAt(l, researchedAt)),
      otherCosts: lines.filter((l) => l.category === 'other').map((l) => withCheckedAt(l, researchedAt)),
    })),
    totalRangeMin: Math.min(...assembled.options.map((o) => o.perPersonMin)),
    totalRangeMax: Math.max(...assembled.options.map((o) => o.perPersonMax)),
    assumptions: assembled.assumptions,
    exclusions: assembled.exclusions,
    constraints: assembled.constraints,
    itinerary: assembled.itinerary.map((day, i) => ({
      dayNumber: day.dayNumber || i + 1,
      date: addDaysIso(request.startDate, (day.dayNumber || i + 1) - 1),
      label: day.label,
      blocks: day.blocks,
    })),
    sources: assembled.sources,
    request,
  };

  // Every claim of a live price is checked against what actually ran before anyone sees it.
  const reconciled = reconcileProvenance(draft, ledger, apiAvailable);
  if (reconciled.downgrades.length > 0) {
    onEvent({
      type: 'note',
      text: `${reconciled.downgrades.length} figure(s) could not be verified and are shown as estimates.`,
    });
  }

  onEvent({ type: 'stage', stage: 'verify-links', label: 'Checking every link resolves' });
  const withLinks = await attachLinkChecks(reconciled.plan);

  return {
    plan: {
      ...withLinks,
      constraints: ensureBaselineConstraints(withLinks, request, nights),
    },
    ledgerSize: ledger.size,
    toolCalls,
    downgrades: reconciled.downgrades,
  };
}

/* ------------------------------------------------------------------ helpers */

/**
 * Everything the assembly call needs and nothing it does not: the brief, the real quotes with the
 * ids that have to be cited, and the model's own prose findings.
 */
function buildDigest(ledger: PriceLedger, notes: string, request: ResearchRequest): string {
  const entries = ledger.all();

  const priced = entries.length
    ? entries
        .map((entry) => {
          const quotes = entry.quotes
            .slice(0, 10)
            .map((q) => `    - ${q.label}: $${q.priceUsd}${q.url ? ` — ${q.url}` : ''}`)
            .join('\n');
          return [
            `resultId: ${entry.resultId}  (${entry.tool}, checked ${entry.checkedAt})`,
            `  looked up: ${JSON.stringify(entry.args)}`,
            `  quotes returned:`,
            quotes,
          ].join('\n');
        })
        .join('\n\n')
    : '(no pricing lookup succeeded on this run)';

  return [
    'Write the costed plan for this trip.',
    '',
    'THE BRIEF',
    buildResearchPrompt(request),
    '',
    'VERIFIED PRICE LOOKUPS',
    'These are the only figures you may label "api". Cite the resultId in provenance.sourceRef,',
    'and use the URL shown against that quote rather than composing one.',
    '',
    priced,
    '',
    'WHAT YOU FOUND WHILE RESEARCHING',
    notes || '(no notes)',
  ].join('\n');
}

function withCheckedAt(
  line: z.infer<typeof lineItemSchema>,
  checkedAt: string,
): ResearchPlan['options'][number]['transport'][number] {
  const { category: _category, ...rest } = line;
  return { ...rest, provenance: { ...rest.provenance, checkedAt } };
}

async function attachLinkChecks(plan: ResearchPlan): Promise<ResearchPlan> {
  const urls = [
    ...plan.options.flatMap((o) =>
      [...o.transport, ...o.accommodation, ...o.otherCosts]
        .map((l) => l.url)
        .filter((u): u is string => Boolean(u)),
    ),
    ...plan.sources.map((s) => s.url),
  ];
  if (urls.length === 0) return plan;

  const checks = await verifyLinks(urls);
  const attach = (line: ResearchPlan['options'][number]['transport'][number]) => {
    if (!line.url) return line;
    const check = checks.get(line.url);
    return check
      ? { ...line, link: { status: check.status, checkedAt: check.checkedAt, httpStatus: check.httpStatus } }
      : line;
  };

  return {
    ...plan,
    options: plan.options.map((o) => ({
      ...o,
      transport: o.transport.map(attach),
      accommodation: o.accommodation.map(attach),
      otherCosts: o.otherCosts.map(attach),
    })),
  };
}

function describeCall(use: Anthropic.Messages.ToolUseBlock): string {
  const input = use.input as Record<string, unknown>;
  switch (use.name) {
    case 'search_flights':
      return `Google Flights · ${input.origin_airport} → ${input.destination_airport} · ${input.outbound_date}`;
    case 'search_hotels':
      return `Google Hotels · ${input.query} · ${input.check_in_date}`;
    case 'search_campgrounds':
      return `Recreation.gov · ${input.query}`;
    case 'web_search':
      return `Web search · ${String(input.query ?? '').slice(0, 60)}`;
    default:
      return use.name;
  }
}

function addDaysIso(iso: string, days: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(y, (m ?? 1) - 1, (d ?? 1) + days, 12);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate(),
  ).padStart(2, '0')}`;
}
