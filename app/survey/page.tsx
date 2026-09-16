'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { SmartImage } from '@/components/SmartImage';
import {
  CalendarIcon,
  CarIcon,
  Eyebrow,
  GlassPanel,
  PeopleIcon,
  PhotoFrame,
  PillButton,
  PinIcon,
} from '@/components/nocturne/primitives';
import { MEASURE } from '@/components/nocturne/measure';
import { DEFAULT_BRIEF, ORIGINS, saveBrief, type Brief } from '@/lib/mvp/brief';
import {
  AGE_BAND_LABELS,
  PARTY_SIZES,
  WEEKENDS,
  type AgeBand,
  type PartySize,
  type WeekendId,
} from '@/lib/mvp/model';
import {
  WEEKDAY_INITIALS,
  dayOfMonth,
  formatDateRange,
  monthGrid,
  shiftMonth,
} from '@/lib/util/dates';
import { PHOTOS } from '@/lib/seed/images';

/**
 * The survey.
 *
 * One question a screen, each on its own full-bleed photograph, answers anchored to the bottom
 * third. Five questions, or four when nobody has a licence — the age question has no answer in
 * that case, so it is skipped rather than shown greyed out.
 */

type StepId = 'from' | 'when' | 'who' | 'licence' | 'age';

/*
 * Daylight shots, deliberately.
 *
 * The first pass used the night photographs — the freeway at night, the desert highway — and then
 * put the veil scrim on top of them. The result was a black panel: the image was loading fine and
 * contributing nothing. A veil needs something bright underneath it to be a veil rather than a
 * fill.
 */
const PHOTO: Record<StepId, string> = {
  from: PHOTOS.hollywoodSign,
  when: PHOTOS.hikingTrail,
  who: PHOTOS.hikingHills,
  licence: PHOTOS.malibuRoad,
  age: PHOTOS.bigSurRoad,
};

