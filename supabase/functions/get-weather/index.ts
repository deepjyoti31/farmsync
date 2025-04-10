
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    const { latitude, longitude, farmId } = await req.json();
    
    if (!latitude || !longitude || !farmId) {
      return new Response(
        JSON.stringify({ error: 'Latitude, longitude, and farmId are required' }),
        { 
          status: 400, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders } 
        }
      );
    }

    // In a real implementation, you would use an API key from environment variables
    // and call an actual weather API like OpenWeatherMap
    const mockWeatherData = {
      current: {
        temperature: Math.round(20 + Math.random() * 15),
        humidity: Math.round(60 + Math.random() * 30),
        precipitation: Math.round(Math.random() * 100) / 10,
        wind_speed: Math.round(Math.random() * 50) / 10,
        condition: ['Sunny', 'Partly Cloudy', 'Cloudy', 'Rainy', 'Thunderstorm'][Math.floor(Math.random() * 5)],
      },
      forecast: Array(7).fill(0).map((_, i) => ({
        date: new Date(Date.now() + i * 86400000).toISOString().split('T')[0],
        temperature_min: Math.round(15 + Math.random() * 10),
        temperature_max: Math.round(25 + Math.random() * 10),
        condition: ['Sunny', 'Partly Cloudy', 'Cloudy', 'Rainy', 'Thunderstorm'][Math.floor(Math.random() * 5)],
        precipitation_chance: Math.round(Math.random() * 100),
      })),
    };

    // Create a Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Store the weather data in the database
    const { error } = await supabase
      .from('weather_data')
      .insert({
        farm_id: farmId,
        date: new Date().toISOString().split('T')[0],
        temperature_min: mockWeatherData.current.temperature - 5,
        temperature_max: mockWeatherData.current.temperature + 5,
        humidity: mockWeatherData.current.humidity,
        precipitation: mockWeatherData.current.precipitation,
        wind_speed: mockWeatherData.current.wind_speed,
        weather_condition: mockWeatherData.current.condition,
        forecast_data: mockWeatherData.forecast,
      });

    if (error) {
      console.error('Error storing weather data:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to store weather data' }),
        { 
          status: 500, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders } 
        }
      );
    }

    // Return the weather data
    return new Response(
      JSON.stringify(mockWeatherData),
      { 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      }
    );
  } catch (error) {
    console.error('Error in weather function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      }
    );
  }
});
