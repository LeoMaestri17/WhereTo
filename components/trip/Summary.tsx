'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, Check, Copy, ExternalLink } from 'lucide-react';
import { AnimatedMoney } from '@/components/ui/AnimatedMoney';
import { Card, Eyebrow, MEASURE, SourceTag, Total } from '@/components/ui/primitives';
import { useBrief } from '@/components/trip/ControlStrip';
import { describeDriver } from '@/lib/trip/brief';
import { DESTINATIONS_BY_SLUG, WINDOWS } from '@/lib/trip/catalogue';
import { money, perPerson, quoteTrip, type TripRow } from '@/lib/trip/quote';
import { decodeTrip, encodeTrip } from '@/lib/trip/share';
import type { CostLine } from '@/lib/trip/types';

/**
 * The summary.
 *
 * The same three rows, locked. Nothing here is editable, because the job of this screen is to be
 * the thing you send to four people and the thing you book from — and a figure that can be
 * changed on the page you are reading it from is a figure nobody can agree on.
 *
 * Every row carries a link out to the provider and the date its price was checked. The check
 * date is the product's honesty feature and it is shown next to the number rather than in a
 * footnote: a price you can date and audit beats a fresher one you cannot.
 */

const ROW_ICON: Record<string, string> = {
  drive: '/assets/icon-fuel.webp',
  plane: '/assets/icon-plane.webp',
  train: '/assets/icon-ticket.webp',
  coach: '/assets/icon-ticket.webp',
  stay: '/assets/icon-bed.webp',
  car: '/assets/icon-car.webp',
};

export function Summary({ slug }: { slug: string }) {
  const dest = DESTINATIONS_BY_SLUG[slug];
  const params = useSearchParams();
  const [brief, setBrief] = useBrief();
  const [copied, setCopied] = useState(false);

  /* A shared link is the sender's trip, so it wins over whatever this browser happens to
     remember — otherwise the recipient opens a different price under the same URL. Applied once,
     then the strip is theirs again. */
  const shared = useMemo(() => decodeTrip(new URLSearchParams(params.toString())), [params]);

  /* A ref, not state. The guard only has to survive re-renders, and setting state inside an
     effect triggers the cascading render React now warns about — whereas writing the brief is a
     mutation of an external store, which is exactly what an effect is for. */
  const applied = useRef(false);

  useEffect(() => {
    if (applied.current || Object.keys(shared.brief).length === 0) return;
    applied.current = true;
    setBrief(shared.brief);
  }, [shared, setBrief]);

  const window =
    WINDOWS.find((w) => w.id === brief.windowId) ??
    WINDOWS.find((w) => w.id === shared.brief.windowId) ??
    WINDOWS[0];

  const quote = useMemo(
    () => quoteTrip(dest, window, brief.partySize, brief.driver, shared.prefer),
    [dest, window, brief.partySize, brief.driver, shared.prefer],
  );

  const [travel, stay, car] = quote.rows;

  /* The same rule as the build canvas: the mark says how you are getting there. Hardcoding the
     plane put an aeroplane next to "Drive to San Francisco". */
  const travelIcon =
    dest.transit && travel.title === dest.transit.label
      ? ROW_ICON[dest.transit.mode]
      : ROW_ICON.drive;

  const share = () => {
    const url = `${globalThis.location.origin}/trip/${slug}/summary?${encodeTrip(brief, shared.prefer)}`;
    navigator.clipboard
      ?.writeText(url)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2200);
      })
      .catch(() => {
        // Clipboard is permission-gated and blocked outright in some browsers. The link is in
        // the address bar either way, so this is a convenience failing, not the feature.
      });
  };

  return (
    <main className="min-h-dvh pb-24">
      <div className={`${MEASURE} pt-6`}>
        <Link
          href={`/trip/${slug}`}
          className="wt-ease inline-flex items-center gap-2 text-[0.875rem] font-semibold hover:text-peri-d"
        >
          <ArrowLeft size={16} strokeWidth={2.5} />
          Back to the build
        </Link>
      </div>

      <section className={`${MEASURE} pt-5`}>
        <Eyebrow>Your trip</Eyebrow>
        <h1 className="type-display mt-2.5">{dest.name}</h1>
        <p className="type-secondary mt-2.5">
          {window.label} · {window.nights} nights · {brief.partySize}{' '}
          {brief.partySize === 1 ? 'person' : 'people'} · {describeDriver(brief.driver)}
        </p>
      </section>

      {quote.perPersonTotal === null ? (
        <section className={`${MEASURE} mt-6`}>
          <Card className="p-5 sm:p-7">
            <p className="type-body">{quote.verdict}</p>
          </Card>
        </section>
      ) : (
        <>
          <section className={`${MEASURE} mt-6`}>
            <Card className="divide-y divide-hairline overflow-hidden">
              <LockedRow row={travel} icon={travelIcon} dest={dest} />
              <LockedRow row={stay} icon={ROW_ICON.stay} dest={dest} />
              <LockedRow row={car} icon={ROW_ICON.car} dest={dest} />
              {quote.fees.lines.map((line) => (
                <FeeRow
                  key={line.label}
                  line={line}
                  amount={perPerson(line, brief.partySize, window.nights)}
                />
              ))}
            </Card>
          </section>

          <section className={`${MEASURE} mt-5`}>
            <Card className="p-5 sm:p-7">
              <Total amount={<AnimatedMoney value={quote.perPersonTotal} />} caption="a head, everything in" />
              <p className="type-secondary mt-2">
                {money(quote.partyTotal ?? 0)} for {brief.partySize} of you, in {quote.rooms}{' '}
                {quote.rooms === 1 ? 'room' : 'rooms'}
              </p>

              <div className="mt-6 flex flex-col gap-3 border-t border-hairline pt-5 sm:flex-row sm:items-center sm:justify-between">

                <button
                  type="button"
                  onClick={share}
                  className="wt-ease inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-peri px-5 py-2.5 text-[0.875rem] font-semibold text-ink hover:bg-peri-d"
                >
                  {copied ? <Check size={15} strokeWidth={3} /> : <Copy size={15} strokeWidth={2.4} />}
                  {copied ? 'Link copied' : 'Copy share link'}
                </button>
              </div>
            </Card>
          </section>
        </>
      )}
    </main>
  );
}

