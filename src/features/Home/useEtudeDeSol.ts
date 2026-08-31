import { useCallback, useEffect, useState } from 'react';

import { ApiRequestError } from '@/shared/api/client';

import { compteApi } from './compte.api';

export interface EtudeDeSolState {
  /** Date ISO de la demande transmise, `null` tant qu'aucune n'est partie. */
  requestedAt: string | null;
  isLoading: boolean;
  isSending: boolean;
  error: string | null;
  demander: () => Promise<void>;
}

/**
 * La demande d'étude de sol de l'écran d'attente.
 *
 * Deux échecs sont volontairement muets. Une relecture qui rate ne doit pas
 * retirer le bouton : mieux vaut offrir une demande de trop qu'aucune. Et un
 * 409 n'est pas une erreur — le serveur dit qu'une demande est déjà partie
 * dans les 24 heures, ce que l'écran doit annoncer comme un succès.
 */
export function useEtudeDeSol(): EtudeDeSolState {
  const [requestedAt, setRequestedAt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let actif = true;

    compteApi
      .etudeDeSol()
      .then((etat) => {
        if (actif) setRequestedAt(etat.requestedAt);
      })
      .catch(() => undefined)
      .finally(() => {
        if (actif) setIsLoading(false);
      });

    return () => {
      actif = false;
    };
  }, []);

  const demander = useCallback(async () => {
    setIsSending(true);
    setError(null);
    try {
      const etat = await compteApi.demanderEtudeDeSol();
      setRequestedAt(etat.requestedAt);
    } catch (err) {
      if (err instanceof ApiRequestError && err.status === 409) {
        // Une demande de moins de 24 h existe déjà : le serveur en donne la
        // date quand il la connaît, sinon « maintenant » reste vrai à l'heure
        // près et vaut mieux que de renvoyer l'agriculteur au bouton.
        const dejaEnvoyee = (err as ApiRequestError & { requestedAt?: string }).requestedAt;
        setRequestedAt(dejaEnvoyee ?? new Date().toISOString());
      } else {
        setError("Envoi impossible pour l'instant. Réessayez dans un moment.");
      }
    } finally {
      setIsSending(false);
    }
  }, []);

  return { requestedAt, isLoading, isSending, error, demander };
}
