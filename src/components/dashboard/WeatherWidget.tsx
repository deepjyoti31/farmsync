
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw, CloudSun, Droplets, Wind } from 'lucide-react';
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
        .select('gps_latitude, gps_longitude')
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
    queryKey: ['weather', farmId],
    queryFn: async () => {
      if (!farmId) return null;
      
      // First, check if we have coordinates
      const latitude = farm?.gps_latitude || 20.5937; // Default to central India if not set
      const longitude = farm?.gps_longitude || 78.9629;
      
      try {
        const { data, error } = await supabase.functions.invoke('get-weather', {
          body: { latitude, longitude, farmId },
        });
        
        if (error) throw error;
        return data as WeatherData;
      } catch (error) {
        console.error('Error fetching weather:', error);
        throw new Error('Failed to fetch weather data');
      }
    },
    enabled: !!farmId && !!farm,
  });

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      await refetch();
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

  if (error) {
    toast({
      title: 'Error',
      description: (error as Error).message || 'Failed to load weather data.',
      variant: 'destructive',
    });
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-medium">Weather</CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefresh}
          disabled={isLoading || isRefreshing || !farmId}
        >
          {isLoading || isRefreshing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading || !weather ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CloudSun className="h-10 w-10 text-primary" />
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
                  <p className="text-xs text-muted-foreground">{day.condition}</p>
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
