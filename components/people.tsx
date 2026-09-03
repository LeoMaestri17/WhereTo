'use client';

import type { CohortUser } from '@/lib/domain/types';
import type { AttendanceSignal as Signal } from '@/lib/domain/logic';
import { SmartImage } from './SmartImage';

const SIZES = { xs: 22, sm: 30, md: 40, lg: 64, xl: 88 } as const;
type AvatarSize = keyof typeof SIZES;

export function Avatar({
  user,
  size = 'md',
  className = '',
}: {
  user: CohortUser | null;
  size?: AvatarSize;
  className?: string;
}) {
  const px = SIZES[size];
  const initials = (user?.name ?? '?')
    .split(' ')
    .slice(0, 2)
    .map((p) => p[0])
    .join('');

  if (!user?.photo) {
    return (
      <span
        className={`inline-flex shrink-0 items-center justify-center rounded-full bg-surface-3 font-medium text-muted ${className}`}
        style={{ width: px, height: px, fontSize: px * 0.36 }}
        aria-hidden="true"
      >
        {initials}
      </span>
    );
  }

  return (
    <span
      className={`inline-block shrink-0 overflow-hidden rounded-full bg-surface-3 ${className}`}
      style={{ width: px, height: px }}
    >
      <SmartImage
        photoId={user.photo}
        alt={user.name}
        width={px * 2}
        height={px * 2}
        className="h-full w-full object-cover"
      />
    </span>
  );
}

export function AvatarStack({
  users,
  size = 'sm',
  max = 4,
}: {
  users: CohortUser[];
  size?: AvatarSize;
  max?: number;
}) {
  const shown = users.slice(0, max);
  if (shown.length === 0) return null;
  return (
    <span className="flex items-center -space-x-2">
      {shown.map((u) => (
        <Avatar
          key={u.id}
          user={u}
          size={size}
          className="ring-2 ring-[var(--surface)]"
        />
      ))}
    </span>
  );
}

/**
 * "Ana and Jonas, plus 10 other exchange students going."
 *
 * The only social number anywhere in this app, and it is logistics: who else will be there.
 * It never ranks, never scores, and never decides the order of anything.
 */
export function AttendanceSignal({
  signal,
  className = '',
}: {
  signal: Signal;
  className?: string;
}) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {signal.namedFriends.length > 0 ? (
        <AvatarStack users={signal.namedFriends} size="xs" max={2} />
      ) : null}
      <span className="type-meta text-muted">{signal.sentence}</span>
    </div>
  );
}
