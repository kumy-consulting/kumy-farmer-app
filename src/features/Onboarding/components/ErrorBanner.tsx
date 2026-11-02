import type { FunctionComponent, ReactNode } from 'react';

import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded';
import { Box } from '@mui/material';
import { keyframes, styled } from '@mui/material/styles';

/**
 * Bandeau d'erreur inline du parcours onboarding/auth : pastille douce teintée
 * rouge + icône, entrée en fondu et léger tremblement pour signaler l'échec.
 * Aligné sur l'esthétique PWA (teintes translucides, radius 12, Ubuntu).
 */
const errorIn = keyframes`
  0% { opacity: 0; transform: translateY(6px); }
  100% { opacity: 1; transform: translateY(0); }
`;

const shake = keyframes`
  10%, 90% { transform: translateX(-2px); }
  20%, 80% { transform: translateX(3px); }
  30%, 50%, 70% { transform: translateX(-4px); }
  40%, 60% { transform: translateX(4px); }
`;

const Banner = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  width: '100%',
  maxWidth: 395,
  padding: '11px 16px',
  borderRadius: 12,
  background: 'linear-gradient(135deg, rgba(222,55,48,0.10) 0%, rgba(186,26,26,0.07) 100%)',
  border: '1px solid rgba(186,26,26,0.22)',
  boxShadow: '0 4px 14px rgba(186,26,26,0.10)',
  color: '#B3261E',
  fontFamily: "'Ubuntu', sans-serif",
  fontSize: 12.75,
  fontWeight: 600,
  lineHeight: 1.35,
  letterSpacing: '0.01em',
  textAlign: 'center',
  animation: `${errorIn} 0.28s cubic-bezier(0.22, 0.61, 0.36, 1) both, ${shake} 0.45s cubic-bezier(0.36, 0.07, 0.19, 0.97) 0.1s`,
  '& svg': {
    fontSize: 19,
    flexShrink: 0,
    color: '#DE3730',
  },
  '@media (prefers-reduced-motion: reduce)': {
    animation: `${errorIn} 0.2s ease both`,
  },
});

interface ErrorBannerProps {
  children: ReactNode;
  /** Marge inférieure (unités MUI, ×8px). */
  mb?: number;
}

export const ErrorBanner: FunctionComponent<ErrorBannerProps> = ({ children, mb }) => (
  <Banner role="alert" sx={mb !== undefined ? { mb } : undefined}>
    <ErrorOutlineRoundedIcon />
    <span>{children}</span>
  </Banner>
);
