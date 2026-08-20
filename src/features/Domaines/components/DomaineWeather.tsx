import type { FunctionComponent, ReactElement } from 'react';

import AirRounded from '@mui/icons-material/AirRounded';
import CellTowerRounded from '@mui/icons-material/CellTowerRounded';
import SensorsOffRounded from '@mui/icons-material/SensorsOffRounded';
import ThermostatRounded from '@mui/icons-material/ThermostatRounded';
import UmbrellaRounded from '@mui/icons-material/UmbrellaRounded';
import WaterDropRounded from '@mui/icons-material/WaterDropRounded';
import { Box, Stack, Typography } from '@mui/material';

import type { FarmLiveStation } from '../domaines.types';

interface DomaineWeatherProps {
  liveStation: FarmLiveStation | null;
}

const Measure: FunctionComponent<{ icon: ReactElement; value: string; label: string }> = ({ icon, value, label }) => (
  <Box sx={{ flex: 1, minWidth: 0, textAlign: 'center' }}>
    <Box sx={{ display: 'flex', justifyContent: 'center', color: '#018675', '& svg': { fontSize: 22 } }}>{icon}</Box>
    <Typography sx={{ fontFamily: "'Ubuntu', sans-serif", fontSize: 17, fontWeight: 700, color: '#1A1C1B', mt: 0.5 }}>
      {value}
    </Typography>
    <Typography sx={{ fontSize: 11, fontWeight: 500, color: '#5C5F5E' }}>{label}</Typography>
  </Box>
);

const num = (v: number | undefined, suffix: string): string => (v == null ? '—' : `${Math.round(v)}${suffix}`);

export const DomaineWeather: FunctionComponent<DomaineWeatherProps> = ({ liveStation }) => {
  const station = liveStation?.station;

  if (!station) {
    return (
      <Box sx={{ px: 2, py: 3 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.25,
            p: '16px',
            borderRadius: '16px',
            background: 'rgba(1,134,117,0.05)',
            border: '1px dashed rgba(1,134,117,0.22)',
            '& svg': { fontSize: 24, color: '#8F9291' },
          }}
        >
          <SensorsOffRounded />
          <Typography
            sx={{ fontFamily: "'Ubuntu', sans-serif", fontSize: 13.5, fontWeight: 500, color: 'rgba(55,75,70,0.72)' }}
          >
            Aucune station météo installée sur ce domaine. La météo par capteur apparaîtra ici une fois le kit posé.
          </Typography>
        </Box>
      </Box>
    );
  }

  const live = station.live;
  // La pluie affichée est le cumul 24 h calculé par l'API : `live.rainfall` est
  // le compteur cumulatif brut de la station depuis sa pose, illisible ici.
  const rain24h = live.rainfall24h?.valueMm;

  return (
    <Box sx={{ px: 2, py: 2.5 }}>
      <Box
        sx={{
          borderRadius: '18px',
          background: '#FFFFFF',
          border: '1px solid #E2E3E1',
          boxShadow: '0 6px 18px rgba(18,49,41,0.06)',
          overflow: 'hidden',
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          spacing={1}
          sx={{ px: 2, py: 1.5, borderBottom: '1px solid #E2E3E1' }}
        >
          <CellTowerRounded sx={{ fontSize: 20, color: station.online ? '#018675' : '#8F9291' }} />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              sx={{ fontFamily: "'Ubuntu', sans-serif", fontSize: 14, fontWeight: 700, color: '#1A1C1B' }}
              noWrap
            >
              {station.label || station.stationId || 'Station météo'}
            </Typography>
            <Typography sx={{ fontSize: 11.5, fontWeight: 500, color: station.online ? '#018675' : '#8F9291' }}>
              {station.online ? 'En ligne · mesures en direct' : 'Hors ligne'}
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" sx={{ px: 1.5, py: 2 }}>
          <Measure icon={<ThermostatRounded />} value={num(live.temperature?.value, '°')} label="Température" />
          <Measure icon={<WaterDropRounded />} value={num(live.humidity?.value, '%')} label="Humidité" />
          <Measure icon={<AirRounded />} value={num(live.windSpeed?.value, ' km/h')} label="Vent" />
          <Measure icon={<UmbrellaRounded />} value={num(rain24h, ' mm')} label="Pluie 24 h" />
        </Stack>
      </Box>
    </Box>
  );
};
