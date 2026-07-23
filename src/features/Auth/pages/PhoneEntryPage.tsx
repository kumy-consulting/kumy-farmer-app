import { type FunctionComponent, useState } from 'react';

import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import CallOutlinedIcon from '@mui/icons-material/CallOutlined';
import { Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';

import { CountryCodeSelector } from '@/features/Auth/components/CountryCodeSelector';
import { PhoneNumberInput } from '@/features/Auth/components/PhoneNumberInput';
import { isValidGuineaNumber, toE164 } from '@/features/Auth/phone.util';
import {
  Eyebrow,
  FieldCapsule,
  HelpRow,
  Medallion,
  PrimaryButton,
  Subtitle,
  Title,
} from '@/features/Onboarding/onboarding.styled';
import { CollapseOnKeyboard, OnboardingLayout } from '@/features/Onboarding/OnboardingLayout';

export const PhoneEntryPage: FunctionComponent = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const navigate = useNavigate();

  const isValid = isValidGuineaNumber(phoneNumber);

  const handleContinue = () => {
    if (!isValid) return;
    navigate('/auth/pin-entry', { state: { phone: toE164(phoneNumber) } });
  };

  return (
    <OnboardingLayout>
      <CollapseOnKeyboard>
        <Medallion>
          <CallOutlinedIcon />
        </Medallion>
      </CollapseOnKeyboard>

      <Eyebrow>Connexion</Eyebrow>

      <Title>Numéro de téléphone</Title>

      <Subtitle>Entrez votre numéro de téléphone, puis continuer</Subtitle>

      <FieldCapsule sx={{ mb: 1.75 }}>
        <CountryCodeSelector countryCode="+224" />
        <PhoneNumberInput value={phoneNumber} onChange={setPhoneNumber} placeholder="622 20 13 62" />
      </FieldCapsule>

      <CollapseOnKeyboard>
        <HelpRow sx={{ mb: 3.5 }}>
          Pays : <Box component="span">Guinée</Box> · Format local à 9 chiffres
        </HelpRow>
      </CollapseOnKeyboard>

      <PrimaryButton
        onClick={handleContinue}
        disabled={!isValid}
        endIcon={<ArrowForwardRoundedIcon sx={{ fontSize: 20 }} />}
      >
        Continuer
      </PrimaryButton>
    </OnboardingLayout>
  );
};
