import { useEffect, useRef, type FunctionComponent } from 'react';

import OpacityRounded from '@mui/icons-material/OpacityRounded';
import { Box, Stack, Typography } from '@mui/material';


import { M, fmtHour, fmtPct, fmtTemp, isCurrentHour } from './meteoFormat';
import { SectionTitre } from './SectionTitre';
import type { ForecastHour } from '../../domaines.types';

const CELL = 56;
const CHART_H = 52;
const PAD = 9;

/**
 * Bande horaire du jour : courbe de température, heure courante mise en avant et
 * risque de pluie sous chaque heure.
 *
 * La bande s'auto-centre sur « Maintenant » au montage — sur un téléphone, la
 * première heure visible serait sinon celle de minuit, jamais celle qui compte.
 */
export const PrevisionHeures: FunctionComponent<{ hours: ForecastHour[] }> = ({ hours }) => {
  const width = hours.length * CELL;
  const nowIndex = hours.findIndex((h) => isCurrentHour(h.ts));

  const connues = hours
    .map((h) => h.temp.value)
    .filter((t): t is number => typeof t === 'number');
  const min = connues.length ? Math.min(...connues) : 0;
  const max = connues.length ? Math.max(...connues) : 1;
  const span = max - min || 1;

  const x = (i: number): number => i * CELL + CELL / 2;
  const y = (v: number): number => PAD + (1 - (v - min) / span) * (CHART_H - PAD * 2);

  const points = hours
    .map((h, i) =>
      typeof h.temp.value === 'number' ? { i, px: x(i), py: y(h.temp.value) } : null,
    )
    .filter((p): p is { i: number; px: number; py: number } => p !== null);

  const ligne = points.map((p) => `${p.px},${p.py}`).join(' ');
  const aire =
    points.length > 1
      ? `${points[0].px},${CHART_H} ${ligne} ${points[points.length - 1].px},${CHART_H}`
      : '';

  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (nowIndex < 0) return;
    const el = scrollRef.current;
    if (!el) return;
    el.scrollLeft = Math.max(0, nowIndex * CELL + CELL / 2 - el.clientWidth / 2);
  }, [nowIndex]);

  return (
    <Box>
      <SectionTitre>Aujourd&apos;hui · heure par heure</SectionTitre>
      <Box
        ref={scrollRef}
        sx={{
          overflowX: 'auto',
          borderRadius: '16px',
          border: `1px solid ${M.hair}`,
          background: M.paperTile,
          px: 0.5,
          py: 1,
        }}
      >
        <Box sx={{ position: 'relative', width, minWidth: '100%' }}>
          {nowIndex >= 0 && (
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: nowIndex * CELL,
                width: CELL,
                borderRadius: '12px',
                background: 'rgba(1,134,117,0.07)',
                border: '1px solid rgba(1,134,117,0.20)',
              }}
            />
          )}

          {/* Ligne des heures — la colonne courante est masquée, la pastille
              « Maintenant » la recouvre sans contraindre la largeur des cases. */}
          <Box sx={{ display: 'flex', position: 'relative', height: 18 }}>
            {hours.map((h, i) => (
              <Typography
                key={h.ts}
                sx={{
                  width: CELL,
                  textAlign: 'center',
                  fontSize: 11,
                  fontWeight: 500,
                  color: M.inkMute,
                  visibility: i === nowIndex ? 'hidden' : 'visible',
                }}
              >
                {fmtHour(h.ts)}
              </Typography>
            ))}

            {nowIndex >= 0 && (
              <Box
                sx={{
                  position: 'absolute',
                  top: -1,
                  left: nowIndex * CELL + CELL / 2,
                  transform: 'translateX(-50%)',
                  px: 0.75,
                  py: 0.25,
                  borderRadius: 999,
                  backgroundColor: M.green,
                }}
              >
                <Typography
                  sx={{
                    fontSize: 9.5,
                    fontWeight: 700,
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                    color: '#FFFFFF',
                    whiteSpace: 'nowrap',
                    lineHeight: 1.3,
                  }}
                >
                  Maintenant
                </Typography>
              </Box>
            )}
          </Box>

          {/* La marge haute laisse passer les étiquettes de température, posées
              18 px au-dessus de leur point : sans elle, le point le plus chaud
              du jour écrivait par-dessus la ligne des heures. */}
          <Box sx={{ position: 'relative', height: CHART_H, mt: 2.25, mb: 0.25 }}>
            <Box
              component="svg"
              viewBox={`0 0 ${width} ${CHART_H}`}
              width={width}
              height={CHART_H}
              preserveAspectRatio="none"
              sx={{ position: 'absolute', inset: 0, display: 'block' }}
            >
              <defs>
                <linearGradient id="kmyTempArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={M.green} stopOpacity="0.22" />
                  <stop offset="100%" stopColor={M.green} stopOpacity="0" />
                </linearGradient>
              </defs>
              {aire && <polygon points={aire} fill="url(#kmyTempArea)" />}
              {ligne && (
                <polyline
                  points={ligne}
                  fill="none"
                  stroke={M.green}
                  strokeWidth={2}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
              )}
              {points.map((p) => (
                <circle
                  key={p.i}
                  cx={p.px}
                  cy={p.py}
                  r={p.i === nowIndex ? 4 : 2.5}
                  fill={p.i === nowIndex ? M.green : M.paper}
                  stroke={M.green}
                  strokeWidth={2}
                />
              ))}
            </Box>

            {points.map((p) => (
              <Typography
                key={p.i}
                sx={{
                  position: 'absolute',
                  left: p.px,
                  // Toujours 20 px au-dessus du point, sans butée : l'étiquette
                  // du point le plus haut débordait sinon sur son propre marqueur.
                  top: p.py - 20,
                  transform: 'translateX(-50%)',
                  fontFamily: "'Ubuntu', sans-serif",
                  fontSize: 12,
                  fontWeight: 700,
                  color: M.ink,
                }}
              >
                {fmtTemp(hours[p.i].temp.value)}
              </Typography>
            ))}
          </Box>

          <Box sx={{ display: 'flex' }}>
            {hours.map((h) => (
              <Stack key={h.ts} alignItems="center" sx={{ width: CELL }}>
                <OpacityRounded
                  sx={{
                    fontSize: 11,
                    color: (h.rainRisk.value ?? 0) >= 0.3 ? M.sky : M.inkMute,
                    opacity: (h.rainRisk.value ?? 0) >= 0.05 ? 1 : 0.35,
                  }}
                />
                <Typography sx={{ fontSize: 10.5, fontWeight: 500, color: M.sky }}>
                  {fmtPct(h.rainRisk.value)}
                </Typography>
              </Stack>
            ))}
          </Box>
        </Box>
      </Box>
    </Box>
  );
};
