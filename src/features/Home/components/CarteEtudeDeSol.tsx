import type { FunctionComponent } from 'react';

import CheckCircleRounded from '@mui/icons-material/CheckCircleRounded';
import { Box, Stack, Typography } from '@mui/material';

import type { EtudeDeSolState } from '../useEtudeDeSol';
import { Pousse } from './carteAttente';
import { bandeSx, carteSx, ENCRE, ENCRE_DOUCE, MENTHE, VERT_PROFOND } from './carteAttente.styles';

type CarteEtudeDeSolProps = Omit<EtudeDeSolState, 'demander'> & {
  demander: () => void;
  /** Un autre geste passe avant : la bande d'action s'éclaircit. */
  secondaire?: boolean;
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
 * Une parcelle en coupe : la pousse au-dessus, trois horizons dessous.
 *
 * Les ocres viennent de la rampe `warning` du thème, et le bandeau des bonnes
 * pratiques reprend les mêmes : c'est la même terre, vue d'un autre écran.
 */
const CoupeDeSol: FunctionComponent = () => (
  <Box
    aria-hidden
    sx={{
      width: 56,
      height: 60,
      flexShrink: 0,
      borderRadius: '13px',
      overflow: 'hidden',
      display: 'grid',
      gridTemplateRows: '1fr 9px 9px 11px',
    }}
  >
    <Box sx={{ background: MENTHE, color: VERT_PROFOND, display: 'grid', placeItems: 'end center', pb: '2px' }}>
      <Pousse taille={22} />
    </Box>
    <Box sx={{ background: '#FBE3BF' }} />
    <Box sx={{ background: '#F5C88A' }} />
    <Box sx={{ background: '#E0A43A' }} />
  </Box>
);

/**
 * L'étude de sol proposée depuis l'écran d'attente.
 *
 * Elle ne part que si l'agriculteur la demande. Une fois la demande partie, la
 * bande d'action disparaît au lieu de se griser : il n'y a plus de geste à
 * faire, et un bouton mort invite à le presser quand même.
 */
export const CarteEtudeDeSol: FunctionComponent<CarteEtudeDeSolProps> = ({
  requestedAt,
  isLoading,
  isSending,
  error,
  demander,
  secondaire = false,
}) => {
  // Premier chargement : ni bouton ni confirmation, pour ne pas afficher une
  // proposition qu'on retirerait aussitôt à un agriculteur déjà servi.
  if (isLoading) return null;

  const envoyee = requestedAt !== null;

  return (
    <Box sx={carteSx}>
      <Stack direction="row" spacing={1.75} alignItems="center" sx={{ px: 2, py: 1.75 }}>
        <CoupeDeSol />

        <Box sx={{ minWidth: 0 }}>
          <Typography
            sx={{ fontFamily: "'Ubuntu', sans-serif", fontSize: 16, fontWeight: 700, color: ENCRE, lineHeight: 1.3 }}
          >
            Étude de sol
          </Typography>
          <Typography sx={{ fontSize: 13, color: ENCRE_DOUCE, lineHeight: 1.45, mt: 0.25 }}>
            Savoir ce que votre terre peut porter, avant de semer.
          </Typography>
        </Box>
      </Stack>

      {envoyee ? (
        <Stack
          direction="row"
          alignItems="center"
          spacing={1}
          sx={{
            px: 2,
            py: 1.25,
            background: MENTHE,
            '& svg': { fontSize: 20, color: VERT_PROFOND },
          }}
        >
          <CheckCircleRounded />
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontFamily: "'Ubuntu', sans-serif", fontSize: 13.5, fontWeight: 700, color: VERT_PROFOND }}>
              Demande envoyée le {jourEtMois(requestedAt)}
            </Typography>
            <Typography sx={{ fontSize: 12.5, color: ENCRE_DOUCE, mt: 0.1 }}>Un conseiller Kumy vous rappellera.</Typography>
          </Box>
        </Stack>
      ) : (
        <>
          {error && (
            <Typography role="alert" sx={{ fontSize: 12.5, color: '#BA1A1A', px: 2, pb: 1.25, lineHeight: 1.45 }}>
              {error}
            </Typography>
          )}
          <Box
            component="button"
            type="button"
            onClick={demander}
            disabled={isSending}
            sx={bandeSx(secondaire ? 'claire' : 'pleine', isSending)}
          >
            {isSending ? 'Envoi en cours…' : 'Demander une étude de sol'}
          </Box>
        </>
      )}
    </Box>
  );
};
