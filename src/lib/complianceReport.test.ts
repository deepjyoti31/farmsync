import { describe, expect, it } from 'vitest';
import { buildComplianceReport, totalsBy } from './complianceReport';

describe('buildComplianceReport', () => {
  const inputs = [
    { log_date: '2026-07-10', type: 'fertilizer', product_name: 'Vermicompost', quantity: 200, unit: 'kg' },
    { log_date: '2026-06-01', type: 'fertilizer', product_name: 'Urea', quantity: '50.5', unit: 'kg' },
    { log_date: '2026-06-15', type: 'pesticide', product_name: 'Neem oil', quantity: 2, unit: 'litres' },
  ];
  const water = [
    { usage_date: '2026-08-01', volume: 12000, unit: 'litres', source: 'well' },
    { usage_date: '2026-05-20', volume: 8000, unit: 'litres', source: 'well' },
    { usage_date: '2026-06-02', volume: 3, unit: 'hours', source: null },
  ];

  const report = buildComplianceReport(inputs, water);

  it('sorts entries by date and spans the period of all records', () => {
    expect(report.inputs.map((i) => i.product_name)).toEqual(['Urea', 'Neem oil', 'Vermicompost']);
    expect(report.periodStart).toBe('2026-05-20');
    expect(report.periodEnd).toBe('2026-08-01');
  });

  it('totals inputs by type and unit', () => {
    expect(report.inputTotals).toEqual([
      { key: 'fertilizer', unit: 'kg', quantity: 250.5, entries: 2 },
      { key: 'pesticide', unit: 'litres', quantity: 2, entries: 1 },
    ]);
  });

  it('totals water by source without mixing units', () => {
    expect(report.waterTotals).toEqual([
      { key: 'unspecified', unit: 'hours', quantity: 3, entries: 1 },
      { key: 'well', unit: 'litres', quantity: 20000, entries: 2 },
    ]);
  });

  it('handles an empty farm', () => {
    expect(buildComplianceReport([], [])).toMatchObject({ periodStart: null, periodEnd: null, inputTotals: [] });
  });
});

describe('totalsBy', () => {
  it('keeps the same key with different units separate', () => {
    const rows = [
      { k: 'urea', u: 'kg', q: 1 },
      { k: 'urea', u: 'bags', q: 2 },
    ];
    expect(totalsBy(rows, (r) => r.k, (r) => r.u, (r) => r.q)).toHaveLength(2);
  });
});
