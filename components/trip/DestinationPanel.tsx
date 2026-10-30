'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { X, ArrowRight } from 'lucide-react';
import { DestinationPhotoFrame, GradientPlaceholder } from '@/components/ui/Photo';
import { Label, SourceTag } from '@/components/ui/primitives';
import { Facts, Named, PlaceTag } from '@/components/trip/facts';
import { MoneyBar, partsFromQuote } from '@/components/trip/MoneyBar';
import { money, type TripQuote } from '@/lib/trip/quote';
import type { Destination } from '@/lib/trip/types';

/**
 * The destination panel.
 *
 * It slides over the board and never navigates, because the thing someone is doing here is
 * comparing — and a page change throws away the board they were comparing against. Closing
 * returns them to exactly the scroll position and the exact set of cards they left.
 *
 * One primary action out, "Build this trip". Everything else on the panel is there to answer
 * "is this the one?" rather than to be clicked.
 */

const PANEL_SOURCE: Record<'api' | 'operator' | 'authored', string> = {
  api: 'Quoted for these dates',
  operator: 'Published rates, checked on the dates shown',
  authored: 'Part estimate, not yet quoted',
};

export function DestinationPanel({
  dest,
  quote,
  onClose,
}: {
  dest: Destination;
  quote: TripQuote;
  onClose: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  /* Escape closes, and the board behind must not scroll while the panel is over it — otherwise
     closing returns you somewhere you never scrolled to. */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    panelRef.current?.focus();
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);


  /* Facts from the costed data rather than adjectives. When generate-content has run these are
     replaced by its tags; until then an honest derived label beats an empty row or an invented
     one. */
  const tags = derivedTags(dest, quote);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* The board stays visible behind the scrim — that is the whole reason this is a panel
          rather than a page. */}
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-[rgba(42,40,35,0.32)]"
      />

      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={dest.name}
        className="relative flex h-full w-full max-w-xl flex-col overflow-y-auto bg-ground shadow-[var(--shadow-lift)] focus:outline-none"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-hairline bg-ground/95 px-5 py-3.5 backdrop-blur">
          <PlaceTag region={dest.region} miles={dest.drive.miles} />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="wt-ease rounded-full border border-hairline bg-paper p-1.5 hover:border-peri-d"
          >
            <X size={16} strokeWidth={2.4} />
          </button>
        </div>

        <div className="px-5 pb-8 pt-5">
          <DestinationPhotoFrame
            photo={dest.photo}
            fallbackSrc={dest.image}
            name={dest.name}
            ratio="wide"
            sizes="(max-width: 640px) 100vw, 576px"
            eager
            credit="line"
          />

          <h2 className="type-display mt-5 flex items-center gap-2.5">
            <span
              className="h-3 w-3 shrink-0 rounded-full"
              style={{ background: `var(--${dest.tone})` }}
              aria-hidden
            />
            {dest.name}
          </h2>

          {/* The vibe line. `content` is written at build time by generate-content; until it has
              run the researched season note says the same kind of thing and is sourced. */}
          <p className="type-body-lg mt-3">{dest.content?.vibe ?? dest.whySeason}</p>

          {tags.length > 0 ? (
            <ul className="mt-4 flex flex-wrap gap-2">
              {(dest.content?.bestFor ?? tags).map((tag) => (
                <li
                  key={tag}
                  className="rounded-full border border-hairline bg-paper px-3 py-1.5 text-[0.75rem] font-semibold"
                >
                  {tag}
                </li>
              ))}
            </ul>
          ) : null}

          {/* ------------------------------------------------ where the money goes */}
          <div className="mt-7">
            <Label>Where the money goes</Label>

            {quote.perPersonTotal === null ? (
              <p className="type-body mt-3">{quote.verdict}</p>
            ) : (
              <>
                <MoneyBar parts={partsFromQuote(quote)} size="full" className="mt-3" />
                <div className="mt-4 flex items-baseline justify-between gap-3 border-t border-hairline pt-3.5">
                  <span className="text-[0.9375rem] font-bold">Per person</span>
                  <span className="type-figure text-[1.25rem]">{money(quote.perPersonTotal)}</span>
                </div>
                <SourceTag
                  source={quote.source}
                  detail={PANEL_SOURCE[quote.source]}
                  className="mt-2"
                />
              </>
            )}
          </div>

          {/* ------------------------------------------------ what you actually go for */}
          <div className="mt-8">
            <Label>What people go for</Label>
            <ul className="mt-3.5 flex flex-col gap-3.5">
              {dest.itinerary.map((item) => (
                <li key={item.title} className="flex gap-3.5">
                  {/* No photography for individual sights, so each gets the deterministic
                      gradient rather than a stock image that is not of the thing. */}
                  <GradientPlaceholder
                    label=""
                    ratio="square"
                    className="h-16 w-16 shrink-0 rounded-[10px]"
                  />
                  <div className="min-w-0">
                    <p className="text-[0.9375rem] font-bold">{item.title}</p>
                    
                    <Facts className="mt-1">
                      <Named quiet>{item.cost}</Named>
                      <Named quiet>{item.timeNeeded}</Named>
                    </Facts>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* One way forward, pinned so it is reachable without scrolling back. */}
        <div className="sticky bottom-0 border-t border-hairline bg-ground/95 px-5 py-3.5 backdrop-blur">
          <Link
            href={`/trip/${dest.slug}`}
            className="wt-ease flex w-full items-center justify-center gap-2 rounded-full bg-ink px-6 py-3.5 text-[0.9375rem] font-semibold text-paper hover:bg-ink-hover"
          >
            Build this trip
            <ArrowRight size={17} strokeWidth={2.5} />
          </Link>
        </div>
      </div>
    </div>
  );
}

/**
 * Tags derived from the costed data, not adjectives.
 *
 * Each one is checkable against the record it came from, which is the only kind of label this
 * product has any business showing.
 */
function derivedTags(dest: Destination, quote: TripQuote): string[] {
  const tags: string[] = [];
  if (dest.transit) tags.push('no car needed');
  if (!dest.transit) tags.push('needs a driver');
  if (dest.drive.hoursEachWay <= 3) tags.push('under 3 hours out');
  if (dest.drive.hoursEachWay >= 6) tags.push('a long haul');
  if (quote.perPersonTotal !== null && quote.perPersonTotal < 150) tags.push('cheapest weekend');
  if (dest.fees.some((f) => f.amount >= 100)) tags.push('non-resident surcharge');
  return tags;
}