/* ------------------------------------------------------------------ rows */

function bookingFor(row: TripRow): { href: string; label: string } | null {
  if (row.bookingLink) return { href: row.bookingLink, label: 'Book' };
  const line = row.lines[0];
  if (!line) return null;
  /* "Book" is a promise. Only a line that came back from a booking provider with its own link
     can keep it — a state fuel average and a hire-company home page cannot, so they say what
     they actually are. */
  return { href: line.url, label: row.source === 'api' ? 'Book' : 'Check prices' };
}

function hostOf(url: string): string {
  try {
    return new URL(url).host.replace(/^www\./, '');
  } catch {
    return 'source';
  }
}

function LockedRow({
  row,
  icon,
  dest,
}: {
  row: TripRow;
  icon: string;
  dest: { name: string };
}) {
  const booking = bookingFor(row);
  const free = row.lines.length === 0;

  return (
    <div className="flex items-start gap-3.5 p-4 sm:p-5">
      <Image
        src={icon}
        alt=""
        width={40}
        height={40}
        className="h-10 w-10 shrink-0 rounded-[10px] object-contain"
      />

      <div className="min-w-0 flex-1">
        <p className="text-[0.9375rem] font-bold leading-snug">{row.title}</p>
        <p className="type-body mt-0.5 text-muted">{row.detail.filter(Boolean).join(' · ')}</p>

        {!free ? (
          <SourceTag
            source={row.source}
            /* The check date, next to the number, every time. */
            detail={row.checkedLabel ?? `${row.lines[0].provider} · not checked since ${row.lines[0].checkedOn}`}
            className="mt-1.5"
          />
        ) : (
          <p className="type-body mt-1.5 text-muted">Nothing to book for {dest.name}.</p>
        )}
      </div>

      <div className="flex shrink-0 flex-col items-end gap-1.5">
        <span className="type-figure text-[1.0625rem]">
          {free ? 'Included' : money(row.perPersonTotal)}
        </span>
        {booking && !free ? (
          <a
            href={booking.href}
            target="_blank"
            rel="noopener noreferrer"
            className="wt-ease inline-flex items-center gap-1 text-[0.8125rem] font-semibold text-peri-d hover:underline"
          >
            {booking.label}
            <ExternalLink size={12} strokeWidth={2.6} />
          </a>
        ) : null}
      </div>
    </div>
  );
}

function FeeRow({ line, amount }: { line: CostLine; amount: number }) {
  return (
    <div className="flex items-start gap-3.5 p-4 sm:p-5">
      <Image
        src="/assets/icon-ticket.webp"
        alt=""
        width={40}
        height={40}
        className="h-10 w-10 shrink-0 rounded-[10px] object-contain"
      />
      <div className="min-w-0 flex-1">
        <p className="text-[0.9375rem] font-bold leading-snug">{line.label}</p>
        
        <SourceTag
          source={line.source}
          detail={`${line.provider} · checked ${line.checkedOn}`}
          className="mt-1.5"
        />
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1.5">
        <span className="type-figure text-[1.0625rem]">{money(amount)}</span>
        <a
          href={line.url}
          target="_blank"
          rel="noopener noreferrer"
          className="wt-ease inline-flex items-center gap-1 text-[0.8125rem] font-semibold text-peri-d hover:underline"
        >
          {hostOf(line.url)}
          <ExternalLink size={12} strokeWidth={2.6} />
        </a>
      </div>
    </div>
  );
}
