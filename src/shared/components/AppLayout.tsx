import type { FunctionComponent } from 'react';

import { Box } from '@mui/material';
import { Outlet } from 'react-router-dom';

import { BottomNav, NAV_HEIGHT } from '@/shared/components/BottomNav';

/**
 * Coquille des écrans authentifiés : rend l'onglet courant (`Outlet`) au-dessus
 * de la barre de navigation basse Kumy, en réservant l'espace du dock + safe-area.
 */
export const AppLayout: FunctionComponent = () => (
  <Box sx={{ minHeight: '100dvh', position: 'relative' }}>
    <Box sx={{ pb: `calc(${NAV_HEIGHT}px + env(safe-area-inset-bottom, 0px))` }}>
      <Outlet />
    </Box>
    <BottomNav />
  </Box>
);
