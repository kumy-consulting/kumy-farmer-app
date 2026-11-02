import type { FunctionComponent, ReactNode } from 'react';

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
 * ⚠️ EXPLORATION EN COURS — la piste retenue se change ici, sur une ligne.
 *
 * `'B'` est à l'essai. Les autres restent montées le temps de décider :
 *   'scale' · l'échelle horizontale à bornes gravées (l'état précédent)
 *   'A'     · pastille de vigilance, mot en capitales 12,5 px
 *   'B'     · cadran circulaire à trois arcs, nombre d'alertes au centre
 *   'C'     · demi-cadran d'instrument
 *   'D'     · disque d'état plein
 *
 * À nettoyer une fois le choix arrêté : ne garder que la piste retenue.
 */
type Variant = 'scale' | 'A' | 'B' | 'C' | 'D';

const VARIANT: Variant = 'B';

/** Emblème centré dans la largeur, ou calé à gauche comme le reste de l'en-tête. */
const CENTERED = true;

const SCALE = [
  { key: 'good', label: 'Bonne', color: '#6FE9C4', glow: 'rgba(111,233,196,0.45)' },
  { key: 'attention', label: 'À surveiller', color: '#FFC46B', glow: 'rgba(255,196,107,0.45)' },
  // Corail éclairci pour le fond #0E7A67 : #FF8F80 y tombait à 2,37:1, sous le
  // plancher. Le verdict le plus grave ne doit pas être le premier à s'effacer.
  { key: 'critical', label: 'Critique', color: '#FFB1A6', glow: 'rgba(255,177,166,0.45)' },
] as const satisfies ReadonlyArray<{ key: HomeRecap['health']; label: string; color: string; glow: string }>;

/**
 * Les paliers éteints restent neutres : sur ce fond vert, un vert pâle
 * disparaîtrait et l'échelle perdrait son premier cran.
 */
const IDLE = 'rgba(255,255,255,0.34)';

const reason = (fresh: number, stale: number): string => {
  const recent = fresh > 1 ? `${fresh} alertes récentes` : fresh === 1 ? '1 alerte récente' : 'aucune alerte récente';
  if (stale === 0) return recent;
  return `${recent}, ${stale > 1 ? `${stale} anciennes` : '1 ancienne'}`;
};

const Reason: FunctionComponent<{ fresh: number; stale: number; centre?: boolean }> = ({ fresh, stale, centre }) => (
  <Typography sx={{ fontSize: 12, fontWeight: 500, color: '#EAF7F1', textAlign: centre ? 'center' : 'left' }}>
    Santé de l’exploitation ·{' '}
    <Box component="span" sx={{ fontWeight: 600, color: 'rgba(234,247,241,0.88)' }}>
      {reason(fresh, stale)}
    </Box>
  </Typography>
);

interface BodyProps {
  rank: number;
  fresh: number;
  stale: number;
}

/** Sémantique commune à toutes les pistes : un niveau sur trois, nommé. */
const Meter: FunctionComponent<{ rank: number; children: ReactNode; sx?: object }> = ({ rank, children, sx }) => (
  <Box
    role="meter"
    aria-valuemin={1}
    aria-valuemax={SCALE.length}
    aria-valuenow={rank + 1}
    aria-valuetext={SCALE[rank].label}
    aria-label="Niveau de vigilance de l’exploitation"
    sx={sx}
  >
    {children}
  </Box>
);

const Name: FunctionComponent<{ rank: number }> = ({ rank }) => (
  <Typography
    sx={{
      fontFamily: "'Ubuntu', sans-serif",
      fontSize: 19,
      fontWeight: 700,
      lineHeight: 1.1,
      color: SCALE[rank].color,
    }}
  >
    {SCALE[rank].label}
  </Typography>
);

/** Enveloppe commune aux pistes à emblème : le signe, son nom, puis le motif. */
const Emblem: FunctionComponent<{ rank: number; fresh: number; stale: number; children: ReactNode; gap?: number }> = ({
  rank,
  fresh,
  stale,
  children,
  gap = 0.75,
}) => (
  <Stack spacing={1} alignItems={CENTERED ? 'center' : 'flex-start'} sx={CENTERED ? { width: '100%' } : undefined}>
    <Stack alignItems="center" spacing={gap}>
      {children}
      <Name rank={rank} />
    </Stack>
    <Reason fresh={fresh} stale={stale} centre={CENTERED} />
  </Stack>
);

