import type { FunctionComponent } from 'react';

import InsightsRounded from '@mui/icons-material/InsightsRounded';
import TrendingUpRounded from '@mui/icons-material/TrendingUpRounded';
import { Box, Stack, Typography } from '@mui/material';

import type { YieldEstimate } from '../../parcelle.types';

const fr1 = (n: number): string => n.toLocaleString('fr-FR', { maximumFractionDigits: 1 });

/** Carte estimation de rendement (t/ha) + intervalle, confiance et comparaison à la normale. */
export const YieldCard: FunctionComponent<{ estimate: YieldEstimate | null }> = ({ estimate }) => {
  if (!estimate) {
    return (
      <Stack alignItems="center" spacing={1.25} sx={{ mx: 2, px: 3, py: 3.5, textAlign: 'center', borderRadius: '16px', background: '#FFFFFF', border: '1px solid #E2E3E1' }}>
        <Box sx={{ width: 48, height: 48, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(1,134,117,0.08)', '& svg': { fontSize: 24, color: '#35A18F' } }}>
          <InsightsRounded />
        </Box>
        <Typography sx={{ fontFamily: "'Ubuntu', sans-serif", fontSize: 14, fontWeight: 700, color: '#243F38' }}>
          Estimation en préparation
        </Typography>
        <Typography sx={{ fontFamily: "'Ubuntu', sans-serif", fontSize: 12.5, color: '#5C5F5E', maxWidth: 260, lineHeight: 1.5 }}>
          Le rendement sera estimé dès que la campagne aura suffisamment avancé.
        </Typography>
      </Stack>
    );
  }

  const { value, unit, confidenceInterval, confidence, referenceYield } = estimate;
  const deltaPct = referenceYield > 0 ? ((value - referenceYield) / referenceYield) * 100 : null;
  const above = deltaPct != null && deltaPct >= 0;

  return (
    <Box sx={{ mx: 2, borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(1,134,117,0.24)', boxShadow: '0 2px 10px -6px rgba(1,134,117,0.4)' }}>
      {/* Valeur principale */}
      <Stack alignItems="center" spacing={0.25} sx={{ px: 2, py: 2.25, background: 'linear-gradient(135deg, rgba(1,134,117,0.10) 0%, rgba(1,134,117,0.03) 100%)' }}>
        <Stack direction="row" alignItems="baseline" spacing={0.75}>
          <Typography sx={{ fontFamily: "'Ubuntu', sans-serif", fontSize: 40, fontWeight: 700, color: '#016557', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
            {fr1(value)}
          </Typography>
          <Typography sx={{ fontFamily: "'Ubuntu', sans-serif", fontSize: 15, fontWeight: 700, color: '#35A18F' }}>{unit}</Typography>
        </Stack>
        <Typography sx={{ fontFamily: "'Ubuntu', sans-serif", fontSize: 12, color: '#5C5F5E', mt: 0.5 }}>
          Fourchette {fr1(confidenceInterval.low)}–{fr1(confidenceInterval.high)} {unit}
        </Typography>
      </Stack>

      {/* Détails : confiance + comparaison normale */}
      <Stack direction="row" sx={{ background: '#FFFFFF', '& > *': { flex: 1, textAlign: 'center', py: 1.5 }, '& > *:not(:last-child)': { borderRight: '1px solid #EEF1F0' } }}>
        <Box>
          <Typography sx={{ fontFamily: "'Ubuntu', sans-serif", fontSize: 16, fontWeight: 700, color: '#1A1C1B', fontVariantNumeric: 'tabular-nums' }}>
            {Math.round(confidence)}%
          </Typography>
          <Typography sx={{ fontFamily: "'Ubuntu', sans-serif", fontSize: 10.5, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', color: '#8F9291', mt: 0.25 }}>
            Confiance
          </Typography>
        </Box>
        <Box>
          <Typography sx={{ fontFamily: "'Ubuntu', sans-serif", fontSize: 16, fontWeight: 700, color: '#1A1C1B', fontVariantNumeric: 'tabular-nums' }}>
            {fr1(referenceYield)} {unit}
          </Typography>
          <Typography sx={{ fontFamily: "'Ubuntu', sans-serif", fontSize: 10.5, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', color: '#8F9291', mt: 0.25 }}>
            Normale
          </Typography>
        </Box>
        {deltaPct != null && (
          <Box>
            <Stack direction="row" alignItems="center" justifyContent="center" spacing={0.375}>
              <TrendingUpRounded sx={{ fontSize: 16, color: above ? '#018675' : '#E53935', transform: above ? 'none' : 'scaleY(-1)' }} />
              <Typography sx={{ fontFamily: "'Ubuntu', sans-serif", fontSize: 16, fontWeight: 700, color: above ? '#018675' : '#E53935', fontVariantNumeric: 'tabular-nums' }}>
                {above ? '+' : ''}{Math.round(deltaPct)}%
              </Typography>
            </Stack>
            <Typography sx={{ fontFamily: "'Ubuntu', sans-serif", fontSize: 10.5, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', color: '#8F9291', mt: 0.25 }}>
              vs normale
            </Typography>
          </Box>
        )}
      </Stack>
    </Box>
  );
};
