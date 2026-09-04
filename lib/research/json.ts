/**
 * Defensive JSON extraction.
 *
 * A model asked for JSON usually returns JSON, and occasionally returns JSON wrapped in a
 * markdown fence or with a sentence either side. Rather than trusting the whole response to
 * parse, this finds the outermost balanced object and parses that.
 *
 * It lives in its own module, free of `server-only`, so the offline test harness can exercise
 * the assembly path without pulling the server-side research modules in with it.
 */

export class JsonExtractionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'JsonExtractionError';
  }
}

export function extractJson(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenced ? fenced[1] : text;

  const start = candidate.indexOf('{');
  if (start === -1) throw new JsonExtractionError('The model did not return any JSON.');

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = start; i < candidate.length; i += 1) {
    const ch = candidate[i];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (ch === '\\') {
      escaped = true;
      continue;
    }
    if (ch === '"') inString = !inString;
    if (inString) continue;
    if (ch === '{') depth += 1;
    if (ch === '}') {
      depth -= 1;
      if (depth === 0) {
        try {
          return JSON.parse(candidate.slice(start, i + 1));
        } catch (err) {
          throw new JsonExtractionError(
            `The JSON the model returned would not parse: ${(err as Error).message}`,
          );
        }
      }
    }
  }

  throw new JsonExtractionError('The model’s JSON was cut off before it closed.');
}
