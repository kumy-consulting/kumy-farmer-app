import { StrictMode } from 'react';

import { createRoot } from 'react-dom/client';

import { Capacitor } from '@capacitor/core';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import dayjs from 'dayjs';
import 'dayjs/locale/fr';

import App from './App.tsx';

import './index.css';
import { initDatabase } from '@/shared/db/database';
import { requestPersistentStorage } from '@/shared/services/persistence';
import { theme } from '@/theme/theme';

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

// Locale française globale (utilisée par les date pickers MUI).
dayjs.locale('fr');

// Initialise la base offline (best-effort — ne bloque pas le rendu).
initDatabase().catch(console.error);

// Rend IndexedDB persistant : protège les files d'écriture offline de l'éviction OS.
void requestPersistentStorage();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </StrictMode>,
);
