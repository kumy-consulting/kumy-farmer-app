import type { FunctionComponent } from 'react';

import { Box, Button, Stack, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';

export const RegisterComingSoonPage: FunctionComponent = () => {
  const navigate = useNavigate();
  return (
    <Box
      sx={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        px: 3,
        gap: 3,
        textAlign: 'center',
      }}
    >
      <Stack spacing={1.5} alignItems="center">
        <Typography variant="h4" fontWeight={700}>
          Bientôt disponible
        </Typography>
        <Typography color="text.secondary">
          La création de compte autonome arrive prochainement. Utilisez votre code d&apos;invitation pour
          l&apos;instant.
        </Typography>
      </Stack>
      <Button size="large" variant="contained" onClick={() => navigate('/welcome')}>
        Retour
      </Button>
    </Box>
  );
};
