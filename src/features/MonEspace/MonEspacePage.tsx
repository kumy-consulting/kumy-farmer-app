import type { FunctionComponent } from 'react';

import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import { Box, Button, Stack, Typography } from '@mui/material';

import { useAuthStore } from '@/shared/stores/authStore';
import { neutral, primary } from '@/theme/colors';

/**
 * Onglet « Mon espace » (provisoire) — profil de l'agriculteur, préférences et
 * déconnexion. Placeholder de mise en page.
 */
export const MonEspacePage: FunctionComponent = () => {
  const logout = useAuthStore((s) => s.logout);

  return (
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
            '& svg': { fontSize: 38, color: primary[40] },
          }}
        >
          <PersonRoundedIcon />
        </Box>
        <Typography sx={{ fontFamily: "'Ubuntu', sans-serif", fontSize: 24, fontWeight: 700, color: primary[20] }}>
          Mon espace
        </Typography>
        <Typography sx={{ fontSize: 14, lineHeight: 1.55, color: neutral[50] }}>
          Bientôt : votre profil, vos préférences et vos notifications.
        </Typography>
        <Button
          onClick={() => void logout()}
          startIcon={<LogoutRoundedIcon />}
          sx={{
            mt: 1,
            textTransform: 'none',
            fontFamily: "'Ubuntu', sans-serif",
            fontWeight: 600,
            color: primary[40],
          }}
        >
          Se déconnecter
        </Button>
      </Stack>
    </Box>
  );
};
