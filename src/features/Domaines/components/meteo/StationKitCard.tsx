import type { FunctionComponent } from 'react';

import type { SvgIconComponent } from '@mui/icons-material';
import AirRounded from '@mui/icons-material/AirRounded';
import BatteryFullRounded from '@mui/icons-material/BatteryFullRounded';
import GrainRounded from '@mui/icons-material/GrainRounded';
import SensorsRounded from '@mui/icons-material/SensorsRounded';
import SignalCellularAltRounded from '@mui/icons-material/SignalCellularAltRounded';
import ThermostatRounded from '@mui/icons-material/ThermostatRounded';
import WaterDropRounded from '@mui/icons-material/WaterDropRounded';
import { Box, Stack, Typography } from '@mui/material';

import { M, fmtAgo, fmtDateTime, fmtNum } from './meteoFormat';
import { SectionTitre } from './SectionTitre';
import type { FarmStationLive, StationLiveMeasure } from '../../domaines.types';


interface StationKitCardProps {
  station: FarmStationLive;
}

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
    <Box sx={{ width: 7, height: 7, borderRadius: '50%', background: online ? M.green : M.red }} />
    <Typography sx={{ fontSize: 11, fontWeight: 700, color: online ? M.greenDeep : M.red }}>
      {online ? 'En direct' : 'Hors ligne'}
    </Typography>
  </Stack>
);

const Tuile: FunctionComponent<{
  icon: SvgIconComponent;
  label: string;
  value: string;
  sub?: string;
  dim?: boolean;
}> = ({ icon: Icon, label, value, sub, dim }) => (
  <Box
    sx={{
      // Quatre mesures, donc deux par ligne : à trois par ligne la dernière
      // tuile se retrouvait seule sur toute la largeur.
      flex: '1 1 calc(50% - 6px)',
      minWidth: 0,
      borderRadius: '12px',
      border: `1px solid ${M.hair}`,
      background: M.paper,
      px: 1.1,
      py: 0.9,
      opacity: dim ? 0.62 : 1,
    }}
  >
    <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mb: 0.3 }}>
      <Icon sx={{ fontSize: 15, color: M.green }} />
      <Typography sx={{ fontSize: 10.5, fontWeight: 700, color: M.inkMute }}>{label}</Typography>
    </Stack>
    <Typography
      sx={{
        fontFamily: "'Ubuntu', sans-serif",
        fontSize: 16,
        fontWeight: 700,
        color: M.ink,
        lineHeight: 1.15,
      }}
    >
      {value}
    </Typography>
    {sub && <Typography sx={{ fontSize: 10.5, color: M.inkMute }}>{sub}</Typography>}
  </Box>
);

const mesure = (m: StationLiveMeasure | undefined, digits: number): string =>
  m ? fmtNum(m.value, m.unit, digits) : '—';

/**
 * Carte du kit météo posé sur le domaine : identité, fraîcheur de la dernière
 * donnée et mesures du moment.
 *
 * La pression atmosphérique, présente dans l'app ingénieur, n'est pas reprise :
 * elle ne dit rien d'actionnable à l'agriculteur. `rainfall` (compteur cumulatif
 * brut de la station depuis sa pose) n'est jamais affiché non plus — la pluie
 * lisible, c'est `rainfall24h`, calculé par l'API, et l'intensité en cours vient
 * de `rainRate`.
 */
export const StationKitCard: FunctionComponent<StationKitCardProps> = ({ station }) => {
  const { live, online } = station;
  const dim = !online;
  const fraicheur = `${online ? 'Mise à jour' : 'Dernière donnée'} ${fmtAgo(station.lastSeen)} · ${fmtDateTime(station.lastSeen)}`;

  return (
    <Box
      sx={{
        borderRadius: '16px',
        border: `1px solid ${M.hair}`,
        background: M.paperTile,
        p: 1.5,
        mb: 2,
      }}
    >
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
      <Typography sx={{ fontSize: 11.5, color: M.inkMute, mb: 1 }}>{fraicheur}</Typography>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
        <Tuile
          icon={ThermostatRounded}
          label="Température"
          value={mesure(live.temperature, 1)}
          dim={dim}
        />
        <Tuile icon={WaterDropRounded} label="Humidité" value={mesure(live.humidity, 0)} dim={dim} />
        <Tuile
          icon={AirRounded}
          label="Vent"
          value={mesure(live.windSpeed, 0)}
          sub={live.windDir?.label ? `dir. ${live.windDir.label}` : undefined}
          dim={dim}
        />
        <Tuile
          icon={GrainRounded}
          label={live.rainfall24h ? 'Pluie · 24 h' : 'Pluie'}
          value={live.rainfall24h ? `${live.rainfall24h.valueMm.toFixed(1)} mm` : '—'}
          sub={live.rainRate ? `${mesure(live.rainRate, 1)} en cours` : undefined}
          dim={dim}
        />
      </Box>

      {(typeof station.batteryLevel === 'number' || typeof station.signalStrength === 'number') && (
        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mt: 1 }}>
          {typeof station.batteryLevel === 'number' && (
            <Stack direction="row" alignItems="center" spacing={0.4}>
              <BatteryFullRounded sx={{ fontSize: 15, color: M.inkMute }} />
              <Typography sx={{ fontSize: 11.5, color: M.inkSoft }}>
                {station.batteryLevel}%
              </Typography>
            </Stack>
          )}
          {typeof station.signalStrength === 'number' && (
            <Stack direction="row" alignItems="center" spacing={0.4}>
              <SignalCellularAltRounded sx={{ fontSize: 15, color: M.inkMute }} />
              <Typography sx={{ fontSize: 11.5, color: M.inkSoft }}>
                {station.signalStrength}
              </Typography>
            </Stack>
          )}
        </Stack>
      )}
    </Box>
  );
};
