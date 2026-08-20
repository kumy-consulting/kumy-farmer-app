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
 * Le verdict de santé, traité comme le titre de l'écran : c'est la réponse à
 * « comment va mon exploitation ce matin ».
 *
 * Sous le mot, une échelle de vigilance et non une jauge de remplissage. Un
 * remplissage ne dit pas dans quel sens il se lit — un cran allumé sur trois
 * peut vouloir dire « presque vide » comme « premier palier franchi ». Ici les
 * trois paliers restent visibles, rangés du calme à l'alarme, et les deux bornes
 * sont gravées aux extrémités comme sur un cadran : le sens de lecture est écrit,
 * plus déduit. Les bornes tiennent sur la ligne de l'échelle — elles ne coûtent
 * aucune hauteur, et le palier du milieu se passe d'étiquette puisque le grand
 * mot le nomme déjà quand il est atteint.
 */
const SCALE = [
  { key: 'good', label: 'Bonne', color: '#6FE9C4', glow: 'rgba(111,233,196,0.45)' },
  { key: 'attention', label: 'À surveiller', color: '#FFC46B', glow: 'rgba(255,196,107,0.45)' },
  { key: 'critical', label: 'Critique', color: '#FF8F80', glow: 'rgba(255,143,128,0.45)' },
] as const satisfies ReadonlyArray<{ key: HomeRecap['health']; label: string; color: string; glow: string }>;

/**
 * Les paliers éteints restent neutres : sur ce fond vert, un vert pâle
 * disparaîtrait et l'échelle perdrait son premier cran. Ce sont les bornes
 * gravées qui portent le sens, pas une teinte.
 */
const IDLE = 'rgba(255,255,255,0.16)';

const boundSx = {
  fontSize: 9,
  fontWeight: 700,
  lineHeight: 1,
  letterSpacing: '0.09em',
  textTransform: 'uppercase',
  // 0,72 et non une graduation plus discrète : ces deux mots portent le sens de
  // lecture de l'échelle, ils doivent rester lisibles en plein soleil. À 9 px ils
  // restent malgré tout en retrait du reste.
  color: 'rgba(234,247,241,0.72)',
  whiteSpace: 'nowrap',
  flexShrink: 0,
} as const;

const reason = (fresh: number, stale: number): string => {
  const recent = fresh > 1 ? `${fresh} alertes récentes` : fresh === 1 ? '1 alerte récente' : 'aucune alerte récente';
  if (stale === 0) return recent;
  return `${recent}, ${stale > 1 ? `${stale} anciennes` : '1 ancienne'}`;
};

export const HealthGauge: FunctionComponent<HealthGaugeProps> = ({ health, fresh, stale }) => {
  const rank = SCALE.findIndex((step) => step.key === health);
  const level = SCALE[rank];

  return (
    <Stack spacing={1.25}>
      <Typography
        sx={{
          fontFamily: "'Ubuntu', sans-serif",
          fontSize: 30,
          fontWeight: 700,
          lineHeight: 1,
          letterSpacing: '-0.02em',
          color: level.color,
        }}
      >
        {level.label}
      </Typography>

      <Stack direction="row" alignItems="center" spacing={1} sx={{ height: 10 }}>
        <Typography component="span" sx={boundSx} aria-hidden>
          {SCALE[0].label}
        </Typography>

        <Stack
          direction="row"
          alignItems="center"
          spacing={0.75}
          role="meter"
          aria-valuemin={1}
          aria-valuemax={SCALE.length}
          aria-valuenow={rank + 1}
          aria-valuetext={level.label}
          aria-label="Niveau de vigilance de l’exploitation"
          sx={{ flex: 1, minWidth: 0, height: 10 }}
        >
          {SCALE.map((step, index) => {
            const active = index === rank;
            return (
              <Box
                key={step.key}
                sx={{
                  flex: 1,
                  borderRadius: 999,
                  // Le palier atteint se distingue par la hauteur autant que par
                  // la couleur : en plein soleil, ou pour un œil qui confond le
                  // rouge et le vert, la silhouette seule reste lisible.
                  height: active ? 8 : 3,
                  background: active ? step.color : IDLE,
                  boxShadow: active ? `0 3px 12px ${step.glow}` : 'none',
                  // Transition et non image-clé d'entrée : une animation qui ne
                  // tourne pas — onglet en arrière-plan, animations bridées par le
                  // système — fige l'élément sur son image de départ, donc sur un
                  // palier faux. Une transition part toujours du style de base, qui
                  // est déjà l'état juste ; elle ne joue qu'au changement d'état.
                  transition: 'height 0.3s ease, background 0.3s ease, box-shadow 0.3s ease',
                  '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
                }}
              />
            );
          })}
        </Stack>

        <Typography component="span" sx={boundSx} aria-hidden>
          {SCALE[SCALE.length - 1].label}
        </Typography>
      </Stack>

      <Typography sx={{ fontSize: 12, fontWeight: 500, color: 'rgba(234,247,241,0.64)' }}>
        Santé de l’exploitation ·{' '}
        <Box component="span" sx={{ fontWeight: 600, color: 'rgba(234,247,241,0.88)' }}>
          {reason(fresh, stale)}
        </Box>
      </Typography>
    </Stack>
  );
};
