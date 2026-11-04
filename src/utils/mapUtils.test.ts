import { describe, expect, it } from 'vitest';
import { calculateArea, calculateCenter } from './mapUtils';

// Roughly a 100 m x 100 m square (1 ha) near the equator.
const square: GeoJSON.Polygon = {
  type: 'Polygon',
  coordinates: [[[0, 0], [0.000898, 0], [0.000898, 0.000904], [0, 0.000904], [0, 0]]],
};

describe('calculateArea', () => {
  it('converts to hectares, acres and bigha', () => {
    const ha = calculateArea(square, 'hectares');
    expect(ha).toBeGreaterThan(0.99);
    expect(ha).toBeLessThan(1.01);
    expect(calculateArea(square, 'acres')).toBeCloseTo(ha / 0.404686, 3);
    // Bigha used to fall through to square metres.
    expect(calculateArea(square, 'bigha')).toBeCloseTo(ha / 0.25, 3);
    expect(calculateArea(square, 'square_meters')).toBeCloseTo(ha * 10000, 0);
  });
});

describe('calculateCenter', () => {
  it('returns [lat, lng] without double counting the closing vertex', () => {
    const [lat, lng] = calculateCenter(square);
    expect(lat).toBeCloseTo(0.000452, 6);
    expect(lng).toBeCloseTo(0.000449, 6);
  });
});
