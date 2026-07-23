import type { FunctionComponent } from 'react';

import { Box, Stack, Typography } from '@mui/material';

import { KumySprout } from '@/shared/components/KumySprout';
import { neutral, primary } from '@/theme/colors';

/**
 * Onglet « Domaines » (provisoire) — futur inventaire des domaines/parcelles de
 * l'agriculteur (carte, polygones, cultures). Placeholder de mise en page.
 */
export const DomainesPage: FunctionComponent = () => (
  <Box
    sx={{
      minHeight: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      px: 3,
      pt: 'calc(env(safe-area-inset-top, 0px) + 24px)',
      background: `linear-gradient(180deg, ${primary[99]} 0%, ${primary[95]} 100%)`,
    }}
  >
    <Stack spacing={2} alignItems="center" maxWidth={320}>
      <Box
        sx={{
          width: 84,
          height: 84,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'radial-gradient(circle at 30% 25%, #FFFFFF 0%, #EAF6F0 100%)',
          border: `1px solid ${primary[80]}`,
          boxShadow: '0 14px 30px rgba(1,134,117,0.18)',
        }}
      >
        <KumySprout size={42} color={primary[40]} accent={primary[50]} />
      </Box>
      <Typography sx={{ fontFamily: "'Ubuntu', sans-serif", fontSize: 24, fontWeight: 700, color: primary[20] }}>
        Vos domaines
      </Typography>
      <Typography sx={{ fontSize: 14, lineHeight: 1.55, color: neutral[50] }}>
        Bientôt : cartographiez vos parcelles, suivez vos cultures et vos capteurs, domaine par domaine.
      </Typography>
    </Stack>
  </Box>
);
