'use client';

import Link from 'next/link';
import { useMemo, useSyncExternalStore } from 'react';
import { SmartImage } from '@/components/SmartImage';
import {
  ArrowIcon,
  CarIcon,
  Eyebrow,
  MoonIcon,
  PhotoFrame,
  PillButton,
  PlaneIcon,
  TrainIcon,
} from '@/components/nocturne/primitives';
import { MEASURE } from '@/components/nocturne/measure';
import {
  DEFAULT_BRIEF,
  describeDriver,
  getBriefServerSnapshot,
  getBriefSnapshot,
  saveBrief,
  subscribeToBrief,
  type Brief,
} from '@/lib/mvp/brief';
import { DESTINATIONS } from '@/lib/mvp/data';
import {
  AGE_BAND_LABELS,
  PARTY_SIZES,
  WEEKENDS,
  money,
  quoteTrip,
  type AgeBand,
  type Destination,
  type PartySize,
  type Verdict,
} from '@/lib/mvp/model';

/**
 * The overview: every destination, priced against the survey answers.
 *
 * The answers arrive from the survey but they are not frozen — the filter bar is the same set of
 * questions, still adjustable, and every price on the page moves when one changes. Without that
 * the survey would be a toll gate rather than a tool.
 */
export default function TripsPage() {
  const stored = useSyncExternalStore(subscribeToBrief, getBriefSnapshot, getBriefServerSnapshot);
  const brief = stored ?? DEFAULT_BRIEF;
  const weekend = WEEKENDS.find((w) => w.id === brief.weekend) ?? WEEKENDS[0];

  const priced = useMemo(
    () =>
      DESTINATIONS.map((dest) => ({
        dest,
        ...quoteTrip(dest, weekend, brief.partySize, brief.driver),
      })),
    [weekend, brief.partySize, brief.driver],
  );

  /* Cheapest first, with anything this group cannot reach at all pushed to the end rather than
     hidden — a blocked destination with a reason is more useful than a gap. */
  const ordered = [...priced].sort((a, b) => {
    if (a.perPersonTotal === null) return 1;
    if (b.perPersonTotal === null) return -1;
    return a.perPersonTotal - b.perPersonTotal;
  });

  const set = (patch: Partial<Brief>) => saveBrief({ ...brief, ...patch });

  return (
    <main className="min-h-dvh pb-24">
      <div className="border-b border-hairline">
        <div className={`${MEASURE} pb-9 pt-10`}>
          <Link href="/" className="type-eyebrow sq-ease inline-flex items-center gap-2">
            <MoonIcon size={13} className="text-sand" />
            WhereTo
          </Link>

          <h1 className="type-display mt-7 max-w-2xl text-type">
            Costed for {brief.partySize} {brief.partySize === 1 ? 'person' : 'people'} with{' '}
            {describeDriver(brief.driver)}.
          </h1>

          <FilterBar brief={brief} set={set} />
        </div>
      </div>

      <div className={`${MEASURE} pt-10`}>
        <Eyebrow>{weekend.label} · two nights · per person, everything in</Eyebrow>
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {ordered.map(({ dest, perPersonTotal, verdict }) => (
            <TripCard
              key={dest.slug}
              dest={dest}
              perPersonTotal={perPersonTotal}
              verdict={verdict}
            />
          ))}
          <ComingSoon />
        </div>
      </div>
    </main>
  );
}

/**
 * The fifth tile.
 *
 * Deliberately not a named place and deliberately not disabled-looking. It states that the set is
 * growing, which is true, and it fills the fourth column so the grid does not end on a ragged row.
 */
