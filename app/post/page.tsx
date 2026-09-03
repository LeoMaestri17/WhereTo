'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useMemo, useState } from 'react';
import { SmartImage } from '@/components/SmartImage';
import { Button, Chip, Panel } from '@/components/ui';
import { formatRange } from '@/lib/domain/logic';
import {
  INTEREST_LABELS,
  INTEREST_TAGS,
  type InterestTag,
  type Quest,
  type QuestKind,
} from '@/lib/domain/types';
import { IDEAS_BY_SLUG } from '@/lib/seed/ideas';
import { PHOTOS } from '@/lib/seed/images';
import { useStore } from '@/lib/store/StoreProvider';
import { currentUser } from '@/lib/store/selectors';
import { addDays, daysBetween, isoDate, toIsoDate } from '@/lib/util/dates';

/** A small, curated set to pick a cover from. A real build would take an upload. */
const COVER_CHOICES = [
  PHOTOS.joshuaTree,
  PHOTOS.zionRiver,
  PHOTOS.bigSurRoad,
  PHOTOS.sanDiegoHarbour,
  PHOTOS.vegasStrip,
  PHOTOS.goldenGate,
  PHOTOS.santaMonicaPier,
  PHOTOS.malibuRoad,
  PHOTOS.griffithObservatory,
  PHOTOS.basketballArena,
  PHOTOS.baseballStadium,
  PHOTOS.artGallery,
  PHOTOS.koreanBbq,
  PHOTOS.hikingTrail,
  PHOTOS.surfBeach,
  PHOTOS.concertCrowd,
  PHOTOS.thriftStore,
  PHOTOS.newYorkAutumn,
  PHOTOS.desertHighway,
  PHOTOS.campusLawn,
];

export default function PostPage() {
  return (
    <Suspense fallback={<p className="type-body text-muted">Opening the form.</p>}>
      <PostForm />
    </Suspense>
  );
}

interface Errors {
  title?: string;
  destination?: string;
  description?: string;
  dates?: string;
  deadline?: string;
  capacity?: string;
  meetingPoint?: string;
}

