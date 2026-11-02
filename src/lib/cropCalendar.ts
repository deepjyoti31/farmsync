import { addDays, endOfMonth, endOfWeek, format, startOfMonth, startOfWeek } from 'date-fns';

export type CropEventKind = 'planting' | 'harvest' | 'expected_harvest';

export interface CropEvent {
  /** yyyy-MM-dd */
  date: string;
  kind: CropEventKind;
  plantingId: string;
  cropName: string;
  fieldName: string;
}

export interface PlantingLike {
  id: string;
  name?: string | null;
  crop?: { name?: string | null } | null;
  field_id: string;
  status?: string | null;
  planting_date: string;
  expected_harvest_date?: string | null;
  actual_harvest_date?: string | null;
}

/**
 * Calendar events for a set of plantings: the sowing date, and either the
 * actual harvest date or, if not yet harvested, the expected one.
 */
export function cropEvents(plantings: PlantingLike[], fieldNames: Map<string, string> = new Map()): CropEvent[] {
  const events: CropEvent[] = [];
  for (const p of plantings) {
    const base = {
      plantingId: p.id,
      cropName: p.crop?.name ?? p.name ?? 'Crop',
      fieldName: fieldNames.get(p.field_id) ?? 'Field',
    };
    events.push({ ...base, date: p.planting_date, kind: 'planting' });
    if (p.actual_harvest_date) {
      events.push({ ...base, date: p.actual_harvest_date, kind: 'harvest' });
    } else if (p.expected_harvest_date && p.status !== 'failed') {
      events.push({ ...base, date: p.expected_harvest_date, kind: 'expected_harvest' });
    }
  }
  return events.sort((a, b) => a.date.localeCompare(b.date) || a.cropName.localeCompare(b.cropName));
}

export interface CalendarDay {
  date: string;
  dayOfMonth: number;
  inMonth: boolean;
}

/**
 * Weeks covering a month, padded with days from neighbouring months so every
 * week has 7 days. Weeks start on Monday by default.
 */
export function monthGrid(year: number, month: number, weekStartsOn: 0 | 1 = 1): CalendarDay[][] {
  const first = startOfMonth(new Date(year, month, 1));
  const start = startOfWeek(first, { weekStartsOn });
  const end = endOfWeek(endOfMonth(first), { weekStartsOn });

  const weeks: CalendarDay[][] = [];
  for (let day = start; day <= end; day = addDays(day, 7)) {
    weeks.push(
      Array.from({ length: 7 }, (_, i) => {
        const d = addDays(day, i);
        return { date: format(d, 'yyyy-MM-dd'), dayOfMonth: d.getDate(), inMonth: d.getMonth() === month };
      }),
    );
  }
  return weeks;
}

/** Group events by date for quick lookup while rendering a grid. */
export function groupByDate(events: CropEvent[]): Map<string, CropEvent[]> {
  const map = new Map<string, CropEvent[]>();
  for (const e of events) {
    const list = map.get(e.date) ?? [];
    list.push(e);
    map.set(e.date, list);
  }
  return map;
}
