import type { FunctionComponent } from 'react';

import { Box } from '@mui/material';
import { Outlet } from 'react-router-dom';

import { BienvenuePage } from '@/features/Home/BienvenuePage';
import { useCompteNouveau } from '@/features/Home/useCompteNouveau';
import { BottomNav, NAV_HEIGHT } from '@/shared/components/BottomNav';
import { ErrorBoundary } from '@/shared/components/ErrorBoundary';

/**
 * Coquille des écrans authentifiés : rend l'onglet courant (`Outlet`) au-dessus
 * de la barre de navigation basse Kumy, en réservant l'espace du dock + safe-area.
 *
 * Sauf pour un compte auto-inscrit que personne n'a encore adopté : il n'a ni
 * domaine ni technicien, les quatre onglets mèneraient à des écrans vides. Il
 * reçoit alors un écran de bienvenue unique, sans barre de navigation.
 */
export const AppLayout: FunctionComponent = () => {
  const { estNouveau, isLoading } = useCompteNouveau();

  // Ni squelette ni écran vide pendant la résolution : afficher la barre puis la
  // retirer produirait un clignotement au premier rendu de chaque session.
  if (isLoading) return null;

  if (estNouveau) {
    return (
      <ErrorBoundary>
        <BienvenuePage />
      </ErrorBoundary>
    );
  }

  return (
    <Box sx={{ minHeight: '100dvh', position: 'relative' }}>
      <Box sx={{ pb: `calc(${NAV_HEIGHT}px + env(safe-area-inset-bottom, 0px))` }}>
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </Box>
      <BottomNav />
    </Box>
  );
};
