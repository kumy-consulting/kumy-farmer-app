import { useState, type FunctionComponent } from 'react';

import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { IconButton } from '@mui/material';
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
      <IconButton
        onClick={() => navigate('/onboarding/welcome')}
        aria-label="Retour"
        sx={{
          position: 'absolute',
          top: 'calc(env(safe-area-inset-top, 0px) + 8px)',
          left: 8,
          color: '#374B46',
          zIndex: 2,
        }}
      >
        <ArrowBackRoundedIcon />
      </IconButton>

      <OnboardingStepper current={1} />

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
