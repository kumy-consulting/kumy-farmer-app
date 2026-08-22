import { Capacitor } from '@capacitor/core';
import { createBrowserRouter, createHashRouter, Navigate } from 'react-router-dom';

import { PhoneEntryPage } from '@/features/Auth/pages/PhoneEntryPage';
import { PinEntryPage } from '@/features/Auth/pages/PinEntryPage';
import { DomaineDetailPage } from '@/features/Domaines/DomaineDetailPage';
import { DomainesPage } from '@/features/Domaines/DomainesPage';
import { HomePage } from '@/features/Home/HomePage';
import { MesInformationsPage } from '@/features/MonEspace/MesInformationsPage';
import { MonCreditPage } from '@/features/MonEspace/MonCreditPage';
import { MonEspacePage } from '@/features/MonEspace/MonEspacePage';
import { MonScorePage } from '@/features/MonEspace/MonScorePage';
import { InvitationCodePage } from '@/features/Onboarding/pages/InvitationCodePage';
import { InvitedWelcomePage } from '@/features/Onboarding/pages/InvitedWelcomePage';
import { OnboardingPinPage } from '@/features/Onboarding/pages/OnboardingPinPage';
import { OnboardingProfilePage } from '@/features/Onboarding/pages/OnboardingProfilePage';
import { OnboardingSuccessPage } from '@/features/Onboarding/pages/OnboardingSuccessPage';
import { RegisterComingSoonPage } from '@/features/Onboarding/pages/RegisterComingSoonPage';
import { WelcomeChoicePage } from '@/features/Onboarding/pages/WelcomeChoicePage';
import { ParcelDetailPage } from '@/features/Parcelle/ParcelDetailPage';
import { AppLayout } from '@/shared/components/AppLayout';
import { ProtectedRoute } from '@/shared/components/ProtectedRoute';

/**
 * En natif, l'app est servie par le serveur local de Capacitor depuis
 * `https://localhost`. Le routage par hash supprime toute dépendance à un repli
 * `index.html` côté serveur, y compris quand le WebView est rechargé sur une
 * route profonde après une mise en arrière-plan.
 *
 * Le web garde `createBrowserRouter` : basculer tout le monde en hash changerait
 * les URLs du PWA déjà déployé sur Firebase Hosting et casserait les liens
 * existants.
 */
const createRouter = Capacitor.isNativePlatform() ? createHashRouter : createBrowserRouter;

export const router = createRouter([
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
      { path: '/domaines/:id', element: <DomaineDetailPage /> },
      { path: '/domaines/:id/parcelles/:parcelId', element: <ParcelDetailPage /> },
      { path: '/mon-espace', element: <MonEspacePage /> },
      { path: '/mon-espace/informations', element: <MesInformationsPage /> },
      { path: '/mon-espace/credit', element: <MonCreditPage /> },
      { path: '/mon-espace/score', element: <MonScorePage /> },
    ],
  },
  { path: '*', element: <Navigate to="/welcome" replace /> },
]);
