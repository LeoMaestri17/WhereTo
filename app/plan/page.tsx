'use client';

import Link from 'next/link';
import { useMemo, useState, type ReactNode } from 'react';
import { SmartImage } from '@/components/SmartImage';
import { Toggle } from '@/components/Onboarding';
import { Button } from '@/components/ui';
import { BUDGET_BAND_LABELS, type BudgetBand } from '@/lib/domain/types';
import { datesFor, encodeBrief, EMPTY_BRIEF } from '@/lib/intake/brief';
import { recommendDestinations, type Recommendation } from '@/lib/intake/match';
import {
  COMPANION_LABELS,
  TRIP_LENGTH_LABELS,
  TRIP_LENGTH_NIGHTS,
  VIBE_LABELS,
  WHEN_LABELS,
  deriveOccupancy,
  type Companions,
  type TripBrief,
  type TripLength,
  type Vibe,
  type WhenWindow,
} from '@/lib/intake/types';
import { useStore } from '@/lib/store/StoreProvider';
import { currentUser } from '@/lib/store/selectors';
import { formatDateRange } from '@/lib/util/dates';

/**
 * The guided picker: the way in for somebody who wants to go somewhere but has no idea where.
 *
 * Every question is answered by clicking. There is exactly one free-text box in the whole flow,
 * at the end, for the thing none of the questions asked about. That is deliberate — a blank
 * "describe your trip" prompt puts the hard part of the job on the person who came here because
 * they did not know what they wanted.
 *
 * Each question carries a line saying why it is being asked, because every one of them changes a
 * number downstream. Who you are going with decides the room count; being under 21 decides
 * whether a rental car is even possible. Asking without explaining is an interrogation.
 */

type StepId = 'who' | 'size' | 'length' | 'when' | 'budget' | 'vibes' | 'constraints';