function ComingSoon() {
  return (
    <div className="flex h-[30rem] flex-col justify-end rounded-[20px] border border-hairline bg-ground-2 p-5">
      <Eyebrow>Next</Eyebrow>
      <p className="type-title mt-2.5 text-type-muted">More destinations coming soon</p>
      <p className="type-body mt-2.5">
        Costed the same way, from the same questions, as soon as each one is finished.
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ filters */

function FilterBar({ brief, set }: { brief: Brief; set: (p: Partial<Brief>) => void }) {
  return (
    <div className="mt-9 flex flex-col gap-5">
      <Row label="Weekend">
        {WEEKENDS.map((w) => (
          <Chip key={w.id} on={brief.weekend === w.id} onClick={() => set({ weekend: w.id })}>
            {w.label}
          </Chip>
        ))}
      </Row>

      <Row label="How many">
        {PARTY_SIZES.map((n) => (
          <Chip
            key={n}
            on={brief.partySize === n}
            onClick={() => set({ partySize: n as PartySize })}
          >
            {n}
          </Chip>
        ))}
      </Row>

      <Row label="Driver">
        <Chip
          on={!brief.driver.hasLicence}
          onClick={() => set({ driver: { hasLicence: false, ageBand: null } })}
        >
          No licence
        </Chip>
        {(Object.keys(AGE_BAND_LABELS) as AgeBand[]).map((band) => (
          <Chip
            key={band}
            on={brief.driver.hasLicence && brief.driver.ageBand === band}
            onClick={() => set({ driver: { hasLicence: true, ageBand: band } })}
          >
            {AGE_BAND_LABELS[band]}
          </Chip>
        ))}
      </Row>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
      <Eyebrow className="w-[5.5rem] shrink-0">{label}</Eyebrow>
      <div className="sq-rail flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function Chip({
  on,
  onClick,
  children,
}: {
  on: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <PillButton
      variant={on ? 'solid' : 'outline'}
      aria-pressed={on}
      onClick={onClick}
      className="px-5 py-2.5 text-[0.78125rem]"
    >
      {children}
    </PillButton>
  );
}

/* ------------------------------------------------------------------ the card */

function ModeIcon({ verdict }: { verdict: Verdict }) {
  if (verdict.recommended === 'car') return <CarIcon size={14} />;
  if (verdict.recommended === 'transit') {
    return verdict.transit?.label.includes('Fly') ? <PlaneIcon size={14} /> : <TrainIcon size={14} />;
  }
  return null;
}

function TripCard({
  dest,
  perPersonTotal,
  verdict,
}: {
  dest: Destination;
  perPersonTotal: number | null;
  verdict: Verdict;
}) {
  const blocked = perPersonTotal === null;

  return (
    <Link href={`/trips/${dest.slug}`} className="sq-card sq-ease group block">
      <PhotoFrame
        scrim="card"
        className="h-[30rem] rounded-[20px]"
        image={
          <SmartImage
            photoId={dest.heroPhoto}
            alt={dest.name}
            width={900}
            height={1200}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="sq-graded sq-zoom h-full w-full object-cover"
          />
        }
      >
        <div className="sq-card-scrim mt-auto p-5">
          <Eyebrow>{dest.eyebrow}</Eyebrow>
          <h2 className="type-title mt-2.5 text-type">{dest.name}</h2>
          <p className="type-body mt-2 line-clamp-2">{dest.hook}</p>

          <div className="mt-4 border-t border-hairline pt-3.5">
            {blocked ? (
              <>
                <p className="type-body text-type">Not reachable for this group</p>
                <p className="type-body mt-1.5 line-clamp-3">{verdict.reason}</p>
              </>
            ) : (
              <>
                <div className="flex items-end justify-between gap-3">
                  <span className="type-figure-lg text-type">{money(perPersonTotal)}</span>
                  <span className="sq-ease flex items-center gap-2 text-type-muted group-hover:text-type">
                    <span className="type-eyebrow">Open</span>
                    <ArrowIcon size={15} />
                  </span>
                </div>
                {/* Mode only. The costed lines belong on the detail page — on a 264px card a
                    second line of small caps wrapped and pushed the scrim over the photograph. */}
                <p className="type-eyebrow mt-2 flex items-center gap-2">
                  <ModeIcon verdict={verdict} />
                  {verdict.recommended === 'car' ? 'Drive' : verdict.transit?.label}
                </p>
              </>
            )}
          </div>
        </div>
      </PhotoFrame>
    </Link>
  );
}
