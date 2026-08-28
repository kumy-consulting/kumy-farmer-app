import type { FunctionComponent } from 'react';

import { Box } from '@mui/material';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';

import { BienvenuePage } from '@/features/Home/BienvenuePage';
import { useCompteNouveau } from '@/features/Home/useCompteNouveau';
import { ModaleInvitationProfil } from '@/features/Profil/ModaleInvitationProfil';
import { useInvitationProfil } from '@/features/Profil/useInvitationProfil';
import { BottomNav, NAV_HEIGHT } from '@/shared/components/BottomNav';
import { ErrorBoundary } from '@/shared/components/ErrorBoundary';

/**
 * Les écrans qu'un compte encore sans domaine peut atteindre malgré le
 * court-circuit ci-dessous.
 *
 * Sa fiche personnelle en fait partie : elle ne lit que `GET /farmers/me`, donc
 * elle a le même contenu avec ou sans exploitation, et l'écran d'attente offre
 * un bouton pour l'ouvrir. Sans cette porte, ce bouton ramènerait à l'écran
 * d'attente — un bouton qui ne fait rien.
 */
const PORTES_COMPTE_SANS_DOMAINE = ['/mon-espace/informations'];

/**
 * Coquille des écrans authentifiés : rend l'onglet courant (`Outlet`) au-dessus
 * de la barre de navigation basse Kumy, en réservant l'espace du dock + safe-area.
 *
 * Sauf pour un compte auto-inscrit que personne n'a encore adopté : il n'a ni
 * domaine ni technicien, les quatre onglets mèneraient à des écrans vides. Il
 * reçoit alors un écran de bienvenue unique, sans barre de navigation — et,
 * pour les quelques adresses qui gardent un sens sans exploitation, la page
 * demandée, toujours sans barre.
 */
export const AppLayout: FunctionComponent = () => {
  const { estNouveau, aDesDomaines, isLoading } = useCompteNouveau();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { ouverte, fermer } = useInvitationProfil({ aDesDomaines, isLoading });

  // `/mon-profil/completer` n'a pas sa place dans `PORTES_COMPTE_SANS_DOMAINE` :
  // cette route vit hors d'`AppLayout` (voir `shared/routes/index.tsx`, à côté de
  // `/bonnes-pratiques`), donc son `Outlet` ne passe jamais par cette coquille —
  // l'y ajouter n'aurait changé aucun rendu.
  const completerProfil = () => {
    fermer();
    navigate('/mon-profil/completer');
  };

  // Ni squelette ni écran vide pendant la résolution : afficher la barre puis la
  // retirer produirait un clignotement au premier rendu de chaque session.
  if (isLoading) return null;

  if (estNouveau) {
    return (
      <ErrorBoundary>
        {PORTES_COMPTE_SANS_DOMAINE.includes(pathname) ? <Outlet /> : <BienvenuePage />}
        <ModaleInvitationProfil ouverte={ouverte} onFermer={fermer} onCompleter={completerProfil} />
      </ErrorBoundary>
    );
  }

  return (
    <Box sx={{ minHeight: '100dvh', position: 'relative' }}>
      <Box sx={{ pb: `calc(${NAV_HEIGHT}px + env(safe-area-inset-bottom, 0px))` }}>
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </Box>
      <BottomNav />
      <ModaleInvitationProfil ouverte={ouverte} onFermer={fermer} onCompleter={completerProfil} />
    </Box>
  );
};
