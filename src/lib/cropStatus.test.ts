import { describe, expect, it } from 'vitest';
import { planCropStatusChange, type CropStatusChangeInput } from './cropStatus';
import { cropProgress } from './dashboard';

const input = (overrides: Partial<CropStatusChangeInput>): CropStatusChangeInput => ({
  currentStatus: 'growing',
  status: 'harvested',
  harvestQuantity: '',
  harvestUnit: 'quintal',
  today: '2026-11-05',
  ...overrides,
});

describe('planCropStatusChange', () => {
  it('rejects a change to the same status', () => {
    expect(planCropStatusChange(input({ status: 'growing' }))).toEqual({ ok: false, reason: 'unchanged' });
  });

  it('records the harvest date, and the harvest when a quantity is given', () => {
    expect(planCropStatusChange(input({ harvestQuantity: ' 12.5 ' }))).toEqual({
      ok: true,
      update: { status: 'harvested', actual_harvest_date: '2026-11-05', yield_amount: 12.5, yield_unit: 'quintal' },
      harvest: { quantity: 12.5, unit: 'quintal', harvest_date: '2026-11-05' },
    });
  });

  it('allows a harvest without a quantity', () => {
    expect(planCropStatusChange(input({}))).toEqual({
      ok: true,
      update: { status: 'harvested', actual_harvest_date: '2026-11-05' },
      harvest: null,
    });
  });

  it.each(['0', '-3', 'abc', 'Infinity'])('rejects a harvested quantity of %s', (q) => {
    expect(planCropStatusChange(input({ harvestQuantity: q }))).toEqual({ ok: false, reason: 'invalid_quantity' });
  });

  it('ignores a typed quantity when not harvesting', () => {
    expect(planCropStatusChange(input({ currentStatus: 'planned', status: 'planted', harvestQuantity: 'abc' }))).toEqual({
      ok: true,
      update: { status: 'planted' },
      harvest: null,
    });
  });

  it('clears the harvest date when a harvest is undone', () => {
    const plan = planCropStatusChange(input({ currentStatus: 'harvested', status: 'growing' }));
    expect(plan).toEqual({ ok: true, update: { status: 'growing', actual_harvest_date: null }, harvest: null });

    // Before the fix the old date stayed, so the planting still showed as harvested.
    const planting = { planting_date: '2026-09-01', expected_harvest_date: '2027-01-15', status: 'growing', actual_harvest_date: null };
    expect(cropProgress({ ...planting, actual_harvest_date: '2026-11-01' }, new Date(2026, 10, 5)).stage).toBe('harvested');
    expect(cropProgress(planting, new Date(2026, 10, 5)).stage).toBe('growing');
  });
});
