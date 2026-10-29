'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * A price that moves when it changes.
 *
 * Changing the group size on the control strip changes every figure on the page, and a number
 * that snaps gives no sense that the control did anything. Counting it up over a fifth of a
 * second says "this moved, and here is roughly how far" without anyone having to watch for it.
 *
 * The tween runs on requestAnimationFrame rather than a CSS transition because there is no
 * interpolable CSS property for "the digits of a number". State is set inside the frame callback
 * rather than in the effect body, which is both correct and what React now warns about.
 */
export function AnimatedMoney({
  value,
  className = '',
  duration = 260,
}: {
  value: number;
  className?: string;
  duration?: number;
}) {
  const [shown, setShown] = useState(value);
  const from = useRef(value);
  const frame = useRef<number | null>(null);

  useEffect(() => {
    // Respect the system preference: no tween, just the answer.
    const reduced =
      typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced || from.current === value) {
      from.current = value;
      setShown(value);
      return;
    }

    const start = performance.now();
    const origin = from.current;
    const delta = value - origin;

    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      // Matches --ease: fast out of the gate, settles rather than stops.
      const eased = 1 - Math.pow(1 - t, 3);
      setShown(origin + delta * eased);
      if (t < 1) {
        frame.current = requestAnimationFrame(step);
      } else {
        from.current = value;
      }
    };

    frame.current = requestAnimationFrame(step);
    return () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current);
      from.current = value;
    };
  }, [value, duration]);

  /* Tabular figures, or the width changes on every frame and the whole row twitches. */
  return (
    <span className={className} style={{ fontVariantNumeric: 'tabular-nums' }}>
      ${Math.round(shown).toLocaleString('en-US')}
    </span>
  );
}
