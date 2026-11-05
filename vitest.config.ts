import { defineConfig } from "vitest/config";
import path from "path";

// Kept separate from vite.config.ts so tests do not load the PWA and dev-only plugins.
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx", "supabase/functions/**/*.test.ts"],
    coverage: {
      provider: "v8",
      include: ["src/lib/**", "src/utils/**", "src/hooks/**", "src/components/tasks/taskApi.ts", "supabase/functions/**/*.ts"],
      // Entry points that only wire Deno.serve to the tested helpers.
      exclude: ["**/*.test.*", "supabase/functions/*/index.ts"],
    },
  },
});
