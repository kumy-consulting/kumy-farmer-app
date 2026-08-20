import type { FunctionComponent } from 'react';

import CheckRounded from '@mui/icons-material/CheckRounded';
import TrendingUpRounded from '@mui/icons-material/TrendingUpRounded';
import { Box, Stack, Typography } from '@mui/material';

import type { EligibiliteCredit } from '../monEspace.types';
import { Card, SectionTitle } from './espaceUi';

interface BlocCreditProps {
  eligibilite: EligibiliteCredit;
}

/**
 * Ce à quoi le travail de l'agriculteur lui donne droit.
 *
 * Deux partis pris tiennent ce bloc :
 *
 * 1. **Le montant n'est pas une promesse.** L'API dit `eligible`, ce qui décrit
 *    une évaluation de la plateforme, pas un prêt accordé. L'écran le dit noir
 *    sur blanc : laisser croire à une offre ferme serait la faute la plus grave
 *    que puisse commettre cet onglet.
 * 2. **Un critère manqué est une action, pas un reproche.** On affiche donc la
 *    valeur constatée à côté — « 52, il en faut 60 » se corrige, « non rempli »
 *    ne se corrige pas. Les manquants passent en tête : ce sont eux qui portent
 *    l'information utile, les remplis ne sont là que pour la confiance.
 */
export const BlocCredit: FunctionComponent<BlocCreditProps> = ({ eligibilite }) => {
  const manquants = eligibilite.criteres.filter((critere) => !critere.rempli);
  const remplis = eligibilite.criteres.filter((critere) => critere.rempli);

  return (
    <Box>
      <SectionTitle>Crédit</SectionTitle>
      <Card pad={0}>
        <Box sx={{ p: 2, pb: 1.75 }}>
          <Typography sx={{ fontSize: 12.5, color: '#5C5F5E' }}>
            {eligibilite.eligible ? 'Vous pouvez demander jusqu’à' : 'Montant atteignable'}
          </Typography>
          <Typography
            sx={{
              fontFamily: "'Ubuntu', sans-serif",
              fontSize: 30,
              fontWeight: 700,
              lineHeight: 1.05,
              letterSpacing: '-0.02em',
              color: '#016557',
              mt: 0.4,
            }}
          >
            {eligibilite.montantMaxFormate}
          </Typography>
          <Typography sx={{ fontSize: 12, color: '#5C5F5E', mt: 0.6, lineHeight: 1.5 }}>
            Évaluation AgriPilot d’après votre dossier. Ce n’est pas une offre de prêt : seul votre organisme de
            financement décide.
          </Typography>
        </Box>

        {manquants.length > 0 && (
          <Box
            sx={{ px: 2, py: 1.75, background: 'rgba(255,196,107,0.12)', borderTop: '1px solid rgba(55,75,70,0.08)' }}
          >
            <Stack direction="row" alignItems="center" spacing={0.75} sx={{ mb: 1.25 }}>
              <TrendingUpRounded sx={{ fontSize: 18, color: '#8C5000' }} />
              <Typography
                sx={{ fontFamily: "'Ubuntu', sans-serif", fontSize: 13.5, fontWeight: 700, color: '#8C5000' }}
              >
                {manquants.length > 1
                  ? `${manquants.length} points à travailler pour aller plus haut`
                  : 'Un point à travailler pour aller plus haut'}
              </Typography>
            </Stack>
            <Stack spacing={1.1}>
              {manquants.map((critere) => (
                <Box key={critere.libelle}>
                  <Typography sx={{ fontSize: 13.5, fontWeight: 600, color: '#1A1C1B' }}>{critere.libelle}</Typography>
                  <Typography sx={{ fontSize: 12.5, color: '#5C5F5E', mt: 0.15 }}>{critere.valeur}</Typography>
                </Box>
              ))}
            </Stack>
          </Box>
        )}

        <Box sx={{ px: 2, py: 1.5, borderTop: '1px solid rgba(55,75,70,0.08)' }}>
          <Stack spacing={0.9}>
            {remplis.map((critere) => (
              <Stack key={critere.libelle} direction="row" alignItems="center" spacing={1}>
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
                <Typography sx={{ fontSize: 13, color: '#1A1C1B', flex: 1, minWidth: 0 }}>{critere.libelle}</Typography>
                <Typography sx={{ fontSize: 12.5, color: '#5C5F5E', flexShrink: 0 }}>{critere.valeur}</Typography>
              </Stack>
            ))}
          </Stack>
        </Box>
      </Card>
    </Box>
  );
};
