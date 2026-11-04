import { useCallback, useEffect, useRef, useState } from 'react';

import { rattachementApi, type EtatRattachement } from '@/features/Rattachement/rattachement.api';
import { useResendCountdown } from '@/features/Register/useResendCountdown';
import { ApiRequestError } from '@/shared/api/client';
import { useAuthStore } from '@/shared/stores/authStore';

/** Relecture de l'état tant qu'un code est affiché : l'encadreur peut confirmer à tout moment. */
const RELECTURE_MS = 10_000;

interface RattachementState {
  etat: EtatRattachement | null;
  /** Le code en clair, en mémoire seulement : jamais dans un stockage, jamais journalisé. */
  code: string | null;
  secondesRestantes: number;
  isLoading: boolean;
  isRequesting: boolean;
  error: string | null;
  afficherCode: () => Promise<void>;
}

/**
 * Suit la demande de rattachement de l'agriculteur et porte son code.
 *
 * Le code vit dans l'état React et nulle part ailleurs : il est effacé à
 * l'expiration, au démontage et dès que la demande est confirmée. La relecture
 * périodique ne tourne que pendant qu'un code est montré.
 */
export function useRattachement(): RattachementState {
  const [etat, setEtat] = useState<EtatRattachement | null>(null);
  const [code, setCode] = useState<{ valeur: string; expireA: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRequesting, setIsRequesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { secondesRestantes, relancer } = useResendCountdown(0);
  const actif = useRef(true);

  useEffect(() => {
    actif.current = true;
    return () => {
      actif.current = false;
    };
  }, []);

  const lireEtat = useCallback(async () => {
    try {
      const suivant = await rattachementApi.etat();
      if (actif.current) setEtat(suivant);
    } catch {
      // Une relecture manquée n'efface rien : la suivante rattrapera.
    }
  }, []);

  useEffect(() => {
    void lireEtat().finally(() => {
      if (actif.current) setIsLoading(false);
    });
  }, [lireEtat]);

  // Relecture toutes les 10 s, seulement tant qu'un code est affiché.
  const affiche = code !== null;
  useEffect(() => {
    if (!affiche) return;
    const id = setInterval(() => void lireEtat(), RELECTURE_MS);
    return () => clearInterval(id);
  }, [affiche, lireEtat]);

  // Expiration : le code est effacé, la relecture s'arrête avec lui.
  const expireA = code?.expireA ?? null;
  useEffect(() => {
    if (expireA === null) return;
    const id = setTimeout(() => setCode(null), Math.max(0, expireA - Date.now()));
    return () => clearTimeout(id);
  }, [expireA]);

  // Confirmée : le palier d'accès a changé côté serveur, on relit le profil.
  const statut = etat?.statut;
  useEffect(() => {
    if (statut !== 'confirmee') return;
    setCode(null);
    void useAuthStore.getState().loadUser();
  }, [statut]);

  const afficherCode = useCallback(async () => {
    setIsRequesting(true);
    setError(null);
    try {
      const reponse = await rattachementApi.demanderCode();
      if (!actif.current) return;
      const echeance = new Date(reponse.expireA).getTime();
      setCode({ valeur: reponse.code, expireA: echeance });
      relancer(Math.max(0, Math.ceil((echeance - Date.now()) / 1000)));
    } catch (e) {
      if (!actif.current) return;
      const codeErreur = e instanceof ApiRequestError ? e.code : undefined;
      if (codeErreur === 'ATTACH_REQUEST_BLOCKED') {
        setEtat({ statut: 'bloquee', codeExpireA: null });
      } else if (codeErreur === 'NO_ATTACH_REQUEST') {
        setEtat({ statut: 'aucune', codeExpireA: null });
      } else if (codeErreur === 'ATTACH_REQUEST_CLOSED') {
        await lireEtat();
      } else {
        setError('Impossible d’afficher le code pour le moment. Réessayez.');
      }
    } finally {
      if (actif.current) setIsRequesting(false);
    }
  }, [lireEtat, relancer]);

  return {
    etat,
    code: code?.valeur ?? null,
    secondesRestantes,
    isLoading,
    isRequesting,
    error,
    afficherCode,
  };
}
