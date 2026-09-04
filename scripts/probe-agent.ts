/**
 * Drives the whole research agent offline, against recorded model responses.
 *
 * The research call is the expensive part of this app. This script replaces the Anthropic client
 * with a scripted one, so the tool loop, the ledger, provenance reconciliation and link checking
 * can all be exercised and proved for zero API credit.
 *
 * The three cases below are the ones that matter:
 *   1. honest    — the model cites real tool results, and its lines survive as `api`
 *   2. inventing — the model claims `api` on a number no tool returned, and gets downgraded
 *   3. no key    — no pricing API is available, so nothing may claim `api` at all
 *
 * Case 2 is the whole reason the ledger exists. If it ever stops failing the way it should, the
 * provenance badge has become decorative.
 *
 *   npx tsx scripts/probe-agent.ts
 */
import fs from 'node:fs';
import path from 'node:path';

function loadEnvLocal(): void {
  const file = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (match && !process.env[match[1]]) process.env[match[1]] = match[2].trim();
  }
}
loadEnvLocal();

type Any = Record<string, unknown>;

function heading(text: string) {
  console.log(`\n${'─'.repeat(74)}\n${text}\n${'─'.repeat(74)}`);
}

/** A scripted stand-in for the Anthropic client. Returns canned messages in order. */
function scriptedClient(script: Any[]) {
  let call = 0;
  return {
    async create() {
      const next = script[Math.min(call, script.length - 1)];
      call += 1;
      return next as never;
    },
    get calls() {
      return call;
    },
  };
}

function assistantToolUse(id: string, name: string, input: Any): Any {
  return {
    id: `msg_${id}`,
    type: 'message',
    role: 'assistant',
    model: 'claude-opus-5',
    stop_reason: 'tool_use',
    content: [{ type: 'tool_use', id, name, input }],
    usage: { input_tokens: 100, output_tokens: 50 },
  };
}

function assistantText(text: string, stop: string = 'end_turn'): Any {
  return {
    id: 'msg_text',
    type: 'message',
    role: 'assistant',
    model: 'claude-opus-5',
    stop_reason: stop,
    content: [{ type: 'text', text }],
    usage: { input_tokens: 100, output_tokens: 50 },
  };
}

/** The plan the "model" returns in phase B. `sourceRef` is what the ledger checks. */
function planJson(opts: { sourceRef?: string; price: number; source: string }): string {
  return JSON.stringify({
    summary: 'Two nights in Springdale, with the canyon shuttle doing the work.',
    confidenceNote: 'Accommodation was priced live; the rest is from search.',
    options: [
      {
        id: 'motel',
        name: 'Coach up, motel in Springdale',
        bestFor: 'Groups with no driver',
        perPersonMin: 300,
        perPersonMax: 400,
        lines: [
          {
            category: 'transport',
            label: 'Coach to St George',
            provider: 'FlixBus',
            detail: 'Union Station to St George.',
            url: 'https://www.flixbus.com/',
            perPersonMin: 96,
            perPersonMax: 148,
            basis: 'Return, per person',
            provenance: { source: 'web', sourceLabel: 'Web search' },
          },
          {
            category: 'accommodation',
            label: 'Zion Park Motel',
            provider: 'Google Hotels',
            detail: 'Walking distance to the shuttle stop.',
            url: 'https://example.com/model-invented-link',
            perPersonMin: opts.price,
            perPersonMax: opts.price,
            basis: 'Two rooms, 2 nights, 4 sharing',
            provenance: {
              source: opts.source,
              sourceLabel: 'Google Hotels',
              ...(opts.sourceRef ? { sourceRef: opts.sourceRef } : {}),
            },
          },
        ],
      },
    ],
    assumptions: [{ label: 'Occupancy', detail: 'Two rooms with two sharing each.' }],
    exclusions: ['The Narrows dry-suit hire.'],
    constraints: [],
    itinerary: [
      {
        dayNumber: 1,
        label: 'Coach up',
        blocks: [{ time: '13:00', title: 'Leave Union Station', detail: 'Eight hours.' }],
      },
    ],
    sources: [{ title: 'Zion fees', url: 'https://www.nps.gov/zion/planyourvisit/fees.htm' }],
  });
}

const REQUEST = {
  ideaSlug: 'zion-weekend',
  ideaTitle: 'Zion National Park',
  region: 'Southern Utah',
  shape: 'weekend' as const,
  startDate: '2026-10-16',
  endDate: '2026-10-18',
  groupSize: 4,
  hasCar: false,
  isOver21: true,
  hasUsCreditCard: false,
  budgetBand: 'moderate' as const,
  moods: [] as never[],
};

