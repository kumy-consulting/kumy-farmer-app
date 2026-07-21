import type { FunctionComponent, PropsWithChildren } from 'react';

import { Navigate } from 'react-router-dom';

import { useAuthStore } from '@/shared/stores/authStore';

export const ProtectedRoute: FunctionComponent<PropsWithChildren> = ({ children }) => {
  const { isAuthenticated, isLoading, rememberedPhone } = useAuthStore();

  if (isLoading) return null;

  if (!isAuthenticated) {
    // Numéro déjà mémorisé sur cet appareil → droit sur le PIN, sinon écran de choix.
    const target = rememberedPhone ? '/auth/pin-entry' : '/welcome';
    return <Navigate to={target} replace />;
  }

  return <>{children}</>;
};
