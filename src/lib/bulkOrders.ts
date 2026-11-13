import type { BulkOrderStatus } from '@/types/coop';

/**
 * The status to show for a bulk order. An order saved as "open" stops taking
 * commitments at its deadline, but nothing updates the row when that passes,
 * so an open order past its deadline is shown, counted and treated as closed.
 */
export function effectiveBulkOrderStatus(
  order: { status: string | null; deadline: string },
  now: Date = new Date(),
): BulkOrderStatus {
  const status = (order.status ?? 'open') as BulkOrderStatus;
  if (status !== 'open') return status;
  const deadline = new Date(order.deadline);
  // An unreadable deadline is left open rather than hidden.
  return !Number.isNaN(deadline.getTime()) && deadline.getTime() <= now.getTime() ? 'closed' : 'open';
}

export const BULK_ORDER_STATUS_LABELS: Record<BulkOrderStatus, string> = {
  open: 'Open',
  closed: 'Closed',
  ordered: 'Ordered',
  delivered: 'Delivered',
};
