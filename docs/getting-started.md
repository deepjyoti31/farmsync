# Getting started

This guide takes you from a fresh clone to a running FarmSync with your own Supabase backend.
Plan for about 15 minutes.

## 1. Prerequisites

| Tool | Version | Notes |
| --- | --- | --- |
| Node.js | 18.18 or newer (20 recommended) | `nvm use` picks the version in `.nvmrc` |
| npm | Comes with Node | The repository uses `package-lock.json` |
| Supabase account | Free tier is enough | <https://supabase.com> |
| Mapbox token | Optional | Needed for farm boundary maps |
| WeatherAPI.com key | Optional | Needed for weather forecasts |

## 2. Install

```bash
git clone https://github.com/deepjyoti31/farmsync.git
cd farmsync
npm install
```

## 3. Create a Supabase project

1. Create a new project at <https://supabase.com/dashboard>.
2. Open **Project Settings > API** and copy the **Project URL** and the **anon public** key.
3. Note the **project ref**: the subdomain in your project URL (`https://<project-ref>.supabase.co`).

> Never put the `service_role` key in the frontend or in `.env`. The browser only ever needs the anon key; data access is controlled by Row Level Security.

## 4. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env`:

```bash
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-public-key>
VITE_MAPBOX_ACCESS_TOKEN=<mapbox-public-token>
```

Variables prefixed with `VITE_` are embedded into the browser bundle, so only use public keys here.
If the Supabase variables are missing, the app shows a setup screen instead of loading.

## 5. Apply the database schema

```bash
npx supabase login
npx supabase link --project-ref <project-ref>
npx supabase db push
```

This runs every file in `supabase/migrations/` in order. It creates the tables, Row Level Security policies, a trigger that sets up a profile and personal workspace for each new user, and reference data such as livestock types and expense categories.

`node supabase/apply-migrations.cjs` is a thin wrapper around `supabase db push` if you prefer.

## 6. Enable weather forecasts (optional)

The weather widget calls the `get-weather` edge function, which keeps your WeatherAPI.com key on the server.

```bash
npx supabase secrets set WEATHER_API_KEY=<your-key> --project-ref <project-ref>
npx supabase functions deploy get-weather --project-ref <project-ref>
```

## 7. Run the app

```bash
npm run dev
```

Open <http://localhost:8080>, sign up, confirm your email if your Supabase project requires it, and sign in.
A good first path through the app:

1. **Farms**: add a farm and draw its boundary on the map.
2. **Fields**: split the farm into fields.
3. **Crops**: plant a crop in a field. When you mark it **Harvested**, enter the quantity to feed the yield charts in **Analytics**.
4. **Finances**: record a few expenses and sales to see profit and loss.

## 8. Before you open a pull request

```bash
npm run check
```

This runs lint, the type check, unit tests and a production build. If you changed SQL, also run the database tests (see [database.md](database.md#testing-policies)).

## Troubleshooting

| Symptom | Cause and fix |
| --- | --- |
| "FarmSync needs configuration" screen | `.env` is missing or the dev server was started before you created it. Fill it in and restart `npm run dev`. |
| Map area is blank | `VITE_MAPBOX_ACCESS_TOKEN` is missing or invalid. |
| Weather card shows an error | The `get-weather` function is not deployed or `WEATHER_API_KEY` is not set. Check **Edge Functions > Logs** in Supabase. |
| A page shows empty lists that should have data | Check that all migrations ran: `npx supabase migration list`. Missing policies make Postgres return zero rows rather than an error. |
| `new row violates row-level security policy` | Your role in the current organization does not allow the write (viewers are read-only), or the row belongs to a farm you cannot edit. |
| Sign-up works but no workspace appears | The `on_auth_user_created` trigger is missing. Re-run `npx supabase db push`. |
