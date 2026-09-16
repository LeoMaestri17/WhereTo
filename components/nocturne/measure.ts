/**
 * The page measure, in its own module with no `'use client'` directive.
 *
 * This lived in `primitives.tsx` and broke the landing page in a way that took a browser
 * measurement to see. `primitives.tsx` is a client module, so when a *server* component imported
 * `MEASURE` from it, Next.js handed over a client-reference stub rather than the string — a
 * function that throws when called. Interpolating it into a template literal calls `toString()`
 * on that stub, and the thrown error's own text ends up as the className:
 *
 *   function() { throw new Error("Attempted to call MEASURE() from the server ...") } mt-auto
 *
 * The page rendered, no error surfaced, and every bottom-anchored block simply sat full-bleed
 * against the left edge with no max-width. A plain constant cannot cross the server/client
 * boundary from a client module, so it belongs somewhere neutral that both sides can import.
 */
export const MEASURE = 'mx-auto w-full max-w-6xl px-6 sm:px-10';
