# Supabase backend

This directory holds everything FarmSync needs on the Supabase side.

| Path | Contents |
| --- | --- |
| `migrations/` | SQL migrations, applied in filename order. Never edit one that has been merged; add a new file |
| `functions/get-weather/` | Edge function that proxies WeatherAPI.com so the API key stays on the server |
| `functions/ingest-telemetry/` | Edge function that accepts readings from IoT devices |
| `tests/` | Row Level Security tests and the Supabase stand-ins they run on |
| `config.toml` | Supabase CLI configuration for local development |
| `apply-migrations.cjs` | Convenience wrapper around `supabase db push` |
| `setup-env-vars.cjs` | Interactive helper that sets `WEATHER_API_KEY` as a function secret |

## Common commands

```bash
# Link the CLI to your project (once)
npx supabase link --project-ref <project-ref>

# Apply pending migrations
npx supabase db push

# Create a new migration
npx supabase migration new <short_description>

# Set the weather API key and deploy functions
npx supabase secrets set WEATHER_API_KEY=<key> --project-ref <project-ref>
npx supabase functions deploy get-weather --project-ref <project-ref>
npx supabase functions deploy ingest-telemetry --project-ref <project-ref>

# Run the RLS tests against a disposable Postgres
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/postgres ../scripts/test-db.sh
```

## Further reading

- [Database and security](../docs/database.md): schema, access model and migration rules
- [IoT integration](../docs/iot-integration.md): calling `ingest-telemetry` from devices
- [Deployment](../docs/deployment.md): production setup
