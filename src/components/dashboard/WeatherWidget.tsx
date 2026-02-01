
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw, CloudSun, Droplets, Wind, Cloud, CloudRain, Sun } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

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

const WeatherWidget: React.FC<WeatherWidgetProps> = ({ farmId }) => {
  const [isRefreshing, setIsRefreshing] = useState(false);

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

  const {
    data: weather,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['weather', farmId, farm?.gps_latitude, farm?.gps_longitude],
    queryFn: async () => {
      if (!farmId || !farm) return null;

      // Only fetch weather if we have valid coordinates
      if (!farm.gps_latitude || !farm.gps_longitude) {
        return null;
      }

      try {
        const { data, error } = await supabase.functions.invoke('get-weather', {
          body: {
            latitude: farm.gps_latitude,
            longitude: farm.gps_longitude
          },
        });

        if (error) throw error;
        return data as WeatherData;
      } catch (error) {
        return null;
      }
    },
    enabled: !!farm && !!farm.gps_latitude && !!farm.gps_longitude,
    refetchInterval: 1000 * 60 * 30, // Refetch every 30 minutes
    refetchOnMount: true,
    staleTime: 0, // Always fetch fresh data on mount
    retry: false,
  });

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      await refetch();
      toast({
        title: 'Weather updated',
        description: 'Weather data has been refreshed',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to refresh weather data.',
        variant: 'destructive',
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const getWeatherIcon = (condition: string) => {
    if (!condition) return <CloudSun className="h-10 w-10 text-primary" />;

    const conditionLower = condition.toLowerCase();

    if (conditionLower.includes('clear') || conditionLower.includes('sunny')) {
      return <Sun className="h-10 w-10 text-farm-yellow" />;
    } else if (conditionLower.includes('cloud') || conditionLower.includes('partly')) {
      return <Cloud className="h-10 w-10 text-gray-400" />;
    } else if (conditionLower.includes('rain') || conditionLower.includes('thunder')) {
      return <CloudRain className="h-10 w-10 text-farm-sky" />;
    } else {
      return <CloudSun className="h-10 w-10 text-primary" />;
    }
  };

  if (error) {
    console.error('Weather error:', error);
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-medium">
          {farm?.name ? (
            <span title={`${farm.village || ''} ${farm.district || ''} ${farm.state || ''}`}>
              {farm.name}
            </span>
          ) : (
            "Weather"
          )}
        </CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefresh}
          disabled={isLoading || isRefreshing || !farmId || !farm?.gps_latitude || !farm?.gps_longitude}
        >
          {isLoading || isRefreshing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !weather ? (
          <div className="flex flex-col justify-center items-center py-8 text-center">
            <CloudSun className="h-12 w-12 text-muted-foreground mb-2" />
            <p className="text-muted-foreground">Weather information not available</p>
            {!farm?.gps_latitude || !farm?.gps_longitude ? (
              <p className="text-xs text-muted-foreground mt-1">
                No GPS coordinates available for this farm
              </p>
            ) : (
              <p className="text-xs text-muted-foreground mt-1">
                Click refresh to try again
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getWeatherIcon(weather.current.condition)}
                <div>
                  <p className="text-3xl font-bold">{weather.current.temperature}°C</p>
                  <p className="text-muted-foreground">{weather.current.condition}</p>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Droplets className="h-4 w-4 text-blue-500" />
                  <span className="text-sm">{weather.current.humidity}% Humidity</span>
                </div>
                <div className="flex items-center gap-2">
                  <Wind className="h-4 w-4 text-blue-500" />
                  <span className="text-sm">{weather.current.wind_speed} km/h Wind</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2">
              {weather.forecast.slice(0, 3).map((day) => (
                <div key={day.date} className="text-center p-2 bg-muted/30 rounded-md">
                  <p className="text-xs">{new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}</p>
                  <p className="text-sm font-medium">
                    {day.temperature_min}° / {day.temperature_max}°
                  </p>
                  <p className="text-xs text-muted-foreground">{day.condition.split(' ')[0]}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default WeatherWidget;