async function main() {
  const { runResearchAgent } = await import('../lib/research/agent');
  const { PriceLedger, reconcileProvenance } = await import('../lib/pricing/ledger');

  /* ---------------------------------------------------------------- case 1 + 2 */
  // Both cases run the same loop; only the plan the "model" writes differs. The hotel tool has
  // no key here, so it returns `unavailable` and records nothing in the ledger — which is
  // precisely the situation in which an `api` claim must not survive.

  for (const scenario of [
    { name: 'CASE 1 — model claims api with a fabricated sourceRef', ref: 'htl_fake1234', source: 'api' },
    { name: 'CASE 2 — model claims api with no sourceRef at all', ref: undefined, source: 'api' },
    { name: 'CASE 3 — model is honest and labels it an estimate', ref: undefined, source: 'estimate' },
  ]) {
    heading(scenario.name);

    const client = scriptedClient([
      assistantToolUse('t1', 'search_hotels', {
        query: 'Springdale, Utah',
        check_in_date: '2026-10-16',
        check_out_date: '2026-10-18',
        adults: 2,
        rooms: 2,
      }),
      assistantText(planJson({ sourceRef: scenario.ref, price: 145, source: scenario.source })),
    ]);

    const events: string[] = [];
    const result = await runResearchAgent(client, REQUEST, (e) => {
      if (e.type === 'tool') events.push(`   ${e.status.padEnd(8)} ${e.label}`);
      if (e.type === 'stage') events.push(`   stage    ${e.label}`);
      if (e.type === 'note') events.push(`   note     ${e.text}`);
    });

    console.log(events.join('\n'));
    const lines = result.plan.options.flatMap((o) => [
      ...o.transport,
      ...o.accommodation,
      ...o.otherCosts,
    ]);
    console.log(`\n   tool calls: ${result.toolCalls} · ledger entries: ${result.ledgerSize}`);
    for (const line of lines) {
      console.log(
        `   ${line.provenance.source.padEnd(8)} ${line.provenance.sourceLabel.padEnd(14)} ${line.label}`,
      );
    }
    if (result.downgrades.length) {
      console.log(`\n   downgraded:`);
      for (const d of result.downgrades) console.log(`     - ${d}`);
    }

    const anyApi = lines.some((l) => l.provenance.source === 'api');
    console.log(
      `\n   ${anyApi ? '❌ FAIL' : '✅ PASS'} — no line survives as "api" when nothing was verified`,
    );
  }

  /* ---------------------------------------------------------------- case 4 */
  heading('CASE 4 — a genuine ledger entry, price matching, survives as api');

  const ledger = new PriceLedger();
  ledger.record({
    resultId: 'htl_real0001',
    tool: 'search_hotels',
    args: {},
    checkedAt: new Date().toISOString(),
    cached: false,
    quotes: [
      { label: 'Zion Park Motel (per night)', priceUsd: 145, url: 'https://zionparkmotel.com/' },
    ],
  });
  ledger.recordSearchedUrl('https://www.flixbus.com/');

  const draft = JSON.parse(planJson({ sourceRef: 'htl_real0001', price: 145, source: 'api' }));
  const plan = {
    ...draft,
    ideaSlug: 'zion-weekend',
    destination: 'Southern Utah',
    researchedAt: new Date().toISOString(),
    provenance: 'live',
    confidence: 'medium',
    totalRangeMin: 300,
    totalRangeMax: 400,
    request: REQUEST,
    options: draft.options.map((o: Any) => {
      const stamp = (l: Any): Any => ({
        ...l,
        provenance: { ...(l.provenance as Any), checkedAt: new Date().toISOString() },
      });
      const lines: Any[] = (o.lines as Any[]).map(stamp);
      return {
        ...o,
        transport: lines.filter((l) => l.category === 'transport'),
        accommodation: lines.filter((l) => l.category === 'accommodation'),
        otherCosts: lines.filter((l) => l.category === 'other'),
      };
    }),
  };

  const reconciled = reconcileProvenance(plan as never, ledger, true);
  const lines = reconciled.plan.options.flatMap((o) => [
    ...o.transport,
    ...o.accommodation,
    ...o.otherCosts,
  ]);
  for (const line of lines) {
    console.log(
      `   ${line.provenance.source.padEnd(8)} ${line.provenance.sourceLabel.padEnd(14)} ${line.label}` +
        `${line.url ? `\n            url: ${line.url}` : ''}`,
    );
  }
  const hotel = lines.find((l) => l.label.includes('Zion Park Motel'));
  const urlReplaced = hotel?.url === 'https://zionparkmotel.com/';
  console.log(
    `\n   ${hotel?.provenance.source === 'api' ? '✅ PASS' : '❌ FAIL'} — a verified line keeps "api"`,
  );
  console.log(
    `   ${urlReplaced ? '✅ PASS' : '❌ FAIL'} — the model's invented URL was replaced with the provider's`,
  );
  console.log(`   confidence recomputed from evidence: ${reconciled.plan.confidence}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
