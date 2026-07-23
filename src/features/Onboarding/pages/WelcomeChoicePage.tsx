import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import { Box, Stack } from '@mui/material';
import { useNavigate } from 'react-router-dom';

import {
  Eyebrow,
  Medallion,
  OutlinedButton,
  PrimaryButton,
  Subtitle,
  TextLink,
  Title,
} from '@/features/Onboarding/onboarding.styled';
import { OnboardingLayout } from '@/features/Onboarding/OnboardingLayout';

export function WelcomeChoicePage() {
  const navigate = useNavigate();

  return (
    <OnboardingLayout>
      <Medallion>
        <Box component="img" src="/logo-kumy.svg" alt="Kumy" sx={{ width: 48, height: 48 }} />
      </Medallion>

      <Eyebrow>Bienvenue</Eyebrow>

      <Title>Bienvenue sur Kumy</Title>

      <Subtitle>Votre exploitation, dans votre poche.</Subtitle>

      <Stack spacing={1.75} alignItems="center" sx={{ width: '100%' }}>
        <PrimaryButton
          onClick={() => navigate('/auth/phone-entry')}
          endIcon={<ArrowForwardRoundedIcon sx={{ fontSize: 20 }} />}
        >
          Connexion
        </PrimaryButton>

        <OutlinedButton onClick={() => navigate('/onboarding/register/phone')}>Créer un compte</OutlinedButton>

        <TextLink onClick={() => navigate('/onboarding/invitation')} sx={{ mt: 0.5 }}>
          J&apos;ai une invitation
        </TextLink>
      </Stack>
    </OnboardingLayout>
  );
}
