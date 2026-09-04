'use client';

import Link from 'next/link';
import { notFound, useParams, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { SmartImage } from '@/components/SmartImage';
import { CapacityMeter, DeadlineCountdown } from '@/components/commitment';
import { AttendanceSignal, Avatar } from '@/components/people';
import { ActualsTable } from '@/components/quest/ActualsTable';
import { HostConsole } from '@/components/quest/HostConsole';
import { Button, LinkButton, MetaRow, Panel, StatusPill } from '@/components/ui';
import { formatRange, goingToQuest, joinAffordance, viewerRelation } from '@/lib/domain/logic';
import { IDEAS_BY_SLUG } from '@/lib/seed/ideas';
import { useStore } from '@/lib/store/StoreProvider';
import { canSee, currentUser, questById, questView, usersById } from '@/lib/store/selectors';
import { formatDateRange, formatDayWithWeekday, relativeDay } from '@/lib/util/dates';

export default function QuestPage() {
  const params = useParams<{ id: string }>();
  const search = useSearchParams();
  const { state, dispatch } = useStore();
  const me = currentUser(state);
  const quest = questById(state, params.id);

  const [message, setMessage] = useState('');
  const [composing, setComposing] = useState(false);

  if (!quest) notFound();

  // A private post is not a 404 — the link is real, you are just not on the list. Saying so is
  // friendlier and more honest than pretending it does not exist.
  if (!canSee(state, quest, search.get('invite'))) {
    return (
      <div className="mx-auto max-w-lg py-16 text-center">
        <h1 className="type-title">This one is private</h1>
        <p className="type-body mt-2 text-muted">
          {usersById(state)[quest.hostId]?.name.split(' ')[0] ?? 'The host'} is keeping this to
          people they invited. If you should be on it, ask them for the link.
        </p>
        <LinkButton href="/" tone="quiet" className="mt-5">
          Back to what is on
        </LinkButton>
      </div>
    );
  }

  const view = questView(state, quest);
  const { status, capacity, host, signal } = view;
  const relation = viewerRelation(quest, state.memberships, me?.id ?? null);
  const affordance = joinAffordance(quest, state.memberships, me?.id ?? null);
  const byId = usersById(state);
  const goingIds = goingToQuest(quest, state.memberships);
  const attachedIdea = quest.attachedPlanSlug ? IDEAS_BY_SLUG[quest.attachedPlanSlug] : undefined;
  const savedPlan = state.savedPlans[quest.id];

  return (
    <div className="space-y-10">
      <nav className="type-meta">
        <Link href="/" className="text-muted hover:text-ink">
          ← Everything on
        </Link>
      </nav>

      <header className="overflow-hidden rounded-2xl border border-line bg-surface">
        <div className="relative aspect-[21/9] bg-surface-2">
          <SmartImage
            photoId={quest.cover}
            alt={quest.destination}
            width={1400}
            height={600}
            priority
            sizes="(max-width: 1024px) 100vw, 1024px"
            className={`h-full w-full object-cover ${
              status === 'cancelled' ? 'opacity-50 saturate-50' : ''
            }`}
          />
          <div className="absolute left-4 top-4 flex gap-2">
            <StatusPill status={status} />
            <span className="rounded-full bg-surface/95 px-2.5 py-1 type-micro text-muted backdrop-blur-sm">
              {quest.kind === 'trip' ? 'Trip' : 'Activity'}
            </span>
            {quest.visibility === 'private' ? (
              <span className="rounded-full bg-surface/95 px-2.5 py-1 type-micro text-accent backdrop-blur-sm">
                Invite only
              </span>
            ) : null}
          </div>
        </div>

        <div className="p-5 sm:p-6">
          <h1 className="type-display">{quest.title}</h1>
          <MetaRow
            items={[
              quest.destination,
              quest.endDate
                ? formatDateRange(quest.startDate, quest.endDate)
                : formatDayWithWeekday(quest.startDate),
              quest.timeLabel,
            ]}
          />

          {host ? (
            <div className="mt-4 flex items-center gap-3">
              <Avatar user={host} size="md" />
              <div>
                <p className="type-body font-medium">
                  {host.name}
                  {relation === 'host' ? ' — that is you' : ''}
                </p>
                <p className="type-meta text-muted">
                  {host.homeUniversity} · posted {relativeDay(quest.createdAt)}
                </p>
              </div>
            </div>
          ) : null}
        </div>
      </header>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-8">
          <section>
            <h2 className="type-title">From the host</h2>
            <div className="mt-2 space-y-3">
              {quest.description.split('\n\n').map((para, i) => (
                <p key={i} className="type-body whitespace-pre-line">
                  {para}
                </p>
              ))}
            </div>
            <p className="type-meta mt-4 text-muted">
              <span className="font-medium text-ink">Meeting at:</span> {quest.meetingPoint}
            </p>
          </section>

          <section>
            <h2 className="type-title">Who is going</h2>
            <p className="type-meta mt-1 text-muted">{signal.sentence}</p>
            <ul className="mt-3 flex flex-wrap gap-3">
              {goingIds.map((id) => {
                const user = byId[id];
                if (!user) return null;
                return (
                  <li key={id} className="flex items-center gap-2">
                    <Avatar user={user} size="sm" />
                    <span className="type-meta">
                      {user.name.split(' ')[0]}
                      {id === quest.hostId ? (
                        <span className="text-faint"> · host</span>
                      ) : null}
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>

          {quest.actuals ? <ActualsTable quest={quest} /> : null}

          {relation === 'host' ? <HostConsole quest={quest} /> : null}

          {attachedIdea || savedPlan ? (
            <section className="rounded-xl border border-line bg-surface-2 p-5">
              <h2 className="type-heading">There is a costed plan behind this</h2>
              <p className="type-body mt-1.5 text-muted">
                {savedPlan
                  ? `The host posted this from a researched plan: ${savedPlan.options.length} options, ${savedPlan.constraints.length} things flagged for their situation, and a per-head range of ${formatRange(savedPlan.totalRangeMin, savedPlan.totalRangeMax)}.`
                  : 'The host built this from the idea bank. You can re-run the research for your own dates, group and constraints.'}
              </p>
              {attachedIdea ? (
                <LinkButton
                  href={`/ideas/${attachedIdea.slug}`}
                  tone="quiet"
                  className="mt-3"
                >
                  Open the planner for {attachedIdea.title}
                </LinkButton>
              ) : null}
            </section>
          ) : null}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <div className="rounded-xl border border-line bg-surface p-5">
            {quest.lifecycle === 'active' ? (
              <>
                <CapacityMeter capacity={capacity} />
                <div className="mt-3 border-t border-line pt-3">
                  <p className="type-micro text-faint">Sign-ups close</p>
                  <p className="type-body mt-0.5">
                    {formatDayWithWeekday(quest.signupDeadline)}
                  </p>
                  <DeadlineCountdown deadline={quest.signupDeadline} className="mt-0.5 block" />
                </div>
              </>
            ) : null}

            {quest.costEstimate ? (
              <div className="mt-3 border-t border-line pt-3">
                <p className="type-micro text-faint">Estimated per person</p>
                <p className="type-title mt-0.5 tabular-nums">
                  {formatRange(
                    quest.costEstimate.minPerPerson,
                    quest.costEstimate.maxPerPerson,
                  )}
                </p>
                <p className="type-meta mt-0.5 text-muted">{quest.costEstimate.basis}</p>
              </div>
            ) : null}

            <div className="mt-4 border-t border-line pt-4">
              {affordance.action === 'request' && !composing ? (
                <Button className="w-full" onClick={() => setComposing(true)}>
                  {affordance.label}
                </Button>
              ) : affordance.action === 'request' && composing ? (
                <div>
                  <label className="type-meta block font-medium" htmlFor="join-note">
                    Anything the host should know?
                  </label>
                  <textarea
                    id="join-note"
                    rows={3}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Optional. A sentence about why you want to come, or what you can bring."
                    className="mt-1.5 w-full rounded-lg border border-line bg-surface px-3 py-2 type-body placeholder:text-faint"
                  />
                  <div className="mt-2 flex gap-2">
                    <Button
                      className="flex-1"
                      onClick={() => {
                        dispatch({
                          type: 'requestJoin',
                          questId: quest.id,
                          message: message.trim() || undefined,
                        });
                        setComposing(false);
                        setMessage('');
                      }}
                    >
                      Send the request
                    </Button>
                    <Button tone="ghost" onClick={() => setComposing(false)}>
                      Not now
                    </Button>
                  </div>
                </div>
              ) : affordance.action === 'withdraw' ? (
                <div>
                  <p
                    className={`type-body font-medium ${
                      affordance.tone === 'warn' ? 'text-warn' : ''
                    }`}
                  >
                    {affordance.label}
                  </p>
                  {affordance.detail ? (
                    <p className="type-meta mt-1 text-muted">{affordance.detail}</p>
                  ) : null}
                  <Button
                    tone="quiet"
                    className="mt-3 w-full"
                    onClick={() => dispatch({ type: 'withdrawRequest', questId: quest.id })}
                  >
                    {relation === 'approved' ? 'Drop out' : 'Take the request back'}
                  </Button>
                </div>
              ) : (
                <div>
                  <p
                    className={`type-body font-medium ${
                      affordance.tone === 'warn' ? 'text-warn' : ''
                    }`}
                  >
                    {affordance.label}
                  </p>
                  {affordance.detail ? (
                    <p className="type-meta mt-1 text-muted">{affordance.detail}</p>
                  ) : null}
                </div>
              )}
            </div>
          </div>

          {status === 'full' && relation === 'none' ? (
            <Panel tone="warn">
              <p className="type-meta">
                Every seat is taken. Nothing to do but watch — if somebody drops out the button
                above turns back on by itself.
              </p>
            </Panel>
          ) : null}

          {status === 'closed' && relation === 'none' ? (
            <Panel tone="warn">
              <p className="type-meta">
                There were still {capacity.remaining}{' '}
                {capacity.remaining === 1 ? 'seat' : 'seats'} on this, but the deadline passed on{' '}
                {formatDayWithWeekday(quest.signupDeadline)}. Hosts set deadlines so they can book.
              </p>
            </Panel>
          ) : null}

          <div className="rounded-xl border border-line bg-surface p-4">
            <AttendanceSignal signal={signal} />
          </div>
        </aside>
      </div>
    </div>
  );
}
