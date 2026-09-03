'use client';

import { useMemo, useState } from 'react';
import { INTEREST_LABELS, INTEREST_TAGS, type InterestTag } from '@/lib/domain/types';
import { useStore } from '@/lib/store/StoreProvider';
import { currentUser } from '@/lib/store/selectors';
import { Avatar } from './people';
import { Button, Chip, Panel } from './ui';

/**
 * Identity without a password. Pick somebody from the cohort or add yourself, then answer the
 * three questions that change every cost estimate in the app.
 */
export function Onboarding() {
  const { state, dispatch } = useStore();
  const me = currentUser(state);
  const [step, setStep] = useState<'who' | 'about'>(me ? 'about' : 'who');

  return (
    <div className="mx-auto flex min-h-dvh max-w-3xl flex-col px-4 py-10 sm:px-6">
      <header className="mb-8">
        <p className="type-micro text-accent">USC SideQuest</p>
        <h1 className="type-display mt-2 max-w-xl">
          {step === 'who'
            ? 'Four hundred of you arrived at the same time and none of you know each other.'
            : 'Three questions that change every price in here.'}
        </h1>
        <p className="type-body mt-3 max-w-xl text-muted">
          {step === 'who'
            ? 'Pick who you are. There are no passwords — this is a prototype and everything lives in this browser.'
            : 'A general travel estimate assumes you are thirty with a credit card. Answering these is what makes the numbers in here yours.'}
        </p>
      </header>

      {step === 'who' ? (
        <ChooseWho onChosen={() => setStep('about')} />
      ) : (
        <AboutYou onBack={() => setStep('who')} />
      )}

      <p className="type-meta mt-10 text-faint">
        Seeded with {state.users.length} exchange students, {state.quests.length} trips and plans,
        and events from four sources. Nothing here leaves your browser.
      </p>
    </div>
  );
}

function ChooseWho({ onChosen }: { onChosen: () => void }) {
  const { state, dispatch } = useStore();
  const [creating, setCreating] = useState(false);

  if (creating) {
    return <CreateProfile onDone={onChosen} onCancel={() => setCreating(false)} />;
  }

  return (
    <div>
      <div className="grid gap-2 sm:grid-cols-2">
        {state.users.map((u) => (
          <button
            key={u.id}
            type="button"
            onClick={() => {
              dispatch({ type: 'chooseProfile', userId: u.id });
              onChosen();
            }}
            className="flex items-center gap-3 rounded-xl border border-line bg-surface p-3 text-left transition-colors hover:border-line-strong"
          >
            <Avatar user={u} size="md" />
            <span className="min-w-0">
              <span className="type-heading block truncate">{u.name}</span>
              <span className="type-meta block truncate text-muted">
                {u.homeCountry} · {u.age}
              </span>
            </span>
          </button>
        ))}
      </div>

      <Button tone="quiet" className="mt-4 w-full" onClick={() => setCreating(true)}>
        None of these — add me instead
      </Button>
    </div>
  );
}

function CreateProfile({ onDone, onCancel }: { onDone: () => void; onCancel: () => void }) {
  const { dispatch } = useStore();
  const [name, setName] = useState('');
  const [homeCountry, setHomeCountry] = useState('');
  const [homeUniversity, setHomeUniversity] = useState('');
  const [age, setAge] = useState(20);
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (!name.trim()) {
          setError('We need a name to put on the things you post.');
          return;
        }
        dispatch({
          type: 'createProfile',
          user: {
            name: name.trim(),
            homeCountry: homeCountry.trim() || 'Not saying',
            homeUniversity: homeUniversity.trim() || 'Not saying',
            age,
            interests: [],
            hasCar: false,
            hasUsCreditCard: false,
            bio: '',
          },
        });
        onDone();
      }}
    >
      <Field label="Your name" value={name} onChange={setName} placeholder="Sara Lindholm" />
      <Field
        label="Where you are from"
        value={homeCountry}
        onChange={setHomeCountry}
        placeholder="Finland"
      />
      <Field
        label="Your home university"
        value={homeUniversity}
        onChange={setHomeUniversity}
        placeholder="Aalto University"
      />
      <label className="block">
        <span className="type-meta font-medium">Age</span>
        <input
          type="number"
          min={17}
          max={40}
          value={age}
          onChange={(e) => setAge(Number(e.target.value))}
          className="mt-1.5 w-28 rounded-lg border border-line bg-surface px-3 py-2 type-body"
        />
      </label>

      {error ? <p className="type-meta text-danger">{error}</p> : null}

      <div className="flex gap-2 pt-2">
        <Button type="submit">Continue</Button>
        <Button type="button" tone="ghost" onClick={onCancel}>
          Back to the list
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <label className="block">
      <span className="type-meta font-medium">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1.5 w-full rounded-lg border border-line bg-surface px-3 py-2 type-body placeholder:text-faint"
      />
    </label>
  );
}

