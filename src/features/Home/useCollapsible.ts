import { useCallback, useRef, useState } from 'react';

/**
 * Une liste tronquée qui s'ouvre et se referme, plus l'ancre de sa section.
 *
 * Replier retire de la hauteur AU-DESSUS du pouce : la page raccourcit, le
 * navigateur garde le même `scrollTop`, et tout le contenu remonte d'un coup —
 * souvent jusqu'à emporter hors écran le bouton qu'on vient de toucher. On
 * recadre donc sur le haut de la section, mais seulement s'il est déjà sorti par
 * le haut : quand la section tient à l'écran, il n'y a rien à corriger et un
 * défilement serait un mouvement gratuit.
 */
export function useCollapsible<T extends HTMLElement = HTMLDivElement>() {
  const sectionRef = useRef<T>(null);
  const [expanded, setExpanded] = useState(false);

  const toggle = useCallback((next: boolean) => {
    setExpanded(next);
    if (next) return;

    // Après la peinture : avant, la section a encore sa hauteur dépliée.
    requestAnimationFrame(() => {
      const element = sectionRef.current;
      // `scrollIntoView` n'existe pas partout (jsdom) — le recadrage est un
      // confort, il ne doit jamais casser le repli lui-même.
      if (!element || typeof element.scrollIntoView !== 'function') return;
      if (element.getBoundingClientRect().top >= 0) return;

      const reduceMotion =
        typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      element.scrollIntoView({ block: 'start', behavior: reduceMotion ? 'auto' : 'smooth' });
    });
  }, []);

  /** Referme sans recadrer — pour un changement de contenu, pas un geste de repli. */
  const reset = useCallback(() => setExpanded(false), []);

  return { sectionRef, expanded, toggle, reset };
}
