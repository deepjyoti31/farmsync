
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sun, Cloud, CloudRain, Wind, Droplets } from 'lucide-react';
import { WeatherData } from '@/types';

interface WeatherCardProps {
  weatherData: WeatherData;
}

const WeatherCard: React.FC<WeatherCardProps> = ({ weatherData }) => {
  const getWeatherIcon = () => {
    switch (weatherData.icon) {
      case 'sun':
        return <Sun className="h-10 w-10 text-farm-yellow" />;
      case 'cloud':
        return <Cloud className="h-10 w-10 text-gray-400" />;
      case 'rain':
        return <CloudRain className="h-10 w-10 text-farm-sky" />;
      default:
        return <Sun className="h-10 w-10 text-farm-yellow" />;
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Today's Weather</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center">
          <div className="flex flex-col">
            <span className="text-3xl font-bold">{weatherData.temperature}°C</span>
            <span className="text-muted-foreground">{weatherData.condition}</span>
          </div>
          {getWeatherIcon()}
        </div>
        <div className="grid grid-cols-2 gap-2 mt-4">
          <div className="flex items-center gap-2">
            <Droplets className="h-4 w-4 text-farm-sky" />
            <span className="text-sm">Humidity: {weatherData.humidity}%</span>
          </div>
          <div className="flex items-center gap-2">
            <Wind className="h-4 w-4" />
            <span className="text-sm">Wind: {weatherData.windSpeed} km/h</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default WeatherCard;
