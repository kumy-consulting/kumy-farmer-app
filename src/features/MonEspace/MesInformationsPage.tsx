import type { FunctionComponent } from 'react';

import { Box, Stack, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';

import { BackButton } from '@/shared/components/BackButton';

import { BlocInformations } from './components/BlocInformations';
import { useProfilAgriculteur } from './useProfilAgriculteur';

/**
 * La fiche personnelle, sortie de l'onglet : elle se consulte, elle ne se
 * parcourt pas. La laisser dans le flux de « Mon espace » obligeait à traverser
 * douze lignes d'état civil pour atteindre les réglages, alors qu'on n'ouvre sa
 * fiche que rarement — pour vérifier un numéro, montrer sa pièce à un guichet.
 *
 * On y entre par la carte d'agriculteur : toucher son identité pour voir sa
 * fiche est le geste que les gens tentent d'eux-mêmes.
 *
 * **Pas de bandeau coloré.** Une barre verte pleine largeur ne portait qu'un
 * titre : sur un téléphone à encoche, l'essentiel de sa hauteur était du
 * safe-area, c'est-à-dire du vert vide sous les icônes du système. Les autres
 * écrans de détail — parcelle, domaine — posent un simple bouton rond blanc sur
 * la surface de la page ; cet écran suit la même règle, et l'espace du haut
 * redevient une marge au lieu d'un bloc.
 *
 * Le titre est posé en clair à côté du bouton : la carte d'agriculteur reste
 * sur « Mon espace », où l'on vient de la toucher, et n'a pas à être recopiée
 * ici. Sans elle, c'est le titre qui doit tenir le haut de l'écran — d'où un
 * vrai corps de titre, et non un fil d'Ariane en petites capitales.
 */
export const MesInformationsPage: FunctionComponent = () => {
  const navigate = useNavigate();
  const { profil, isLoading } = useProfilAgriculteur();

  return (
    <Box
      sx={{
        minHeight: '100dvh',
        background: 'linear-gradient(180deg, #F3FFFA 0%, #F0F1EF 100%)',
        px: 2.5,
        pt: 'max(calc(env(safe-area-inset-top, 0px) + 14px), 46px)',
        pb: 4,
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2.25 }}>
        <BackButton onClick={() => navigate('/mon-espace')} label="Retour à Mon espace" />

        <Typography
          component="h1"
          sx={{
            fontFamily: "'Ubuntu', sans-serif",
            fontSize: 19,
            fontWeight: 700,
            letterSpacing: '0.005em',
            color: '#1A1C1B',
            minWidth: 0,
            m: 0,
          }}
          noWrap
        >
          Mes informations
        </Typography>
      </Stack>

      <BlocInformations profil={profil} isLoading={isLoading} />
    </Box>
  );
};
