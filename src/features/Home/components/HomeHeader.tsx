import type { FunctionComponent } from 'react';

import CellTowerRounded from '@mui/icons-material/CellTowerRounded';
import ChevronRightRounded from '@mui/icons-material/ChevronRightRounded';
import PublicRounded from '@mui/icons-material/PublicRounded';
import { Box, Stack, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import dayjs from 'dayjs';

import { formatRelative } from '../formatRelative';
import type { HomeRecap, HomeWeather } from '../useHomeFeed';
import { HealthGauge } from './HealthGauge';

interface HomeHeaderProps {
  firstName: string;
  weather: HomeWeather | null;
  recap: HomeRecap | null;
  /** Comptes d'alertes tels que la section les affiche. */
  alerts: { fresh: number; stale: number };
  onWeatherClick: (farmId: string) => void;
  onRecapClick: () => void;
}

/**
 * En-tête compact : la météo n'est plus le sujet de l'accueil, elle tient en une
 * puce d'une ligne qui renvoie vers l'écran domaine.
 */
const Header = styled(Box)({
  position: 'relative',
  overflow: 'hidden',
  padding: 'calc(env(safe-area-inset-top, 0px) + 20px) 24px 20px',
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
  maxWidth: '100%',
  whiteSpace: 'nowrap',
  '&:active': { background: 'rgba(255,255,255,0.22)' },
  '&:focus-visible': { outline: '2px solid #93F4E0', outlineOffset: 2 },
  '& svg': { fontSize: 16, flexShrink: 0 },
});

const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

/**
 * Fraîcheur compacte : « 4 min » plutôt que « il y a 4 min ». Collée à « en
 * direct », la durée se lit comme l'âge de la mesure sans le dire deux fois.
 */
const age = (iso: string): string => formatRelative(iso).replace(/^il y a /, '');

/** Le récap tient dans l'en-tête : l'exploitation en chiffres, puis son état. */
const RecapRow = styled('button')({
  all: 'unset',
  boxSizing: 'border-box',
  display: 'block',
  width: '100%',
  cursor: 'pointer',
  marginTop: 18,
  paddingTop: 14,
  borderTop: '1px solid rgba(147,244,224,0.18)',
  '&:focus-visible': { outline: '2px solid #93F4E0', outlineOffset: 3, borderRadius: 8 },
});

export const HomeHeader: FunctionComponent<HomeHeaderProps> = ({
  firstName,
  weather,
  recap,
  alerts,
  onWeatherClick,
  onRecapClick,
}) => (
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
        {/* Le nom du domaine est le seul fragment qui cède : la mesure et l'état
            du kit restent lisibles quel que soit l'écran. */}
        <Box component="span" sx={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {weather.farmName}
        </Box>
        <Box component="span" sx={{ flexShrink: 0, opacity: 0.9 }}>
          {weather.tempC !== null && `· ${Math.round(weather.tempC)}° `}
          {weather.hasKit ? `· ${weather.online ? 'en direct' : 'hors ligne'}` : '· météo régionale estimée'}
          {weather.observedAt && ` · ${age(weather.observedAt)}`}
        </Box>
        <ChevronRightRounded sx={{ flexShrink: 0 }} />
      </WeatherChip>
    )}

    {recap && (
      <RecapRow type="button" onClick={onRecapClick}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Typography
            sx={{
              flex: 1,
              fontFamily: "'Ubuntu', sans-serif",
              fontSize: 14,
              fontWeight: 700,
              color: '#EAF7F1',
            }}
          >
            {recap.domains} domaines · {recap.parcels} parcelles ·{' '}
            {recap.areaHa.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} ha
          </Typography>
          <ChevronRightRounded sx={{ color: 'rgba(234,247,241,0.5)', flexShrink: 0 }} />
        </Stack>

        <HealthGauge health={recap.health} fresh={alerts.fresh} stale={alerts.stale} />
      </RecapRow>
    )}
  </Header>
);
