import type { FunctionComponent, ReactNode } from 'react';

import type { SvgIconComponent } from '@mui/icons-material';
import AirRounded from '@mui/icons-material/AirRounded';
import BatteryFullRounded from '@mui/icons-material/BatteryFullRounded';
import GrainRounded from '@mui/icons-material/GrainRounded';
import SensorsRounded from '@mui/icons-material/SensorsRounded';
import SignalCellularAltRounded from '@mui/icons-material/SignalCellularAltRounded';
import SpeedRounded from '@mui/icons-material/SpeedRounded';
import TrendingDownRounded from '@mui/icons-material/TrendingDownRounded';
import TrendingFlatRounded from '@mui/icons-material/TrendingFlatRounded';
import TrendingUpRounded from '@mui/icons-material/TrendingUpRounded';
import WaterDropRounded from '@mui/icons-material/WaterDropRounded';
import { Box, Stack, Typography } from '@mui/material';

import { M, fmtAgo, fmtDateTime, fmtNum } from './meteoFormat';
import { SectionTitre } from './SectionTitre';
import type {
  FarmStationLive,
  PressureTrend,
  StationLiveMeasure,
} from '../../domaines.types';

interface StationKitCardProps {
  station: FarmStationLive;
}

/**
 * La pastille respire tant que le kit émet.
 *
 * C'est la seule animation de la carte, et elle dit la seule chose qu'un
 * chiffre ne peut pas dire : ça arrive en ce moment.
 */
const Pastille: FunctionComponent<{ online: boolean }> = ({ online }) => (
  <Stack
    direction="row"
    alignItems="center"
    spacing={0.5}
    sx={{
      px: 0.9,
      py: 0.3,
      borderRadius: 999,
      background: online ? 'rgba(1,134,117,0.12)' : 'rgba(183,28,28,0.10)',
    }}
  >
    <Box
      sx={{
        width: 7,
        height: 7,
        borderRadius: '50%',
        background: online ? M.green : M.red,
        ...(online && {
          animation: 'kitPouls 2.4s ease-in-out infinite',
          '@keyframes kitPouls': {
            '0%, 100%': { opacity: 1, transform: 'scale(1)' },
            '50%': { opacity: 0.45, transform: 'scale(0.82)' },
          },
          '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
        }),
      }}
    />
    <Typography sx={{ fontSize: 11, fontWeight: 700, color: online ? M.greenDeep : M.red }}>
      {online ? 'En direct' : 'Hors ligne'}
    </Typography>
  </Stack>
);

/** Un fait de santé du kit, accroché à la ligne de fraîcheur. */
const Sante: FunctionComponent<{ icon: SvgIconComponent; texte: string }> = ({
  icon: Icon,
  texte,
}) => (
  <Stack direction="row" alignItems="center" spacing={0.3} sx={{ ml: 1 }}>
    <Icon sx={{ fontSize: 14, color: M.inkMute }} />
    <Typography sx={{ fontSize: 11.5, color: M.inkSoft }}>{texte}</Typography>
  </Stack>
);

const FLECHE: Record<PressureTrend['direction'], SvgIconComponent> = {
  falling: TrendingDownRounded,
  steady: TrendingFlatRounded,
  rising: TrendingUpRounded,
};

const MOT: Record<PressureTrend['direction'], string> = {
  falling: 'en baisse',
  steady: 'stable',
  rising: 'en hausse',
};

/**
 * Tendance barométrique, sous la valeur de pression.
 *
 * Le sens vient du serveur (`direction`), jamais d'un recalcul local : les deux
 * verdicts divergeraient sur les bords du seuil. La flèche porte le signe, le
 * texte porte l'écart en valeur absolue — répéter le « − » ferait doublon.
 *
 * Stable ne montre pas de chiffre : un « 0.4 hPa en 3 h » n'ajoute rien à
 * « stable », il encombre une case de 170 px.
 */
