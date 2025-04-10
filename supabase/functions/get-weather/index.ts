
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Function to fetch data from Open-Meteo API
async function fetchWeatherData(latitude: number, longitude: number) {
  try {
    // Fetch current weather from Open-Meteo
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weather_code&timezone=auto&forecast_days=5`
    );
    
    if (!response.ok) {
      throw new Error(`Error fetching weather: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Process current weather data
    const weatherCode = data.current.weather_code;
    const current = {
      temperature: Math.round(data.current.temperature_2m),
      humidity: data.current.relative_humidity_2m,
      precipitation: data.current.precipitation,
      wind_speed: data.current.wind_speed_10m,
      condition: getWeatherCondition(weatherCode)
    };
    
    // Process forecast data
    const forecast = [];
    
    for (let i = 0; i < data.daily.time.length; i++) {
      forecast.push({
        date: data.daily.time[i],
        temperature_min: Math.round(data.daily.temperature_2m_min[i]),
        temperature_max: Math.round(data.daily.temperature_2m_max[i]),
        condition: getWeatherCondition(data.daily.weather_code[i]),
        precipitation_chance: data.daily.precipitation_sum[i] > 0 ? 80 : 20 // Approximation
      });
    }
    
    return { current, forecast };
  } catch (error) {
    console.error("Error fetching weather data:", error);
    return generateMockWeatherData(latitude, longitude);
  }
}

// Map WMO weather codes to conditions
function getWeatherCondition(code: number): string {
  // WMO Weather interpretation codes (WW)
  // https://open-meteo.com/en/docs
  if (code === 0) return "Clear sky";
  if (code === 1) return "Mainly clear";
  if (code >= 2 && code <= 3) return "Partly cloudy";
  if (code === 45 || code === 48) return "Fog";
  if (code >= 51 && code <= 55) return "Drizzle";
  if (code >= 56 && code <= 57) return "Freezing Drizzle";
  if (code >= 61 && code <= 65) return "Rain";
  if (code >= 66 && code <= 67) return "Freezing Rain";
  if (code >= 71 && code <= 77) return "Snow";
  if (code >= 80 && code <= 82) return "Rain showers";
  if (code >= 85 && code <= 86) return "Snow showers";
  if (code === 95) return "Thunderstorm";
  if (code >= 96 && code <= 99) return "Thunderstorm with hail";
  return "Unknown";
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Parse the request body
    const { latitude, longitude } = await req.json();

    // Validate the input
    if (!latitude || !longitude) {
      return new Response(
        JSON.stringify({ error: 'Missing latitude or longitude parameters' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Fetch weather data from Open-Meteo
    const weatherData = await fetchWeatherData(latitude, longitude);

    return new Response(
      JSON.stringify(weatherData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in weather function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

// Helper function to generate mock weather data (fallback)
function generateMockWeatherData(latitude: number, longitude: number) {
  // Use the coordinates to create some variety in the data
  const latSeed = Math.abs(Math.sin(latitude));
  const longSeed = Math.abs(Math.cos(longitude));
  const randomSeed = (latSeed + longSeed) / 2;

  // Generate current weather
  const current = {
    temperature: Math.round(25 + (randomSeed * 10 - 5)), // 20-30°C
    humidity: Math.round(60 + (randomSeed * 30 - 15)), // 45-75%
    precipitation: Math.round(randomSeed * 10) / 10, // 0-1.0 mm
    wind_speed: Math.round(5 + (randomSeed * 10)), // 5-15 km/h
    condition: randomSeed > 0.7 ? "Partly cloudy" : "Clear sky"
  };

  // Generate 5-day forecast
  const forecast = [];
  for (let i = 1; i <= 5; i++) {
    const daySeed = (randomSeed + (i * 0.1)) % 1;
    forecast.push({
      date: new Date(Date.now() + i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      temperature_min: Math.round(20 + (daySeed * 10 - 5)),
      temperature_max: Math.round(30 + (daySeed * 10 - 5)),
      condition: daySeed > 0.7 ? "Partly cloudy" : "Clear sky",
      precipitation_chance: Math.round(daySeed * 100)
    });
  }

  return { current, forecast };
}
