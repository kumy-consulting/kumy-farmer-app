import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { Keyboard, KeyboardResize } from '@capacitor/keyboard';
import { SplashScreen } from '@capacitor/splash-screen';

/**
 * Point d'entrée unique du natif (Capacitor).
 *
 * ⚠️ Convention Kumy : ce fichier est le SEUL autorisé à importer
 * `@capacitor/keyboard`, `@capacitor/splash-screen` et `@capacitor/app`. Aucun
 * composant ne parle directement à un plugin de coquille.
 *
 * La barre de statut ne se pilote PAS d'ici. Sa couleur est déclarée dans le
 * thème Android (`values/styles.xml`) : `BridgeActivity` réapplique ce thème à
 * la fin de l'animation de démarrage, ce qui écrase tout `setBackgroundColor`
 * venu du JS — vérifié à l'init comme après `SplashScreen.hide()`.
 *
 * Les deux fonctions sortent immédiatement hors natif. C'est ce qui permet aux
 * tests (jsdom) et au build web de les appeler sans mock ni garde d'appel.
 */

/**
 * Configure la coquille native : clavier et bouton retour Android.
 * Appelé une seule fois depuis `main.tsx`, avant le rendu React.
 *
 * Chaque réglage est isolé : un plugin indisponible (variante d'OS, WebView
 * exotique) ne doit pas empêcher les autres de s'appliquer ni bloquer le boot.
 */
export async function initNativeShell(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  // Clavier : redimensionne le WebView entier. Sûr ici car tous les écrans de
  // saisie (téléphone, PIN, code d'invitation, profil) sont hors `AppLayout`,
  // donc sans barre de navigation basse à faire flotter au-dessus du clavier.
  await Keyboard.setResizeMode({ mode: KeyboardResize.Native }).catch(() => {});

  // Bouton retour Android. `canGoBack` vient du WebView : le shell n'a donc pas
  // à connaître la table de routes. Sans écouteur, Android quitte l'app au
  // premier appui, y compris depuis un écran de détail.
  await App.addListener('backButton', ({ canGoBack }) => {
    if (canGoBack) {
      window.history.back();
    } else {
      void App.exitApp();
    }
  }).catch(() => {});
}

/**
 * Masque le splash natif. Appelé quand l'app est réellement prête à l'affichage
 * (session initialisée), pas à l'expiration d'un délai.
 *
 * `capacitor.config.ts` fixe `autoHide: false` pour cette raison : un masquage
 * automatique découvrirait le loader `#kumy-preboot` de `index.html` pendant
 * l'initialisation de la session, soit deux écrans d'attente à la suite.
 */
export async function hideNativeSplash(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  await SplashScreen.hide().catch(() => {});
}
