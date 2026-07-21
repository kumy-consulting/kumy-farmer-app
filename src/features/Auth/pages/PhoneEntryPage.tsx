import { useState, type FunctionComponent } from 'react';

import { Box, Button, Stack, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';

import { CountryCodeSelector } from '@/features/Auth/components/CountryCodeSelector';
import { PhoneNumberInput } from '@/features/Auth/components/PhoneNumberInput';
import { isValidGuineaNumber, toE164 } from '@/features/Auth/phone.util';

export const PhoneEntryPage: FunctionComponent = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const navigate = useNavigate();

  const isValid = isValidGuineaNumber(phoneNumber);

  const handleContinue = () => {
    if (!isValid) return;
    navigate('/auth/pin-entry', { state: { phone: toE164(phoneNumber) } });
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
          Numéro de téléphone
        </Typography>
        <Typography color="text.secondary">Entrez votre numéro de téléphone, puis continuer</Typography>
      </Stack>

      <Stack spacing={1.5} alignItems="center">
        <Stack
          direction="row"
          alignItems="stretch"
          spacing={0.75}
          sx={{ width: '100%', maxWidth: 395, p: 0.75, borderRadius: 3, border: 1, borderColor: 'divider' }}
        >
          <CountryCodeSelector countryCode="+224" />
          <PhoneNumberInput value={phoneNumber} onChange={setPhoneNumber} placeholder="622 20 13 62" />
        </Stack>
        <Typography variant="caption" color="text.secondary">
          Pays : Guinée · Format local à 9 chiffres
        </Typography>
      </Stack>

      <Button
        size="large"
        variant="contained"
        onClick={handleContinue}
        disabled={!isValid}
        sx={{ maxWidth: 395, alignSelf: 'center', width: '100%' }}
      >
        Continuer
      </Button>
    </Box>
  );
};
