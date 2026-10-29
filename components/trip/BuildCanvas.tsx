'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, ChevronDown, ChevronLeft, TriangleAlert } from 'lucide-react';
import { AnimatedMoney } from '@/components/ui/AnimatedMoney';
import { DestinationPhotoFrame } from '@/components/ui/Photo';
import { Button, Card, Eyebrow, MEASURE, SourceTag, Total } from '@/components/ui/primitives';
import { useBrief } from '@/components/trip/ControlStrip';
import { describeDriver } from '@/lib/trip/brief';
import { DESTINATIONS_BY_SLUG, WINDOWS } from '@/lib/trip/catalogue';
import {
  money,
  optionsFor,
  perPerson,
  quoteTrip,
  type RowOption,
  type TripChoices,
  type TripRow,
} from '@/lib/trip/quote';
import type { PriceSource } from '@/lib/trip/types';

/**
 * The build canvas, in two modes.
 *
 * ASSEMBLED is the default: three rows and a total, already filled in, before anyone touches a
 * control. A planner that opens on a blank form has handed the work back to the person who came
 * here to avoid it.
 *
 * FOCUSED is what the product was missing. Choosing is the core verb of a configurator and it
 * did not exist anywhere in the interface: the old Change expanded into a paragraph explaining
 * why there were no alternatives. Clicking a row now gives that one component the whole width
 * and puts its real options side by side, each with the trade-off that actually decides it, with
 * the running total pinned and moving as you compare. Picking one collapses back.
 *
 * Who is going and when comes from the control strip, never from this screen.
 */

const ROW_ICON: Record<string, string> = {
  drive: '/assets/icon-fuel.webp',
  plane: '/assets/icon-plane.webp',
  train: '/assets/icon-ticket.webp',
  coach: '/assets/icon-ticket.webp',
  stay: '/assets/icon-bed.webp',
  car: '/assets/icon-car.webp',
};

const FOCUS_TITLE: Record<TripRow['kind'], string> = {
  travel: 'Getting there',
  stay: 'Where you sleep',
  car: 'The car',
};

