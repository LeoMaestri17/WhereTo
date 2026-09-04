'use client';

import { useState } from 'react';
import { Toggle } from '@/components/Onboarding';
import { Button, Chip } from '@/components/ui';
import {
  BUDGET_BAND_LABELS,
  INTEREST_LABELS,
  INTEREST_TAGS,
  type BudgetBand,
  type InterestTag,
} from '@/lib/domain/types';
import type { Idea } from '@/lib/domain/types';
import type { ResearchRequest } from '@/lib/research/types';
import { addDays, daysBetween } from '@/lib/util/dates';

export interface PlannerValues {
  startDate: string;
  endDate: string;
  groupSize: number;
  hasCar: boolean;
  isOver21: boolean;
  hasUsCreditCard: boolean;
  budgetBand: BudgetBand;
  moods: InterestTag[];
}

export function toResearchRequest(idea: Idea, values: PlannerValues): ResearchRequest {
  return {
    ideaSlug: idea.slug,
    ideaTitle: idea.title,
    region: idea.region,
    shape: idea.shape,
    ...values,
  };
}

const BANDS: BudgetBand[] = ['shoestring', 'moderate', 'comfortable'];

/**
 * Changing anything here changes the plan, so the form says so and the submit button re-labels
 * itself once a plan already exists. Dates prefill to the next sensible window for the shape of
 * the trip rather than to today.
 */
export function PlannerForm({
  idea,
  values,
  onChange,
  onSubmit,
  busy,
  dirty,
  hasPlan,
}: {
  idea: Idea;
  values: PlannerValues;
  onChange: (next: PlannerValues) => void;
  onSubmit: () => void;
  busy: boolean;
  dirty: boolean;
  hasPlan: boolean;
}) {
  const [showAllInterests, setShowAllInterests] = useState(false);
  const set = <K extends keyof PlannerValues>(key: K, value: PlannerValues[K]) =>
    onChange({ ...values, [key]: value });

  const nights = Math.max(0, daysBetween(values.startDate, values.endDate));
  const interestChoices = showAllInterests ? INTEREST_TAGS : idea.tags;

  return (
    <form
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <fieldset className="space-y-3">
        <legend className="type-heading">When</legend>
        <div className="flex flex-wrap items-end gap-3">
          <label className="block">
            <span className="type-meta text-muted">Leaving</span>
            <input
              type="date"
              value={values.startDate}
              onChange={(e) => {
                const start = e.target.value;
                const end =
                  daysBetween(start, values.endDate) < 0
                    ? addDays(start, Math.max(idea.nights, 0))
                    : values.endDate;
                onChange({ ...values, startDate: start, endDate: end });
              }}
              className="mt-1 block rounded-lg border border-line bg-surface px-3 py-2 type-body"
            />
          </label>
          {idea.nights > 0 ? (
            <label className="block">
              <span className="type-meta text-muted">Back</span>
              <input
                type="date"
                value={values.endDate}
                min={values.startDate}
                onChange={(e) => set('endDate', e.target.value)}
                className="mt-1 block rounded-lg border border-line bg-surface px-3 py-2 type-body"
              />
            </label>
          ) : null}
          <p className="type-meta pb-2.5 text-muted">
            {nights === 0 ? 'One day, no overnight' : `${nights} night${nights === 1 ? '' : 's'}`}
          </p>
        </div>
      </fieldset>

      <fieldset>
        <legend className="type-heading">How many of you</legend>
        <p className="type-meta mt-1 text-muted">
          This is the number that moves the cost most. Fuel, rooms and campsites all split.
        </p>
        <div className="mt-2 flex items-center gap-3">
          <button
            type="button"
            aria-label="One fewer"
            onClick={() => set('groupSize', Math.max(1, values.groupSize - 1))}
            className="h-10 w-10 rounded-lg border border-line text-lg text-muted hover:text-ink"
          >
            −
          </button>
          <span className="type-title w-10 text-center tabular-nums">{values.groupSize}</span>
          <button
            type="button"
            aria-label="One more"
            onClick={() => set('groupSize', Math.min(20, values.groupSize + 1))}
            className="h-10 w-10 rounded-lg border border-line text-lg text-muted hover:text-ink"
          >
            +
          </button>
          <span className="type-meta text-muted">people, including you</span>
        </div>
      </fieldset>

      <fieldset>
        <legend className="type-heading">Your situation</legend>
        <p className="type-meta mt-1 text-muted">
          Change them here to see what a different answer costs.
        </p>
        <div className="mt-2 space-y-2">
          <Toggle
            label="Someone in the group is 21 or over"
            detail="Under 21 means no car hire at all, and no bars, clubs or casino floors."
            value={values.isOver21}
            onChange={(v) => set('isOver21', v)}
          />
          <Toggle
            label="We have a car"
            detail="Without one, options that need a vehicle are dropped or costed as hire."
            value={values.hasCar}
            onChange={(v) => set('hasCar', v)}
          />
          <Toggle
            label="Someone has a US credit card"
            detail="Deposit holds on hire cars and hotel incidentals mostly refuse foreign debit cards."
            value={values.hasUsCreditCard}
            onChange={(v) => set('hasUsCreditCard', v)}
          />
        </div>
      </fieldset>

      <fieldset>
        <legend className="type-heading">Budget</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {BANDS.map((band) => (
            <Chip
              key={band}
              active={values.budgetBand === band}
              onClick={() => set('budgetBand', band)}
            >
              {BUDGET_BAND_LABELS[band]}
            </Chip>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="type-heading">What you are after</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {interestChoices.map((tag) => (
            <Chip
              key={tag}
              active={values.moods.includes(tag)}
              onClick={() =>
                set(
                  'moods',
                  values.moods.includes(tag)
                    ? values.moods.filter((t) => t !== tag)
                    : [...values.moods, tag],
                )
              }
            >
              {INTEREST_LABELS[tag]}
            </Chip>
          ))}
          {!showAllInterests ? (
            <Chip onClick={() => setShowAllInterests(true)}>Something else…</Chip>
          ) : null}
        </div>
      </fieldset>

      <div className="flex flex-wrap items-center gap-3 border-t border-line pt-4">
        <Button type="submit" size="lg" disabled={busy}>
          {busy
            ? 'Researching…'
            : hasPlan
              ? dirty
                ? 'Research again with these'
                : 'Research again'
              : 'Research this trip'}
        </Button>
        {dirty && hasPlan && !busy ? (
          <p className="type-meta text-accent">
            You have changed something. The plan below is from the previous settings.
          </p>
        ) : null}
      </div>
    </form>
  );
}
