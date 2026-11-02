import React from 'react';

/**
 * Shown instead of the app when Supabase credentials are missing, so a fresh
 * clone explains what to do rather than rendering a blank page.
 */
const SetupRequired = () => (
  <main className="min-h-screen flex items-center justify-center bg-muted/30 p-6">
    <div className="max-w-xl w-full rounded-lg border bg-background p-8 shadow-sm space-y-4">
      <h1 className="text-2xl font-bold">FarmSync needs configuration</h1>
      <p className="text-muted-foreground">
        The Supabase connection settings are missing. Create a <code className="font-mono">.env</code> file
        in the project root with your project URL and anon key, then restart the dev server.
      </p>
      <pre className="rounded-md bg-muted p-4 text-sm overflow-x-auto">
{`cp .env.example .env

VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>
VITE_MAPBOX_ACCESS_TOKEN=<mapbox-token>`}
      </pre>
      <p className="text-sm text-muted-foreground">
        See <code className="font-mono">docs/getting-started.md</code> for the full setup guide.
      </p>
    </div>
  </main>
);

export default SetupRequired;