const Tendance: FunctionComponent<{ trend: PressureTrend }> = ({ trend }) => {
  const Fleche = FLECHE[trend.direction];
  return (
    <Stack direction="row" alignItems="center" spacing={0.3}>
      <Fleche sx={{ fontSize: 13, color: M.inkMute }} />
      <Typography sx={{ fontSize: 10.5, color: M.inkMute }}>
        {trend.direction === 'steady'
          ? `stable depuis ${trend.windowHours} h`
          : `${MOT[trend.direction]} · ${Math.abs(trend.deltaHpa).toFixed(1)} hPa en ${trend.windowHours} h`}
      </Typography>
    </Stack>
  );
};

interface Mesure {
  icon: SvgIconComponent;
  label: string;
  value: string;
  sub?: ReactNode;
}

const fmtMesure = (m: StationLiveMeasure | undefined, digits: number): string =>
  m ? fmtNum(m.value, m.unit, digits) : '—';

/**
 * Carte du kit météo posé sur le domaine : ce qu'il mesure, à l'instant.
 *
 * Cinq mesures ne tiennent pas dans une grille à deux colonnes — la cinquième
 * reste orpheline. On ne répare pas la grille, on change le compte : la
 * température devient LA lecture, les quatre autres deviennent un cadran. Les
 * bordures des tuiles tombent avec elles : page, carte et tuiles faisaient
 * trois cadres emboîtés pour un contenu qui n'a jamais été cinq objets séparés.
 *
 * Deux mesures ont changé de place pour une raison de sens, pas de gabarit.
 * `rainRate` monte qualifier la lecture — c'est l'événement du moment, pas une
 * sous-ligne. `rainfall24h` reste dans le cadran : c'est un cumul. `rainfall`
 * (compteur cumulatif brut de la station depuis sa pose) n'est toujours affiché
 * nulle part.
 *
 * La pression, longtemps écartée comme « pas actionnable », revient AVEC sa
 * tendance : c'est la variation qui informe, pas la valeur — en hivernage une
 * chute marquée précède les lignes de grains.
 */
