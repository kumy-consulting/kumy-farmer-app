import { useEffect, useState } from 'react';

import { buildMockDashboard } from './dashboard.mock';
import type { FarmerDashboard } from './dashboard.types';

/** Court délai simulant un chargement réseau (pour montrer les squelettes). */
const LOAD_DELAY_MS = 450;

interface DashboardState {
  data: FarmerDashboard | null;
  isLoading: boolean;
}

/**
 * Source du tableau de bord agriculteur. Aujourd'hui : données maquettées après
 * un court délai. Demain : remplacer le corps par un appel API (React Query /
 * `apiClient`) renvoyant le même `FarmerDashboard` — les composants ne changent pas.
 */
export function useDashboard(): DashboardState {
  const [state, setState] = useState<DashboardState>({ data: null, isLoading: true });

  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => {
      if (active) setState({ data: buildMockDashboard(), isLoading: false });
    }, LOAD_DELAY_MS);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, []);

  return state;
}
