import { describe, expect, it } from 'vitest';
import { plantingSegments, seasonWindow, todayOffset } from './cropTimeline';

const today = new Date(2026, 10, 3); // 3 Nov 2026

describe('seasonWindow', () => {
  it('spans whole months from earliest sowing to latest harvest, including today', () => {
    const win = seasonWindow(
      [
        { planting_date: '2026-10-12', expected_harvest_date: '2027-02-14', status: 'growing' },
        { planting_date: '2026-11-08', expected_harvest_date: '2027-03-30', status: 'planned' },
      ],
      today,
    );
    expect(win.start).toEqual(new Date(2026, 9, 1));
    expect(win.end.getMonth()).toBe(3); // April, so the harvest mark fits
    expect(win.months.map((m) => m.label)).toEqual(['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr']);
    const total = win.months.reduce((s, m) => s + m.width, 0);
    expect(total).toBeCloseTo(100, 5);
  });

  it('clips long-running plantings instead of stretching the view', () => {
    const win = seasonWindow(
      [
        { planting_date: '2025-09-01', expected_harvest_date: null, status: 'growing' },
        { planting_date: '2026-10-12', expected_harvest_date: '2027-02-14', status: 'growing' },
      ],
      today,
    );
    expect(win.start).toEqual(new Date(2026, 7, 1)); // August: three months before November
    expect(win.months.at(-1)?.label).toBe('Feb'); // harvest 14 Feb plus the harvest mark
  });

  it('is at least six months long', () => {
    const win = seasonWindow([], today);
    expect(win.months).toHaveLength(6);
    expect(todayOffset(win, today)).not.toBeNull();
  });
});

describe('plantingSegments', () => {
  const win = seasonWindow([{ planting_date: '2026-10-12', expected_harvest_date: '2027-02-14', status: 'growing' }], today);

  it('splits a growing crop into grown, expected and harvest', () => {
    const segs = plantingSegments({ planting_date: '2026-10-12', expected_harvest_date: '2027-02-14', status: 'growing' }, win, today);
    expect(segs.map((s) => s.kind)).toEqual(['grown', 'expected', 'harvest']);
    expect(segs[0].left + segs[0].width).toBeCloseTo(segs[1].left, 5);
  });

  it('draws planned crops as one planned bar plus the harvest mark', () => {
    const segs = plantingSegments({ planting_date: '2026-11-20', expected_harvest_date: '2027-02-01', status: 'planned' }, win, today);
    expect(segs.map((s) => s.kind)).toEqual(['planned', 'harvest']);
  });

  it('clips bars that start before the window', () => {
    const segs = plantingSegments({ planting_date: '2025-12-01', expected_harvest_date: '2026-11-20', status: 'growing' }, win, today);
    expect(segs[0].left).toBe(0);
  });
});
