import { describe, expect, it } from 'vitest';
import { AREA_UNITS, SOIL_TYPES, SOIL_TYPE_OPTIONS, withCurrent } from './fieldOptions';
import { toHectares } from './yieldAnalytics';

describe('field options', () => {
  it('offers the same area units everywhere, and every one converts', () => {
    expect(AREA_UNITS.map((u) => u.value)).toEqual(['acres', 'hectares', 'bigha']);
    for (const u of AREA_UNITS) expect(toHectares(1, u.value), u.value).not.toBeNull();
  });

  it('lists every soil type once, including black and red soils', () => {
    expect(new Set(SOIL_TYPES).size).toBe(SOIL_TYPES.length);
    expect(SOIL_TYPES).toContain('Black');
    expect(SOIL_TYPES).toContain('Red');
    expect(SOIL_TYPE_OPTIONS).toHaveLength(SOIL_TYPES.length);
  });
});

describe('withCurrent', () => {
  it('returns the options unchanged when the current value is one of them', () => {
    expect(withCurrent(AREA_UNITS, 'bigha')).toEqual([...AREA_UNITS]);
  });

  it('keeps a value saved by an older version selectable', () => {
    const list = withCurrent(AREA_UNITS, 'sq_meters');
    expect(list).toHaveLength(AREA_UNITS.length + 1);
    expect(list[list.length - 1]).toEqual({ value: 'sq_meters', label: 'sq meters' });
  });

  it('adds nothing for an empty value and does not modify the input', () => {
    expect(withCurrent(SOIL_TYPE_OPTIONS, null)).toHaveLength(SOIL_TYPES.length);
    expect(withCurrent(SOIL_TYPE_OPTIONS, '')).toHaveLength(SOIL_TYPES.length);
    withCurrent(SOIL_TYPE_OPTIONS, 'Laterite');
    expect(SOIL_TYPE_OPTIONS).toHaveLength(SOIL_TYPES.length);
  });
});
