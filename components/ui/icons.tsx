import type { CostCategory } from '@/lib/trip/categories';
import { COST_COLOUR } from '@/lib/trip/categories';

/**
 * The cost icons, drawn rather than sliced.
 *
 * The trip rows used tiles cut from the illustration sheet: flat pastel squares that read as
 * clipart directly under a photograph, each drawn at its own weight because they were never
 * meant to sit at 44px in a row. These are one family — one viewBox, one stroke weight, round
 * caps and joins throughout — and they take their colour from the cost category, so the row
 * icon, the money bar segment and the matching panel of the logo are all the same colour.
 *
 * Stroked rather than filled on purpose: a filled glyph at this size competes with the
 * photography above it, and an outline sits quietly beside a price.
 */

const STROKE = 1.75;

function Frame({ children, size }: { children: React.ReactNode; size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={STROKE}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {children}
    </svg>
  );
}

export function CarIcon({ size = 20 }: { size?: number }) {
  return (
    <Frame size={size}>
      <path d="M3 13.5 4.6 8.4A2 2 0 0 1 6.5 7h11a2 2 0 0 1 1.9 1.4L21 13.5" />
      <path d="M3 13.5h18v3.8a.7.7 0 0 1-.7.7h-1.6a.7.7 0 0 1-.7-.7V17H6v.3a.7.7 0 0 1-.7.7H3.7a.7.7 0 0 1-.7-.7Z" />
      <circle cx="7" cy="15.2" r="1" />
      <circle cx="17" cy="15.2" r="1" />
    </Frame>
  );
}

export function PlaneIcon({ size = 20 }: { size?: number }) {
  return (
    <Frame size={size}>
      <path d="M10.3 4.2a1.6 1.6 0 0 1 3.1 0l1.1 5.2 6 3.3a1.2 1.2 0 0 1 .6 1v1.4l-6.8-1.6-.7 3.8 2.3 1.7v1.3l-3.9-1-3.9 1v-1.3l2.3-1.7-.7-3.8L2.9 15v-1.4a1.2 1.2 0 0 1 .6-1l6-3.3Z" />
    </Frame>
  );
}

export function TrainIcon({ size = 20 }: { size?: number }) {
  return (
    <Frame size={size}>
      <rect x="5" y="3.5" width="14" height="12.5" rx="3" />
      <path d="M5 9.5h14" />
      <circle cx="9" cy="12.8" r="1" />
      <circle cx="15" cy="12.8" r="1" />
      <path d="m7.5 19-1.5 2M16.5 19l1.5 2M8 16v3M16 16v3" />
    </Frame>
  );
}

export function BedIcon({ size = 20 }: { size?: number }) {
  return (
    <Frame size={size}>
      <path d="M3 18v-7.5a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1V18" />
      <path d="M3 14.2h18" />
      <path d="M6.5 9.5V7.2a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v2.3" />
      <path d="M3 18v2M21 18v2" />
    </Frame>
  );
}

export function FuelIcon({ size = 20 }: { size?: number }) {
  return (
    <Frame size={size}>
      <rect x="4" y="3.5" width="9.5" height="17" rx="1.6" />
      <path d="M4 9.5h9.5" />
      <path d="M13.5 8h3.2a1.8 1.8 0 0 1 1.8 1.8v6.4a1.6 1.6 0 0 0 1.6 1.6 1.6 1.6 0 0 0 1.6-1.6V10" />
      <path d="M20 10 18.4 7" />
    </Frame>
  );
}

export function TicketIcon({ size = 20 }: { size?: number }) {
  return (
    <Frame size={size}>
      <path d="M3 8.2V6.4a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v1.8a2.2 2.2 0 0 0 0 4.4v1.8a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-1.8a2.2 2.2 0 0 0 0-4.4Z" />
      <path d="M9 9.2v3.6M15 9.2v3.6" />
    </Frame>
  );
}

export type IconName = 'car' | 'plane' | 'train' | 'bed' | 'fuel' | 'ticket';

const ICONS: Record<IconName, (p: { size?: number }) => React.ReactElement> = {
  car: CarIcon,
  plane: PlaneIcon,
  train: TrainIcon,
  bed: BedIcon,
  fuel: FuelIcon,
  ticket: TicketIcon,
};

/**
 * An icon in its category's colour, on a tinted tile.
 *
 * The tile is the category colour at low alpha, the stroke the same colour at full, so a row
 * reads as belonging to a cost line before the label is read.
 */
export function CostIcon({
  name,
  category,
  size = 40,
  dimmed = false,
}: {
  name: IconName;
  category: CostCategory;
  size?: number;
  dimmed?: boolean;
}) {
  const Icon = ICONS[name];
  const colour = COST_COLOUR[category];
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-[10px]"
      style={{
        width: size,
        height: size,
        background: `color-mix(in srgb, ${colour} 22%, var(--paper))`,
        color: dimmed ? 'var(--faint)' : `color-mix(in srgb, ${colour} 78%, var(--ink))`,
        opacity: dimmed ? 0.5 : 1,
      }}
    >
      <Icon size={Math.round(size * 0.52)} />
    </span>
  );
}
