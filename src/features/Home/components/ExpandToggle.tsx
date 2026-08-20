import type { FunctionComponent } from 'react';

import ExpandLessRounded from '@mui/icons-material/ExpandLessRounded';
import ExpandMoreRounded from '@mui/icons-material/ExpandMoreRounded';
import { Button } from '@mui/material';

interface ExpandToggleProps {
  expanded: boolean;
  /** Libellé replié : il nomme ce qu'on va découvrir, pas la mécanique du bouton. */
  moreLabel: string;
  onToggle: (expanded: boolean) => void;
}

/**
 * Ouvre et referme une liste tronquée.
 *
 * Le chevron porte le sens du geste : le libellé seul ne dit pas si l'on
 * descend dans la liste ou si l'on remonte, et c'est justement ce qui manquait —
 * la liste s'ouvrait sans jamais se refermer. `aria-expanded` dit la même chose
 * aux lecteurs d'écran, qui n'ont pas le chevron.
 */
export const ExpandToggle: FunctionComponent<ExpandToggleProps> = ({ expanded, moreLabel, onToggle }) => (
  <Button
    onClick={() => onToggle(!expanded)}
    aria-expanded={expanded}
    endIcon={expanded ? <ExpandLessRounded /> : <ExpandMoreRounded />}
    sx={{
      textTransform: 'none',
      alignSelf: 'center',
      mt: 1,
      fontSize: 13,
      fontWeight: 600,
      // Même vert que l'action d'en-tête : le primaire clair `#018675` passe
      // tout juste sous le seuil de contraste à ce corps, et les deux commandes
      // font le même geste — elles doivent se ressembler exactement.
      color: '#016557',
      // 44 px de haut : c'est un bouton qu'on tape debout dans un champ.
      minHeight: 44,
      px: 1.5,
      '& .MuiButton-endIcon': { ml: 0.4 },
      '& .MuiButton-endIcon > svg': { fontSize: 18 },
    }}
  >
    {expanded ? 'Voir moins' : moreLabel}
  </Button>
);
