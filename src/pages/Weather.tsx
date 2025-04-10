
import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription,
  CardFooter
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Cloud,
  Sun,
  CloudRain,
  CloudSnow,
  CloudLightning,
  CloudDrizzle,
  Wind,
  Droplets,
  Umbrella,
  RefreshCw,
  MapPin,
  ThermometerSun,
  ThermometerSnowflake,
  Calendar,
  ArrowUp,
  ArrowDown,
  Loader2
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import FarmSelector from '@/components/farms/FarmSelector';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface WeatherResponse {
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

const Weather = () => {
  const [selectedFarmId, setSelectedFarmId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch farm location data
  const { data: farm } = useQuery({
    queryKey: ['farm', selectedFarmId],
    queryFn: async () => {
      if (!selectedFarmId) return null;
      
      const { data, error } = await supabase
        .from('farms')
        .select('name, gps_latitude, gps_longitude, village, district, state')
        .eq('id', selectedFarmId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!selectedFarmId,
  });

  // Fetch weather data
  const { 
    data: weather, 
    isLoading, 
    error, 
    refetch 
  } = useQuery({
    queryKey: ['weather', selectedFarmId],
    queryFn: async () => {
      if (!selectedFarmId) return null;
      
      // Use default coordinates if farm doesn't have GPS coordinates
      const latitude = farm?.gps_latitude || 20.5937; // Default to central India
      const longitude = farm?.gps_longitude || 78.9629;
      
      try {
        const { data, error } = await supabase.functions.invoke('get-weather', {
          body: { latitude, longitude },
        });
        
        if (error) throw error;
        return data as WeatherResponse;
      } catch (error) {
        console.error('Error fetching weather:', error);
        throw new Error('Failed to fetch weather data');
      }
    },
    enabled: !!farm || !!selectedFarmId, // Enable even if we don't have farm GPS data
  });

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      await refetch();
      toast({
        title: 'Weather updated',
        description: 'Weather data has been refreshed successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to refresh weather data',
        variant: 'destructive',
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const getWeatherIcon = (condition: string) => {
    if (!condition) return <Cloud className="h-12 w-12 text-primary" />;
    
    const conditionLower = condition.toLowerCase();
    
    if (conditionLower.includes('clear') || conditionLower.includes('sunny')) {
      return <Sun className="h-12 w-12 text-farm-yellow" />;
    } else if (conditionLower.includes('rain') || conditionLower.includes('shower')) {
      return <CloudRain className="h-12 w-12 text-farm-sky" />;
    } else if (conditionLower.includes('thunder') || conditionLower.includes('storm')) {
      return <CloudLightning className="h-12 w-12 text-purple-500" />;
    } else if (conditionLower.includes('snow')) {
      return <CloudSnow className="h-12 w-12 text-blue-300" />;
    } else if (conditionLower.includes('drizzle')) {
      return <CloudDrizzle className="h-12 w-12 text-blue-400" />;
    } else if (conditionLower.includes('cloud') || conditionLower.includes('overcast')) {
      return <Cloud className="h-12 w-12 text-gray-400" />;
    } else if (conditionLower.includes('partly')) {
      return <Cloud className="h-12 w-12 text-gray-400" />;
    } else {
      return <Cloud className="h-12 w-12 text-primary" />;
    }
  };

  // Prepare data for temperature chart
  const tempChartData = weather?.forecast?.map(day => ({
    date: new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' }),
    min: day.temperature_min,
    max: day.temperature_max,
  }));
  
  // Create data for precipitation chart
  const precipChartData = weather?.forecast?.map(day => ({
    date: new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' }),
    chance: day.precipitation_chance,
  }));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Weather Forecast</h1>
          <p className="text-muted-foreground mt-1">
            View current weather conditions and forecast for your farm
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2">
          <FarmSelector
            selectedFarmId={selectedFarmId}
            onFarmChange={setSelectedFarmId}
          />
          <Button 
            variant="outline" 
            className="gap-2"
            onClick={handleRefresh}
            disabled={isRefreshing || !selectedFarmId}
          >
            {isRefreshing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Refresh Data
          </Button>
        </div>
      </div>
      
      {!selectedFarmId ? (
        <Card className="p-8 text-center">
          <CardTitle className="mb-4">Select a Farm</CardTitle>
          <CardDescription>
            Please select a farm to view weather forecast for that location.
          </CardDescription>
        </Card>
      ) : !weather ? (
        <Card className="p-8 text-center">
          <CardTitle className="mb-4">Loading Weather Data</CardTitle>
          <CardDescription>
            Fetching weather information for your farm...
          </CardDescription>
        </Card>
      ) : (
        <>
          <Card className="overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-white text-2xl font-bold">Current Weather</CardTitle>
                    <CardDescription className="text-blue-100">
                      <div className="flex items-center mt-1">
                        <MapPin className="h-4 w-4 mr-1" />
                        {farm?.village && farm?.district ? (
                          <span>{farm.village}, {farm.district}, {farm.state}</span>
                        ) : (
                          <span>{farm?.name || 'Your Farm'}</span>
                        )}
                      </div>
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-blue-100">Last updated:</span>
                    <p className="text-sm font-medium text-white">{new Date().toLocaleString()}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pb-8">
                <div className="flex flex-col md:flex-row justify-between items-center">
                  <div className="flex items-center mb-4 md:mb-0">
                    {getWeatherIcon(weather.current.condition)}
                    <div className="ml-4">
                      <div className="text-5xl font-bold">{weather.current.temperature}°C</div>
                      <div className="text-lg text-blue-100">{weather.current.condition}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                    <div className="flex items-center">
                      <Droplets className="h-5 w-5 mr-2 text-blue-100" />
                      <div>
                        <div className="text-sm text-blue-100">Humidity</div>
                        <div className="font-medium">{weather.current.humidity}%</div>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Wind className="h-5 w-5 mr-2 text-blue-100" />
                      <div>
                        <div className="text-sm text-blue-100">Wind</div>
                        <div className="font-medium">{weather.current.wind_speed} km/h</div>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Umbrella className="h-5 w-5 mr-2 text-blue-100" />
                      <div>
                        <div className="text-sm text-blue-100">Precipitation</div>
                        <div className="font-medium">{weather.current.precipitation} mm</div>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Calendar className="h-5 w-5 mr-2 text-blue-100" />
                      <div>
                        <div className="text-sm text-blue-100">Date</div>
                        <div className="font-medium">{new Date().toLocaleDateString()}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </div>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>5-Day Forecast</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Day</TableHead>
                      <TableHead>Weather</TableHead>
                      <TableHead>Condition</TableHead>
                      <TableHead>
                        <div className="flex items-center">
                          <ThermometerSun className="h-4 w-4 mr-1" />
                          <span>Max</span>
                        </div>
                      </TableHead>
                      <TableHead>
                        <div className="flex items-center">
                          <ThermometerSnowflake className="h-4 w-4 mr-1" />
                          <span>Min</span>
                        </div>
                      </TableHead>
                      <TableHead>
                        <div className="flex items-center">
                          <Umbrella className="h-4 w-4 mr-1" />
                          <span>Precip.</span>
                        </div>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {weather.forecast.map((day, index) => (
                      <TableRow key={day.date}>
                        <TableCell className="font-medium">
                          {index === 0 ? 'Today' : new Date(day.date).toLocaleDateString('en-US', { weekday: 'long' })}
                          <div className="text-xs text-muted-foreground">
                            {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-center">
                            {getWeatherIcon(day.condition)}
                          </div>
                        </TableCell>
                        <TableCell>{day.condition}</TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <ArrowUp className="h-4 w-4 text-red-500 mr-1" />
                            {day.temperature_max}°C
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <ArrowDown className="h-4 w-4 text-blue-500 mr-1" />
                            {day.temperature_min}°C
                          </div>
                        </TableCell>
                        <TableCell>{day.precipitation_chance}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Temperature Forecast</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={tempChartData}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis label={{ value: '°C', position: 'insideLeft', angle: -90 }} />
                      <Tooltip />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="max" 
                        name="Max Temp" 
                        stroke="#f97316" 
                        activeDot={{ r: 8 }} 
                        strokeWidth={2}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="min" 
                        name="Min Temp" 
                        stroke="#0ea5e9" 
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Precipitation Chance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={precipChartData}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis label={{ value: '%', position: 'insideLeft', angle: -90 }} />
                      <Tooltip />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="chance" 
                        name="Precipitation Chance" 
                        stroke="#3b82f6" 
                        fill="#3b82f6"
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Weather Advisory</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 border rounded-md">
                  <h3 className="font-medium text-lg mb-2">Farming Tips Based on Weather Forecast</h3>
                  <ul className="space-y-2 list-disc pl-5">
                    <li>Temperatures are expected to {weather.forecast[0].temperature_max > 30 ? 'be quite high' : 'remain moderate'} in the coming days. {weather.forecast[0].temperature_max > 30 ? 'Ensure proper irrigation to prevent crop stress.' : 'Conditions are favorable for most crop growth.'}</li>
                    {weather.forecast.some(day => day.precipitation_chance > 50) ? (
                      <li>Significant chance of precipitation in the forecast. Consider delaying any chemical spraying operations.</li>
                    ) : (
                      <li>Dry conditions expected. Ensure adequate irrigation for your crops.</li>
                    )}
                    {weather.current.wind_speed > 15 ? (
                      <li>Higher wind speeds may affect spraying operations and young plant growth. Take necessary precautions.</li>
                    ) : (
                      <li>Wind conditions are favorable for field operations.</li>
                    )}
                  </ul>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full">View Detailed Weather Report</Button>
            </CardFooter>
          </Card>
        </>
      )}
    </div>
  );
};

export default Weather;
