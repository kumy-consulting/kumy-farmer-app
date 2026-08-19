import type { FunctionComponent } from 'react';

import { Box, Stack, Typography } from '@mui/material';

import type { HomeRecap } from '../useHomeFeed';

interface HealthGaugeProps {
  health: HomeRecap['health'];
  /** Alertes récentes — celles que la section Alertes montre. */
  fresh: number;
  /** Alertes actives mais sans suite depuis plus d'une semaine. */
  stale: number;
}

/**
 * Trois crans, remplis comme un niveau : trois barres pour une exploitation
 * saine, une seule quand c'est critique. La santé n'est qu'un verdict à trois
 * valeurs — une jauge continue prétendrait mesurer ce que la donnée ne dit pas.
 */
const LEVEL: Record<HomeRecap['health'], { filled: number; label: string; color: string }> = {
  good: { filled: 3, label: 'Bonne', color: '#5EF0C8' },
  attention: { filled: 2, label: 'À surveiller', color: '#FFC46B' },
  critical: { filled: 1, label: 'Critique', color: '#FF9E92' },
};

/**
 * Le motif compte ce que l'écran montre. Quand des alertes dorment sans suite,
 * il le dit — sinon l'en-tête et le badge de la section se contrediraient.
 */
const reason = (fresh: number, stale: number): string => {
  const recent = fresh > 1 ? `${fresh} alertes récentes` : fresh === 1 ? '1 alerte récente' : 'aucune alerte récente';
  if (stale === 0) return recent;
  return `${recent} · ${stale > 1 ? `${stale} anciennes` : '1 ancienne'}`;
};

export const HealthGauge: FunctionComponent<HealthGaugeProps> = ({ health, fresh, stale }) => {
  const level = LEVEL[health];

  return (
    <Stack spacing={0.6} sx={{ mt: 1.5 }}>
      <Stack direction="row" alignItems="center" spacing={1}>
        <Stack
          direction="row"
          spacing={0.5}
          role="meter"
          aria-valuemin={1}
          aria-valuemax={3}
          aria-valuenow={level.filled}
          aria-label={`Santé de l’exploitation : ${level.label}`}
          sx={{ flex: 1, maxWidth: 168 }}
        >
          {[0, 1, 2].map((index) => (
            <Box
              key={index}
              sx={{
                flex: 1,
                height: 6,
                borderRadius: 999,
                background: index < level.filled ? level.color : 'rgba(255,255,255,0.16)',
                transition: 'background 0.3s ease',
              }}
            />
          ))}
        </Stack>
        <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: level.color, whiteSpace: 'nowrap' }}>
          {level.label}
        </Typography>
      </Stack>

      <Typography sx={{ fontSize: 11.5, fontWeight: 500, color: 'rgba(234,247,241,0.62)' }}>
        Santé de l’exploitation · {reason(fresh, stale)}
      </Typography>
    </Stack>
  );
};
