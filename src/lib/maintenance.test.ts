import { describe, expect, it } from 'vitest';
import { maintenanceCostByEquipment, serviceState, sortByService } from './maintenance';

describe('serviceState', () => {
  const today = new Date(2026, 10, 2, 8, 0);

  it('classifies the next service date', () => {
    expect(serviceState('2026-11-01', today)).toBe('overdue');
    expect(serviceState('2026-11-02', today)).toBe('due_soon');
    expect(serviceState('2026-11-16', today)).toBe('due_soon');
    expect(serviceState('2026-11-17', today)).toBe('scheduled');
    expect(serviceState(null, today)).toBe('unscheduled');
  });
});

describe('maintenanceCostByEquipment', () => {
  it('sums costs per machine, treating missing costs as zero', () => {
    const totals = maintenanceCostByEquipment([
      { equipment_id: 'tractor', cost: 2500 },
      { equipment_id: 'tractor', cost: '750.50' },
      { equipment_id: 'pump', cost: null },
    ]);
    expect(totals.get('tractor')).toBe(3250.5);
    expect(totals.get('pump')).toBe(0);
  });
});

describe('sortByService', () => {
  it('puts overdue first, then due soon, scheduled and unscheduled', () => {
    const today = new Date(2026, 10, 3);
    const sorted = sortByService(
      [
        { name: 'Sprayer', next_maintenance_date: null },
        { name: 'Pump', next_maintenance_date: '2027-03-01' },
        { name: 'Tractor', next_maintenance_date: '2026-11-10' },
        { name: 'Trailer', next_maintenance_date: '2026-10-20' },
        { name: 'Harrow', next_maintenance_date: '2026-11-08' },
      ],
      today,
    );
    expect(sorted.map((m) => m.name)).toEqual(['Trailer', 'Harrow', 'Tractor', 'Pump', 'Sprayer']);
  });
});