export default function SurveyPage() {
  const router = useRouter();
  const [draft, setDraft] = useState<Brief>(() => ({ ...DEFAULT_BRIEF }));
  const [index, setIndex] = useState(0);
  const [chosenWeekend, setChosenWeekend] = useState<WeekendId | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  const steps: StepId[] = draft.driver.hasLicence
    ? ['from', 'when', 'who', 'licence', 'age']
    : ['from', 'when', 'who', 'licence'];

  const step = steps[Math.min(index, steps.length - 1)];
  const done = index >= steps.length;

  const finish = useCallback(
    (brief: Brief) => {
      saveBrief(brief);
      router.push('/trips');
    },
    [router],
  );

  useEffect(() => {
    if (done) finish(draft);
  }, [done, draft, finish]);

  useEffect(() => {
    headingRef.current?.focus();
  }, [index]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && index > 0) setIndex((i) => i - 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [index]);

  const next = () => setIndex((i) => i + 1);

  return (
    <main className="min-h-dvh">
      <PhotoFrame
        key={step}
        scrim="veil"
        className="min-h-dvh"
        image={
          <SmartImage
            photoId={PHOTO[step]}
            alt=""
            width={2000}
            height={1400}
            sizes="100vw"
            className="sq-graded h-full w-full object-cover"
          />
        }
      >
        <header className={`${MEASURE} flex items-center justify-between gap-6 pt-7`}>
          <button
            type="button"
            onClick={() => setIndex((i) => Math.max(0, i - 1))}
            disabled={index === 0}
            className="type-eyebrow sq-ease text-type disabled:opacity-25"
          >
            {index === 0 ? 'WhereTo' : '← Back'}
          </button>
          <div
            className="flex items-center gap-2"
            aria-label={`Question ${index + 1} of ${steps.length}`}
          >
            {steps.map((s, i) => (
              <span
                key={s}
                aria-hidden
                className="sq-ease h-[3px] rounded-full"
                style={{
                  width: i === index ? 26 : 14,
                  background: i <= index ? 'var(--sand)' : 'var(--hairline-strong)',
                }}
              />
            ))}
          </div>
        </header>

        <div className={`${MEASURE} mt-auto pb-20 sm:pb-24`}>
          {step === 'from' ? (
            <Question
              ref={headingRef}
              icon={<PinIcon size={15} className="text-sand" />}
              eyebrow="Question one"
              heading="Where are you leaving from?"
              body="Everything is costed from your doorstep out — the train, the flight, the fuel and the hire all depend on where the trip starts."
            >
              <div className="flex flex-wrap gap-3">
                {ORIGINS.map((o) => (
                  <PillButton
                    key={o.id}
                    variant={draft.origin === o.id ? 'solid' : 'outline'}
                    size="lg"
                    onClick={() => {
                      setDraft((d) => ({ ...d, origin: o.id }));
                      next();
                    }}
                  >
                    {o.name}
                  </PillButton>
                ))}
              </div>
              <p className="type-eyebrow mt-5 font-medium text-type">More cities coming soon</p>
            </Question>
          ) : step === 'when' ? (
            <Question
              ref={headingRef}
              icon={<CalendarIcon size={15} className="text-sand" />}
              eyebrow="Question two"
              heading="When are you free?"
              body="Pick the Friday you leave and the Sunday you come back. Highlighted dates are the ones we have costed."
            >
              {/* Null, not draft.weekend. The brief needs a default for everything downstream,
                  but showing it as already chosen would let somebody walk past this question
                  without answering it and believe they had. */}
              <Calendar
                selected={chosenWeekend}
                onSelect={(id) => {
                  setChosenWeekend(id);
                  setDraft((d) => ({ ...d, weekend: id }));
                  next();
                }}
              />
            </Question>
          ) : step === 'who' ? (
            <Question
              ref={headingRef}
              icon={<PeopleIcon size={15} className="text-sand" />}
              eyebrow="Question three"
              heading="How many of you?"
              body="This changes more than it looks. Park entry is charged per car, hire and fuel split across everyone, and a room is a room whether one of you or two is in it."
            >
              <div className="flex flex-wrap gap-3">
                {PARTY_SIZES.map((n) => (
                  <PillButton
                    key={n}
                    variant={draft.partySize === n ? 'solid' : 'outline'}
                    size="lg"
                    className="min-w-[4.25rem]"
                    onClick={() => {
                      setDraft((d) => ({ ...d, partySize: n as PartySize }));
                      next();
                    }}
                  >
                    {n}
                  </PillButton>
                ))}
              </div>
            </Question>
          ) : step === 'licence' ? (
            <Question
              ref={headingRef}
              icon={<CarIcon size={15} className="text-sand" />}
              eyebrow="Question four"
              heading="Does anyone have a driving licence?"
              body="A foreign licence counts. Some of these trips have no realistic way in without a car, so this decides what you are shown rather than only what it costs."
            >
              <div className="flex flex-wrap gap-3">
                <PillButton
                  variant="outline"
                  size="lg"
                  onClick={() => {
                    setDraft((d) => ({ ...d, driver: { hasLicence: true, ageBand: '25-plus' } }));
                    next();
                  }}
                >
                  Yes, someone does
                </PillButton>
                <PillButton
                  variant="outline"
                  size="lg"
                  onClick={() => {
                    const brief: Brief = {
                      ...draft,
                      driver: { hasLicence: false, ageBand: null },
                    };
                    setDraft(brief);
                    finish(brief);
                  }}
                >
                  No, nobody
                </PillButton>
              </div>
            </Question>
          ) : (
            <Question
              ref={headingRef}
              icon={<CarIcon size={15} className="text-sand" />}
              eyebrow="Question five"
              heading="How old is whoever would drive?"
              body="21 decides whether a hire is possible at all — no major agency in California rents below it. 25 decides what it costs, because under that there is a surcharge on every day."
            >
              <div className="flex flex-wrap gap-3">
                {(Object.keys(AGE_BAND_LABELS) as AgeBand[]).map((band) => (
                  <PillButton
                    key={band}
                    variant={draft.driver.ageBand === band ? 'solid' : 'outline'}
                    size="lg"
                    onClick={() => {
                      const brief: Brief = {
                        ...draft,
                        driver: { hasLicence: true, ageBand: band },
                      };
                      setDraft(brief);
                      finish(brief);
                    }}
                  >
                    {AGE_BAND_LABELS[band]}
                  </PillButton>
                ))}
              </div>
            </Question>
          )}
        </div>
      </PhotoFrame>
    </main>
  );
}

