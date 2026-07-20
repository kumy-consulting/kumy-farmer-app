import { useEffect, useState, type FunctionComponent } from 'react';

import { Box, Button, CircularProgress, Typography } from '@mui/material';

import { CheckCircleIcon } from '@/features/Onboarding/components/OnboardingIcons';
import { onboardingApi } from '@/features/Onboarding/onboarding.api';
import { useOnboardingStore } from '@/features/Onboarding/onboarding.store';
import { neutral, primary, error as errorPalette } from '@/theme/colors';

export const OnboardingSuccessPage: FunctionComponent = () => {
  const { token, userData, password, reset } = useOnboardingStore();
  const [isSubmitting, setIsSubmitting] = useState(true);
  const [activationError, setActivationError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      if (!token || !password) {
        setIsSubmitting(false);
        setActivationError('Session d’activation invalide. Reprenez depuis le code d’invitation.');
        return;
      }
      try {
        await onboardingApi.activate({ token, password });
      } catch {
        setActivationError('Échec de l’activation. Réessayez.');
      } finally {
        setIsSubmitting(false);
      }
    };
    void run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isSubmitting) {
    return (
      <Box
        sx={{
          minHeight: '100dvh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          px: 3,
        }}
      >
        <CircularProgress sx={{ color: primary[50] }} />
        <Typography sx={{ mt: 2, color: neutral[50] }}>Activation en cours...</Typography>
      </Box>
    );
  }

  if (activationError) {
    return (
      <Box
        sx={{
          minHeight: '100dvh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
          px: 3,
        }}
      >
        <Typography sx={{ fontSize: 18, fontWeight: 600, color: errorPalette[40], mb: 2 }}>
          Erreur d&apos;activation
        </Typography>
        <Typography sx={{ fontSize: 14, color: neutral[50], mb: 3, maxWidth: 280 }}>{activationError}</Typography>
        <Button
          size="large"
          variant="contained"
          onClick={() => window.location.reload()}
          sx={{ maxWidth: 395, width: '100%' }}
        >
          Réessayer
        </Button>
      </Box>
    );
  }

  const handleAccess = () => {
    reset();
    window.location.href = '/';
  };

  return (
    <Box
      sx={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center',
        px: 3,
        pb: 3,
      }}
    >
      <Box
        sx={{
          width: 100,
          height: 100,
          borderRadius: '50%',
          bgcolor: primary[98],
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mb: 3,
          '@keyframes scaleIn': {
            from: { transform: 'scale(0.5)', opacity: 0 },
            to: { transform: 'scale(1)', opacity: 1 },
          },
          animation: 'scaleIn 0.5s ease',
        }}
      >
        <CheckCircleIcon />
      </Box>

      <Typography sx={{ fontSize: 24, fontWeight: 700, color: neutral[10], mb: 1.5 }}>Compte activé !</Typography>
      <Typography sx={{ fontSize: 14, color: neutral[50], lineHeight: 1.5, maxWidth: 280, mb: 4 }}>
        Bienvenue {userData?.firstName}, votre compte est maintenant actif. Vous pouvez accéder à Kumy.
      </Typography>

      <Button size="large" variant="contained" onClick={handleAccess} sx={{ maxWidth: 395, width: '100%', mt: 4 }}>
        Accéder à Kumy
      </Button>
    </Box>
  );
};
