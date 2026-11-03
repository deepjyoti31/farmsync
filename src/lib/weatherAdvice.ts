import { format, parseISO } from 'date-fns';

export interface ForecastDayLike {
  date: string;
  temperature_min: number;
  temperature_max: number;
  condition: string;
  precipitation_chance: number;
}

export interface CurrentLike {
  temperature: number;
  humidity: number;
  wind_speed: number;
  condition: string;
}

export type AdviceKind = 'spray' | 'irrigate' | 'heat' | 'frost' | 'harvest';
export type AdviceTone = 'go' | 'wait';

export interface Advice {
  kind: AdviceKind;
  tone: AdviceTone;
  title: string;
  detail: string;
}

/** Thresholds behind the advice. Simple, conservative rules of thumb; not agronomic advice for a specific crop. */
export const WEATHER_RULES = {
  wetChance: 60,
  sprayMaxWind: 15,
  heatMax: 35,
  frostMin: 4,
};

/** Weekday of a yyyy-MM-dd date in local time (new Date() would read it as UTC midnight). */
const dayName = (iso: string) => format(parseISO(iso), 'EEEE');

/** Plain-language advice for field work from the current conditions and the next few days. */
export function fieldWorkAdvice(current: CurrentLike, forecast: ForecastDayLike[]): Advice[] {
  const r = WEATHER_RULES;
  const out: Advice[] = [];
  const next2 = forecast.slice(0, 2);
  const wetSoon = next2.find((d) => d.precipitation_chance >= r.wetChance);
  const wetWeek = forecast.find((d) => d.precipitation_chance >= r.wetChance);

  if (current.wind_speed > r.sprayMaxWind) {
    out.push({ kind: 'spray', tone: 'wait', title: 'Too windy to spray', detail: `Wind is ${current.wind_speed} km/h. Spray drifts above about ${r.sprayMaxWind} km/h.` });
  } else if (wetSoon) {
    out.push({ kind: 'spray', tone: 'wait', title: 'Hold off spraying', detail: `Rain is likely ${dayName(wetSoon.date)} (${wetSoon.precipitation_chance}%) and could wash it off.` });
  } else {
    out.push({ kind: 'spray', tone: 'go', title: 'Good for spraying', detail: `Light wind (${current.wind_speed} km/h) and no rain expected in the next two days.` });
  }

  if (wetWeek) {
    out.push({ kind: 'irrigate', tone: 'wait', title: 'Rain on the way', detail: `${dayName(wetWeek.date)} has a ${wetWeek.precipitation_chance}% chance of rain. You may be able to skip the irrigation before it.` });
  } else {
    out.push({ kind: 'irrigate', tone: 'go', title: 'Dry week ahead', detail: 'No day has a good chance of rain. Keep to your irrigation schedule.' });
  }

  const hot = forecast.find((d) => d.temperature_max >= r.heatMax);
  if (hot) {
    out.push({ kind: 'heat', tone: 'wait', title: `Hot on ${dayName(hot.date)}`, detail: `Up to ${Math.round(hot.temperature_max)}°. Irrigate early or late in the day and give animals shade and water.` });
  }

  const cold = forecast.find((d) => d.temperature_min <= r.frostMin);
  if (cold) {
    out.push({ kind: 'frost', tone: 'wait', title: `Frost risk on ${dayName(cold.date)}`, detail: `Down to ${Math.round(cold.temperature_min)}°. Cover seedlings and avoid irrigating late in the evening.` });
  }

  const dryRun = forecast.slice(0, 3).every((d) => d.precipitation_chance < 30);
  if (dryRun && forecast.length >= 3) {
    out.push({ kind: 'harvest', tone: 'go', title: 'Three dry days', detail: 'A good window for harvesting, threshing or drying produce.' });
  }

  return out;
}
