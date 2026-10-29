'use client';

import { useMemo, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { Photo } from '@/components/ui/Photo';
import { Card, Eyebrow, MEASURE, SourceTag } from '@/components/ui/primitives';
import { useBrief } from '@/components/trip/ControlStrip';
import { DestinationPanel } from '@/components/trip/DestinationPanel';
import { DESTINATIONS, WINDOWS, windowById } from '@/lib/trip/catalogue';
import { money, quoteTrip, type TripQuote } from '@/lib/trip/quote';
import type { Destination } from '@/lib/trip/types';

/**
 * The discovery board.
 *
 * Photo-led cards across the catalogue, each showing one number where there is one and an honest
 * unpriced state where there is not. A destination with no price is a first-class citizen: it is
 * shown, it says why it has no figure, and it is never faked and never hidden.
 *
 * Ordering is by what it costs, cheapest first, with anything this group cannot reach pushed to
 * the end rather than removed — a blocked destination with a stated reason is more use than a
 * gap. There is no popularity signal anywhere in this product and there will not be one.
 */

interface Priced {
  dest: Destination;
  perPerson: number | null;
  /** The window the figure is for, when no weekend has been chosen. */
  windowLabel: string;
  source: 'api' | 'operator' | 'authored';
  reason: string;
  overBudget: boolean;
  /** The quote behind the card, so the panel opens on exactly the number that was clicked. */
  quote: TripQuote;
}

export function DiscoveryBoard() {
  const [brief] = useBrief();

  const priced = useMemo<Priced[]>(() => {
    const windows = brief.windowId ? [windowById(brief.windowId)!] : WINDOWS;

    return DESTINATIONS.map((dest) => {
      /* With no weekend chosen the board shows the cheapest of the warmed windows, which is the
         "from $340 each" the brief asks for, and names which weekend it is so the number is not
         floating free of a date. */
      const quotes = windows
        .map((w) => ({ w, q: quoteTrip(dest, w, brief.partySize, brief.driver) }))
        .filter(({ q }) => q.perPersonTotal !== null)
        .sort((a, b) => (a.q.perPersonTotal ?? 0) - (b.q.perPersonTotal ?? 0));

      if (quotes.length === 0) {
        const q = quoteTrip(dest, windows[0], brief.partySize, brief.driver);
        return {
          dest,
          perPerson: null,
          windowLabel: '',
          source: q.source,
          reason: q.verdict,
          overBudget: false,
          quote: q,
        };
      }

      const best = quotes[0];
      const total = best.q.perPersonTotal as number;
      return {
        dest,
        perPerson: total,
        windowLabel: brief.windowId ? best.w.label : `cheapest on ${best.w.label}`,
        source: best.q.source,
        reason: best.q.verdict,
        overBudget: brief.budgetPerPerson !== null && total > brief.budgetPerPerson,
        quote: best.q,
      };
    }).sort((a, b) => {
      if (a.perPerson === null) return 1;
      if (b.perPerson === null) return -1;
      return a.perPerson - b.perPerson;
    });
  }, [brief]);

  const [openSlug, setOpenSlug] = useState<string | null>(null);
  const open = priced.find((p) => p.dest.slug === openSlug) ?? null;

  const reachable = priced.filter((p) => p.perPerson !== null).length;

  return (
    <main className="min-h-dvh pb-24">
      <section className={`${MEASURE} pt-9 sm:pt-12`}>
        <Eyebrow>Travel · Beds · Car · Fuel</Eyebrow>
        <h1 className="type-hero mt-4 max-w-3xl">The whole trip, priced. Not just the flight.</h1>
        <p className="type-body-lg mt-4 max-w-xl">
          Every number came from somewhere and the page says where — including the surcharges that
          depend on your age and who is driving.
        </p>
      </section>

      <section className={`${MEASURE} mt-10`}>
        <div className="flex items-baseline justify-between gap-4">
          <Eyebrow>
            {reachable} of {priced.length} reachable for this group
          </Eyebrow>
          {/* Hidden on a phone, where it wraps to two lines to state something the order of the
              cards already makes obvious. */}
          <span className="type-body hidden shrink-0 text-muted sm:block">Cheapest first</span>
        </div>

        <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {priced.map((p) => (
            <BoardCard key={p.dest.slug} priced={p} onOpen={() => setOpenSlug(p.dest.slug)} />
          ))}
        </div>
      </section>

      {open ? (
        <DestinationPanel
          dest={open.dest}
          quote={open.quote}
          onClose={() => setOpenSlug(null)}
        />
      ) : null}
    </main>
  );
}

function BoardCard({ priced, onOpen }: { priced: Priced; onOpen: () => void }) {
  const { dest, perPerson, windowLabel, source, reason, overBudget } = priced;
  const blocked = perPerson === null;

  /* A button, not a link: this opens a panel over the board rather than navigating, so a real
     anchor would promise a page change that never happens. */
  return (
    <button type="button" onClick={onOpen} className="block w-full text-left focus-visible:outline-none">
      <Card interactive className="h-full overflow-hidden">
        <Photo
          src={dest.image}
          alt={dest.name}
          ratio="square"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          rounded={false}
          eager
        />

        <div className="flex flex-col gap-2.5 p-4">
          <div>
            <Eyebrow>{dest.eyebrow}</Eyebrow>
            <h2 className="type-title mt-1.5">{dest.name}</h2>
          </div>

          <p className="type-body line-clamp-2 text-muted">{dest.hook}</p>

          <div className="mt-1 border-t border-hairline pt-3">
            {blocked ? (
              <>
                <p className="text-[0.9375rem] font-bold text-muted">Not reachable</p>
                <p className="type-body mt-1 line-clamp-3 text-muted">{reason}</p>
              </>
            ) : (
              <>
                <div className="flex items-baseline justify-between gap-2">
                  <span className="type-figure text-[1.375rem]">
                    from {money(perPerson)}
                  </span>
                  <ArrowRight size={16} strokeWidth={2.5} className="shrink-0 text-muted" />
                </div>
                <p className="type-body mt-0.5 text-muted">each, {windowLabel}</p>
                {overBudget ? (
                  /* Marked, never hidden. */
                  <p className="mt-2 text-[0.75rem] font-bold text-coral">Over your budget</p>
                ) : null}
                <SourceTag
                  source={source}
                  detail={
                    source === 'api'
                      ? 'quoted for these dates'
                      : source === 'operator'
                        ? 'published rates'
                        : 'part estimate, see the breakdown'
                  }
                  className="mt-2"
                />
              </>
            )}
          </div>
        </div>
      </Card>
    </button>
  );
}
