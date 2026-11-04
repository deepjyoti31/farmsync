import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { CheckCircle2, CloudSun, Loader2, MapPin, PauseCircle, RefreshCw } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Button } from '@/components/ui/button';
import PageHeader from '@/components/common/PageHeader';
import FarmSelector from '@/components/farms/FarmSelector';
import WeatherIcon from '@/components/weather/WeatherIcon';
import { supabase } from '@/integrations/supabase/client';
import { AXIS_PROPS, CATEGORICAL, CHART, GRID_PROPS, TOOLTIP_PROPS } from '@/lib/chartPalette';
import { WEATHER_RULES, fieldWorkAdvice } from '@/lib/weatherAdvice';
import { cn } from '@/lib/utils';

interface WeatherResponse {
  current: { temperature: number; humidity: number; precipitation: number; wind_speed: number; condition: string };
  forecast: { date: string; temperature_min: number; temperature_max: number; condition: string; precipitation_chance: number }[];
}

// High and low are the amber and blue slots of the chart palette, a validated pair.
const HIGH = CATEGORICAL[1];
const LOW = CATEGORICAL[2];

const Weather = () => {
  const [farmId, setFarmId] = React.useState<string | null>(null);

  const { data: farm, isLoading: loadingFarm } = useQuery({
    queryKey: ['farm', farmId],
    enabled: !!farmId,
    queryFn: async () => {
      const { data, error } = await supabase.from('farms').select('name, village, district, state, gps_latitude, gps_longitude').eq('id', farmId!).single();
      if (error) throw error;
      return data;
    },
  });

  // 0 is a valid latitude or longitude, so test for presence rather than truthiness.
  const hasCoords = farm?.gps_latitude != null && farm?.gps_longitude != null;

  // Same key as the Today screen's weather band, so the two share one cached forecast.
  const { data: weather, isLoading, isFetching, isError, refetch, dataUpdatedAt } = useQuery({
    queryKey: ['weather', farmId, farm?.gps_latitude, farm?.gps_longitude],
    enabled: !!farm && hasCoords,
    refetchInterval: 1000 * 60 * 30,
    retry: false,
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('get-weather', { body: { latitude: farm!.gps_latitude, longitude: farm!.gps_longitude } });
      if (error) throw error;
      return data as WeatherResponse;
    },
  });

  const place = [farm?.village, farm?.district, farm?.state].filter(Boolean).join(', ');
  const days = weather?.forecast ?? [];
  const chart = days.map((d) => ({ day: format(parseISO(d.date), 'EEE'), high: Math.round(d.temperature_max), low: Math.round(d.temperature_min), rain: d.precipitation_chance }));
  const advice = weather ? fieldWorkAdvice(weather.current, days) : [];

  return (
    <div>
      <PageHeader
        title="Weather"
        description={place ? `Forecast for ${place}` : 'Local forecast for your farm, and what it means for field work.'}
        actions={
          <>
            <FarmSelector selectedFarmId={farmId} onFarmChange={setFarmId} />
            <Button variant="outline" onClick={() => refetch()} disabled={!hasCoords || isFetching}>
              <RefreshCw className={cn(isFetching && 'animate-spin')} /> Refresh
            </Button>
          </>
        }
      />

      {!farmId || loadingFarm || (hasCoords && isLoading) ? (
        <div className="flex justify-center p-12" role="status" aria-label="Loading weather">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : !hasCoords ? (
        <div className="surface flex flex-col items-center gap-3 p-12 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-[18px] bg-info-tint text-info">
            <MapPin className="h-8 w-8" aria-hidden="true" />
          </span>
          <h2 className="text-xl font-bold">Where is {farm?.name ?? 'this farm'}?</h2>
          <p className="max-w-sm text-muted-foreground">The forecast needs the farm's location. Draw its boundary or add its GPS position on the Farms page.</p>
          <Button size="lg" className="mt-2" asChild>
            <Link to="/dashboard/farms">Add the farm's location</Link>
          </Button>
        </div>
      ) : isError || !weather ? (
        <div className="surface flex flex-col items-center gap-3 p-12 text-center">
          <CloudSun className="h-10 w-10 text-muted-foreground" aria-hidden="true" />
          <h2 className="text-xl font-bold">The forecast service did not answer</h2>
          <p className="max-w-sm text-muted-foreground">This can happen on a weak connection. Try again in a moment.</p>
          <Button variant="outline" className="mt-2" onClick={() => refetch()}>
            <RefreshCw /> Try again
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <section aria-labelledby="now-h" className="surface flex flex-wrap items-center gap-6 p-5 md:p-6">
            <div className="flex min-w-[240px] flex-[1_1_260px] items-center gap-5">
              <WeatherIcon condition={weather.current.condition} className="h-16 w-16" />
              <div className="flex flex-col">
                <h2 id="now-h" className="eyebrow">
                  Now
                </h2>
                <span className="font-display text-[56px] font-bold leading-none">{Math.round(weather.current.temperature)}°</span>
                <span className="text-muted-foreground">{weather.current.condition}</span>
              </div>
            </div>
            <dl className="grid flex-[1_1_320px] grid-cols-3 gap-3">
              {[
                ['Humidity', `${weather.current.humidity}%`],
                ['Wind', `${weather.current.wind_speed} km/h`],
                ['Rain today', `${weather.current.precipitation} mm`],
              ].map(([k, v]) => (
                <div key={k} className="rounded-xl bg-background p-3.5">
                  <dt className="text-xs text-muted-foreground">{k}</dt>
                  <dd className="mt-1 font-mono text-lg font-medium">{v}</dd>
                </div>
              ))}
            </dl>
            {dataUpdatedAt > 0 && <p className="w-full text-xs text-muted-foreground">Updated {format(new Date(dataUpdatedAt), 'h:mm a')}</p>}
          </section>

          <section aria-labelledby="days-h">
            <h2 id="days-h" className="mb-3 text-xl font-bold">
              Next {days.length} days
            </h2>
            <ol className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-3">
              {days.map((d) => {
                const wet = d.precipitation_chance >= WEATHER_RULES.wetChance;
                return (
                  <li key={d.date} className={cn('surface flex flex-col gap-2 p-4', wet && 'border-info/40 bg-info-tint')}>
                    <span className="flex items-baseline justify-between">
                      <span className="font-semibold">{format(parseISO(d.date), 'EEEE')}</span>
                      <span className="font-mono text-xs text-muted-foreground">{format(parseISO(d.date), 'd MMM')}</span>
                    </span>
                    <WeatherIcon condition={d.condition} className="h-8 w-8" />
                    <span className="text-sm text-muted-foreground">{d.condition}</span>
                    <span className="font-mono">
                      <span className="sr-only">High </span>
                      {Math.round(d.temperature_max)}°<span className="text-muted-foreground"> / </span>
                      <span className="sr-only">low </span>
                      <span className="text-muted-foreground">{Math.round(d.temperature_min)}°</span>
                    </span>
                    <span className="flex flex-col gap-1">
                      <span className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Rain</span>
                        <span className="font-mono text-info">{d.precipitation_chance}%</span>
                      </span>
                      <span aria-hidden="true" className="h-1.5 rounded bg-muted">
                        <span className="block h-full rounded bg-info" style={{ width: `${d.precipitation_chance}%` }} />
                      </span>
                    </span>
                  </li>
                );
              })}
            </ol>
          </section>

          <section aria-labelledby="advice-h" className="surface p-5 md:p-6">
            <h2 id="advice-h" className="mb-1 text-xl font-bold">
              Field work
            </h2>
            <p className="mb-3 text-sm text-muted-foreground">Rules of thumb from the forecast. Check your crop and local advice before acting.</p>
            <ul className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-3">
              {advice.map((a) => (
                <li key={a.kind} className="flex gap-3 rounded-xl border p-3.5">
                  {a.tone === 'go' ? (
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-leaf" aria-label="Go ahead" />
                  ) : (
                    <PauseCircle className="mt-0.5 h-5 w-5 shrink-0 text-warning" aria-label="Wait or take care" />
                  )}
                  <span className="flex flex-col gap-0.5">
                    <span className="font-semibold">{a.title}</span>
                    <span className="text-sm leading-snug text-muted-foreground">{a.detail}</span>
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <section aria-labelledby="temp-h" className="surface p-5 md:p-6">
              <h2 id="temp-h" className="mb-4 text-xl font-bold">
                Highs and lows
              </h2>
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chart} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                    <CartesianGrid {...GRID_PROPS} />
                    <XAxis {...AXIS_PROPS} dataKey="day" />
                    <YAxis {...AXIS_PROPS} unit="°" width={44} />
                    <Tooltip {...TOOLTIP_PROPS} formatter={(v: number) => `${v}°`} />
                    <Legend iconType="plainline" wrapperStyle={{ fontSize: 13 }} />
                    <Line type="monotone" dataKey="high" name="High" stroke={HIGH} strokeWidth={2} dot={{ r: 4, fill: HIGH, stroke: '#FFFFFF', strokeWidth: 2 }} />
                    <Line type="monotone" dataKey="low" name="Low" stroke={LOW} strokeWidth={2} dot={{ r: 4, fill: LOW, stroke: '#FFFFFF', strokeWidth: 2 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </section>
            <section aria-labelledby="rain-h" className="surface p-5 md:p-6">
              <h2 id="rain-h" className="mb-4 text-xl font-bold">
                Chance of rain
              </h2>
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chart} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                    <CartesianGrid {...GRID_PROPS} />
                    <XAxis {...AXIS_PROPS} dataKey="day" />
                    <YAxis {...AXIS_PROPS} unit="%" domain={[0, 100]} width={44} />
                    <Tooltip {...TOOLTIP_PROPS} formatter={(v: number) => `${v}%`} />
                    <Bar dataKey="rain" name="Chance of rain" fill={CHART.water} radius={[4, 4, 0, 0]} maxBarSize={36} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>
          </div>
        </div>
      )}
    </div>
  );
};

export default Weather;
