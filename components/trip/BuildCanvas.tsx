'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, ChevronDown, Check, TriangleAlert } from 'lucide-react';
import { Photo } from '@/components/ui/Photo';
import { Button, Card, Eyebrow, MEASURE, SourceTag, Total } from '@/components/ui/primitives';
import { useBrief } from '@/components/trip/ControlStrip';
import { describeDriver } from '@/lib/trip/brief';
import { DESTINATIONS_BY_SLUG, WINDOWS } from '@/lib/trip/catalogue';
import { formatHours, money, perPerson, quoteTrip, type TripRow } from '@/lib/trip/quote';

/**
 * The build canvas.
 *
 * The screen the whole product is an argument for: a complete, correct, bookable weekend with a
 * real total, already filled in, before anyone touches a control. There is no empty state here
 * and no "choose your flight" step — a planner that opens on a blank form has handed the work
 * back to the person who came here to avoid it.
 *
 * Three rows in a fixed order, travel then stay then car, because that is the order the money
 * goes out. Each carries where its number came from, and Change opens the alternatives in place
 * rather than navigating, so nobody loses their scroll position to compare two options.
 *
 * Who is going and when comes from the control strip in the layout, not from this screen. A
 * surface that asks again for something already answered above it is the wizard this product
 * exists to remove.
 */

const ROW_ICON: Record<string, string> = {
  drive: '/assets/icon-fuel.webp',
  plane: '/assets/icon-plane.webp',
  train: '/assets/icon-ticket.webp',
  coach: '/assets/icon-ticket.webp',
  stay: '/assets/icon-bed.webp',
  car: '/assets/icon-car.webp',
};

