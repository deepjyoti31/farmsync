
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    // For demo purposes, we'll return mock weather data
    // In a real implementation, you would call a weather API like OpenWeatherMap or similar
    const mockData = generateMockWeatherData(latitude, longitude);

    return new Response(
      JSON.stringify(mockData),
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

// Helper function to generate mock weather data
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
    condition: getWeatherCondition(randomSeed)
  };

  // Generate 5-day forecast
  const forecast = [];
  for (let i = 1; i <= 5; i++) {
    const daySeed = (randomSeed + (i * 0.1)) % 1;
    forecast.push({
      date: new Date(Date.now() + i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      temperature_min: Math.round(20 + (daySeed * 10 - 5)),
      temperature_max: Math.round(30 + (daySeed * 10 - 5)),
      condition: getWeatherCondition(daySeed),
      precipitation_chance: Math.round(daySeed * 100)
    });
  }

  return { current, forecast };
}

// Helper function to get weather condition based on a random seed
function getWeatherCondition(seed: number) {
  const conditions = [
    'Clear sky',
    'Partly cloudy',
    'Cloudy',
    'Light rain',
    'Thunderstorm',
    'Sunny'
  ];
  return conditions[Math.floor(seed * conditions.length)];
}
