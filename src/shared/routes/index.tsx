import { createBrowserRouter, Navigate } from 'react-router-dom';

import { PhoneEntryPage } from '@/features/Auth/pages/PhoneEntryPage';
import { PinEntryPage } from '@/features/Auth/pages/PinEntryPage';
import { HomePage } from '@/features/Home/HomePage';
import { WelcomeChoicePage } from '@/features/Onboarding/pages/WelcomeChoicePage';
import { ProtectedRoute } from '@/shared/components/ProtectedRoute';

export const router = createBrowserRouter([
  { path: '/welcome', element: <WelcomeChoicePage /> },
  { path: '/auth/phone-entry', element: <PhoneEntryPage /> },
  { path: '/auth/pin-entry', element: <PinEntryPage /> },
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
