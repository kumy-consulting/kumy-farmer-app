import { useMemo, type FunctionComponent } from 'react';

import { Box, Stack, Typography } from '@mui/material';

import { ndviColor } from '@/features/Domaines/components/detailVisuals';

import type { IndicatorPoint } from '../../parcelle.types';

interface NdviTrendProps {
  indicators: IndicatorPoint[];
}

const W = 320;
const H = 96;
const PAD_X = 6;
const PAD_Y = 10;

interface Pt {
  x: number;
  y: number;
  ndvi: number;
  date: string;
}

/** § Évolution végétation — mini-courbe NDVI (SVG inline, sans dépendance graphique). */
export const NdviTrend: FunctionComponent<NdviTrendProps> = ({ indicators }) => {
  const points = useMemo<Pt[]>(() => {
    // Série filtrée sur les NDVI valides, triée par date croissante.
    const valid = indicators
      .filter((d) => typeof d.ndvi === 'number' && (d.ndvi as number) > 0)
      .map((d) => ({ date: d.date, ndvi: d.ndvi as number }))
      .sort((a, b) => a.date.localeCompare(b.date));

    if (valid.length === 0) return [];

    const n = valid.length;
    return valid.map((d, i) => {
      const x = n === 1 ? W / 2 : PAD_X + (i / (n - 1)) * (W - 2 * PAD_X);
      // NDVI borné [0,1] → y inversé.
      const clamped = Math.min(1, Math.max(0, d.ndvi));
      const y = PAD_Y + (1 - clamped) * (H - 2 * PAD_Y);
      return { x, y, ndvi: d.ndvi, date: d.date };
    });
  }, [indicators]);

  if (points.length === 0) {
    return (
      <Typography sx={{ fontFamily: "'Ubuntu', sans-serif", fontSize: 13, color: '#8F9291', px: 3, py: 3, textAlign: 'center' }}>
        Pas encore de mesure NDVI pour tracer l'évolution.
      </Typography>
    );
  }

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const areaPath = `${linePath} L${points[points.length - 1].x.toFixed(1)},${H - PAD_Y} L${points[0].x.toFixed(1)},${H - PAD_Y} Z`;
  const last = points[points.length - 1];
  const stroke = ndviColor(last.ndvi);

  const fmt = (iso: string) => {
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  return (
    <Box sx={{ mx: 2, mb: 1 }}>
      <Box sx={{ p: 1.5, borderRadius: '16px', background: '#FFFFFF', border: '1px solid #E2E3E1', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
        <Box sx={{ width: '100%' }}>
          <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} preserveAspectRatio="none" role="img" aria-label="Évolution du NDVI">
            {/* Repères horizontaux 0.35 (faible) et 0.65 (bon) */}
            {[0.35, 0.65].map((v) => {
              const y = PAD_Y + (1 - v) * (H - 2 * PAD_Y);
              return <line key={v} x1={PAD_X} y1={y} x2={W - PAD_X} y2={y} stroke="rgba(55,75,70,0.10)" strokeWidth={1} strokeDasharray="3 4" />;
            })}
            <path d={areaPath} fill={`${stroke}1F`} stroke="none" />
            <path d={linePath} fill="none" stroke={stroke} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
            {points.map((p, i) => (
              <circle key={i} cx={p.x} cy={p.y} r={i === points.length - 1 ? 4 : 2.5} fill={i === points.length - 1 ? stroke : '#FFFFFF'} stroke={stroke} strokeWidth={1.5} />
            ))}
          </svg>
        </Box>
        <Stack direction="row" justifyContent="space-between" sx={{ mt: 0.5 }}>
          <Typography sx={{ fontFamily: "'Ubuntu', sans-serif", fontSize: 10.5, color: '#8F9291' }}>{fmt(points[0].date)}</Typography>
          <Typography sx={{ fontFamily: "'Ubuntu', sans-serif", fontSize: 10.5, color: '#8F9291' }}>{fmt(last.date)}</Typography>
        </Stack>
      </Box>
    </Box>
  );
};
