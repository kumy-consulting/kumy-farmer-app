import type { FunctionComponent } from 'react';

import CheckCircleRounded from '@mui/icons-material/CheckCircleRounded';
import ScienceRounded from '@mui/icons-material/ScienceRounded';
import { Box, Stack, Typography } from '@mui/material';

import type { EtudeDeSolState } from '../useEtudeDeSol';

type CarteEtudeDeSolProps = Omit<EtudeDeSolState, 'demander'> & {
  demander: () => void;
};

const MOIS = [
  'janvier',
  'février',
  'mars',
  'avril',
  'mai',
  'juin',
  'juillet',
  'août',
  'septembre',
  'octobre',
  'novembre',
  'décembre',
];

/** ISO → « 27 août ». L'année ne dit rien d'utile sur une demande récente. */
const jourEtMois = (iso: string): string => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getDate()} ${MOIS[d.getMonth()]}`;
};

/**
 * L'étude de sol proposée depuis l'écran d'attente.
 *
 * Elle vit hors du rail : le rail dit où en est le compte, c'est-à-dire ce qui
 * arrivera sans que l'agriculteur ait rien à faire. L'étude de sol, elle, ne
 * part que s'il la demande — l'inscrire entre deux étapes la ferait passer pour
 * une promesse de plus.
 *
 * Une fois la demande partie, le bouton disparaît au lieu de se griser : il n'y
 * a plus de geste à faire, et un bouton mort invite à le presser quand même.
 */
export const CarteEtudeDeSol: FunctionComponent<CarteEtudeDeSolProps> = ({
  requestedAt,
  isLoading,
  isSending,
  error,
  demander,
}) => {
  // Premier chargement : ni bouton ni confirmation, pour ne pas afficher une
  // proposition qu'on retirerait aussitôt à un agriculteur déjà servi.
  if (isLoading) return null;

  const envoyee = requestedAt !== null;

  return (
    <Box
      sx={{
        mt: 2,
        p: 2.25,
        borderRadius: '22px',
        background: '#FFFFFF',
        border: '1px solid rgba(55,75,70,0.07)',
        boxShadow: '0 10px 26px rgba(1,134,117,0.10)',
      }}
    >
      <Stack direction="row" spacing={1.6} alignItems="flex-start">
        <Box
          aria-hidden
          sx={{
            width: 38,
            height: 38,
            flexShrink: 0,
            borderRadius: '12px',
            display: 'grid',
            placeItems: 'center',
            background: 'rgba(1,134,117,0.10)',
            '& svg': { fontSize: 20, color: '#016557' },
          }}
        >
          <ScienceRounded />
        </Box>

        <Box sx={{ minWidth: 0 }}>
          <Typography
            sx={{
              fontFamily: "'Ubuntu', sans-serif",
              fontSize: 15,
              fontWeight: 700,
              color: '#1A1C1B',
              lineHeight: 1.35,
            }}
          >
            Étude de sol
          </Typography>
          <Typography sx={{ fontSize: 13.5, color: '#5C5F5E', lineHeight: 1.5, mt: 0.25 }}>
            Savoir ce que votre terre peut porter, avant de semer.
          </Typography>
        </Box>
      </Stack>

      {envoyee ? (
        <Stack
          direction="row"
          alignItems="center"
          spacing={0.75}
          sx={{
            mt: 2,
            px: 1.5,
            py: 1.25,
            borderRadius: '14px',
            background: 'rgba(1,134,117,0.08)',
            '& svg': { fontSize: 18, color: '#016557' },
          }}
        >
          <CheckCircleRounded />
          <Box sx={{ minWidth: 0 }}>
            <Typography
              sx={{
                fontFamily: "'Ubuntu', sans-serif",
                fontSize: 13.5,
                fontWeight: 700,
                color: '#016557',
              }}
            >
              Demande envoyée le {jourEtMois(requestedAt)}
            </Typography>
            <Typography sx={{ fontSize: 12.5, color: '#5C5F5E', mt: 0.15 }}>
              Un conseiller Kumy vous rappellera.
            </Typography>
          </Box>
        </Stack>
      ) : (
        <>
          <Box
            component="button"
            type="button"
            onClick={demander}
            disabled={isSending}
            sx={{
              appearance: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              mt: 2,
              minHeight: 48,
              px: 2.5,
              border: 0,
              borderRadius: '14px',
              // Vert plein assourdi plutôt qu'un vert transparent : sur fond
              // blanc, 45 % d'opacité faisait passer le libellé blanc sous le
              // seuil de contraste au moment précis où il faut le lire.
              background: isSending
                ? '#5FA598'
                : 'linear-gradient(140deg, #018675 0%, #016557 100%)',
              font: 'inherit',
              fontFamily: "'Ubuntu', sans-serif",
              fontSize: 14.5,
              fontWeight: 700,
              color: '#FFFFFF',
              cursor: isSending ? 'default' : 'pointer',
              transition: 'filter 0.2s ease',
              '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
              '&:active': { filter: isSending ? 'none' : 'brightness(0.96)' },
              '&:focus-visible': { outline: '2px solid #016557', outlineOffset: 3 },
            }}
          >
            {isSending ? 'Envoi en cours…' : 'Demander une étude de sol'}
          </Box>

          {error && (
            <Typography sx={{ fontSize: 12.5, color: '#BA1A1A', mt: 1, lineHeight: 1.45 }}>
              {error}
            </Typography>
          )}
        </>
      )}
    </Box>
  );
};
