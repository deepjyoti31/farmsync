/**
 * Turns field boundaries (GeoJSON, as saved by the boundary map) into SVG
 * paths that share one frame, so the Today screen can draw a small farm map
 * without loading Mapbox.
 */

type Position = number[];

interface ShapeInput {
  id: string;
  boundaries: unknown;
}

export interface FieldShape {
  id: string;
  /** SVG path data in the shared viewBox */
  d: string;
  /** Label anchor (centroid of the outer ring) */
  cx: number;
  cy: number;
}

/** Outer rings of every polygon in a GeoJSON Feature, FeatureCollection, Polygon or MultiPolygon. */
export function outerRings(geo: unknown): Position[][] {
  if (!geo || typeof geo !== 'object') return [];
  const g = geo as { type?: string; coordinates?: unknown; geometry?: unknown; features?: unknown[] };
  switch (g.type) {
    case 'FeatureCollection':
      return (g.features ?? []).flatMap((f) => outerRings(f));
    case 'Feature':
      return outerRings(g.geometry);
    case 'Polygon':
      return Array.isArray(g.coordinates) && Array.isArray(g.coordinates[0]) ? [g.coordinates[0] as Position[]] : [];
    case 'MultiPolygon':
      return Array.isArray(g.coordinates) ? (g.coordinates as Position[][][]).map((p) => p[0]).filter(Boolean) : [];
    default:
      return [];
  }
}

/**
 * Project all fields into a `width` x `height` box with `pad` margin,
 * keeping the aspect ratio. Longitude is scaled by cos(latitude) so shapes
 * are not stretched. Fields without a usable boundary are skipped.
 */
export function fieldShapes(fields: ShapeInput[], width = 640, height = 280, pad = 12): FieldShape[] {
  const rings = fields
    .map((f) => ({ id: f.id, rings: outerRings(f.boundaries).filter((r) => r.length >= 3) }))
    .filter((f) => f.rings.length > 0);
  if (rings.length === 0) return [];

  const all = rings.flatMap((f) => f.rings.flat());
  const lats = all.map((p) => p[1]);
  const midLat = (Math.min(...lats) + Math.max(...lats)) / 2;
  const k = Math.cos((midLat * Math.PI) / 180) || 1;
  const xs = all.map((p) => p[0] * k);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...lats);
  const maxY = Math.max(...lats);
  const spanX = maxX - minX || 1e-9;
  const spanY = maxY - minY || 1e-9;
  const scale = Math.min((width - 2 * pad) / spanX, (height - 2 * pad) / spanY);
  const offX = (width - spanX * scale) / 2;
  const offY = (height - spanY * scale) / 2;

  const project = (p: Position): [number, number] => [offX + (p[0] * k - minX) * scale, offY + (maxY - p[1]) * scale];

  return rings.map(({ id, rings: rs }) => {
    const projected = rs.map((r) => r.map(project));
    const d = projected
      .map((r) => `M${r.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join('L')}Z`)
      .join('');
    const outer = projected[0];
    const cx = outer.reduce((s, [x]) => s + x, 0) / outer.length;
    const cy = outer.reduce((s, [, y]) => s + y, 0) / outer.length;
    return { id, d, cx, cy };
  });
}
