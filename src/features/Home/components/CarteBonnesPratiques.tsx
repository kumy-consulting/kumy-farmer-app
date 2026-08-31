import type { FunctionComponent } from 'react';

import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import { Box, Stack, Typography } from '@mui/material';

import { IllustrationSujet } from '@/features/BonnesPratiques/components/IllustrationSujet';

interface CarteBonnesPratiquesProps {
  onOuvrir: () => void;
}

/**
 * La porte vers les bonnes pratiques, sur l'écran d'attente.
 *
 * Voisine de `CarteEtudeDeSol`, mais d'une autre nature, et la forme le dit :
 * l'étude de sol est un GESTE — elle part si l'agriculteur la demande, et son
 * bouton disparaît une fois la demande envoyée. Les bonnes pratiques sont une
 * PORTE : rien ne se déclenche, on entre. D'où la flèche plutôt qu'un bouton,
 * et la carte entière cliquable — viser une flèche de 38 px au pouce, sur un
 * téléphone tenu d'une main dans un champ, ne va pas de soi.
 */
export const CarteBonnesPratiques: FunctionComponent<CarteBonnesPratiquesProps> = ({ onOuvrir }) => (
  <Box
    component="button"
    type="button"
    onClick={onOuvrir}
    sx={{
      display: 'flex',
      alignItems: 'center',
      gap: 1.5,
      width: '100%',
      mt: 'clamp(9px, 1.8vh, 24px)',
      py: 'clamp(7px, 1vh, 10px)',
      px: 1.25,
      borderRadius: '16px',
      // Tuile teintée plutôt que carte bordée : la feuille est déjà blanche, un
      // cadre blanc sur blanc ne separait rien et coûtait une bordure de plus.
      background: '#F2F7F4',
      border: '1px solid rgba(1,134,117,0.14)',
      textAlign: 'left',
      cursor: 'pointer',
      font: 'inherit',
      '&:active': { background: '#E7F1EC' },
      '&:focus-visible': { outline: '2px solid #016557', outlineOffset: 2 },
    }}
  >
    <IllustrationSujet sujet="cultures" taille={44} />

    <Stack sx={{ minWidth: 0, flexGrow: 1 }}>
      <Typography
        sx={{
          fontFamily: "'Ubuntu', sans-serif",
          fontSize: 15,
          fontWeight: 700,
          color: '#1A1C1B',
          lineHeight: 1.3,
        }}
      >
        Découvrir les bonnes pratiques
      </Typography>
    </Stack>

    <Box
      aria-hidden
      sx={{
        flexShrink: 0,
        width: 32,
        height: 32,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#018675',
        color: '#FFFFFF',
      }}
    >
      <ArrowForwardRoundedIcon sx={{ fontSize: 19 }} />
    </Box>
  </Box>
);
