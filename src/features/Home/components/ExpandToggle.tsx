import type { FunctionComponent } from 'react';

import ExpandLessRounded from '@mui/icons-material/ExpandLessRounded';
import ExpandMoreRounded from '@mui/icons-material/ExpandMoreRounded';
import { Box } from '@mui/material';

interface ExpandToggleProps {
  expanded: boolean;
  /** Libellé replié : il nomme ce qu'on va découvrir, pas la mécanique du bouton. */
  moreLabel: string;
  onToggle: (expanded: boolean) => void;
}

/**
 * Ouvre et referme une liste tronquée.
 *
 * **Il occupe la largeur de la liste sur laquelle il agit.** Un texte nu posé
 * sous une pile de cartes n'appartenait visuellement à rien : il flottait sur le
 * fond de page, à gauche, sans dire qu'il prolongeait la pile. La surface pâle
 * à la même largeur le rattache à ce qu'il déplie — et donne une cible qu'on
 * touche debout dans un champ, au lieu d'un mot de trois centimètres.
 *
 * (L'ancienne version demandait `alignSelf: 'center'` alors que son parent
 * n'est pas un conteneur flex : la règle ne s'appliquait pas, et le bouton
 * n'était à gauche que par accident.)
 *
 * Le chevron porte le sens du geste : le libellé seul ne dit pas si l'on descend
 * dans la liste ou si l'on remonte. `aria-expanded` dit la même chose aux
 * lecteurs d'écran, qui n'ont pas le chevron.
 */
export const ExpandToggle: FunctionComponent<ExpandToggleProps> = ({ expanded, moreLabel, onToggle }) => (
  <Box
    component="button"
    type="button"
    onClick={() => onToggle(!expanded)}
    aria-expanded={expanded}
    sx={{
      appearance: 'none',
      font: 'inherit',
      cursor: 'pointer',
      border: 0,
      width: '100%',
      mt: 1.25,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '6px',
      // 46 px : c'est un bouton qu'on tape debout dans un champ.
      minHeight: 46,
      borderRadius: '14px',
      background: 'rgba(1,134,117,0.07)',
      fontFamily: "'Ubuntu', sans-serif",
      fontSize: 13.5,
      fontWeight: 700,
      // Même vert que l'action d'en-tête : le primaire clair `#018675` passe
      // tout juste sous le seuil de contraste à ce corps, et les deux commandes
      // font le même geste — elles doivent se ressembler exactement.
      color: '#016557',
      transition: 'background 0.18s ease',
      '&:active': { background: 'rgba(1,134,117,0.13)' },
      '&:focus-visible': { outline: '2px solid #016557', outlineOffset: 2 },
    }}
  >
    {expanded ? 'Voir moins' : moreLabel}
    <Box component="span" aria-hidden sx={{ display: 'flex', '& svg': { fontSize: 18 } }}>
      {expanded ? <ExpandLessRounded /> : <ExpandMoreRounded />}
    </Box>
  </Box>
);
