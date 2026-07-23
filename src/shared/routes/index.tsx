import { createBrowserRouter, Navigate } from 'react-router-dom';

import { PhoneEntryPage } from '@/features/Auth/pages/PhoneEntryPage';
import { PinEntryPage } from '@/features/Auth/pages/PinEntryPage';
import { DomainesPage } from '@/features/Domaines/DomainesPage';
import { HomePage } from '@/features/Home/HomePage';
import { MonEspacePage } from '@/features/MonEspace/MonEspacePage';
import { InvitationCodePage } from '@/features/Onboarding/pages/InvitationCodePage';
import { InvitedWelcomePage } from '@/features/Onboarding/pages/InvitedWelcomePage';
import { OnboardingPinPage } from '@/features/Onboarding/pages/OnboardingPinPage';
import { OnboardingProfilePage } from '@/features/Onboarding/pages/OnboardingProfilePage';
import { OnboardingSuccessPage } from '@/features/Onboarding/pages/OnboardingSuccessPage';
import { RegisterComingSoonPage } from '@/features/Onboarding/pages/RegisterComingSoonPage';
import { WelcomeChoicePage } from '@/features/Onboarding/pages/WelcomeChoicePage';
import { AppLayout } from '@/shared/components/AppLayout';
import { ProtectedRoute } from '@/shared/components/ProtectedRoute';

export const router = createBrowserRouter([
  { path: '/welcome', element: <WelcomeChoicePage /> },
  { path: '/auth/phone-entry', element: <PhoneEntryPage /> },
  { path: '/auth/pin-entry', element: <PinEntryPage /> },
  { path: '/onboarding/invitation', element: <InvitationCodePage /> },
  { path: '/onboarding/welcome', element: <InvitedWelcomePage /> },
  { path: '/onboarding/profile', element: <OnboardingProfilePage /> },
  { path: '/onboarding/pin', element: <OnboardingPinPage /> },
  { path: '/onboarding/success', element: <OnboardingSuccessPage /> },
  { path: '/onboarding/register/phone', element: <RegisterComingSoonPage /> },
  {
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/domaines', element: <DomainesPage /> },
      { path: '/mon-espace', element: <MonEspacePage /> },
    ],
  },
  { path: '*', element: <Navigate to="/welcome" replace /> },
]);
