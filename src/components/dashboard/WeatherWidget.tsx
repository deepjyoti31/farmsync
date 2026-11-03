import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { parseISO } from 'date-fns';
import { CloudSun, Droplets, Loader2, RefreshCw } from 'lucide-react';
import WeatherIcon from '@/components/weather/WeatherIcon';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { rainAdvice } from '@/lib/dashboard';
import { cn } from '@/lib/utils';

interface WeatherWidgetProps {
  farmId: string | null;
}

interface WeatherData {
  current: {
    temperature: number;
    humidity: number;
    precipitation: number;
    wind_speed: number;
    condition: string;
  };
  forecast: Array<{
    date: string;
    temperature_min: number;
    temperature_max: number;
    condition: string;
    precipitation_chance: number;
  }>;
}

// Forecast dates are yyyy-MM-dd; parse them as local dates so the weekday is right west of UTC.
const weekday = (date: string, lang: string) => parseISO(date).toLocaleDateString(lang, { weekday: 'short' });

/** Wide weather band for the Today screen: now, five days, and a rain tip. */
const WeatherWidget: React.FC<WeatherWidgetProps> = ({ farmId }) => {
  const { t, i18n } = useTranslation();

  const { data: farm } = useQuery({
    queryKey: ['farm', farmId],
    queryFn: async () => {
      if (!farmId) return null;
      const { data, error } = await supabase
        .from('farms')
        .select('name, village, district, state, gps_latitude, gps_longitude')
        .eq('id', farmId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!farmId,
  });

  const hasCoords = !!farm?.gps_latitude && !!farm?.gps_longitude;

  const { data: weather, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['weather', farmId, farm?.gps_latitude, farm?.gps_longitude],
    queryFn: async () => {
      if (!farm || !hasCoords) return null;
      try {
        const { data, error } = await supabase.functions.invoke('get-weather', {
          body: { latitude: farm.gps_latitude, longitude: farm.gps_longitude },
        });
        if (error) throw error;
        return data as WeatherData;
      } catch {
        return null;
      }
    },
    enabled: !!farm && hasCoords,
    refetchInterval: 1000 * 60 * 30,
    retry: false,
  });

  const wet = rainAdvice(weather?.forecast);
  const place = [farm?.village, farm?.district].filter(Boolean).join(', ');

  return (
    <section aria-label={t('today.weather.label', 'Weather')} className="surface flex flex-wrap items-stretch gap-5 p-5 md:gap-6 md:px-6">
      {isLoading && hasCoords ? (
        <div className="flex flex-1 items-center gap-3 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> {t('today.weather.loading', 'Getting the forecast…')}
        </div>
      ) : !weather ? (
        <div className="flex flex-1 flex-wrap items-center gap-4">
          <CloudSun className="h-10 w-10 text-muted-foreground" aria-hidden="true" />
          <div className="flex-1">
            <p className="font-semibold">{t('today.weather.none', 'No forecast yet')}</p>
            <p className="text-sm text-muted-foreground">
              {hasCoords
                ? t('today.weather.retry', 'The forecast service did not answer. Try again in a moment.')
                : t('today.weather.no_gps', 'Draw your farm on the map, or add its GPS location, to see local weather.')}
            </p>
          </div>
          {hasCoords && (
            <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCw className={cn(isFetching && 'animate-spin')} /> {t('today.weather.refresh', 'Try again')}
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className="flex min-w-[200px] flex-[0_1_220px] items-center gap-4">
            <WeatherIcon condition={weather.current.condition} className="h-14 w-14 shrink-0" />
            <div className="flex flex-col">
              <span className="font-display text-[40px] font-bold leading-none">{Math.round(weather.current.temperature)}°</span>
              <span className="text-sm text-muted-foreground">{weather.current.condition}</span>
              {place && <span className="text-xs text-muted-foreground">{place}</span>}
            </div>
          </div>

          <dl className="grid flex-[0_1_200px] grid-cols-[auto_auto] content-center gap-x-4 gap-y-1.5 text-sm">
            <dt className="text-muted-foreground">{t('today.weather.humidity', 'Humidity')}</dt>
            <dd className="font-mono">{weather.current.humidity}%</dd>
            <dt className="text-muted-foreground">{t('today.weather.wind', 'Wind')}</dt>
            <dd className="font-mono">{weather.current.wind_speed} km/h</dd>
            <dt className="text-muted-foreground">{t('today.weather.rain', 'Rain')}</dt>
            <dd className="font-mono">{weather.current.precipitation} mm</dd>
          </dl>

          <ol aria-label={t('today.weather.forecast', 'Forecast')} className="grid min-w-[280px] flex-[1_1_320px] grid-cols-5 gap-1.5">
            {weather.forecast.slice(0, 5).map((day) => {
              const rainy = day.precipitation_chance >= 60;
              return (
                <li key={day.date} className={cn('flex flex-col items-center justify-center gap-1 rounded-[10px] px-1 py-2.5', rainy ? 'bg-info-tint' : 'bg-background')}>
                  <span className="text-[13px] font-semibold">{weekday(day.date, i18n.language)}</span>
                  <WeatherIcon condition={day.condition} className="h-5 w-5" />
                  <span className="font-mono text-[13px] leading-tight">
                    <span className="sr-only">{t('today.weather.high', 'High')} </span>
                    {Math.round(day.temperature_max)}°
                    <span className="text-muted-foreground">
                      <span className="sr-only"> {t('today.weather.low', 'low')} </span>
                      <span aria-hidden="true"> </span>
                      {Math.round(day.temperature_min)}°
                    </span>
                  </span>
                  <span className="font-mono text-xs text-info">{day.precipitation_chance}%</span>
                </li>
              );
            })}
          </ol>

          {wet && (
            <div className="flex flex-[1_1_240px] items-start gap-3 rounded-xl bg-info-tint px-4 py-3.5 text-[#173E6B] dark:text-info">
              <Droplets className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
              <div className="flex flex-col gap-1 text-sm leading-snug">
                <strong>
                  {t('today.weather.rain_title', {
                    day: parseISO(wet.date).toLocaleDateString(i18n.language, { weekday: 'long' }),
                    chance: wet.precipitation_chance,
                    defaultValue: 'Rain likely on {{day}} ({{chance}}%)',
                  })}
                </strong>
                <span>{t('today.weather.rain_tip', 'You may be able to skip the irrigation before it.')}</span>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
};

export default WeatherWidget;
