import type { FunctionComponent } from 'react';

import LightbulbRounded from '@mui/icons-material/LightbulbRounded';
import ReportProblemRounded from '@mui/icons-material/ReportProblemRounded';
import { Box, Stack, Typography } from '@mui/material';

import type { StageRisk } from '../../parcelle.types';
import { riskSeverityStyle, riskTypeLabel } from '../itkVisuals';

/** Risque enrichi du nom de son stade d'origine. */
export interface RiskWithStage extends StageRisk {
  stageName: string;
}

const RiskCard: FunctionComponent<{ risk: RiskWithStage }> = ({ risk }) => {
  const sev = riskSeverityStyle(risk.severity);

  return (
    <Box
      sx={{
        mx: 2,
        mb: 1.25,
        borderRadius: '14px',
        background: '#FFFFFF',
        border: `1px solid ${sev.ring}`,
        overflow: 'hidden',
        boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
      }}
    >
      {/* Bandeau sévérité */}
      <Stack direction="row" alignItems="center" spacing={1} sx={{ px: 1.5, py: 1.125, background: sev.tint }}>
        <Box
          sx={{
            width: 26,
            height: 26,
            borderRadius: '50%',
            flexShrink: 0,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: sev.solid,
            '& svg': { fontSize: 15, color: '#FFFFFF' },
          }}
        >
          <ReportProblemRounded />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontFamily: "'Ubuntu', sans-serif", fontSize: 14, fontWeight: 700, color: '#1A1C1B', lineHeight: 1.25 }} noWrap>
            {risk.name}
          </Typography>
          {risk.scientificName && (
            <Typography sx={{ fontFamily: "'Ubuntu', sans-serif", fontSize: 11, fontStyle: 'italic', color: '#8F9291', lineHeight: 1.2 }} noWrap>
              {risk.scientificName}
            </Typography>
          )}
        </Box>
        <Box
          component="span"
          sx={{
            flexShrink: 0,
            px: 0.875,
            py: 0.3,
            borderRadius: 999,
            fontFamily: "'Ubuntu', sans-serif",
            fontSize: 10.5,
            fontWeight: 700,
            color: '#FFFFFF',
            background: sev.solid,
          }}
        >
          {sev.label}
        </Box>
      </Stack>

      <Box sx={{ px: 1.5, py: 1.25 }}>
        {/* Pourquoi */}
        <Typography sx={{ fontFamily: "'Ubuntu', sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#8F9291', mb: 0.4 }}>
          Pourquoi
        </Typography>
        <Typography sx={{ fontFamily: "'Ubuntu', sans-serif", fontSize: 13, color: '#3A3D3C', lineHeight: 1.5 }}>
          {risk.trigger}
        </Typography>

        {/* Que faire */}
        <Stack direction="row" spacing={0.875} sx={{ mt: 1.25, p: 1.125, borderRadius: '10px', background: 'rgba(1,134,117,0.06)' }}>
          <Box sx={{ flexShrink: 0, mt: '1px', '& svg': { fontSize: 17, color: '#018675' } }}>
            <LightbulbRounded />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontFamily: "'Ubuntu', sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#016557', mb: 0.3 }}>
              Que faire
            </Typography>
            <Typography sx={{ fontFamily: "'Ubuntu', sans-serif", fontSize: 13, fontWeight: 500, color: '#1A3D37', lineHeight: 1.5 }}>
              {risk.recommendation}
            </Typography>
          </Box>
        </Stack>

        <Typography sx={{ fontFamily: "'Ubuntu', sans-serif", fontSize: 10.5, color: '#A4ACA9', mt: 1 }}>
          {riskTypeLabel(risk.type)} · Stade {risk.stageName}
        </Typography>
      </Box>
    </Box>
  );
};

/** § Risques & recommandations — cartes issues des risques des stades ITK. */
export const RiskAdviceList: FunctionComponent<{ risks: RiskWithStage[] }> = ({ risks }) => {
  if (risks.length === 0) {
    return (
      <Typography sx={{ fontFamily: "'Ubuntu', sans-serif", fontSize: 13, color: '#8F9291', px: 3, py: 3, textAlign: 'center' }}>
        Aucun risque signalé à ce stade. Continuez le suivi habituel.
      </Typography>
    );
  }
  return (
    <>
      {risks.map((r, i) => (
        <RiskCard key={`${r.stageName}-${r.name}-${i}`} risk={r} />
      ))}
    </>
  );
};
