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

/** Compact rupee label for chart axes: ₹1.5L, ₹50k, ₹0. */
export function compactRupees(n: number): string {
  if (n >= 1e7) return `₹${+(n / 1e7).toFixed(1)}Cr`;
  if (n >= 1e5) return `₹${+(n / 1e5).toFixed(1)}L`;
  if (n >= 1e3) return `₹${+(n / 1e3).toFixed(1)}k`;
  return `₹${Math.round(n)}`;
}
