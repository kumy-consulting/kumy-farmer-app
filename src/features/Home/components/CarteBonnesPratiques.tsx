import type { FunctionComponent } from 'react';

import ChevronRightRounded from '@mui/icons-material/ChevronRightRounded';
import { Box, Typography } from '@mui/material';

import { Pousse, Tuile } from './carteAttente';
import { ENCRE, VERT_PROFOND } from './carteAttente.styles';

interface CarteBonnesPratiquesProps {
  onOuvrir: () => void;
}

/**
 * La porte vers les bonnes pratiques, sur l'écran d'attente.
 *
 * L'étude de sol est un GESTE — elle part si l'agriculteur la demande. Les
 * bonnes pratiques sont une PORTE : rien ne se déclenche, on entre. D'où le
 * chevron plutôt qu'une bande d'action, une tuile grise plutôt qu'une carte
 * blanche, et la tuile entière cliquable — viser un chevron au pouce, sur un
 * téléphone tenu d'une main dans un champ, ne va pas de soi.
 */
export const CarteBonnesPratiques: FunctionComponent<CarteBonnesPratiquesProps> = ({ onOuvrir }) => (
  <Box
    component="button"
    type="button"
    onClick={onOuvrir}
    sx={{
      appearance: 'none',
      display: 'flex',
      alignItems: 'center',
      gap: 1.5,
      width: '100%',
      p: 1.5,
      borderRadius: '18px',
      background: '#EEF1EE',
      border: '1px solid rgba(20,35,30,0.08)',
      textAlign: 'left',
      cursor: 'pointer',
      font: 'inherit',
      '&:active': { background: '#E5EAE6' },
      '&:focus-visible': { outline: `2px solid ${VERT_PROFOND}`, outlineOffset: 2 },
    }}
  >
    <Tuile>
      <Pousse />
    </Tuile>

    <Typography
      sx={{
        flexGrow: 1,
        minWidth: 0,
        fontFamily: "'Ubuntu', sans-serif",
        fontSize: 15,
        fontWeight: 700,
        color: ENCRE,
        lineHeight: 1.3,
      }}
    >
      Les bonnes pratiques
    </Typography>

    <ChevronRightRounded aria-hidden sx={{ flexShrink: 0, fontSize: 28, color: ENCRE }} />
  </Box>
);
