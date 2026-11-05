import { describe, expect, it } from 'vitest';
import { forecastUrl, parseCoordinates, toWeather } from './weather.ts';

describe('parseCoordinates', () => {
  it('accepts numbers and numeric strings, including zero', () => {
    expect(parseCoordinates({ latitude: 26.14, longitude: 91.73 })).toEqual({ latitude: 26.14, longitude: 91.73 });
    expect(parseCoordinates({ latitude: '0', longitude: 0 })).toEqual({ latitude: 0, longitude: 0 });
    expect(parseCoordinates({ latitude: -90, longitude: 180 })).toEqual({ latitude: -90, longitude: 180 });
  });

  it.each([
    ['no body', null],
    ['a non-object body', 'lat=1'],
    ['missing longitude', { latitude: 10 }],
    ['blank strings that Number() would read as 0', { latitude: '', longitude: '  ' }],
    ['text', { latitude: 'north', longitude: 10 }],
    ['booleans', { latitude: true, longitude: false }],
    ['arrays', { latitude: [], longitude: [5] }],
    ['latitude out of range', { latitude: 91, longitude: 0 }],
    ['longitude out of range', { latitude: 0, longitude: -181 }],
    ['infinity', { latitude: Infinity, longitude: 0 }],
  ])('rejects %s', (_label, body) => {
    expect(parseCoordinates(body)).toBeNull();
  });
});

describe('forecastUrl', () => {
  it('encodes the key and asks for five days by default', () => {
    expect(forecastUrl('a&b', { latitude: 1.5, longitude: -2 })).toBe(
      'https://api.weatherapi.com/v1/forecast.json?key=a%26b&q=1.5,-2&days=5',
    );
  });
});

describe('toWeather', () => {
  const day = (date: string, rain: number) => ({
    date,
    day: { mintemp_c: 12, maxtemp_c: 28, condition: { text: 'Sunny' }, daily_chance_of_rain: rain },
  });

  it('maps a WeatherAPI response to the app shape', () => {
    const weather = toWeather({
      current: { temp_c: 24, humidity: 60, precip_mm: 0.2, wind_kph: 9, condition: { text: 'Clear' } },
      forecast: { forecastday: [day('2026-11-05', 10), day('2026-11-06', 70)] },
    });
    expect(weather.current).toEqual({ temperature: 24, humidity: 60, precipitation: 0.2, wind_speed: 9, condition: 'Clear' });
    expect(weather.forecast).toEqual([
      { date: '2026-11-05', temperature_min: 12, temperature_max: 28, condition: 'Sunny', precipitation_chance: 10 },
      { date: '2026-11-06', temperature_min: 12, temperature_max: 28, condition: 'Sunny', precipitation_chance: 70 },
    ]);
  });

  it('returns an empty forecast when the response has none', () => {
    expect(toWeather({ current: { condition: {} } }).forecast).toEqual([]);
  });
});
