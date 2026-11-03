import { describe, expect, it } from 'vitest';
import { CATEGORICAL, CHART, categoryColor, foldCategories } from './chartPalette';

describe('categoryColor', () => {
  it('follows the fixed order and never cycles', () => {
    expect(categoryColor(0)).toBe(CATEGORICAL[0]);
    expect(categoryColor(3)).toBe(CATEGORICAL[3]);
    expect(categoryColor(4)).toBe(CHART.other);
    expect(categoryColor(9)).toBe(CHART.other);
  });
});

describe('foldCategories', () => {
  const rows = [
    { name: 'Seed', value: 30 },
    { name: 'Labour', value: 50 },
    { name: 'Fuel', value: 10 },
    { name: 'Fertiliser', value: 40 },
    { name: 'Repairs', value: 5 },
    { name: 'Power', value: 8 },
  ];

  it('keeps the largest four and adds the rest as Other', () => {
    const folded = foldCategories(rows, 'value', 'name');
    expect(folded.map((r) => r.name)).toEqual(['Labour', 'Fertiliser', 'Seed', 'Fuel', 'Other']);
    expect(folded[4].value).toBe(13);
  });

  it('only sorts when there are few enough categories', () => {
    expect(foldCategories(rows.slice(0, 3), 'value', 'name').map((r) => r.name)).toEqual(['Labour', 'Seed', 'Fuel']);
  });
});
