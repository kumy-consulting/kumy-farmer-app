import type { FunctionComponent } from 'react';

import { Box, Stack } from '@mui/material';

import { LIBELLE, ORDRE, TON, type SegmentATraiter } from './segmentsATraiter';

interface FiltreATraiterProps {
  counts: Record<SegmentATraiter, number>;
  actif: SegmentATraiter;
  onChange: (segment: SegmentATraiter) => void;
}

/**
 * Le filtre de la liste à traiter.
 *
 * Il existe pour une raison simple : douze cartes de 130 px font seize écrans de
 * défilement, et l'agriculteur qui ouvre l'app cherche presque toujours une
 * seule chose — ce qui est en retard, ou ce qu'il a commencé. Le filtre lui rend
 * la page en une hauteur d'écran.
 *
 * Deux règles le tiennent :
 *
 * 1. **Une puce vide ne s'affiche pas.** Un filtre qui ne mène à rien est du
 *    bruit qui occupe la place qu'on cherchait à gagner ; et « 0 en cours »
 *    n'apprend rien qu'on ait envie de toucher.
 * 2. **Chaque puce a la largeur de ce qu'elle dit.** Trois colonnes égales
 *    accorderaient autant de place à « 2 en cours » qu'à « 5 en retard » —
 *    l'œil doit tomber sur ce qui presse.
 */
export const FiltreATraiter: FunctionComponent<FiltreATraiterProps> = ({ counts, actif, onChange }) => {
  const visibles = ORDRE.filter((segment) => segment === 'tout' || counts[segment] > 0);
  // Une seule découpe possible : le filtre ne filtrerait rien.
  if (visibles.length < 2) return null;

  return (
    <Stack
      direction="row"
      sx={{
        // Une seule ligne : sur deux, le filtre coûterait la hauteur qu'il est
        // censé faire gagner. Il défile latéralement si la langue ou le nombre
        // de découpes le débordent un jour.
        flexWrap: 'nowrap',
        overflowX: 'auto',
        // Le rail épouse ses puces : étendu sur toute la largeur, il laissait un
        // vide à droite qui le faisait passer pour un champ à remplir.
        width: 'fit-content',
        maxWidth: '100%',
        gap: '3px',
        mb: 1.25,
        p: '3px',
        borderRadius: 999,
        // Un rail plutôt qu'un contour par puce : trois pastilles bordées côte à
        // côte font trois objets qu'on lit un par un, alors que c'est un seul
        // réglage à trois positions. Le rail le dit, et il tient les puces
        // inactives sans leur donner de bordure à elles.
        background: 'rgba(55,75,70,0.06)',
        scrollbarWidth: 'none',
        '&::-webkit-scrollbar': { display: 'none' },
      }}
    >
      {visibles.map((segment) => {
        const estActif = segment === actif;
        const ton = TON[segment];

        return (
          <Box
            key={segment}
            component="button"
            type="button"
            aria-pressed={estActif}
            onClick={() => onChange(segment)}
            sx={{
              appearance: 'none',
              font: 'inherit',
              cursor: 'pointer',
              flexShrink: 0,
              display: 'inline-flex',
              // `center`, pas `baseline` : le compte et le libellé n'ont pas le
              // même corps, et une ligne de base commune posait le contenu de
              // travers dans la pastille.
              alignItems: 'center',
              gap: '5px',
              height: 34,
              px: 1.4,
              borderRadius: 999,
              border: 0,
              // La position choisie se lit à sa forme — une pastille claire qui se
              // détache du rail —, et sa teinte dit encore laquelle : rouge pour le
              // retard, ambre pour les alertes. Un fond teinté seul se noyait dans
              // le gris du rail, surtout pour « Tout », dont le ton est neutre.
              background: estActif ? '#FFFFFF' : 'transparent',
              boxShadow: estActif ? '0 1px 3px rgba(55,75,70,0.16)' : 'none',
              color: estActif ? ton.texte : '#5C5F5E',
              transition: 'background 0.18s ease, color 0.18s ease',
              '&:active': { background: estActif ? '#FFFFFF' : 'rgba(55,75,70,0.07)' },
              '&:focus-visible': { outline: `2px solid ${ton.texte}`, outlineOffset: 2 },
            }}
          >
            {/* Pas de conteneur vide pour « Tout » : un span sans contenu suivi
                d'un `gap` décalait son libellé vers la droite et décentrait la
                pastille. L'en-tête de section porte déjà ce total. */}
            {segment !== 'tout' && (
              <Box
                component="span"
                sx={{
                  fontFamily: "'Ubuntu', sans-serif",
                  fontSize: 13.5,
                  fontWeight: 700,
                  lineHeight: 1,
                  fontVariantNumeric: 'tabular-nums',
                  color: 'inherit',
                }}
              >
                {counts[segment]}
              </Box>
            )}
            <Box
              component="span"
              sx={{
                fontFamily: "'Ubuntu', sans-serif",
                fontSize: 13,
                fontWeight: estActif ? 700 : 600,
                lineHeight: 1,
                color: 'inherit',
              }}
            >
              {LIBELLE[segment]}
            </Box>
          </Box>
        );
      })}
    </Stack>
  );
};
