'use client';

import type { Quest } from '@/lib/domain/types';
import { formatMoney, summariseActuals } from '@/lib/domain/logic';
import { formatLongDate } from '@/lib/util/dates';

/**
 * Estimate against what people actually paid, per line.
 *
 * This is the part that compounds: every trip that reports back makes the next group's estimate
 * less of a guess. It is given the same weight as the plan itself rather than tucked underneath.
 */
export function ActualsTable({ quest }: { quest: Quest }) {
  const actuals = quest.actuals;
  if (!actuals) return null;

  const summary = summariseActuals(actuals);
  const over = summary.difference > 0;

  return (
    <section>
      <h2 className="type-title">What it actually cost</h2>
      <p className="type-meta mt-1 text-muted">
        Reported by {actuals.reportedBy} of the {actuals.participantCount} who went, on{' '}
        {formatLongDate(actuals.reportedAt)}. Per person.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <Figure label="Estimated" value={formatMoney(summary.estimatedTotal)} />
        <Figure label="Actually paid" value={formatMoney(summary.actualTotal)} emphasis />
        <Figure
          label={over ? 'Over by' : summary.difference === 0 ? 'Bang on' : 'Under by'}
          value={
            summary.difference === 0
              ? '—'
              : `${over ? '+' : '−'}${formatMoney(Math.abs(summary.difference))}`
          }
          tone={over ? 'warn' : 'good'}
        />
      </div>

      <div className="mt-4 overflow-x-auto rounded-xl border border-line">
        <table className="w-full min-w-[34rem] border-collapse bg-surface text-left">
          <thead>
            <tr className="border-b border-line">
              <th scope="col" className="px-4 py-2.5 type-micro text-faint">
                Line
              </th>
              <th scope="col" className="px-4 py-2.5 type-micro text-right text-faint">
                Estimated
              </th>
              <th scope="col" className="px-4 py-2.5 type-micro text-right text-faint">
                Actual
              </th>
              <th scope="col" className="px-4 py-2.5 type-micro text-right text-faint">
                Difference
              </th>
            </tr>
          </thead>
          <tbody>
            {actuals.lineItems.map((item) => {
              const diff = item.actual - item.estimated;
              return (
                <tr key={item.label} className="border-b border-line last:border-b-0">
                  <th scope="row" className="px-4 py-3 align-top font-normal">
                    <span className="type-body font-medium">{item.label}</span>
                    {item.note ? (
                      <span className="type-meta mt-0.5 block text-muted">{item.note}</span>
                    ) : null}
                  </th>
                  <td className="px-4 py-3 align-top text-right type-body tabular-nums text-muted">
                    {formatMoney(item.estimated)}
                  </td>
                  <td className="px-4 py-3 align-top text-right type-body font-medium tabular-nums">
                    {formatMoney(item.actual)}
                  </td>
                  <td
                    className={`px-4 py-3 align-top text-right type-body tabular-nums ${
                      diff > 0 ? 'text-warn' : diff < 0 ? 'text-good' : 'text-faint'
                    }`}
                  >
                    {diff === 0 ? '—' : `${diff > 0 ? '+' : '−'}${formatMoney(Math.abs(diff))}`}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {summary.biggestSurprise && summary.biggestSurprise.actual !== summary.biggestSurprise.estimated ? (
        <p className="type-meta mt-3 text-muted">
          The line that moved most was{' '}
          <span className="font-medium text-ink">{summary.biggestSurprise.label}</span>, by{' '}
          {formatMoney(
            Math.abs(summary.biggestSurprise.actual - summary.biggestSurprise.estimated),
          )}
          .
        </p>
      ) : null}

      <blockquote className="mt-4 rounded-xl border border-line bg-surface-2 p-4">
        <p className="type-body">{actuals.hostNote}</p>
        <footer className="type-meta mt-2 text-muted">— the host, afterwards</footer>
      </blockquote>
    </section>
  );
}

function Figure({
  label,
  value,
  emphasis = false,
  tone = 'plain',
}: {
  label: string;
  value: string;
  emphasis?: boolean;
  tone?: 'plain' | 'warn' | 'good';
}) {
  const toneClass =
    tone === 'warn' ? 'text-warn' : tone === 'good' ? 'text-good' : emphasis ? 'text-ink' : 'text-muted';
  return (
    <div className="rounded-xl border border-line bg-surface p-4">
      <p className="type-micro text-faint">{label}</p>
      <p className={`mt-1 type-title tabular-nums ${toneClass}`}>{value}</p>
    </div>
  );
}
