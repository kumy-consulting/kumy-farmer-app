import type { FunctionComponent, PropsWithChildren } from 'react';

import { Navigate } from 'react-router-dom';

import { isDemoMode } from '@/features/Home/home.demo';
import { useAuthStore } from '@/shared/stores/authStore';

export const ProtectedRoute: FunctionComponent<PropsWithChildren> = ({ children }) => {
  const { isAuthenticated, isLoading, rememberedPhone } = useAuthStore();

  // Aperçu de démonstration (`?demo=1`) : réservé au développement par
  // `isDemoMode`, il ne franchit jamais un build de production. Passe AVANT
  // l'amorçage de session, qui ne se termine pas sans compte connecté.
  if (isDemoMode()) return <>{children}</>;

  if (isLoading) return null;

  if (!isAuthenticated) {
    // Numéro déjà mémorisé sur cet appareil → droit sur le PIN, sinon écran de choix.
    const target = rememberedPhone ? '/auth/pin-entry' : '/welcome';
    return <Navigate to={target} replace />;
  }

  return <>{children}</>;
};