function PostForm() {
  const router = useRouter();
  const search = useSearchParams();
  const { state, dispatch } = useStore();
  const me = currentUser(state);

  const ideaSlug = search.get('idea');
  const idea = ideaSlug ? IDEAS_BY_SLUG[ideaSlug] : undefined;
  const plan = ideaSlug ? state.planCache[ideaSlug] : undefined;

  const [kind, setKind] = useState<QuestKind>(idea ? (idea.nights > 0 ? 'trip' : 'plan') : 'plan');
  const [title, setTitle] = useState(idea ? idea.title : '');
  const [destination, setDestination] = useState(idea ? idea.region.split(',')[0] : '');
  const [cover, setCover] = useState(idea ? idea.image : COVER_CHOICES[0]);
  const [startDate, setStartDate] = useState(plan?.request.startDate ?? isoDate(10));
  const [endDate, setEndDate] = useState(
    plan?.request.endDate ?? addDays(isoDate(10), idea?.nights ?? 2),
  );
  const [timeLabel, setTimeLabel] = useState('');
  const [capacity, setCapacity] = useState(plan?.request.groupSize ?? 6);
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState(() =>
    toIsoDate(new Date(Date.now() + 5 * 86_400_000)),
  );
  const [meetingPoint, setMeetingPoint] = useState('');
  const [tags, setTags] = useState<InterestTag[]>(idea?.tags.slice(0, 4) ?? []);
  const [attachPlan, setAttachPlan] = useState(Boolean(plan));
  const [errors, setErrors] = useState<Errors>({});

  const costEstimate = useMemo(() => {
    if (!attachPlan || !plan) return undefined;
    return {
      minPerPerson: plan.totalRangeMin,
      maxPerPerson: plan.totalRangeMax,
      basis: `Researched for ${plan.request.groupSize} people${
        plan.request.hasCar ? ' with a car' : ' with no car'
      }${plan.request.isOver21 ? '' : ', all under 21'}`,
    };
  }, [attachPlan, plan]);

  function validate(): Errors {
    const next: Errors = {};
    if (title.trim().length < 4) next.title = 'Give it a name people will recognise in a feed.';
    if (destination.trim().length < 2) next.destination = 'Where is it?';
    if (description.trim().length < 40)
      next.description =
        'Write a few sentences. What the plan is, what it costs, what people need to bring. This is the whole difference between a post people join and one they scroll past.';
    if (kind === 'trip' && daysBetween(startDate, endDate) < 1)
      next.dates = 'A trip needs at least one night. Post it as a plan if it is a single day.';
    if (new Date(`${deadline}T23:59`).getTime() <= Date.now())
      next.deadline = 'The deadline has to be in the future or nobody can join.';
    if (daysBetween(deadline, startDate) < 0)
      next.deadline = 'The deadline has to be on or before the day it happens.';
    if (capacity < 2) next.capacity = 'Two at minimum — you and somebody else.';
    if (meetingPoint.trim().length < 3) next.meetingPoint = 'Where are people meeting you?';
    return next;
  }

  function submit() {
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0 || !me) return;

    const quest: Quest = {
      id: `q-user-${Date.now().toString(36)}`,
      kind,
      title: title.trim(),
      destination: destination.trim(),
      cover,
      startDate,
      endDate: kind === 'trip' ? endDate : undefined,
      timeLabel: kind === 'plan' && timeLabel.trim() ? timeLabel.trim() : undefined,
      capacity,
      hostId: me.id,
      description: description.trim(),
      signupDeadline: new Date(`${deadline}T20:00`).toISOString(),
      costEstimate,
      attachedPlanSlug: attachPlan && plan ? plan.ideaSlug : undefined,
      lifecycle: 'active',
      tags,
      createdAt: new Date().toISOString(),
      meetingPoint: meetingPoint.trim(),
    };

    dispatch({ type: 'createQuest', quest, plan: attachPlan ? plan : undefined });
    router.push(`/quests/${quest.id}`);
  }

  return (
    <div className="max-w-2xl space-y-8">
      <header>
        <p className="type-micro text-accent">Post something</p>
        <h1 className="type-display mt-2">Commit first, and let people join you.</h1>
        <p className="type-body mt-2 text-muted">
          The whole app is this one thing: a date, a number of spots, and a deadline. You do not
          need a finished plan — you need to be the one who went first.
        </p>
      </header>

      {plan && idea ? (
        <Panel tone="accent">
          <p className="type-heading">Building on your {idea.title} research</p>
          <p className="type-body mt-1.5">
            {plan.options.length} costed options, a per-head range of{' '}
            {formatRange(plan.totalRangeMin, plan.totalRangeMax)}, and{' '}
            {plan.constraints.length} things flagged for your situation. Dates and group size
            below are prefilled from it.
          </p>
          <label className="mt-3 flex items-center gap-2">
            <input
              type="checkbox"
              checked={attachPlan}
              onChange={(e) => setAttachPlan(e.target.checked)}
              className="h-4 w-4 accent-[var(--accent)]"
            />
            <span className="type-meta">Attach the plan and its cost range to this post</span>
          </label>
        </Panel>
      ) : null}

      <Field label="Is this a trip or a plan?">
        <div className="flex gap-2">
          <Chip active={kind === 'plan'} onClick={() => setKind('plan')}>
            Plan — one day, local
          </Chip>
          <Chip active={kind === 'trip'} onClick={() => setKind('trip')}>
            Trip — overnight
          </Chip>
        </div>
      </Field>

      <Field label="What is it called?" error={errors.title}>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={
            kind === 'trip' ? 'Joshua Tree, two nights under the stars' : 'Dodgers day game, top deck'
          }
          className={inputClass(errors.title)}
        />
      </Field>

      <Field label="Where" error={errors.destination}>
        <input
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          placeholder={kind === 'trip' ? 'Joshua Tree National Park' : 'Dodger Stadium'}
          className={inputClass(errors.destination)}
        />
      </Field>

      <Field label="Cover photo">
        <p className="type-meta mb-2 text-muted">
          Pick one. Every card in this app carries a photograph, and yours will look wrong
          without one.
        </p>
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
          {COVER_CHOICES.map((photo) => (
            <button
              key={photo}
              type="button"
              onClick={() => setCover(photo)}
              aria-label="Use this photo"
              aria-pressed={cover === photo}
              className={`overflow-hidden rounded-lg border-2 transition-colors ${
                cover === photo ? 'border-accent' : 'border-transparent hover:border-line-strong'
              }`}
            >
              <SmartImage
                photoId={photo}
                alt="Cover option"
                width={160}
                height={120}
                className="aspect-[4/3] h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      </Field>

      <Field label={kind === 'trip' ? 'When you go and come back' : 'When'} error={errors.dates}>
        <div className="flex flex-wrap gap-3">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className={inputClass(errors.dates, 'w-auto')}
          />
          {kind === 'trip' ? (
            <input
              type="date"
              value={endDate}
              min={startDate}
              onChange={(e) => setEndDate(e.target.value)}
              className={inputClass(errors.dates, 'w-auto')}
            />
          ) : (
            <input
              value={timeLabel}
              onChange={(e) => setTimeLabel(e.target.value)}
              placeholder="1:10pm first pitch"
              className={inputClass(undefined, 'flex-1')}
            />
          )}
        </div>
      </Field>

      <Field
        label="How many spots, including you"
        error={errors.capacity}
        hint="You take one of these. People see the number left, and it is the thing that makes them decide."
      >
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label="One fewer"
            onClick={() => setCapacity((c) => Math.max(2, c - 1))}
            className="h-10 w-10 rounded-lg border border-line text-lg text-muted hover:text-ink"
          >
            −
          </button>
          <span className="type-title w-10 text-center tabular-nums">{capacity}</span>
          <button
            type="button"
            aria-label="One more"
            onClick={() => setCapacity((c) => Math.min(40, c + 1))}
            className="h-10 w-10 rounded-lg border border-line text-lg text-muted hover:text-ink"
          >
            +
          </button>
        </div>
      </Field>

      <Field
        label="Sign-ups close on"
        error={errors.deadline}
        hint="Pick the day you need to book by. A visible countdown is what turns a maybe into a yes."
      >
        <input
          type="date"
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
          className={inputClass(errors.deadline, 'w-auto')}
        />
      </Field>

      <Field label="Where are people meeting you?" error={errors.meetingPoint}>
        <input
          value={meetingPoint}
          onChange={(e) => setMeetingPoint(e.target.value)}
          placeholder="Jefferson & Hoover, outside the 7-Eleven"
          className={inputClass(errors.meetingPoint)}
        />
      </Field>

      <Field label="Tell people what this actually is" error={errors.description}>
        <textarea
          rows={7}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What the plan is, roughly what it costs, what they need to bring, and anything that would put somebody off if they found out afterwards."
          className={inputClass(errors.description)}
        />
        <p className="type-meta mt-1 text-faint">{description.trim().length} characters</p>
      </Field>

      <Field label="Tags">
        <div className="flex flex-wrap gap-2">
          {INTEREST_TAGS.map((tag) => (
            <Chip
              key={tag}
              active={tags.includes(tag)}
              onClick={() =>
                setTags((prev) =>
                  prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
                )
              }
            >
              {INTEREST_LABELS[tag]}
            </Chip>
          ))}
        </div>
      </Field>

      {Object.keys(errors).length > 0 ? (
        <Panel tone="danger">
          <p className="type-heading text-danger">Not quite ready to post</p>
          <ul className="mt-1.5 space-y-1">
            {Object.values(errors).map((e, i) => (
              <li key={i} className="type-body text-ink/80">
                {e}
              </li>
            ))}
          </ul>
        </Panel>
      ) : null}

      <div className="flex flex-wrap items-center gap-3 border-t border-line pt-5">
        <Button size="lg" onClick={submit}>
          Post it
        </Button>
        <Link href="/" className="type-meta text-muted underline hover:text-ink">
          Not now
        </Link>
      </div>
    </div>
  );
}

function inputClass(error?: string, extra = 'w-full') {
  return `${extra} rounded-lg border bg-surface px-3 py-2 type-body placeholder:text-faint ${
    error ? 'border-danger' : 'border-line'
  }`;
}

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="type-heading block">{label}</label>
      {hint ? <p className="type-meta mt-0.5 text-muted">{hint}</p> : null}
      <div className="mt-2">{children}</div>
      {error ? <p className="type-meta mt-1.5 text-danger">{error}</p> : null}
    </div>
  );
}
