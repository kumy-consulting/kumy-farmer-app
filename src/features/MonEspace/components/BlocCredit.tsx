import type { FunctionComponent } from 'react';

import CheckRounded from '@mui/icons-material/CheckRounded';
import { Box, Stack, Typography } from '@mui/material';

import type { EligibiliteCredit } from '../monEspace.types';
import { Card, SectionTitle } from './espaceUi';

interface BlocCreditProps {
  eligibilite: EligibiliteCredit;
  /** La page dédiée porte déjà le titre dans son en-tête : on ne le répète pas. */
  sansTitre?: boolean;
  /** Ouvre le détail du score — le critère financier s'y travaille. */
  onVoirScore?: () => void;
}

/**
 * Ce à quoi le travail de l'agriculteur lui donne droit.
 *
 * Trois partis pris tiennent ce bloc :
 *
 * 1. **Le montant n'est pas une promesse.** L'API dit `eligible`, ce qui décrit
 *    une évaluation de la plateforme, pas un prêt accordé. L'écran le dit noir
 *    sur blanc : laisser croire à une offre ferme serait la faute la plus grave
 *    que puisse commettre cet onglet.
 * 2. **Un critère manqué est une action, pas un reproche.** On affiche la valeur
 *    constatée à côté — « 52, il en faut 60 » se corrige, « non rempli » ne se
 *    corrige pas. Les manquants passent en tête ; les remplis ne sont là que
 *    pour la confiance.
 * 3. **On ne chiffre pas le gain.** Il serait tentant d'écrire « vous
 *    obtiendriez X de plus » : l'API ne renvoie aucun montant potentiel, et
 *    l'inventer sur un écran d'argent serait un mensonge. La page dit ce qui
 *    manque, pas ce que ça rapporterait.
 *
 * Note de vocabulaire : ces critères sont des **conditions**, jamais des
 * « points ». L'écran du score, à un tap d'ici, compte en points de score —
 * « +12 pts » — et le même mot pour deux grandeurs sur deux écrans voisins
 * rendait les deux illisibles.
 */
export const BlocCredit: FunctionComponent<BlocCreditProps> = ({ eligibilite, sansTitre, onVoirScore }) => {
  const manquants = eligibilite.criteres.filter((critere) => !critere.rempli);
  const remplis = eligibilite.criteres.filter((critere) => critere.rempli);

  return (
    <Box>
      {!sansTitre && <SectionTitle>Crédit</SectionTitle>}

      <Card pad={2.25}>
        <Typography sx={{ fontSize: 13, color: '#5C5F5E' }}>
          {eligibilite.eligible ? 'Vous pouvez demander jusqu’à' : 'Montant atteignable'}
        </Typography>
        <Typography
          sx={{
            fontFamily: "'Ubuntu', sans-serif",
            fontSize: 34,
            fontWeight: 700,
            lineHeight: 1.05,
            letterSpacing: '-0.025em',
            color: '#016557',
            mt: 0.5,
          }}
        >
          {eligibilite.montantMaxFormate}
        </Typography>
        <Typography sx={{ fontSize: 12.5, color: '#5C5F5E', mt: 0.8, lineHeight: 1.5 }}>
          Évaluation AgriPilot d’après votre dossier. Ce n’est pas une offre de prêt : seul votre organisme de
          financement décide.
        </Typography>

        {/* Le même dispositif que la répartition des domaines et le parcellaire :
            une bande dont les divisions sont réelles, une cellule par condition.
            On voit la distance qui reste avant de lire la moindre ligne. */}
        <Box
          role="img"
          aria-label={`${remplis.length} conditions remplies sur ${eligibilite.criteres.length}`}
          sx={{ display: 'flex', gap: '3px', height: 6, mt: 1.75 }}
        >
          {eligibilite.criteres.map((critere) => (
            <Box
              key={critere.libelle}
              sx={{
                flex: '1 1 0',
                borderRadius: 999,
                background: critere.rempli ? '#018675' : 'rgba(55,75,70,0.13)',
              }}
            />
          ))}
        </Box>
        <Typography sx={{ fontSize: 12, color: '#5C5F5E', mt: 0.8 }}>
          {remplis.length} condition{remplis.length > 1 ? 's' : ''} remplie{remplis.length > 1 ? 's' : ''} sur{' '}
          {eligibilite.criteres.length}
        </Typography>
      </Card>

      {manquants.length > 0 && (
        <Box sx={{ mt: 2.25 }}>
          <SectionTitle>Ce qu’il reste à remplir</SectionTitle>
          <Card pad={2.25}>
            <Stack spacing={1.75}>
              {manquants.map((critere) => (
                <Box key={critere.libelle}>
                  <Typography
                    sx={{ fontFamily: "'Ubuntu', sans-serif", fontSize: 14.5, fontWeight: 700, color: '#1A1C1B' }}
                  >
                    {critere.libelle}
                  </Typography>
                  <Typography sx={{ fontSize: 13, color: '#8C5000', mt: 0.25, fontWeight: 600 }}>
                    {critere.valeur}
                  </Typography>
                </Box>
              ))}
            </Stack>

            {onVoirScore && (
              // Le critère financier est aussi un pilier du score : les deux
              // écrans décrivent le même levier, autant les relier.
              <Box
                component="button"
                type="button"
                onClick={onVoirScore}
                sx={{
                  appearance: 'none',
                  background: 'none',
                  border: 0,
                  p: 0,
                  mt: 1.75,
                  cursor: 'pointer',
                  font: 'inherit',
                  fontFamily: "'Ubuntu', sans-serif",
                  fontSize: 13,
                  fontWeight: 700,
                  color: '#016557',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  minHeight: 32,
                  '&:focus-visible': { outline: '2px solid #016557', outlineOffset: 2, borderRadius: 6 },
                }}
              >
                Voir ce qui fait monter mon score
                <Box component="span" aria-hidden>
                  →
                </Box>
              </Box>
            )}
          </Card>
        </Box>
      )}

      {remplis.length > 0 && (
        <Box sx={{ mt: 2.25 }}>
          <SectionTitle>Déjà rempli</SectionTitle>
          <Card pad={2}>
            <Stack spacing={0}>
              {remplis.map((critere, index) => (
                <Stack
                  key={critere.libelle}
                  direction="row"
                  alignItems="center"
                  spacing={1.1}
                  sx={{ py: 0.9, borderTop: index === 0 ? 'none' : '1px solid rgba(55,75,70,0.08)' }}
                >
                  <Box
                    aria-hidden
                    sx={{
                      flexShrink: 0,
                      width: 18,
                      height: 18,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'rgba(1,134,117,0.14)',
                      '& svg': { fontSize: 13, color: '#016557' },
                    }}
                  >
                    <CheckRounded />
                  </Box>
                  <Typography sx={{ fontSize: 13, color: '#1A1C1B', flex: 1, minWidth: 0 }}>
                    {critere.libelle}
                  </Typography>
                  <Typography sx={{ fontSize: 12.5, color: '#5C5F5E', flexShrink: 0 }}>{critere.valeur}</Typography>
                </Stack>
              ))}
            </Stack>
          </Card>
        </Box>
      )}
    </Box>
  );
};
