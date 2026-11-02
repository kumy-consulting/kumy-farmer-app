import type { FunctionComponent } from 'react';

import ExpandLessRounded from '@mui/icons-material/ExpandLessRounded';
import ExpandMoreRounded from '@mui/icons-material/ExpandMoreRounded';
import { Box, Stack, Typography } from '@mui/material';

interface SectionHeaderProps {
  title: string;
  count?: number;
  actionLabel?: string;
  /** Renseigné quand l'action ouvre/referme un bloc — laissé vide sinon. */
  actionExpanded?: boolean;
  onAction?: () => void;
}

/**
 * L'en-tête d'une section du fil : le nom, ce qu'elle contient en ce moment, et
 * l'accès à ce qu'elle garde de côté.
 *
 * Deux principes tiennent la ligne :
 *
 * 1. La hiérarchie passe par l'échelle et l'interlettrage, jamais par un
 *    contraste faible. Un titre délavé est le premier à disparaître sur un écran
 *    en plein soleil — c'est le contexte d'usage réel ici. L'étiquette recule
 *    donc parce qu'elle est petite et espacée, pas parce qu'elle est pâle.
 * 2. L'action ouvre du contenu sur place, exactement comme `ExpandToggle` au bas
 *    des listes : même verbe, même vert, même chevron. Deux commandes qui font
 *    le même geste ne doivent pas avoir deux apparences.
 */
export const SectionHeader: FunctionComponent<SectionHeaderProps> = ({
  title,
  count,
  actionLabel,
  actionExpanded,
  onAction,
}) => (
  <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
    <Stack direction="row" alignItems="center" spacing={0.9}>
      <Typography
        sx={{
          fontFamily: "'Ubuntu', sans-serif",
          fontSize: 11.5,
          fontWeight: 700,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          // 0,78 et non 0,62 : à 0,62 l'étiquette tombait à 3,3:1 sur le fond du
          // fil, sous le seuil lisible à cette taille. Elle reste en retrait par
          // le corps et l'interlettrage.
          color: 'rgba(55,75,70,0.78)',
        }}
      >
        {title}
      </Typography>
      {count !== undefined && count > 0 && (
        <Box
          sx={{
            minWidth: 18,
            height: 18,
            px: 0.6,
            borderRadius: 999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(1,134,117,0.12)',
            color: '#016557',
            fontFamily: "'Ubuntu', sans-serif",
            fontSize: 11,
            fontWeight: 700,
          }}
        >
          {count}
        </Box>
      )}
    </Stack>
    {actionLabel && (
      <Stack
        component="button"
        direction="row"
        alignItems="center"
        spacing={0.25}
        onClick={onAction}
        aria-expanded={actionExpanded}
        sx={{
          // Resets ciblés, surtout pas `all: 'unset'` : MUI hisse `color` comme
          // system prop et l'émet AVANT les déclarations littérales du `sx`, si
          // bien que l'expansion `all` (qui contient `color: unset`) l'effaçait —
          // l'action s'affichait en noir de texte au lieu du vert de marque, plus
          // lourde que le titre auquel elle appartient.
          appearance: 'none',
          background: 'none',
          border: 0,
          cursor: 'pointer',
          fontFamily: "'Ubuntu', sans-serif",
          fontSize: 12,
          fontWeight: 600,
          // `#016557` plutôt que `#018675` : le vert clair passe à 4,4:1 à ce
          // corps, tout juste sous le seuil. Même famille, même rôle, lisible.
          color: '#016557',
          // La cible tactile fait 44 px de haut sans déplacer le texte d'un
          // pixel : les marges négatives rendent à la ligne la hauteur que la
          // gouttière lui ajoute. Cette app se tape debout, dans un champ.
          minHeight: 44,
          px: 1,
          mr: -1,
          my: '-13px',
          '&:active': { opacity: 0.6 },
          '&:focus-visible': { outline: '2px solid #016557', outlineOffset: 2, borderRadius: 6 },
          '& svg': { fontSize: 17 },
        }}
      >
        <Box component="span">{actionLabel}</Box>
        {actionExpanded ? <ExpandLessRounded /> : <ExpandMoreRounded />}
      </Stack>
    )}
  </Stack>
);
