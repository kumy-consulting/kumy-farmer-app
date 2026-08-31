import { useEffect, useRef, useState } from 'react';

interface UseInViewportResult<T extends Element> {
  ref: (node: T | null) => void;
  inView: boolean;
}

/**
 * Détecte l'entrée d'un élément dans le viewport (une seule fois, puis se
 * déconnecte). Sert au montage paresseux des cartes Leaflet dans une liste :
 * la carte ne s'initialise qu'une fois son conteneur mis en page → les tuiles
 * se chargent correctement (évite les cartes vides sans `invalidateSize`).
 *
 * `rootMargin` pré-charge légèrement avant que l'élément soit visible.
 * Repli SSR / environnements sans IntersectionObserver (jsdom) : `inView=true`.
 */
export function useInViewport<T extends Element>(rootMargin = '200px'): UseInViewportResult<T> {
  const hasIO = typeof IntersectionObserver !== 'undefined';
  const [inView, setInView] = useState(!hasIO);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    return () => observerRef.current?.disconnect();
  }, []);

  const ref = (node: T | null): void => {
    observerRef.current?.disconnect();
    if (!node || !hasIO || inView) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setInView(true);
          observerRef.current?.disconnect();
        }
      },
      { rootMargin },
    );
    observerRef.current.observe(node);
  };

  return { ref, inView };
}
