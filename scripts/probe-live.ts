/**
 * Proves the live Anthropic path works from Node, outside the app.
 *
 * The app's research call is the most expensive and slowest thing to debug through the UI, so
 * this exercises the same client, model and server tool directly. Run it before blaming the app.
 *
 * Usage: npx tsx scripts/probe-live.ts
 */
import Anthropic from '@anthropic-ai/sdk';
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

async function main() {
  loadEnvLocal();
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('No ANTHROPIC_API_KEY. Put one in .env.local.');
    process.exit(1);
  }

  const client = new Anthropic({ apiKey });
  const startedAt = Date.now();

  const stream = client.messages.stream({
    model: 'claude-opus-5',
    max_tokens: 4000,
    thinking: { type: 'adaptive' },
    output_config: { effort: 'low' },
    tools: [{ type: 'web_search_20260209', name: 'web_search', max_uses: 3 }],
    messages: [
      {
        role: 'user',
        content:
          'Search the web for the current one-way FlixBus fare from Los Angeles to Las Vegas. ' +
          'Reply in one sentence with the fare and the date you found it quoted for.',
      },
    ],
  });

  const message = await stream.finalMessage();
  const seconds = ((Date.now() - startedAt) / 1000).toFixed(1);

  const text = message.content
    .filter((b): b is Anthropic.Messages.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('');
  const searches = message.content.filter((b) => b.type === 'server_tool_use').length;
  const resultBlocks = message.content.filter((b) => b.type === 'web_search_tool_result').length;

  console.log(`took ${seconds}s · stop_reason: ${message.stop_reason}`);
  console.log(`web searches issued: ${searches} · result blocks returned: ${resultBlocks}`);
  console.log(`\n${text.trim()}\n`);
  console.log('usage:', JSON.stringify(message.usage));

  if (searches === 0) {
    console.warn('\nWARNING: the model answered without searching. Web search may not be active.');
  }
}

main().catch((err) => {
  console.error('\nLive probe failed:', err instanceof Error ? err.message : err);
  process.exit(1);
});
