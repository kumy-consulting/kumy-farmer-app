import type { FunctionComponent } from 'react';

import ChevronRightRounded from '@mui/icons-material/ChevronRightRounded';
import { Box, Stack, Typography } from '@mui/material';

import type { ProfilAgriculteur } from '../monEspace.types';

interface CarteAgriculteurProps {
  profil: ProfilAgriculteur;
  /** Ouvre la fiche personnelle. */
  onOuvrirInformations?: () => void;
}

const initiales = (nom: string): string =>
  nom
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((mot) => mot[0]?.toUpperCase() ?? '')
    .join('');

/**
 * L'en-tête de l'onglet : une carte claire posée sur le fond de la page, et non
 * un bandeau vert plein écran.
 *
 * Trois décisions portent ce bloc :
 *
 * 1. **Le sourcil porte le code, pas un titre de page.** Une étiquette qui
 *    annonce « votre espace » nomme la boîte que l'œil voit déjà. Le même
 *    emplacement typographique — petites capitales espacées, teinte sourde —
 *    accueille la référence de l'agriculteur, qui est l'information sous
 *    laquelle la coopérative et le prêteur le retrouvent.
 * 2. **La carte entière est la cible.** Un rond d'initiales ne dit pas qu'il
 *    ouvre quelque chose ; une carte avec son chevron, si. Toucher son identité
 *    pour voir sa fiche est le geste évident, et la cible passe de 54 px à toute
 *    la largeur.
 * 3. **L'adresse complète n'est pas ici.** Village, sous-préfecture, préfecture
 *    et région vivent dans la fiche, à un tap. La carte garde ce qui identifie :
 *    le nom, la référence, et la coopérative qui répond de lui.
 */
export const CarteAgriculteur: FunctionComponent<CarteAgriculteurProps> = ({ profil, onOuvrirInformations }) => (
  <Box sx={{ px: 2.5, pt: 'max(calc(env(safe-area-inset-top, 0px) + 12px), 52px)' }}>
    <Stack
      component="button"
      type="button"
      direction="row"
      alignItems="center"
      spacing={1.75}
      onClick={onOuvrirInformations}
      sx={{
        appearance: 'none',
        border: '1px solid rgba(55,75,70,0.07)',
        font: 'inherit',
        textAlign: 'left',
        cursor: 'pointer',
        width: '100%',
        p: 2,
        borderRadius: '22px',
        background: '#FFFFFF',
        boxShadow: '0 10px 26px rgba(1,134,117,0.10)',
        '&:active': { background: '#FAFDFB' },
        '&:focus-visible': { outline: '2px solid #016557', outlineOffset: 3 },
      }}
    >
      <Box
        aria-hidden
        sx={{
          flexShrink: 0,
          width: 62,
          height: 62,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(140deg, #018675 0%, #016557 100%)',
          // Halo pâle plutôt qu'un contour net : le portrait se pose sur la
          // carte au lieu d'y être découpé.
          boxShadow: '0 0 0 5px rgba(1,134,117,0.09)',
          fontFamily: "'Ubuntu', sans-serif",
          fontSize: 22,
          fontWeight: 700,
          letterSpacing: '0.02em',
          color: '#FFFFFF',
        }}
      >
        {initiales(profil.nomComplet)}
      </Box>

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          sx={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: '#5C5F5E',
          }}
        >
          {profil.code}
        </Typography>
        <Typography
          sx={{
            fontFamily: "'Ubuntu', sans-serif",
            // Le nom s'accorde à la largeur du téléphone. La colonne de texte
            // vaut la largeur d'écran moins ~184 px (marges, portrait, chevron),
            // et 19 px fixes y cassaient « Mamadou Aliou Barry » en deux sur un
            // écran de 360 px. Indexer le corps sur la largeur le fait tenir sur
            // les petits appareils sans imposer leur taille aux grands, où le
            // plafond de 19 px reprend la main. Un nom vraiment long passe
            // encore à la ligne : c'est le nom qui commande, pas la hauteur de
            // la carte.
            fontSize: 'clamp(15px, 4.5vw, 19px)',
            fontWeight: 700,
            lineHeight: 1.25,
            letterSpacing: '-0.01em',
            color: '#1A1C1B',
            mt: 0.3,
          }}
        >
          {profil.nomComplet}
        </Typography>
        <Typography
          sx={{
            fontSize: 13,
            fontWeight: 500,
            color: '#5C5F5E',
            mt: 0.3,
            // Une ligne, toujours : « Coopérative maraîchère de Tanènè » passait
            // sur deux lignes et étirait la carte pour une information de
            // troisième rang, lisible en entier dans la fiche.
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {profil.cooperative}
        </Typography>

        {profil.niveauAcces === 'simulation' && (
          // Un agriculteur en simulation doit le savoir, sinon il croit ses
          // chiffres réels — et sur un écran de crédit, c'est grave.
          <Box
            component="span"
            sx={{
              display: 'inline-block',
              mt: 1,
              px: 1,
              py: 0.4,
              borderRadius: 999,
              background: 'rgba(198,138,26,0.16)',
              fontSize: 10.5,
              fontWeight: 700,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: '#8C5000',
            }}
          >
            Compte de démonstration
          </Box>
        )}
      </Box>

      <ChevronRightRounded sx={{ fontSize: 22, color: 'rgba(55,75,70,0.35)', flexShrink: 0 }} />
    </Stack>
  </Box>
);
