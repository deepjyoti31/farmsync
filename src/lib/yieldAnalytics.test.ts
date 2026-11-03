import { describe, expect, it } from 'vitest';
import { aggregateYieldByCrop, fromHectares, toHectares, toTonnes, type HarvestRecord } from './yieldAnalytics';

const harvest = (overrides: Partial<HarvestRecord>): HarvestRecord => ({
  cropName: 'Rice',
  quantity: 10,
  unit: 'quintal',
  fieldCropId: 'fc-1',
  fieldArea: 1,
  fieldAreaUnit: 'hectares',
  revenue: 0,
  ...overrides,
});

describe('unit conversion', () => {
  it('converts harvest units to tonnes', () => {
    expect(toTonnes(1000, 'kg')).toBe(1);
    expect(toTonnes(10, 'quintal')).toBe(1);
    expect(toTonnes(2, 'Tonnes')).toBe(2);
    expect(toTonnes(5, 'bushel')).toBeNull();
  });

  it('converts area units to hectares', () => {
    expect(toHectares(1, 'hectares')).toBe(1);
    expect(toHectares(1, 'acres')).toBeCloseTo(0.4047, 4);
    expect(toHectares(4, 'bigha')).toBe(1);
    expect(toHectares(1, 'furlong')).toBeNull();
  });
});

describe('aggregateYieldByCrop', () => {
  it('computes tonnes per hectare per crop', () => {
    const result = aggregateYieldByCrop([harvest({ quantity: 45, unit: 'quintal', fieldArea: 1.5 })]);
    expect(result).toEqual([{ name: 'Rice', totalTonnes: 4.5, yieldPerHectare: 3, revenue: 0 }]);
  });

  it('counts a planting area once across repeated harvests', () => {
    const result = aggregateYieldByCrop([
      harvest({ cropName: 'Tomato', quantity: 1000, unit: 'kg', fieldCropId: 'a', fieldArea: 1, fieldAreaUnit: 'acres' }),
      harvest({ cropName: 'Tomato', quantity: 1000, unit: 'kg', fieldCropId: 'a', fieldArea: 1, fieldAreaUnit: 'acres' }),
    ]);
    expect(result[0].totalTonnes).toBe(2);
    expect(result[0].yieldPerHectare).toBeCloseTo(2 / 0.404686, 1);
  });

  it('sums revenue and sorts by yield, highest first', () => {
    const result = aggregateYieldByCrop([
      harvest({ cropName: 'Wheat', quantity: 30, fieldCropId: 'w', revenue: 1000 }),
      harvest({ cropName: 'Rice', quantity: 50, fieldCropId: 'r', revenue: 2500 }),
    ]);
    expect(result.map((r) => r.name)).toEqual(['Rice', 'Wheat']);
    expect(result[0].revenue).toBe(2500);
  });

  it('skips records with unknown units or zero area', () => {
    expect(
      aggregateYieldByCrop([
        harvest({ unit: 'bushel' }),
        harvest({ fieldAreaUnit: 'furlong' }),
        harvest({ fieldArea: 0 }),
      ]),
    ).toEqual([]);
  });
});

describe('fromHectares', () => {
  it('converts hectares back to the field unit', () => {
    expect(fromHectares(1, 'bigha')).toBe(4);
    expect(fromHectares(2, 'hectares')).toBe(2);
    expect(fromHectares(0.404686, 'acres')).toBeCloseTo(1, 6);
    expect(fromHectares(1, 'furlong')).toBeNull();
  });
});
