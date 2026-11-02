# Deployment

A FarmSync deployment has three parts:

1. **The web app**: static files from `npm run build`, served by any static host.
2. **The database**: a Supabase project with all migrations applied.
3. **Edge functions**: `get-weather` and `ingest-telemetry`, deployed to the same Supabase project.

## 1. Database

```bash
npx supabase link --project-ref <project-ref>
npx supabase db push
```

In the Supabase dashboard:

- **Authentication > URL Configuration**: set the Site URL to your production domain and add it to the redirect allow list, so confirmation emails link to the right place.
- **Authentication > Providers > Email**: decide whether email confirmation is required.

## 2. Edge functions

```bash
npx supabase secrets set WEATHER_API_KEY=<weatherapi-key> --project-ref <project-ref>
npx supabase functions deploy get-weather --project-ref <project-ref>
npx supabase functions deploy ingest-telemetry --project-ref <project-ref>
```

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are provided to functions automatically; do not set them yourself.

## 3. Web app

Build with production environment variables:

```bash
VITE_SUPABASE_URL=https://<project-ref>.supabase.co \
VITE_SUPABASE_ANON_KEY=<anon-public-key> \
VITE_MAPBOX_ACCESS_TOKEN=<mapbox-public-token> \
npm run build
```

Upload `dist/` to your host. Because FarmSync is a single-page app, the host must serve `index.html` for unknown paths so deep links such as `/dashboard/crops` work.

### Vercel

- Framework preset: **Vite**. Build command `npm run build`, output directory `dist`.
- Add the three `VITE_` variables under **Settings > Environment Variables**.
- Add a `vercel.json` with an SPA rewrite:

  ```json
  { "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
  ```

### Netlify

- Build command `npm run build`, publish directory `dist`.
- Add the `VITE_` variables under **Site configuration > Environment variables**.
- Add `public/_redirects` containing:

  ```text
  /*    /index.html   200
  ```

### Cloudflare Pages

- Build command `npm run build`, output directory `dist`, and the `VITE_` variables as build environment variables.
- Cloudflare Pages serves `index.html` for unmatched routes in SPA projects by default.

## Production checklist

- [ ] All migrations applied (`npx supabase migration list` shows no pending files)
- [ ] `scripts/test-db.sh` passes on the release commit (CI does this)
- [ ] Only public keys in `VITE_` variables; the service role key is never in the frontend
- [ ] Mapbox token restricted to your production domain in the Mapbox dashboard
- [ ] Supabase Auth Site URL and redirect URLs point at the production domain
- [ ] `WEATHER_API_KEY` set as a function secret and both edge functions deployed
- [ ] HTTPS enabled (required for the PWA service worker)
- [ ] Database backups enabled for your Supabase plan

## Updating

1. Merge to `main` once CI is green.
2. Apply new migrations with `npx supabase db push` **before** deploying the web app, so the new frontend never queries columns that do not exist yet.
3. Redeploy edge functions if anything under `supabase/functions/` changed.
4. Deploy the web app. The service worker updates installed PWAs automatically on their next visit.
