import type { FunctionComponent } from 'react';

import AgricultureRoundedIcon from '@mui/icons-material/AgricultureRounded';
import { Box, Button, Stack, Typography } from '@mui/material';

import { KumySprout } from '@/shared/components/KumySprout';
import { useAuthStore } from '@/shared/stores/authStore';
import { neutral, primary } from '@/theme/colors';

/** Ce qui va se passer, dit dans l'ordre où cela arrivera. */
const ETAPES = [
  'Un technicien Kumy prend contact avec vous',
  'Vous tracez ensemble vos domaines et vos parcelles',
  'Vos conseils, vos alertes et votre calendrier apparaissent ici',
] as const;

/**
 * Le seul écran d'un compte auto-inscrit que personne n'a encore adopté.
 *
 * Sans domaine ni technicien, le tableau de bord n'aurait rien à montrer et les
 * quatre onglets mèneraient à des écrans vides. Un écran qui explique la suite
 * vaut mieux que quatre qui ne disent rien.
 */
export const BienvenuePage: FunctionComponent = () => {
  const prenom = useAuthStore((s) => s.user?.displayName?.split(' ')[0]);
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
        py: 6,
        background: 'linear-gradient(180deg, #F3FFFA 0%, #F0F1EF 100%)',
      }}
    >
      <Box
        sx={{
          width: 96,
          height: 96,
          borderRadius: '50%',
          bgcolor: primary[98],
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mb: 3,
        }}
      >
        <KumySprout size={52} />
      </Box>

      <Typography sx={{ fontSize: 24, fontWeight: 700, color: neutral[10], mb: 1 }}>
        Bienvenue{prenom ? ` ${prenom}` : ''} !
      </Typography>

      <Typography
        sx={{ fontSize: 14.5, color: neutral[50], lineHeight: 1.55, maxWidth: 300, mb: 4 }}
      >
        Votre compte Kumy est créé. Il ne contient encore aucune exploitation — voici ce qui vient
        ensuite.
      </Typography>

      <Stack spacing={1.75} sx={{ width: '100%', maxWidth: 340, mb: 5 }}>
        {ETAPES.map((etape, index) => (
          <Stack
            key={etape}
            direction="row"
            spacing={1.5}
            alignItems="center"
            sx={{
              px: 2,
              py: 1.75,
              borderRadius: '16px',
              textAlign: 'left',
              background: 'rgba(255,255,255,0.92)',
              border: '1px solid rgba(55,75,70,0.08)',
              boxShadow: '0 6px 20px rgba(1,134,117,0.06)',
            }}
          >
            <Box
              sx={{
                width: 26,
                height: 26,
                flexShrink: 0,
                borderRadius: '50%',
                bgcolor: primary[98],
                color: primary[50],
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: "'Ubuntu', sans-serif",
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              {index + 1}
            </Box>
            <Typography sx={{ fontSize: 13.5, color: neutral[30], lineHeight: 1.4 }}>
              {etape}
            </Typography>
          </Stack>
        ))}
      </Stack>

      <Stack
        direction="row"
        spacing={1}
        alignItems="center"
        sx={{ color: neutral[50], fontSize: 12.5, mb: 3 }}
      >
        <AgricultureRoundedIcon sx={{ fontSize: 18 }} />
        <Typography sx={{ fontSize: 12.5 }}>
          Cet écran laissera place à votre tableau de bord dès la première visite.
        </Typography>
      </Stack>

      <Button onClick={() => void logout()} sx={{ color: neutral[50], fontSize: 13 }}>
        Se déconnecter
      </Button>
    </Box>
  );
};
