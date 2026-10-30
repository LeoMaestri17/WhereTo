'use client';

import Image from 'next/image';
import type { ReactNode } from 'react';
import { WINDOWS } from '@/lib/trip/catalogue';
import { AGE_BAND_LABELS, PARTY_SIZES, type AgeBand, type Driver, type PartySize } from '@/lib/trip/types';

/**
 * The control strip's controls, as objects rather than pills.
 *
 * Five identical rounded rectangles is what every framework gives you for free, and it is the
 * least branded thing a product can put at the top of a page. Each of these takes the shape of
 * the thing it edits: the group is a stack of faces that physically grows, the driver is a
 * licence card, the dates are a strip you scrub, the budget is a track with a knob you drag.
 *
 * Each also owns one palette colour when active, which is how you can tell at a glance which of
 * the five you are in without reading any of them.
 */

/*
 * These reuse the palette on a different axis, and that is deliberate rather than a leak.
 *
 * A cost colour answers "what am I paying for"; a control tone answers "which of the five am I
 * in". They never appear in the same component, and a tone is a 22% tint against paper rather
 * than a fill, so the strip reads as five tinted objects and the money bar as four solid
 * segments. Destination cards tint themselves the same way.
 *
 * Worth knowing when changing one: people is peri, which in the cost system means Beds, and
 * budget is coral, which means what the trip costs. Neither is a claim about the control.
 */
export const CONTROL_TONE = {
  origin: 'var(--sky)',
  people: 'var(--peri)',
  driver: 'var(--sage)',
  dates: 'var(--butter)',
  budget: 'var(--coral)',
} as const;

/* ------------------------------------------------------------------ the strip objects */

/** Overlapping faces, one per traveller. The count is the picture, not a number beside one. */
export function PeopleGlyph({ count }: { count: number }) {
  return (
    <span className="flex items-center">
      {Array.from({ length: count }, (_, i) => (
        <Image
          key={i}
          src={`/assets/av${i + 1}.webp`}
          alt=""
          width={22}
          height={22}
          className="wt-ease h-[22px] w-[22px] rounded-full border-2 border-paper object-cover"
          style={{ marginLeft: i === 0 ? 0 : -8, zIndex: count - i }}
        />
      ))}
    </span>
  );
}

/** A licence card: a landscape rectangle with a photo block and two lines of detail. */
export function LicenceGlyph({ driver }: { driver: Driver }) {
  const none = !driver.hasLicence;
  return (
    <span
      className="wt-ease flex h-[22px] w-[32px] shrink-0 items-center gap-[3px] rounded-[4px] border px-[3px]"
      style={{
        borderColor: none ? 'var(--hairline-strong)' : 'var(--sage)',
        background: none ? 'transparent' : 'color-mix(in srgb, var(--sage) 28%, transparent)',
      }}
      aria-hidden
    >
      <span
        className="h-[13px] w-[10px] rounded-[2px]"
        style={{ background: none ? 'var(--faint)' : 'var(--sage)' }}
      />
      <span className="flex flex-col gap-[2px]">
        <span className="block h-[2px] w-[12px] rounded-full" style={{ background: 'var(--faint)' }} />
        <span className="block h-[2px] w-[8px] rounded-full" style={{ background: 'var(--faint)' }} />
      </span>
    </span>
  );
}

/** Four bars, one per warmed weekend, the chosen one filled. */
export function DatesGlyph({ windowId }: { windowId: string | null }) {
  return (
    <span className="flex items-end gap-[3px]" aria-hidden>
      {WINDOWS.map((w) => {
        const on = windowId === w.id;
        return (
          <span
            key={w.id}
            className="wt-ease block w-[4px] rounded-full"
            style={{
              height: on ? 18 : 11,
              background: on ? 'var(--butter)' : 'var(--hairline-strong)',
            }}
          />
        );
      })}
    </span>
  );
}

/** A track with a knob, positioned where the budget sits in its range. */
export function BudgetGlyph({ value, min, max }: { value: number | null; min: number; max: number }) {
  const pct = value === null ? 1 : Math.min(1, Math.max(0, (value - min) / (max - min)));
  return (
    <span className="relative flex h-[22px] w-[34px] items-center" aria-hidden>
      <span className="block h-[3px] w-full rounded-full" style={{ background: 'var(--hairline-strong)' }} />
      <span
        className="wt-ease absolute block h-[3px] rounded-full"
        style={{ width: `${pct * 100}%`, background: value === null ? 'transparent' : 'var(--coral)' }}
      />
      <span
        className="wt-ease absolute block h-[11px] w-[11px] rounded-full border-2 border-paper"
        style={{
          left: `calc(${pct * 100}% - 5px)`,
          background: value === null ? 'var(--faint)' : 'var(--coral)',
        }}
      />
    </span>
  );
}

/** A map square with a pin where the city is. */
export function OriginGlyph() {
  return (
    <span
      className="relative flex h-[22px] w-[22px] shrink-0 items-center justify-center overflow-hidden rounded-[5px]"
      style={{ background: 'color-mix(in srgb, var(--sky) 35%, var(--paper))' }}
      aria-hidden
    >
      <svg viewBox="0 0 22 22" className="absolute inset-0 h-full w-full">
        <path d="M0 15 L7 12 L13 16 L22 11 L22 22 L0 22 Z" fill="var(--sage)" opacity="0.45" />
        <path d="M0 8 L6 6 L11 9 L22 4" stroke="var(--sky)" strokeWidth="1.5" fill="none" opacity="0.7" />
      </svg>
      <span className="relative h-[7px] w-[7px] rounded-full border-2 border-paper" style={{ background: 'var(--coral)' }} />
    </span>
  );
}

