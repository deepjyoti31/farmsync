import { addMonths, format, parseISO, startOfMonth } from 'date-fns';

export type MoneyType = 'income' | 'expense';

export interface TransactionLike {
  amount: number | string;
  transaction_date: string;
  type?: string | null;
  category?: { name?: string | null; type?: string | null } | null;
}

/** A transaction's own type wins; otherwise its category's type. Anything else is unknown. */
export function transactionType(t: Pick<TransactionLike, 'type' | 'category'>): MoneyType | null {
  const raw = (t.type ?? t.category?.type ?? '').toLowerCase();
  return raw === 'income' || raw === 'expense' ? raw : null;
}

/** Sum of amounts for one type, using the same type rule as `transactionType`. */
export function totalOfType(
  rows: Pick<TransactionLike, 'amount' | 'type' | 'category'>[],
  type: MoneyType,
): number {
  return rows.reduce((sum, r) => (transactionType(r) === type ? sum + (Number(r.amount) || 0) : sum), 0);
}

export interface MonthBucket {
  /** yyyy-MM */
  key: string;
  /** Short month name, e.g. "Nov" */
  label: string;
  /** Long name with year, e.g. "November 2026" */
  long: string;
  income: number;
  expense: number;
}

/** Income and expense per calendar month for the `months` months ending with the month of `today`. */
export function monthlySeries(rows: TransactionLike[], months = 6, today: Date = new Date()): MonthBucket[] {
  const first = startOfMonth(addMonths(today, -(months - 1)));
  const buckets: MonthBucket[] = Array.from({ length: months }, (_, i) => {
    const m = addMonths(first, i);
    return { key: format(m, 'yyyy-MM'), label: format(m, 'MMM'), long: format(m, 'MMMM yyyy'), income: 0, expense: 0 };
  });
  const index = new Map(buckets.map((b, i) => [b.key, i]));
  for (const r of rows) {
    const i = index.get(format(parseISO(r.transaction_date), 'yyyy-MM'));
    const type = transactionType(r);
    if (i === undefined || !type) continue;
    buckets[i][type] += Number(r.amount) || 0;
  }
  return buckets;
}

/** Totals per category name for one type, largest first. */
export function categoryTotals(rows: TransactionLike[], type: MoneyType): { name: string; total: number }[] {
  const map = new Map<string, number>();
  for (const r of rows) {
    if (transactionType(r) !== type) continue;
    const name = r.category?.name || 'Uncategorised';
    map.set(name, (map.get(name) ?? 0) + (Number(r.amount) || 0));
  }
  return [...map.entries()].map(([name, total]) => ({ name, total })).sort((a, b) => b.total - a.total);
}

/** A round axis maximum at or above `value`, e.g. 142000 → 150000. */
export function niceMax(value: number): number {
  if (value <= 0) return 1;
  const pow = 10 ** Math.floor(Math.log10(value));
  const steps = [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10];
  const step = steps.find((s) => s * pow >= value) ?? 10;
  return step * pow;
}

const COMPACT_UNITS = [
  { size: 1e7, suffix: 'Cr' },
  { size: 1e5, suffix: 'L' },
  { size: 1e3, suffix: 'k' },
  { size: 1, suffix: '' },
];

/**
 * Compact rupee label for chart axes: ₹1.5L, ₹50k, ₹0, -₹2k.
 * A value that rounds up to the next unit uses that unit (₹99,999 is ₹1L, not ₹100k).
 */
export function compactRupees(n: number): string {
  const abs = Math.abs(n);
  const shown = (size: number) => (size === 1 ? Math.round(abs) : +(abs / size).toFixed(1));
  // The largest unit the value reaches, stepping up one when rounding reaches the next.
  let i = COMPACT_UNITS.findIndex((u) => abs >= u.size);
  if (i === -1) i = COMPACT_UNITS.length - 1;
  if (i > 0 && shown(COMPACT_UNITS[i].size) * COMPACT_UNITS[i].size >= COMPACT_UNITS[i - 1].size) i -= 1;
  const value = shown(COMPACT_UNITS[i].size);
  if (value === 0) return '₹0';
  return `${n < 0 ? '-' : ''}₹${value}${COMPACT_UNITS[i].suffix}`;
}
