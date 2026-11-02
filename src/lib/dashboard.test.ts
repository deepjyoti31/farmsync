import { describe, expect, it } from 'vitest';
import { attentionItems, cropProgress, fieldStage, greetingKey, monthTotals, rainAdvice } from './dashboard';

const today = new Date(2026, 10, 2); // 2 Nov 2026

describe('greetingKey', () => {
  it('follows the time of day', () => {
    expect(greetingKey(new Date(2026, 10, 2, 7))).toBe('morning');
    expect(greetingKey(new Date(2026, 10, 2, 13))).toBe('afternoon');
    expect(greetingKey(new Date(2026, 10, 2, 19))).toBe('evening');
  });
});

describe('cropProgress', () => {
  it('counts days since sowing against the planned season', () => {
    const p = cropProgress({ planting_date: '2026-10-12', expected_harvest_date: '2027-02-14', status: 'growing' }, today);
    expect(p.stage).toBe('growing');
    expect(p.day).toBe(21);
    expect(p.totalDays).toBe(125);
    expect(p.percent).toBe(17);
  });

  it('treats future sowing as planned', () => {
    const p = cropProgress({ planting_date: '2026-11-08', expected_harvest_date: '2027-03-30', status: 'growing' }, today);
    expect(p.stage).toBe('planned');
    expect(p.percent).toBe(0);
  });

  it('marks the last stretch of the season as ready', () => {
    const p = cropProgress({ planting_date: '2025-12-07', expected_harvest_date: '2026-11-15', status: 'growing' }, today);
    expect(p.stage).toBe('ready');
  });

  it('is harvested once a harvest date is recorded', () => {
    const p = cropProgress({ planting_date: '2026-06-20', expected_harvest_date: '2026-10-15', actual_harvest_date: '2026-10-18', status: 'growing' }, today);
    expect(p.stage).toBe('harvested');
  });
});

describe('fieldStage', () => {
  it('picks the most advanced live planting', () => {
    expect(
      fieldStage(
        [
          { planting_date: '2026-11-20', expected_harvest_date: null, status: 'planned' },
          { planting_date: '2026-10-20', expected_harvest_date: '2027-01-28', status: 'growing' },
        ],
        today,
      ),
    ).toBe('growing');
    expect(fieldStage([], today)).toBe('empty');
  });
});

describe('rainAdvice', () => {
  it('returns the first wet day', () => {
    const wet = rainAdvice([
      { date: '2026-11-03', precipitation_chance: 10 },
      { date: '2026-11-04', precipitation_chance: 80 },
    ]);
    expect(wet?.date).toBe('2026-11-04');
    expect(rainAdvice([{ date: '2026-11-03', precipitation_chance: 20 }])).toBeNull();
  });
});

describe('monthTotals', () => {
  it('splits income from expenses', () => {
    expect(monthTotals([{ amount: 48200, type: 'income' }, { amount: 21650, type: 'expense' }])).toEqual({ income: 48200, expense: 21650, net: 26550 });
  });
});

describe('attentionItems', () => {
  it('collects low stock, expiry, service and health, most urgent first', () => {
    const items = attentionItems(
      {
        stock: [
          { name: 'Urea', quantity: 2, minimum_stock: 5, unit: 'bags', expiry_date: null },
          { name: 'Seed', quantity: 40, minimum_stock: 5, unit: 'kg', expiry_date: '2026-11-01' },
          { name: 'Diesel', quantity: 80, minimum_stock: 20, unit: 'L', expiry_date: null },
        ],
        equipment: [
          { name: 'Tractor', next_maintenance_date: '2026-11-10' },
          { name: 'Sprayer', next_maintenance_date: '2027-02-01' },
        ],
        health: [{ label: 'Cow #12', recordType: 'Vaccination', daysUntilDue: 3 }],
      },
      today,
    );
    expect(items.map((i) => i.kind)).toEqual(['expiry', 'stock', 'health', 'service']);
    expect(items[1].title).toBe('Urea: 2 bags left');
    expect(items[0].title).toBe('Seed has expired');
  });
});
