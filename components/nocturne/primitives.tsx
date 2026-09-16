'use client';

import Link from 'next/link';
import type { ComponentProps, ReactNode } from 'react';

/**
 * The NOCTURNE component set.
 *
 * Small on purpose. The art direction is built on restraint, so there are five things here and
 * every screen in the product is made of them: a full-bleed photographic frame, a bottom-anchored
 * type block, pill buttons, glass floating chrome, and an icon set.
 *
 * The icons are hand-drawn at 1.5px rather than pulled from Lucide. Lucide is fine work, but its
 * silhouette is the single most recognisable tell of a generated interface, and this direction
 * cannot afford to look generated.
 */

/* ------------------------------------------------------------------ type */

/** Uppercase, widely tracked, muted. The signature move of the whole direction. */
export function Eyebrow({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return <p className={`type-eyebrow ${className}`}>{children}</p>;
}

/* ------------------------------------------------------------------ buttons */

type PillProps = {
  children: ReactNode;
  variant?: 'solid' | 'outline' | 'glass';
  size?: 'md' | 'lg';
  className?: string;
};

const PILL_BASE =
  'sq-ease inline-flex items-center justify-center gap-2.5 rounded-full font-medium tracking-[-0.01em] disabled:opacity-40 disabled:pointer-events-none';

const PILL_SIZE = {
  md: 'px-6 py-3 text-[0.8125rem]',
  lg: 'px-8 py-4 text-[0.875rem]',
} as const;

const PILL_VARIANT = {
  /* Sand on near-black. The only saturated thing on a screen, so there is at most one per view. */
  solid: 'bg-sand text-ground hover:bg-sand-2',
  /* 1px hairline at ~12% warm white, transparent fill. The default. */
  outline: 'border border-hairline-strong text-type hover:bg-[rgba(244,241,232,0.07)]',
  glass: 'sq-glass text-type hover:bg-[rgba(244,241,232,0.1)]',
} as const;

export function PillButton({
  children,
  variant = 'outline',
  size = 'md',
  className = '',
  ...rest
}: PillProps & ComponentProps<'button'>) {
  return (
    <button
      type="button"
      className={`${PILL_BASE} ${PILL_SIZE[size]} ${PILL_VARIANT[variant]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}

export function PillLink({
  children,
  href,
  variant = 'outline',
  size = 'md',
  className = '',
}: PillProps & { href: string }) {
  return (
    <Link
      href={href}
      className={`${PILL_BASE} ${PILL_SIZE[size]} ${PILL_VARIANT[variant]} ${className}`}
    >
      {children}
    </Link>
  );
}

/** Circular glass button, for the play, pin and moon motifs. */
export function IconButton({
  children,
  label,
  className = '',
  ...rest
}: { children: ReactNode; label: string; className?: string } & ComponentProps<'button'>) {
  return (
    <button
      type="button"
      aria-label={label}
      className={`sq-glass sq-ease inline-flex h-11 w-11 items-center justify-center rounded-full text-type hover:bg-[rgba(244,241,232,0.12)] ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}

/**
 * A frosted surface for content that cannot float on a photograph.
 *
 * Prose can sit directly on an image under a scrim. Dense content cannot: a date grid is 31 cells
 * of small text, each over a different part of the picture, and no single scrim strength serves
 * all of them. The panel gives that content a background it can rely on, and it composites on top
 * of the scrim so the two multiply rather than compete.
 */
export function GlassPanel({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`sq-glass rounded-[20px] p-5 sm:p-6 ${className}`}>{children}</div>;
}

/* ------------------------------------------------------------------ photographic frame */

/**
 * A full-bleed graded photograph under a gradient scrim, with its content anchored to the bottom.
 *
 * The scrim is a gradient rather than a flat fill because a flat overlay kills the image while a
 * gradient keeps the top of the frame clean and still makes the bottom legible. `sq-graded` does
 * the colour work so a saturated source photograph cannot arrive and break the palette.
 */
export function PhotoFrame({
  children,
  scrim = 'hero',
  className = '',
  image,
  priority = false,
}: {
  children: ReactNode;
  scrim?: 'hero' | 'card' | 'veil';
  className?: string;
  image: ReactNode;
  priority?: boolean;
}) {
  const scrims = {
    hero: 'sq-scrim-hero',
    card: 'sq-scrim-card',
    veil: 'sq-scrim-veil',
  } as const;

  return (
    <div
      className={`relative isolate flex flex-col overflow-hidden bg-ground ${className}`}
      data-priority={priority}
    >
      <div className="absolute inset-0">
        {image}
        <div className={`absolute inset-0 ${scrims[scrim]}`} aria-hidden />
        {/* The chrome at the top of the frame gets its own short strip. Without it the back link
            and the progress dots sit on the brightest part of the photograph at about 1.2:1. */}
        <div className="sq-scrim-top absolute inset-x-0 top-0 h-[16%]" aria-hidden />
      </div>
      {/* `flex-1`, not `h-full`. As a flex item inside a parent with only min-height set,
          height:100% resolves against an auto height and collapses — which left every
          bottom-anchored block sitting at the top of the frame with `mt-auto` doing nothing. */}
      <div className="relative flex min-h-0 flex-1 flex-col">{children}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ icons

   Thin-line, 1.5px, monochrome, on a 24-unit grid. Drawn rather than imported. */

type IconProps = { className?: string; size?: number };

function svg(size: number, className: string) {
  return {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.5,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
    className,
  };
}

/** The recurring motif. Nocturnal mood, and it marks the brand rather than toggling a theme. */
export function MoonIcon({ className = '', size = 20 }: IconProps) {
  return (
    <svg {...svg(size, className)}>
      <path d="M20.5 14.3A8.6 8.6 0 0 1 9.7 3.5a8.6 8.6 0 1 0 10.8 10.8z" />
    </svg>
  );
}

/** The mark: an abstract ridgeline. Centred at the top of the landing page. */
export function RidgeMark({ className = '', size = 28 }: IconProps) {
  return (
    <svg {...svg(size, className)}>
      <path d="M2 18.5 8 8l4 6.2L15.4 9l6.6 9.5z" />
      <path d="M2 18.5h20" />
    </svg>
  );
}

export function ArrowIcon({ className = '', size = 18 }: IconProps) {
  return (
    <svg {...svg(size, className)}>
      <path d="M4 12h15M14.5 6.5 20 12l-5.5 5.5" />
    </svg>
  );
}

export function PinIcon({ className = '', size = 18 }: IconProps) {
  return (
    <svg {...svg(size, className)}>
      <path d="M12 21.5s7-5.7 7-11a7 7 0 1 0-14 0c0 5.3 7 11 7 11z" />
      <circle cx="12" cy="10.2" r="2.6" />
    </svg>
  );
}

export function CarIcon({ className = '', size = 18 }: IconProps) {
  return (
    <svg {...svg(size, className)}>
      <path d="M3.5 15.5v-3l1.9-4.3A2 2 0 0 1 7.2 7h9.6a2 2 0 0 1 1.8 1.2l1.9 4.3v3" />
      <path d="M3.5 15.5h17M5.5 15.5v1.8M18.5 15.5v1.8M4.4 12.5h15.2" />
      <circle cx="7.6" cy="15.5" r="1.7" />
      <circle cx="16.4" cy="15.5" r="1.7" />
    </svg>
  );
}

export function TrainIcon({ className = '', size = 18 }: IconProps) {
  return (
    <svg {...svg(size, className)}>
      <rect x="5.5" y="3.5" width="13" height="13" rx="3" />
      <path d="M5.5 10.5h13M8.5 20.5l2-4M15.5 20.5l-2-4M4.5 20.5h15" />
      <circle cx="9.2" cy="13.6" r="0.9" />
      <circle cx="14.8" cy="13.6" r="0.9" />
    </svg>
  );
}

export function PlaneIcon({ className = '', size = 18 }: IconProps) {
  return (
    <svg {...svg(size, className)}>
      <path d="M3 13.2l18-6.4-3.1 12.4-4.6-3.7-2.9 3.1-.5-4.3z" />
      <path d="M10.4 14.3 21 6.8" />
    </svg>
  );
}

export function CalendarIcon({ className = '', size = 18 }: IconProps) {
  return (
    <svg {...svg(size, className)}>
      <rect x="3.5" y="5.5" width="17" height="15" rx="3" />
      <path d="M3.5 10.5h17M8.5 3.5v3M15.5 3.5v3" />
    </svg>
  );
}

export function PeopleIcon({ className = '', size = 18 }: IconProps) {
  return (
    <svg {...svg(size, className)}>
      <circle cx="9" cy="8.5" r="3.2" />
      <path d="M2.8 20c1-3.2 3.3-4.8 6.2-4.8s5.2 1.6 6.2 4.8" />
      <path d="M16 5.8a3.2 3.2 0 0 1 0 6.1M17.6 15.6c2.1.5 3.3 2 3.9 4.4" />
    </svg>
  );
}
