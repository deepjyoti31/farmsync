// Pure helpers for the ingest-telemetry function, kept free of Deno APIs so they can be unit tested.

export type PayloadCheck =
  | { ok: true; payload: Record<string, unknown>; type: string }
  | { ok: false; error: string };

/** Readings must be a JSON object of named values. Its optional `type` field labels the reading. */
export function checkPayload(payload: unknown): PayloadCheck {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return { ok: false, error: 'Body must be a JSON object' };
  }
  const p = payload as Record<string, unknown>;
  const type = typeof p.type === 'string' && p.type.trim() !== '' ? p.type.trim() : 'interval_reading';
  return { ok: true, payload: p, type };
}
