import type { ReactNode } from 'react';
import { describeDriver } from '@/lib/trip/brief';
import type { Driver, PartySize } from '@/lib/trip/types';

/**
 * The small lines of fact that sit under a heading.
 *
 * These were all one pattern — the values joined with a middle dot into a grey sentence,
 * `Thanksgiving · 4 nights · 3 people · driver 21 to 24` — in seven places. Two problems with
 * that. It is template chrome that turns up on any subject whatsoever, and worse for this
 * product, it flattens a figure, its unit and a qualifier into undifferentiated prose. The one
 * thing this app is for is making a number legible enough to argue with, and a number loses that
 * the moment it is set in the same weight as the word next to it.
 *
 * So a fact here is a quantity and its unit, the quantity in the same tabular face the prices
 * use. The eye can pick the figures out of the line without reading it, which is the whole point.
 * Separation is space, because space is free and a glyph has to be earned.
 */

export function Facts({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <ul className={`flex flex-wrap items-baseline gap-x-5 gap-y-1 ${className}`}>{children}</ul>
  );
}

/** A figure and what it counts: "4 nights". The figure gets the price face. */
export function Quantity({ value, unit }: { value: number; unit: string }) {
  return (
    <li className="text-[0.9375rem]">
      <span className="type-figure">{value}</span>
      <span className="ml-1 text-muted">{unit}</span>
    </li>
  );
}

/** A named value with nothing to count: "Thanksgiving", "driver 21 to 24". */
export function Named({ children, quiet = false }: { children: ReactNode; quiet?: boolean }) {
  return (
    <li className={`text-[0.9375rem] ${quiet ? 'text-muted' : 'font-semibold'}`}>{children}</li>
  );
}

/**
 * The brief, as facts: when, how long, how many, who can drive.
 *
 * One component rather than the same four values assembled by hand on the build canvas and again
 * on the summary, which is how the two pages came to word the same trip differently.
 */
export function TripFacts({
  windowLabel,
  nights,
  partySize,
  driver,
  note,
  className = '',
}: {
  windowLabel: string;
  nights: number;
  partySize: PartySize;
  driver: Driver;
  /** "cheapest of the warmed weekends", when no dates are set. */
  note?: string | null;
  className?: string;
}) {
  return (
    <Facts className={className}>
      <Named>{windowLabel}</Named>
      <Quantity value={nights} unit={nights === 1 ? 'night' : 'nights'} />
      <Quantity value={partySize} unit={partySize === 1 ? 'person' : 'people'} />
      <Named quiet>{describeDriver(driver)}</Named>
      {note ? <Named quiet>{note}</Named> : null}
    </Facts>
  );
}

/**
 * Where a place is and how far away: "Southern Utah", "430 miles".
 *
 * This replaces a stored `eyebrow` string on every destination that read "Utah · 430 miles".
 * Both halves were already in the record as `region` and `drive.miles`, so the field was a
 * third copy of them — and it had already drifted, carrying "Utah" where the region said
 * "Southern Utah" and "California" where it said "Bay Area". Deriving it means the tag cannot
 * disagree with the record it describes.
 */
export function PlaceTag({
  region,
  miles,
  onPhoto = false,
  className = '',
}: {
  region: string;
  miles: number;
  /** Over a photograph, where the palette's muted grey has nothing to recede against. */
  onPhoto?: boolean;
  className?: string;
}) {
  return (
    <span
      className={`flex flex-wrap items-baseline gap-x-3 text-[0.8125rem] ${className}`}
      style={onPhoto ? { color: 'rgba(255,253,248,0.92)' } : undefined}
    >
      <span className="font-semibold">{region}</span>
      <span className={onPhoto ? 'opacity-80' : 'text-muted'}>
        <span className="type-figure font-semibold">{miles}</span> miles
      </span>
    </span>
  );
}
