import type { FunctionComponent, ReactNode } from 'react';

import CellTowerRounded from '@mui/icons-material/CellTowerRounded';
import GridViewRounded from '@mui/icons-material/GridViewRounded';
import YardRounded from '@mui/icons-material/YardRounded';
import { Box, Stack, Typography } from '@mui/material';

import type { DomainsOverview as Overview } from '../dashboard.types';
import { HEALTH } from './dashboardVisuals';
import { SectionHeader } from './SectionHeader';

interface DomainsOverviewProps {
  overview: Overview;
}

const fr = (n: number) => n.toLocaleString('fr-FR');

const tileSx = {
  background: '#FFFFFF',
  borderRadius: '20px',
  border: '1px solid rgba(55,75,70,0.07)',
  boxShadow: '0 6px 18px rgba(1,134,117,0.06)',
  p: '14px 16px',
  minHeight: 100,
  display: 'flex',
  flexDirection: 'column',
  gap: 0.5,
} as const;

const IconChip: FunctionComponent<{ children: ReactNode }> = ({ children }) => (
  <Box
    sx={{
      width: 32,
      height: 32,
      borderRadius: '11px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'rgba(1,134,117,0.10)',
      mb: 0.5,
      '& svg': { fontSize: 18, color: '#016557' },
    }}
  >
    {children}
  </Box>
);

const Tile: FunctionComponent<{ icon: ReactNode; value: ReactNode; label: string; sub?: string }> = ({
  icon,
  value,
  label,
  sub,
}) => (
  <Box sx={tileSx}>
    <IconChip>{icon}</IconChip>
    <Typography
      sx={{ fontFamily: "'Ubuntu', sans-serif", fontSize: 22, fontWeight: 700, color: '#1A2B27', lineHeight: 1.1 }}
    >
      {value}
    </Typography>
    <Box>
      <Typography sx={{ fontSize: 12, fontWeight: 600, color: 'rgba(55,75,70,0.7)' }}>{label}</Typography>
      {sub && <Typography sx={{ fontSize: 11.5, fontWeight: 500, color: 'rgba(55,75,70,0.5)' }}>{sub}</Typography>}
    </Box>
  </Box>
);

/** Anneau de progression SVG (%). */
const ProgressRing: FunctionComponent<{ value: number; size?: number; stroke?: number }> = ({
  value,
  size = 60,
  stroke = 6,
}) => {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.min(Math.max(value, 0), 100) / 100);
  return (
    <Box sx={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(1,134,117,0.12)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#018675"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography sx={{ fontFamily: "'Ubuntu', sans-serif", fontSize: 15, fontWeight: 700, color: '#016557' }}>
          {value}%
        </Typography>
      </Box>
    </Box>
  );
};

export const DomainsOverview: FunctionComponent<DomainsOverviewProps> = ({ overview }) => {
  const health = HEALTH[overview.health];
  const exploitation = overview.totalAreaHa > 0 ? Math.round((overview.cultivatedAreaHa / overview.totalAreaHa) * 100) : 0;
  const regionalDomains = Math.max(overview.domains - overview.equippedDomains, 0);
  const coverage = overview.domains > 0 ? (overview.equippedDomains / overview.domains) * 100 : 0;

  return (
    <Box>
      <SectionHeader title="Vos domaines" />
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1.25 }}>
        {/* Patrimoine condensé */}
        <Tile icon={<GridViewRounded />} value={overview.domains} label="Domaines" sub={`${overview.parcels} parcelles`} />

        {/* Taux d'exploitation — tuile focale */}
        <Box sx={{ ...tileSx, alignItems: 'center', justifyContent: 'center', gap: 1 }}>
          <ProgressRing value={exploitation} />
          <Box sx={{ textAlign: 'center' }}>
            <Typography sx={{ fontFamily: "'Ubuntu', sans-serif", fontSize: 13.5, fontWeight: 700, color: '#1A2B27' }}>
              {fr(overview.cultivatedAreaHa)} / {fr(overview.totalAreaHa)} ha
            </Typography>
            <Typography sx={{ fontSize: 11.5, fontWeight: 500, color: 'rgba(55,75,70,0.55)' }}>Exploité</Typography>
          </Box>
        </Box>

        {/* Cultures en cours */}
        <Tile
          icon={<YardRounded />}
          value={overview.cropsCount}
          label="Cultures"
          sub={`${overview.activeParcels} parcelles actives`}
        />

        {/* Santé + alertes */}
        <Box sx={{ ...tileSx, gap: 0.75, justifyContent: 'space-between' }}>
          <Typography sx={{ fontSize: 12, fontWeight: 600, color: 'rgba(55,75,70,0.7)' }}>Santé globale</Typography>
          <Box>
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
            <Typography sx={{ fontSize: 11.5, fontWeight: 500, color: 'rgba(55,75,70,0.5)', mt: 0.5 }}>
              {overview.alertsCount} alerte{overview.alertsCount > 1 ? 's' : ''} en cours
            </Typography>
          </Box>
        </Box>

        {/* Couverture capteurs — pleine largeur */}
        <Box sx={{ gridColumn: '1 / -1', ...tileSx, minHeight: 0, flexDirection: 'row', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: '13px',
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(1,134,117,0.10)',
              '& svg': { fontSize: 21, color: '#016557' },
            }}
          >
            <CellTowerRounded />
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ fontFamily: "'Ubuntu', sans-serif", fontSize: 14, fontWeight: 700, color: '#1A2B27' }}>
              {overview.equippedDomains}/{overview.domains} domaines équipés d’un kit
            </Typography>
            <Typography sx={{ fontSize: 12, fontWeight: 500, color: 'rgba(55,75,70,0.55)', mt: 0.25 }}>
              {regionalDomains > 0 ? `${regionalDomains} en météo régionale (estimée)` : 'Tous vos domaines sont mesurés'}
            </Typography>
            <Box sx={{ mt: 1, height: 6, borderRadius: 999, background: 'rgba(1,134,117,0.10)', overflow: 'hidden' }}>
              <Box sx={{ width: `${coverage}%`, height: '100%', borderRadius: 999, background: 'linear-gradient(90deg, #018675, #35A18F)' }} />
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};
