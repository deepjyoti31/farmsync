import { describe, expect, it } from 'vitest';
import { fieldWorkAdvice, type ForecastDayLike } from './weatherAdvice';

const day = (date: string, rain: number, min = 15, max = 28): ForecastDayLike => ({
  date, temperature_min: min, temperature_max: max, condition: 'Sunny', precipitation_chance: rain,
});
const calm = { temperature: 26, humidity: 60, wind_speed: 8, condition: 'Sunny' };

describe('fieldWorkAdvice', () => {
  it('says go when it is calm and dry', () => {
    const a = fieldWorkAdvice(calm, [day('2026-11-04', 10), day('2026-11-05', 10), day('2026-11-06', 5)]);
    expect(a.map((x) => `${x.kind}:${x.tone}`)).toEqual(['spray:go', 'irrigate:go', 'harvest:go']);
  });

  it('holds spraying and irrigation before rain', () => {
    const a = fieldWorkAdvice(calm, [day('2026-11-04', 20), day('2026-11-05', 80), day('2026-11-06', 10)]);
    expect(a.find((x) => x.kind === 'spray')).toMatchObject({ tone: 'wait', title: 'Hold off spraying' });
    expect(a.find((x) => x.kind === 'irrigate')?.tone).toBe('wait');
    expect(a.some((x) => x.kind === 'harvest')).toBe(false);
  });

  it('puts wind ahead of rain for spraying, and warns about heat and frost', () => {
    const a = fieldWorkAdvice({ ...calm, wind_speed: 22 }, [day('2026-11-04', 10, 2, 30), day('2026-11-05', 10, 12, 37)]);
    expect(a.find((x) => x.kind === 'spray')?.title).toBe('Too windy to spray');
    expect(a.find((x) => x.kind === 'heat')?.title).toBe('Hot on Thursday');
    expect(a.find((x) => x.kind === 'frost')?.title).toBe('Frost risk on Wednesday');
  });
});
