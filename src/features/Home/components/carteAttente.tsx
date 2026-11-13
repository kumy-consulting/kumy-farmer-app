import type { FunctionComponent, ReactNode } from 'react';

import { Box } from '@mui/material';

import { MENTHE, VERT_PROFOND } from './carteAttente.styles';

/** Le carré menthe qui porte l'icône d'une carte. */
export const Tuile: FunctionComponent<{ children: ReactNode; taille?: number }> = ({ children, taille = 44 }) => (
  <Box
    aria-hidden
    sx={{
      width: taille,
      height: taille,
      flexShrink: 0,
      borderRadius: '13px',
      display: 'grid',
      placeItems: 'center',
      background: MENTHE,
      color: VERT_PROFOND,
      '& svg': { fontSize: 22 },
    }}
  >
    {children}
  </Box>
);

/** La pousse, au trait : le signe des cartes qui parlent de la terre. */
export const Pousse: FunctionComponent<{ taille?: number }> = ({ taille = 22 }) => (
  <svg
    width={taille}
    height={taille}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.7}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <path d="M12 21v-8.5" />
    <path d="M12 13.5C12 10.2 9.6 8 6 8c0 3.3 2.4 5.5 6 5.5Z" />
    <path d="M12 11.5C12 8 14.6 5 18.5 5c0 3.6-2.7 6.5-6.5 6.5Z" />
  </svg>
);
