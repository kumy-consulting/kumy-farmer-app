import { useState, type FunctionComponent } from 'react';

import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { CircularProgress, IconButton } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';

import { PinDisplay } from '@/features/Auth/components/PinDisplay';
import { formatE164ForDisplay } from '@/features/Auth/phone.util';
import { ErrorBanner } from '@/features/Onboarding/components/ErrorBanner';
import {
  Eyebrow,
  Medallion,
  PhoneChip,
  PrimaryButton,
  Subtitle,
  TextLink,
  Title,
} from '@/features/Onboarding/onboarding.styled';
import { CollapseOnKeyboard, OnboardingLayout } from '@/features/Onboarding/OnboardingLayout';
import { useAuthStore } from '@/shared/stores/authStore';

export const PinEntryPage: FunctionComponent = () => {
  const [pin, setPin] = useState('');
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading, error, clearError, rememberedPhone, forgetPhone } = useAuthStore();

  const statePhone = (location.state as { phone?: string } | null)?.phone;
  const phone = statePhone ?? rememberedPhone ?? undefined;
  // Arrivée directe via numéro mémorisé (pas de state de navigation).
  const isRemembered = !statePhone && !!rememberedPhone;

  const handleChange = (value: string) => {
    setPin(value);
    if (error) clearError();
  };

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
    <OnboardingLayout keyboardOpen={keyboardOpen}>
      <IconButton
        onClick={() => void handleBack()}
        aria-label="Changer de numéro"
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

      <CollapseOnKeyboard>
        <Medallion>
          <LockOutlinedIcon />
        </Medallion>
      </CollapseOnKeyboard>

      <Eyebrow>Sécurité</Eyebrow>

      <Title>Code de sécurité</Title>

      <Subtitle sx={{ mb: 1.5 }}>Entrez votre code secret à 6 chiffres</Subtitle>

      {phone && <PhoneChip sx={{ mb: 3 }}>{formatE164ForDisplay(phone)}</PhoneChip>}

      <PinDisplay pin={pin} maxLength={6} onChange={handleChange} onFocusChange={setKeyboardOpen} />

      {error && <ErrorBanner mb={2}>{error}</ErrorBanner>}

      <PrimaryButton onClick={() => void handleSubmit()} disabled={pin.length !== 6 || isLoading} sx={{ mt: 1 }}>
        {isLoading ? <CircularProgress size={22} color="inherit" /> : 'Valider'}
      </PrimaryButton>

      {isRemembered && (
        <TextLink onClick={() => void handleBack()} sx={{ mt: 1.5, color: 'rgba(55,75,70,0.62)' }}>
          Changer de numéro
        </TextLink>
      )}
    </OnboardingLayout>
  );
};
