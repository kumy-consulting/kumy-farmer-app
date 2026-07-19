import type { CapacitorConfig } from '@capacitor/cli';

/**
 * Configuration Capacitor — coquille native qui embarque le bundle Vite (`dist/`).
 *
 * - `webDir: "dist"` : on réutilise tel quel le build `npm run build`.
 * - `androidScheme: "https"` : sert l'app depuis `https://localhost` → contexte
 *   sécurisé requis par `navigator.geolocation`, les service workers et les
 *   cookies d'auth `Secure; SameSite=None`.
 * - Pas de `server.url` en production : le bundle local DOIT être chargé pour que
 *   l'app fonctionne hors-ligne (cœur de l'usage terrain en Guinée).
 *
 * Dossiers natifs `android/` et `ios/` NON générés à ce stade : lancer
 * `npm run cap:add:android` / `npm run cap:add:ios` puis `npm run cap:sync`.
 */
const config: CapacitorConfig = {
  appId: 'com.kumy.farmer',
  appName: 'Kumy',
  webDir: 'dist',
  android: {
    allowMixedContent: false,
  },
  server: {
    androidScheme: 'https',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 600,
      backgroundColor: '#F7F4E9',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#018675',
    },
  },
};

export default config;
