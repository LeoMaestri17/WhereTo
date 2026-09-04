'use client';

import { useEffect, useState } from 'react';

/**
 * One word in the headline that cycles: "What should we plan for tonight / this weekend /
 * next month?"
 *
 * Deliberately slow and quiet. It exists to say "any timeframe works here" without a paragraph
 * explaining it, not to draw the eye away from the ideas underneath. It holds each word long
 * enough to read twice, cross-fades rather than slides, and stops entirely when the reader has
 * asked for reduced motion — at which point the first word simply stays.
 */
export function RotatingWord({
  words,
  intervalMs = 3200,
  className = '',
}: {
  words: string[];
  intervalMs?: number;
  className?: string;
}) {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (words.length < 2) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let fadeTimer: ReturnType<typeof setTimeout>;
    const cycle = setInterval(() => {
      setVisible(false);
      fadeTimer = setTimeout(() => {
        setIndex((i) => (i + 1) % words.length);
        setVisible(true);
      }, 260);
    }, intervalMs);

    return () => {
      clearInterval(cycle);
      clearTimeout(fadeTimer);
    };
  }, [words.length, intervalMs]);

  return (
    <span
      className={`inline-block text-accent transition-opacity duration-250 ${
        visible ? 'opacity-100' : 'opacity-0'
      } ${className}`}
    >
      {words[index]}
    </span>
  );
}
