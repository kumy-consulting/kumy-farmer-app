import type { FunctionComponent } from 'react';

import { Box, Button, Typography } from '@mui/material';
import { Navigate, useNavigate } from 'react-router-dom';

import { InfoIcon, UserCheckIcon } from '@/features/Onboarding/components/OnboardingIcons';
import { OnboardingStepper } from '@/features/Onboarding/components/OnboardingStepper';
import { useOnboardingStore } from '@/features/Onboarding/onboarding.store';
import { neutral, primary } from '@/theme/colors';

interface InfoRowProps {
  label: string;
  value: string;
}

const InfoRow: FunctionComponent<InfoRowProps> = ({ label, value }) => (
  <Box
    sx={{
      bgcolor: primary[100],
      borderRadius: '12px',
      p: '14px 16px',
      mb: 1.25,
      border: `1px solid ${neutral[90]}`,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    }}
  >
    <Typography sx={{ fontSize: 13, color: neutral[50], fontWeight: 500 }}>{label}</Typography>
    <Typography sx={{ fontSize: 15, color: neutral[10], fontWeight: 600 }}>{value}</Typography>
  </Box>
);

export const InvitedWelcomePage: FunctionComponent = () => {
  const navigate = useNavigate();
  const { userData } = useOnboardingStore();

  if (!userData) return <Navigate to="/onboarding/invitation" replace />;

  return (
    <Box
      sx={{
        minHeight: '100dvh',
        bgcolor: neutral[99],
        px: 3,
        pt: '20px',
        pb: '100px',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <OnboardingStepper current={0} />

      <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
        <UserCheckIcon />
      </Box>

      <Typography sx={{ fontSize: 22, fontWeight: 700, color: neutral[10], textAlign: 'center', mb: 0.5 }}>
        Bienvenue {userData.firstName} !
      </Typography>
      <Typography sx={{ fontSize: 14, color: neutral[50], textAlign: 'center', lineHeight: 1.5, mb: 3 }}>
        Votre compte agriculteur a été créé.
        <br />
        Veuillez vérifier vos informations et compléter votre profil.
      </Typography>

      <Box sx={{ mt: 1 }}>
        <InfoRow label="Prénom" value={userData.firstName} />
        <InfoRow label="Nom" value={userData.lastName} />
        <InfoRow label="Email" value={userData.email} />
        <InfoRow label="Téléphone" value={userData.phone} />
      </Box>

      <Box
        sx={{
          display: 'flex',
          gap: 1.25,
          p: '12px 14px',
          borderRadius: '12px',
          bgcolor: primary[98],
          border: `1px solid ${primary[50]}33`,
          mt: 2,
          alignItems: 'flex-start',
        }}
      >
        <Box sx={{ flexShrink: 0, mt: '1px' }}>
          <InfoIcon />
        </Box>
        <Typography sx={{ fontSize: 13, color: primary[40], lineHeight: 1.5 }}>
          Si ces informations sont incorrectes, contactez votre administrateur.
        </Typography>
      </Box>

      <Box sx={{ flex: 1 }} />

      <Button
        size="large"
        variant="contained"
        onClick={() => navigate('/onboarding/pin')}
        sx={{ maxWidth: 395, alignSelf: 'center', width: '100%' }}
      >
        Continuer
      </Button>
    </Box>
  );
};
