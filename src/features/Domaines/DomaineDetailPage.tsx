import type { FunctionComponent } from 'react';

import ArrowBackRounded from '@mui/icons-material/ArrowBackRounded';
import { Box, IconButton, Stack, Typography } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';

import { KumySprout } from '@/shared/components/KumySprout';
import { neutral, primary } from '@/theme/colors';

/**
 * Détail d'un domaine (provisoire) — futur écran parcelles / cultures / capteurs.
 * Le nom est transmis via l'état de navigation depuis la liste des domaines.
 */
export const DomaineDetailPage: FunctionComponent = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const name = (location.state as { name?: string } | null)?.name;

  return (
    <Box
      sx={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        background: `linear-gradient(180deg, ${primary[99]} 0%, ${primary[95]} 100%)`,
        pt: 'calc(env(safe-area-inset-top, 0px) + 12px)',
        px: 2.5,
      }}
    >
      <IconButton
        onClick={() => navigate('/domaines')}
        aria-label="Retour aux domaines"
        sx={{
          alignSelf: 'flex-start',
          width: 44,
          height: 44,
          background: '#FFFFFF',
          border: `1px solid ${primary[80]}`,
          boxShadow: '0 4px 12px rgba(1,134,117,0.10)',
          '&:active': { opacity: 0.85 },
        }}
      >
        <ArrowBackRounded sx={{ color: primary[30] }} />
      </IconButton>

      <Stack spacing={2} alignItems="center" textAlign="center" maxWidth={320} sx={{ m: 'auto' }}>
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
          {name || 'Domaine'}
        </Typography>
        <Typography sx={{ fontSize: 14, lineHeight: 1.55, color: neutral[50] }}>
          Bientôt : le détail de ce domaine — parcelles, cultures, capteurs et alertes, en un coup d’œil.
        </Typography>
      </Stack>
    </Box>
  );
};
