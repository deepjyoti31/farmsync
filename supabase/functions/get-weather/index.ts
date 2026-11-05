
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { forecastUrl, parseCoordinates, toWeather, type Coordinates } from "./weather.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Get weather data from the API
async function getWeatherData(place: Coordinates) {
  // Get the API key from environment variables
  const WEATHER_API_KEY = Deno.env.get("WEATHER_API_KEY");

  // If no API key is available, throw an error
  if (!WEATHER_API_KEY) {
    console.error("No weather API key configured");
    throw new Error("Weather API key not configured");
  }

  try {
    const response = await fetch(forecastUrl(WEATHER_API_KEY, place));

    if (!response.ok) throw new Error('Weather API request failed');

    // Transform the API response to match our expected format
    return toWeather(await response.json());
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
    // Parse and validate the request body
    const place = parseCoordinates(await req.json());
    if (!place) {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid latitude or longitude parameters' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Fetch weather data from WeatherAPI.com
    const weatherData = await getWeatherData(place);

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
