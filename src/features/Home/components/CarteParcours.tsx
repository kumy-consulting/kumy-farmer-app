import { useId, useState, type FunctionComponent } from 'react';

import CheckRounded from '@mui/icons-material/CheckRounded';
import PhoneOutlined from '@mui/icons-material/PhoneOutlined';
import { Box, Collapse, Stack, Typography, useMediaQuery } from '@mui/material';

import { formatE164ForDisplay } from '@/features/Auth/phone.util';

import { Tuile } from './carteAttente';
import { carteSx, ENCRE, ENCRE_DOUCE, VERT, VERT_PROFOND } from './carteAttente.styles';

type EtatEtape = 'fait' | 'encours' | 'avenir';

interface Etape {
  texte: string;
  etat: EtatEtape;
}

/**
 * Le chemin entre un compte vide et une exploitation suivie, avec la position
 * de l'agriculteur dessus.
 *
 * La première étape est la sienne, et elle est cochée : c'est ce qui fait la
 * différence entre une liste de promesses et un parcours commencé.
 */
const ETAPES: readonly Etape[] = [
  { texte: 'Votre compte est créé', etat: 'fait' },
  { texte: 'Un technicien Kumy va vous appeler', etat: 'encours' },
  { texte: 'Vous tracez ensemble vos domaines et vos parcelles', etat: 'avenir' },
  { texte: 'Vos conseils, vos alertes et votre calendrier s’affichent ici', etat: 'avenir' },
];

const COULEUR_SEGMENT: Record<EtatEtape, string> = {
  fait: VERT_PROFOND,
  encours: '#35A18F',
  avenir: '#E1E5E3',
};

/** La pastille de la liste dépliée : franchie, en cours, ou pas encore. */
const Marqueur: FunctionComponent<{ etat: EtatEtape }> = ({ etat }) => (
  <Box
    aria-hidden
    sx={{
      width: 20,
      height: 20,
      flexShrink: 0,
      borderRadius: '50%',
      display: 'grid',
      placeItems: 'center',
      background: etat === 'fait' ? VERT_PROFOND : '#FFFFFF',
      border: etat === 'fait' ? 0 : `1.5px solid ${etat === 'encours' ? VERT : 'rgba(20,35,30,0.20)'}`,
      '& svg': { fontSize: 13, color: '#FFFFFF' },
    }}
  >
    {etat === 'fait' && <CheckRounded />}
    {etat === 'encours' && <Box sx={{ width: 8, height: 8, borderRadius: '50%', background: VERT }} />}
  </Box>
);

interface CarteParcoursProps {
  /** Le numéro du compte, en E.164 : celui que le technicien appellera. */
  telephone?: string;
}

/**
 * Où en est le compte, en une carte.
 *
 * Replié, elle dit l'essentiel : le rang de l'étape, la barre qui le montre, et
 * ce qui se passe maintenant. Les quatre étapes se déplient à la demande — elles
 * se lisent une fois, l'étape en cours se relit chaque matin.
 *
 * La barre double le texte « Étape 2 sur 4 » sans le remplacer : c'est le texte
 * qui est lu, la barre est cachée aux lecteurs d'écran.
 */
export const CarteParcours: FunctionComponent<CarteParcoursProps> = ({ telephone }) => {
  const [ouvert, setOuvert] = useState(false);
  const idListe = useId();
  const mouvementReduit = useMediaQuery('(prefers-reduced-motion: reduce)');

  const rang = ETAPES.findIndex((e) => e.etat === 'encours') + 1;

  return (
    <Box sx={{ ...carteSx, px: 2, pt: 1.5, pb: 1.75 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Typography sx={{ fontSize: 13, fontWeight: 700, color: VERT_PROFOND }}>
          Étape {rang} sur {ETAPES.length}
        </Typography>

        <Box
          component="button"
          type="button"
          aria-expanded={ouvert}
          aria-controls={idListe}
          onClick={() => setOuvert((o) => !o)}
          sx={{
            appearance: 'none',
            border: 0,
            background: 'none',
            // Zone de toucher plus large que le libellé : une cible de 13 px de
            // haut ne se vise pas au pouce.
            minHeight: 36,
            mr: -1,
            px: 1,
            borderRadius: '10px',
            font: 'inherit',
            fontSize: 13,
            fontWeight: 600,
            color: VERT_PROFOND,
            cursor: 'pointer',
            '&:active': { background: 'rgba(1,134,117,0.08)' },
            '&:focus-visible': { outline: `2px solid ${VERT_PROFOND}`, outlineOffset: 0 },
          }}
        >
          {ouvert ? 'Masquer les étapes' : 'Voir les étapes'}
        </Box>
      </Stack>

      <Stack aria-hidden direction="row" spacing={0.75} sx={{ mt: 0.5 }}>
        {ETAPES.map((etape) => (
          <Box
            key={etape.texte}
            sx={{ flex: 1, height: 5, borderRadius: '3px', background: COULEUR_SEGMENT[etape.etat] }}
          />
        ))}
      </Stack>

      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mt: 1.75 }}>
        <Tuile>
          <PhoneOutlined />
        </Tuile>
        <Box sx={{ minWidth: 0 }}>
          <Typography
            sx={{ fontFamily: "'Ubuntu', sans-serif", fontSize: 15.5, fontWeight: 700, color: ENCRE, lineHeight: 1.3 }}
          >
            Un technicien va vous appeler
          </Typography>
          {telephone && (
            <Typography sx={{ fontSize: 13, color: ENCRE_DOUCE, mt: 0.2, fontVariantNumeric: 'tabular-nums' }}>
              au {formatE164ForDisplay(telephone)}
            </Typography>
          )}
        </Box>
      </Stack>

      <Collapse in={ouvert} timeout={mouvementReduit ? 0 : 'auto'} id={idListe}>
        <Stack
          component="ol"
          spacing={1.25}
          sx={{ listStyle: 'none', m: 0, mt: 1.75, p: 0, pt: 1.5, borderTop: '1px solid rgba(20,35,30,0.08)' }}
        >
          {ETAPES.map((etape) => (
            <Stack key={etape.texte} component="li" direction="row" spacing={1.25} alignItems="flex-start">
              <Marqueur etat={etape.etat} />
              <Typography
                sx={{
                  fontSize: 13.5,
                  lineHeight: 1.45,
                  fontWeight: etape.etat === 'encours' ? 700 : 500,
                  color: etape.etat === 'encours' ? ENCRE : ENCRE_DOUCE,
                }}
              >
                {etape.texte}
                {etape.etat === 'fait' && <Box component="span" sx={visuellementCache}>, fait</Box>}
                {etape.etat === 'encours' && <Box component="span" sx={visuellementCache}>, en cours</Box>}
              </Typography>
            </Stack>
          ))}
        </Stack>
      </Collapse>
    </Box>
  );
};

const visuellementCache = {
  position: 'absolute',
  width: 1,
  height: 1,
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  whiteSpace: 'nowrap',
} as const;
