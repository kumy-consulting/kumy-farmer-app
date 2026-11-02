import type { FunctionComponent } from 'react';

import { Box, Stack, Typography } from '@mui/material';

import { M } from './meteoFormat';

/** Intitulé de section de l'onglet Météos : filet vert + capitales espacées. */
export const SectionTitre: FunctionComponent<{ children: string }> = ({ children }) => (
  <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.25 }}>
    <Box sx={{ width: 4, height: 15, borderRadius: 999, backgroundColor: M.green }} />
    <Typography
      sx={{
        fontFamily: "'Ubuntu', sans-serif",
        fontSize: 12,
        fontWeight: 700,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        color: M.inkSoft,
      }}
    >
      {children}
    </Typography>
  </Stack>
);
