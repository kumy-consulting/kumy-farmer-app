import { useState, type FC, type ChangeEvent } from 'react';

import { Capacitor } from '@capacitor/core';
import { Box, InputBase } from '@mui/material';
import { styled } from '@mui/material/styles';

import { formatPhoneNumber, unformat } from '@/features/Auth/phone.util';

interface PhoneNumberInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const InputContainer = styled(Box)({
  flex: 1,
  display: 'flex',
  alignItems: 'center',
  padding: '10px 16px',
  background: 'transparent',
});

const StyledInput = styled(InputBase)({
  flex: 1,
  fontFamily: "'Ubuntu', sans-serif",
  fontSize: 18,
  fontWeight: 600,
  letterSpacing: '0.04em',
  color: 'rgba(20,40,35,0.92)',
  fontVariantNumeric: 'tabular-nums',
  '& input': {
    padding: 0,
    '&::placeholder': {
      color: 'rgba(55,75,70,0.42)',
      opacity: 1,
      fontWeight: 400,
      letterSpacing: '0.06em',
    },
  },
});

export const PhoneNumberInput: FC<PhoneNumberInputProps> = ({ value, onChange, placeholder = '622 20 13 62' }) => {
  const [displayValue, setDisplayValue] = useState(formatPhoneNumber(value));
  // Astuce anti-saisie-auto (WEB uniquement) : le champ est en lecture seule au
  // parse du formulaire (Chrome ne propose alors aucune suggestion), puis devient
  // éditable au focus. EN NATIF (WebView Capacitor), on N'active PAS ce truc :
  // taper sur un input readOnly n'ouvre pas le clavier et le focus ne se déclenche
  // pas → la saisie resterait bloquée. Champ éditable d'emblée.
  const [isReadOnly, setIsReadOnly] = useState(!Capacitor.isNativePlatform());

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const unformatted = unformat(inputValue).slice(0, 9);
    const formatted = formatPhoneNumber(inputValue);

    setDisplayValue(formatted);
    onChange(unformatted);
  };

  return (
    <InputContainer>
      <StyledInput
        value={displayValue}
        onChange={handleChange}
        placeholder={placeholder}
        readOnly={isReadOnly}
        onFocus={() => setIsReadOnly(false)}
        autoComplete="off"
        name="agripilot-phone-local"
        inputProps={{
          'aria-label': 'Phone number',
          inputMode: 'tel',
          type: 'tel',
          name: 'agripilot-phone-local',
          autoComplete: 'off',
          autoCorrect: 'off',
          autoCapitalize: 'off',
          spellCheck: false,
          'data-lpignore': 'true',
          'data-form-type': 'other',
          'data-1p-ignore': 'true',
          enterKeyHint: 'done',
        }}
      />
    </InputContainer>
  );
};
