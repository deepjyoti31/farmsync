// Script to set up environment variables for Supabase functions
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Get the Supabase project ID from config.toml
const configPath = path.join(__dirname, 'config.toml');
const configContent = fs.readFileSync(configPath, 'utf8');
const projectIdMatch = configContent.match(/project_id\s*=\s*"([^"]+)"/);
const projectId = projectIdMatch ? projectIdMatch[1] : null;

if (!projectId) {
  console.error('Could not find project_id in config.toml');
  process.exit(1);
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('Enter your WeatherAPI.com API key: ', (apiKey) => {
  if (!apiKey) {
    console.error('API key is required');
    rl.close();
    process.exit(1);
  }

  try {
    // Set the environment variable for the get-weather function
    console.log('Setting WEATHER_API_KEY environment variable...');
    execSync(`npx supabase secrets set WEATHER_API_KEY="${apiKey}" --project-ref ${projectId}`, { stdio: 'inherit' });
    console.log('Environment variable set successfully!');
  } catch (error) {
    console.error('Error setting environment variable:', error.message);
  }

  rl.close();
});
