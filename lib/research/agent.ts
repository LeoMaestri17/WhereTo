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
const MAX_ITERATIONS = 10;
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
 */
export interface MessageClient {
  create(params: Anthropic.Messages.MessageCreateParamsNonStreaming): Promise<Anthropic.Messages.Message>;
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

const lineItemSchema = z.object({
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

Write in British English, plainly, as a well-informed friend would. No marketing language.`;

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

  /* -------------------------------------------------- phase A: research */

  for (let i = 0; i < MAX_ITERATIONS; i += 1) {
    let message: Anthropic.Messages.Message;
    try {
      message = await client.create({
        model: MODEL,
        max_tokens: 16000,
        thinking: { type: 'adaptive' },
        output_config: { effort: 'medium' },
        // The tool list and system prompt are byte-identical every iteration, so caching the
        // prefix means only the growing tail is billed as fresh input after the first pass.
        system: [
          { type: 'text', text: RESEARCH_SYSTEM, cache_control: { type: 'ephemeral' } },
        ],
        tools: [...PRICING_TOOLS, WEB_SEARCH_TOOL],
        messages,
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

  messages.push({ role: 'user', content: ASSEMBLE_SYSTEM });

  let assembled: z.infer<typeof planSchema>;
  try {
    const message = await client.create({
      model: MODEL,
      max_tokens: 32000,
      thinking: { type: 'adaptive' },
      output_config: {
        effort: 'medium',
        format: {
          type: 'json_schema',
          schema: z.toJSONSchema(planSchema, { target: 'draft-7' }) as Record<string, unknown>,
        },
      },
      messages,
    });

    if (message.stop_reason === 'refusal') {
      throw new AgentError('The model declined to write the plan.', 'api');
    }

    const text = message.content
      .filter((b): b is Anthropic.Messages.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('');
    assembled = planSchema.parse(JSON.parse(text));
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
    options: assembled.options.map((option) => ({
      ...option,
      transport: option.transport.map((l) => withCheckedAt(l, researchedAt)),
      accommodation: option.accommodation.map((l) => withCheckedAt(l, researchedAt)),
      otherCosts: option.otherCosts.map((l) => withCheckedAt(l, researchedAt)),
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

function withCheckedAt(
  line: z.infer<typeof lineItemSchema>,
  checkedAt: string,
): ResearchPlan['options'][number]['transport'][number] {
  return { ...line, provenance: { ...line.provenance, checkedAt } };
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
