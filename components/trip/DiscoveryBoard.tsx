'use client';

import { useMemo, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { AnimatedMoney } from '@/components/ui/AnimatedMoney';
import { DestinationPhotoFrame } from '@/components/ui/Photo';
import { Card, Eyebrow, MEASURE, SourceTag } from '@/components/ui/primitives';
import { useBrief } from '@/components/trip/ControlStrip';
import { DestinationPanel } from '@/components/trip/DestinationPanel';
import { describeWindow } from '@/lib/trip/brief';
import { DESTINATIONS, ORIGIN, WINDOWS, windowById } from '@/lib/trip/catalogue';
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

const SOURCE_DETAIL: Record<'api' | 'operator' | 'authored', string> = {
  api: 'Quoted for these dates',
  operator: 'Published rates, checked on the dates shown',
  authored: 'Part estimate, not yet quoted',
};

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
  const [showBlocked, setShowBlocked] = useState(false);
  const open = priced.find((p) => p.dest.slug === openSlug) ?? null;

  const reachable = priced.filter((p) => p.perPerson !== null);

  const range = reachable.length
    ? {
        low: Math.min(...reachable.map((p) => p.perPerson as number)),
        high: Math.max(...reachable.map((p) => p.perPerson as number)),
      }
    : null;
  const blocked = priced.filter((p) => p.perPerson === null);
  const shown = showBlocked ? [...reachable, ...blocked] : reachable;

  return (
    <main className="min-h-dvh pb-24">
      {/* A status line, not a pitch: it reports the state of your own search and changes when
          you change a chip. The board starts inside the first screenful. */}
      <section className={`${MEASURE} pt-5`}>
        <p className="type-secondary flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="font-bold text-ink">{DESTINATIONS.length} places</span>
          <span aria-hidden>·</span>
          <span>from {ORIGIN.city}</span>
          <span aria-hidden>·</span>
          <span>{describeWindow(brief.windowId)}</span>
          {range ? (
            <>
              <span aria-hidden>·</span>
              <span className="font-bold text-ink">
                {money(range.low)} to {money(range.high)} a head
              </span>
            </>
          ) : null}
        </p>
      </section>

      <section className={`${MEASURE} mt-5`}>
        {/* The first two run wide. Twenty identical rectangles is a grid, not a board. */}
        <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {shown.map((p, i) => (
            <div key={p.dest.slug} className={i < 2 ? 'sm:col-span-2 lg:col-span-2' : ''}>
              <BoardCard
                priced={p}
                featured={i < 2}
                onOpen={() => setOpenSlug(p.dest.slug)}
              />
            </div>
          ))}
        </div>

        {blocked.length > 0 ? (
          <button
            type="button"
            onClick={() => setShowBlocked(!showBlocked)}
            className="wt-ease mt-6 rounded-full border border-hairline bg-paper px-4 py-2 text-[0.8125rem] font-semibold hover:border-peri-d hover:text-peri-d"
          >
            {showBlocked
              ? 'Hide the ones needing a driver'
              : `${blocked.length} more need a driver`}
          </button>
        ) : null}
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

function BoardCard({
  priced,
  onOpen,
  featured = false,
}: {
  priced: Priced;
  onOpen: () => void;
  featured?: boolean;
}) {
  const { dest, perPerson, windowLabel, source, overBudget } = priced;
  const blocked = perPerson === null;

  /*
   * A stretched link rather than a card-sized button.
   *
   * Wrapping the whole card in a <button> put the source marker's own button inside it, which is
   * invalid HTML and failed hydration outright. So the only interactive element is the heading,
   * and its ::after covers the card to make the whole thing clickable. The accessible name is
   * then the destination rather than the card's entire text content, which is also the better
   * screen-reader result.
   *
   * It is a button, not a link: this opens a panel over the board, and an anchor would promise a
   * page change that never happens.
   */
  return (
    <Card
      interactive
      className="wt-card relative h-full overflow-hidden"
      style={{ ['--tone' as string]: `var(--${dest.tone})` }}
    >
      <div className="relative overflow-hidden">
        <div className="wt-media">
          <DestinationPhotoFrame
            photo={dest.photo}
            fallbackSrc={dest.image}
            name={dest.name}
            ratio={featured ? 'wide' : 'square'}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            rounded={false}
            eager
          />
        </div>
        {/* The destination's own colour, rising on hover. */}
        <div className="wt-wash pointer-events-none absolute inset-0" aria-hidden />
      </div>

      <div className="flex flex-col gap-2.5 p-4">
        <div>
          <span className="flex items-center gap-2">
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ background: `var(--${dest.tone})` }}
              aria-hidden
            />
            <Eyebrow>{dest.eyebrow}</Eyebrow>
          </span>
          <h2 className="type-title mt-1.5">
            <button
              type="button"
              onClick={onOpen}
              className="text-left after:absolute after:inset-0 after:rounded-[14px] after:content-[''] focus-visible:after:outline focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-peri-d focus-visible:outline-none"
            >
              {dest.name}
            </button>
          </h2>
        </div>

        <p className="type-body text-muted">{dest.hook}</p>

        <div className="mt-1 border-t border-hairline pt-3">
          {blocked ? (
            <p className="text-[0.9375rem] font-bold text-muted">Needs a driver</p>
          ) : (
            <>
              <div className="flex items-baseline justify-between gap-2">
                <span className="wt-price type-figure inline-flex items-baseline gap-1 text-[1.375rem]">
                  <span className="text-[0.8125rem] font-semibold text-muted">from</span>
                  <AnimatedMoney value={perPerson} />
                </span>
                <ArrowRight size={16} strokeWidth={2.5} className="shrink-0 text-muted" />
              </div>
              <p className="type-body mt-0.5 text-muted">each, {windowLabel}</p>
              {overBudget ? (
                <p className="mt-2 text-[0.75rem] font-bold text-coral">Over your budget</p>
              ) : null}
              {/* Above the stretched link, so the marker stays reachable. */}
              <SourceTag
                source={source}
                detail={SOURCE_DETAIL[source]}
                className="relative z-10 mt-2"
              />
            </>
          )}
        </div>
      </div>
    </Card>
  );
}
