import { useEffect, useState } from 'react';

import { compteApi } from '@/features/Home/compte.api';
import { isDemoMode } from '@/features/Home/home.demo';
import { useAuthStore } from '@/shared/stores/authStore';

export interface CompteNouveauState {
  /** Aucun domaine et aucun technicien : le compte n'a pas encore été adopté. */
  estNouveau: boolean;
  isLoading: boolean;
}

/**
 * La source unique de « ce compte a-t-il été adopté ».
 *
 * La mise en page et la route la lisent toutes deux ici plutôt que d'interroger
 * l'API chacune de leur côté — deux lectures indépendantes finiraient par
 * diverger sur un rechargement.
 *
 * En cas d'échec réseau, le hook ouvre l'application complète : enfermer un
 * agriculteur établi derrière un écran de bienvenue serait bien pire que de
 * montrer un tableau de bord vide à un inscrit de la veille.
 */
export function useCompteNouveau(): CompteNouveauState {
  const uid = useAuthStore((s) => s.user?.uid);
  const [state, setState] = useState<CompteNouveauState>({
    estNouveau: false,
    isLoading: true,
  });

  useEffect(() => {
    // Aperçu de démonstration : il montre l'app garnie, pas l'écran d'accueil
    // d'un compte neuf.
    if (isDemoMode() || !uid) {
      setState({ estNouveau: false, isLoading: false });
      return;
    }

    let actif = true;
    setState((precedent) => ({ ...precedent, isLoading: true }));

    compteApi
      .etatDuCompte(uid)
      .then((etat) => {
        if (!actif) return;
        setState({
          estNouveau: !etat.hasFarms && !etat.hasEngineer,
          isLoading: false,
        });
      })
      .catch(() => {
        if (!actif) return;
        setState({ estNouveau: false, isLoading: false });
      });

    return () => {
      actif = false;
    };
  }, [uid]);

  return state;
}
