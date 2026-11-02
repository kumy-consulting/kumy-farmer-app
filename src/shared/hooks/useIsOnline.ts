import { useEffect, useState } from 'react';

import { Capacitor } from '@capacitor/core';
import { Network } from '@capacitor/network';

/**
 * État de connexion, unifié web / natif.
 *
 * En natif on interroge `@capacitor/network` plutôt que `navigator.onLine` :
 * sur Android, `onLine` reste à `true` dès qu'une interface est associée, même
 * sans route vers Internet — c'est exactement le cas d'un village qui a du
 * signal mais pas de data, où l'app doit se dire hors-ligne.
 */

const isNative = Capacitor.isNativePlatform();

export function useIsOnline(): boolean {
  // En natif l'état réel n'est connu qu'après un appel asynchrone : on part
  // d'un optimisme volontaire pour ne pas afficher un bandeau hors-ligne qui
  // disparaîtrait aussitôt.
  const [isOnline, setIsOnline] = useState(() => (isNative ? true : navigator.onLine));

  useEffect(() => {
    if (!isNative) {
      const goOnline = () => setIsOnline(true);
      const goOffline = () => setIsOnline(false);
      window.addEventListener('online', goOnline);
      window.addEventListener('offline', goOffline);
      return () => {
        window.removeEventListener('online', goOnline);
        window.removeEventListener('offline', goOffline);
      };
    }

    // L'ajout d'écouteur est asynchrone : si le composant se démonte avant sa
    // résolution, on retire la poignée dès qu'elle arrive.
    let cancelled = false;
    let remove: (() => void) | undefined;

    void Network.getStatus().then(({ connected }) => {
      if (!cancelled) setIsOnline(connected);
    });

    void Network.addListener('networkStatusChange', ({ connected }) => {
      if (!cancelled) setIsOnline(connected);
    }).then((handle) => {
      if (cancelled) {
        void handle.remove();
      } else {
        remove = () => void handle.remove();
      }
    });

    return () => {
      cancelled = true;
      remove?.();
    };
  }, []);

  return isOnline;
}
