import { useEffect, useState } from 'react';

interface ResendCountdown {
  /** Secondes restantes avant qu'un nouvel envoi soit possible. `0` = renvoi ouvert. */
  secondesRestantes: number;
  /** Repart pour `secondes` — appelé après un envoi réussi. */
  relancer: (secondes: number) => void;
}

/**
 * Le délai entre deux demandes de code, tenu côté écran.
 *
 * L'API applique le même plafond, mais un bouton qui reste actif et échoue en
 * silence ne dit rien à l'agriculteur : le compte à rebours, lui, montre
 * l'attente. Un `setTimeout` par seconde plutôt qu'un `setInterval` — le
 * nettoyage à chaque pas rend le hook insensible aux remontages.
 */
export function useResendCountdown(secondesInitiales: number): ResendCountdown {
  const [secondesRestantes, setSecondesRestantes] = useState(secondesInitiales);

  useEffect(() => {
    if (secondesRestantes <= 0) return;
    const id = setTimeout(() => {
      setSecondesRestantes((restantes) => Math.max(0, restantes - 1));
    }, 1000);
    return () => clearTimeout(id);
  }, [secondesRestantes]);

  return { secondesRestantes, relancer: setSecondesRestantes };
}