export default function PlanPage() {
  const { state } = useStore();
  const me = currentUser(state);

  const [brief, setBrief] = useState<TripBrief>(() => ({
    ...EMPTY_BRIEF,
    isOver21: (me?.age ?? 20) >= 21,
    hasCar: me?.hasCar ?? false,
    hasUsCreditCard: me?.hasUsCreditCard ?? false,
  }));
  const [index, setIndex] = useState(0);
  const [done, setDone] = useState(false);
  /**
   * Which questions have actually been answered. The brief starts with sensible values so that
   * every downstream call has something to work with, but showing those as selected would be a
   * lie — it tells you you have answered a question you have not yet seen.
   */
  const [answered, setAnswered] = useState<StepId[]>([]);

  const set = <K extends keyof TripBrief>(key: K, value: TripBrief[K]) =>
    setBrief((b) => ({ ...b, [key]: value }));

  /** Party size is only a question when there is a party. */
  const steps: StepId[] = useMemo(() => {
    const base: StepId[] = ['who', 'size', 'length', 'when', 'budget', 'vibes', 'constraints'];
    return brief.companions === 'solo' || brief.companions === 'partner'
      ? base.filter((s) => s !== 'size')
      : base;
  }, [brief.companions]);

  const step = steps[Math.min(index, steps.length - 1)];
  const last = index >= steps.length - 1;

  /** Picking an answer to a single-choice question moves you on. No "next" to hunt for. */
  const advance = () => {
    setAnswered((a) => (a.includes(step) ? a : [...a, step]));
    if (last) setDone(true);
    else setIndex((i) => i + 1);
  };

  const choose = <K extends keyof TripBrief>(key: K, value: TripBrief[K]) => {
    set(key, value);
    // Party size follows from who: a couple is two, and asking again would be rude.
    if (key === 'companions') {
      const who = value as Companions;
      setBrief((b) => ({
        ...b,
        companions: who,
        partySize: who === 'solo' ? 1 : who === 'partner' ? 2 : b.partySize < 3 ? 4 : b.partySize,
      }));
    }
    advance();
  };

  if (done) {
    return <Results brief={brief} onEdit={() => { setDone(false); setIndex(0); }} />;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <header>
        <Link href="/" className="type-meta text-muted hover:text-ink">
          ← Back to the ideas
        </Link>
        <div className="mt-4 flex items-center gap-1.5" aria-hidden>
          {steps.map((s, i) => (
            <span
              key={s}
              className={`h-1 flex-1 rounded-full transition-colors ${
                i <= index ? 'bg-accent' : 'bg-surface-3'
              }`}
            />
          ))}
        </div>
        <p className="type-micro mt-2 text-faint">
          Question {index + 1} of {steps.length}
        </p>
      </header>

      {step === 'who' ? (
        <Question
          title="Who are you going with?"
          why="It sets the rooms. Two of you is one double; four friends is one room or four hostel beds, and that is the single biggest thing that moves a price per head."
        >
          <Boxes>
            {(['friends', 'partner', 'solo', 'family'] as Companions[]).map((c) => (
              <Box
                key={c}
                selected={answered.includes('who') && brief.companions === c}
                onClick={() => choose('companions', c)}
                label={COMPANION_LABELS[c]}
                detail={COMPANION_DETAIL[c]}
              />
            ))}
          </Boxes>
        </Question>
      ) : null}

      {step === 'size' ? (
        <Question
          title="How many of you altogether?"
          why="Including you. It decides how many rooms we price and how the car, the petrol and the parking split."
        >
          <Boxes>
            {[2, 3, 4, 5, 6, 8].map((n) => (
              <Box
                key={n}
                selected={answered.includes('size') && brief.partySize === n}
                onClick={() => choose('partySize', n)}
                label={`${n} of us`}
                detail={deriveOccupancy(brief.companions, n).note}
              />
            ))}
          </Boxes>
        </Question>
      ) : null}

      {step === 'length' ? (
        <Question
          title="How long have you got?"
          why="Nights away, which is the number every hotel and campsite line is multiplied by."
        >
          <Boxes>
            {(['evening', 'day', 'weekend', 'long-weekend', 'week'] as TripLength[]).map((l) => (
              <Box
                key={l}
                selected={answered.includes('length') && brief.length === l}
                onClick={() => choose('length', l)}
                label={TRIP_LENGTH_LABELS[l]}
                detail={
                  TRIP_LENGTH_NIGHTS[l] === 0
                    ? 'Back the same night'
                    : `${TRIP_LENGTH_NIGHTS[l]} ${TRIP_LENGTH_NIGHTS[l] === 1 ? 'night' : 'nights'} away`
                }
              />
            ))}
          </Boxes>
        </Question>
      ) : null}

      {step === 'when' ? (
        <Question
          title="When are you thinking?"
          why="Prices are for real dates or they are not prices. We take the next sensible departure in the window you pick and you can move it after."
        >
          <Boxes>
            {(['this-weekend', 'next-2-weeks', 'next-month', 'the-break'] as WhenWindow[]).map(
              (w) => {
                const dates = datesFor(w, brief.length);
                return (
                  <Box
                    key={w}
                    selected={answered.includes('when') && brief.when === w}
                    onClick={() => choose('when', w)}
                    label={WHEN_LABELS[w]}
                    detail={formatDateRange(dates.startDate, dates.endDate)}
                  />
                );
              },
            )}
          </Boxes>
        </Question>
      ) : null}

      {step === 'budget' ? (
        <Question
          title="What can you spend, each?"
          why="Everything on the way out. Nothing gets recommended above this without saying so on the card."
        >
          <Boxes>
            {(['shoestring', 'moderate', 'comfortable'] as BudgetBand[]).map((b) => (
              <Box
                key={b}
                selected={answered.includes('budget') && brief.budget === b}
                onClick={() => choose('budget', b)}
                label={BUDGET_BAND_LABELS[b]}
                detail={BUDGET_DETAIL[b]}
              />
            ))}
          </Boxes>
        </Question>
      ) : null}

      {step === 'vibes' ? (
        <Question
          title="What sort of thing?"
          why="Pick as many as you like, or none — it only shifts the order of what we suggest."
        >
          <Boxes>
            {(Object.keys(VIBE_LABELS) as Vibe[]).map((v) => (
              <Box
                key={v}
                selected={brief.vibes.includes(v)}
                multi
                onClick={() =>
                  set(
                    'vibes',
                    brief.vibes.includes(v)
                      ? brief.vibes.filter((x) => x !== v)
                      : [...brief.vibes, v],
                  )
                }
                label={VIBE_LABELS[v]}
              />
            ))}
          </Boxes>
          <div className="mt-6 flex items-center gap-3">
            <Button size="lg" onClick={advance}>
              {brief.vibes.length ? 'Carry on' : 'No preference'}
            </Button>
            <BackLink index={index} setIndex={setIndex} />
          </div>
        </Question>
      ) : null}

      {step === 'constraints' ? (
        <Question
          title="Last three, and they matter most"
          why="These are the ones that change whether an option exists at all, not just what it costs. Nobody else asks them, which is why the numbers you see elsewhere are wrong for you."
        >
          <div className="space-y-2">
            <Toggle
              label="Somebody in the group is 21 or over"
              detail="Under 21 you cannot hire a car in California at all, and a lot of the evening is closed to you."
              value={brief.isOver21}
              onChange={(v) => set('isOver21', v)}
            />
            <Toggle
              label="One of you has a car here"
              detail="If not, anything that needs driving gets priced as a hire with the under-25 surcharge, or gets left out."
              value={brief.hasCar}
              onChange={(v) => set('hasCar', v)}
            />
            <Toggle
              label="Someone has a US credit card"
              detail="Deposit holds on hire cars and some hotels do not work on a foreign debit card. It is a real blocker, not a detail."
              value={brief.hasUsCreditCard}
              onChange={(v) => set('hasUsCreditCard', v)}
            />
          </div>

          <label className="mt-6 block">
            <span className="type-heading">Anything else? Optional.</span>
            <span className="type-meta mt-0.5 block text-muted">
              A place you already had in mind, someone who cannot walk far, a birthday. It goes to
              the research alongside the rest.
            </span>
            <textarea
              value={brief.anythingElse}
              onChange={(e) => set('anythingElse', e.target.value)}
              rows={2}
              maxLength={200}
              placeholder="One of us cannot drive and we want to be back by Sunday evening."
              className="mt-2 w-full rounded-lg border border-line bg-surface px-3 py-2 type-body placeholder:text-faint"
            />
          </label>

          <div className="mt-6 flex items-center gap-3">
            <Button size="lg" onClick={() => setDone(true)}>
              Show me where to go
            </Button>
            <BackLink index={index} setIndex={setIndex} />
          </div>
        </Question>
      ) : null}

      {step !== 'vibes' && step !== 'constraints' ? (
        <BackLink index={index} setIndex={setIndex} />
      ) : null}
    </div>
  );
}

