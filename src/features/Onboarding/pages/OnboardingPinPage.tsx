import { useState, type FunctionComponent } from 'react';

import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import { Box, Button, IconButton, Stack, Typography } from '@mui/material';
import { Navigate, useNavigate } from 'react-router-dom';

import { PinDisplay } from '@/features/Auth/components/PinDisplay';
import { OnboardingStepper } from '@/features/Onboarding/components/OnboardingStepper';
import { useOnboardingStore } from '@/features/Onboarding/onboarding.store';

export const OnboardingPinPage: FunctionComponent = () => {
  const [pin, setPin] = useState('');
  const navigate = useNavigate();
  const { userData, setPassword } = useOnboardingStore();

  if (!userData) return <Navigate to="/onboarding/invitation" replace />;

  const handleSubmit = () => {
    if (pin.length !== 6) return;
    setPassword(pin);
    navigate('/onboarding/success');
  };

  return (
    <Box
      sx={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        px: 3,
        pt: 2,
        pb: 4,
      }}
    >
      <Box>
        <IconButton onClick={() => navigate('/onboarding/welcome')} aria-label="Retour">
          <ArrowBackRoundedIcon />
        </IconButton>
      </Box>

      <OnboardingStepper current={1} />

      <Stack spacing={4} sx={{ flex: 1, justifyContent: 'center' }}>
        <Stack spacing={1} alignItems="center" textAlign="center">
          <Typography variant="h4" fontWeight={700}>
            Créez votre code secret
          </Typography>
          <Typography color="text.secondary">Choisissez un code secret à 6 chiffres pour vous connecter</Typography>
        </Stack>

        <Box display="flex" justifyContent="center">
          <PinDisplay pin={pin} maxLength={6} onChange={setPin} />
        </Box>

        <Button
          size="large"
          variant="contained"
          onClick={handleSubmit}
          disabled={pin.length !== 6}
          sx={{ maxWidth: 395, alignSelf: 'center', width: '100%' }}
        >
          Continuer
        </Button>
      </Stack>
    </Box>
  );
};
