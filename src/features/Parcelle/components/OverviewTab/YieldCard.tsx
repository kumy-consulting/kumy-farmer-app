import type { FunctionComponent } from 'react';

import InsightsRounded from '@mui/icons-material/InsightsRounded';
import { Box, Stack, Typography } from '@mui/material';
import { keyframes } from '@mui/material/styles';

import type { YieldEstimate } from '../../parcelle.types';

const fr1 = (n: number): string => n.toLocaleString('fr-FR', { maximumFractionDigits: 1 });

/** La barre pousse de la gauche à sa longueur cible. */
const grow = keyframes`
  from { transform: scaleX(0); }
  to { transform: scaleX(1); }
`;
/** Le curseur d'estimation apparaît en pop une fois la barre remplie. */
const pop = keyframes`
  0% { opacity: 0; transform: translate(-50%, -50%) scale(0.4); }
  60% { opacity: 1; transform: translate(-50%, -50%) scale(1.15); }
  100% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
`;
const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

interface Tone {
  main: string;
  deep: string;
  soft: string;
  fill: string;
}
const GOOD: Tone = { main: '#018675', deep: '#016557', soft: 'rgba(1,134,117,0.14)', fill: 'linear-gradient(90deg, #35A18F 0%, #018675 100%)' };
const WARN: Tone = { main: '#D97706', deep: '#A85D00', soft: 'rgba(245,158,11,0.16)', fill: 'linear-gradient(90deg, #F5B34A 0%, #E08A0B 100%)' };