/* ------------------------------------------------------------------ the editors */

export function PeopleEditor({
  value,
  onChange,
}: {
  value: PartySize;
  onChange: (n: PartySize) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {PARTY_SIZES.map((n) => {
        const on = value === n;
        return (
          <button
            key={n}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(n as PartySize)}
            className="wt-ease flex flex-col items-center gap-1.5 rounded-[12px] border p-2 active:translate-y-px"
            style={{
              borderColor: on ? 'var(--peri-d)' : 'var(--hairline)',
              background: on ? 'color-mix(in srgb, var(--peri) 22%, var(--paper))' : 'var(--paper)',
            }}
          >
            <PeopleGlyph count={n} />
            <span className="text-[0.75rem] font-bold">{n}</span>
          </button>
        );
      })}
    </div>
  );
}

const LICENCE_OPTIONS: { key: string; label: string; driver: Driver }[] = [
  { key: 'none', label: 'No licence', driver: { hasLicence: false, ageBand: null } },
  ...(Object.keys(AGE_BAND_LABELS) as AgeBand[]).map((band) => ({
    key: band,
    label: AGE_BAND_LABELS[band],
    driver: { hasLicence: true, ageBand: band } as Driver,
  })),
];

export function DriverEditor({
  value,
  onChange,
}: {
  value: Driver;
  onChange: (d: Driver) => void;
}) {
  const current = value.hasLicence ? (value.ageBand ?? 'none') : 'none';
  return (
    <div className="flex flex-wrap items-stretch gap-2">
      {LICENCE_OPTIONS.map((opt) => {
        const on = current === opt.key;
        return (
          <button
            key={opt.key}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(opt.driver)}
            /* A licence card, not a pill: landscape, a photo block, a signature strip. */
            className="wt-ease flex w-[108px] flex-col gap-2 rounded-[8px] border p-2.5 text-left active:translate-y-px"
            style={{
              borderColor: on ? 'var(--sage)' : 'var(--hairline)',
              background: on ? 'color-mix(in srgb, var(--sage) 20%, var(--paper))' : 'var(--paper)',
            }}
          >
            <span className="flex items-center gap-2">
              <span
                className="h-6 w-5 shrink-0 rounded-[3px]"
                style={{ background: on ? 'var(--sage)' : 'var(--hairline-strong)' }}
              />
              <span className="flex flex-1 flex-col gap-1">
                <span className="block h-[3px] rounded-full" style={{ background: 'var(--hairline-strong)' }} />
                <span className="block h-[3px] w-2/3 rounded-full" style={{ background: 'var(--hairline-strong)' }} />
              </span>
            </span>
            <span className="text-[0.75rem] font-bold leading-tight">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export function DatesEditor({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (id: string | null) => void;
}) {
  /* A strip you scrub along rather than a list you pick from: the weekends are in order, and the
     order is the information. */
  return (
    <div className="wt-rail flex items-stretch gap-1 overflow-x-auto">
      <ScrubCell on={value === null} tone="var(--butter)" onClick={() => onChange(null)}>
        <span className="text-[0.75rem] font-bold">Any</span>
      </ScrubCell>
      {WINDOWS.map((w) => (
        <ScrubCell key={w.id} on={value === w.id} tone="var(--butter)" onClick={() => onChange(w.id)}>
          <span className="text-[0.75rem] font-bold">{w.label.split(' ')[0]}</span>
          <span className="mt-0.5 text-[0.625rem] font-semibold text-muted">
            {w.label.split(' ').slice(1).join(' ')}
          </span>
        </ScrubCell>
      ))}
    </div>
  );
}

function ScrubCell({
  on,
  tone,
  onClick,
  children,
}: {
  on: boolean;
  tone: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className="wt-ease flex min-w-[64px] flex-col items-center justify-center rounded-[8px] border px-3 py-2 active:translate-y-px"
      style={{
        borderColor: on ? tone : 'var(--hairline)',
        background: on ? `color-mix(in srgb, ${tone} 30%, var(--paper))` : 'var(--paper)',
      }}
    >
      {children}
    </button>
  );
}

export const BUDGET_MIN = 80;
export const BUDGET_MAX = 400;

export function BudgetEditor({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (v: number | null) => void;
}) {
  const current = value ?? BUDGET_MAX;
  return (
    <div className="flex w-full max-w-sm flex-col gap-2.5">
      <div className="flex items-baseline justify-between gap-3">
        <span className="type-figure text-[1.25rem]" style={{ color: 'var(--coral)' }}>
          {value === null ? 'No budget' : `$${value}`}
        </span>
        {value !== null ? (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="wt-ease text-[0.8125rem] font-semibold text-muted hover:text-ink"
          >
            Clear
          </button>
        ) : null}
      </div>
      {/* A real slider you drag, with the value moving as you do. */}
      <input
        type="range"
        min={BUDGET_MIN}
        max={BUDGET_MAX}
        step={10}
        value={current}
        aria-label="Budget per person"
        onChange={(e) => onChange(Number(e.target.value))}
        className="wt-slider w-full"
      />
      <div className="flex justify-between text-[0.75rem] text-muted">
        <span>${BUDGET_MIN}</span>
        <span>${BUDGET_MAX}+</span>
      </div>
    </div>
  );
}
