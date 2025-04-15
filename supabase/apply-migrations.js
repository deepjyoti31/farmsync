// Script to apply migrations to Supabase
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Get the Supabase project ID from config.toml
const configPath = path.join(__dirname, 'config.toml');
const configContent = fs.readFileSync(configPath, 'utf8');
const projectIdMatch = configContent.match(/project_id\s*=\s*"([^"]+)"/);
const projectId = projectIdMatch ? projectIdMatch[1] : null;

if (!projectId) {
  console.error('Could not find project_id in config.toml');
  process.exit(1);
}

console.log(`Applying migrations to Supabase project: ${projectId}`);

try {
  // Apply migrations using Supabase CLI
  execSync('npx supabase db push', { stdio: 'inherit' });
  console.log('Migrations applied successfully!');
} catch (error) {
  console.error('Error applying migrations:', error.message);
  process.exit(1);
}
