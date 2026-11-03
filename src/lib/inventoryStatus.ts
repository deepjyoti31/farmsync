import { differenceInCalendarDays, parseISO } from 'date-fns';

export interface StockLike {
  quantity: number;
  minimum_stock: number | null;
  expiry_date: string | null;
  purchase_price?: number | null;
}

export interface StockState {
  out: boolean;
  /** At or below the reorder level (and not out) */
  low: boolean;
  expiry: 'expired' | 'soon' | null;
  daysToExpiry: number | null;
  /** 0 to 100: how full the bar should be, with the reorder level at 50% */
  fill: number;
  needsAttention: boolean;
}

/** Days before expiry at which an item counts as "expiring soon". */
export const EXPIRY_WARNING_DAYS = 30;

/**
 * Stock and expiry state for one item. The bar puts the reorder level at the
 * middle, so anything in the left half needs reordering.
 */
export function stockState(item: StockLike, today: Date = new Date()): StockState {
  const qty = Number(item.quantity) || 0;
  const min = item.minimum_stock ?? null;
  const out = qty <= 0;
  const low = !out && min !== null && qty <= min;
  const daysToExpiry = item.expiry_date ? differenceInCalendarDays(parseISO(item.expiry_date), today) : null;
  const expiry = daysToExpiry === null ? null : daysToExpiry < 0 ? 'expired' : daysToExpiry <= EXPIRY_WARNING_DAYS ? 'soon' : null;
  const fill = min && min > 0 ? Math.min(100, (qty / (min * 2)) * 100) : out ? 0 : 100;
  return { out, low, expiry, daysToExpiry, fill, needsAttention: out || low || expiry !== null };
}

/** Total value of stock at purchase price, counting only items that have a price. */
export function stockValue(items: StockLike[]): number {
  return items.reduce((s, i) => s + (i.purchase_price ? Number(i.purchase_price) * (Number(i.quantity) || 0) : 0), 0);
}
