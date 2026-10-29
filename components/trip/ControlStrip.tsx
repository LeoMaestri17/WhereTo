'use client';

import Link from 'next/link';
import { useState, useSyncExternalStore, type ReactNode } from 'react';
import { Search } from 'lucide-react';
import { Wordmark } from '@/components/ui/Logo';
import { Eyebrow, MEASURE } from '@/components/ui/primitives';
import { CommandPalette, useCommandPalette } from '@/components/trip/CommandPalette';
import {
  BudgetEditor,
  BudgetGlyph,
  BUDGET_MAX,
  BUDGET_MIN,
  CONTROL_TONE,
  DatesEditor,
  DatesGlyph,
  DriverEditor,
  LicenceGlyph,
  OriginGlyph,
  PeopleEditor,
  PeopleGlyph,
} from '@/components/trip/controls';
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

/**
 * The control strip.
 *
 * Persistent, on every screen, and never a modal. Each control opens a panel underneath the
 * strip rather than over the page, because the point is that changing an answer repopulates what
 * is already below without taking it away first.
 *
 * The controls are objects rather than pills: a stack of faces, a licence card, a strip of
 * weekends, a slider. Five identical rounded rectangles is what a framework gives you for free
 * and it is the least branded thing a product can put at the top of a page. Each also owns one
 * palette colour when open, so you can see which of them you are in without reading any of them.
 *
 * No panel carries a caption. A control that needs a sentence underneath explaining what it does
 * is a control that needs redesigning.
 */

type PanelId = 'origin' | 'people' | 'driver' | 'dates' | 'budget';

export function useBrief(): [TripBrief, (patch: Partial<TripBrief>) => void] {
  const stored = useSyncExternalStore(subscribeToBrief, getBriefSnapshot, getBriefServerSnapshot);
  const brief = stored ?? DEFAULT_BRIEF;
  return [brief, (patch) => saveBrief({ ...brief, ...patch })];
}

export function ControlStrip() {
  const [brief, set] = useBrief();
  const [open, setOpen] = useState<PanelId | null>(null);
  const [paletteOpen, setPaletteOpen] = useCommandPalette();

  const toggle = (id: PanelId) => setOpen(open === id ? null : id);

  return (
    <>
      <div className="sticky top-0 z-40 border-b border-hairline bg-ground/92 backdrop-blur">
        <div className={`${MEASURE} flex items-center gap-3 py-3`}>
          <Link
            href="/"
            className="wt-ease shrink-0 hover:opacity-80"
            aria-label="WhereTo, all trips"
          >
            <Wordmark size={30} />
          </Link>

          <div className="wt-rail flex flex-1 items-center gap-2 overflow-x-auto">
            <ControlButton
              id="origin"
              open={open === 'origin'}
              onClick={() => toggle('origin')}
              label={ORIGINS.find((o) => o.id === brief.origin)?.name ?? 'Los Angeles'}
            >
              <OriginGlyph />
            </ControlButton>

            <ControlButton
              id="people"
              open={open === 'people'}
              onClick={() => toggle('people')}
              label={describeParty(brief)}
            >
              <PeopleGlyph count={brief.partySize} />
            </ControlButton>

            <ControlButton
              id="driver"
              open={open === 'driver'}
              onClick={() => toggle('driver')}
              label={describeDriver(brief.driver)}
            >
              <LicenceGlyph driver={brief.driver} />
            </ControlButton>

            <ControlButton
              id="dates"
              open={open === 'dates'}
              onClick={() => toggle('dates')}
              label={describeWindow(brief.windowId)}
            >
              <DatesGlyph windowId={brief.windowId} />
            </ControlButton>

            <ControlButton
              id="budget"
              open={open === 'budget'}
              onClick={() => toggle('budget')}
              label={describeBudget(brief.budgetPerPerson)}
            >
              <BudgetGlyph value={brief.budgetPerPerson} min={BUDGET_MIN} max={BUDGET_MAX} />
            </ControlButton>
          </div>

          <button
            type="button"
            onClick={() => setPaletteOpen(true)}
            aria-label="Search destinations"
            className="wt-ease flex shrink-0 items-center gap-2 rounded-full border border-hairline bg-paper px-3 py-2 text-[0.8125rem] font-semibold hover:border-peri-d hover:text-peri-d active:translate-y-px"
          >
            <Search size={14} strokeWidth={2.4} />
            <kbd className="hidden rounded-[5px] border border-hairline px-1.5 py-0.5 text-[0.6875rem] font-bold text-muted sm:inline">
              ⌘K
            </kbd>
          </button>
        </div>

        {open ? (
          <div className="border-t border-hairline bg-paper">
            <div className={`${MEASURE} py-4`}>
              {open === 'origin' ? (
                <Row label="From">
                  {ORIGINS.map((o) => (
                    <button
                      key={o.id}
                      type="button"
                      aria-pressed={brief.origin === o.id}
                      onClick={() => set({ origin: o.id })}
                      className="wt-ease flex items-center gap-2.5 rounded-[10px] border px-3 py-2.5 active:translate-y-px"
                      style={{
                        borderColor: brief.origin === o.id ? 'var(--sky)' : 'var(--hairline)',
                        background:
                          brief.origin === o.id
                            ? 'color-mix(in srgb, var(--sky) 22%, var(--paper))'
                            : 'var(--paper)',
                      }}
                    >
                      <OriginGlyph />
                      <span className="text-[0.875rem] font-bold">{o.name}</span>
                    </button>
                  ))}
                </Row>
              ) : null}

              {open === 'people' ? (
                <Row label="Going">
                  <PeopleEditor value={brief.partySize} onChange={(n) => set({ partySize: n })} />
                </Row>
              ) : null}

              {open === 'driver' ? (
                <Row label="Driver">
                  <DriverEditor value={brief.driver} onChange={(d) => set({ driver: d })} />
                </Row>
              ) : null}

              {open === 'dates' ? (
                <Row label="Weekend">
                  <DatesEditor value={brief.windowId} onChange={(id) => set({ windowId: id })} />
                </Row>
              ) : null}

              {open === 'budget' ? (
                <Row label="Budget">
                  <BudgetEditor
                    value={brief.budgetPerPerson}
                    onChange={(v) => set({ budgetPerPerson: v })}
                  />
                </Row>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </>
  );
}

/** The strip slot: the object, its current value, and its colour when open. */
function ControlButton({
  id,
  open,
  onClick,
  label,
  children,
}: {
  id: PanelId;
  open: boolean;
  onClick: () => void;
  label: string;
  children: ReactNode;
}) {
  const tone = CONTROL_TONE[id];
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={open}
      className="wt-ease flex shrink-0 items-center gap-2 rounded-[10px] border px-2.5 py-1.5 text-[0.8125rem] font-semibold active:translate-y-px"
      style={{
        borderColor: open ? tone : 'var(--hairline)',
        background: open ? `color-mix(in srgb, ${tone} 22%, var(--paper))` : 'var(--paper)',
      }}
    >
      {children}
      <span className="whitespace-nowrap">{label}</span>
    </button>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-start gap-x-4 gap-y-3">
      <Eyebrow className="w-[4.5rem] shrink-0 pt-2">{label}</Eyebrow>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
