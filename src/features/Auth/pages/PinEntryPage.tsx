import { useState, type FunctionComponent } from 'react';

import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import { Alert, Box, Button, CircularProgress, IconButton, Stack, Typography } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';

import { PinDisplay } from '@/features/Auth/components/PinDisplay';
import { formatE164ForDisplay } from '@/features/Auth/phone.util';
import { useAuthStore } from '@/shared/stores/authStore';

export const PinEntryPage: FunctionComponent = () => {
  const [pin, setPin] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading, error, clearError, rememberedPhone, forgetPhone } = useAuthStore();

  const statePhone = (location.state as { phone?: string } | null)?.phone;
  const phone = statePhone ?? rememberedPhone ?? undefined;
  // Arrivée directe via numéro mémorisé (pas de state de navigation).
  const isRemembered = !statePhone && !!rememberedPhone;

  const handleSubmit = async () => {
    if (pin.length !== 6 || !phone) return;
    try {
      await login(phone, pin);
      navigate('/', { replace: true });
    } catch {
      setPin('');
    }
  };

  const handleBack = async () => {
    clearError();
    if (isRemembered) {
      await forgetPhone();
      navigate('/auth/phone-entry', { replace: true });
      return;
    }
    navigate('/auth/phone-entry');
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
        <IconButton onClick={() => void handleBack()} aria-label="Changer de numéro">
          <ArrowBackRoundedIcon />
        </IconButton>
      </Box>

      <Stack spacing={4} sx={{ flex: 1, justifyContent: 'center' }}>
        <Stack spacing={1} alignItems="center" textAlign="center">
          <Typography variant="h4" fontWeight={700}>
            Code de sécurité
          </Typography>
          <Typography color="text.secondary">Entrez votre code secret à 6 chiffres</Typography>
          {phone && (
            <Typography variant="body2" fontWeight={600}>
              {formatE164ForDisplay(phone)}
            </Typography>
          )}
        </Stack>

        {error && (
          <Alert severity="error" onClose={clearError}>
            {error}
          </Alert>
        )}

        <Box display="flex" justifyContent="center">
          <PinDisplay pin={pin} maxLength={6} onChange={setPin} />
        </Box>

        <Button
          size="large"
          variant="contained"
          onClick={() => void handleSubmit()}
          disabled={pin.length !== 6 || isLoading}
          sx={{ maxWidth: 395, alignSelf: 'center', width: '100%' }}
        >
          {isLoading ? <CircularProgress size={22} color="inherit" /> : 'Valider'}
        </Button>

        {isRemembered && (
          <Button variant="text" onClick={() => void handleBack()} sx={{ alignSelf: 'center' }}>
            Changer de numéro
          </Button>
        )}
      </Stack>
    </Box>
  );
};
