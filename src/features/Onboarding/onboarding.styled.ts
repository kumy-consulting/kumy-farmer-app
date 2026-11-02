import { Box, Button, Stack, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';

/**
 * Composants stylés partagés du parcours onboarding — repris fidèlement du
 * design system de `agripilot-pwa` (Auth/PhoneEntry) : fond dégradé clair +
 * halos teal, medallion à anneau tournant, eyebrow, titres, CTA en dégradé teal.
 *
 * À garder synchronisé avec la PWA (cible : package partagé `@agripilot/core`).
 * Consommés par `WelcomeChoicePage`, `InvitationCodePage`, etc.
 */

export const OnboardingPage = styled(Stack)({
  minHeight: '100dvh',
  background: 'linear-gradient(180deg, #FAFBF8 0%, #F4F7F2 55%, #EEF3EA 100%)',
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'fixed',
    inset: 0,
    pointerEvents: 'none',
    background:
      'radial-gradient(680px 440px at 100% -5%, rgba(1,134,117,0.12), transparent 60%), radial-gradient(560px 360px at -5% 75%, rgba(1,134,117,0.08), transparent 65%)',
    zIndex: 0,
  },
});

export const OnboardingContent = styled(Stack)({
  flex: 1,
  alignItems: 'center',
  justifyContent: 'center',
  overflowY: 'auto',
  padding: '56px 24px 32px',
  position: 'relative',
  zIndex: 1,
});

export const Medallion = styled(Box)({
  position: 'relative',
  width: 92,
  height: 92,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '50%',
  marginBottom: 24,
  background: 'radial-gradient(circle at 30% 25%, #FFFFFF 0%, #F7FBF6 55%, #EEF4EA 100%)',
  border: '1px solid rgba(1,134,117,0.18)',
  boxShadow: '0 14px 32px rgba(1,134,117,0.20), 0 2px 0 rgba(255,255,255,0.9) inset',
  '&::before': {
    content: '""',
    position: 'absolute',
    inset: '-14%',
    borderRadius: '50%',
    background:
      'radial-gradient(circle, rgba(1,134,117,0.22) 0%, rgba(1,134,117,0.06) 45%, transparent 72%)',
    filter: 'blur(6px)',
    zIndex: -1,
  },
  '&::after': {
    content: '""',
    position: 'absolute',
    inset: '-6%',
    borderRadius: '50%',
    border: '1px dashed rgba(1,134,117,0.30)',
    animation: 'ringSpin 60s linear infinite',
  },
  '@keyframes ringSpin': {
    '0%': { transform: 'rotate(0deg)' },
    '100%': { transform: 'rotate(360deg)' },
  },
  '@media (prefers-reduced-motion: reduce)': {
    '&::after': { animation: 'none' },
  },
  '& svg': {
    fontSize: 40,
    color: '#016557',
  },
});

export const Eyebrow = styled(Box)({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 10,
  marginBottom: 8,
  fontFamily: "'Ubuntu', sans-serif",
  fontSize: '10.5px',
  fontWeight: 700,
  color: '#018675',
  letterSpacing: '0.22em',
  textTransform: 'uppercase',
  '&::before, &::after': {
    content: '""',
    width: 22,
    height: 1,
    background: 'linear-gradient(90deg, transparent, rgba(1,134,117,0.55), transparent)',
  },
});

export const Title = styled(Typography)(({ theme }) => ({
  fontFamily: "'Ubuntu', sans-serif",
  fontSize: 26,
  fontWeight: 700,
  color: theme.palette.text.primary,
  letterSpacing: '-0.02em',
  lineHeight: 1.2,
  marginBottom: 10,
  textAlign: 'center',
}));

export const Subtitle = styled(Typography)({
  fontFamily: "'Ubuntu', sans-serif",
  fontSize: 13.5,
  fontWeight: 400,
  letterSpacing: '0.005em',
  lineHeight: 1.5,
  color: 'rgba(55,75,70,0.68)',
  textAlign: 'center',
  maxWidth: 300,
  marginBottom: 40,
});

