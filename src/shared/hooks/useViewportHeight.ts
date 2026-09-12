import { useEffect, useState } from 'react';

export interface ViewportState {
  /**
   * Hauteur réellement visible (hors clavier virtuel), en px.
   * 0 tant que ce n'est pas encore mesuré (premier rendu / SSR) → on retombe
   * alors sur `100dvh` côté CSS.
   */
  height: number;
  /** Hauteur estimée du clavier virtuel (px), 0 s'il est fermé. */
  keyboardHeight: number;
  /** Vrai si le clavier virtuel est ouvert. */
  isOpen: boolean;
}

// Seuil au-delà duquel on considère le clavier ouvert (évite les faux positifs
// dus aux barres système qui apparaissent/disparaissent de quelques px).
const KEYBOARD_THRESHOLD = 80;

/**
 * Suit la hauteur visible réelle via `visualViewport`.
 *
 * Sur Android (WebView Capacitor), à l'ouverture du clavier, le viewport de
 * *mise en page* (`window.innerHeight`, donc `100dvh`) reste plein écran : seul
 * le viewport *visuel* rétrécit. Une page en `minHeight: 100dvh` garde alors sa
 * hauteur pleine et laisse le contenu (et le CTA) passer sous le clavier.
 *
 * En liant la hauteur du conteneur à `visualViewport.height`, le contenu se
 * recale dans la bande réellement visible, juste au-dessus du clavier.
 *
 * Porté depuis `agripilot-pwa/src/shared/hooks/useViewportHeight.ts` — à garder
 * synchronisé avec la PWA.
 */
export function useViewportHeight(): ViewportState {
  const [state, setState] = useState<ViewportState>({
    height: 0,
    keyboardHeight: 0,
    isOpen: false,
  });

  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;

    const update = () => {
      const keyboardHeight = Math.max(0, window.innerHeight - viewport.height);
      const isOpen = keyboardHeight > KEYBOARD_THRESHOLD;
      setState({
        height: viewport.height,
        keyboardHeight: isOpen ? keyboardHeight : 0,
        isOpen,
      });
    };

    update();
    viewport.addEventListener('resize', update);
    viewport.addEventListener('scroll', update);
    return () => {
      viewport.removeEventListener('resize', update);
      viewport.removeEventListener('scroll', update);
    };
  }, []);

  return state;
}
