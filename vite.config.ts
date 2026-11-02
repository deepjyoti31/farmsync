import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'pwa-192x192.png', 'pwa-512x512.png'],
      workbox: {
        // Mapbox GL alone is ~1.7 MB minified, so allow larger chunks to be precached.
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,json}'],
        // PDF generation needs a connection anyway; skip ~1 MB of rarely used code on install.
        globIgnores: ['**/pdf-*.js', '**/pdf-extras-*.js', '**/complianceReportPdf-*.js'],
        navigateFallback: '/index.html',
      },
      manifest: {
        name: 'FarmSync',
        short_name: 'FarmSync',
        description: 'Comprehensive Farm Management Application',
        theme_color: '#f3f4f6',
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Mapbox GL is a single large library that cannot be split further.
    chunkSizeWarningLimit: 1800,
    rollupOptions: {
      output: {
        // Group large, rarely changing libraries into their own long-cached chunks.
        manualChunks: {
          react: ["react", "react-dom", "react-router-dom"],
          supabase: ["@supabase/supabase-js"],
          query: ["@tanstack/react-query", "@tanstack/react-query-persist-client", "@tanstack/query-sync-storage-persister"],
          charts: ["recharts"],
          mapbox: ["mapbox-gl", "@mapbox/mapbox-gl-draw"],
          i18n: ["i18next", "react-i18next", "i18next-browser-languagedetector", "i18next-http-backend"],
          // PDF export only; loaded when a report is downloaded.
          pdf: ["jspdf", "jspdf-autotable"],
          "pdf-extras": ["html2canvas", "canvg", "dompurify"],
        },
      },
    },
  },
}));
