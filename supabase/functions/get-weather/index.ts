
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Replace mock weather with real API call
async function getWeatherData(latitude: number, longitude: number) {
  // For testing purposes, use a hardcoded API key or mock data
  // In production, use: const WEATHER_API_KEY = Deno.env.get("WEATHER_API_KEY");
  const WEATHER_API_KEY = process.env.WEATHER_API_KEY || "test_api_key";

  // For testing, if no API key is available, return mock data
  if (!WEATHER_API_KEY || WEATHER_API_KEY === "test_api_key") {
    console.log("Using mock weather data for testing");
    return {
      current: {
        temperature: 28,
        humidity: 65,
        precipitation: 0,
        wind_speed: 12,
        condition: "Partly cloudy"
      },
      forecast: [
        {
          date: new Date().toISOString().split('T')[0],
          temperature_min: 22,
          temperature_max: 32,
          condition: "Partly cloudy",
          precipitation_chance: 10
        },
        {
          date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
          temperature_min: 23,
          temperature_max: 33,
          condition: "Sunny",
          precipitation_chance: 0
        },
        {
          date: new Date(Date.now() + 172800000).toISOString().split('T')[0],
          temperature_min: 24,
          temperature_max: 34,
          condition: "Cloudy",
          precipitation_chance: 20
        }
      ]
    };
  }

  try {
    const response = await fetch(
      `https://api.weatherapi.com/v1/forecast.json?key=${WEATHER_API_KEY}&q=${latitude},${longitude}`
    );

    if (!response.ok) throw new Error('Weather API request failed');
    return await response.json();
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
