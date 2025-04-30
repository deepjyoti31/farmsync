
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Get weather data from the API
async function getWeatherData(latitude: number, longitude: number) {
  // Get the API key from environment variables
  const WEATHER_API_KEY = Deno.env.get("WEATHER_API_KEY");

  // If no API key is available, throw an error
  if (!WEATHER_API_KEY) {
    console.error("No weather API key configured");
    throw new Error("Weather API key not configured");
  }

  try {
    const response = await fetch(
      `https://api.weatherapi.com/v1/forecast.json?key=${WEATHER_API_KEY}&q=${latitude},${longitude}&days=5`
    );

    if (!response.ok) throw new Error('Weather API request failed');

    const data = await response.json();

    // Transform the API response to match our expected format
    return {
      current: {
        temperature: data.current.temp_c,
        humidity: data.current.humidity,
        precipitation: data.current.precip_mm,
        wind_speed: data.current.wind_kph,
        condition: data.current.condition.text
      },
      forecast: data.forecast.forecastday.map(day => ({
        date: day.date,
        temperature_min: day.day.mintemp_c,
        temperature_max: day.day.maxtemp_c,
        condition: day.day.condition.text,
        precipitation_chance: day.day.daily_chance_of_rain
      }))
    };
  } catch (error) {
    console.error("Error fetching weather data:", error);
    throw error;
  }
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
    const weatherData = await getWeatherData(latitude, longitude);

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
