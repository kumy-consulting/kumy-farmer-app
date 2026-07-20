import type { FunctionComponent } from 'react';

import { primary } from '@/theme/colors';

// Icônes SVG inline portées depuis agripilot-pwa/src/features/Onboarding/components/OnboardingIcons.tsx
// (sous-ensemble effectivement consommé par le parcours invité).
const TEAL = primary[50];
const TEAL_LIGHT = primary[98];

export const UserCheckIcon: FunctionComponent = () => (
  <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
    <circle cx="24" cy="24" r="23" stroke={TEAL} strokeWidth="2" fill={TEAL_LIGHT} />
    <circle cx="24" cy="18" r="6" stroke={TEAL} strokeWidth="2" fill="none" />
    <path
      d="M14 36c0-5.523 4.477-10 10-10s10 4.477 10 10"
      stroke={TEAL}
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
    />
    <path d="M30 28l3 3 5-5" stroke={TEAL} strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const InfoIcon: FunctionComponent = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <circle cx="9" cy="9" r="8" fill={TEAL} />
    <path d="M9 8v5M9 5.5v.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

export const CheckCircleIcon: FunctionComponent = () => (
  <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
    <circle cx="32" cy="32" r="30" fill={TEAL_LIGHT} stroke={TEAL} strokeWidth="2" />
    <path d="M20 32l8 8 16-16" stroke={TEAL} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
