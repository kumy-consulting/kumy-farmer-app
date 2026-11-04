import { useEffect, useState, type FunctionComponent } from 'react';

import BadgeRounded from '@mui/icons-material/BadgeRounded';
import { Box, Stack, Typography } from '@mui/material';

import { useRattachement } from '@/features/Rattachement/useRattachement';

/** 123456 → « 123 456 » : deux groupes de trois se recopient et se dictent mieux. */
const enGroupes = (code: string): string => `${code.slice(0, 3)} ${code.slice(3)}`.trim();

/** 599 → « 9:59 ». */
const minutesSecondes = (total: number): string => {
  const s = Math.max(0, total);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

const styleBouton = (occupe: boolean) => ({
  appearance: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '100%',
  mt: 1.5,
  minHeight: 48,
  px: 2.5,
  border: 0,
  borderRadius: '14px',
  background: occupe ? '#5FA598' : 'linear-gradient(140deg, #018675 0%, #016557 100%)',
  font: 'inherit',
  fontFamily: "'Ubuntu', sans-serif",
  fontSize: 14.5,
  fontWeight: 700,
  color: '#FFFFFF',
  cursor: occupe ? 'default' : 'pointer',
  '&:focus-visible': { outline: '2px solid #016557', outlineOffset: 3 },
});

/**
 * « Confirmer mon identité » : le code que l'agriculteur auto-inscrit montre à
 * son encadreur, en personne, pour rattacher son compte à sa fiche.
 *
 * Elle ne rend rien tant qu'il n'y a rien à faire : pas de demande, demande
 * refusée ou déjà confirmée, ou lecture en cours. Le badge « Compte de
 * démonstration » ne dépend pas d'elle — il suit `accessTier`.
 */
interface CarteRattachementProps {
  /** Marge sous la carte, pour les écrans qui ne l'espacent pas eux-mêmes. */
  mb?: string | number;
}

export const CarteRattachement: FunctionComponent<CarteRattachementProps> = ({ mb }) => {
  const { etat, code, secondesRestantes, isLoading, isRequesting, error, afficherCode } = useRattachement();

  // Un code déjà montré, puis expiré : le bouton devient « Nouveau code ».
  const [dejaAffiche, setDejaAffiche] = useState(false);
  useEffect(() => {
    if (code !== null) setDejaAffiche(true);
  }, [code]);

  if (isLoading || !etat) return null;
  if (etat.statut !== 'en_attente' && etat.statut !== 'bloquee') return null;

  const bloquee = etat.statut === 'bloquee';

  return (
    <Box sx={{ mb }}>
      <Stack direction="row" spacing={1.5} alignItems="flex-start">
        <Box
          aria-hidden
          sx={{
            width: 34,
            height: 34,
            flexShrink: 0,
            borderRadius: '11px',
            display: 'grid',
            placeItems: 'center',
            background: 'rgba(1,134,117,0.10)',
            '& svg': { fontSize: 19, color: '#016557' },
          }}
        >
          <BadgeRounded />
        </Box>

        <Box sx={{ minWidth: 0 }}>
          <Typography
            sx={{ fontFamily: "'Ubuntu', sans-serif", fontSize: 15, fontWeight: 700, color: '#1A1C1B', lineHeight: 1.35 }}
          >
            {bloquee ? 'Confirmer mon identité' : 'Votre encadreur doit confirmer votre identité'}
          </Typography>
          <Typography sx={{ fontSize: 13, color: '#5C5F5E', lineHeight: 1.45, mt: 0.15 }}>
            {bloquee
              ? 'Trop d’essais. Kumy va désigner un encadreur pour confirmer votre identité.'
              : code === null
                ? 'Quand il vient vous voir, montrez-lui votre pièce d’identité et le code que vous affichez ici.'
                : 'Donnez ce code à votre encadreur. Ne le donnez à personne d’autre.'}
          </Typography>
        </Box>
      </Stack>

      {!bloquee && code !== null && (
        <Box sx={{ mt: 1.5, textAlign: 'center' }}>
          <Typography
            aria-label={`Code ${code.split('').join(' ')}`}
            sx={{
              fontFamily: "'Ubuntu', sans-serif",
              fontSize: 34,
              fontWeight: 700,
              letterSpacing: '0.12em',
              color: '#016557',
              fontVariantNumeric: 'tabular-nums',
              lineHeight: 1.2,
            }}
          >
            {enGroupes(code)}
          </Typography>
          <Typography sx={{ fontSize: 12.5, color: '#5C5F5E', mt: 0.5, fontVariantNumeric: 'tabular-nums' }}>
            Valable encore {minutesSecondes(secondesRestantes)}
          </Typography>
        </Box>
      )}

      {!bloquee && code === null && (
        <Box
          component="button"
          type="button"
          onClick={() => void afficherCode()}
          disabled={isRequesting}
          sx={styleBouton(isRequesting)}
        >
          {isRequesting ? 'Un instant…' : dejaAffiche ? 'Nouveau code' : 'Afficher mon code'}
        </Box>
      )}

      {error && <Typography sx={{ fontSize: 12.5, color: '#BA1A1A', mt: 1, lineHeight: 1.45 }}>{error}</Typography>}
    </Box>
  );
};
