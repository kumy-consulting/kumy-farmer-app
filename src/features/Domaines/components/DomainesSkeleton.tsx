import type { FunctionComponent } from 'react';

import { Box, Skeleton, Stack } from '@mui/material';

const line = { bgcolor: 'rgba(1,134,117,0.08)' } as const;

/** Squelette de chargement de l'onglet Domaines (barre de stats + cartes). */
export const DomainesSkeleton: FunctionComponent = () => (
  <Box>
    <Skeleton variant="rounded" height={72} sx={{ borderRadius: '18px', ...line }} />

    <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 3, mb: 1.5 }}>
      <Skeleton width={110} height={22} sx={line} />
    </Stack>

    <Stack spacing={2}>
      {[0, 1].map((i) => (
        <Box
          key={i}
          sx={{
            borderRadius: '20px',
            overflow: 'hidden',
            border: '1px solid rgba(55,75,70,0.07)',
            background: '#FFFFFF',
          }}
        >
          <Skeleton variant="rectangular" height={152} sx={line} />
          <Box sx={{ p: '16px' }}>
            <Skeleton width="60%" height={26} sx={line} />
            <Skeleton width="45%" height={18} sx={{ ...line, mt: 0.5 }} />
            <Skeleton width={130} height={30} sx={{ ...line, mt: 1.5, borderRadius: 999 }} />
          </Box>
        </Box>
      ))}
    </Stack>
  </Box>
);
