import { useEffect, useState, type FunctionComponent } from 'react';

import PersonOutlineRounded from '@mui/icons-material/PersonOutlineRounded';
import { Box, Stack, Typography } from '@mui/material';

import { Tuile } from '@/features/Home/components/carteAttente';
import { bandeSx, carteSx, ENCRE, ENCRE_DOUCE, VERT, VERT_PROFOND } from '@/features/Home/components/carteAttente.styles';
import { EcranCode } from '@/features/Rattachement/EcranCode';
import { useRattachement, type RattachementState } from '@/features/Rattachement/useRattachement';
import { useAuthStore } from '@/shared/stores/authStore';

interface CarteRattachementProps {
  /** Marge sous la carte, pour les écrans qui ne l'espacent pas eux-mêmes. */
  mb?: string | number;
}

/**
 * La carte, sans le hook : l'écran d'attente lit l'état une seule fois et s'en
 * sert aussi pour décider quelle autre carte passe au second rang.
 *
 * Elle ne rend rien tant qu'il n'y a rien à dire : pas de demande, demande
 * refusée ou déjà confirmée, ou lecture en cours. Le badge « Compte de
 * démonstration » ne dépend pas d'elle — il suit `accessTier`.
 */
export const CarteRattachementVue: FunctionComponent<CarteRattachementProps & { rattachement: RattachementState }> = ({
  mb,
  rattachement,
}) => {
  const { etat, code, secondesRestantes, isLoading, isRequesting, error, afficherCode } = rattachement;
  const nom = useAuthStore((s) => s.user?.displayName);

  // Un code déjà montré, puis expiré : le bouton devient « Nouveau code ».
  const [dejaAffiche, setDejaAffiche] = useState(false);
  // Un code neuf ouvre l'écran plein ; un code effacé (échéance, demande
  // confirmée ou bloquée) le ferme.
  const [ecranOuvert, setEcranOuvert] = useState(false);
  useEffect(() => {
    if (code !== null) setDejaAffiche(true);
    setEcranOuvert(code !== null);
  }, [code]);

  if (isLoading || !etat) return null;
  if (etat.statut !== 'en_attente' && etat.statut !== 'bloquee') return null;

  const bloquee = etat.statut === 'bloquee';

  return (
    <Box
      sx={{
        ...carteSx,
        mb,
        // Le seul contour vert de l'écran : c'est ce qui passe avant tout le
        // reste. Bloquée, il n'y a plus rien à faire de son côté, la carte
        // redevient une carte comme les autres.
        border: bloquee ? carteSx.border : `1.5px solid ${VERT}`,
      }}
    >
      <Box sx={{ px: 2, pt: 1.75, pb: 2 }}>
        <Stack direction="row" spacing={1.5} alignItems="flex-start">
          <Tuile>
            <PersonOutlineRounded />
          </Tuile>

          <Box sx={{ minWidth: 0, pt: bloquee ? 0.25 : 0 }}>
            {!bloquee && (
              <Typography
                sx={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: VERT_PROFOND,
                  lineHeight: 1.4,
                }}
              >
                À faire d’abord
              </Typography>
            )}
            <Typography
              sx={{ fontFamily: "'Ubuntu', sans-serif", fontSize: 15.5, fontWeight: 700, color: ENCRE, lineHeight: 1.3 }}
            >
              {bloquee ? 'Confirmer mon identité' : 'Confirmez votre identité avec votre encadreur'}
            </Typography>
            <Typography sx={{ fontSize: 13, color: ENCRE_DOUCE, lineHeight: 1.45, mt: 0.4 }}>
              {bloquee
                ? 'Trop d’essais. Kumy va désigner un encadreur pour confirmer votre identité.'
                : 'Quand il viendra, montrez-lui votre pièce d’identité et ce code.'}
            </Typography>
          </Box>
        </Stack>

        {error && (
          <Typography role="alert" sx={{ fontSize: 12.5, color: '#BA1A1A', mt: 1.25, lineHeight: 1.45 }}>
            {error}
          </Typography>
        )}
      </Box>

      {!bloquee && (
        <Box
          component="button"
          type="button"
          // Code encore valable : on le revoit, on n'en tire pas un autre.
          onClick={() => (code !== null ? setEcranOuvert(true) : void afficherCode())}
          disabled={isRequesting}
          sx={bandeSx('pleine', isRequesting)}
        >
          {isRequesting
            ? 'Un instant…'
            : code !== null
              ? 'Revoir mon code'
              : dejaAffiche
                ? 'Nouveau code'
                : 'Afficher mon code'}
        </Box>
      )}

      {!bloquee && code !== null && (
        <EcranCode
          ouvert={ecranOuvert}
          code={code}
          nom={nom}
          secondesRestantes={secondesRestantes}
          onFermer={() => setEcranOuvert(false)}
        />
      )}
    </Box>
  );
};

/**
 * « Confirmer mon identité » : le code que l'agriculteur auto-inscrit montre à
 * son encadreur, en personne, pour rattacher son compte à sa fiche.
 */
export const CarteRattachement: FunctionComponent<CarteRattachementProps> = ({ mb }) => {
  const rattachement = useRattachement();
  return <CarteRattachementVue mb={mb} rattachement={rattachement} />;
};
