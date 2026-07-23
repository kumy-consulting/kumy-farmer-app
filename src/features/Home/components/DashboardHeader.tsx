import type { FunctionComponent } from 'react';

import AirRounded from '@mui/icons-material/AirRounded';
import CellTowerRounded from '@mui/icons-material/CellTowerRounded';
import KeyboardArrowDownRounded from '@mui/icons-material/KeyboardArrowDownRounded';
import LandscapeRounded from '@mui/icons-material/LandscapeRounded';
import PublicRounded from '@mui/icons-material/PublicRounded';
import UmbrellaRounded from '@mui/icons-material/UmbrellaRounded';
import WarningRounded from '@mui/icons-material/WarningAmberRounded';
import { Box, Stack, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import dayjs from 'dayjs';

import { KumySprout } from '@/shared/components/KumySprout';

import type { WeatherNow } from '../dashboard.types';
import { formatRelative } from '../formatRelative';
import { weatherIcon, weatherLabel } from './dashboardVisuals';

interface DashboardHeaderProps {
  firstName: string;
  weather: WeatherNow;
  onDomainClick?: () => void;
}

const Hero = styled(Box)({
  position: 'relative',
  overflow: 'hidden',
  padding: 'calc(env(safe-area-inset-top, 0px) + 22px) 24px 44px',
  background: 'linear-gradient(155deg, #0A6656 0%, #05463A 60%, #04382F 100%)',
  borderBottomLeftRadius: 30,
  borderBottomRightRadius: 30,
  color: '#EAF7F1',
  boxShadow: '0 14px 34px rgba(0,40,32,0.28)',
  '&::before': {
    content: '""',
    position: 'absolute',
    inset: 0,
    background:
      'radial-gradient(520px 260px at 108% -10%, rgba(147,244,224,0.22), transparent 60%), radial-gradient(360px 220px at -10% 120%, rgba(20,160,139,0.30), transparent 65%)',
    pointerEvents: 'none',
  },
});

const Watermark = styled(Box)({
  position: 'absolute',
  right: -18,
  bottom: -22,
  opacity: 0.12,
  transform: 'rotate(-8deg)',
  pointerEvents: 'none',
});

/** Chip translucide de sélection du domaine actif. */
const DomainChip = styled('button')({
  all: 'unset',
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '5px 10px 5px 8px',
  borderRadius: 999,
  background: 'rgba(255,255,255,0.14)',
  border: '1px solid rgba(147,244,224,0.28)',
  fontFamily: "'Ubuntu', sans-serif",
  fontSize: 12.5,
  fontWeight: 600,
  color: '#EAF7F1',
  transition: 'background 0.2s ease',
  '&:active': { background: 'rgba(255,255,255,0.22)' },
  '& svg': { fontSize: 16 },
});

const LiveDot = styled('span')({
  width: 7,
  height: 7,
  borderRadius: '50%',
  background: '#5EF0C8',
  boxShadow: '0 0 0 0 rgba(94,240,200,0.6)',
  animation: 'livePulse 1.8s ease-out infinite',
  '@keyframes livePulse': {
    '0%': { boxShadow: '0 0 0 0 rgba(94,240,200,0.55)' },
    '70%': { boxShadow: '0 0 0 7px rgba(94,240,200,0)' },
    '100%': { boxShadow: '0 0 0 0 rgba(94,240,200,0)' },
  },
  '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
});

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const Pill = styled(Box)({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  marginTop: 12,
  padding: '5px 11px',
  borderRadius: 999,
  border: '1px solid',
  fontFamily: "'Ubuntu', sans-serif",
  fontSize: 11.5,
  fontWeight: 600,
  letterSpacing: '0.01em',
});

/** Badge de source météo : kit en direct / prévision régionale / capteur HS. */
const SourceBadge: FunctionComponent<{ weather: WeatherNow }> = ({ weather }) => {
  if (weather.stationOffline) {
    return (
      <Pill sx={{ background: 'rgba(255,196,120,0.16)', borderColor: 'rgba(255,196,120,0.4)', color: '#FFD79E' }}>
        <WarningRounded sx={{ fontSize: 15 }} />
        Capteur hors ligne · prévision régionale
      </Pill>
    );
  }
  if (weather.source === 'station') {
    return (
      <Pill sx={{ background: 'rgba(94,240,200,0.14)', borderColor: 'rgba(94,240,200,0.35)', color: '#B6FFEE' }}>
        <LiveDot />
        <CellTowerRounded sx={{ fontSize: 15 }} />
        Station météo · en direct · {formatRelative(weather.observedAt)}
      </Pill>
    );
  }
  return (
    <Pill sx={{ background: 'rgba(255,255,255,0.1)', borderColor: 'rgba(255,255,255,0.2)', color: '#D7E7E1' }}>
      <PublicRounded sx={{ fontSize: 15 }} />
      Prévision régionale
    </Pill>
  );
};

export const DashboardHeader: FunctionComponent<DashboardHeaderProps> = ({ firstName, weather, onDomainClick }) => {
  const dateLabel = capitalize(dayjs().format('dddd D MMMM'));

  return (
    <Hero>
      <Watermark>
        <KumySprout size={150} color="#EAF7F1" />
      </Watermark>

      <Box sx={{ position: 'relative', zIndex: 1 }}>
        <Typography sx={{ fontFamily: "'Ubuntu', sans-serif", fontSize: 12.5, fontWeight: 500, opacity: 0.8 }}>
          {dateLabel}
        </Typography>
        <Typography sx={{ fontFamily: "'Ubuntu', sans-serif", fontSize: 25, fontWeight: 700, mt: 0.25, mb: 1.5 }}>
          Bonjour, {firstName} 👋
        </Typography>

        <DomainChip type="button" onClick={onDomainClick}>
          <LandscapeRounded />
          {weather.domainName}
          <KeyboardArrowDownRounded sx={{ opacity: 0.8 }} />
        </DomainChip>

        <Stack direction="row" alignItems="center" spacing={2} sx={{ mt: 2 }}>
          <Box
            sx={{
              width: 58,
              height: 58,
              borderRadius: '18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(255,255,255,0.12)',
              border: '1px solid rgba(147,244,224,0.28)',
              '& svg': { fontSize: 32, color: '#FFE082' },
            }}
          >
            {weatherIcon(weather.condition)}
          </Box>

          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Stack direction="row" alignItems="flex-start" spacing={0.5}>
              <Typography sx={{ fontFamily: "'Ubuntu', sans-serif", fontSize: 40, fontWeight: 700, lineHeight: 1 }}>
                {weather.tempC}
              </Typography>
              <Typography sx={{ fontFamily: "'Ubuntu', sans-serif", fontSize: 18, fontWeight: 600, mt: '2px' }}>
                °C
              </Typography>
            </Stack>
            <Typography sx={{ fontSize: 13, fontWeight: 600, opacity: 0.92, mt: 0.25 }}>
              {weatherLabel(weather.condition)} · {weather.location}
            </Typography>
          </Box>

          <Stack spacing={0.75} sx={{ pr: 0.5 }}>
            <Stack direction="row" alignItems="center" spacing={0.5}>
              <UmbrellaRounded sx={{ fontSize: 16, opacity: 0.85 }} />
              <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{weather.rainProbability}%</Typography>
            </Stack>
            <Stack direction="row" alignItems="center" spacing={0.5}>
              <AirRounded sx={{ fontSize: 16, opacity: 0.85 }} />
              <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{weather.windKmh} km/h</Typography>
            </Stack>
          </Stack>
        </Stack>

        <SourceBadge weather={weather} />
      </Box>
    </Hero>
  );
};
