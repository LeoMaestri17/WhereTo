'use client';

import { useState } from 'react';
import { COST_COLOUR, COST_LABEL, type CostCategory } from '@/lib/trip/categories';
import { money, type TripQuote } from '@/lib/trip/quote';

/**
 * Where the money goes, as one component in three sizes.
 *
 * This is the signature element: it is the only thing in the product that shows the shape of a
 * price rather than its size, and it is the same four colours as the four panels of the mark,
 * in the same order. Having it in one place and three sizes is what makes it an identity rather
 * than a chart that happens to appear on one screen.
 *
 *   mini     a bare bar on a destination card. No legend, no interaction, just the proportions.
 *   compact  bar and legend, for the trip page.
 *   full     bar, legend and hover, for the panel where someone is deciding.
 */

export type MoneyBarSize = 'mini' | 'compact' | 'full';

export interface MoneyPart {
  key: CostCategory;
  value: number;
}

export function partsFromQuote(quote: TripQuote): MoneyPart[] {
  const [travel, stay, car] = quote.rows;
  return [
    { key: 'travel', value: travel.perPersonTotal },
    { key: 'stay', value: stay.perPersonTotal },
    { key: 'car', value: car.perPersonTotal },
    { key: 'fees', value: quote.fees.perPersonTotal },
  ];
}

export function MoneyBar({
  parts,
  size = 'full',
  className = '',
}: {
  parts: MoneyPart[];
  size?: MoneyBarSize;
  className?: string;
}) {
  const [hovered, setHovered] = useState<CostCategory | null>(null);
  const total = parts.reduce((s, p) => s + p.value, 0);
  if (total <= 0) return null;

  const interactive = size === 'full';
  const height = size === 'mini' ? 6 : size === 'compact' ? 10 : 12;

  const bar = (
    <div
      className="flex w-full overflow-hidden rounded-full"
      style={{ height, gap: size === 'mini' ? 0 : 2 }}
      onMouseLeave={interactive ? () => setHovered(null) : undefined}
      role={size === 'mini' ? 'presentation' : undefined}
    >
      {parts.map((part) =>
        part.value <= 0 ? null : interactive ? (
          <button
            key={part.key}
            type="button"
            onMouseEnter={() => setHovered(part.key)}
            onFocus={() => setHovered(part.key)}
            onBlur={() => setHovered(null)}
            aria-label={`${COST_LABEL[part.key]}, ${money(part.value)} per person`}
            className="wt-ease h-full"
            style={{
              width: `${(part.value / total) * 100}%`,
              background: COST_COLOUR[part.key],
              /* The one being read holds full strength and grows; the rest step back. */
              opacity: hovered === null || hovered === part.key ? 1 : 0.32,
              transform: hovered === part.key ? 'scaleY(1.3)' : 'scaleY(1)',
            }}
          />
        ) : (
          <span
            key={part.key}
            className="h-full"
            style={{ width: `${(part.value / total) * 100}%`, background: COST_COLOUR[part.key] }}
          />
        ),
      )}
    </div>
  );

  if (size === 'mini') return <div className={className}>{bar}</div>;

  return (
    <div className={className}>
      {bar}
      <ul className={size === 'compact' ? 'mt-2.5 flex flex-col gap-1.5' : 'mt-3.5 flex flex-col gap-2'}>
        {parts.map((part) => (
          <li
            key={part.key}
            onMouseEnter={interactive ? () => setHovered(part.key) : undefined}
            onMouseLeave={interactive ? () => setHovered(null) : undefined}
            className="wt-ease -mx-2 flex items-center justify-between gap-3 rounded-[8px] px-2 py-1"
            style={{
              background: hovered === part.key ? 'var(--ground)' : 'transparent',
              opacity: hovered === null || hovered === part.key ? 1 : 0.45,
            }}
          >
            <span className="flex min-w-0 items-center gap-2">
              <span
                className="wt-ease h-2.5 w-2.5 shrink-0 rounded-full"
                style={{
                  background: COST_COLOUR[part.key],
                  transform: hovered === part.key ? 'scale(1.4)' : 'scale(1)',
                }}
                aria-hidden
              />
              <span className="text-[0.875rem] font-semibold">{COST_LABEL[part.key]}</span>
            </span>
            <span className="type-figure shrink-0 text-[0.9375rem]">
              {part.value <= 0 ? 'Included' : money(part.value)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
