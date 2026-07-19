import { readFileSync } from 'node:fs';
import path from 'node:path';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf-8')) as { version: string };

// Cache 30 jours des tuiles carto satellite (usage terrain hors-ligne).
const THIRTY_DAYS = 30 * 24 * 60 * 60;

export default defineConfig({
  // Exposé à l'app via les globals déclarés dans src/vite-env.d.ts.
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    __BUILD_SHA__: JSON.stringify((process.env.GITHUB_SHA ?? 'dev').slice(0, 7)),
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'https://agripilot-backoffice-api-dev-rlsznfc4qq-ew.a.run.app',
        changeOrigin: true,
        secure: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-mui': ['@mui/material', '@mui/icons-material'],
          'vendor-firebase': ['firebase/app', 'firebase/firestore', 'firebase/auth'],
          'vendor-map': ['leaflet', 'react-leaflet'],
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      // L'enregistrement du SW est piloté côté web uniquement ; en natif
      // (Capacitor) l'app sert ses assets localement — pas de SW Workbox.
      injectRegister: null,
      devOptions: {
        enabled: true,
        type: 'module',
      },
      manifest: {
        name: 'Kumy — Mon exploitation',
        short_name: 'Kumy',
        description: "L'application des agriculteurs Kumy : mes cultures, mes alertes, ma météo.",
        theme_color: '#018675',
        background_color: '#F7F4E9',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        categories: ['productivity', 'utilities'],
        icons: [
          { src: '/logo-kumy.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
          { src: '/logo-kumy.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' },
        ],
      },
      workbox: {
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/mt[0-3]\.google\.com\/vt\/lyrs=s&.*/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'map-tiles-google',
              expiration: { maxEntries: 4000, maxAgeSeconds: THIRTY_DAYS },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/server\.arcgisonline\.com\/ArcGIS\/rest\/services\/World_Imagery\/MapServer\/tile\/.*/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'map-tiles-satellite',
              expiration: { maxEntries: 2000, maxAgeSeconds: THIRTY_DAYS },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
});
