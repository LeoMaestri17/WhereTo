import Link from 'next/link';
import type { ComponentProps, ReactNode } from 'react';

/**
 * The cream kit.
 *
 * Small on purpose. The visual language here is artwork, whitespace and one accent, and a
 * component library would fight all three. Everything takes its colour from a token in
 * globals.css — there is no hex in this file.
 *
 * Peri is the action colour, so it is hard-wired into Button and nothing else uses it. Coral is
 * the total price, so it appears once, in `Total`, and is absent from every other component here.
 * That is the rule made structural rather than written down and hoped for.
 */

/** The page measure, with the 16px gutter the brief asks for at phone width. */
export const MEASURE = 'mx-auto w-full max-w-6xl px-4 sm:px-8';

/* ------------------------------------------------------------------ text */

export function Eyebrow({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return <p className={`type-eyebrow ${className}`}>{children}</p>;
}

/* ------------------------------------------------------------------ surfaces */

export function Card({
  children,
  className = '',
  interactive = false,
}: {
  children: ReactNode;
  className?: string;
  /** Adds the hover lift. Only for cards that are actually a link or a button. */
  interactive?: boolean;
}) {
  return (
    <div
      className={`rounded-[14px] border border-hairline bg-paper shadow-[var(--shadow-card)] ${
        interactive ? 'wt-ease wt-lift' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ actions */

const BUTTON_BASE =
  'wt-ease inline-flex items-center justify-center gap-2 rounded-full font-semibold disabled:cursor-not-allowed disabled:opacity-40';

const BUTTON_SIZE = {
  sm: 'px-4 py-2 text-[0.8125rem]',
  md: 'px-5 py-2.5 text-[0.875rem]',
  lg: 'px-7 py-3.5 text-[0.9375rem]',
} as const;

/*
 * Peri at full strength is a pale lavender: white text on it measures about 2.1:1, which is
 * unreadable, and ink on it measures 9.4:1. So the solid button is ink on peri rather than the
 * white-on-brand it would be in most systems. Hover goes to peri-d, where ink still clears 6:1.
 */
const BUTTON_VARIANT = {
  solid: 'bg-peri text-ink hover:bg-peri-d',
  outline: 'border border-hairline-strong bg-paper text-ink hover:border-peri-d hover:text-peri-d',
  quiet: 'text-ink hover:text-peri-d',
} as const;

export type ButtonVariant = keyof typeof BUTTON_VARIANT;
export type ButtonSize = keyof typeof BUTTON_SIZE;

export function Button({
  variant = 'solid',
  size = 'md',
  className = '',
  ...props
}: ComponentProps<'button'> & { variant?: ButtonVariant; size?: ButtonSize }) {
  return (
    <button
      {...props}
      className={`${BUTTON_BASE} ${BUTTON_SIZE[size]} ${BUTTON_VARIANT[variant]} ${className}`}
    />
  );
}

export function ButtonLink({
  variant = 'solid',
  size = 'md',
  className = '',
  ...props
}: ComponentProps<typeof Link> & { variant?: ButtonVariant; size?: ButtonSize }) {
  return (
    <Link
      {...props}
      className={`${BUTTON_BASE} ${BUTTON_SIZE[size]} ${BUTTON_VARIANT[variant]} ${className}`}
    />
  );
}

/**
 * A control-strip chip. Selected is peri; unselected is paper with a hairline.
 *
 * `aria-pressed` rather than a role of its own: these toggle a value in place and the page
 * repopulates underneath, which is exactly what a pressed toggle button means.
 */
export function Chip({
  on,
  className = '',
  ...props
}: ComponentProps<'button'> & { on: boolean }) {
  return (
    <button
      {...props}
      aria-pressed={on}
      className={`wt-ease shrink-0 rounded-full px-4 py-2 text-[0.8125rem] font-semibold ${
        on
          ? 'bg-peri text-ink'
          : 'border border-hairline bg-paper text-ink hover:border-peri-d hover:text-peri-d'
      } ${className}`}
    />
  );
}

/* ------------------------------------------------------------------ the total */

/**
 * The only coral in the product.
 *
 * If this component is not on screen, no coral should be either. Putting it in one place is what
 * stops the rule eroding one hover state at a time.
 */
export function Total({
  amount,
  caption,
  className = '',
}: {
  /** Already formatted. "$291". */
  amount: string;
  /** "a head, everything in" — the thing that stops a number being ambiguous. */
  caption?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <span className="type-total">{amount}</span>
      {caption ? <span className="type-secondary ml-2">{caption}</span> : null}
    </div>
  );
}

/* ------------------------------------------------------------------ provenance */

/**
 * How a figure got here, said in one short line.
 *
 * Three claims, three treatments. This is the product's whole argument rendered as a component,
 * so it is deliberately plain: a coloured dot, a word, and where it came from. An `authored`
 * number carries the loudest of the three because it is the one a reader most needs to discount.
 */
export function SourceTag({
  source,
  detail,
  className = '',
}: {
  source: 'api' | 'operator' | 'authored';
  /** "checked 3 days ago", "nps.gov", "not checked". */
  detail: string;
  className?: string;
}) {
  const dot = {
    api: 'bg-sage',
    operator: 'bg-sky',
    authored: 'bg-butter',
  }[source];

  const word = { api: 'Live price', operator: 'Published rate', authored: 'Our estimate' }[source];

  /* One line, always. Letting the detail wrap turned a provenance note into a three-line block
     on a phone and made the row look broken; the claim is the part that must always be legible,
     so the detail truncates behind it rather than pushing it around. The full string stays in
     the title attribute for anyone who wants it. */
  return (
    <span
      className={`flex items-center gap-1.5 text-[0.75rem] text-muted ${className}`}
      title={`${word} — ${detail}`}
    >
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${dot}`} aria-hidden />
      <span className="shrink-0 font-semibold">{word}</span>
      <span className="shrink-0" aria-hidden>
        ·
      </span>
      <span className="truncate">{detail}</span>
    </span>
  );
}
