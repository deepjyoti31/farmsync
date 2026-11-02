import { describe, expect, it } from 'vitest';
import { cropEvents, groupByDate, monthGrid } from './cropCalendar';

describe('cropEvents', () => {
  const fields = new Map([['f1', 'North']]);

  it('creates sowing and expected harvest events, sorted by date', () => {
    const events = cropEvents(
      [{ id: 'p1', crop: { name: 'Rice' }, field_id: 'f1', planting_date: '2026-06-01', expected_harvest_date: '2026-10-15' }],
      fields,
    );
    expect(events.map((e) => [e.date, e.kind, e.cropName, e.fieldName])).toEqual([
      ['2026-06-01', 'planting', 'Rice', 'North'],
      ['2026-10-15', 'expected_harvest', 'Rice', 'North'],
    ]);
  });

  it('prefers the actual harvest date and falls back to the planting name', () => {
    const events = cropEvents([
      {
        id: 'p1', name: 'Local maize', field_id: 'f9', planting_date: '2026-03-01',
        expected_harvest_date: '2026-07-01', actual_harvest_date: '2026-07-04',
      },
    ]);
    expect(events.map((e) => [e.kind, e.date, e.cropName, e.fieldName])).toEqual([
      ['planting', '2026-03-01', 'Local maize', 'Field'],
      ['harvest', '2026-07-04', 'Local maize', 'Field'],
    ]);
  });

  it('drops the expected harvest of a failed crop', () => {
    const events = cropEvents([
      { id: 'p1', field_id: 'f1', status: 'failed', planting_date: '2026-03-01', expected_harvest_date: '2026-07-01' },
    ]);
    expect(events.map((e) => e.kind)).toEqual(['planting']);
  });
});

describe('monthGrid', () => {
  it('pads November 2026 to whole Monday-first weeks', () => {
    const weeks = monthGrid(2026, 10);
    expect(weeks).toHaveLength(6);
    expect(weeks[0][0]).toEqual({ date: '2026-10-26', dayOfMonth: 26, inMonth: false });
    expect(weeks[0][6]).toEqual({ date: '2026-11-01', dayOfMonth: 1, inMonth: true });
    expect(weeks[5][6].date).toBe('2026-12-06');
    expect(weeks.every((w) => w.length === 7)).toBe(true);
  });

  it('supports Sunday-first weeks', () => {
    expect(monthGrid(2026, 10, 0)[0][0].date).toBe('2026-11-01');
  });
});

describe('groupByDate', () => {
  it('groups events sharing a date', () => {
    const events = cropEvents([
      { id: 'a', name: 'Rice', field_id: 'f', planting_date: '2026-06-01' },
      { id: 'b', name: 'Okra', field_id: 'f', planting_date: '2026-06-01' },
    ]);
    expect(groupByDate(events).get('2026-06-01')?.map((e) => e.cropName)).toEqual(['Okra', 'Rice']);
  });
});