export function BuildCanvas({ slug }: { slug: string }) {
  const dest = DESTINATIONS_BY_SLUG[slug];

  const [brief] = useBrief();
  const [prefer, setPrefer] = useState<'drive' | 'transit' | null>(null);
  const [openRow, setOpenRow] = useState<TripRow['kind'] | null>(null);

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
    () => quoteTrip(dest, window, partySize, driver, prefer),
    [dest, window, partySize, driver, prefer],
  );

  const [travel, stay, car] = quote.rows;

  /* The mark should say how you are getting there without the title having to be read. */
  const travelIcon =
    dest.transit && travel.title === dest.transit.label
      ? ROW_ICON[dest.transit.mode]
      : ROW_ICON.drive;

  return (
    <main className="min-h-dvh pb-24">
      <div className={`${MEASURE} pt-6`}>
        <Link
          href="/"
          className="wt-ease inline-flex items-center gap-2 text-[0.875rem] font-semibold hover:text-peri-d"
        >
          <ArrowLeft size={16} strokeWidth={2.5} />
          All trips
        </Link>
      </div>

      {/* ---------------------------------------------------------- the place */}
      <section className={`${MEASURE} pt-5`}>
        <div className="grid gap-6 sm:grid-cols-[minmax(0,1fr)_280px] sm:items-end">
          <div>
            <Eyebrow>{dest.eyebrow}</Eyebrow>
            <h1 className="type-display mt-2.5">{dest.name}</h1>
            <p className="type-body mt-3 max-w-xl text-muted">{dest.hook}</p>
          </div>
          <Photo
            src={dest.image}
            alt={dest.name}
            ratio="wide"
            sizes="(max-width: 640px) 100vw, 280px"
            eager
          />
        </div>
      </section>

      {/* What is being costed, stated rather than asked. The strip above is where it changes. */}
      <section className={`${MEASURE} mt-7`}>
        <p className="type-secondary">
          {window.label} · {window.nights} nights · {partySize}{' '}
          {partySize === 1 ? 'person' : 'people'} · {describeDriver(driver)}
          {brief.windowId === null ? ' · cheapest of the warmed weekends' : ''}
        </p>
      </section>

      {/* ---------------------------------------------------------- the conflict, before it happens */}
      {!quote.reachable ? (
        <section className={`${MEASURE} mt-5`}>
          <div className="flex items-start gap-3 rounded-[14px] border border-hairline-strong bg-paper p-4 sm:p-5">
            <TriangleAlert size={18} className="mt-0.5 shrink-0 text-coral" strokeWidth={2.2} />
            <p className="text-[0.9375rem] font-bold">Not reachable without a car</p>
          </div>
        </section>
      ) : null}

      {/* ---------------------------------------------------------- the three rows */}
      <section className={`${MEASURE} mt-5`}>
        <Card className="divide-y divide-hairline overflow-hidden">
          <Row
            row={travel}
            icon={travelIcon}
            open={openRow === 'travel'}
            onToggle={() => setOpenRow(openRow === 'travel' ? null : 'travel')}
            changeable={quote.alternative !== null}
          >
            {quote.alternative ? (
              <AlternativePanel
                options={[
                  { id: chosenId(quote), label: travel.title, hours: travel.hoursEachWay ?? 0, perPerson: travel.perPersonTotal + car.perPersonTotal, selected: true },
                  {
                    id: quote.alternative.id,
                    label: quote.alternative.label,
                    hours: quote.alternative.hoursEachWay,
                    perPerson: quote.alternative.perPersonTotal,
                    selected: false,
                  },
                ]}
                onPick={(id) => {
                  setPrefer(id);
                  setOpenRow(null);
                }}
              />
            ) : null}
          </Row>

          <Row
            row={stay}
            icon={ROW_ICON.stay}
            open={openRow === 'stay'}
            onToggle={() => setOpenRow(openRow === 'stay' ? null : 'stay')}
            changeable
          >
            <p className="text-[0.9375rem] font-bold">
              {stay.source === 'api' ? 'Other beds nearby' : 'Not priced yet'}
            </p>
          </Row>

          <Row
            row={car}
            icon={ROW_ICON.car}
            open={openRow === 'car'}
            onToggle={() => setOpenRow(openRow === 'car' ? null : 'car')}
            changeable={car.available}
          >
            <p className="text-[0.9375rem] font-bold">One class priced</p>
          </Row>
        </Card>
      </section>

      {/* ---------------------------------------------------------- entry and fees */}
      {quote.fees.lines.length > 0 ? (
        <section className={`${MEASURE} mt-5`}>
          <Card className="p-4 sm:p-5">
            <div className="flex items-center gap-2.5">
              <Image src="/assets/icon-ticket.webp" alt="" width={28} height={28} className="h-7 w-7 object-contain" />
              <Eyebrow>Entry and fees</Eyebrow>
            </div>
            <ul className="mt-3.5 flex flex-col gap-3">
              {quote.fees.lines.map((line) => (
                <li key={line.label} className="flex items-baseline justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-[0.9375rem] font-semibold">{line.label}</p>
                    <SourceTag
                      source={line.source}
                      detail={`${line.provider} · ${hostOf(line.url)}`}
                      className="mt-1"
                    />
                  </div>
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
      <section className={`${MEASURE} mt-5`}>
        <Card className="p-5 sm:p-7">
          <Eyebrow>
            {window.label} · {window.nights} nights · {partySize}{' '}
            {partySize === 1 ? 'person' : 'people'}
          </Eyebrow>

          {quote.perPersonTotal === null ? (
            <p className="type-body mt-3 max-w-lg">{quote.verdict}</p>
          ) : (
            <>
              <div className="mt-3 flex items-center gap-2">
                <Total amount={money(quote.perPersonTotal)} caption="a head, everything in" />
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

      {/* One way forward, once the trip looks right. */}
      {quote.reachable ? (
        <section className={`${MEASURE} mt-5`}>
          <Link
            href={`/trip/${dest.slug}/summary`}
            className="wt-ease flex w-full items-center justify-center gap-2 rounded-full bg-peri px-6 py-3.5 text-[0.9375rem] font-semibold text-ink hover:bg-peri-d"
          >
            This looks right
            <ArrowRight size={17} strokeWidth={2.5} />
          </Link>
        </section>
      ) : null}

      {/* ---------------------------------------------------------- secondary, collapsed */}
      <section className={`${MEASURE} mt-5`}>
        <details className="group rounded-[14px] border border-hairline bg-paper">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-4 sm:p-5">
            <div>
              <p className="text-[0.9375rem] font-bold">Things to do</p>
              <p className="type-body mt-0.5 text-muted">
                {dest.itinerary.length} ideas, with what each one actually costs
              </p>
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
                {/* The catch is never optional and never hidden. A caveat found later is a
                    broken promise. */}
                <p className="type-body mt-2.5 text-muted">{item.catch}</p>
              </li>
            ))}
          </ul>
        </details>
      </section>
    </main>
  );
}

/* ------------------------------------------------------------------ pieces */

/** The selected option is whichever one the alternative is not. */
function chosenId(quote: ReturnType<typeof quoteTrip>): 'drive' | 'transit' {
  return quote.alternative?.id === 'drive' ? 'transit' : 'drive';
}

function sourceDetail(source: 'api' | 'operator' | 'authored'): string {
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

function Row({
  row,
  icon,
  open,
  onToggle,
  changeable,
  children,
}: {
  row: TripRow;
  icon: string;
  open: boolean;
  onToggle: () => void;
  changeable: boolean;
  children?: React.ReactNode;
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
          <p className="type-body mt-1 text-muted">{row.detail.filter(Boolean).join(' · ')}</p>

          {row.lines.length > 0 ? (
            <SourceTag
              source={row.source}
              detail={row.checkedLabel ?? `${row.lines[0].provider} · ${hostOf(row.lines[0].url)}`}
              className="mt-2"
            />
          ) : null}

          {unavailable && row.blockedReason ? (
            <p className="type-body mt-2 text-muted">{row.blockedReason}</p>
          ) : null}
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <span className={`type-figure text-[1.0625rem] ${unavailable ? 'text-faint' : ''}`}>
            {unavailable ? '' : row.perPersonTotal === 0 ? 'Included' : money(row.perPersonTotal)}
          </span>
          {changeable ? (
            <Button variant="quiet" size="sm" onClick={onToggle} className="-mr-2 px-2 py-1">
              {open ? 'Close' : 'Change'}
              <ChevronDown size={14} strokeWidth={2.5} className={open ? 'rotate-180' : ''} />
            </Button>
          ) : null}
        </div>
      </div>

      {/* Expands in place. No navigation, so the scroll position survives. */}
      {open && children ? (
        <div className="mt-4 rounded-[10px] border border-hairline bg-ground p-4">{children}</div>
      ) : null}
    </div>
  );
}

function AlternativePanel({
  options,
  onPick,
}: {
  options: {
    id: 'drive' | 'transit';
    label: string;
    hours: number;
    perPerson: number;
    selected: boolean;
  }[];
  onPick: (id: 'drive' | 'transit') => void;
}) {
  return (
    <div>
      <div className="flex flex-col gap-2">
        {options.map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => onPick(opt.id)}
            className={`wt-ease flex items-center justify-between gap-4 rounded-[10px] border p-3 text-left ${
              opt.selected
                ? 'border-peri-d bg-paper'
                : 'border-hairline bg-paper hover:border-peri-d'
            }`}
          >
            <span className="min-w-0">
              <span className="block text-[0.9375rem] font-bold">{opt.label}</span>
              <span className="type-body block text-muted">
                {formatHours(opt.hours)} each way, door to door
              </span>
            </span>
            <span className="flex shrink-0 items-center gap-2.5">
              <span className="type-figure text-[1rem]">{money(opt.perPerson)}</span>
              {opt.selected ? <Check size={16} className="text-peri-d" strokeWidth={3} /> : null}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

