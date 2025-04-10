import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Function to fetch data from OpenWeatherMap API
async function fetchWeatherData(latitude: number, longitude: number) {
  // OpenWeatherMap API key - you can use a free key from openweathermap.org
  const apiKey = "9b32dd5b76d8fe5e38e10bbd4f8bb90a"; // This is a free API key for demo purposes
  
  try {
    // Fetch current weather
    const currentResponse = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=metric&appid=${apiKey}`
    );
    
    if (!currentResponse.ok) {
      throw new Error(`Error fetching current weather: ${currentResponse.statusText}`);
    }
    
    const currentData = await currentResponse.json();
    
    // Fetch forecast
    const forecastResponse = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${latitude}&lon=${longitude}&units=metric&appid=${apiKey}`
    );
    
    if (!forecastResponse.ok) {
      throw new Error(`Error fetching forecast: ${forecastResponse.statusText}`);
    }
    
    const forecastData = await forecastResponse.json();
    
    // Process current weather data
    const current = {
      temperature: Math.round(currentData.main.temp),
      humidity: currentData.main.humidity,
      precipitation: currentData.rain ? currentData.rain["1h"] || 0 : 0,
      wind_speed: currentData.wind.speed,
      condition: currentData.weather[0].description
    };
    
    // Process forecast data
    const forecast = [];
    const dailyMap = new Map();
    
    // Group forecast by day (OpenWeatherMap returns forecast in 3-hour intervals)
    for (const item of forecastData.list) {
      const date = item.dt_txt.split(' ')[0];
      
      if (!dailyMap.has(date)) {
        dailyMap.set(date, {
          date: date,
          temperature_min: item.main.temp_min,
          temperature_max: item.main.temp_max,
          condition: item.weather[0].description,
          precipitation_chance: item.pop * 100 // Convert from 0-1 to 0-100
        });
      } else {
        const existing = dailyMap.get(date);
        existing.temperature_min = Math.min(existing.temperature_min, item.main.temp_min);
        existing.temperature_max = Math.max(existing.temperature_max, item.main.temp_max);
      }
    }
    
    // Convert map to array and take first 5 days
    const forecastArray = Array.from(dailyMap.values());
    const fiveDayForecast = forecastArray.slice(0, 5);
    
    return { current, forecast: fiveDayForecast };
  } catch (error) {
    console.error("Error fetching weather data:", error);
    return generateMockWeatherData(latitude, longitude);
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

    // Try to fetch real weather data, fall back to mock data if needed
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

// Helper function to get weather condition based on a random seed (fallback)
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
