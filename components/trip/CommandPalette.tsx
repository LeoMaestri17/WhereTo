'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Search, CornerDownLeft } from 'lucide-react';
import { DESTINATIONS } from '@/lib/trip/catalogue';

/**
 * Cmd-K, keyboard first.
 *
 * Not everyone is browsing. Someone who already knows where they are going should be able to
 * reach the costed trip without touching the board or the mouse: a shortcut, four letters, and
 * Enter. Arrow keys move, Escape closes, and the highlighted row is always the one Enter takes.
 *
 * It opens over the page rather than in the strip because a palette that pushes the layout down
 * makes you lose your place every time you reach for it.
 */
export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [term, setTerm] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const matches = useMemo(() => {
    const q = term.trim().toLowerCase();
    const pool = q
      ? DESTINATIONS.filter(
          (d) => d.name.toLowerCase().includes(q) || d.region.toLowerCase().includes(q),
        )
      : DESTINATIONS;
    return pool.slice(0, 7);
  }, [term]);

  const go = useCallback(
    (slug: string) => {
      onClose();
      setTerm('');
      router.push(`/trip/${slug}`);
    },
    [onClose, router],
  );

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
  }, [open]);

  const current = Math.min(active, Math.max(0, matches.length - 1));

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center px-4 pt-[12vh]">
      <button
        type="button"
        aria-label="Close search"
        onClick={onClose}
        className="absolute inset-0 bg-[rgba(42,40,35,0.28)]"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search destinations"
        className="relative w-full max-w-lg overflow-hidden rounded-[16px] border border-hairline bg-paper shadow-[var(--shadow-lift)]"
      >
        <div className="flex items-center gap-2.5 border-b border-hairline px-4 py-3.5">
          <Search size={17} strokeWidth={2.4} className="shrink-0 text-muted" />
          <input
            ref={inputRef}
            value={term}
            onChange={(e) => {
              setTerm(e.target.value);
              setActive(0);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Escape') onClose();
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                setActive((a) => Math.min(a + 1, matches.length - 1));
              }
              if (e.key === 'ArrowUp') {
                e.preventDefault();
                setActive((a) => Math.max(a - 1, 0));
              }
              if (e.key === 'Enter' && matches[current]) go(matches[current].slug);
            }}
            placeholder="Where to?"
            className="w-full bg-transparent text-[1rem] font-medium outline-none placeholder:text-faint"
          />
          <kbd className="shrink-0 rounded-[6px] border border-hairline px-1.5 py-0.5 text-[0.6875rem] font-bold text-muted">
            esc
          </kbd>
        </div>

        <ul className="max-h-[48vh] overflow-y-auto p-1.5">
          {matches.map((d, i) => (
            <li key={d.slug}>
              <button
                type="button"
                onMouseEnter={() => setActive(i)}
                onClick={() => go(d.slug)}
                className="wt-ease flex w-full items-center gap-2.5 rounded-[10px] px-3 py-2.5 text-left"
                style={{ background: i === current ? 'var(--ground)' : 'transparent' }}
              >
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ background: `var(--${d.tone})` }}
                  aria-hidden
                />
                <span className="flex-1 text-[0.9375rem] font-bold">{d.name}</span>
                <span className="type-body text-muted">{d.region}</span>
                {i === current ? (
                  <CornerDownLeft size={14} strokeWidth={2.6} className="shrink-0 text-muted" />
                ) : null}
              </button>
            </li>
          ))}
          {matches.length === 0 ? (
            <li className="px-3 py-4 text-[0.9375rem] font-bold">No match</li>
          ) : null}
        </ul>
      </div>
    </div>
  );
}

/** Cmd-K anywhere in the app. */
export function useCommandPalette(): [boolean, (open: boolean) => void] {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return [open, setOpen];
}