export const FieldCapsule = styled(Stack)({
  width: '100%',
  maxWidth: 395,
  flexDirection: 'row',
  alignItems: 'stretch',
  padding: 6,
  gap: 6,
  borderRadius: 18,
  background: 'linear-gradient(135deg, rgba(255,255,255,0.96) 0%, rgba(250,251,247,0.96) 100%)',
  border: '1px solid rgba(55,75,70,0.08)',
  boxShadow: '0 6px 20px rgba(1,134,117,0.08), 0 1px 0 rgba(255,255,255,0.85) inset',
  transition: 'all 0.25s ease',
  '&:focus-within': {
    borderColor: 'rgba(1,134,117,0.38)',
    boxShadow:
      '0 10px 28px rgba(1,134,117,0.18), 0 0 0 4px rgba(1,134,117,0.10), 0 1px 0 rgba(255,255,255,0.9) inset',
  },
});

export const HelpRow = styled(Box)({
  minHeight: 20,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 6,
  fontFamily: "'Ubuntu', sans-serif",
  fontSize: 11.5,
  fontWeight: 500,
  letterSpacing: '0.02em',
  color: 'rgba(55,75,70,0.52)',
  textAlign: 'center',
  '& span': {
    color: '#018675',
    fontWeight: 700,
  },
});

export const PhoneChip = styled(Box)({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '6px 14px',
  borderRadius: 999,
  background: 'rgba(1,134,117,0.08)',
  border: '1px solid rgba(1,134,117,0.16)',
  fontFamily: "'Ubuntu', sans-serif",
  fontSize: 13.5,
  fontWeight: 700,
  letterSpacing: '0.02em',
  color: '#016557',
  fontVariantNumeric: 'tabular-nums',
});

export const PrimaryButton = styled(Button)({
  width: '100%',
  maxWidth: 395,
  height: 56,
  background: 'linear-gradient(135deg, #018675 0%, #016557 100%)',
  color: '#FFFFFF',
  borderRadius: 16,
  fontSize: 15,
  fontWeight: 600,
  fontFamily: "'Ubuntu', sans-serif",
  letterSpacing: '0.02em',
  textTransform: 'none',
  boxShadow: '0 10px 24px rgba(1,134,117,0.32), 0 1px 0 rgba(255,255,255,0.2) inset',
  transition: 'all 0.2s ease',
  '&:hover': {
    background: 'linear-gradient(135deg, #017566 0%, #014c41 100%)',
    boxShadow: '0 12px 28px rgba(1,134,117,0.42)',
  },
  '&:active': { transform: 'scale(0.985)' },
  '&:disabled': {
    background: 'rgba(1,134,117,0.14)',
    color: 'rgba(1,134,117,0.50)',
    boxShadow: 'none',
  },
});

export const OutlinedButton = styled(Button)({
  width: '100%',
  maxWidth: 395,
  height: 56,
  background: 'rgba(255,255,255,0.55)',
  color: '#016557',
  border: '1.5px solid rgba(1,134,117,0.35)',
  borderRadius: 16,
  fontSize: 15,
  fontWeight: 600,
  fontFamily: "'Ubuntu', sans-serif",
  letterSpacing: '0.02em',
  textTransform: 'none',
  boxShadow: '0 4px 14px rgba(1,134,117,0.06)',
  transition: 'all 0.2s ease',
  '&:hover': {
    background: 'rgba(1,134,117,0.06)',
    borderColor: 'rgba(1,134,117,0.55)',
  },
  '&:active': { transform: 'scale(0.985)' },
});

export const TextLink = styled(Button)({
  fontFamily: "'Ubuntu', sans-serif",
  fontSize: 13.5,
  fontWeight: 600,
  textTransform: 'none',
  color: '#018675',
  letterSpacing: '0.01em',
  '&:hover': { background: 'transparent', color: '#016557' },
});
