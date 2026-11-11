import { useId, type FunctionComponent } from 'react';

import LockOutlined from '@mui/icons-material/LockOutlined';
import { Box, Dialog, Stack, Typography } from '@mui/material';

import { carteSx, ENCRE, ENCRE_DOUCE, VERT_PROFOND } from '@/features/Home/components/carteAttente.styles';
import { BackButton } from '@/shared/components/BackButton';

/** 599 → « 9:59 ». */
const minutesSecondes = (total: number): string => {
  const s = Math.max(0, total);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

const ETAPES = ['Préparez votre pièce d’identité', 'L’encadreur saisit ce code sur son téléphone'] as const;

interface EcranCodeProps {
  ouvert: boolean;
  code: string;
  /** Le nom du compte : l'encadreur le compare à celui de la fiche. */
  nom?: string;
  secondesRestantes: number;
  onFermer: () => void;
}

/**
 * Le code, en plein écran, pour être montré.
 *
 * L'agriculteur tend son téléphone : l'écran ne porte rien d'autre que ce que
 * l'encadreur doit lire — le code, chiffre par chiffre dans une case chacun, et
 * le nom du compte. Les cases évitent qu'un 1 se perde entre deux voisins ; un
 * intervalle plus large au milieu garde les deux groupes de trois qui se
 * dictent.
 *
 * Fermer l'écran ne jette pas le code : il reste valable jusqu'à son échéance
 * et la carte propose de le revoir. En tirer un nouveau à chaque fermeture
 * consommerait des essais pour rien.
 */
export const EcranCode: FunctionComponent<EcranCodeProps> = ({ ouvert, code, nom, secondesRestantes, onFermer }) => {
  const idTitre = useId();

  return (
    <Dialog
      fullScreen
      open={ouvert}
      onClose={onFermer}
      aria-labelledby={idTitre}
      PaperProps={{ sx: { background: '#F7F9F6' } }}
    >
      <Box
        sx={{
          minHeight: '100%',
          display: 'flex',
          flexDirection: 'column',
          px: 2.5,
          pt: 'max(calc(env(safe-area-inset-top, 0px) + 12px), 24px)',
          pb: 'max(env(safe-area-inset-bottom, 0px), 24px)',
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <BackButton onClick={onFermer} />
          <Typography
            sx={{
              fontSize: 11.5,
              fontWeight: 700,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: VERT_PROFOND,
            }}
          >
            Confirmer mon identité
          </Typography>
        </Stack>

        <Typography
          id={idTitre}
          component="h1"
          sx={{
            mt: 3,
            fontFamily: "'Ubuntu', sans-serif",
            fontSize: 'clamp(22px, 6.2vw, 26px)',
            fontWeight: 700,
            letterSpacing: '-0.02em',
            lineHeight: 1.2,
            color: ENCRE,
          }}
        >
          Montrez cet écran à votre encadreur
        </Typography>

        <Box sx={{ ...carteSx, mt: 2.5, px: 2, pt: 2.25, pb: 2.5, borderRadius: '22px', textAlign: 'center' }}>
          <Typography
            sx={{ fontSize: 11.5, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#6B706E' }}
          >
            Votre code
          </Typography>

          <Stack
            role="img"
            aria-label={`Code ${code.split('').join(' ')}`}
            direction="row"
            justifyContent="center"
            sx={{ mt: 1.5, gap: '7px' }}
          >
            {code.split('').map((chiffre, i) => (
              <Box
                // Le rang suffit : la suite de chiffres ne se réordonne jamais.
                key={i}
                aria-hidden
                sx={{
                  width: 'min(44px, 12vw)',
                  height: 56,
                  ml: i === 3 ? '9px' : 0,
                  borderRadius: '11px',
                  display: 'grid',
                  placeItems: 'center',
                  background: '#DCF5EC',
                  fontFamily: "'Ubuntu', sans-serif",
                  fontSize: 30,
                  fontWeight: 700,
                  color: '#014C41',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {chiffre}
              </Box>
            ))}
          </Stack>

          {nom && <Typography sx={{ mt: 1.75, fontSize: 15, fontWeight: 700, color: ENCRE }}>{nom}</Typography>}

          <Typography
            sx={{ mt: 0.5, fontSize: 12.5, fontWeight: 600, color: VERT_PROFOND, fontVariantNumeric: 'tabular-nums' }}
          >
            Valable encore {minutesSecondes(secondesRestantes)}
          </Typography>
        </Box>

        {/* Deux gestes dans l'ordre où ils arrivent : la numérotation dit une
            vraie suite, pas une décoration. */}
        <Stack component="ol" spacing={1.5} sx={{ listStyle: 'none', m: 0, mt: 2.75, p: 0, px: 0.5 }}>
          {ETAPES.map((texte, i) => (
            <Stack key={texte} component="li" direction="row" spacing={1.5} alignItems="center">
              <Box
                aria-hidden
                sx={{
                  width: 26,
                  height: 26,
                  flexShrink: 0,
                  borderRadius: '50%',
                  display: 'grid',
                  placeItems: 'center',
                  background: '#018675',
                  color: '#FFFFFF',
                  fontSize: 12.5,
                  fontWeight: 700,
                }}
              >
                {i + 1}
              </Box>
              <Typography sx={{ fontSize: 14.5, color: ENCRE, lineHeight: 1.4 }}>{texte}</Typography>
            </Stack>
          ))}
        </Stack>

        <Stack
          direction="row"
          spacing={1}
          alignItems="flex-start"
          sx={{ mt: 'auto', pt: 3, px: 0.5, color: ENCRE_DOUCE, '& svg': { fontSize: 17, mt: '1px' } }}
        >
          <LockOutlined aria-hidden />
          <Typography sx={{ fontSize: 13, lineHeight: 1.45 }}>
            Ce code ne sert qu’à votre encadreur. Ne le donnez à personne d’autre.
          </Typography>
        </Stack>
      </Box>
    </Dialog>
  );
};
