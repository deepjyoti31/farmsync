import { describe, expect, it } from 'vitest';
import { categoryTotals, compactRupees, monthlySeries, niceMax, totalOfType, transactionType } from './financeSummary';

describe('transactionType', () => {
  it('prefers the transaction type, then the category type', () => {
    expect(transactionType({ type: 'expense', category: { type: 'income' } })).toBe('expense');
    expect(transactionType({ type: null, category: { type: 'income' } })).toBe('income');
    expect(transactionType({ type: null, category: null })).toBeNull();
  });
});

describe('totalOfType', () => {
  const rows = [
    // Entered through the add-transaction form: only the category carries the type.
    { amount: 5000, type: null, category: { type: 'income' } },
    { amount: '2500', category: { type: 'Income' } },
    { amount: 1200, type: 'income', category: null },
    { amount: 800, type: null, category: { type: 'expense' } },
    // Own type wins over the category's.
    { amount: 300, type: 'expense', category: { type: 'income' } },
    { amount: 999, type: null, category: null },
  ];

  it('counts income whether the type is on the transaction or its category', () => {
    expect(totalOfType(rows, 'income')).toBe(8700);
  });

  it('counts expenses with the same rule', () => {
    expect(totalOfType(rows, 'expense')).toBe(1100);
  });

  it('is zero for no rows', () => {
    expect(totalOfType([], 'income')).toBe(0);
  });
});

describe('monthlySeries', () => {
  it('buckets by month for the trailing window and skips unknown types', () => {
    const today = new Date(2026, 10, 3);
    const series = monthlySeries(
      [
        { amount: 100, transaction_date: '2026-11-01', type: 'income' },
        { amount: '40', transaction_date: '2026-11-02', category: { type: 'expense' } },
        { amount: 70, transaction_date: '2026-10-15', category: { type: 'income' } },
        { amount: 999, transaction_date: '2026-03-01', type: 'income' },
        { amount: 5, transaction_date: '2026-11-02' },
      ],
      3,
      today,
    );
    expect(series.map((b) => b.key)).toEqual(['2026-09', '2026-10', '2026-11']);
    expect(series[2]).toMatchObject({ income: 100, expense: 40, label: 'Nov' });
    expect(series[1].income).toBe(70);
  });
});

describe('categoryTotals', () => {
  it('sums one type per category, largest first', () => {
    expect(
      categoryTotals(
        [
          { amount: 10, transaction_date: '2026-11-01', type: 'expense', category: { name: 'Seed' } },
          { amount: 30, transaction_date: '2026-11-01', category: { name: 'Labour', type: 'expense' } },
          { amount: 5, transaction_date: '2026-11-01', type: 'expense', category: null },
          { amount: 50, transaction_date: '2026-11-01', type: 'income', category: { name: 'Sales' } },
        ],
        'expense',
      ),
    ).toEqual([
      { name: 'Labour', total: 30 },
      { name: 'Seed', total: 10 },
      { name: 'Uncategorised', total: 5 },
    ]);
  });
});

describe('axis helpers', () => {
  it('rounds the axis up and labels rupees compactly', () => {
    expect(niceMax(142000)).toBe(150000);
    expect(niceMax(38000)).toBe(40000);
    expect(niceMax(0)).toBe(1);
    expect(compactRupees(150000)).toBe('₹1.5L');
    expect(compactRupees(50000)).toBe('₹50k');
    expect(compactRupees(0)).toBe('₹0');
  });
});
