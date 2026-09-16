'use client';

import Link from 'next/link';
import { notFound, useParams } from 'next/navigation';
import { useMemo, useSyncExternalStore } from 'react';
import { SmartImage } from '@/components/SmartImage';
import {
  ArrowIcon,
  CarIcon,
  Eyebrow,
  MoonIcon,
  PhotoFrame,
  PillLink,
  PlaneIcon,
  TrainIcon,
} from '@/components/nocturne/primitives';
import { MEASURE } from '@/components/nocturne/measure';
import {
  DEFAULT_BRIEF,
  getBriefServerSnapshot,
  getBriefSnapshot,
  subscribeToBrief,
} from '@/lib/mvp/brief';
import { DESTINATIONS_BY_SLUG } from '@/lib/mvp/data';
import {
  WEEKENDS,
  money,
  perPerson,
  quoteTrip,
  type CostLine,
  type PartySize,
  type TravelOption,
} from '@/lib/mvp/model';

/**
 * The detail page.
 *
 * Three things in order: what the weekend is made of, what it costs and where each figure came
 * from, and whether to drive. The itinerary comes first on purpose — nobody decides on a price
 * before they know what they are buying.
 */
export default function TripDetailPage() {
  const params = useParams<{ slug: string }>();
  const dest = DESTINATIONS_BY_SLUG[params.slug];

  const stored = useSyncExternalStore(subscribeToBrief, getBriefSnapshot, getBriefServerSnapshot);
  const brief = stored ?? DEFAULT_BRIEF;
  const weekend = WEEKENDS.find((w) => w.id === brief.weekend) ?? WEEKENDS[0];

  const quote = useMemo(
    () => (dest ? quoteTrip(dest, weekend, brief.partySize, brief.driver) : null),
    [dest, weekend, brief.partySize, brief.driver],
  );

  if (!dest || !quote) notFound();

  const { verdict, entry, stay, perPersonTotal } = quote;

  return (
    <main className="min-h-dvh pb-28">
      {/* Hero */}
      <PhotoFrame
        scrim="hero"
        className="min-h-[78vh]"
        image={
          <SmartImage
            photoId={dest.heroPhoto}
            alt={dest.name}
            width={2000}
            height={1400}
            priority
            sizes="100vw"
            className="sq-graded h-full w-full object-cover"
          />
        }
      >
        <header className={`${MEASURE} flex items-center justify-between pt-7`}>
          <Link href="/trips" className="type-eyebrow sq-ease inline-flex items-center gap-2 text-type">
            ← All destinations
          </Link>
          <Link href="/" className="type-eyebrow sq-ease inline-flex items-center gap-2 text-type">
            <MoonIcon size={13} className="text-sand" />
            WhereTo
          </Link>
        </header>

        <div className={`${MEASURE} mt-auto pb-16`}>
          <Eyebrow className="sq-rise sq-rise-1 sq-text-glow font-medium text-type">{dest.eyebrow}</Eyebrow>
          <h1 className="type-hero sq-rise sq-rise-2 sq-text-glow mt-5 max-w-2xl text-type">{dest.name}.</h1>
          <p className="type-body-lg sq-rise sq-rise-3 sq-text-glow mt-5 max-w-xl text-type">{dest.hook}</p>

          <div className="sq-rise sq-rise-4 mt-8 flex flex-wrap items-end gap-x-10 gap-y-5">
            <div>
              <Eyebrow>Per person, everything in</Eyebrow>
              <p className="type-figure-lg mt-2 text-type">
                {perPersonTotal === null ? 'Not reachable' : money(perPersonTotal)}
              </p>
            </div>
            <div>
              <Eyebrow>{weekend.label} · {brief.partySize} going</Eyebrow>
              <p className="type-body mt-2">{dest.driveTime}</p>
            </div>
          </div>
        </div>
      </PhotoFrame>

      {/* October */}
      <section className={`${MEASURE} pt-14`}>
        <Eyebrow>Early October</Eyebrow>
        <p className="type-body-lg mt-4 max-w-2xl">{dest.whyOctober}</p>
      </section>

      {/* The verdict */}
      <section className={`${MEASURE} pt-14`}>
        <Eyebrow>Getting there</Eyebrow>
        <h2 className="type-display mt-4 max-w-2xl text-type">
          {verdict.recommended === 'car'
            ? 'Drive it.'
            : verdict.recommended === 'transit'
              ? `${verdict.transit?.label}.`
              : 'Not this one.'}
        </h2>
        <p className="type-body-lg mt-4 max-w-2xl">{verdict.reason}</p>

        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          <ModeCard
            option={verdict.car}
            icon={<CarIcon size={16} />}
            chosen={verdict.recommended === 'car'}
            partySize={brief.partySize}
            nights={weekend.nights}
          />
          {verdict.transit ? (
            <ModeCard
              option={verdict.transit}
              icon={
                verdict.transit.label.includes('Fly') ? <PlaneIcon size={16} /> : <TrainIcon size={16} />
              }
              chosen={verdict.recommended === 'transit'}
              partySize={brief.partySize}
              nights={weekend.nights}
            />
          ) : (
            <div className="rounded-[20px] border border-hairline p-6">
              <Eyebrow>No public route</Eyebrow>
              <p className="type-body mt-3">
                There is no scheduled service that reaches {dest.name} and back inside a weekend.
                That is a fact about the place, not an omission here.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Costs */}
      <section className={`${MEASURE} pt-14`}>
        <Eyebrow>What it costs, and how we know</Eyebrow>
        <h2 className="type-display mt-4 text-type">Every line, with its source.</h2>

        <div className="mt-8 divide-y divide-hairline border-y border-hairline">
          {entry.lines.map((l) => (
            <LineRow key={l.label} line={l} partySize={brief.partySize} nights={weekend.nights} />
          ))}
          {stay.lines.map((l) => (
            <LineRow key={l.label} line={l} partySize={brief.partySize} nights={weekend.nights} />
          ))}
          {(verdict.recommended === 'car'
            ? verdict.car.priced.lines
            : (verdict.transit?.priced.lines ?? [])
          ).map((l) => (
            <LineRow key={l.label} line={l} partySize={brief.partySize} nights={weekend.nights} />
          ))}
        </div>

        {perPersonTotal !== null ? (
          <div className="mt-7 flex flex-wrap items-end justify-between gap-5">
            <div>
              <Eyebrow>Per person</Eyebrow>
              <p className="type-figure-lg mt-2 text-type">{money(perPersonTotal)}</p>
            </div>
            <div className="text-right">
              <Eyebrow>All {brief.partySize} of you</Eyebrow>
              <p className="type-figure mt-2 text-[1.25rem] text-type-muted">
                {money(perPersonTotal * brief.partySize)}
              </p>
            </div>
          </div>
        ) : null}

      </section>

      {/* Itinerary */}
      <section className={`${MEASURE} pt-16`}>
        <Eyebrow>The weekend</Eyebrow>
        <h2 className="type-display mt-4 text-type">What you would actually do.</h2>

        <div className="mt-9 space-y-6">
          {dest.itinerary.map((item) => (
            <article
              key={item.title}
              className="grid gap-6 rounded-[20px] border border-hairline p-5 sm:grid-cols-[16rem_1fr] sm:p-6"
            >
              <div className="relative h-44 overflow-hidden rounded-[14px] sm:h-full sm:min-h-44">
                <SmartImage
                  photoId={item.photo}
                  alt={item.title}
                  width={640}
                  height={480}
                  sizes="(max-width: 640px) 100vw, 16rem"
                  className="sq-graded h-full w-full object-cover"
                />
              </div>
              <div>
                <Eyebrow>{item.eyebrow}</Eyebrow>
                <h3 className="type-title mt-2.5 text-type">{item.title}</h3>
                <p className="type-body mt-3">{item.what}</p>

                <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2">
                  <span className="type-eyebrow">{item.timeNeeded}</span>
                  <a
                    href={item.costSource}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="type-eyebrow sq-ease inline-flex items-center gap-1.5 text-sand hover:text-sand-2"
                  >
                    {item.cost}
                    <ArrowIcon size={12} />
                  </a>
                  {item.needsCar ? <span className="type-eyebrow">Needs the car</span> : null}
                </div>

                <p className="type-body mt-4 border-l border-sand pl-4">{item.catch}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className={`${MEASURE} pt-14`}>
        <PillLink href="/trips" variant="outline" size="lg">
          Back to all destinations
          <ArrowIcon size={16} />
        </PillLink>
      </section>
    </main>
  );
}

/* ------------------------------------------------------------------ pieces */

function ModeCard({
  option,
  icon,
  chosen,
  partySize,
  nights,
}: {
  option: TravelOption;
  icon: React.ReactNode;
  chosen: boolean;
  partySize: PartySize;
  nights: number;
}) {
  return (
    <div
      className={`rounded-[20px] border p-6 ${
        chosen ? 'border-sand bg-[rgba(180,155,116,0.07)]' : 'border-hairline'
      }`}
    >
      <div className="flex items-center justify-between gap-4">
        <Eyebrow className="flex items-center gap-2.5">
          <span className={chosen ? 'text-sand' : ''}>{icon}</span>
          {option.label}
        </Eyebrow>
        {chosen ? <span className="type-eyebrow text-sand">Recommended</span> : null}
      </div>

      {option.available ? (
        <>
          <p className="type-figure mt-4 text-[1.75rem] text-type">
            {money(option.priced.perPersonTotal)}
          </p>
          <p className="type-eyebrow mt-1.5">each</p>
          <ul className="mt-4 space-y-1.5">
            {option.priced.lines.map((l) => (
              <li key={l.label} className="type-body flex justify-between gap-4">
                <span>{l.label}</span>
                <span className="type-figure shrink-0 text-type-muted">
                  {money(perPerson(l, partySize, nights))}
                </span>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p className="type-body mt-4">{option.blockedReason}</p>
      )}
    </div>
  );
}

function LineRow({
  line,
  partySize,
  nights,
}: {
  line: CostLine;
  partySize: PartySize;
  nights: number;
}) {
  const each = perPerson(line, partySize, nights);

  return (
    <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-2 py-4">
      <div className="min-w-0 max-w-xl">
        <p className="type-body text-type">{line.label}</p>
        <p className="type-eyebrow mt-1.5">
          {line.provider} · checked {line.checkedOn}
        </p>
        {line.note ? <p className="type-body mt-2 max-w-lg">{line.note}</p> : null}
        {line.source ? (
          <a
            href={line.source}
            target="_blank"
            rel="noopener noreferrer"
            className="type-eyebrow sq-ease mt-2 inline-flex items-center gap-1.5 text-sand hover:text-sand-2"
          >
            Source
            <ArrowIcon size={12} />
          </a>
        ) : null}
      </div>
      <div className="text-right">
        <p className="type-figure text-[1.0625rem] text-type">
          {each === 0 ? 'Free' : money(each)}
        </p>
        <p className="type-eyebrow mt-1">each</p>
      </div>
    </div>
  );
}
