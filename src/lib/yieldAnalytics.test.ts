import { describe, expect, it } from 'vitest';
import { AREA_UNITS, HARVEST_UNITS, aggregateYieldByCrop, fromHectares, toHectares, toTonnes, totalAreaIn, type HarvestRecord } from './yieldAnalytics';

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

describe('unit conversion edge cases', () => {
  it('accepts common spellings of each unit', () => {
    expect(toTonnes(10, 'quintals')).toBe(1);
    expect(toTonnes(1, 'tonne')).toBe(1);
    expect(toTonnes(1, 't')).toBe(1);
    expect(toTonnes(2000, ' KGS ')).toBe(2);
    expect(toHectares(1, 'hectare')).toBe(1);
    expect(toHectares(1, 'ha')).toBe(1);
    expect(toHectares(1, 'acre')).toBeCloseTo(0.4047, 4);
    expect(toHectares(8, 'bighas')).toBe(2);
  });

  it('converts square metres and feet saved by older versions of the edit form', () => {
    expect(toHectares(10000, 'sq_meters')).toBeCloseTo(1, 6);
    expect(toHectares(10000, 'square_meters')).toBeCloseTo(1, 6);
    expect(toHectares(107639.1, 'sq_feet')).toBeCloseTo(1, 4);
  });

  it('returns null instead of throwing for a missing unit', () => {
    expect(toTonnes(1, null)).toBeNull();
    expect(toHectares(1, undefined)).toBeNull();
    expect(fromHectares(1, '')).toBeNull();
  });

  it('round-trips every area unit offered in the forms', () => {
    for (const { value } of AREA_UNITS) {
      const ha = toHectares(3, value);
      expect(ha, value).not.toBeNull();
      expect(fromHectares(ha!, value)).toBeCloseTo(3, 9);
    }
  });

  it('converts every harvest unit offered in the harvest form', () => {
    for (const unit of HARVEST_UNITS) expect(toTonnes(1, unit), unit).not.toBeNull();
  });
});

describe('totalAreaIn', () => {
  it('converts each plot before adding them up', () => {
    // 1 ha + 4 bigha (1 ha) shown in hectares is 2, not 5.
    const plots = [
      { area: 1, area_unit: 'hectares' },
      { area: 4, area_unit: 'bigha' },
    ];
    expect(totalAreaIn(plots, 'hectares')).toBeCloseTo(2, 9);
    expect(totalAreaIn(plots, 'bigha')).toBeCloseTo(8, 9);
  });

  it('reads numeric strings and skips plots in unknown units or without an area', () => {
    const plots = [
      { area: '2.5', area_unit: 'acres' },
      { area: 3, area_unit: 'furlong' },
      { area: null, area_unit: 'acres' },
    ];
    expect(totalAreaIn(plots, 'acres')).toBeCloseTo(2.5, 9);
  });

  it('returns null for an unknown target unit and 0 for no plots', () => {
    expect(totalAreaIn([{ area: 1, area_unit: 'acres' }], 'furlong')).toBeNull();
    expect(totalAreaIn([{ area: 1, area_unit: 'acres' }], null)).toBeNull();
    expect(totalAreaIn([], 'hectares')).toBe(0);
  });
});

describe('aggregateYieldByCrop edge cases', () => {
  it('skips records without a usable field area', () => {
    expect(aggregateYieldByCrop([harvest({ fieldArea: 0 }), harvest({ fieldAreaUnit: 'furlong' }), harvest({ unit: 'bushel' })])).toEqual([]);
  });

  it('treats a missing revenue as zero', () => {
    expect(aggregateYieldByCrop([harvest({ revenue: null }), harvest({ revenue: undefined })])[0].revenue).toBe(0);
  });
});
