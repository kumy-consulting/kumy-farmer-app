import type { FunctionComponent } from 'react';

import CellTowerRounded from '@mui/icons-material/CellTowerRounded';
import ChevronRightRounded from '@mui/icons-material/ChevronRightRounded';
import PublicRounded from '@mui/icons-material/PublicRounded';
import { Box, Stack, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import dayjs from 'dayjs';

import { formatRelative } from '../formatRelative';
import type { HomeWeather } from '../useHomeFeed';

interface HomeHeaderProps {
  firstName: string;
  weather: HomeWeather | null;
  onWeatherClick: (farmId: string) => void;
}

/**
 * En-tête compact : la météo n'est plus le sujet de l'accueil, elle tient en une
 * puce d'une ligne qui renvoie vers l'écran domaine.
 */
const Header = styled(Box)({
  position: 'relative',
  overflow: 'hidden',
  padding: 'calc(env(safe-area-inset-top, 0px) + 20px) 24px 22px',
  background: 'linear-gradient(155deg, #0A6656 0%, #05463A 70%, #04382F 100%)',
  borderBottomLeftRadius: 26,
  borderBottomRightRadius: 26,
  color: '#EAF7F1',
  boxShadow: '0 12px 28px rgba(0,40,32,0.24)',
});

const WeatherChip = styled('button')({
  all: 'unset',
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  marginTop: 12,
  padding: '6px 12px',
  borderRadius: 999,
  background: 'rgba(255,255,255,0.14)',
  border: '1px solid rgba(147,244,224,0.28)',
  fontFamily: "'Ubuntu', sans-serif",
  fontSize: 12.5,
  fontWeight: 600,
  color: '#EAF7F1',
  '&:active': { background: 'rgba(255,255,255,0.22)' },
  '& svg': { fontSize: 16 },
});

const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

export const HomeHeader: FunctionComponent<HomeHeaderProps> = ({ firstName, weather, onWeatherClick }) => (
  <Header>
    <Typography sx={{ fontSize: 12.5, fontWeight: 500, opacity: 0.8 }}>
      {capitalize(dayjs().format('dddd D MMMM'))}
    </Typography>
    <Typography sx={{ fontFamily: "'Ubuntu', sans-serif", fontSize: 24, fontWeight: 700, mt: 0.25 }}>
      Bonjour, {firstName} 👋
    </Typography>

    {weather && (
      <WeatherChip type="button" onClick={() => onWeatherClick(weather.farmId)}>
        {weather.hasKit ? <CellTowerRounded /> : <PublicRounded />}
        <Stack direction="row" spacing={0.5} alignItems="center">
          <span>{weather.farmName}</span>
          {weather.tempC !== null && <span>· {Math.round(weather.tempC)}°</span>}
          <span>
            ·{' '}
            {weather.hasKit
              ? `kit ${weather.online ? 'en direct' : 'hors ligne'}`
              : 'météo régionale estimée'}
          </span>
          {weather.observedAt && <span>· {formatRelative(weather.observedAt)}</span>}
        </Stack>
        <ChevronRightRounded />
      </WeatherChip>
    )}
  </Header>
);
