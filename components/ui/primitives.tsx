import Link from 'next/link';
import type { ComponentProps, CSSProperties, ReactNode } from 'react';

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
  style,
}: {
  children: ReactNode;
  className?: string;
  /** Adds the hover lift. Only for cards that are actually a link or a button. */
  interactive?: boolean;
  /** Used to set the per-destination --tone custom property. */
  style?: CSSProperties;
}) {
  return (
    <div
      style={style}
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
  'wt-ease inline-flex items-center justify-center gap-2 rounded-full font-semibold active:translate-y-px disabled:cursor-not-allowed disabled:opacity-40 disabled:active:translate-y-0';

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
  solid: 'bg-peri text-ink hover:bg-peri-d hover:shadow-[var(--shadow-card)]',
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
  /*
   * Three states, not two. Selected sits down slightly with an inset shadow so it reads as
   * pressed rather than merely coloured; unselected lifts on hover and both return to flat on
   * :active, so a click is confirmed by the control moving under the finger.
   */
  return (
    <button
      {...props}
      aria-pressed={on}
      className={`wt-ease shrink-0 rounded-full px-4 py-2 text-[0.8125rem] font-semibold active:translate-y-px ${
        on
          ? 'border border-peri-d bg-peri text-ink shadow-[inset_0_1px_3px_rgba(42,40,35,0.18)]'
          : 'border border-hairline bg-paper text-ink hover:-translate-y-px hover:border-peri-d hover:shadow-[var(--shadow-card)]'
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
  /** Already formatted. A node rather than a string, so the figure can animate when it changes. */
  amount: ReactNode;
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

export type PriceSourceKind = 'api' | 'operator' | 'authored';

const SOURCE_WORD: Record<PriceSourceKind, string> = {
  api: 'Live price',
  operator: 'Published rate',
  authored: 'Our estimate',
};

/*
 * Three markers, distinguishable by shape as well as colour, so the difference survives a
 * colour-blind reader and a greyscale screenshot:
 *
 *   api       solid sage disc      a provider answered
 *   operator  hollow sky ring      a published rate card
 *   authored  dotted butter ring   nobody checked
 *
 * Fill reads as "firmest", an outline as "less so", a dashed outline as "least". That ordering
 * is legible before any word is read, which is the point of making it a mark rather than a
 * sentence.
 */
const SOURCE_MARK: Record<PriceSourceKind, string> = {
  api: 'bg-sage border border-sage',
  operator: 'border-2 border-sky bg-transparent',
  authored: 'border-2 border-dotted border-butter bg-transparent',
};

/**
 * Where a figure came from, as a mark rather than a sentence.
 *
 * This used to print a line of prose on every costed row, which meant the interface explained
 * its own provenance three times a screen and read as though it were apologising. The claim is
 * now a dot; the detail arrives on hover or focus, where somebody who wants it can go and get
 * it and nobody else has to read past it.
 *
 * Keyboard reachable on purpose. A tooltip that only answers to a mouse hides the audit trail
 * from exactly the readers most likely to need it.
 */
export function SourceTag({
  source,
  detail,
  className = '',
}: {
  source: PriceSourceKind;
  /** "checked 3 days ago", "nps.gov". Shown only on hover or focus. */
  detail: string;
  className?: string;
}) {
  const word = SOURCE_WORD[source];

  return (
    <span className={`group/src relative inline-flex ${className}`}>
      <button
        type="button"
        aria-label={`${word}. ${detail}`}
        className="wt-ease flex h-5 w-5 items-center justify-center rounded-full hover:bg-[rgba(42,40,35,0.05)]"
      >
        <span className={`h-2.5 w-2.5 rounded-full ${SOURCE_MARK[source]}`} aria-hidden />
      </button>

      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-1.5 w-max max-w-[15rem] -translate-x-1/2 scale-95 rounded-[8px] border border-hairline bg-ink px-2.5 py-1.5 text-[0.75rem] leading-snug text-paper opacity-0 shadow-[var(--shadow-lift)] transition duration-200 ease-out group-hover/src:scale-100 group-hover/src:opacity-100 group-focus-within/src:scale-100 group-focus-within/src:opacity-100"
      >
        <span className="font-bold">{word}</span>
        <span className="block opacity-80">{detail}</span>
      </span>
    </span>
  );
}
