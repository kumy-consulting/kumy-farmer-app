import { Box, Button, Stack, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';

export function WelcomeChoicePage() {
  const navigate = useNavigate();
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
      <Stack spacing={1.5} alignItems="center" textAlign="center">
        <Box component="img" src="/logo-kumy.svg" alt="Kumy" sx={{ width: 88 }} />
        <Typography variant="h4" fontWeight={700}>
          Bienvenue sur Kumy
        </Typography>
        <Typography color="text.secondary">Votre exploitation, dans votre poche.</Typography>
      </Stack>
      <Stack spacing={1.5}>
        <Button size="large" variant="contained" onClick={() => navigate('/auth/phone-entry')}>
          Connexion
        </Button>
        <Button size="large" variant="outlined" onClick={() => navigate('/onboarding/register/phone')}>
          Créer un compte
        </Button>
        <Button variant="text" onClick={() => navigate('/onboarding/invitation')}>
          J&apos;ai une invitation
        </Button>
      </Stack>
    </Box>
  );
}
