import * as GeoJSON from 'geojson';
import geojsonArea from '@mapbox/geojson-area';
import { fromHectares } from '@/lib/yieldAnalytics';

/**
 * Calculate area in square meters from a GeoJSON polygon
 */
export const calculateAreaInSquareMeters = (polygon: GeoJSON.Polygon): number => {
  if (!polygon || !polygon.coordinates || polygon.coordinates.length === 0) {
    return 0;
  }
  
  return geojsonArea.geometry(polygon);
};

/**
 * Convert square meters to acres
 */
export const squareMetersToAcres = (squareMeters: number): number => {
  return squareMeters * 0.000247105;
};

/**
 * Convert square meters to hectares
 */
export const squareMetersToHectares = (squareMeters: number): number => {
  return squareMeters * 0.0001;
};

/**
 * Calculate area from a GeoJSON polygon in the given unit: acres, hectares,
 * bigha (any unit known to yieldAnalytics) or square_meters.
 * Unknown units fall back to square metres.
 */
export const calculateArea = (
  polygon: GeoJSON.Polygon | null,
  unit: string = 'acres'
): number => {
  if (!polygon) return 0;

  const areaInSquareMeters = calculateAreaInSquareMeters(polygon);
  if (unit === 'square_meters') return areaInSquareMeters;
  return fromHectares(squareMetersToHectares(areaInSquareMeters), unit) ?? areaInSquareMeters;
};

/**
 * Format area with appropriate precision
 */
export const formatArea = (area: number): string => {
  return area.toFixed(2);
};

/**
 * Average of a polygon's outer ring vertices, as [latitude, longitude].
 * Note the order: map libraries such as Mapbox want [longitude, latitude].
 */
export const calculateCenter = (polygon: GeoJSON.Polygon): [number, number] => {
  if (!polygon || !polygon.coordinates || polygon.coordinates.length === 0) {
    return [0, 0];
  }

  let coordinates = polygon.coordinates[0];
  if (!coordinates || coordinates.length === 0) return [0, 0];
  // GeoJSON rings repeat the first vertex at the end; counting it twice skews the centre.
  const first = coordinates[0];
  const last = coordinates[coordinates.length - 1];
  if (coordinates.length > 1 && first[0] === last[0] && first[1] === last[1]) {
    coordinates = coordinates.slice(0, -1);
  }

  let sumLat = 0;
  let sumLng = 0;
  for (const coord of coordinates) {
    sumLng += coord[0]; // longitude is first in GeoJSON
    sumLat += coord[1]; // latitude is second in GeoJSON
  }

  return [sumLat / coordinates.length, sumLng / coordinates.length];
};

/**
 * Format coordinates for display
 */
export const formatCoordinates = (lat: number, lng: number): string => {
  return `${lat.toFixed(6)}°, ${lng.toFixed(6)}°`;
};
