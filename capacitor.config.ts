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
 * `android/` est généré ET versionné (on y personnalise manifeste, icônes,
 * gradle). Après toute modification du web : `npm run cap:sync`.
 *
 * `ios/` n'est pas généré : hors périmètre tant qu'aucune machine du projet ne
 * dispose de Xcode. Voir la spec `2026-08-22-capacitor-android-natif-design.md`.
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
      // Masquage explicite depuis App.tsx quand la session est initialisée
      // (voir `hideNativeSplash`), pas à l'expiration d'un délai.
      launchAutoHide: false,
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
