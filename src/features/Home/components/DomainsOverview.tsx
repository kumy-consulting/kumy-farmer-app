import type { FunctionComponent, ReactNode } from 'react';

import GridViewRounded from '@mui/icons-material/GridViewRounded';
import SquareFootRounded from '@mui/icons-material/SquareFootRounded';
import { Box, Stack, Typography } from '@mui/material';

import { KumySprout } from '@/shared/components/KumySprout';

import type { DomainsOverview as Overview } from '../dashboard.types';
import { HEALTH } from './dashboardVisuals';
import { SectionHeader } from './SectionHeader';

interface DomainsOverviewProps {
  overview: Overview;
}

const tileSx = {
  background: '#FFFFFF',
  borderRadius: '20px',
  border: '1px solid rgba(55,75,70,0.07)',
  boxShadow: '0 6px 18px rgba(1,134,117,0.06)',
  p: '14px 16px',
  minHeight: 96,
  display: 'flex',
  flexDirection: 'column',
  gap: 0.5,
} as const;

const IconChip: FunctionComponent<{ children: ReactNode; tint?: string; color?: string }> = ({
  children,
  tint = 'rgba(1,134,117,0.10)',
  color = '#016557',
}) => (
  <Box
    sx={{
      width: 32,
      height: 32,
      borderRadius: '11px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: tint,
      mb: 0.5,
      '& svg': { fontSize: 18, color },
    }}
  >
    {children}
  </Box>
);

const Tile: FunctionComponent<{ icon: ReactNode; value: ReactNode; label: string }> = ({ icon, value, label }) => (
  <Box sx={tileSx}>
    <IconChip>{icon}</IconChip>
    <Typography
      sx={{ fontFamily: "'Ubuntu', sans-serif", fontSize: 22, fontWeight: 700, color: '#1A2B27', lineHeight: 1.1 }}
    >
      {value}
    </Typography>
    <Typography sx={{ fontSize: 12, fontWeight: 500, color: 'rgba(55,75,70,0.6)' }}>{label}</Typography>
  </Box>
);

export const DomainsOverview: FunctionComponent<DomainsOverviewProps> = ({ overview }) => {
  const health = HEALTH[overview.health];

  return (
    <Box>
      <SectionHeader title="Vos domaines" />
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1.25 }}>
        <Tile icon={<GridViewRounded />} value={overview.domains} label="Domaines" />
        <Tile icon={<KumySprout size={18} color="#016557" />} value={overview.parcels} label="Parcelles" />
        <Tile
          icon={<SquareFootRounded />}
          value={
            <>
              {overview.areaHa.toLocaleString('fr-FR')}
              <Typography component="span" sx={{ fontSize: 13, fontWeight: 600, ml: 0.5 }}>
                ha
              </Typography>
            </>
          }
          label="Surface"
        />
        <Box sx={{ ...tileSx, gap: 0.75, justifyContent: 'space-between' }}>
          <Typography sx={{ fontSize: 12, fontWeight: 500, color: 'rgba(55,75,70,0.6)' }}>Santé globale</Typography>
          <Stack direction="row" alignItems="center" spacing={0.9}>
            <Box
              sx={{
                width: 11,
                height: 11,
                borderRadius: '50%',
                background: health.color,
                boxShadow: `0 0 0 4px ${health.bg}`,
              }}
            />
            <Typography sx={{ fontFamily: "'Ubuntu', sans-serif", fontSize: 18, fontWeight: 700, color: health.color }}>
              {health.label}
            </Typography>
          </Stack>
        </Box>
      </Box>
    </Box>
  );
};
