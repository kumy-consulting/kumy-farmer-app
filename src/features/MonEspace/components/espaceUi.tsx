import type { FunctionComponent, ReactNode } from 'react';

import { Box, Typography } from '@mui/material';

/** Surface commune des blocs — même carte blanche que le fil de l'accueil. */
export const Card: FunctionComponent<{ children: ReactNode; pad?: number }> = ({ children, pad = 2 }) => (
  <Box
    sx={{
      borderRadius: '18px',
      background: '#FFFFFF',
      border: '1px solid rgba(55,75,70,0.07)',
      boxShadow: '0 6px 18px rgba(1,134,117,0.06)',
      overflow: 'hidden',
      p: pad,
    }}
  >
    {children}
  </Box>
);

/**
 * Étiquette de section. Même grammaire que l'accueil : petites capitales
 * espacées, opaques — la hiérarchie passe par le corps et la casse, pas par un
 * gris pâle qui disparaît au soleil.
 */
export const SectionTitle: FunctionComponent<{ children: ReactNode }> = ({ children }) => (
  <Typography
    sx={{
      fontFamily: "'Ubuntu', sans-serif",
      fontSize: 11.5,
      fontWeight: 700,
      letterSpacing: '0.1em',
      textTransform: 'uppercase',
      color: 'rgba(55,75,70,0.78)',
      // Serré sous son titre, aéré entre sections : c'est l'écart qui dit
      // ce qui va ensemble, pas les cadres.
      mb: 0.85,
    }}
  >
    {children}
  </Typography>
);

/** Petites capitales espacées d'un libellé de champ — la voix des rubriques. */
export const Sourcil: FunctionComponent<{ children: ReactNode }> = ({ children }) => (
  <Typography
    sx={{
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: '0.09em',
      textTransform: 'uppercase',
      color: '#5C5F5E',
      lineHeight: 1.3,
    }}
  >
    {children}
  </Typography>
);

/**
 * Une donnée de fiche : le libellé au-dessus, la valeur en dessous.
 *
 * L'alternative — libellé à gauche, valeur poussée à droite — oblige l'œil à
 * traverser la ligne et à revenir, quatorze fois de suite, et laisse un bord
 * droit en dents de scie. Empilé, tout s'aligne sur un seul bord gauche et les
 * valeurs se lisent en colonne.
 */
export const Donnee: FunctionComponent<{ label: string; value: string; pleineLargeur?: boolean }> = ({
  label,
  value,
  pleineLargeur,
}) => (
  <Box sx={{ minWidth: 0, gridColumn: pleineLargeur ? '1 / -1' : undefined }}>
    <Sourcil>{label}</Sourcil>
    <Typography
      sx={{
        fontFamily: "'Ubuntu', sans-serif",
        fontSize: 15.5,
        fontWeight: 600,
        color: '#1A1C1B',
        lineHeight: 1.3,
        mt: 0.2,
      }}
    >
      {value}
    </Typography>
  </Box>
);
