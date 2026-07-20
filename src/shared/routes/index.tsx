import { createBrowserRouter, Navigate } from 'react-router-dom';

import { PhoneEntryPage } from '@/features/Auth/pages/PhoneEntryPage';
import { PinEntryPage } from '@/features/Auth/pages/PinEntryPage';
import { HomePage } from '@/features/Home/HomePage';
import { InvitationCodePage } from '@/features/Onboarding/pages/InvitationCodePage';
import { InvitedWelcomePage } from '@/features/Onboarding/pages/InvitedWelcomePage';
import { OnboardingPinPage } from '@/features/Onboarding/pages/OnboardingPinPage';
import { OnboardingSuccessPage } from '@/features/Onboarding/pages/OnboardingSuccessPage';
import { RegisterComingSoonPage } from '@/features/Onboarding/pages/RegisterComingSoonPage';
import { WelcomeChoicePage } from '@/features/Onboarding/pages/WelcomeChoicePage';
import { ProtectedRoute } from '@/shared/components/ProtectedRoute';

export const router = createBrowserRouter([
  { path: '/welcome', element: <WelcomeChoicePage /> },
  { path: '/auth/phone-entry', element: <PhoneEntryPage /> },
  { path: '/auth/pin-entry', element: <PinEntryPage /> },
  { path: '/onboarding/invitation', element: <InvitationCodePage /> },
  { path: '/onboarding/welcome', element: <InvitedWelcomePage /> },
  { path: '/onboarding/pin', element: <OnboardingPinPage /> },
  { path: '/onboarding/success', element: <OnboardingSuccessPage /> },
  { path: '/onboarding/register/phone', element: <RegisterComingSoonPage /> },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <HomePage />
      </ProtectedRoute>
    ),
  },
  { path: '*', element: <Navigate to="/welcome" replace /> },
]);
