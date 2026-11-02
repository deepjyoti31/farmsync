import { describe, expect, it } from 'vitest';
import { getDateRange } from './dateRanges';

// Months are zero-based in the Date constructor.
const at = (y: number, m: number, d: number) => new Date(y, m - 1, d, 10, 30);

describe('getDateRange', () => {
  it('this month runs from the 1st to today', () => {
    expect(getDateRange('this-month', at(2026, 11, 2))).toEqual({
      startDate: '2026-11-01',
      endDate: '2026-11-02',
    });
  });

  it('last month crosses the year boundary in January', () => {
    expect(getDateRange('last-month', at(2026, 1, 15))).toEqual({
      startDate: '2025-12-01',
      endDate: '2025-12-31',
    });
  });

  it('last quarter in Q3 is April to June of the same year', () => {
    expect(getDateRange('last-quarter', at(2026, 8, 10))).toEqual({
      startDate: '2026-04-01',
      endDate: '2026-06-30',
    });
  });

  it('last quarter in Q1 is October to December of the previous year', () => {
    expect(getDateRange('last-quarter', at(2026, 2, 10))).toEqual({
      startDate: '2025-10-01',
      endDate: '2025-12-31',
    });
  });

  it('this quarter starts on the first month of the quarter', () => {
    expect(getDateRange('this-quarter', at(2026, 11, 2)).startDate).toBe('2026-10-01');
  });

  it('last year covers the full previous calendar year', () => {
    expect(getDateRange('last-year', at(2026, 6, 1))).toEqual({
      startDate: '2025-01-01',
      endDate: '2025-12-31',
    });
  });

  it('falls back to year to date for unknown periods', () => {
    expect(getDateRange('something-else', at(2026, 3, 4))).toEqual({
      startDate: '2026-01-01',
      endDate: '2026-03-04',
    });
  });
});
