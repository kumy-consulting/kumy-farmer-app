import type { FunctionComponent } from 'react';

import { Box, Skeleton, Stack } from '@mui/material';

const line = { bgcolor: 'rgba(1,134,117,0.08)' } as const;

/** Squelette calé sur la nouvelle composition : en-tête court, récap, 3 cartes. */
export const HomeSkeleton: FunctionComponent = () => (
  <Box>
    <Box
      sx={{
        padding: 'calc(env(safe-area-inset-top, 0px) + 20px) 24px 22px',
        background: 'linear-gradient(155deg, #0E7A67 0%, #0A6152 100%)',
      }}
    >
      <Skeleton width={110} height={14} sx={{ bgcolor: 'rgba(255,255,255,0.18)' }} />
      <Skeleton width={190} height={30} sx={{ bgcolor: 'rgba(255,255,255,0.22)' }} />
      <Skeleton width={230} height={26} sx={{ bgcolor: 'rgba(255,255,255,0.18)', borderRadius: 999, mt: 1 }} />
    </Box>

    <Stack spacing={1.25} sx={{ px: 2.5, mt: 2 }}>
      <Skeleton variant="rounded" height={64} sx={{ borderRadius: '18px', ...line }} />
      <Skeleton width={140} height={22} sx={{ ...line, mt: 1 }} />
      {[0, 1, 2].map((index) => (
        <Skeleton key={index} variant="rounded" height={92} sx={{ borderRadius: '18px', ...line }} />
      ))}
    </Stack>
  </Box>
);
