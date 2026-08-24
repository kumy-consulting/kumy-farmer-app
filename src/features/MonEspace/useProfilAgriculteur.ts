import { useCallback, useEffect, useState } from 'react';

import { useAuthStore } from '@/shared/stores/authStore';

import { monEspaceApi } from './monEspace.api';
import { profilDeSecours, versProfil } from './monEspace.mapper';
import type { ProfilAgriculteur } from './monEspace.types';

export interface ProfilAgriculteurState {
  profil: ProfilAgriculteur | null;
  isLoading: boolean;
  /**
   * État des alertes SMS — `null` tant qu'on ne l'a pas obtenu du serveur. La
   * bascule reste alors inerte : un interrupteur qu'on peut actionner sans
   * connaître son état ment sur ce qu'il fait.
   */
  alertesSms: boolean | null;
  /** Confirme localement une bascule que le serveur a acceptée. */
  poserAlertesSms: (sms: boolean) => void;
}

/**
 * La source unique du « qui suis-je » de l'onglet Mon espace.
 *
 * Un seul appel — `GET /farmers/me`, résolu depuis l'uid du jeton — sert la
 * carte d'en-tête, la fiche personnelle et la bascule des alertes.
 *
 * **En cas d'échec, l'écran ne se vide pas : il rétrécit.** Panne réseau, hors
 * réseau au champ, ou compte pas encore rattaché à une fiche agriculteur (404,
 * qui est un état légitime et non une erreur) — dans les trois cas on retombe
 * sur ce que la session sait déjà, le nom et le numéro de la personne
 * connectée. Le code agriculteur et la coopérative disparaissent au lieu de
 * s'afficher en gabarit. Ce que l'agriculteur ne doit jamais voir sur son
 * propre téléphone, c'est le nom de quelqu'un d'autre.
 */
export function useProfilAgriculteur(): ProfilAgriculteurState {
  const user = useAuthStore((s) => s.user);
  const uid = user?.uid;

  const [profil, setProfil] = useState<ProfilAgriculteur | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [alertesSms, setAlertesSms] = useState<boolean | null>(null);

  useEffect(() => {
    if (!uid) {
      setProfil(null);
      setAlertesSms(null);
      setIsLoading(false);
      return;
    }

    let actif = true;
    setIsLoading(true);

    monEspaceApi
      .profil()
      .then((dto) => {
        if (!actif) return;
        setProfil(versProfil(dto, useAuthStore.getState().user?.accessTier));
        setAlertesSms(dto.notificationSettings.sms);
        setIsLoading(false);
      })
      .catch(() => {
        if (!actif) return;
        setProfil(profilDeSecours(useAuthStore.getState().user));
        setAlertesSms(null);
        setIsLoading(false);
      });

    return () => {
      actif = false;
    };
  }, [uid]);

  const poserAlertesSms = useCallback((sms: boolean) => setAlertesSms(sms), []);

  return { profil, isLoading, alertesSms, poserAlertesSms };
}
