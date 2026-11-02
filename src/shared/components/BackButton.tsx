import type { FunctionComponent } from 'react';

import ChevronLeftRounded from '@mui/icons-material/ChevronLeftRounded';
import { IconButton } from '@mui/material';

interface BackButtonProps {
  onClick: () => void;
  /**
   * Ce que l'on quitte, pour les lecteurs d'écran. « Retour » suffit rarement :
   * « Retour à Mon espace » dit où le geste ramène.
   */
  label?: string;
}

/**
 * Le retour d'en-tête de l'app — un seul objet, partout.
 *
 * Il vivait jusqu'ici en cinq exemplaires : carré blanc bordé sur la fiche
 * personnelle et les écrans de parcelle, disque noir translucide sur les
 * overlays carte, simple flèche nue dans l'onboarding. Trois formes pour un
 * même geste, c'est trois choses à réapprendre.
 *
 * Deux points de fabrication méritent d'être notés :
 *
 * 1. **Rond, contre le thème.** `MuiIconButton` arrondit tous les boutons à
 *    8 px : c'est ce qui donnait le carré adouci. On repasse explicitement en
 *    50 % — un retour est un jeton, pas une tuile.
 * 2. **Pastille opaque, pas une teinte alpha.** Le même bouton se pose sur la
 *    surface claire *et* sur une image satellite. Un fond translucide y
 *    virerait au sombre et avalerait le chevron ; `secondary[90]` opaque tient
 *    sur n'importe quel fond, et le scrim du haut de carte fait le reste.
 */
export const BackButton: FunctionComponent<BackButtonProps> = ({ onClick, label = 'Retour' }) => (
  <IconButton
    onClick={onClick}
    aria-label={label}
    sx={{
      width: 38,
      height: 38,
      flexShrink: 0,
      borderRadius: '50%',
      background: '#D1E7E1',
      color: '#374B46',
      '&:hover': { background: '#B5CBC5' },
      '&:active': { background: '#B5CBC5' },
      '&:focus-visible': { outline: '2px solid #016557', outlineOffset: 2 },
    }}
  >
    <ChevronLeftRounded sx={{ fontSize: 22 }} />
  </IconButton>
);
