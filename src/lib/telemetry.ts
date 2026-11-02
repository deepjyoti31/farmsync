/**
 * Helpers for charting device telemetry. Devices post arbitrary JSON payloads
 * (see supabase/functions/ingest-telemetry), so the chart series are derived
 * from whichever numeric fields the device actually sends.
 */

export interface TelemetryRow {
  timestamp: string;
  data: unknown;
}

export type TelemetryPoint = { time: string; timestamp: string } & Record<string, number | string>;

/** Payload fields that are metadata rather than measurements. */
const IGNORED_KEYS = new Set(['type', 'device_id', 'timestamp', 'id']);

export interface TelemetrySeries {
  points: TelemetryPoint[];
  /** Numeric measurement keys found in the payloads, most frequent first. */
  metrics: string[];
}

/**
 * Turn raw telemetry rows into chart points, oldest first.
 * Numeric strings (e.g. "21.5") are accepted; everything else is ignored.
 */
export function toTelemetrySeries(rows: TelemetryRow[], maxMetrics = 4): TelemetrySeries {
  const counts = new Map<string, number>();

  const points = [...rows]
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
    .map((row) => {
      const point: TelemetryPoint = {
        timestamp: row.timestamp,
        time: formatTime(row.timestamp),
      };
      if (row.data && typeof row.data === 'object' && !Array.isArray(row.data)) {
        for (const [key, raw] of Object.entries(row.data as Record<string, unknown>)) {
          if (IGNORED_KEYS.has(key)) continue;
          const value = typeof raw === 'number' ? raw : typeof raw === 'string' && raw.trim() !== '' ? Number(raw) : NaN;
          if (!Number.isFinite(value)) continue;
          point[key] = value;
          counts.set(key, (counts.get(key) ?? 0) + 1);
        }
      }
      return point;
    });

  const metrics = Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, maxMetrics)
    .map(([key]) => key);

  return { points, metrics };
}

function formatTime(timestamp: string): string {
  const d = new Date(timestamp);
  if (Number.isNaN(d.getTime())) return timestamp;
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/** Human label for a payload key, e.g. "soil_moisture" -> "Soil moisture". */
export function metricLabel(key: string): string {
  const spaced = key.replace(/[_-]+/g, ' ').trim();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

/** Generate a device API key using the browser's cryptographically secure RNG. */
export function generateDeviceApiKey(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return 'dev_' + Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}