/* ── B · CADRAN CIRCULAIRE ────────────────────────────────────────────────── */

const Ring: FunctionComponent<{ rank: number; size: number; centre: string }> = ({ rank, size, centre }) => {
  const r = 22;
  const circumference = 2 * Math.PI * r;
  const arc = (94 / 360) * circumference;
  const gap = circumference - arc;
  return (
    <Box sx={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <Box component="svg" viewBox="0 0 56 56" aria-hidden sx={{ width: size, height: size, display: 'block' }}>
        {SCALE.map((step, index) => (
          <circle
            key={step.key}
            cx="28"
            cy="28"
            r={r}
            fill="none"
            stroke={index === rank ? step.color : IDLE}
            strokeWidth={index === rank ? 7 : 4}
            strokeLinecap="round"
            strokeDasharray={`${arc} ${gap}`}
            transform={`rotate(${index * 120 - 88} 28 28)`}
          />
        ))}
      </Box>
      {/* Le compte est déjà annoncé par la ligne de motif : inutile de le répéter
          aux lecteurs d'écran depuis l'intérieur du cadran. */}
      <Box
        aria-hidden
        sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <Typography
          sx={{
            fontFamily: "'Ubuntu', sans-serif",
            fontSize: 19,
            fontWeight: 700,
            lineHeight: 1,
            color: SCALE[rank].color,
          }}
        >
          {centre}
        </Typography>
      </Box>
    </Box>
  );
};

/* ── C · DEMI-CADRAN ──────────────────────────────────────────────────────── */

const HalfDial: FunctionComponent<{ rank: number }> = ({ rank }) => {
  const r = 26;
  const segment = (index: number) => {
    const from = 180 + index * 60 + 7;
    const to = 180 + (index + 1) * 60 - 7;
    const point = (angle: number) => [
      32 + r * Math.cos((angle * Math.PI) / 180),
      32 + r * Math.sin((angle * Math.PI) / 180),
    ];
    const [x0, y0] = point(from);
    const [x1, y1] = point(to);
    return `M ${x0} ${y0} A ${r} ${r} 0 0 1 ${x1} ${y1}`;
  };
  return (
    <Box component="svg" viewBox="0 0 64 38" aria-hidden sx={{ width: 64, height: 38, flexShrink: 0 }}>
      {SCALE.map((step, index) => (
        <path
          key={step.key}
          d={segment(index)}
          fill="none"
          stroke={index === rank ? step.color : IDLE}
          strokeWidth={index === rank ? 7 : 4}
          strokeLinecap="round"
        />
      ))}
    </Box>
  );
};

/* ── D · DISQUE D'ÉTAT ────────────────────────────────────────────────────── */

const Disc: FunctionComponent<{ rank: number; centre: string }> = ({ rank, centre }) => {
  const level = SCALE[rank];
  return (
    <Box
      aria-hidden
      sx={{
        width: 50,
        height: 50,
        flexShrink: 0,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: `${level.color}1F`,
        border: `2.5px solid ${level.color}`,
        boxShadow: `0 0 14px ${level.glow}`,
      }}
    >
      <Typography
        sx={{ fontFamily: "'Ubuntu', sans-serif", fontSize: 21, fontWeight: 700, lineHeight: 1, color: level.color }}
      >
        {centre}
      </Typography>
    </Box>
  );
};

/* ── A · PASTILLE ─────────────────────────────────────────────────────────── */

const Pill: FunctionComponent<BodyProps> = ({ rank, fresh, stale }) => {
  const level = SCALE[rank];
  return (
    <Stack spacing={1} alignItems="flex-start">
      <Stack
        direction="row"
        alignItems="center"
        spacing={0.85}
        sx={{
          px: 1.35,
          py: 0.65,
          borderRadius: 999,
          background: `${level.color}22`,
          border: `1px solid ${level.color}66`,
        }}
      >
        <Box
          sx={{ width: 7, height: 7, borderRadius: 999, background: level.color, boxShadow: `0 0 8px ${level.glow}` }}
        />
        <Typography
          sx={{
            fontFamily: "'Ubuntu', sans-serif",
            fontSize: 12.5,
            fontWeight: 700,
            letterSpacing: '0.09em',
            textTransform: 'uppercase',
            color: level.color,
          }}
        >
          {level.label}
        </Typography>
      </Stack>
      <Reason fresh={fresh} stale={stale} />
    </Stack>
  );
};

/* ── « scale » · l'échelle horizontale à bornes gravées ───────────────────── */

const boundSx = {
  fontSize: 9,
  fontWeight: 700,
  lineHeight: 1,
  letterSpacing: '0.09em',
  textTransform: 'uppercase',
  color: '#EAF7F1',
  whiteSpace: 'nowrap',
  flexShrink: 0,
} as const;

const HorizontalScale: FunctionComponent<BodyProps> = ({ rank, fresh, stale }) => (
  <Stack spacing={1.25}>
    <Typography
      sx={{
        fontFamily: "'Ubuntu', sans-serif",
        fontSize: 30,
        fontWeight: 700,
        lineHeight: 1,
        letterSpacing: '-0.02em',
        color: SCALE[rank].color,
      }}
    >
      {SCALE[rank].label}
    </Typography>
    <Stack direction="row" alignItems="center" spacing={1} sx={{ height: 10 }}>
      <Typography component="span" sx={boundSx} aria-hidden>
        {SCALE[0].label}
      </Typography>
      <Stack direction="row" alignItems="center" spacing={0.75} sx={{ flex: 1, minWidth: 0, height: 10 }}>
        {SCALE.map((step, index) => (
          <Box
            key={step.key}
            sx={{
              flex: 1,
              borderRadius: 999,
              height: index === rank ? 8 : 3,
              background: index === rank ? step.color : IDLE,
              boxShadow: index === rank ? `0 3px 12px ${step.glow}` : 'none',
              transition: 'height 0.3s ease, background 0.3s ease, box-shadow 0.3s ease',
              '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
            }}
          />
        ))}
      </Stack>
      <Typography component="span" sx={boundSx} aria-hidden>
        {SCALE[SCALE.length - 1].label}
      </Typography>
    </Stack>
    <Reason fresh={fresh} stale={stale} />
  </Stack>
);

/**
 * Le verdict de santé : la réponse à « comment va mon exploitation ce matin ».
 *
 * Trois valeurs, jamais un continuum — d'où l'absence de remplissage progressif
 * dans toutes les pistes : seul le palier atteint s'allume, les autres restent
 * des repères éteints.
 */
const RingEmblem: FunctionComponent<BodyProps> = ({ rank, fresh, stale }) => (
  <Emblem rank={rank} fresh={fresh} stale={stale}>
    <Ring rank={rank} size={54} centre={String(fresh)} />
  </Emblem>
);

const HalfDialEmblem: FunctionComponent<BodyProps> = ({ rank, fresh, stale }) => (
  <Emblem rank={rank} fresh={fresh} stale={stale} gap={0.5}>
    <HalfDial rank={rank} />
  </Emblem>
);

const DiscEmblem: FunctionComponent<BodyProps> = ({ rank, fresh, stale }) => (
  <Emblem rank={rank} fresh={fresh} stale={stale}>
    <Disc rank={rank} centre={String(fresh)} />
  </Emblem>
);

/**
 * Table de rendu plutôt qu'une cascade de `if` : TypeScript réduit `VARIANT` à
 * son littéral et déclarerait les autres branches inatteignables. Une clé
 * d'objet contourne la réduction, et changer de piste reste une ligne.
 */
const VARIANTS: Record<Variant, { Body: FunctionComponent<BodyProps>; wide: boolean }> = {
  scale: { Body: HorizontalScale, wide: false },
  A: { Body: Pill, wide: false },
  B: { Body: RingEmblem, wide: true },
  C: { Body: HalfDialEmblem, wide: true },
  D: { Body: DiscEmblem, wide: true },
};

/**
 * Le verdict de santé : la réponse à « comment va mon exploitation ce matin ».
 *
 * Trois valeurs, jamais un continuum — d'où l'absence de remplissage progressif
 * dans toutes les pistes : seul le palier atteint s'allume, les autres restent
 * des repères éteints.
 */
export const HealthGauge: FunctionComponent<HealthGaugeProps> = ({ health, fresh, stale }) => {
  const rank = SCALE.findIndex((step) => step.key === health);
  const { Body, wide } = VARIANTS[VARIANT];

  return (
    <Meter rank={rank} sx={wide && CENTERED ? { width: '100%' } : undefined}>
      <Body rank={rank} fresh={fresh} stale={stale} />
    </Meter>
  );
};
