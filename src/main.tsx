import { StrictMode } from 'react';

import { createRoot } from 'react-dom/client';

import { Capacitor } from '@capacitor/core';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import dayjs from 'dayjs';
import 'dayjs/locale/fr';

// Police embarquée dans le bundle : en natif, un premier lancement sans réseau
// ne doit pas retomber sur la police système. Les graisses correspondent à
// celles que déclarait le <link> Google Fonts retiré d'index.html.
//
// Sous-ensemble `latin` uniquement : sur web les autres jeux ne seraient pas
// téléchargés (unicode-range), mais en natif TOUT est embarqué dans l'APK —
// cyrillique et grec compris. L'app est monolingue française.
import '@fontsource/ubuntu/latin-300.css';
// La seule italique de l'app : l'accroche de l'écran d'attente.
import '@fontsource/ubuntu/latin-300-italic.css';
import '@fontsource/ubuntu/latin-400.css';
import '@fontsource/ubuntu/latin-500.css';
import '@fontsource/ubuntu/latin-700.css';

import './index.css';
import { initDatabase } from '@/shared/db/database';
import { hideNativeSplash, initNativeShell } from '@/shared/services/nativeShell';
import { requestPersistentStorage } from '@/shared/services/persistence';
import { theme } from '@/theme/theme';

import App from './App.tsx';

// En natif (Capacitor), aucun service worker : l'app sert ses assets localement.
// On désenregistre tout SW résiduel (et ses caches) pour éviter qu'un ancien
// bundle Workbox ne soit servi.
if (Capacitor.isNativePlatform() && 'serviceWorker' in navigator) {
  void navigator.serviceWorker.getRegistrations().then((regs) => {
    regs.forEach((r) => void r.unregister());
  });
  if ('caches' in window) {
    void caches.keys().then((keys) => keys.forEach((k) => void caches.delete(k)));
  }
}

// Configure la coquille native (barre de statut, clavier, bouton retour).
// No-op sur web — voir le contrat dans `nativeShell.ts`.
void initNativeShell();

// Locale française globale (utilisée par les date pickers MUI).
dayjs.locale('fr');

// Initialise la base offline (best-effort — ne bloque pas le rendu).
initDatabase().catch(console.error);

// Rend IndexedDB persistant : protège les files d'écriture offline de l'éviction OS.
void requestPersistentStorage();

// Le splash natif ne couvre plus que le démarrage du WebView : dès que la page
// a peint, l'écran d'attente d'`index.html` prend le relais et reste jusqu'à ce
// que la session soit prête. Double rAF = première image effectivement rendue.
requestAnimationFrame(() => requestAnimationFrame(() => void hideNativeSplash()));

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </StrictMode>,
);
