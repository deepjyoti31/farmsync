import { describe, expect, it } from 'vitest';
import { fieldShapes, outerRings } from './fieldShapes';

const square = (x: number, y: number, s = 0.001) => ({
  type: 'Feature',
  geometry: {
    type: 'Polygon',
    coordinates: [[[x, y], [x + s, y], [x + s, y + s], [x, y + s], [x, y]]],
  },
});

describe('outerRings', () => {
  it('reads features, collections and multipolygons', () => {
    expect(outerRings(square(75, 25))).toHaveLength(1);
    expect(outerRings({ type: 'FeatureCollection', features: [square(75, 25), square(75.01, 25)] })).toHaveLength(2);
    expect(outerRings({ type: 'MultiPolygon', coordinates: [[[[0, 0], [1, 0], [1, 1], [0, 0]]]] })).toHaveLength(1);
    expect(outerRings(null)).toEqual([]);
    expect(outerRings({ type: 'Point', coordinates: [0, 0] })).toEqual([]);
  });
});

describe('fieldShapes', () => {
  it('fits every field into the frame and skips fields without a boundary', () => {
    const shapes = fieldShapes(
      [
        { id: 'a', boundaries: square(75.8, 25.18) },
        { id: 'b', boundaries: square(75.802, 25.18) },
        { id: 'c', boundaries: null },
      ],
      600,
      300,
      10,
    );
    expect(shapes.map((s) => s.id)).toEqual(['a', 'b']);
    const nums = shapes.flatMap((s) => s.d.match(/-?\d+(\.\d+)?/g)!.map(Number));
    expect(Math.min(...nums)).toBeGreaterThanOrEqual(0);
    expect(Math.max(...nums)).toBeLessThanOrEqual(600);
    expect(shapes[0].cx).toBeLessThan(shapes[1].cx);
  });

  it('returns nothing when no field has a boundary', () => {
    expect(fieldShapes([{ id: 'a', boundaries: null }])).toEqual([]);
  });
});
