import { differenceInCalendarDays, parseISO } from 'date-fns';

export type ServiceState = 'overdue' | 'due_soon' | 'scheduled' | 'unscheduled';

export const MAINTENANCE_TYPES = [
  'Routine service',
  'Oil change',
  'Filter replacement',
  'Tyre or track repair',
  'Engine repair',
  'Electrical repair',
  'Inspection',
  'Other',
] as const;

/** Service status of a machine from its next maintenance date. "Due soon" means within `soonDays` days. */
export function serviceState(nextMaintenanceDate: string | null | undefined, today: Date = new Date(), soonDays = 14): ServiceState {
  if (!nextMaintenanceDate) return 'unscheduled';
  const days = differenceInCalendarDays(parseISO(nextMaintenanceDate), today);
  if (days < 0) return 'overdue';
  if (days <= soonDays) return 'due_soon';
  return 'scheduled';
}

/** Total maintenance spend per equipment id. */
export function maintenanceCostByEquipment(records: { equipment_id: string; cost: number | string | null }[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const r of records) {
    totals.set(r.equipment_id, (totals.get(r.equipment_id) ?? 0) + Number(r.cost ?? 0));
  }
  return totals;
}

const SERVICE_RANK: Record<ServiceState, number> = { overdue: 0, due_soon: 1, scheduled: 2, unscheduled: 3 };

/** Machines ordered by how soon they need attention: overdue, due soon, scheduled, then unscheduled; by date, then name. */
export function sortByService<T extends { name: string; next_maintenance_date: string | null }>(machines: T[], today: Date = new Date()): T[] {
  return [...machines].sort((a, b) => {
    const r = SERVICE_RANK[serviceState(a.next_maintenance_date, today)] - SERVICE_RANK[serviceState(b.next_maintenance_date, today)];
    if (r !== 0) return r;
    if (a.next_maintenance_date && b.next_maintenance_date && a.next_maintenance_date !== b.next_maintenance_date) {
      return a.next_maintenance_date.localeCompare(b.next_maintenance_date);
    }
    return a.name.localeCompare(b.name);
  });
}
