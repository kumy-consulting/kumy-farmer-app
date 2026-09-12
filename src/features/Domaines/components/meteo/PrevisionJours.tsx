import type { FunctionComponent } from 'react';

import type { SvgIconComponent } from '@mui/icons-material';
import AirRounded from '@mui/icons-material/AirRounded';
import FilterDramaRounded from '@mui/icons-material/FilterDramaRounded';
import GrainRounded from '@mui/icons-material/GrainRounded';
import OpacityRounded from '@mui/icons-material/OpacityRounded';
import ThunderstormRounded from '@mui/icons-material/ThunderstormRounded';
import WbSunnyRounded from '@mui/icons-material/WbSunnyRounded';
import { Box, Stack, Typography } from '@mui/material';

import { M, deriveSky, fmtDayShort, fmtNum, fmtTemp, isToday, type SkyKind } from './meteoFormat';
import { SectionTitre } from './SectionTitre';
import type { ForecastDay } from '../../domaines.types';


const CIEL: Record<SkyKind, { icon: SvgIconComponent; color: string }> = {
  sun: { icon: WbSunnyRounded, color: '#E8A317' },
  partly: { icon: FilterDramaRounded, color: '#7C93A5' },
  rain: { icon: GrainRounded, color: M.sky },
  storm: { icon: ThunderstormRounded, color: '#5E5BB8' },
};

const CarteJour: FunctionComponent<{ day: ForecastDay }> = ({ day }) => {
  const ciel = CIEL[deriveSky(day.rain)];
  const CielIcon = ciel.icon;
  const aujourdhui = isToday(day.date);
  const pluiePct = Math.round(day.rain.probGt1mm * 100);

  return (
    <Box
      sx={{
        minWidth: 124,
        borderRadius: '16px',
        border: `1.5px solid ${aujourdhui ? M.green : M.hair}`,
        background: aujourdhui ? 'linear-gradient(165deg, #EAF5EF 0%, #F3F7F4 100%)' : M.paperTile,
        px: 1.5,
        py: 1.25,
      }}
    >
      <Typography
        sx={{
          fontFamily: "'Ubuntu', sans-serif",
          fontSize: 13,
          fontWeight: 700,
          color: aujourdhui ? M.green : M.ink,
          textTransform: 'capitalize',
          mb: 0.75,
        }}
      >
        {aujourdhui ? "Aujourd'hui" : fmtDayShort(day.date)}
      </Typography>

      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 0.5 }}>
        <Stack direction="row" alignItems="baseline" spacing={0.5}>
          <Typography
            sx={{ fontFamily: "'Ubuntu', sans-serif", fontSize: 24, fontWeight: 700, color: M.ink }}
          >
            {fmtTemp(day.tmax.value)}
          </Typography>
          <Typography sx={{ fontSize: 14, fontWeight: 500, color: M.inkMute }}>
            {fmtTemp(day.tmin.value)}
          </Typography>
        </Stack>
        <CielIcon sx={{ fontSize: 28, color: ciel.color }} />
      </Stack>

      {/* Jauge de probabilité de pluie (> 1 mm) */}
      <Stack direction="row" alignItems="center" spacing={0.75} sx={{ mb: 0.5 }}>
        <Box sx={{ flex: 1, height: 5, borderRadius: 999, background: M.hair, overflow: 'hidden' }}>
          <Box
            sx={{ width: `${pluiePct}%`, height: '100%', borderRadius: 999, background: M.sky }}
          />
        </Box>
        <Typography
          sx={{ fontSize: 12, fontWeight: 700, color: M.sky, minWidth: 32, textAlign: 'right' }}
        >
          {pluiePct}%
        </Typography>
      </Stack>

      <Stack direction="row" alignItems="center" spacing={1.25}>
        <Stack direction="row" alignItems="center" spacing={0.25}>
          <OpacityRounded sx={{ fontSize: 12, color: M.inkMute }} />
          <Typography sx={{ fontSize: 11, color: M.inkMute }}>
            {fmtNum(day.humidity.value, '%')}
          </Typography>
        </Stack>
        <Stack direction="row" alignItems="center" spacing={0.25}>
          <AirRounded sx={{ fontSize: 12, color: M.inkMute }} />
          <Typography sx={{ fontSize: 11, color: M.inkMute }}>
            {fmtNum(day.windMax.value, 'm/s', 1)}
          </Typography>
        </Stack>
      </Stack>
    </Box>
  );
};

/**
 * Prévision à cinq jours du domaine, en cartes défilantes.
 *
 * Le serveur ne nomme pas le temps qu'il fera : l'icône de ciel est déduite des
 * probabilités de pluie (voir `deriveSky`), et la jauge affiche celle de
 * dépasser 1 mm — le seuil qui parle à qui doit sortir au champ.
 */
export const PrevisionJours: FunctionComponent<{ days: ForecastDay[] }> = ({ days }) => (
  <Box sx={{ mb: 2 }}>
    <SectionTitre>Prévision 5 jours</SectionTitre>
    <Stack direction="row" spacing={1} sx={{ overflowX: 'auto', pb: 1, mx: -0.5, px: 0.5 }}>
      {days.map((day) => (
        <CarteJour key={day.date} day={day} />
      ))}
    </Stack>
  </Box>
);
