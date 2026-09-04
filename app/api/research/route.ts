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
  groupSize: z.coerce.number().int().min(1).max(20),
  hasCar: z.coerce.boolean(),
  isOver21: z.coerce.boolean(),
  hasUsCreditCard: z.coerce.boolean(),
  budgetBand: z.enum(['shoestring', 'moderate', 'comfortable']),
  moods: z.array(z.enum(INTEREST_TAGS)),
});

type Frame =
  | { type: 'stage'; id: string; label: string }
  | { type: 'tool'; label: string; status: 'started' | 'ok' | 'failed' }
  | { type: 'note'; text: string }
  | { type: 'mode'; mode: 'live' | 'cached'; reason: string }
  | { type: 'plan'; plan: unknown; fallbackReason?: string }
  | { type: 'error'; message: string; recoverable: boolean };

/**
 * Server-sent events rather than a hand-rolled stream.
 *
 * A live research call takes thirty to ninety seconds, and a spinner for that long is not a
 * loading state — it is the absence of one. SSE lets the server name each stage as it reaches
 * it, and unlike reading `response.body` by hand it is a first-class browser primitive, so the
 * request is recorded as a normal completed request rather than a cancelled one.
 *
 * GET because EventSource cannot send a body. The parameters are a dozen scalars and nothing
 * here is sensitive.
 */
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;

  const parsed = requestSchema.safeParse({
    ideaSlug: params.get('ideaSlug'),
    ideaTitle: params.get('ideaTitle'),
    region: params.get('region'),
    shape: params.get('shape'),
    startDate: params.get('startDate'),
    endDate: params.get('endDate'),
    groupSize: params.get('groupSize'),
    hasCar: params.get('hasCar') === 'true',
    isOver21: params.get('isOver21') === 'true',
    hasUsCreditCard: params.get('hasUsCreditCard') === 'true',
    budgetBand: params.get('budgetBand'),
    moods: params.getAll('mood'),
  });

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
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let closed = false;
      const send = (frame: Frame) => {
        if (closed) return;
        controller.enqueue(encoder.encode(`event: ${frame.type}\ndata: ${JSON.stringify(frame)}\n\n`));
      };

      send({ type: 'mode', mode, reason });

      /**
       * Progress is now reported by the pipeline as it reaches each step, rather than by a timer
       * pretending to. On the live path that means the user sees the actual lookups happening —
       * "Google Hotels · Springdale · 8 properties" — which is what a ninety-second wait needs.
       *
       * The cached path composes in milliseconds and has nothing real to report, so it keeps a
       * short scripted sequence purely so the transition is not a jarring flash.
       */
      let ticker: ReturnType<typeof setInterval> | undefined;
      if (mode === 'cached') {
        let stageIndex = 0;
        send({ type: 'stage', ...RESEARCH_STAGES[0] });
        ticker = setInterval(() => {
          stageIndex += 1;
          if (stageIndex < RESEARCH_STAGES.length) {
            send({ type: 'stage', ...RESEARCH_STAGES[stageIndex] });
          }
        }, 550);
      }

      try {
        const outcome = await runResearch(researchRequest, (event) => {
          if (event.type === 'stage') {
            send({ type: 'stage', id: event.stage, label: event.label });
          } else if (event.type === 'tool') {
            send({ type: 'tool', label: event.label, status: event.status });
          } else {
            send({ type: 'note', text: event.text });
          }
        });
        send({ type: 'plan', plan: outcome.plan, fallbackReason: outcome.fallbackReason });
      } catch (err) {
        if (err instanceof NoCachedPlanError) {
          send({
            type: 'error',
            message:
              'There is no saved plan for this destination, and without an API key there is nothing to research it with. Add a key to .env.local, or pick one of the destinations marked “Plan ready”.',
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
        if (ticker) clearInterval(ticker);
        closed = true;
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-store, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
