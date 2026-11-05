import { describe, expect, it } from 'vitest';
import {
  calculateArea,
  calculateAreaInSquareMeters,
  calculateCenter,
  formatArea,
  formatCoordinates,
  squareMetersToAcres,
  squareMetersToHectares,
} from './mapUtils';

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

describe('area helpers', () => {
  it('returns 0 for a missing or empty polygon', () => {
    expect(calculateArea(null)).toBe(0);
    expect(calculateAreaInSquareMeters({ type: 'Polygon', coordinates: [] })).toBe(0);
    expect(calculateAreaInSquareMeters(null as unknown as GeoJSON.Polygon)).toBe(0);
  });

  it('defaults to acres and falls back to square metres for unknown units', () => {
    const m2 = calculateAreaInSquareMeters(square);
    expect(calculateArea(square)).toBeCloseTo(squareMetersToAcres(m2), 2);
    expect(calculateArea(square, 'furlong')).toBe(m2);
  });

  it('converts square metres', () => {
    expect(squareMetersToHectares(10000)).toBe(1);
    expect(squareMetersToAcres(4046.86)).toBeCloseTo(1, 3);
  });

  it('formats areas and coordinates for display', () => {
    expect(formatArea(1.23456)).toBe('1.23');
    expect(formatCoordinates(26.1445, 91.7362)).toBe('26.144500°, 91.736200°');
  });
});

describe('calculateCenter edge cases', () => {
  it('returns [0, 0] for empty input', () => {
    expect(calculateCenter({ type: 'Polygon', coordinates: [] })).toEqual([0, 0]);
    expect(calculateCenter({ type: 'Polygon', coordinates: [[]] })).toEqual([0, 0]);
    expect(calculateCenter(null as unknown as GeoJSON.Polygon)).toEqual([0, 0]);
  });

  it('averages an open ring as it is', () => {
    expect(calculateCenter({ type: 'Polygon', coordinates: [[[0, 0], [2, 0], [2, 2], [0, 2]]] })).toEqual([1, 1]);
  });

  it('handles a single point', () => {
    expect(calculateCenter({ type: 'Polygon', coordinates: [[[91.7, 26.1]]] })).toEqual([26.1, 91.7]);
  });
});
