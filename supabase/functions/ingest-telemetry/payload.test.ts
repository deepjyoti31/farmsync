import { describe, expect, it } from 'vitest';
import { checkPayload } from './payload.ts';

describe('checkPayload', () => {
  it('accepts a JSON object and defaults the reading type', () => {
    expect(checkPayload({ soil_moisture: 31.5 })).toEqual({ ok: true, payload: { soil_moisture: 31.5 }, type: 'interval_reading' });
  });

  it('uses the payload type when it is non-blank text', () => {
    expect(checkPayload({ type: ' alert ', level: 3 })).toMatchObject({ ok: true, type: 'alert' });
    expect(checkPayload({ type: '   ' })).toMatchObject({ ok: true, type: 'interval_reading' });
    expect(checkPayload({ type: 7 })).toMatchObject({ ok: true, type: 'interval_reading' });
  });

  it.each([null, 42, 'text', [1, 2], true])('rejects %j', (payload) => {
    expect(checkPayload(payload)).toEqual({ ok: false, error: 'Body must be a JSON object' });
  });
});
