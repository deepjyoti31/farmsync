import { differenceInCalendarDays, parseISO } from 'date-fns';
import { transactionType, type TransactionLike } from './financeSummary';

/** Rupees with Indian digit grouping, e.g. ₹1,24,550 or -₹2,000 */
export const formatMoney = (n: number) => {
  const rounded = Math.round(n);
  return `${rounded < 0 ? '-' : ''}₹${Math.abs(rounded).toLocaleString('en-IN')}`;
};

/** Time-of-day greeting key for the Today screen. */
export function greetingKey(now: Date = new Date()): 'morning' | 'afternoon' | 'evening' {
  const h = now.getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

export type CropStage = 'planned' | 'growing' | 'ready' | 'harvested';

export interface PlantingLike {
  planting_date: string;
  expected_harvest_date: string | null;
  actual_harvest_date?: string | null;
  status: string | null;
}

export interface CropProgress {
  stage: CropStage;
  /** Days since sowing (0 when not sown yet) */
  day: number;
  /** Planned length from sowing to expected harvest, when known */
  totalDays: number | null;
  /** 0 to 100 */
  percent: number;
  /** Days until expected harvest (negative when past), when known */
  daysToHarvest: number | null;
}

/**
 * Where a planting is in its season. "Ready" is the last 10% of the season or
 * any time after the expected harvest date, until a harvest is recorded.
 * A failed planting is finished, like a harvested one: it is no longer in the ground.
 */
export function cropProgress(p: PlantingLike, today: Date = new Date()): CropProgress {
  const sown = parseISO(p.planting_date);
  const day = Math.max(0, differenceInCalendarDays(today, sown));
  const expected = p.expected_harvest_date ? parseISO(p.expected_harvest_date) : null;
  const totalDays = expected ? Math.max(1, differenceInCalendarDays(expected, sown)) : null;
  const daysToHarvest = expected ? differenceInCalendarDays(expected, today) : null;

  const status = (p.status || '').toLowerCase();
  if (status === 'harvested' || status === 'failed' || p.actual_harvest_date) {
    return { stage: 'harvested', day, totalDays, percent: 100, daysToHarvest };
  }
  if (status === 'planned' || differenceInCalendarDays(sown, today) > 0) {
    return { stage: 'planned', day: 0, totalDays, percent: 0, daysToHarvest };
  }

  const percent = totalDays ? Math.min(100, Math.round((day / totalDays) * 100)) : 0;
  const ready = status === 'ready' || (totalDays !== null && (percent >= 90 || (daysToHarvest ?? 1) <= 0));
  return { stage: ready ? 'ready' : 'growing', day, totalDays, percent, daysToHarvest };
}

/**
 * The stage that best describes a field: the most advanced live planting
 * (ready over growing over planned). Fields with nothing live are "empty".
 */
export function fieldStage(plantings: PlantingLike[], today: Date = new Date()): CropStage | 'empty' {
  const rank: Record<CropStage, number> = { ready: 3, growing: 2, planned: 1, harvested: 0 };
  let best: CropStage | 'empty' = 'empty';
  for (const p of plantings) {
    const s = cropProgress(p, today).stage;
    if (s === 'harvested') continue;
    if (best === 'empty' || rank[s] > rank[best]) best = s;
  }
  return best;
}

export interface ForecastDay {
  date: string;
  precipitation_chance: number;
}

/** First forecast day with a good chance of rain, so the user can hold irrigation. */
export function rainAdvice(forecast: ForecastDay[] | undefined, threshold = 60): ForecastDay | null {
  if (!forecast) return null;
  return forecast.find((d) => d.precipitation_chance >= threshold) ?? null;
}

export interface MonthTotals {
  income: number;
  expense: number;
  net: number;
}

/** Income, expenses and net. Type comes from the transaction, else its category; rows of unknown type are left out. */
export function monthTotals(rows: Pick<TransactionLike, 'amount' | 'type' | 'category'>[]): MonthTotals {
  let income = 0;
  let expense = 0;
  for (const r of rows) {
    const amount = Number(r.amount) || 0;
    const type = transactionType(r);
    if (type === 'income') income += amount;
    else if (type === 'expense') expense += amount;
  }
  return { income, expense, net: income - expense };
}

export type AttentionKind = 'stock' | 'expiry' | 'service' | 'health';
export type AttentionTone = 'warning' | 'info';

export interface AttentionItem {
  kind: AttentionKind;
  tone: AttentionTone;
  title: string;
  detail: string;
  href: string;
  /** Lower sorts first */
  urgency: number;
}

interface StockRow { name: string; quantity: number; minimum_stock: number | null; unit: string | null; expiry_date: string | null }
interface EquipmentRow { name: string; next_maintenance_date: string | null }
interface HealthDue { label: string; recordType: string; daysUntilDue: number }

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;
const inDays = (days: number) => (days < 0 ? `${plural(-days, 'day')} late` : days === 0 ? 'today' : `in ${plural(days, 'day')}`);

/** Everything on the farm that needs a decision soon, most urgent first. */
export function attentionItems(
  input: { stock?: StockRow[]; equipment?: EquipmentRow[]; health?: HealthDue[] },
  today: Date = new Date(),
  windowDays = 14,
): AttentionItem[] {
  const items: AttentionItem[] = [];

  for (const s of input.stock ?? []) {
    const unit = s.unit ? ` ${s.unit}` : '';
    const hasMin = s.minimum_stock !== null && s.minimum_stock !== undefined;
    const out = Number(s.quantity) <= 0;
    // Out of stock always needs attention, even without a reorder level.
    if (out || (hasMin && s.quantity <= s.minimum_stock!)) {
      items.push({
        kind: 'stock', tone: 'warning', href: '/dashboard/inventory', urgency: out ? -1 : 2,
        title: out ? `${s.name} is out of stock` : `${s.name}: ${s.quantity}${unit} left`,
        detail: hasMin ? `Reorder level is ${s.minimum_stock}${unit}` : 'No stock left',
      });
    }
    if (s.expiry_date) {
      const days = differenceInCalendarDays(parseISO(s.expiry_date), today);
      if (days <= windowDays) {
        items.push({
          kind: 'expiry', tone: 'warning', href: '/dashboard/inventory', urgency: days,
          title: days < 0 ? `${s.name} has expired` : `${s.name} expires ${inDays(days)}`,
          detail: 'Use it first or set it aside',
        });
      }
    }
  }

  for (const e of input.equipment ?? []) {
    if (!e.next_maintenance_date) continue;
    const days = differenceInCalendarDays(parseISO(e.next_maintenance_date), today);
    if (days <= windowDays) {
      items.push({
        kind: 'service', tone: days < 0 ? 'warning' : 'info', href: '/dashboard/equipment', urgency: days,
        title: `${e.name} ${days < 0 ? 'is overdue for service' : 'is due for service'}`,
        detail: `Service ${inDays(days)}`,
      });
    }
  }

  for (const h of input.health ?? []) {
    items.push({
      kind: 'health', tone: 'warning', href: '/dashboard/livestock', urgency: h.daysUntilDue,
      title: `${h.recordType} for ${h.label}`,
      detail: `Due ${inDays(h.daysUntilDue)}`,
    });
  }

  return items.sort((a, b) => a.urgency - b.urgency);
}
