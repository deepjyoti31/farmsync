import { differenceInCalendarDays, differenceInCalendarMonths, format, parseISO, subDays } from 'date-fns';

export const HEALTH_RECORD_TYPES = [
  'vaccination',
  'deworming',
  'treatment',
  'checkup',
  'breeding',
  'other',
] as const;

/** Production types and the unit each is usually recorded in. */
export const PRODUCTION_TYPES: Record<string, string> = {
  milk: 'litres',
  eggs: 'pieces',
  wool: 'kg',
  weight: 'kg',
  honey: 'kg',
  other: 'units',
};

export interface AnimalLike {
  tag_id?: string | null;
  breed?: string | null;
  livestock_type?: { name?: string | null } | null;
}

/** Short human label for an animal, e.g. "Cow #A-102 (Gir)". */
export function animalLabel(animal: AnimalLike | null | undefined): string {
  if (!animal) return 'Whole herd / flock';
  const type = animal.livestock_type?.name ?? 'Animal';
  const tag = animal.tag_id ? ` #${animal.tag_id}` : '';
  const breed = animal.breed ? ` (${animal.breed})` : '';
  return `${type}${tag}${breed}`;
}

export interface HealthRecordLike {
  id: string;
  livestock_id: string;
  record_type: string;
  record_date: string;
  next_due_date: string | null;
}

export interface DueReminder<T extends HealthRecordLike> {
  record: T;
  /** Days until due; negative when overdue. */
  daysUntilDue: number;
}

/**
 * Follow-ups due within `windowDays` (or already overdue).
 * Only the latest record per animal and record type counts: once the next
 * vaccination is logged, the earlier record's reminder no longer applies.
 */
export function upcomingHealthDue<T extends HealthRecordLike>(
  records: T[],
  today: Date = new Date(),
  windowDays = 14,
): DueReminder<T>[] {
  const latest = new Map<string, T>();
  for (const r of records) {
    const key = `${r.livestock_id}:${r.record_type}`;
    const current = latest.get(key);
    if (!current || r.record_date > current.record_date) latest.set(key, r);
  }

  return Array.from(latest.values())
    .filter((r): r is T & { next_due_date: string } => !!r.next_due_date)
    .map((record) => ({ record, daysUntilDue: differenceInCalendarDays(parseISO(record.next_due_date), today) }))
    .filter((r) => r.daysUntilDue <= windowDays)
    .sort((a, b) => a.daysUntilDue - b.daysUntilDue);
}

export interface ProductionEntryLike {
  production_date: string;
  production_type: string;
  quantity: number | string;
}

/** Daily totals for one production type over the last `days` days, oldest first, with zero-filled gaps. */
export function dailyProduction(
  entries: ProductionEntryLike[],
  type: string,
  days = 30,
  today: Date = new Date(),
): { date: string; label: string; quantity: number }[] {
  const totals = new Map<string, number>();
  for (const e of entries) {
    if (e.production_type !== type) continue;
    totals.set(e.production_date, (totals.get(e.production_date) ?? 0) + Number(e.quantity));
  }

  return Array.from({ length: days }, (_, i) => {
    const d = subDays(today, days - 1 - i);
    const date = format(d, 'yyyy-MM-dd');
    return { date, label: format(d, 'dd MMM'), quantity: round(totals.get(date) ?? 0) };
  });
}

/** Total of one production type over the last `days` days, including today. */
export function productionTotal(
  entries: ProductionEntryLike[],
  type: string,
  days: number,
  today: Date = new Date(),
): number {
  const since = format(subDays(today, days - 1), 'yyyy-MM-dd');
  const until = format(today, 'yyyy-MM-dd');
  return round(
    entries
      .filter((e) => e.production_type === type && e.production_date >= since && e.production_date <= until)
      .reduce((sum, e) => sum + Number(e.quantity), 0),
  );
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}

export interface HerdAnimal extends AnimalLike {
  status?: string | null;
}

/** Live animals (not sold or dead) and how many of each type, largest group first. */
export function herdSummary(animals: HerdAnimal[]): { active: number; byType: { name: string; count: number }[] } {
  const live = animals.filter((a) => !a.status || a.status === 'active');
  const counts = new Map<string, number>();
  for (const a of live) {
    const name = a.livestock_type?.name ?? 'Animal';
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }
  return {
    active: live.length,
    byType: [...counts.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name)),
  };
}

/** Short age from a birth date: "2 y 3 m", "5 m", "12 d". Null without a birth date or for one in the future. */
export function ageLabel(birthDate: string | null | undefined, today: Date = new Date()): string | null {
  if (!birthDate) return null;
  const born = parseISO(birthDate);
  const days = differenceInCalendarDays(today, born);
  if (days < 0) return null;
  const months = differenceInCalendarMonths(today, born) - (today.getDate() < born.getDate() ? 1 : 0);
  if (months < 1) return `${days} d`;
  const y = Math.floor(months / 12);
  const m = months % 12;
  return y > 0 ? (m > 0 ? `${y} y ${m} m` : `${y} y`) : `${m} m`;
}
