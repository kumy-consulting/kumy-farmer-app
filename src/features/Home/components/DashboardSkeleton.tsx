import type { FunctionComponent } from 'react';

import { Box, Skeleton, Stack } from '@mui/material';

const line = { bgcolor: 'rgba(1,134,117,0.08)' } as const;

export const DashboardSkeleton: FunctionComponent = () => (
  <Box>
    {/* Hero */}
    <Box
      sx={{
        padding: 'calc(env(safe-area-inset-top, 0px) + 24px) 24px 44px',
        background: 'linear-gradient(155deg, #0A6656 0%, #04382F 100%)',
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
      }}
    >
      <Skeleton width={110} height={14} sx={{ bgcolor: 'rgba(255,255,255,0.18)' }} />
      <Skeleton width={190} height={30} sx={{ bgcolor: 'rgba(255,255,255,0.22)', mb: 2 }} />
      <Stack direction="row" spacing={2} alignItems="center">
        <Skeleton variant="rounded" width={58} height={58} sx={{ bgcolor: 'rgba(255,255,255,0.18)' }} />
        <Skeleton width={120} height={44} sx={{ bgcolor: 'rgba(255,255,255,0.18)' }} />
      </Stack>
    </Box>

    <Box sx={{ px: 2.5, mt: -3 }}>
      <Skeleton variant="rounded" height={92} sx={{ borderRadius: '20px', ...line }} />

      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1.25, mt: 3 }}>
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} variant="rounded" height={92} sx={{ borderRadius: '18px', ...line }} />
        ))}
      </Box>

      <Stack spacing={1.25} sx={{ mt: 3 }}>
        <Skeleton width={120} height={22} sx={line} />
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} variant="rounded" height={72} sx={{ borderRadius: '16px', ...line }} />
        ))}
      </Stack>
    </Box>
  </Box>
);