/**
 * Carte estimation de rendement.
 *
 * Refonte : plutôt qu'une « fourchette » abstraite, une jauge « trajectoire vers le
 * potentiel » — piste de 0 au potentiel de la parcelle, remplie jusqu'à l'estimation,
 * avec la fourchette en bande translucide et la normale en repère. Le potentiel devient
 * l'ancrage et se lit d'un coup d'œil (« X % du potentiel »).
 */
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

  const { value, unit, confidenceInterval, confidence, referenceYield, potential } = estimate;

  // Ancrage sur le potentiel ; repli si absent/incohérent.
  const hasPotential = potential > value;
  const ceiling = hasPotential ? potential : Math.max(confidenceInterval.high, value) * 1.08;
  const pct = (v: number): number => Math.max(0, Math.min(100, (v / ceiling) * 100));

  const valuePct = pct(value);
  const lowPct = pct(confidenceInterval.low);
  const highPct = pct(confidenceInterval.high);
  const normalePct = pct(referenceYield);

  const aboveNormale = value >= referenceYield;
  const tone = aboveNormale ? GOOD : WARN;
  const potentialPct = potential > 0 ? Math.round((value / potential) * 100) : null;

  return (
    <Box sx={{ mx: 2, borderRadius: '18px', background: '#FFFFFF', border: '1px solid #E7E9E7', boxShadow: '0 4px 18px -12px rgba(1,80,70,0.35)', overflow: 'hidden' }}>
      {/* En-tête : valeur + part du potentiel */}
      <Box sx={{ px: 2, pt: 1.75, pb: 1.5, background: `linear-gradient(160deg, ${tone.soft} 0%, rgba(255,255,255,0) 70%)` }}>
        <Typography sx={{ fontFamily: "'Ubuntu', sans-serif", fontSize: 10.5, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: tone.deep, mb: 0.5 }}>
          Rendement estimé
        </Typography>
        <Stack direction="row" alignItems="flex-end" justifyContent="space-between" spacing={1}>
          <Stack direction="row" alignItems="baseline" spacing={0.75}>
            <Typography sx={{ fontFamily: "'Ubuntu', sans-serif", fontSize: 38, fontWeight: 700, color: tone.deep, lineHeight: 0.95, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em' }}>
              {fr1(value)}
            </Typography>
            <Typography sx={{ fontFamily: "'Ubuntu', sans-serif", fontSize: 14, fontWeight: 700, color: tone.main }}>{unit}</Typography>
          </Stack>
          {potentialPct != null && (
            <Stack alignItems="flex-end" spacing={0}>
              <Typography sx={{ fontFamily: "'Ubuntu', sans-serif", fontSize: 22, fontWeight: 700, color: tone.main, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
                {potentialPct}%
              </Typography>
              <Typography sx={{ fontFamily: "'Ubuntu', sans-serif", fontSize: 10.5, fontWeight: 600, color: '#8F9291', letterSpacing: '0.02em' }}>
                du potentiel
              </Typography>
            </Stack>
          )}
        </Stack>
      </Box>

      {/* Jauge : 0 → potentiel */}
      <Box sx={{ px: 2, pt: 2.75, pb: 1.25 }}>
        {/* Repère « Normale » flottant au-dessus de la piste */}
        <Box sx={{ position: 'relative', height: 16 }}>
          <Box
            sx={{
              position: 'absolute',
              left: `${normalePct}%`,
              transform: 'translateX(-50%)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              animation: `${fadeIn} 0.4s ease both 0.5s`,
              '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
            }}
          >
            <Typography sx={{ fontFamily: "'Ubuntu', sans-serif", fontSize: 10, fontWeight: 700, color: '#5C5F5E', whiteSpace: 'nowrap', lineHeight: 1 }}>
              Normale {fr1(referenceYield)}
            </Typography>
            <Box sx={{ width: 0, height: 0, mt: '2px', borderLeft: '3px solid transparent', borderRight: '3px solid transparent', borderTop: '4px solid #9AA6A2' }} />
          </Box>
        </Box>

        {/* Piste */}
        <Box sx={{ position: 'relative', height: 14, borderRadius: 999, background: '#EEF1F0' }}>
          {/* Bande de confiance (fourchette probable) */}
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: `${lowPct}%`,
              width: `${Math.max(highPct - lowPct, 1)}%`,
              borderRadius: 999,
              background: tone.soft,
              border: `1px solid ${tone.main}33`,
              animation: `${fadeIn} 0.5s ease both 0.35s`,
              '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
            }}
          />
          {/* Repère normale (trait vertical sur la piste) */}
          <Box sx={{ position: 'absolute', left: `${normalePct}%`, top: -3, bottom: -3, width: 2, transform: 'translateX(-50%)', background: '#9AA6A2', borderRadius: 2 }} />
          {/* Remplissage jusqu'à l'estimation */}
          <Box sx={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: `${valuePct}%`, borderRadius: 999, overflow: 'hidden' }}>
            <Box
              sx={{
                width: '100%',
                height: '100%',
                background: tone.fill,
                transformOrigin: 'left center',
                animation: `${grow} 0.9s cubic-bezier(0.22,0.61,0.36,1) both`,
                '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
              }}
            />
          </Box>
          {/* Curseur d'estimation */}
          <Box
            sx={{
              position: 'absolute',
              left: `${valuePct}%`,
              top: '50%',
              width: 18,
              height: 18,
              borderRadius: '50%',
              background: '#FFFFFF',
              border: `3.5px solid ${tone.main}`,
              boxShadow: `0 2px 6px ${tone.main}66`,
              transform: 'translate(-50%, -50%)',
              animation: `${pop} 0.45s cubic-bezier(0.34,1.56,0.64,1) both 0.65s`,
              '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
            }}
          />
        </Box>

        {/* Extrémités : départ ↔ potentiel */}
        <Stack direction="row" justifyContent="space-between" sx={{ mt: 1 }}>
          <Typography sx={{ fontFamily: "'Ubuntu', sans-serif", fontSize: 10.5, fontWeight: 600, color: '#B0B5B3' }}>0</Typography>
          <Typography sx={{ fontFamily: "'Ubuntu', sans-serif", fontSize: 11, fontWeight: 700, color: '#243F38' }}>
            {hasPotential ? `Potentiel ${fr1(potential)} ${unit}` : `Max ${fr1(ceiling)} ${unit}`}
          </Typography>
        </Stack>
      </Box>

      {/* Fine print : fourchette + fiabilité */}
      <Stack direction="row" alignItems="center" justifyContent="center" spacing={0.75} sx={{ px: 2, py: 1.25, borderTop: '1px solid #F0F2F1', background: '#FCFDFC' }}>
        <Typography sx={{ fontFamily: "'Ubuntu', sans-serif", fontSize: 11.5, color: '#5C5F5E' }}>
          Fourchette probable {fr1(confidenceInterval.low)}–{fr1(confidenceInterval.high)} {unit}
        </Typography>
        <Box sx={{ width: 3, height: 3, borderRadius: '50%', background: '#C4CCC9' }} />
        <Typography sx={{ fontFamily: "'Ubuntu', sans-serif", fontSize: 11.5, color: '#5C5F5E' }}>
          Fiabilité {Math.round(confidence)}%
        </Typography>
      </Stack>
    </Box>
  );
};
