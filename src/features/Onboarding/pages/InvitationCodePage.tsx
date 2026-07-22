import { useState, type FunctionComponent } from 'react';

import { Alert, Box, Button, CircularProgress, Stack, TextField, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';

import { extractInvitationCode } from '@/features/Onboarding/invitationCode.util';
import { onboardingApi } from '@/features/Onboarding/onboarding.api';
import { useOnboardingStore } from '@/features/Onboarding/onboarding.store';

export const InvitationCodePage: FunctionComponent = () => {
  const [code, setCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { setToken, setUserData } = useOnboardingStore();

  const handleSubmit = async () => {
    const trimmed = extractInvitationCode(code);
    if (!trimmed) return;

    setIsSubmitting(true);
    setError(null);
    try {
      const data = await onboardingApi.validateToken(trimmed);
      if (!data.valid) throw new Error('invalid');

      setToken(trimmed);
      setUserData({
        email: data.email,
        phone: data.phone,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role,
      });
      navigate('/onboarding/welcome');
    } catch {
      setError("Code d'invitation invalide ou expiré");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        px: 3,
        gap: 4,
      }}
    >
      <Stack spacing={1} alignItems="center" textAlign="center">
        <Typography variant="h4" fontWeight={700}>
          Code d&apos;invitation
        </Typography>
        <Typography color="text.secondary">
          Saisissez le code reçu par SMS, ou collez le message entier
        </Typography>
      </Stack>

      <Stack spacing={1.5} alignItems="center">
        <TextField
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Code d'invitation"
          fullWidth
          sx={{ maxWidth: 395 }}
          slotProps={{ htmlInput: { 'aria-label': "Code d'invitation" } }}
        />
      </Stack>

      {error && (
        <Alert severity="error" sx={{ maxWidth: 395, alignSelf: 'center', width: '100%' }}>
          {error}
        </Alert>
      )}

      <Button
        size="large"
        variant="contained"
        onClick={() => void handleSubmit()}
        disabled={!code.trim() || isSubmitting}
        sx={{ maxWidth: 395, alignSelf: 'center', width: '100%' }}
      >
        {isSubmitting ? <CircularProgress size={22} color="inherit" /> : 'Continuer'}
      </Button>
    </Box>
  );
};
