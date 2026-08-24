import type { FunctionComponent } from 'react';

import { Box, Stack, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';

import { useAuthStore } from '@/shared/stores/authStore';
import { error } from '@/theme/colors';

import { BlocOutils } from './components/BlocOutils';
import { BlocReglages } from './components/BlocReglages';
import { CarteAgriculteur } from './components/CarteAgriculteur';
import { SectionTitle } from './components/espaceUi';
import { demoEligibilite, demoProfil, demoScore } from './monEspace.demo';

/**
 * ⚠️ MAQUETTE — aucun appel réseau n'est branché, tout vient de `monEspace.demo`.
 *
 * L'onglet répond à une question : « qui la plateforme pense que je suis, et
 * qu'est-ce que ça m'ouvre ». D'où l'ordre : la carte d'agriculteur, puis le
 * versant économique qui en découle, et seulement ensuite la plomberie.
 *
 * `BlocCredit` et `BlocScore` ne sont pas supprimés : ils portent le détail
 * (critères manqués, six piliers) et attendent les écrans de détail sur
 * lesquels les tuiles ouvriront.
 *
 * Les trois endpoints qui alimenteront ces blocs sont déjà ouverts au rôle
 * FARMER et ne sont appelés nulle part aujourd'hui :
 *   GET /scoring/farmers/:id/profile
 *   GET /scoring/farmers/:id
 *   GET /scoring/farmers/:id/credit-eligibility
 */
export const MonEspacePage: FunctionComponent = () => {
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  return (
    <Box sx={{ minHeight: '100dvh', background: 'linear-gradient(180deg, #F3FFFA 0%, #F0F1EF 100%)' }}>
      <CarteAgriculteur profil={demoProfil} onOuvrirInformations={() => navigate('/mon-espace/informations')} />

      <Stack spacing={3.5} sx={{ px: 2.5, pt: 2.5, pb: 3 }}>
        <BlocOutils eligibilite={demoEligibilite} score={demoScore} />

        <BlocReglages />

        <Box>
          <SectionTitle>Compte</SectionTitle>
          {/* Le bouton EST la surface : plus de carte blanche autour, plus
              d'icône, plus d'alignement à gauche. Il ne partage sa section avec
              rien, il peut donc prendre toute la largeur et se centrer.

              Rouge pâle plutôt que rouge plein : se déconnecter n'est pas
              destructeur — rien n'est perdu, on se reconnecte au téléphone et au
              PIN. Un bouton rouge saturé crierait un danger qui n'existe pas ;
              un rouge sourd dit « attention, pas anodin » et s'arrête là. */}
          <Box
            component="button"
            type="button"
            onClick={() => void logout()}
            sx={{
              appearance: 'none',
              border: '1px solid rgba(186,26,26,0.14)',
              font: 'inherit',
              cursor: 'pointer',
              display: 'block',
              width: '100%',
              minHeight: 52,
              px: 2,
              borderRadius: '16px',
              background: 'linear-gradient(180deg, #FDEDED 0%, #FBDDDD 100%)',
              fontFamily: "'Ubuntu', sans-serif",
              fontSize: 15,
              fontWeight: 700,
              color: error[40],
              transition: 'filter 0.2s ease',
              '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
              '&:active': { filter: 'brightness(0.97)' },
              '&:focus-visible': { outline: `2px solid ${error[40]}`, outlineOffset: 3 },
            }}
          >
            Se déconnecter
          </Box>
          {/* La version vient de `package.json` via `__APP_VERSION__` : une
              chaîne écrite à la main finit toujours par mentir. */}
          <Typography
            sx={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: '#8F9291',
              mt: 1.5,
              textAlign: 'center',
            }}
          >
            AgriPilot · v{__APP_VERSION__}
          </Typography>
        </Box>
      </Stack>
    </Box>
  );
};
