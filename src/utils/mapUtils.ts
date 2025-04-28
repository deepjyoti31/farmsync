import * as GeoJSON from 'geojson';
import geojsonArea from '@mapbox/geojson-area';

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
 * Calculate area from a GeoJSON polygon and convert to the specified unit
 */
export const calculateArea = (
  polygon: GeoJSON.Polygon | null, 
  unit: 'acres' | 'hectares' | 'square_meters' = 'acres'
): number => {
  if (!polygon) return 0;
  
  const areaInSquareMeters = calculateAreaInSquareMeters(polygon);
  
  switch (unit) {
    case 'acres':
      return squareMetersToAcres(areaInSquareMeters);
    case 'hectares':
      return squareMetersToHectares(areaInSquareMeters);
    case 'square_meters':
    default:
      return areaInSquareMeters;
  }
};

/**
 * Format area with appropriate precision
 */
export const formatArea = (area: number): string => {
  return area.toFixed(2);
};

/**
 * Calculate center point of a GeoJSON polygon
 */
export const calculateCenter = (polygon: GeoJSON.Polygon): [number, number] => {
  if (!polygon || !polygon.coordinates || polygon.coordinates.length === 0) {
    return [0, 0];
  }
  
  const coordinates = polygon.coordinates[0];
  let sumLat = 0;
  let sumLng = 0;

  for (const coord of coordinates) {
    sumLng += coord[0]; // longitude is first in GeoJSON
    sumLat += coord[1]; // latitude is second in GeoJSON
  }

  const centerLat = sumLat / coordinates.length;
  const centerLng = sumLng / coordinates.length;
  
  return [centerLat, centerLng];
};

/**
 * Format coordinates for display
 */
export const formatCoordinates = (lat: number, lng: number): string => {
  return `${lat.toFixed(6)}°, ${lng.toFixed(6)}°`;
};
