import type { FunctionComponent } from 'react';

import { Box, Stack, Typography } from '@mui/material';
import dayjs from 'dayjs';

import { LIBELLE_PILIER } from '../monEspace.demo';
import type { NiveauPilier, ScoreAgriculteur } from '../monEspace.types';
import { Card, SectionTitle } from './espaceUi';

interface BlocScoreProps {
  score: ScoreAgriculteur;
}

/** Trois niveaux, trois couleurs — les mêmes que la jauge de santé de l'accueil. */
const TON_NIVEAU: Record<NiveauPilier, string> = {
  high: '#018675',
  mid: '#C68A1A',
  low: '#BA1A1A',
};

/**
 * Le score, décomposé.
 *
 * Un chiffre global seul ne se corrige pas : c'est un jugement. Ce sont les six
 * piliers, avec leur phrase d'explication, qui le rendent utilisable — on y lit
 * ce qui pèse, ce qui va, et sur quoi agir. D'où la barre par pilier plutôt
 * qu'un seul cadran : la répartition est l'information, pas la moyenne.
 *
 * Les piliers sont triés du plus faible au plus fort. Ce qui manque se lit en
 * premier, comme dans le bloc crédit.
 */
export const BlocScore: FunctionComponent<BlocScoreProps> = ({ score }) => {
  const piliers = [...score.piliers].sort((a, b) => a.score - b.score);

  return (
    <Box>
      <SectionTitle>Mon score</SectionTitle>
      <Card>
        <Stack direction="row" alignItems="baseline" spacing={1} sx={{ mb: 0.5 }}>
          <Typography
            sx={{
              fontFamily: "'Ubuntu', sans-serif",
              fontSize: 28,
              fontWeight: 700,
              lineHeight: 1,
              color: '#1A1C1B',
            }}
          >
            {score.scoreGlobal}
          </Typography>
          <Typography sx={{ fontSize: 13, color: '#5C5F5E' }}>/ 100</Typography>
        </Stack>
        {/* Un score est daté. L'afficher sans sa date le ferait passer pour
            l'état du jour, alors qu'il est recalculé périodiquement. */}
        <Typography sx={{ fontSize: 12, color: '#5C5F5E', mb: 1.75 }}>
          Calculé le {dayjs(score.calculeLe).format('D MMMM')}
        </Typography>

        <Stack spacing={1.5}>
          {piliers.map((pilier) => (
            <Box key={pilier.cle}>
              <Stack direction="row" alignItems="baseline" justifyContent="space-between" spacing={1}>
                <Typography sx={{ fontSize: 13.5, fontWeight: 600, color: '#1A1C1B' }}>
                  {LIBELLE_PILIER[pilier.cle] ?? pilier.cle}
                </Typography>
                <Stack direction="row" alignItems="baseline" spacing={0.75} sx={{ flexShrink: 0 }}>
                  <Typography
                    sx={{
                      fontFamily: "'Ubuntu', sans-serif",
                      fontSize: 13.5,
                      fontWeight: 700,
                      color: TON_NIVEAU[pilier.niveau],
                    }}
                  >
                    {pilier.score}
                  </Typography>
                  {/* Le poids explique pourquoi deux piliers faibles ne coûtent
                      pas la même chose au score global. */}
                  <Typography sx={{ fontSize: 11, color: '#8F9291' }}>{pilier.poids} %</Typography>
                </Stack>
              </Stack>

              <Box
                aria-hidden
                sx={{ height: 5, borderRadius: 999, background: 'rgba(55,75,70,0.10)', mt: 0.6, overflow: 'hidden' }}
              >
                <Box
                  sx={{
                    width: `${Math.max(0, Math.min(100, pilier.score))}%`,
                    height: '100%',
                    borderRadius: 999,
                    background: TON_NIVEAU[pilier.niveau],
                  }}
                />
              </Box>

              <Typography sx={{ fontSize: 12.5, color: '#5C5F5E', mt: 0.5, lineHeight: 1.45 }}>
                {pilier.detail}
              </Typography>
            </Box>
          ))}
        </Stack>
      </Card>
    </Box>
  );
};