function AboutYou({ onBack }: { onBack: () => void }) {
  const { state, dispatch } = useStore();
  const me = currentUser(state);
  const [interests, setInterests] = useState<InterestTag[]>(me?.interests ?? []);
  const [isOver21, setIsOver21] = useState((me?.age ?? 20) >= 21);
  const [hasCar, setHasCar] = useState(me?.hasCar ?? false);
  const [hasUsCreditCard, setHasUsCreditCard] = useState(me?.hasUsCreditCard ?? false);

  const enough = useMemo(() => interests.length >= 2, [interests]);

  if (!me) return null;

  return (
    <div className="space-y-8">
      <section>
        <div className="mb-3 flex items-center gap-3">
          <Avatar user={me} size="md" />
          <div>
            <p className="type-heading">{me.name}</p>
            <button type="button" onClick={onBack} className="type-meta text-accent underline">
              Not you?
            </button>
          </div>
        </div>
      </section>

      <section>
        <h2 className="type-heading">What would get you out of your flat?</h2>
        <p className="type-meta mt-1 text-muted">
          Pick at least two. This orders your feed — it never hides anything from you.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {INTEREST_TAGS.map((tag) => (
            <Chip
              key={tag}
              active={interests.includes(tag)}
              onClick={() =>
                setInterests((prev) =>
                  prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
                )
              }
            >
              {INTEREST_LABELS[tag]}
            </Chip>
          ))}
        </div>
      </section>

      <section>
        <h2 className="type-heading">The three that change the money</h2>
        <p className="type-meta mt-1 text-muted">
          You can change any of these later, and every estimate updates when you do.
        </p>
        <div className="mt-3 space-y-2">
          <Toggle
            label="I am 21 or over"
            detail="Under 21 rules out car hire entirely, plus bars, clubs and casino floors."
            value={isOver21}
            onChange={setIsOver21}
          />
          <Toggle
            label="Somebody in my circle has a car"
            detail="Without one, anything that needs a vehicle gets costed as hire or dropped."
            value={hasCar}
            onChange={setHasCar}
          />
          <Toggle
            label="I have a US credit card"
            detail="Deposit holds on hire cars and hotels mostly refuse foreign debit cards."
            value={hasUsCreditCard}
            onChange={setHasUsCreditCard}
          />
        </div>
      </section>

      {!enough ? (
        <Panel tone="warn">
          <p className="type-meta">Pick two things you are interested in and you are done.</p>
        </Panel>
      ) : null}

      <Button
        size="lg"
        disabled={!enough}
        onClick={() =>
          dispatch({
            type: 'completeOnboarding',
            interests,
            constraints: { isOver21, hasCar, hasUsCreditCard },
          })
        }
      >
        Start looking
      </Button>
    </div>
  );
}

export function Toggle({
  label,
  detail,
  value,
  onChange,
}: {
  label: string;
  detail?: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      onClick={() => onChange(!value)}
      className={`flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-colors ${
        value ? 'border-accent bg-accent-soft' : 'border-line bg-surface hover:border-line-strong'
      }`}
    >
      <span
        className={`mt-0.5 flex h-5 w-9 shrink-0 items-center rounded-full p-0.5 transition-colors ${
          value ? 'bg-accent' : 'bg-surface-3'
        }`}
      >
        <span
          className={`h-4 w-4 rounded-full bg-[var(--surface)] shadow-sm transition-transform ${
            value ? 'translate-x-4' : ''
          }`}
        />
      </span>
      <span>
        <span className="type-body block font-medium">{label}</span>
        {detail ? <span className="type-meta block text-muted">{detail}</span> : null}
      </span>
    </button>
  );
}
