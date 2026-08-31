import { useCallback, useEffect, useState } from 'react';

interface ResendCountdown {
  /** Secondes restantes avant qu'un nouvel envoi soit possible. `0` = renvoi ouvert. */
  secondesRestantes: number;
  /** Repart pour `secondes` — appelé après un envoi réussi. */
  relancer: (secondes: number) => void;
}

/**
 * Le délai entre deux demandes de code, tenu côté écran.
 *
 * Basé sur une échéance (`Date.now()`) plutôt qu'un compteur décrémenté.
 * Sur Android native (Capacitor), le WebView throttle les timers en arrière-plan ;
 * avec un compteur, un agriculteur qui backgrounde l'app 30 secondes revient voir
 * le délai gelé — le bouton reste verrouillé bien après que le serveur l'ait déverrouillé.
 * Une échéance se recalcule en permanence, se resynchronise seule au resume, et reste
 * insensible aux remontages (l'échéance est elle-même l'état).
 *
 * Scrutation toutes les 250 ms : assez rapide pour que la seconde affichée soit précise
 * après un resume, assez lent pour ne pas être coûteux.
 */
export function useResendCountdown(secondesInitiales: number): ResendCountdown {
  const [echeance, setEcheance] = useState(() => Date.now() + secondesInitiales * 1000);
  const [secondesRestantes, setSecondesRestantes] = useState(secondesInitiales);

  useEffect(() => {
    const restant = () => Math.max(0, Math.ceil((echeance - Date.now()) / 1000));
    setSecondesRestantes(restant());
    if (restant() <= 0) return;
    const id = setInterval(() => {
      const valeur = restant();
      setSecondesRestantes(valeur);
      if (valeur <= 0) clearInterval(id);
    }, 250);
    return () => clearInterval(id);
  }, [echeance]);

  const relancer = useCallback((secondes: number) => {
    setEcheance(Date.now() + secondes * 1000);
  }, []);

  return { secondesRestantes, relancer };
}
