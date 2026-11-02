import { describe, expect, it } from 'vitest';
import { maintenanceCostByEquipment, serviceState } from './maintenance';

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
