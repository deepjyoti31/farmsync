import { describe, expect, it } from 'vitest';
import { generateDeviceApiKey, metricLabel, toTelemetrySeries } from './telemetry';

describe('toTelemetrySeries', () => {
  it('sorts readings oldest first and extracts numeric metrics', () => {
    const { points, metrics } = toTelemetrySeries([
      { timestamp: '2026-11-02T10:00:00Z', data: { temperature: 25, humidity: '55', type: 'interval_reading' } },
      { timestamp: '2026-11-02T09:00:00Z', data: { temperature: 24, humidity: 60 } },
    ]);
    expect(points.map((p) => p.temperature)).toEqual([24, 25]);
    expect(points[1].humidity).toBe(55);
    expect(metrics).toEqual(['humidity', 'temperature']);
  });

  it('ignores metadata, non-numeric values and non-object payloads', () => {
    const { metrics } = toTelemetrySeries([
      { timestamp: '2026-11-02T09:00:00Z', data: { device_id: 7, status: 'ok', battery: 'low', soil_moisture: 31 } },
      { timestamp: '2026-11-02T09:05:00Z', data: [1, 2, 3] },
      { timestamp: '2026-11-02T09:10:00Z', data: null },
    ]);
    expect(metrics).toEqual(['soil_moisture']);
  });

  it('keeps only the most frequent metrics', () => {
    const { metrics } = toTelemetrySeries(
      [
        { timestamp: 't1', data: { a: 1, b: 1, c: 1 } },
        { timestamp: 't2', data: { a: 1, b: 1 } },
        { timestamp: 't3', data: { a: 1 } },
      ],
      2,
    );
    expect(metrics).toEqual(['a', 'b']);
  });
});

describe('metricLabel', () => {
  it('humanises payload keys', () => {
    expect(metricLabel('soil_moisture')).toBe('Soil moisture');
    expect(metricLabel('wind-speed')).toBe('Wind speed');
  });
});

describe('generateDeviceApiKey', () => {
  it('produces unique 48 hex character keys with a prefix', () => {
    const a = generateDeviceApiKey();
    const b = generateDeviceApiKey();
    expect(a).toMatch(/^dev_[0-9a-f]{48}$/);
    expect(a).not.toBe(b);
  });
});