const COMPANION_DETAIL: Record<Companions, string> = {
  solo: 'A hostel bed and nothing to split',
  partner: 'One room, priced for two',
  friends: 'Sharing rooms, or hostel beds',
  family: 'Separate rooms, no dorms',
};

const BUDGET_DETAIL: Record<BudgetBand, string> = {
  shoestring: 'Under about $160 each',
  moderate: 'Up to about $320 each',
  comfortable: 'Up to about $700 each',
};

function Question({ title, why, children }: { title: string; why: string; children: ReactNode }) {
  return (
    <section>
      <h1 className="type-display">{title}</h1>
      <p className="type-body mt-2 max-w-xl text-muted">{why}</p>
      <div className="mt-6">{children}</div>
    </section>
  );
}

function Boxes({ children }: { children: ReactNode }) {
  return <div className="grid gap-2.5 sm:grid-cols-2">{children}</div>;
}

function Box({
  label,
  detail,
  selected,
  multi = false,
  onClick,
}: {
  label: string;
  detail?: string;
  selected: boolean;
  multi?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={multi ? selected : undefined}
      className={`rounded-xl border p-4 text-left transition-colors ${
        selected
          ? 'border-accent bg-accent-soft'
          : 'border-line bg-surface hover:border-line-strong'
      }`}
    >
      <span className="type-body block font-medium">{label}</span>
      {detail ? <span className="type-meta mt-1 block text-muted">{detail}</span> : null}
    </button>
  );
}

