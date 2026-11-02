import type { FunctionComponent } from 'react';

import { Box, Stack, Typography } from '@mui/material';

import { healthVerdict, ndviColor, ndviLabel, type HealthTone } from '@/features/Domaines/components/detailVisuals';
import type { AlertSeverity } from '@/features/Domaines/domaines.types';

interface HealthSynthesisProps {
  ndvi: number | null;
  /** Pire sévérité de risque du stade courant (mappée depuis StageRisk.severity). */
  worstSeverity?: AlertSeverity;
  /** Date de la mesure NDVI la plus récente (fraîcheur). */
  lastNdviDate?: string;
  /** Nom du stade courant (contexte). */
  currentStageName?: string;
}

const TONE_STYLE: Record<HealthTone, { bg: string; ring: string; dot: string; text: string }> = {
  critical: { bg: 'rgba(229,57,53,0.08)', ring: 'rgba(229,57,53,0.24)', dot: '#E53935', text: '#B3261E' },
  warning: { bg: 'rgba(245,158,11,0.10)', ring: 'rgba(245,158,11,0.28)', dot: '#F59E0B', text: '#A85D00' },
  ok: { bg: 'rgba(1,134,117,0.08)', ring: 'rgba(1,134,117,0.22)', dot: '#018675', text: '#016557' },
  neutral: { bg: 'rgba(55,75,70,0.06)', ring: 'rgba(55,75,70,0.16)', dot: '#8F9291', text: '#5C5F5E' },
};

const formatDate = (iso?: string): string | null => {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
};

/** § Synthèse santé — verdict calculé côté client (NDVI + pire risque + fraîcheur). */
export const HealthSynthesis: FunctionComponent<HealthSynthesisProps> = ({
  ndvi,
  worstSeverity,
  lastNdviDate,
  currentStageName,
}) => {
  const verdict = healthVerdict(worstSeverity, ndvi);
  const tone = TONE_STYLE[verdict.tone];
  const dateStr = formatDate(lastNdviDate);

  const message =
    verdict.tone === 'critical'
      ? 'Situation à risque : suivez de près les recommandations ci-dessous.'
      : verdict.tone === 'warning'
        ? 'Quelques points de vigilance à surveiller sur cette parcelle.'
        : verdict.tone === 'ok'
          ? 'La parcelle se porte bien. Continuez le suivi habituel.'
          : 'Pas encore assez de données pour évaluer la santé de la parcelle.';

  return (
    <Box sx={{ mx: 2, mt: 2, mb: 1 }}>
      <Box
        sx={{
          p: 1.75,
          borderRadius: '16px',
          background: tone.bg,
          border: `1px solid ${tone.ring}`,
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1}>
          <Box sx={{ width: 10, height: 10, borderRadius: '50%', background: tone.dot, flexShrink: 0 }} />
          <Typography sx={{ fontFamily: "'Ubuntu', sans-serif", fontSize: 17, fontWeight: 700, color: tone.text, flex: 1 }}>
            {verdict.label}
          </Typography>
          {ndvi != null && (
            <Stack direction="row" alignItems="baseline" spacing={0.5} sx={{ flexShrink: 0 }}>
              <Typography
                sx={{ fontFamily: "'Ubuntu', sans-serif", fontSize: 15, fontWeight: 700, color: ndviColor(ndvi), fontVariantNumeric: 'tabular-nums' }}
              >
                {ndvi.toFixed(2)}
              </Typography>
              <Typography sx={{ fontFamily: "'Ubuntu', sans-serif", fontSize: 11, fontWeight: 600, color: ndviColor(ndvi) }}>
                NDVI · {ndviLabel(ndvi)}
              </Typography>
            </Stack>
          )}
        </Stack>

        <Typography sx={{ fontFamily: "'Ubuntu', sans-serif", fontSize: 13, color: '#3A3D3C', lineHeight: 1.5, mt: 1 }}>
          {message}
        </Typography>

        {(currentStageName || dateStr) && (
          <Typography sx={{ fontFamily: "'Ubuntu', sans-serif", fontSize: 11, color: '#8F9291', mt: 1 }}>
            {[currentStageName && `Stade : ${currentStageName}`, dateStr && `NDVI du ${dateStr}`]
              .filter(Boolean)
              .join(' · ')}
          </Typography>
        )}
      </Box>
    </Box>
  );
};
