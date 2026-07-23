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

const cardSx = {
  background: '#FFFFFF',
  borderRadius: '18px',
  border: '1px solid rgba(55,75,70,0.07)',
  boxShadow: '0 6px 18px rgba(1,134,117,0.06)',
  p: '13px 14px',
  display: 'flex',
  alignItems: 'center',
  gap: 1.25,
} as const;

const Chip: FunctionComponent<{ children: ReactNode; bg?: string; color?: string }> = ({
  children,
  bg = 'rgba(1,134,117,0.10)',
  color = '#016557',
}) => (
  <Box
    sx={{
      flexShrink: 0,
      width: 40,
      height: 40,
      borderRadius: '13px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: bg,
      '& svg': { fontSize: 21, color },
    }}
  >
    {children}
  </Box>
);

const Body: FunctionComponent<{ value: ReactNode; label: string; sub?: string; valueColor?: string }> = ({
  value,
  label,
  sub,
  valueColor = '#1A2B27',
}) => (
  <Box sx={{ minWidth: 0 }}>
    <Typography
      sx={{ fontFamily: "'Ubuntu', sans-serif", fontSize: 20, fontWeight: 700, color: valueColor, lineHeight: 1.15 }}
    >
      {value}
    </Typography>
    <Typography sx={{ fontSize: 12.5, fontWeight: 600, color: 'rgba(55,75,70,0.72)', lineHeight: 1.25 }}>
      {label}
    </Typography>
    {sub && <Typography sx={{ fontSize: 11.5, fontWeight: 500, color: 'rgba(55,75,70,0.5)' }}>{sub}</Typography>}
  </Box>
);

/** Anneau de progression SVG (%). */
const ProgressRing: FunctionComponent<{ value: number; size?: number; stroke?: number }> = ({
  value,
  size = 54,
  stroke = 6,
}) => {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.min(Math.max(value, 0), 100) / 100);
  return (
    <Box sx={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
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
        <Typography sx={{ fontFamily: "'Ubuntu', sans-serif", fontSize: 13.5, fontWeight: 700, color: '#016557' }}>
          {value}%
        </Typography>
      </Box>
    </Box>
  );
};

export const DomainsOverview: FunctionComponent<DomainsOverviewProps> = ({ overview }) => {
  const health = HEALTH[overview.health];
  const exploitation =
    overview.totalAreaHa > 0 ? Math.round((overview.cultivatedAreaHa / overview.totalAreaHa) * 100) : 0;
  const availableHa = Math.max(overview.totalAreaHa - overview.cultivatedAreaHa, 0);
  const regionalDomains = Math.max(overview.domains - overview.equippedDomains, 0);
  const coverage = overview.domains > 0 ? (overview.equippedDomains / overview.domains) * 100 : 0;

  return (
    <Box>
      <SectionHeader title="Vos domaines" />
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1.25 }}>
        {/* Patrimoine condensé */}
        <Box sx={cardSx}>
          <Chip>
            <GridViewRounded />
          </Chip>
          <Body value={overview.domains} label="Domaines" sub={`${overview.parcels} parcelles`} />
        </Box>

        {/* Taux d'exploitation — tuile focale (anneau) */}
        <Box sx={cardSx}>
          <ProgressRing value={exploitation} />
          <Body
            value={
              <>
                {fr(overview.cultivatedAreaHa)}
                <Typography component="span" sx={{ fontSize: 13, fontWeight: 600, color: 'rgba(55,75,70,0.55)' }}>
                  {' '}
                  / {fr(overview.totalAreaHa)} ha
                </Typography>
              </>
            }
            label="Exploité"
            sub={`+${fr(availableHa)} ha disponibles`}
          />
        </Box>

        {/* Cultures en cours */}
        <Box sx={cardSx}>
          <Chip>
            <YardRounded />
          </Chip>
          <Body value={overview.cropsCount} label="Cultures" sub={`${overview.activeParcels} parcelles actives`} />
        </Box>

        {/* Santé + alertes */}
        <Box sx={cardSx}>
          <Chip bg={health.bg} color={health.color}>
            <Box sx={{ width: 12, height: 12, borderRadius: '50%', background: health.color }} />
          </Chip>
          <Body value={health.label} valueColor={health.color} label="Santé globale" sub={`${overview.alertsCount} alertes en cours`} />
        </Box>

        {/* Couverture capteurs — pleine largeur */}
        <Box sx={{ gridColumn: '1 / -1', ...cardSx }}>
          <Chip>
            <CellTowerRounded />
          </Chip>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Stack direction="row" alignItems="baseline" justifyContent="space-between" spacing={1}>
              <Typography sx={{ fontFamily: "'Ubuntu', sans-serif", fontSize: 14, fontWeight: 700, color: '#1A2B27' }}>
                {overview.equippedDomains}/{overview.domains} domaines équipés d’un kit
              </Typography>
              <Typography sx={{ fontFamily: "'Ubuntu', sans-serif", fontSize: 13, fontWeight: 700, color: '#016557' }}>
                {Math.round(coverage)}%
              </Typography>
            </Stack>
            <Typography sx={{ fontSize: 11.5, fontWeight: 500, color: 'rgba(55,75,70,0.55)', mt: 0.25 }}>
              {regionalDomains > 0 ? `${regionalDomains} en météo régionale (estimée)` : 'Tous vos domaines sont mesurés'}
            </Typography>
            <Box sx={{ mt: 0.75, height: 6, borderRadius: 999, background: 'rgba(1,134,117,0.10)', overflow: 'hidden' }}>
              <Box
                sx={{ width: `${coverage}%`, height: '100%', borderRadius: 999, background: 'linear-gradient(90deg, #018675, #35A18F)' }}
              />
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};
