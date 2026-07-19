import type { FC } from 'react';

import { Box, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';

import flagGuinea from '@/assets/icons/flag-guinea.svg';

interface CountryCodeSelectorProps {
  countryCode: string;
  onClick?: () => void;
}

const CodeContainer = styled(Box)({
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '10px 14px 10px 10px',
  borderRadius: 14,
  background: 'linear-gradient(135deg, rgba(1,134,117,0.08) 0%, rgba(1,134,117,0.03) 100%)',
  border: '0.5px solid rgba(1,134,117,0.14)',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  flexShrink: 0,
  '&:hover': {
    background: 'linear-gradient(135deg, rgba(1,134,117,0.14) 0%, rgba(1,134,117,0.05) 100%)',
    borderColor: 'rgba(1,134,117,0.28)',
  },
  '&:active': {
    transform: 'scale(0.98)',
  },
  '&::after': {
    content: '""',
    position: 'absolute',
    right: -4,
    top: '22%',
    bottom: '22%',
    width: 1,
    background: 'linear-gradient(180deg, transparent, rgba(55,75,70,0.14), transparent)',
  },
});

const FlagPill = styled(Box)({
  position: 'relative',
  width: 26,
  height: 26,
  borderRadius: '50%',
  overflow: 'hidden',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: '#FFFFFF',
  boxShadow: '0 2px 6px rgba(55,75,70,0.14), 0 0 0 1.5px rgba(255,255,255,0.9), 0 0 0 2px rgba(1,134,117,0.22)',
  flexShrink: 0,
});

const FlagIcon = styled('img')({
  width: '100%',
  height: '100%',
  objectFit: 'cover',
});

const CodeText = styled(Typography)({
  fontFamily: "'Ubuntu', sans-serif",
  fontSize: 17,
  fontWeight: 700,
  letterSpacing: '0.01em',
  lineHeight: 1,
  color: '#014c41',
  fontVariantNumeric: 'tabular-nums',
});

export const CountryCodeSelector: FC<CountryCodeSelectorProps> = ({ countryCode, onClick }) => {
  return (
    <CodeContainer onClick={onClick}>
      <FlagPill>
        <FlagIcon src={flagGuinea} alt="Guinea" />
      </FlagPill>
      <CodeText>{countryCode}</CodeText>
    </CodeContainer>
  );
};
