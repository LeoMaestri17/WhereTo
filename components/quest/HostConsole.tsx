'use client';

import { useState } from 'react';
import type { Membership, Quest } from '@/lib/domain/types';
import { questCapacity } from '@/lib/domain/logic';
import { useStore } from '@/lib/store/StoreProvider';
import { decidedRequestsFor, pendingRequestsFor, usersById } from '@/lib/store/selectors';
import { relativeDay } from '@/lib/util/dates';
import { Avatar } from '../people';
import { Button, EmptyState, Panel } from '../ui';

/**
 * The host's side. Approvals and declines write straight into the same membership list every
 * other surface reads, so a decision here changes the capacity bar on the feed immediately.
 */
export function HostConsole({ quest }: { quest: Quest }) {
  const { state, dispatch } = useStore();
  const byId = usersById(state);
  const pending = pendingRequestsFor(state, quest.id);
  const decided = decidedRequestsFor(state, quest.id);
  const capacity = questCapacity(quest, state.memberships);
  const [showDecided, setShowDecided] = useState(false);

  const closed = quest.lifecycle !== 'active';

  return (
    <section className="rounded-xl border border-line bg-surface-2 p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="type-title">You are hosting this</h2>
        <span className="type-meta text-muted">
          {capacity.taken} of {capacity.capacity} seats filled
        </span>
      </div>

      {closed ? (
        <p className="type-body mt-2 text-muted">
          {quest.lifecycle === 'cancelled'
            ? 'You called this off, so nobody can request a place any more.'
            : 'This one has run. Nothing left to approve.'}
        </p>
      ) : (
        <p className="type-body mt-2 text-muted">
          {pending.length === 0
            ? 'Nobody is waiting on you right now.'
            : `${pending.length} ${pending.length === 1 ? 'person is' : 'people are'} waiting on you.`}
        </p>
      )}

      {!closed ? (
        <div className="mt-4">
          {pending.length === 0 ? (
            <EmptyState
              title="No requests to deal with"
              body="When somebody asks to join, they turn up here with whatever note they wrote. Approving takes a seat; declining leaves it open."
            />
          ) : (
            <ul className="space-y-2">
              {pending.map((m) => (
                <RequestRow
                  key={m.userId}
                  membership={m}
                  name={byId[m.userId]?.name ?? 'Someone'}
                  full={capacity.remaining === 0}
                  onDecide={(approve) =>
                    dispatch({
                      type: 'decideRequest',
                      questId: quest.id,
                      userId: m.userId,
                      approve,
                    })
                  }
                  user={byId[m.userId] ?? null}
                />
              ))}
            </ul>
          )}
        </div>
      ) : null}

      {decided.length > 0 ? (
        <div className="mt-4 border-t border-line pt-4">
          <button
            type="button"
            onClick={() => setShowDecided((v) => !v)}
            aria-expanded={showDecided}
            className="type-meta text-muted hover:text-ink"
          >
            {showDecided ? 'Hide' : 'Show'} the {decided.length} you have already decided on
          </button>
          {showDecided ? (
            <ul className="mt-3 space-y-1.5">
              {decided.map((m) => (
                <li key={m.userId} className="flex items-center gap-2.5">
                  <Avatar user={byId[m.userId] ?? null} size="xs" />
                  <span className="type-meta">
                    {byId[m.userId]?.name ?? 'Someone'}
                    <span className="text-muted">
                      {' '}
                      — {m.state === 'approved' ? 'in' : 'declined'}
                      {m.decidedAt ? ` ${relativeDay(m.decidedAt)}` : ''}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      {quest.visibility === 'private' ? <InviteLink quest={quest} /> : null}

      {quest.lifecycle === 'active' ? <CancelControl quest={quest} /> : null}
    </section>
  );
}

function RequestRow({
  membership,
  user,
  name,
  full,
  onDecide,
}: {
  membership: Membership;
  user: Parameters<typeof Avatar>[0]['user'];
  name: string;
  full: boolean;
  onDecide: (approve: boolean) => void;
}) {
  return (
    <li className="rounded-lg border border-line bg-surface p-3">
      <div className="flex items-start gap-3">
        <Avatar user={user} size="md" />
        <div className="min-w-0 flex-1">
          <p className="type-body font-medium">{name}</p>
          <p className="type-meta text-faint">Asked {relativeDay(membership.requestedAt)}</p>
          {membership.message ? (
            <p className="type-body mt-1.5 text-muted">&ldquo;{membership.message}&rdquo;</p>
          ) : null}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button size="sm" disabled={full} onClick={() => onDecide(true)}>
          {full ? 'No seats left' : 'Approve'}
        </Button>
        <Button size="sm" tone="quiet" onClick={() => onDecide(false)}>
          Decline
        </Button>
        {full ? (
          <span className="type-meta text-muted">
            Raise the capacity or wait for somebody to drop out.
          </span>
        ) : null}
      </div>
    </li>
  );
}

/** A private post is only reachable by link, so the host needs one they can actually send. */
function InviteLink({ quest }: { quest: Quest }) {
  const [copied, setCopied] = useState(false);
  const url =
    typeof window === 'undefined'
      ? ''
      : `${window.location.origin}/quests/${quest.id}?invite=${quest.inviteCode ?? ''}`;

  return (
    <div className="mt-4 border-t border-line pt-4">
      <p className="type-meta font-medium">This one is invite only</p>
      <p className="type-meta mt-0.5 text-muted">
        It never appears in the feed. Anyone with this link can open it and ask to join.
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <code className="min-w-0 flex-1 truncate rounded-lg border border-line bg-surface px-3 py-2 type-meta text-muted">
          {url}
        </code>
        <Button
          size="sm"
          tone="quiet"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(url);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            } catch {
              // Clipboard blocked; the link is on screen to copy by hand.
            }
          }}
        >
          {copied ? 'Copied' : 'Copy link'}
        </Button>
      </div>
    </div>
  );
}

function CancelControl({ quest }: { quest: Quest }) {
  const { dispatch } = useStore();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');

  if (!open) {
    return (
      <div className="mt-4 border-t border-line pt-4">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="type-meta text-muted underline hover:text-danger"
        >
          Call this off
        </button>
      </div>
    );
  }

  return (
    <Panel tone="danger" className="mt-4">
      <p className="type-heading text-danger">Call it off</p>
      <p className="type-body mt-1.5 text-ink/80">
        Everybody who joined sees this straight away, along with whatever you write here. Say why
        — a cancelled trip with a reason is fine, a cancelled trip without one is not.
      </p>
      <textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        rows={3}
        placeholder="The fare I built this around doubled while I was waiting for people to confirm."
        className="mt-3 w-full rounded-lg border border-line bg-surface px-3 py-2 type-body placeholder:text-faint"
      />
      <div className="mt-3 flex gap-2">
        <Button
          tone="danger"
          size="sm"
          disabled={reason.trim().length < 10}
          onClick={() => dispatch({ type: 'cancelQuest', questId: quest.id, reason })}
        >
          Cancel this {quest.kind}
        </Button>
        <Button tone="ghost" size="sm" onClick={() => setOpen(false)}>
          Keep it running
        </Button>
      </div>
      {reason.trim().length < 10 ? (
        <p className="type-meta mt-2 text-ink/70">A sentence at minimum.</p>
      ) : null}
    </Panel>
  );
}