/* ------------------------------------------------------------------ the calendar */

/** Every date inside a bookable weekend, mapped back to the weekend it belongs to. */
const BOOKABLE = new Map<string, (typeof WEEKENDS)[number]['id']>();
for (const w of WEEKENDS) {
  const start = new Date(`${w.startDate}T12:00:00`);
  for (let i = 0; i <= w.nights; i += 1) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    BOOKABLE.set(d.toISOString().slice(0, 10), w.id);
  }
}

const FIRST_WEEKEND = WEEKENDS[0];
const DEFAULT_VIEW = {
  year: Number(FIRST_WEEKEND.startDate.slice(0, 4)),
  month: Number(FIRST_WEEKEND.startDate.slice(5, 7)) - 1,
};

/**
 * A real month grid where the trip is selected as a range.
 *
 * Two clicks, not one: the first sets the departure, the second the return, and the days between
 * fill in as you go. A pair of pills would have been a tenth of the code, but it would not have
 * told anyone what they were choosing — a date picker is how people understand a trip, and the
 * range is the trip.
 *
 * A second click that does not complete a costed weekend becomes a new first click rather than an
 * error. There is nothing to apologise for and nowhere for an error message to usefully go.
 */
function Calendar({
  selected,
  onSelect,
}: {
  selected: WeekendId | null;
  onSelect: (id: WeekendId) => void;
}) {
  const [view, setView] = useState(DEFAULT_VIEW);
  const [anchor, setAnchor] = useState<string | null>(null);
  const [hover, setHover] = useState<string | null>(null);

  const grid = monthGrid(view.year, view.month);
  const chosen = WEEKENDS.find((w) => w.id === selected);

  /* The range being drawn right now: the confirmed selection, or the anchor plus whatever the
     cursor is over. */
  const draft = anchor
    ? { from: anchor, to: hover ?? anchor }
    : chosen
      ? { from: chosen.startDate, to: chosen.endDate }
      : null;

  const inDraft = (iso: string) => {
    if (!draft) return false;
    const [lo, hi] = draft.from <= draft.to ? [draft.from, draft.to] : [draft.to, draft.from];
    return iso >= lo && iso <= hi;
  };

  /**
   * Two clicks inside the same costed weekend select it, and the range snaps to that weekend's
   * real start and end dates.
   *
   * Demanding the exact endpoints was the first version and it was wrong: a reader sees the 2nd,
   * 3rd and 4th all lit and reasonably clicks the 2nd and the 3rd, which is not a pair, and
   * nothing happens with nothing to explain why. Snapping means any two taps in the highlighted
   * block give the dates we actually costed.
   */
  const click = (iso: string) => {
    const weekendOf = BOOKABLE.get(iso);
    if (!anchor) {
      setAnchor(iso);
      return;
    }
    if (weekendOf && weekendOf === BOOKABLE.get(anchor)) {
      setAnchor(null);
      setHover(null);
      onSelect(weekendOf);
    } else {
      // A different weekend. Treat it as the start of a new attempt.
      setAnchor(iso);
    }
  };

  return (
    <GlassPanel className="max-w-sm">
      <div className="mb-4 flex items-center justify-between">
        <Eyebrow>{grid.label}</Eyebrow>
        <div className="flex gap-1.5">
          <Arrow label="Previous month" onClick={() => setView((v) => shiftMonth(v.year, v.month, -1))}>
            ‹
          </Arrow>
          <Arrow label="Next month" onClick={() => setView((v) => shiftMonth(v.year, v.month, 1))}>
            ›
          </Arrow>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-y-1" role="grid" aria-label="Choose your dates">
        {WEEKDAY_INITIALS.map((d, i) => (
          <div key={i} className="type-eyebrow pb-2 text-center text-type-muted">
            {d}
          </div>
        ))}

        {grid.weeks.flat().map((iso, i) => {
          if (!iso) return <div key={`pad-${i}`} aria-hidden />;

          const bookable = BOOKABLE.has(iso);
          const marked = inDraft(iso) && bookable;
          const isEnd = draft && (iso === draft.from || iso === draft.to) && bookable;

          return (
            <div key={iso} className="flex justify-center py-0.5">
              <button
                type="button"
                disabled={!bookable}
                aria-pressed={marked}
                onClick={() => click(iso)}
                onMouseEnter={() => anchor && setHover(iso)}
                onFocus={() => anchor && setHover(iso)}
                /* Four states, told apart by fill and ring as well as colour — hue alone fails
                   for a colour-blind reader, and it failed for everyone over a bright photo. */
                /* A border rather than ring-*: Tailwind v4's ring utilities were computing to a
                   transparent zero-spread shadow here, so the outline simply was not drawn. A 1px
                   border is box-sizing safe on a fixed 36px circle and leaves nothing to guess. */
                className={`sq-ease flex h-9 w-9 items-center justify-center rounded-full border text-[0.8125rem] ${
                  !bookable
                    ? 'cursor-default border-transparent text-type-muted'
                    : isEnd
                      ? 'border-sand bg-sand font-medium text-ground'
                      : marked
                        ? 'border-[rgba(201,174,135,0.55)] bg-[rgba(180,155,116,0.32)] font-medium text-type'
                        : 'border-[rgba(201,174,135,0.5)] bg-[rgba(180,155,116,0.16)] font-medium text-sand-2 hover:bg-[rgba(180,155,116,0.32)]'
                }`}
              >
                {dayOfMonth(iso)}
              </button>
            </div>
          );
        })}
      </div>

      <p className="type-body mt-5 text-type">
        {anchor
          ? 'Now pick the day you come back.'
          : chosen
            ? `${formatDateRange(chosen.startDate, chosen.endDate)} · ${chosen.nights} nights`
            : 'Pick the day you leave.'}
      </p>
    </GlassPanel>
  );
}

function Arrow({
  children,
  label,
  onClick,
}: {
  children: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="sq-ease flex h-8 w-8 items-center justify-center rounded-full border border-hairline-strong text-[1rem] leading-none text-type hover:bg-[rgba(244,241,232,0.08)]"
    >
      {children}
    </button>
  );
}

/* ------------------------------------------------------------------ question shell */

function Question({
  icon,
  eyebrow,
  heading,
  body,
  children,
  ref,
}: {
  icon: ReactNode;
  eyebrow: string;
  heading: string;
  body: string;
  children: ReactNode;
  ref: React.Ref<HTMLHeadingElement>;
}) {
  return (
    <div className="max-w-2xl">
      <Eyebrow className="sq-rise sq-rise-1 flex items-center gap-2.5 font-medium text-type">
        {icon}
        {eyebrow}
      </Eyebrow>
      <h1
        ref={ref}
        tabIndex={-1}
        className="type-hero sq-rise sq-rise-2 mt-5 text-type outline-none"
      >
        {heading}
      </h1>
      <p className="type-body-lg sq-rise sq-rise-3 mt-5 max-w-lg">{body}</p>
      <div className="sq-rise sq-rise-4 mt-9">{children}</div>
    </div>
  );
}