export function BuildCanvas({ slug }: { slug: string }) {
  const dest = DESTINATIONS_BY_SLUG[slug];
  const [brief] = useBrief();

  const [choices, setChoices] = useState<TripChoices>({});
  const [focus, setFocus] = useState<TripRow['kind'] | null>(null);
  /** What the total would become if you took the option under the cursor. */
  const [preview, setPreview] = useState<TripChoices | null>(null);

  const { partySize, driver } = brief;

  /* With no weekend chosen in the strip, the canvas costs the cheapest warmed one and says so,
     rather than defaulting to the first and quietly showing a worse number. */
  const window = useMemo(() => {
    if (brief.windowId) return WINDOWS.find((w) => w.id === brief.windowId) ?? WINDOWS[0];
    const ranked = WINDOWS.map((w) => ({ w, q: quoteTrip(dest, w, partySize, driver) }))
      .filter(({ q }) => q.perPersonTotal !== null)
      .sort((a, b) => (a.q.perPersonTotal ?? 0) - (b.q.perPersonTotal ?? 0));
    return ranked[0]?.w ?? WINDOWS[0];
  }, [brief.windowId, dest, partySize, driver]);

  const quote = useMemo(
    () => quoteTrip(dest, window, partySize, driver, choices),
    [dest, window, partySize, driver, choices],
  );

  const previewQuote = useMemo(
    () => (preview ? quoteTrip(dest, window, partySize, driver, preview) : null),
    [preview, dest, window, partySize, driver],
  );

  const travel = quote.rows[0];

  const travelIcon =
    dest.transit && travel.title === dest.transit.label
      ? ROW_ICON[dest.transit.mode]
      : ROW_ICON.drive;

  const iconFor = (kind: TripRow['kind']) =>
    kind === 'travel' ? travelIcon : kind === 'stay' ? ROW_ICON.stay : ROW_ICON.car;

  const options = useMemo(
    () => (focus ? optionsFor(focus, dest, window, partySize, driver, choices) : []),
    [focus, dest, window, partySize, driver, choices],
  );

  const choiceFor = (kind: TripRow['kind'], option: RowOption): TripChoices =>
    kind === 'travel'
      ? { ...choices, travel: option.id as 'drive' | 'transit' }
      : kind === 'stay'
        ? { ...choices, stayIndex: option.id === 'seeded' ? null : Number(option.id) }
        : choices;

  return (
    <main className="min-h-dvh pb-32">
      <div className={`${MEASURE} pt-6`}>
        <Link
          href="/"
          className="wt-ease inline-flex items-center gap-2 text-[0.875rem] font-semibold hover:text-peri-d"
        >
          <ArrowLeft size={16} strokeWidth={2.5} />
          All trips
        </Link>
      </div>

      <section className={`${MEASURE} pt-5`}>
        <div className="grid gap-6 sm:grid-cols-[minmax(0,1fr)_280px] sm:items-end">
          <div>
            <span className="flex items-center gap-2.5">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ background: `var(--${dest.tone})` }}
                aria-hidden
              />
              <Eyebrow>{dest.eyebrow}</Eyebrow>
            </span>
            <h1 className="type-display mt-2.5">{dest.name}</h1>
            <p className="type-body mt-3 max-w-xl text-muted">{dest.hook}</p>
          </div>
          <DestinationPhotoFrame
            photo={dest.photo}
            fallbackSrc={dest.image}
            name={dest.name}
            ratio="wide"
            sizes="(max-width: 640px) 100vw, 280px"
            eager
          />
        </div>
      </section>

      <section className={`${MEASURE} mt-7`}>
        <p className="type-secondary">
          {window.label} · {window.nights} nights · {partySize}{' '}
          {partySize === 1 ? 'person' : 'people'} · {describeDriver(driver)}
          {brief.windowId === null ? ' · cheapest of the warmed weekends' : ''}
        </p>
      </section>

      {!quote.reachable ? (
        <section className={`${MEASURE} mt-5`}>
          <div className="flex items-start gap-3 rounded-[14px] border border-hairline-strong bg-paper p-4 sm:p-5">
            <TriangleAlert size={18} className="mt-0.5 shrink-0 text-coral" strokeWidth={2.2} />
            <p className="text-[0.9375rem] font-bold">Not reachable without a car</p>
          </div>
        </section>
      ) : null}

      {/* ---------------------------------------------------------- the rows */}
      <section className={`${MEASURE} mt-5`}>
        {focus === null ? (
          <Card className="divide-y divide-hairline overflow-hidden">
            {quote.rows.map((row) => (
              <AssembledRow
                key={row.kind}
                row={row}
                icon={iconFor(row.kind)}
                onFocus={() => setFocus(row.kind)}
                canChoose={
                  row.available &&
                  optionsFor(row.kind, dest, window, partySize, driver, choices).length > 0
                }
              />
            ))}
          </Card>
        ) : (
          <FocusedRow
            kind={focus}
            icon={iconFor(focus)}
            options={options}
            onBack={() => {
              setFocus(null);
              setPreview(null);
            }}
            onPreview={(option) => setPreview(option ? choiceFor(focus, option) : null)}
            onPick={(option) => {
              setChoices(choiceFor(focus, option));
              setFocus(null);
              setPreview(null);
            }}
          />
        )}
      </section>

      {/* ---------------------------------------------------------- entry and fees */}
      {focus === null && quote.fees.lines.length > 0 ? (
        <section className={`${MEASURE} mt-5`}>
          <Card className="p-4 sm:p-5">
            <div className="flex items-center gap-2.5">
              <Image
                src="/assets/icon-ticket.webp"
                alt=""
                width={28}
                height={28}
                className="h-7 w-7 object-contain"
              />
              <Eyebrow>Entry and fees</Eyebrow>
            </div>
            <ul className="mt-3.5 flex flex-col gap-3">
              {quote.fees.lines.map((line) => (
                <li key={line.label} className="flex items-baseline justify-between gap-4">
                  <span className="flex min-w-0 items-center gap-1.5">
                    <span className="text-[0.9375rem] font-semibold">{line.label}</span>
                    <SourceTag
                      source={line.source}
                      detail={`${line.provider} · ${hostOf(line.url)}`}
                    />
                  </span>
                  <span className="type-figure shrink-0 text-[1rem]">
                    {money(perPerson(line, partySize, window.nights))}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        </section>
      ) : null}

      {/* ---------------------------------------------------------- the total */}
      {focus === null ? (
        <>
          <section className={`${MEASURE} mt-5`}>
            <Card className="p-5 sm:p-7">
              <Eyebrow>
                {window.label} · {partySize} {partySize === 1 ? 'person' : 'people'}
              </Eyebrow>

              {quote.perPersonTotal === null ? (
                <p className="mt-3 text-[0.9375rem] font-bold">Not reachable</p>
              ) : (
                <>
                  <div className="mt-3 flex items-center gap-2">
                    <Total
                      amount={<AnimatedMoney value={quote.perPersonTotal} />}
                      caption="a head, everything in"
                    />
                    <SourceTag source={quote.source} detail={sourceDetail(quote.source)} />
                  </div>
                  <p className="type-secondary mt-2">
                    {money(quote.partyTotal ?? 0)} for {partySize} of you, in {quote.rooms}{' '}
                    {quote.rooms === 1 ? 'room' : 'rooms'}
                  </p>
                </>
              )}
            </Card>
          </section>

          {quote.reachable ? (
            <section className={`${MEASURE} mt-5`}>
              <Link
                href={`/trip/${dest.slug}/summary`}
                className="wt-ease flex w-full items-center justify-center gap-2 rounded-full bg-peri px-6 py-3.5 text-[0.9375rem] font-semibold text-ink hover:bg-peri-d active:translate-y-px"
              >
                This looks right
                <ArrowRight size={17} strokeWidth={2.5} />
              </Link>
            </section>
          ) : null}

          {/* ------------------------------------------------ secondary, collapsed */}
          {dest.itinerary.length > 0 ? (
          <section className={`${MEASURE} mt-5`}>
            <details className="group rounded-[14px] border border-hairline bg-paper">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-4 sm:p-5">
                <div>
                  <p className="text-[0.9375rem] font-bold">Things to do</p>
                  <p className="type-body mt-0.5 text-muted">{dest.itinerary.length} ideas</p>
                </div>
                <ChevronDown
                  size={18}
                  className="wt-ease shrink-0 text-muted group-open:rotate-180"
                  strokeWidth={2.2}
                />
              </summary>
              <ul className="divide-y divide-hairline border-t border-hairline">
                {dest.itinerary.map((item) => (
                  <li key={item.title} className="p-4 sm:p-5">
                    <Eyebrow>{item.eyebrow}</Eyebrow>
                    <p className="mt-1.5 text-[0.9375rem] font-bold">{item.title}</p>
                    <p className="type-body mt-1.5 text-muted">{item.what}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[0.8125rem]">
                      <span className="font-semibold">{item.cost}</span>
                      <span className="text-muted">{item.timeNeeded}</span>
                      {item.needsCar ? <span className="text-muted">Needs a car</span> : null}
                    </div>
                    <p className="type-body mt-2.5 text-muted">{item.catch}</p>
                  </li>
                ))}
              </ul>
            </details>
          </section>
          ) : null}
        </>
      ) : null}

      {/* The total stays pinned while comparing, and moves as the cursor does. */}
      {focus !== null && quote.perPersonTotal !== null ? (
        <PinnedTotal
          current={quote.perPersonTotal}
          preview={previewQuote?.perPersonTotal ?? null}
          partySize={partySize}
        />
      ) : null}
    </main>
  );
}

/* ------------------------------------------------------------------ assembled */

function AssembledRow({
  row,
  icon,
  onFocus,
  canChoose,
}: {
  row: TripRow;
  icon: string;
  onFocus: () => void;
  canChoose: boolean;
}) {
  const unavailable = !row.available;

  return (
    <div className="p-4 sm:p-5">
      <div className="flex items-start gap-3.5 sm:gap-4">
        <Image
          src={icon}
          alt=""
          width={44}
          height={44}
          className={`h-11 w-11 shrink-0 rounded-[10px] object-contain ${unavailable ? 'opacity-35' : ''}`}
        />

        <div className="min-w-0 flex-1">
          <p className={`text-[1rem] font-bold leading-snug ${unavailable ? 'text-muted' : ''}`}>
            {row.title}
          </p>
          <p className="type-body mt-1 flex flex-wrap items-center gap-x-1.5 text-muted">
            <span>{row.detail.filter(Boolean).join(' · ')}</span>
            {row.lines.length > 0 ? (
              <SourceTag
                source={row.source}
                detail={row.checkedLabel ?? `${row.lines[0].provider} · ${hostOf(row.lines[0].url)}`}
              />
            ) : null}
          </p>
          {unavailable && row.blockedReason ? (
            <p className="type-body mt-1 text-muted">{row.blockedReason}</p>
          ) : null}
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <span className={`type-figure text-[1.0625rem] ${unavailable ? 'text-faint' : ''}`}>
            {unavailable ? (
              ''
            ) : row.perPersonTotal === 0 ? (
              'Included'
            ) : (
              <AnimatedMoney value={row.perPersonTotal} />
            )}
          </span>
          {canChoose ? (
            <Button variant="quiet" size="sm" onClick={onFocus} className="-mr-2 px-2 py-1">
              Change
              <ArrowRight size={14} strokeWidth={2.5} />
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ focused */

function FocusedRow({
  kind,
  icon,
  options,
  onBack,
  onPreview,
  onPick,
}: {
  kind: TripRow['kind'];
  icon: string;
  options: RowOption[];
  onBack: () => void;
  onPreview: (option: RowOption | null) => void;
  onPick: (option: RowOption) => void;
}) {
  return (
    <div>
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={onBack}>
          <ChevronLeft size={15} strokeWidth={2.6} />
          Back
        </Button>
        <span className="flex items-center gap-2.5">
          <Image src={icon} alt="" width={28} height={28} className="h-7 w-7 object-contain" />
          <h2 className="text-[1.0625rem] font-bold">{FOCUS_TITLE[kind]}</h2>
        </span>
      </div>

      {options.length === 1 ? (
        <p className="type-body mt-4 text-muted">
          {kind === 'stay' ? 'One option until these dates are priced.' : 'One option priced.'}
        </p>
      ) : null}

      <div
        className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        onMouseLeave={() => onPreview(null)}
      >
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            onMouseEnter={() => onPreview(option)}
            onFocus={() => onPreview(option)}
            onClick={() => onPick(option)}
            className={`wt-ease flex flex-col gap-3 rounded-[14px] border bg-paper p-4 text-left active:translate-y-px ${
              option.selected
                ? 'border-peri-d shadow-[var(--shadow-card)]'
                : 'border-hairline hover:-translate-y-0.5 hover:border-peri-d hover:shadow-[var(--shadow-lift)]'
            }`}
          >
            <span className="flex items-start justify-between gap-3">
              <span className="text-[0.9375rem] font-bold leading-snug">{option.title}</span>
              {option.selected ? (
                <Check size={16} strokeWidth={3} className="mt-0.5 shrink-0 text-peri-d" />
              ) : null}
            </span>

            {/* The trade-off that actually decides it, not a second price. */}
            <span className="flex flex-wrap gap-1.5">
              {option.tradeoff.map((t) => (
                <span
                  key={t}
                  className="rounded-full bg-ground px-2.5 py-1 text-[0.75rem] font-semibold text-muted"
                >
                  {t}
                </span>
              ))}
            </span>

            <span className="mt-auto flex items-center justify-between gap-2 border-t border-hairline pt-3">
              <span className="type-figure text-[1.25rem]">{money(option.perPersonTotal)}</span>
              <SourceTag
                source={option.source}
                detail={sourceDetail(option.source)}
                interactive={false}
              />
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * The running total, pinned while comparing.
 *
 * It shows what the trip costs now and, under the cursor, what it would cost with the option
 * being considered. That is the whole reason to compare in place rather than on a separate
 * screen: the consequence of a choice is visible before it is made.
 */
function PinnedTotal({
  current,
  preview,
  partySize,
}: {
  current: number;
  preview: number | null;
  partySize: number;
}) {
  const showing = preview ?? current;
  const delta = preview === null ? 0 : preview - current;

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-hairline bg-paper/95 backdrop-blur">
      <div className={`${MEASURE} flex items-center justify-between gap-4 py-3.5`}>
        <div>
          <Eyebrow>Running total</Eyebrow>
          <p className="type-figure mt-0.5 text-[1.375rem]">
            <AnimatedMoney value={showing} /> <span className="type-secondary">a head</span>
          </p>
        </div>
        {Math.abs(delta) >= 1 ? (
          <span
            className="rounded-full px-3 py-1.5 text-[0.8125rem] font-bold"
            style={{ background: delta > 0 ? 'var(--peach)' : 'var(--sage)', color: 'var(--ink)' }}
          >
            {delta > 0 ? '+' : '−'}
            {money(Math.abs(delta))} a head
          </span>
        ) : (
          <span className="type-body text-muted">{partySize} sharing</span>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ bits */

function sourceDetail(source: PriceSource): string {
  return {
    api: 'Quoted for these dates',
    operator: 'Published rates, checked on the dates shown',
    authored: 'Part estimate, not yet quoted',
  }[source];
}

function hostOf(url: string): string {
  try {
    return new URL(url).host.replace(/^www\./, '');
  } catch {
    return 'source';
  }
}
