'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState, useSyncExternalStore } from 'react';
import { Check, MapPin, CalendarDays, Search, Users, Wallet } from 'lucide-react';
import { Chip, Eyebrow, MEASURE } from '@/components/ui/primitives';
import { DESTINATIONS, WINDOWS } from '@/lib/trip/catalogue';
import {
  DEFAULT_BRIEF,
  ORIGINS,
  describeBudget,
  describeDriver,
  describeParty,
  describeWindow,
  getBriefServerSnapshot,
  getBriefSnapshot,
  saveBrief,
  subscribeToBrief,
  type TripBrief,
} from '@/lib/trip/brief';
import { AGE_BAND_LABELS, PARTY_SIZES, type AgeBand, type PartySize } from '@/lib/trip/types';

/**
 * The control strip.
 *
 * Persistent, on every screen, and never a modal. Four chips that each open a panel underneath
 * the strip rather than over the page, because the whole point is that changing an answer
 * repopulates what is already below without taking it away first. Nothing here navigates and
 * nothing here touches the network: every price on every surface is computed from committed data
 * in the browser, so a chip change is instant.
 *
 * The strip is deliberately not a wizard: four facts shown as answers you can edit, not four
 * questions you must get past.
 *
 * No panel here carries a caption. A control that needs a sentence underneath explaining what it
 * does is a control that needs redesigning, and these did not.
 */

type PanelId = 'search' | 'origin' | 'party' | 'dates' | 'budget';

const BUDGETS = [150, 200, 300, 400] as const;

export function useBrief(): [TripBrief, (patch: Partial<TripBrief>) => void] {
  const stored = useSyncExternalStore(subscribeToBrief, getBriefSnapshot, getBriefServerSnapshot);
  const brief = stored ?? DEFAULT_BRIEF;
  return [brief, (patch) => saveBrief({ ...brief, ...patch })];
}

