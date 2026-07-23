import type { FunctionComponent } from 'react';

import PublicRounded from '@mui/icons-material/PublicRounded';
import { Box, Stack, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';

import type { ForecastDay } from '../dashboard.types';
import { weatherIcon } from './dashboardVisuals';

interface ForecastStripProps {
  forecast: ForecastDay[];
}

const Card = styled(Box)({
  background: '#FFFFFF',
  borderRadius: 20,
  border: '1px solid rgba(55,75,70,0.07)',
  boxShadow: '0 10px 28px rgba(1,134,117,0.10)',
  padding: '12px 8px 14px',
});

const Row = styled(Box)({
  display: 'flex',
  overflowX: 'auto',
  scrollbarWidth: 'none',
  '&::-webkit-scrollbar': { display: 'none' },
});

const Cell = styled(Stack, { shouldForwardProp: (p) => p !== 'today' })<{ today: boolean }>(({ today }) => ({
  flex: '1 0 20%',
  minWidth: 62,
  alignItems: 'center',
  gap: 5,
  padding: '6px 4px',
  borderRadius: 14,
  background: today ? 'rgba(1,134,117,0.08)' : 'transparent',
}));

export const ForecastStrip: FunctionComponent<ForecastStripProps> = ({ forecast }) => (
  <Card>
    <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 1, mb: 1 }}>
      <Typography sx={{ fontFamily: "'Ubuntu', sans-serif", fontSize: 12.5, fontWeight: 700, color: '#243F38' }}>
        Prévisions 5 jours
      </Typography>
      <Stack direction="row" alignItems="center" spacing={0.5} sx={{ color: 'rgba(55,75,70,0.5)' }}>
        <PublicRounded sx={{ fontSize: 14 }} />
        <Typography sx={{ fontSize: 11, fontWeight: 600 }}>Régional</Typography>
      </Stack>
    </Stack>

    <Row>
      {forecast.map((day, index) => (
        <Cell key={day.label} today={index === 0}>
          <Typography
            sx={{
              fontFamily: "'Ubuntu', sans-serif",
              fontSize: 12,
              fontWeight: index === 0 ? 700 : 600,
              color: index === 0 ? '#016557' : 'rgba(55,75,70,0.7)',
            }}
          >
            {day.label}
          </Typography>
          <Box sx={{ display: 'flex', '& svg': { fontSize: 22, color: '#0A6656' } }}>{weatherIcon(day.condition)}</Box>
          <Typography
            sx={{ fontFamily: "'Ubuntu', sans-serif", fontSize: 14, fontWeight: 700, color: 'rgba(20,40,35,0.9)' }}
          >
            {day.tempC}°
          </Typography>
          <Typography sx={{ fontSize: 10.5, fontWeight: 600, color: 'rgba(1,134,117,0.75)' }}>
            {day.rainProbability}%
          </Typography>
        </Cell>
      ))}
    </Row>
  </Card>
);
