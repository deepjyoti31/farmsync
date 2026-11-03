import React, { useState } from 'react';
import { compactRupees, niceMax, type MonthBucket } from '@/lib/financeSummary';
import { formatMoney } from '@/lib/dashboard';
import { cn } from '@/lib/utils';

/**
 * Grouped bars of income and expense per month, one shared axis.
 * Hover or focus a month for exact values; the same numbers are in a hidden table for screen readers.
 */
const MonthlyChart = ({ months }: { months: MonthBucket[] }) => {
  const [active, setActive] = useState<string | null>(null);
  const top = niceMax(Math.max(...months.flatMap((m) => [m.income, m.expense]), 0));
  const ticks = [top, (top * 2) / 3, top / 3, 0];
  const pct = (v: number) => `${(v / top) * 100}%`;

  return (
    <section aria-labelledby="monthly-h" className="surface p-5 md:p-6">
      <div className="mb-5 flex flex-wrap items-center gap-x-6 gap-y-2">
        <h2 id="monthly-h" className="text-xl font-bold">
          Income and expenses by month
        </h2>
        <ul aria-label="Legend" className="ms-auto flex gap-4 text-[13px] text-[#34453A] dark:text-muted-foreground">
          <li className="flex items-center gap-2">
            <span aria-hidden="true" className="h-3 w-3 rounded-[3px] bg-chart-income" />
            Income
          </li>
          <li className="flex items-center gap-2">
            <span aria-hidden="true" className="h-3 w-3 rounded-[3px] bg-chart-expense" />
            Expenses
          </li>
        </ul>
      </div>

      <div aria-hidden="true" className="flex gap-3">
        <div className="flex h-60 w-12 shrink-0 flex-col justify-between text-end font-mono text-[11px] text-muted-foreground">
          {ticks.map((t, i) => (
            <span key={i} className={cn(i === 0 && '-translate-y-1/2', i === ticks.length - 1 && 'translate-y-1/2')}>
              {compactRupees(t)}
            </span>
          ))}
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="relative flex h-60 items-end border-b border-input">
            <div className="pointer-events-none absolute inset-0 flex flex-col justify-between">
              {ticks.slice(0, -1).map((_, i) => (
                <span key={i} className="border-t border-muted" />
              ))}
              <span />
            </div>
            {months.map((m, i) => {
              const on = active === m.key;
              const right = i >= months.length - 2;
              return (
                <div
                  key={m.key}
                  tabIndex={0}
                  onMouseEnter={() => setActive(m.key)}
                  onMouseLeave={() => setActive(null)}
                  onFocus={() => setActive(m.key)}
                  onBlur={() => setActive(null)}
                  className={cn('relative flex h-full flex-1 items-end justify-center gap-0.5 rounded-t-md outline-none focus-visible:ring-2 focus-visible:ring-ring', on && 'bg-foreground/[0.04]')}
                >
                  <span className="w-[32%] max-w-7 rounded-t bg-chart-income" style={{ height: pct(m.income) }} />
                  <span className="w-[32%] max-w-7 rounded-t bg-chart-expense" style={{ height: pct(m.expense) }} />
                  {on && (
                    <div
                      className={cn(
                        'absolute top-1 z-10 flex flex-col gap-1 whitespace-nowrap rounded-[10px] bg-sidebar px-3 py-2.5 text-[13px] text-white shadow-[0_6px_18px_rgba(17,38,26,0.25)]',
                        right ? 'end-[calc(50%+34px)]' : 'start-[calc(50%+34px)]',
                      )}
                    >
                      <strong>{m.long}</strong>
                      <span className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-sm bg-[#6FC08E]" /> Income <span className="ms-auto ps-3 font-mono">{formatMoney(m.income)}</span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-sm bg-chart-expense" /> Expenses <span className="ms-auto ps-3 font-mono">{formatMoney(m.expense)}</span>
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div className="flex">
            {months.map((m) => (
              <span key={m.key} className="flex-1 pt-2 text-center font-mono text-xs text-muted-foreground">
                {m.label}
              </span>
            ))}
          </div>
        </div>
      </div>

      <table className="sr-only">
        <caption>Income and expenses by month</caption>
        <thead>
          <tr>
            <th scope="col">Month</th>
            <th scope="col">Income</th>
            <th scope="col">Expenses</th>
          </tr>
        </thead>
        <tbody>
          {months.map((m) => (
            <tr key={m.key}>
              <th scope="row">{m.long}</th>
              <td>{formatMoney(m.income)}</td>
              <td>{formatMoney(m.expense)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
};

export default MonthlyChart;
