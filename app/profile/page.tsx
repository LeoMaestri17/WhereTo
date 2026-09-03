'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Toggle } from '@/components/Onboarding';
import { QuestCard } from '@/components/cards';
import { Avatar } from '@/components/people';
import { Button, Chip, EmptyState, LinkButton, Panel, SectionHeader } from '@/components/ui';
import { INTEREST_LABELS, INTEREST_TAGS, type InterestTag } from '@/lib/domain/types';
import { useStore } from '@/lib/store/StoreProvider';
import {
  currentUser,
  friendIds,
  hostedBy,
  inboxFor,
  questById,
  questView,
  questsJoinedBy,
  usersById,
} from '@/lib/store/selectors';
import { relativeDay } from '@/lib/util/dates';

export default function ProfilePage() {
  const { state, resetDemo } = useStore();
  const me = currentUser(state);

  if (!me) return null;

  const friends = friendIds(state);
  const byId = usersById(state);
  const hosting = hostedBy(state, me.id);
  const joined = questsJoinedBy(state, me.id);
  const inbox = inboxFor(state, me.id);

  return (
    <div className="space-y-12">
      <header className="flex flex-wrap items-start gap-4">
        <Avatar user={me} size="xl" />
        <div className="min-w-0">
          <h1 className="type-display">{me.name}</h1>
          <p className="type-body mt-1 text-muted">
            {me.homeUniversity} · {me.homeCountry} · {me.cohort}
          </p>
          {me.bio ? <p className="type-body mt-2 max-w-xl">{me.bio}</p> : null}
        </div>
      </header>

      {inbox.length > 0 ? (
        <section>
          <SectionHeader
            title={`${inbox.length} ${inbox.length === 1 ? 'person is' : 'people are'} waiting on you`}
            detail="Requests to join things you are hosting. Open the post to approve or decline."
          />
          <ul className="space-y-2">
            {inbox.map((m) => {
              const quest = questById(state, m.questId);
              const user = byId[m.userId];
              if (!quest || !user) return null;
              return (
                <li key={`${m.questId}-${m.userId}`}>
                  <Link
                    href={`/quests/${quest.id}`}
                    className="flex items-center gap-3 rounded-xl border border-line bg-surface p-3 transition-colors hover:border-line-strong"
                  >
                    <Avatar user={user} size="md" />
                    <span className="min-w-0 flex-1">
                      <span className="type-body block font-medium">
                        {user.name} wants to join {quest.title}
                      </span>
                      <span className="type-meta block text-muted">
                        Asked {relativeDay(m.requestedAt)}
                        {m.message ? ` · “${m.message}”` : ''}
                      </span>
                    </span>
                    <span className="type-meta shrink-0 text-accent">Decide →</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      <section>
        <SectionHeader
          title="You are hosting"
          detail="Anything you posted. Requests arrive on the post itself."
          action={<LinkButton href="/post" tone="quiet">Post another</LinkButton>}
        />
        {hosting.length === 0 ? (
          <EmptyState
            title="You have not posted anything"
            body="Somebody has to go first, and it is a lower bar than it sounds — a date, a place and a number of spots is a post."
            action={<LinkButton href="/post">Post a plan</LinkButton>}
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {hosting.map((q) => (
              <QuestCard key={q.id} view={questView(state, q)} />
            ))}
          </div>
        )}
      </section>

      <section>
        <SectionHeader title="You are going to" detail="Things you have joined or asked to join." />
        {joined.length === 0 ? (
          <EmptyState
            title="Nothing joined yet"
            body="Everything on the board was posted by somebody in the cohort who wanted company. Asking to join costs nothing."
            action={<LinkButton href="/">See what is on</LinkButton>}
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {joined.map((q) => (
              <QuestCard key={q.id} view={questView(state, q)} />
            ))}
          </div>
        )}
      </section>

      <InterestsSection me={me} />

      <section>
        <SectionHeader
          title={`Friends (${friends.length})`}
          detail="Friends are how the attendance line gets names in it rather than just a count."
        />
        <FriendPicker />
      </section>

      <section className="border-t border-line pt-8">
        <h2 className="type-title">Demo data</h2>
        <p className="type-body mt-1.5 max-w-2xl text-muted">
          Everything you have done — joins, requests, approvals, posts, the profile you picked — is
          stored in this browser only. Resetting puts it back to the seeded cohort and forgets all
          of it.
        </p>
        <ResetControl onReset={resetDemo} />
      </section>
    </div>
  );
}

function InterestsSection({ me }: { me: NonNullable<ReturnType<typeof currentUser>> }) {
  const { dispatch } = useStore();
  const [interests, setInterests] = useState<InterestTag[]>(me.interests);
  const [isOver21, setIsOver21] = useState(me.age >= 21);
  const [hasCar, setHasCar] = useState(me.hasCar);
  const [hasUsCreditCard, setHasUsCreditCard] = useState(me.hasUsCreditCard);
  const [saved, setSaved] = useState(false);

  const dirty =
    JSON.stringify(interests) !== JSON.stringify(me.interests) ||
    isOver21 !== me.age >= 21 ||
    hasCar !== me.hasCar ||
    hasUsCreditCard !== me.hasUsCreditCard;

  return (
    <section>
      <SectionHeader
        title="What you are into, and what constrains you"
        detail="Interests order your feed. The three toggles change every cost estimate the planner produces."
      />

      <div className="flex flex-wrap gap-2">
        {INTEREST_TAGS.map((tag) => (
          <Chip
            key={tag}
            active={interests.includes(tag)}
            onClick={() => {
              setSaved(false);
              setInterests((prev) =>
                prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
              );
            }}
          >
            {INTEREST_LABELS[tag]}
          </Chip>
        ))}
      </div>

      <div className="mt-4 space-y-2">
        <Toggle
          label="I am 21 or over"
          detail="Under 21 rules out car hire entirely, plus bars, clubs and casino floors."
          value={isOver21}
          onChange={(v) => {
            setSaved(false);
            setIsOver21(v);
          }}
        />
        <Toggle
          label="Somebody in my circle has a car"
          detail="Without one, anything that needs a vehicle gets costed as hire or dropped."
          value={hasCar}
          onChange={(v) => {
            setSaved(false);
            setHasCar(v);
          }}
        />
        <Toggle
          label="I have a US credit card"
          detail="Deposit holds on hire cars and hotels mostly refuse foreign debit cards."
          value={hasUsCreditCard}
          onChange={(v) => {
            setSaved(false);
            setHasUsCreditCard(v);
          }}
        />
      </div>

      <div className="mt-4 flex items-center gap-3">
        <Button
          disabled={!dirty}
          onClick={() => {
            dispatch({
              type: 'updateProfile',
              interests,
              constraints: { isOver21, hasCar, hasUsCreditCard },
            });
            setSaved(true);
          }}
        >
          {dirty ? 'Save these' : 'Nothing to save'}
        </Button>
        {saved && !dirty ? (
          <p className="type-meta text-good">
            Saved. New research runs will use these; plans you already ran are unchanged.
          </p>
        ) : null}
      </div>
    </section>
  );
}

function FriendPicker() {
  const { state, dispatch } = useStore();
  const me = currentUser(state);
  const friends = new Set(friendIds(state));
  const [query, setQuery] = useState('');

  if (!me) return null;

  const others = state.users
    .filter((u) => u.id !== me.id)
    .filter((u) =>
      query.trim()
        ? `${u.name} ${u.homeCountry} ${u.homeUniversity}`
            .toLowerCase()
            .includes(query.trim().toLowerCase())
        : true,
    )
    .sort((a, b) => Number(friends.has(b.id)) - Number(friends.has(a.id)));

  return (
    <div>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search the cohort by name, country or university"
        className="w-full rounded-lg border border-line bg-surface px-3 py-2 type-body placeholder:text-faint"
      />

      {others.length === 0 ? (
        <div className="mt-3">
          <EmptyState
            title="Nobody by that name"
            body={`Nothing in the cohort matches “${query.trim()}”. There are ${state.users.length - 1} other people here.`}
            action={
              <Button tone="quiet" onClick={() => setQuery('')}>
                Clear the search
              </Button>
            }
          />
        </div>
      ) : (
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {others.map((u) => {
            const isFriend = friends.has(u.id);
            return (
              <li
                key={u.id}
                className="flex items-center gap-3 rounded-xl border border-line bg-surface p-3"
              >
                <Avatar user={u} size="md" />
                <div className="min-w-0 flex-1">
                  <p className="type-body truncate font-medium">{u.name}</p>
                  <p className="type-meta truncate text-muted">
                    {u.homeCountry} · {u.homeUniversity}
                  </p>
                </div>
                <Button
                  size="sm"
                  tone={isFriend ? 'quiet' : 'accent'}
                  onClick={() => dispatch({ type: 'toggleFriend', userId: u.id })}
                >
                  {isFriend ? 'Friends' : 'Add'}
                </Button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function ResetControl({ onReset }: { onReset: () => void }) {
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <Button tone="quiet" className="mt-4" onClick={() => setConfirming(true)}>
        Reset the demo data
      </Button>
    );
  }

  return (
    <Panel tone="danger" className="mt-4">
      <p className="type-heading text-danger">This throws away everything you have done</p>
      <p className="type-body mt-1.5 text-ink/80">
        Your profile choice, every join and request, every approval and anything you posted. The
        seeded cohort comes back exactly as it was. There is no undo.
      </p>
      <div className="mt-3 flex gap-2">
        <Button tone="danger" size="sm" onClick={onReset}>
          Reset it
        </Button>
        <Button tone="ghost" size="sm" onClick={() => setConfirming(false)}>
          Keep my data
        </Button>
      </div>
    </Panel>
  );
}