export const StationKitCard: FunctionComponent<StationKitCardProps> = ({ station }) => {
  const { live, online } = station;
  const dim = !online;

  // Sans pluviomètre, la carte se tait : annoncer « pas de pluie » à partir
  // d'un capteur absent serait inventer une mesure.
  const aPluviometre = live.rainRate !== undefined;
  const pluieEnCours = typeof live.rainRate?.value === 'number' && live.rainRate.value > 0;

  const mesures: Mesure[] = [
    { icon: WaterDropRounded, label: 'Humidité', value: fmtMesure(live.humidity, 0) },
    {
      icon: AirRounded,
      label: 'Vent',
      value: fmtMesure(live.windSpeed, 0),
      sub: live.windDir?.label ? `dir. ${live.windDir.label}` : undefined,
    },
    {
      icon: GrainRounded,
      label: live.rainfall24h ? 'Pluie · 24 h' : 'Pluie',
      value: live.rainfall24h ? `${live.rainfall24h.valueMm.toFixed(1)} mm` : '—',
    },
    ...(live.pressure
      ? [
          {
            icon: SpeedRounded,
            label: 'Pression',
            value: fmtMesure(live.pressure, 0),
            sub: live.pressure.trend3h ? <Tendance trend={live.pressure.trend3h} /> : undefined,
          },
        ]
      : []),
  ];

  // Quatre mesures → 2×2. Trois → une seule rangée. Jamais d'orpheline.
  const colonnes = mesures.length === 4 ? 2 : mesures.length;

  const temp = live.temperature;

  return (
    <Box
      sx={{
        borderRadius: '16px',
        border: `1px solid ${M.hair}`,
        background: M.paperTile,
        overflow: 'hidden',
        mb: 2,
      }}
    >
      <Box sx={{ px: 1.5, pt: 1.5, pb: 1.25 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 0.75 }}>
          <Stack direction="row" alignItems="center" spacing={0.75}>
            <SensorsRounded sx={{ fontSize: 18, color: online ? M.green : M.inkMute }} />
            <SectionTitre>Station du domaine</SectionTitre>
          </Stack>
          <Pastille online={online} />
        </Stack>

        <Typography
          sx={{ fontFamily: "'Ubuntu', sans-serif", fontSize: 13.5, fontWeight: 700, color: M.ink }}
        >
          {station.label || station.stationId}
        </Typography>

        {/* Hors ligne, la date absolue compte : « il y a 3 j » ne dit pas quel
            jour le kit s'est tu. En ligne, elle ne fait que répéter. */}
        <Stack direction="row" alignItems="center" flexWrap="wrap" sx={{ rowGap: 0.25 }}>
          <Typography sx={{ fontSize: 11.5, color: M.inkMute }}>
            {online
              ? `Mise à jour ${fmtAgo(station.lastSeen)}`
              : `Dernière donnée ${fmtAgo(station.lastSeen)} · ${fmtDateTime(station.lastSeen)}`}
          </Typography>
          {typeof station.batteryLevel === 'number' && (
            <Sante icon={BatteryFullRounded} texte={`${station.batteryLevel}%`} />
          )}
          {typeof station.signalStrength === 'number' && (
            <Sante icon={SignalCellularAltRounded} texte={String(station.signalStrength)} />
          )}
        </Stack>
      </Box>

      {/* La lecture */}
      <Box sx={{ px: 1.5, pb: 1.5, opacity: dim ? 0.62 : 1 }}>
        <Stack direction="row" alignItems="baseline" spacing={0.5}>
          <Typography
            sx={{
              fontFamily: "'Ubuntu', sans-serif",
              fontSize: 46,
              fontWeight: 700,
              lineHeight: 1,
              letterSpacing: '-0.02em',
              color: M.ink,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {temp ? temp.value.toFixed(1) : '—'}
          </Typography>
          <Typography
            sx={{
              fontFamily: "'Ubuntu', sans-serif",
              fontSize: 19,
              fontWeight: 400,
              color: M.inkMute,
            }}
          >
            {temp?.unit ?? '°C'}
          </Typography>
        </Stack>

        {aPluviometre && (
          <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mt: 0.5 }}>
            <GrainRounded sx={{ fontSize: 14, color: pluieEnCours ? M.sky : M.inkMute }} />
            <Typography
              sx={{
                fontSize: 12.5,
                fontWeight: pluieEnCours ? 700 : 500,
                color: pluieEnCours ? M.sky : M.inkMute,
              }}
            >
              {pluieEnCours
                ? `Il pleut · ${fmtMesure(live.rainRate, 1)}`
                : 'Pas de pluie en ce moment'}
            </Typography>
          </Stack>
        )}
      </Box>

      {/* Le cadran */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: `repeat(${colonnes}, 1fr)`,
          borderTop: `1px solid ${M.hair}`,
          background: M.paper,
          opacity: dim ? 0.62 : 1,
        }}
      >
        {mesures.map((m, i) => {
          const Icon = m.icon;
          return (
            <Box
              key={m.label}
              sx={{
                px: 1.25,
                py: 1,
                minWidth: 0,
                borderLeft: i % colonnes === 0 ? 'none' : `1px solid ${M.hair}`,
                borderTop: i < colonnes ? 'none' : `1px solid ${M.hair}`,
              }}
            >
              <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mb: 0.3 }}>
                <Icon sx={{ fontSize: 14, color: M.green }} />
                <Typography sx={{ fontSize: 10.5, fontWeight: 700, color: M.inkMute }}>
                  {m.label}
                </Typography>
              </Stack>
              <Typography
                sx={{
                  fontFamily: "'Ubuntu', sans-serif",
                  fontSize: 17,
                  fontWeight: 700,
                  color: M.ink,
                  lineHeight: 1.15,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {m.value}
              </Typography>
              {typeof m.sub === 'string' ? (
                <Typography sx={{ fontSize: 10.5, color: M.inkMute }}>{m.sub}</Typography>
              ) : (
                m.sub
              )}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};