export function ControlStrip() {
  const [brief, set] = useBrief();
  const [open, setOpen] = useState<PanelId | null>(null);
  const [term, setTerm] = useState('');
  const router = useRouter();

  const toggle = (id: PanelId) => setOpen(open === id ? null : id);

  /* Not everyone is browsing. Someone who already knows where they are going should be able to
     type it and land on the costed trip, without the board in between. */
  const matches = useMemo(() => {
    const q = term.trim().toLowerCase();
    if (!q) return [];
    return DESTINATIONS.filter(
      (d) => d.name.toLowerCase().includes(q) || d.region.toLowerCase().includes(q),
    ).slice(0, 5);
  }, [term]);

  const go = (slug: string) => {
    setOpen(null);
    setTerm('');
    router.push(`/trip/${slug}`);
  };

  return (
    <div className="sticky top-0 z-40 border-b border-hairline bg-ground/92 backdrop-blur">
      <div className={`${MEASURE} flex items-center gap-3 py-3`}>
        <Link href="/" className="shrink-0" aria-label="WhereTo, back to all trips">
          <Image
            src="/assets/logo.webp"
            alt=""
            width={32}
            height={32}
            priority
            className="h-8 w-8 rounded-full object-cover"
          />
        </Link>

        {/* A rail rather than a wrap: four chips must stay on one line at phone width, and a
            second row would push the board below the fold on every screen. */}
        <div className="wt-rail flex flex-1 items-center gap-2 overflow-x-auto">
          <StripChip
            icon={<Search size={14} strokeWidth={2.4} />}
            label="Search"
            on={open === 'search'}
            onClick={() => toggle('search')}
          />
          <StripChip
            icon={<MapPin size={14} strokeWidth={2.4} />}
            label={ORIGINS.find((o) => o.id === brief.origin)?.name ?? 'Los Angeles'}
            on={open === 'origin'}
            onClick={() => toggle('origin')}
          />
          <StripChip
            icon={<Users size={14} strokeWidth={2.4} />}
            label={`${describeParty(brief)}, ${describeDriver(brief.driver)}`}
            on={open === 'party'}
            onClick={() => toggle('party')}
          />
          <StripChip
            icon={<CalendarDays size={14} strokeWidth={2.4} />}
            label={describeWindow(brief.windowId)}
            on={open === 'dates'}
            onClick={() => toggle('dates')}
          />
          <StripChip
            icon={<Wallet size={14} strokeWidth={2.4} />}
            label={describeBudget(brief.budgetPerPerson)}
            on={open === 'budget'}
            onClick={() => toggle('budget')}
          />
        </div>
      </div>

      {open ? (
        <div className="border-t border-hairline bg-paper">
          <div className={`${MEASURE} py-4`}>
            {open === 'search' ? (
              <div>
                <input
                  type="search"
                  value={term}
                  autoFocus
                  onChange={(e) => setTerm(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && matches[0]) go(matches[0].slug);
                    if (e.key === 'Escape') setOpen(null);
                  }}
                  placeholder="Where to?"
                  aria-label="Search destinations"
                  className="w-full rounded-full border border-hairline bg-ground px-4 py-2.5 text-[0.9375rem] font-medium outline-none placeholder:text-faint focus:border-peri-d"
                />
                {matches.length > 0 ? (
                  <ul className="mt-3 flex flex-col gap-1">
                    {matches.map((d) => (
                      <li key={d.slug}>
                        <button
                          type="button"
                          onClick={() => go(d.slug)}
                          className="wt-ease flex w-full items-center gap-2.5 rounded-[10px] px-3 py-2 text-left hover:bg-ground"
                        >
                          <span
                            className="h-2 w-2 shrink-0 rounded-full"
                            style={{ background: `var(--${d.tone})` }}
                            aria-hidden
                          />
                          <span className="text-[0.9375rem] font-semibold">{d.name}</span>
                          <span className="type-body text-muted">{d.region}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}
                {term.trim() && matches.length === 0 ? (
                  <p className="mt-3 px-3 text-[0.9375rem] font-bold">No match</p>
                ) : null}
              </div>
            ) : null}

            {open === 'origin' ? (
              <Row label="Starting from">
                {ORIGINS.map((o) => (
                  <Chip key={o.id} on={brief.origin === o.id} onClick={() => set({ origin: o.id })}>
                    {o.name}
                  </Chip>
                ))}
              </Row>
            ) : null}

            {open === 'party' ? (
              <div className="flex flex-col gap-3.5">
                <Row label="Going">
                  {PARTY_SIZES.map((n) => (
                    <Chip
                      key={n}
                      on={brief.partySize === n}
                      onClick={() => set({ partySize: n as PartySize })}
                    >
                      {n}
                    </Chip>
                  ))}
                </Row>
                <Row label="Driver">
                  <Chip
                    on={!brief.driver.hasLicence}
                    onClick={() => set({ driver: { hasLicence: false, ageBand: null } })}
                  >
                    No licence
                  </Chip>
                  {(Object.keys(AGE_BAND_LABELS) as AgeBand[]).map((band) => (
                    <Chip
                      key={band}
                      on={brief.driver.hasLicence && brief.driver.ageBand === band}
                      onClick={() => set({ driver: { hasLicence: true, ageBand: band } })}
                    >
                      {AGE_BAND_LABELS[band]}
                    </Chip>
                  ))}
                </Row>
              </div>
            ) : null}

            {open === 'dates' ? (
              <Row label="Weekend">
                <Chip on={brief.windowId === null} onClick={() => set({ windowId: null })}>
                  Any weekend
                </Chip>
                {WINDOWS.map((w) => (
                  <Chip
                    key={w.id}
                    on={brief.windowId === w.id}
                    onClick={() => set({ windowId: w.id })}
                  >
                    {w.label}
                  </Chip>
                ))}
              </Row>
            ) : null}

            {open === 'budget' ? (
              <Row label="Per person">
                <Chip
                  on={brief.budgetPerPerson === null}
                  onClick={() => set({ budgetPerPerson: null })}
                >
                  No budget
                </Chip>
                {BUDGETS.map((b) => (
                  <Chip
                    key={b}
                    on={brief.budgetPerPerson === b}
                    onClick={() => set({ budgetPerPerson: b })}
                  >
                    Under ${b}
                  </Chip>
                ))}
              </Row>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function StripChip({
  icon,
  label,
  on,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  on: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={on}
      className={`wt-ease flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-[0.8125rem] font-semibold ${
        on
          ? 'border-peri-d bg-peri text-ink'
          : 'border-hairline bg-paper text-ink hover:border-peri-d'
      }`}
    >
      <span className="shrink-0 text-muted">{icon}</span>
      <span className="whitespace-nowrap">{label}</span>
      {on ? <Check size={13} strokeWidth={3} className="shrink-0" /> : null}
    </button>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2.5">
      <Eyebrow className="w-[4.5rem] shrink-0">{label}</Eyebrow>
      <div className="flex flex-wrap items-center gap-2">{children}</div>
    </div>
  );
}
