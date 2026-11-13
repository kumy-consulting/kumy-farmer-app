import { Capacitor } from '@capacitor/core';
import { createBrowserRouter, createHashRouter, Navigate } from 'react-router-dom';

import { PhoneEntryPage } from '@/features/Auth/pages/PhoneEntryPage';
import { PinEntryPage } from '@/features/Auth/pages/PinEntryPage';
import { BonnesPratiquesPage } from '@/features/BonnesPratiques/BonnesPratiquesPage';
import { DomaineDetailPage } from '@/features/Domaines/DomaineDetailPage';
import { DomainesPage } from '@/features/Domaines/DomainesPage';
import { HomePage } from '@/features/Home/HomePage';
import { MesInformationsPage } from '@/features/MonEspace/MesInformationsPage';
import { MonEspacePage } from '@/features/MonEspace/MonEspacePage';
import { InvitationCodePage } from '@/features/Onboarding/pages/InvitationCodePage';
import { InvitedWelcomePage } from '@/features/Onboarding/pages/InvitedWelcomePage';
import { OnboardingPinPage } from '@/features/Onboarding/pages/OnboardingPinPage';
import { OnboardingProfilePage } from '@/features/Onboarding/pages/OnboardingProfilePage';
import { OnboardingSuccessPage } from '@/features/Onboarding/pages/OnboardingSuccessPage';
import { WelcomeChoicePage } from '@/features/Onboarding/pages/WelcomeChoicePage';
import { ParcelDetailPage } from '@/features/Parcelle/ParcelDetailPage';
import { QuestionnaireProfilPage } from '@/features/Profil/QuestionnaireProfilPage';
import { RegisterAddressPage } from '@/features/Register/pages/RegisterAddressPage';
import { RegisterCodePage } from '@/features/Register/pages/RegisterCodePage';
import { RegisterKnownAccountPage } from '@/features/Register/pages/RegisterKnownAccountPage';
import { RegisterPhonePage } from '@/features/Register/pages/RegisterPhonePage';
import { RegisterPinPage } from '@/features/Register/pages/RegisterPinPage';
import { RegisterProfilePage } from '@/features/Register/pages/RegisterProfilePage';
import { RegisterResultPage } from '@/features/Register/pages/RegisterResultPage';
import { RegisterSuspendedPage } from '@/features/Register/pages/RegisterSuspendedPage';
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
  // Ancienne adresse de l'écran « Bientôt disponible » : elle a pu être mise en
  // favori ou partagée. On la fait mener au parcours réel plutôt qu'au repli.
  { path: '/onboarding/register/phone', element: <Navigate to="/inscription/telephone" replace /> },

  { path: '/inscription/telephone', element: <RegisterPhonePage /> },
  { path: '/inscription/code', element: <RegisterCodePage /> },
  { path: '/inscription/deja-inscrit', element: <RegisterKnownAccountPage /> },
  { path: '/inscription/suspendu', element: <RegisterSuspendedPage /> },
  { path: '/inscription/profil', element: <RegisterProfilePage /> },
  { path: '/inscription/adresse', element: <RegisterAddressPage /> },
  { path: '/inscription/code-confidentiel', element: <RegisterPinPage /> },
  { path: '/inscription/resultat', element: <RegisterResultPage /> },
  /**
   * Les bonnes pratiques vivent SOUS `ProtectedRoute` mais HORS d'`AppLayout`.
   *
   * `AppLayout` court-circuite l'`Outlet` pour un compte encore sans domaine :
   * il rend l'écran d'attente à la place. Placée parmi ses enfants, cette route
   * serait donc inatteignable pour ceux à qui elle s'adresse d'abord — un
   * agriculteur qui attend son technicien et à qui on n'a rien d'autre à lire.
   */
  {
    path: '/bonnes-pratiques',
    element: (
      <ProtectedRoute>
        <BonnesPratiquesPage />
      </ProtectedRoute>
    ),
  },
  /**
   * Même raison qu'au-dessus : le questionnaire de profil s'adresse d'abord au
   * compte encore sans domaine, exactement celui pour qui `AppLayout` rend
   * l'écran d'attente à la place de l'`Outlet`.
   */
  {
    path: '/mon-profil/completer',
    element: (
      <ProtectedRoute>
        <QuestionnaireProfilPage />
      </ProtectedRoute>
    ),
  },

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
      /* `/mon-espace/credit` et `/mon-espace/score` sont retirées : les deux
         pages n'affichaient que `monEspace.demo`. Aucune tuile n'y menait
         depuis que `BlocOutils` a été éteint, mais la route restait ouverte —
         un lien profond, un retour arrière ou un historique suffisaient à
         montrer à un agriculteur un potentiel de crédit et un score inventés.
         Les composants sont conservés ; on les rebranche ici le jour où les
         endpoints de scoring répondent pour de vrai. */
    ],
  },
  { path: '*', element: <Navigate to="/welcome" replace /> },
]);
