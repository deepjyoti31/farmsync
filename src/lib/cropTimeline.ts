import { addDays, addMonths, differenceInCalendarDays, endOfMonth, format, max as maxDate, min as minDate, parseISO, startOfMonth } from 'date-fns';
import { cropProgress, type PlantingLike } from './dashboard';

export interface TimelineWindow {
  start: Date;
  end: Date;
  days: number;
  months: { label: string; offset: number; width: number }[];
}

/** Days drawn for the expected harvest when the planting has no window of its own. */
export const HARVEST_MARK_DAYS = 10;

/**
 * The span the season timeline covers: whole months from the earliest sowing
 * to the latest expected harvest of plantings that are not finished, always
 * including today. It starts no more than 3 months before today (older
 * sowings are clipped at the left edge), is at least 6 and at most 15 months long.
 */
export function seasonWindow(plantings: PlantingLike[], today: Date = new Date()): TimelineWindow {
  const live = plantings.filter((p) => cropProgress(p, today).stage !== 'harvested');
  const dates: Date[] = [today];
  for (const p of live) {
    dates.push(parseISO(p.planting_date));
    if (p.expected_harvest_date) dates.push(addDays(parseISO(p.expected_harvest_date), HARVEST_MARK_DAYS));
  }
  const start = maxDate([startOfMonth(minDate(dates)), startOfMonth(addMonths(today, -3))]);
  let end = endOfMonth(maxDate(dates));
  if (end < endOfMonth(addMonths(start, 5))) end = endOfMonth(addMonths(start, 5));
  if (end > endOfMonth(addMonths(start, 14))) end = endOfMonth(addMonths(start, 14));
  const days = differenceInCalendarDays(end, start) + 1;
  const months: TimelineWindow['months'] = [];
  for (let m = start; m <= end; m = addMonths(m, 1)) {
    const from = differenceInCalendarDays(m, start);
    const to = differenceInCalendarDays(endOfMonth(m), start) + 1;
    months.push({ label: format(m, 'MMM'), offset: (from / days) * 100, width: ((to - from) / days) * 100 });
  }
  return { start, end, days, months };
}

export interface Segment {
  kind: 'grown' | 'expected' | 'harvest' | 'planned' | 'done';
  /** Percent of the window from the left */
  left: number;
  width: number;
}

/** Bars for one planting inside the window, clipped to its edges. */
export function plantingSegments(p: PlantingLike, win: TimelineWindow, today: Date = new Date()): Segment[] {
  const pos = (d: Date) => (differenceInCalendarDays(d, win.start) / win.days) * 100;
  const clip = (a: number, b: number) => [Math.max(0, a), Math.min(100, b)] as const;
  const seg = (kind: Segment['kind'], a: Date, b: Date): Segment | null => {
    const [l, r] = clip(pos(a), pos(b));
    return r > l ? { kind, left: l, width: r - l } : null;
  };

  const sown = parseISO(p.planting_date);
  const expected = p.expected_harvest_date ? parseISO(p.expected_harvest_date) : null;
  const stage = cropProgress(p, today).stage;
  const out: (Segment | null)[] = [];

  if (stage === 'harvested') {
    const endAt = p.actual_harvest_date ? parseISO(p.actual_harvest_date) : expected ?? today;
    out.push(seg('done', sown, endAt));
  } else if (stage === 'planned') {
    out.push(seg('planned', sown, expected ?? addDays(sown, 30)));
  } else {
    const grownEnd = expected ? minDate([today, expected]) : today;
    out.push(seg('grown', sown, grownEnd));
    if (expected && today < expected) out.push(seg('expected', today, expected));
  }
  if (expected && stage !== 'harvested') out.push(seg('harvest', expected, addDays(expected, HARVEST_MARK_DAYS)));
  return out.filter((s): s is Segment => s !== null);
}

/** Today's position in the window, or null when today is outside it. */
export function todayOffset(win: TimelineWindow, today: Date = new Date()): number | null {
  const d = differenceInCalendarDays(today, win.start);
  return d < 0 || d > win.days ? null : (d / win.days) * 100;
}
