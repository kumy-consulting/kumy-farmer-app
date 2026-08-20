import { useState, type FunctionComponent } from 'react';

import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { Box } from '@mui/material';
import { Navigate, useNavigate } from 'react-router-dom';

import { PinDisplay } from '@/features/Auth/components/PinDisplay';
import { OnboardingStepper } from '@/features/Onboarding/components/OnboardingStepper';
import { useOnboardingStore } from '@/features/Onboarding/onboarding.store';
import {
  Eyebrow,
  Medallion,
  PrimaryButton,
  Subtitle,
  Title,
} from '@/features/Onboarding/onboarding.styled';
import { CollapseOnKeyboard, OnboardingLayout } from '@/features/Onboarding/OnboardingLayout';
import { BackButton } from '@/shared/components/BackButton';

export const OnboardingPinPage: FunctionComponent = () => {
  const [pin, setPin] = useState('');
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const navigate = useNavigate();
  const { userData, setPassword } = useOnboardingStore();

  if (!userData) return <Navigate to="/onboarding/invitation" replace />;

  const handleSubmit = () => {
    if (pin.length !== 6) return;
    setPassword(pin);
    navigate('/onboarding/success');
  };

  return (
    <OnboardingLayout keyboardOpen={keyboardOpen}>
      <Box
        sx={{
          position: 'absolute',
          top: 'calc(env(safe-area-inset-top, 0px) + 14px)',
          left: 16,
          zIndex: 2,
        }}
      >
        <BackButton onClick={() => navigate('/onboarding/profile')} label="Retour" />
      </Box>

      <OnboardingStepper current={2} total={3} />

      <CollapseOnKeyboard>
        <Medallion>
          <LockOutlinedIcon />
        </Medallion>
      </CollapseOnKeyboard>

      <Eyebrow>Sécurité</Eyebrow>

      <Title>Créez votre code secret</Title>

      <Subtitle sx={{ mb: 1.5 }}>Choisissez un code secret à 6 chiffres pour vous connecter</Subtitle>

      <PinDisplay pin={pin} maxLength={6} onChange={setPin} onFocusChange={setKeyboardOpen} />

      <PrimaryButton onClick={handleSubmit} disabled={pin.length !== 6} sx={{ mt: 1 }}>
        Continuer
      </PrimaryButton>
    </OnboardingLayout>
  );
};
