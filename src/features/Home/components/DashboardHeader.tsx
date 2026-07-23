import type { FunctionComponent } from 'react';

import AirRounded from '@mui/icons-material/AirRounded';
import UmbrellaRounded from '@mui/icons-material/UmbrellaRounded';
import { Box, Stack, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import dayjs from 'dayjs';

import { KumySprout } from '@/shared/components/KumySprout';

import type { WeatherNow } from '../dashboard.types';
import { weatherIcon, weatherLabel } from './dashboardVisuals';

interface DashboardHeaderProps {
  firstName: string;
  weather: WeatherNow;
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
  // Halos doux.
  '&::before': {
    content: '""',
    position: 'absolute',
    inset: 0,
    background:
      'radial-gradient(520px 260px at 108% -10%, rgba(147,244,224,0.22), transparent 60%), radial-gradient(360px 220px at -10% 120%, rgba(20,160,139,0.30), transparent 65%)',
    pointerEvents: 'none',
  },
});

/** Filigrane pousse, décoratif. */
const Watermark = styled(Box)({
  position: 'absolute',
  right: -18,
  bottom: -22,
  opacity: 0.12,
  transform: 'rotate(-8deg)',
  pointerEvents: 'none',
});

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export const DashboardHeader: FunctionComponent<DashboardHeaderProps> = ({ firstName, weather }) => {
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
        <Typography sx={{ fontFamily: "'Ubuntu', sans-serif", fontSize: 25, fontWeight: 700, mt: 0.25, mb: 2.5 }}>
          Bonjour, {firstName} 👋
        </Typography>

        <Stack direction="row" alignItems="center" spacing={2}>
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
      </Box>
    </Hero>
  );
};
