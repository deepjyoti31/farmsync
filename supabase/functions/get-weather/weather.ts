// Pure helpers for the get-weather function, kept free of Deno APIs so they can be unit tested.

export interface Coordinates {
  latitude: number;
  longitude: number;
}

const blank = (v: unknown) => v == null || (typeof v === 'string' && v.trim() === '');

/**
 * Latitude and longitude from a request body, or null when either is missing,
 * not a number or out of range. 0 is a real latitude (the equator) and
 * longitude, so this checks for numbers in range rather than truthiness; a
 * blank string, which Number() would turn into 0, counts as missing.
 */
export function parseCoordinates(body: unknown): Coordinates | null {
  const b = (body && typeof body === 'object' ? body : {}) as { latitude?: unknown; longitude?: unknown };
  if (blank(b.latitude) || blank(b.longitude)) return null;
  // Number(true) is 1 and Number([]) is 0: accept only numbers and numeric text.
  const numeric = (v: unknown) => typeof v === 'number' || typeof v === 'string';
  if (!numeric(b.latitude) || !numeric(b.longitude)) return null;
  const latitude = Number(b.latitude);
  const longitude = Number(b.longitude);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return null;
  return { latitude, longitude };
}

/** WeatherAPI.com forecast URL for a place. */
export function forecastUrl(apiKey: string, { latitude, longitude }: Coordinates, days = 5): string {
  return `https://api.weatherapi.com/v1/forecast.json?key=${encodeURIComponent(apiKey)}&q=${latitude},${longitude}&days=${days}`;
}

/** The parts of a WeatherAPI.com forecast response that the app uses. */
export interface WeatherApiForecast {
  current: { temp_c?: number; humidity?: number; precip_mm?: number; wind_kph?: number; condition: { text?: string } };
  forecast?: {
    forecastday?: {
      date: string;
      day: { mintemp_c: number; maxtemp_c: number; condition: { text: string }; daily_chance_of_rain: number };
    }[];
  };
}

/** The app's weather shape from a WeatherAPI.com forecast response. */
export function toWeather(data: WeatherApiForecast) {
  return {
    current: {
      temperature: data.current.temp_c,
      humidity: data.current.humidity,
      precipitation: data.current.precip_mm,
      wind_speed: data.current.wind_kph,
      condition: data.current.condition.text,
    },
    forecast: (data.forecast?.forecastday ?? []).map((day) => ({
      date: day.date,
      temperature_min: day.day.mintemp_c,
      temperature_max: day.day.maxtemp_c,
      condition: day.day.condition.text,
      precipitation_chance: day.day.daily_chance_of_rain,
    })),
  };
}
