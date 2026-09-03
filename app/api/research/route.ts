import { NextResponse } from 'next/server';
import { z } from 'zod';
import { INTEREST_TAGS } from '@/lib/domain/types';
import { NoCachedPlanError, describeMode, runResearch } from '@/lib/research/service';
import { RESEARCH_STAGES } from '@/lib/research/types';

export const runtime = 'nodejs';
/** Research with web search regularly runs past a minute. */
export const maxDuration = 300;

const requestSchema = z.object({
  ideaSlug: z.string().min(1),
  ideaTitle: z.string().min(1),
  region: z.string().min(1),
  shape: z.enum(['day', 'weekend', 'break']),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  groupSize: z.number().int().min(1).max(20),
  hasCar: z.boolean(),
  isOver21: z.boolean(),
  hasUsCreditCard: z.boolean(),
  budgetBand: z.enum(['shoestring', 'moderate', 'comfortable']),
  moods: z.array(z.enum(INTEREST_TAGS)),
});

type Frame =
  | { type: 'stage'; id: string; label: string }
  | { type: 'mode'; mode: 'live' | 'cached'; reason: string }
  | { type: 'plan'; plan: unknown; fallbackReason?: string }
  | { type: 'error'; message: string; recoverable: boolean };

function line(frame: Frame): Uint8Array {
  return new TextEncoder().encode(`${JSON.stringify(frame)}\n`);
}

/**
 * Newline-delimited JSON rather than a single response, so the client can name what is happening
 * while it happens. A live call takes 30 to 90 seconds and a spinner for that long is not a
 * loading state, it is an absence of one.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'That request body was not JSON.' }, { status: 400 });
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: 'Those planner settings did not make sense.',
        detail: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      },
      { status: 400 },
    );
  }

  const researchRequest = parsed.data;
  const { mode, reason } = describeMode();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let closed = false;
      const send = (frame: Frame) => {
        if (!closed) controller.enqueue(line(frame));
      };

      send({ type: 'mode', mode, reason });

      // The stages are a genuine description of the work, paced to the path being taken:
      // a cached compose is near-instant, a live call is not.
      const pace = mode === 'live' ? 6500 : 550;
      let stageIndex = 0;
      send({ type: 'stage', ...RESEARCH_STAGES[0] });
      const ticker = setInterval(() => {
        stageIndex += 1;
        if (stageIndex < RESEARCH_STAGES.length) {
          send({ type: 'stage', ...RESEARCH_STAGES[stageIndex] });
        }
      }, pace);

      try {
        const outcome = await runResearch(researchRequest);
        clearInterval(ticker);
        send({ type: 'plan', plan: outcome.plan, fallbackReason: outcome.fallbackReason });
      } catch (err) {
        clearInterval(ticker);
        if (err instanceof NoCachedPlanError) {
          send({
            type: 'error',
            message:
              'There is no saved plan for this destination, and without an API key there is nothing to research it with. Add a key to .env.local, or pick one of the destinations that has a saved plan.',
            recoverable: false,
          });
        } else {
          send({
            type: 'error',
            message: err instanceof Error ? err.message : 'The research call failed.',
            recoverable: true,
          });
        }
      } finally {
        clearInterval(ticker);
        closed = true;
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'application/x-ndjson; charset=utf-8',
      'Cache-Control': 'no-store, no-transform',
      'X-Accel-Buffering': 'no',
    },
  });
}
