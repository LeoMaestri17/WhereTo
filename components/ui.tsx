'use client';

import Link from 'next/link';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import type { QuestStatus } from '@/lib/domain/types';
import { STATUS_LABELS } from '@/lib/domain/logic';

/* ------------------------------------------------------------------ buttons */

type ButtonTone = 'accent' | 'quiet' | 'ghost' | 'danger';

const TONE: Record<ButtonTone, string> = {
  accent:
    'bg-accent text-[var(--accent-text)] hover:bg-accent-hover disabled:bg-surface-3 disabled:text-faint',
  quiet:
    'bg-surface-2 text-ink border border-line hover:bg-surface-3 disabled:text-faint',
  ghost: 'text-ink hover:bg-surface-2 disabled:text-faint',
  danger: 'bg-danger-soft text-danger border border-current/20 hover:bg-danger-soft/70',
};

export function Button({
  tone = 'accent',
  size = 'md',
  className = '',
  children,
  ...rest
}: {
  tone?: ButtonTone;
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  const sizing =
    size === 'lg'
      ? 'px-5 py-3 text-[0.9375rem]'
      : size === 'sm'
        ? 'px-3 py-1.5 text-[0.8125rem]'
        : 'px-4 py-2.5 text-[0.875rem]';
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors disabled:cursor-not-allowed ${TONE[tone]} ${sizing} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}

export function LinkButton({
  href,
  tone = 'accent',
  className = '',
  children,
}: {
  href: string;
  tone?: ButtonTone;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-[0.875rem] font-medium transition-colors ${TONE[tone]} ${className}`}
    >
      {children}
    </Link>
  );
}

/* ------------------------------------------------------------------ chips and pills */

export function Chip({
  active = false,
  onClick,
  children,
  className = '',
}: {
  active?: boolean;
  onClick?: () => void;
  children: ReactNode;
  className?: string;
}) {
  const base =
    'inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-[0.8125rem] transition-colors';
  const state = active
    ? 'border-accent bg-accent text-[var(--accent-text)]'
    : 'border-line bg-surface text-muted hover:border-line-strong hover:text-ink';
  if (!onClick) {
    return <span className={`${base} ${state} ${className}`}>{children}</span>;
  }
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`${base} ${state} ${className}`}
    >
      {children}
    </button>
  );
}

const STATUS_TONE: Record<QuestStatus, string> = {
  open: 'bg-surface/95 text-ink',
  filling: 'bg-accent text-[var(--accent-text)]',
  full: 'bg-surface/95 text-muted',
  closed: 'bg-surface/95 text-muted',
  cancelled: 'bg-danger-soft text-danger',
  completed: 'bg-surface/95 text-muted',
};

export function StatusPill({
  status,
  className = '',
}: {
  status: QuestStatus;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 type-micro backdrop-blur-sm ${STATUS_TONE[status]} ${className}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

/* ------------------------------------------------------------------ layout */

export function Panel({
  children,
  className = '',
  tone = 'plain',
}: {
  children: ReactNode;
  className?: string;
  tone?: 'plain' | 'warn' | 'danger' | 'good' | 'accent';
}) {
  const tones = {
    plain: 'border-line bg-surface',
    warn: 'border-transparent bg-warn-soft',
    danger: 'border-transparent bg-danger-soft',
    good: 'border-transparent bg-good-soft',
    accent: 'border-transparent bg-accent-soft',
  } as const;
  return (
    <div className={`rounded-xl border p-4 ${tones[tone]} ${className}`}>{children}</div>
  );
}

export function SectionHeader({
  title,
  detail,
  action,
  className = '',
}: {
  title: string;
  detail?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`mb-4 flex items-end justify-between gap-4 ${className}`}>
      <div>
        <h2 className="type-title">{title}</h2>
        {detail ? <p className="type-meta mt-1 text-muted">{detail}</p> : null}
      </div>
      {action}
    </div>
  );
}

/* ------------------------------------------------------------------ async states */

/**
 * Empty, loading and error states are written rather than generic. A student standing outside a
 * lecture hall needs to know what happened and what to do about it, not watch a spinner.
 */
export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-dashed border-line-strong px-6 py-12 text-center">
      <h3 className="type-heading">{title}</h3>
      <p className="type-body mx-auto mt-2 max-w-md text-muted">{body}</p>
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  );
}

export function ErrorState({
  title,
  body,
  onRetry,
  retryLabel = 'Try again',
}: {
  title: string;
  body: string;
  onRetry?: () => void;
  retryLabel?: string;
}) {
  return (
    <Panel tone="danger">
      <h3 className="type-heading text-danger">{title}</h3>
      <p className="type-body mt-1.5 text-ink/80">{body}</p>
      {onRetry ? (
        <Button tone="quiet" size="sm" className="mt-4" onClick={onRetry}>
          {retryLabel}
        </Button>
      ) : null}
    </Panel>
  );
}

export function LoadingState({ label, rows = 3 }: { label: string; rows?: number }) {
  return (
    <div>
      <p className="type-meta mb-4 text-muted">{label}</p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-xl border border-line">
            <div className="sq-shimmer aspect-[16/10] w-full" />
            <div className="space-y-2 p-4">
              <div className="sq-shimmer h-3 w-3/4 rounded" />
              <div className="sq-shimmer h-3 w-1/2 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ misc */

export function MetaRow({ items }: { items: Array<string | null | undefined> }) {
  const present = items.filter((i): i is string => Boolean(i));
  return (
    <p className="type-meta text-muted">
      {present.map((item, i) => (
        <span key={i}>
          {i > 0 ? <span className="px-1.5 text-faint">·</span> : null}
          {item}
        </span>
      ))}
    </p>
  );
}

export function OutboundLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-accent underline decoration-accent/30 underline-offset-2 hover:decoration-accent"
    >
      {children}
    </a>
  );
}
