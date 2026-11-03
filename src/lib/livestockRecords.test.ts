import { describe, expect, it } from 'vitest';
import { ageLabel, animalLabel, dailyProduction, herdSummary, productionTotal, upcomingHealthDue } from './livestockRecords';

const today = new Date(2026, 10, 2, 9, 0); // 2 Nov 2026

describe('animalLabel', () => {
  it('combines type, tag and breed', () => {
    expect(animalLabel({ tag_id: 'A-102', breed: 'Gir', livestock_type: { name: 'Cattle' } })).toBe('Cattle #A-102 (Gir)');
    expect(animalLabel({ livestock_type: { name: 'Goat' } })).toBe('Goat');
  });

  it('labels farm-level entries', () => {
    expect(animalLabel(null)).toBe('Whole herd / flock');
  });
});

describe('upcomingHealthDue', () => {
  const rec = (id: string, livestock_id: string, record_type: string, record_date: string, next_due_date: string | null) => ({
    id, livestock_id, record_type, record_date, next_due_date,
  });

  it('returns overdue and soon-due follow-ups, most urgent first', () => {
    const due = upcomingHealthDue(
      [
        rec('a', 'cow1', 'vaccination', '2026-05-01', '2026-11-10'),
        rec('b', 'cow2', 'deworming', '2026-08-01', '2026-10-30'),
        rec('c', 'cow3', 'vaccination', '2026-06-01', '2027-06-01'),
        rec('d', 'cow4', 'checkup', '2026-10-01', null),
      ],
      today,
    );
    expect(due.map((d) => [d.record.id, d.daysUntilDue])).toEqual([
      ['b', -3],
      ['a', 8],
    ]);
  });

  it('ignores reminders superseded by a later record of the same type', () => {
    const due = upcomingHealthDue(
      [
        rec('old', 'cow1', 'vaccination', '2025-11-01', '2026-11-01'),
        rec('new', 'cow1', 'vaccination', '2026-11-01', '2027-11-01'),
      ],
      today,
    );
    expect(due).toEqual([]);
  });
});

describe('production summaries', () => {
  const entries = [
    { production_date: '2026-11-02', production_type: 'milk', quantity: 10 },
    { production_date: '2026-11-02', production_type: 'milk', quantity: '4.5' },
    { production_date: '2026-11-01', production_type: 'milk', quantity: 12 },
    { production_date: '2026-10-20', production_type: 'milk', quantity: 9 },
    { production_date: '2026-11-02', production_type: 'eggs', quantity: 120 },
  ];

  it('builds zero-filled daily totals for one type', () => {
    const series = dailyProduction(entries, 'milk', 3, today);
    expect(series.map((p) => [p.date, p.quantity])).toEqual([
      ['2026-10-31', 0],
      ['2026-11-01', 12],
      ['2026-11-02', 14.5],
    ]);
  });

  it('totals a type over a trailing window', () => {
    expect(productionTotal(entries, 'milk', 7, today)).toBe(26.5);
    expect(productionTotal(entries, 'milk', 30, today)).toBe(35.5);
    expect(productionTotal(entries, 'eggs', 1, today)).toBe(120);
  });
});

describe('herdSummary', () => {
  it('counts live animals by type, largest group first', () => {
    const s = herdSummary([
      { livestock_type: { name: 'Cow' }, status: 'active' },
      { livestock_type: { name: 'Goat' }, status: 'active' },
      { livestock_type: { name: 'Cow' }, status: null },
      { livestock_type: { name: 'Cow' }, status: 'sold' },
      { livestock_type: null, status: 'active' },
    ]);
    expect(s.active).toBe(4);
    expect(s.byType).toEqual([
      { name: 'Cow', count: 2 },
      { name: 'Animal', count: 1 },
      { name: 'Goat', count: 1 },
    ]);
  });
});

describe('ageLabel', () => {
  const today = new Date(2026, 10, 3);
  it('shows years and months, months, or days', () => {
    expect(ageLabel('2024-08-01', today)).toBe('2 y 3 m');
    expect(ageLabel('2025-11-03', today)).toBe('1 y');
    expect(ageLabel('2026-06-10', today)).toBe('4 m');
    expect(ageLabel('2026-10-22', today)).toBe('12 d');
    expect(ageLabel(null, today)).toBeNull();
    expect(ageLabel('2027-01-01', today)).toBeNull();
  });
});