function BackLink({ index, setIndex }: { index: number; setIndex: (n: number) => void }) {
  if (index === 0) return null;
  return (
    <button
      type="button"
      onClick={() => setIndex(index - 1)}
      className="type-meta text-muted underline hover:text-ink"
    >
      Change the last answer
    </button>
  );
}

/* ------------------------------------------------------------------ the recommendation */

function Results({ brief, onEdit }: { brief: TripBrief; onEdit: () => void }) {
  const picks = useMemo(() => recommendDestinations(brief), [brief]);
  const dates = datesFor(brief.when, brief.length);
  const occupancy = deriveOccupancy(brief.companions, brief.partySize);
  const query = encodeBrief(brief);

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <header>
        <p className="type-micro text-accent">Based on what you said</p>
        <h1 className="type-display mt-2">
          {picks.length === 0 ? 'Nothing here fits that' : 'Three that actually fit'}
        </h1>
        <p className="type-body mt-2 max-w-2xl text-muted">
          {occupancy.note}, {formatDateRange(dates.startDate, dates.endDate)}
          {brief.isOver21 ? '' : ', nobody over 21'}
          {brief.hasCar ? ', one car between you' : ', no car'}. Pick one and it will go and find
          what it really costs on those dates.
        </p>
        <button
          type="button"
          onClick={onEdit}
          className="type-meta mt-3 text-muted underline hover:text-ink"
        >
          Answer the questions again
        </button>
      </header>

      {picks.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line p-6">
          <p className="type-heading">Everything that fits needs a driver</p>
          <p className="type-body mt-1.5 text-muted">
            With nobody over 21 and no car, the destinations left are the ones you can reach on
            transit. Go back and change either of those, or browse the day trips — most of them
            are a bus ride.
          </p>
          <Link href="/ideas" className="type-body mt-3 inline-block font-medium text-accent">
            Browse the day trips →
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {picks.map((rec) => (
            <RecommendationCard key={rec.idea.slug} rec={rec} query={query} />
          ))}
        </div>
      )}

      <footer className="border-t border-line pt-6">
        <p className="type-meta text-faint">
          These come from the idea bank, ordered by what you answered — no prices have been looked
          up yet. That happens on the next screen, against the real dates.
        </p>
      </footer>
    </div>
  );
}

function RecommendationCard({ rec, query }: { rec: Recommendation; query: string }) {
  const { idea } = rec;
  return (
    <Link
      href={`/ideas/${idea.slug}?${query}`}
      className="group block overflow-hidden rounded-2xl border border-line bg-surface transition-colors hover:border-accent sm:flex"
    >
      <div className="relative aspect-[16/9] shrink-0 overflow-hidden bg-surface-2 sm:aspect-auto sm:w-56">
        <SmartImage
          photoId={idea.image}
          alt={idea.title}
          width={480}
          height={360}
          sizes="(max-width: 640px) 100vw, 224px"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
      </div>
      <div className="min-w-0 flex-1 p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <h2 className="type-title">{idea.title}</h2>
          {rec.ourPick ? <span className="type-micro text-accent">Our pick</span> : null}
        </div>
        {/* `region` carries the distance too, so take only the place off it — otherwise the line
            reads "130 mi east · 130 mi · 2h30 driving". */}
        <p className="type-meta mt-0.5 text-faint">
          {idea.region.split(',')[0]} · {idea.distanceLabel}
        </p>
        <p className="type-body mt-2 text-muted">{rec.why}</p>
        {rec.catch ? (
          <p className="type-meta mt-2 border-l-2 border-line-strong pl-3 text-muted">
            {rec.catch}
          </p>
        ) : null}
        <p className="type-body mt-3 font-medium">
          Roughly ${rec.perPersonMin}–{rec.perPersonMax} each
          <span className="type-meta ml-2 font-normal text-faint">
            {rec.hasSavedPlan ? 'costed plan ready' : 'not priced yet'}
          </span>
        </p>
      </div>
    </Link>
  );
}
