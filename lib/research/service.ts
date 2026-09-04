import 'server-only';
import Anthropic from '@anthropic-ai/sdk';
import { messageClient, runResearchAgent, type OnAgentEvent } from './agent';
import { CachedResearchService, NoCachedPlanError, hasCachedPlan } from './cached';
import { LiveResearchService } from './live';
import type { ResearchPlan, ResearchRequest, TripResearchService } from './types';

/**
 * Which implementation runs, and what happens when it fails.
 *
 * Live when a key is present and RESEARCH_MODE is not forced to cached; otherwise the saved
 * plans. A live failure of any kind — no key, timeout, HTTP error, JSON that will not parse —
 * falls back to the saved plan and stamps the result `cached-fallback`, which the UI shows.
 * There is no path through this module that quietly presents cached data as fresh.
 */

export type ResearchMode = 'live' | 'cached';

export function resolveMode(): ResearchMode {
  if (process.env.RESEARCH_MODE === 'cached') return 'cached';
  return process.env.ANTHROPIC_API_KEY ? 'live' : 'cached';
}

export interface ResearchOutcome {
  plan: ResearchPlan;
  /** Present when the live path was attempted and did not work. Shown to the user verbatim. */
  fallbackReason?: string;
}

export function describeMode(): { mode: ResearchMode; reason: string } {
  if (process.env.RESEARCH_MODE === 'cached') {
    return { mode: 'cached', reason: 'RESEARCH_MODE is set to cached in the environment.' };
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return {
      mode: 'cached',
      reason: 'No ANTHROPIC_API_KEY is set, so live research is not available.',
    };
  }
  return { mode: 'live', reason: 'An API key is present, so this ran live with web search.' };
}

export function selectService(): TripResearchService {
  return resolveMode() === 'live'
    ? new LiveResearchService(process.env.ANTHROPIC_API_KEY as string)
    : new CachedResearchService('cached');
}

export async function runResearch(
  request: ResearchRequest,
  onEvent: OnAgentEvent = () => {},
): Promise<ResearchOutcome> {
  if (resolveMode() === 'cached') {
    return { plan: await new CachedResearchService('cached').research(request) };
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY as string });

  try {
    const result = await runResearchAgent(messageClient(client), request, onEvent);
    return { plan: result.plan };
  } catch (err) {
    const reason = err instanceof Error ? err.message : 'The live research call failed.';

    // A free-form destination has no fixture to fall back on, so this is now the common case
    // rather than the rare one. Failing to a written explanation beats failing to a stack trace.
    if (!hasCachedPlan(request.ideaSlug)) {
      throw new Error(
        `Live research failed and there is no saved plan for this destination to fall back on. ${reason}`,
      );
    }
    const plan = await new CachedResearchService('cached-fallback').research(request);
    return { plan, fallbackReason: reason };
  }
}

export { NoCachedPlanError, hasCachedPlan };
