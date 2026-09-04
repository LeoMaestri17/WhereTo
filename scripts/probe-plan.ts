/**
 * One real end-to-end research run, outside the app.
 *
 * This is the expensive script — it makes a genuine Anthropic call with tools, and spends a few
 * SerpApi searches. Everything else in scripts/ is free; this one is not. Run it deliberately.
 *
 *   npx tsx scripts/probe-plan.ts                     New York, flights + hotels
 *   npx tsx scripts/probe-plan.ts zion-weekend        a drive, hotels only
 *
 * It prints the costed plan with the provenance of every line, which is the thing worth
 * inspecting: how much of the plan was priced against a live source rather than recalled.
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
// This script IS the live path, so the cached lock that protects development does not apply.
delete process.env.RESEARCH_MODE;

const PRESETS: Record<string, Record<string, unknown>> = {
  'new-york-thanksgiving': {
    ideaSlug: 'new-york-thanksgiving',
    ideaTitle: 'New York over Thanksgiving',
    region: 'New York City',
    shape: 'break',
    startDate: '2026-11-24',
    endDate: '2026-11-28',
    groupSize: 4,
    hasCar: false,
    isOver21: false,
    hasUsCreditCard: false,
    budgetBand: 'moderate',
    moods: [],
  },
  'zion-weekend': {
    ideaSlug: 'zion-weekend',
    ideaTitle: 'Zion National Park',
    region: 'Zion National Park, Southern Utah',
    shape: 'weekend',
    startDate: '2026-10-16',
    endDate: '2026-10-18',
    groupSize: 4,
    hasCar: false,
    isOver21: true,
    hasUsCreditCard: false,
    budgetBand: 'moderate',
    moods: [],
  },
};

async function main() {
  const slug = process.argv[2] ?? 'new-york-thanksgiving';
  const request = PRESETS[slug];
  if (!request) {
    console.error(`No preset "${slug}". Try: ${Object.keys(PRESETS).join(', ')}`);
    process.exit(1);
  }

  const Anthropic = (await import('@anthropic-ai/sdk')).default;
  const { runResearchAgent, messageClient } = await import('../lib/research/agent');
  const { quotaStatus } = await import('../lib/pricing/quota');

  const before = await quotaStatus();
  console.log(
    `SerpApi before: ${before.account?.totalSearchesLeft ?? '?'} left of ${before.account?.searchesPerMonth ?? '?'}\n`,
  );

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const startedAt = Date.now();

  const result = await runResearchAgent(messageClient(client), request as never, (event) => {
    if (event.type === 'stage') console.log(`\n▸ ${event.label}`);
    if (event.type === 'tool') {
      const mark = event.status === 'ok' ? '✓' : event.status === 'failed' ? '·' : '⟳';
      console.log(`  ${mark} ${event.label}`);
    }
    if (event.type === 'note') console.log(`  ! ${event.text}`);
  });

  const seconds = ((Date.now() - startedAt) / 1000).toFixed(1);
  const plan = result.plan;

  console.log(`\n${'═'.repeat(76)}`);
  console.log(`${plan.destination} · researched in ${seconds}s`);
  console.log('═'.repeat(76));
  console.log(`\n${plan.summary}\n`);

  for (const option of plan.options) {
    console.log(`\n── ${option.name} — $${option.perPersonMin}–$${option.perPersonMax} each`);
    console.log(`   ${option.bestFor}`);
    for (const line of [...option.transport, ...option.accommodation, ...option.otherCosts]) {
      const tag =
        line.provenance.source === 'api'
          ? `API:${line.provenance.sourceLabel}`
          : line.provenance.source === 'web'
            ? 'web'
            : 'estimate';
      console.log(
        `   [${tag.padEnd(20)}] $${String(line.perPersonMin).padStart(4)}–$${String(line.perPersonMax).padEnd(4)} ${line.label} · ${line.provider}`,
      );
      if (line.url) console.log(`   ${' '.repeat(23)} ${line.link?.status ?? '?'} ${line.url.slice(0, 80)}`);
    }
  }

  const lines = plan.options.flatMap((o) => [...o.transport, ...o.accommodation, ...o.otherCosts]);
  const counts = { api: 0, web: 0, estimate: 0 };
  for (const l of lines) counts[l.provenance.source] += 1;

  console.log(`\n${'═'.repeat(76)}`);
  console.log(
    `${lines.length} costed lines — ${counts.api} api · ${counts.web} web · ${counts.estimate} estimate`,
  );
  console.log(`confidence: ${plan.confidence} · tool calls: ${result.toolCalls} · ledger: ${result.ledgerSize}`);
  if (result.downgrades.length) {
    console.log(`\ndowngraded by the ledger:`);
    for (const d of result.downgrades) console.log(`  - ${d}`);
  }
  const dead = lines.filter((l) => l.link?.status === 'dead').length;
  console.log(`dead links: ${dead}`);

  const after = await quotaStatus();
  console.log(
    `\nSerpApi after: ${after.account?.totalSearchesLeft ?? '?'} left · ${
      (before.account?.totalSearchesLeft ?? 0) - (after.account?.totalSearchesLeft ?? 0)
    } spent on this run`,
  );
}

main().catch((e) => {
  console.error('\nFailed:', e instanceof Error ? e.message : e);
  process.exit(1);
});
