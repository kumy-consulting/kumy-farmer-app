import { useState, type ChangeEvent, type FunctionComponent, type KeyboardEvent } from 'react';

import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import ConfirmationNumberOutlinedIcon from '@mui/icons-material/ConfirmationNumberOutlined';
import ContentPasteRoundedIcon from '@mui/icons-material/ContentPasteRounded';
import { CircularProgress, IconButton, InputBase } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';

import { ErrorBanner } from '@/features/Onboarding/components/ErrorBanner';
import { extractInvitationCode } from '@/features/Onboarding/invitationCode.util';
import { onboardingApi } from '@/features/Onboarding/onboarding.api';
import { useOnboardingStore } from '@/features/Onboarding/onboarding.store';
import {
  Eyebrow,
  FieldCapsule,
  HelpRow,
  Medallion,
  PrimaryButton,
  Subtitle,
  TextLink,
  Title,
} from '@/features/Onboarding/onboarding.styled';
import { CollapseOnKeyboard, OnboardingLayout } from '@/features/Onboarding/OnboardingLayout';

const HEX12 = /^[0-9a-f]{12}$/;

const clipboardReadSupported = (): boolean =>
  typeof navigator !== 'undefined' && typeof navigator.clipboard?.readText === 'function';

const CodeInput = styled(InputBase)({
  flex: 1,
  padding: '10px 16px',
  fontFamily: "'Ubuntu', sans-serif",
  fontSize: 17,
  fontWeight: 600,
  letterSpacing: '0.04em',
  color: 'rgba(20,40,35,0.92)',
  '& input': {
    padding: 0,
    '&::placeholder': {
      color: 'rgba(55,75,70,0.42)',
      opacity: 1,
      fontWeight: 400,
      letterSpacing: '0.04em',
    },
  },
});

const PasteButton = styled(IconButton)({
  width: 44,
  height: 44,
  borderRadius: 12,
  color: '#016557',
  background: 'rgba(1,134,117,0.08)',
  '&:hover': { background: 'rgba(1,134,117,0.14)' },
});

const DetectedRow = styled(HelpRow)({
  color: '#018675',
  fontWeight: 700,
});

export const InvitationCodePage: FunctionComponent = () => {
  const [code, setCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [canPaste] = useState(clipboardReadSupported);
  const navigate = useNavigate();
  const { setToken, setUserData } = useOnboardingStore();

  const detected = HEX12.test(extractInvitationCode(code));

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

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setCode(text);
        setError(null);
      }
    } catch {
      // Permission refusée / presse-papiers indisponible : saisie manuelle possible.
    }
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setCode(event.target.value);
    if (error) setError(null);
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Enter' && code.trim() && !isSubmitting) {
      event.preventDefault();
      void handleSubmit();
    }
  };

  return (
    <OnboardingLayout>
      <CollapseOnKeyboard>
        <Medallion>
          <ConfirmationNumberOutlinedIcon />
        </Medallion>
      </CollapseOnKeyboard>

      <Eyebrow>Invitation</Eyebrow>

      <Title>Code d&apos;invitation</Title>

      <Subtitle>Saisissez le code reçu par SMS, ou collez le message entier</Subtitle>

      <FieldCapsule sx={{ alignItems: 'center', mb: 1.75 }}>
        <CodeInput
          value={code}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Code d'invitation"
          fullWidth
          inputProps={{
            'aria-label': "Code d'invitation",
            autoComplete: 'off',
            autoCorrect: 'off',
            autoCapitalize: 'off',
            spellCheck: false,
            enterKeyHint: 'done',
          }}
        />
        {canPaste && (
          <PasteButton onClick={() => void handlePaste()} aria-label="Coller le SMS">
            <ContentPasteRoundedIcon sx={{ fontSize: 20 }} />
          </PasteButton>
        )}
      </FieldCapsule>

      {detected ? (
        <DetectedRow sx={{ mb: 3.5 }}>
          <CheckCircleRoundedIcon sx={{ fontSize: 15 }} />
          Code détecté
        </DetectedRow>
      ) : (
        <HelpRow sx={{ mb: 3.5 }}>Collez le SMS entier, nous détectons le code automatiquement</HelpRow>
      )}

      {error && <ErrorBanner mb={2.5}>{error}</ErrorBanner>}

      <PrimaryButton
        onClick={() => void handleSubmit()}
        disabled={!code.trim() || isSubmitting}
        endIcon={isSubmitting ? undefined : <ArrowForwardRoundedIcon sx={{ fontSize: 20 }} />}
      >
        {isSubmitting ? <CircularProgress size={22} color="inherit" /> : 'Continuer'}
      </PrimaryButton>

      <TextLink onClick={() => navigate('/welcome')} sx={{ mt: 2, color: 'rgba(55,75,70,0.62)' }}>
        Je n&apos;ai pas de code
      </TextLink>
    </OnboardingLayout>
  );
};
