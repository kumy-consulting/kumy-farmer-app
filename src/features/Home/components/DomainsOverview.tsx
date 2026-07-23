import type { FunctionComponent, ReactNode } from 'react';

import CellTowerRounded from '@mui/icons-material/CellTowerRounded';
import GridViewRounded from '@mui/icons-material/GridViewRounded';
import SpaRounded from '@mui/icons-material/SpaRounded';
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

/** Tuile stat uniforme : chip + chiffre + label (2 lignes, hauteur fixe). */
const StatTile: FunctionComponent<{
  icon: ReactNode;
  value: ReactNode;
  label: string;
  valueColor?: string;
  valueSize?: number;
  chipBg?: string;
  chipColor?: string;
}> = ({ icon, value, label, valueColor = '#1A2B27', valueSize = 21, chipBg, chipColor }) => (
  <Box sx={{ ...cardSx, p: '13px 14px', height: 74, display: 'flex', alignItems: 'center', gap: 1.25 }}>
    <Chip bg={chipBg} color={chipColor}>
      {icon}
    </Chip>
    <Box sx={{ minWidth: 0 }}>
      <Typography
        sx={{ fontFamily: "'Ubuntu', sans-serif", fontSize: valueSize, fontWeight: 700, color: valueColor, lineHeight: 1.15 }}
        noWrap
      >
        {value}
      </Typography>
      <Typography sx={{ fontSize: 12.5, fontWeight: 600, color: 'rgba(55,75,70,0.7)' }} noWrap>
        {label}
      </Typography>
    </Box>
  </Box>
);

/** Anneau de progression SVG (%). */
const ProgressRing: FunctionComponent<{ value: number; size?: number; stroke?: number }> = ({
  value,
  size = 62,
  stroke = 7,
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
        <Typography sx={{ fontFamily: "'Ubuntu', sans-serif", fontSize: 15, fontWeight: 700, color: '#016557' }}>
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

      {/* Exploitation — carte focale pleine largeur */}
      <Box sx={{ ...cardSx, p: '16px', display: 'flex', alignItems: 'center', gap: 2, mb: 1.25 }}>
        <ProgressRing value={exploitation} />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontSize: 12.5, fontWeight: 600, color: 'rgba(55,75,70,0.62)' }}>
            Surface exploitée
          </Typography>
          <Typography sx={{ fontFamily: "'Ubuntu', sans-serif", fontSize: 20, fontWeight: 700, color: '#1A2B27' }} noWrap>
            {fr(overview.cultivatedAreaHa)}
            <Typography component="span" sx={{ fontSize: 14, fontWeight: 600, color: 'rgba(55,75,70,0.55)' }}>
              {' '}
              / {fr(overview.totalAreaHa)} ha
            </Typography>
          </Typography>
        </Box>
        <Box
          sx={{
            flexShrink: 0,
            px: 1.25,
            py: 0.75,
            borderRadius: '12px',
            background: 'rgba(1,134,117,0.08)',
            textAlign: 'center',
          }}
        >
          <Typography sx={{ fontFamily: "'Ubuntu', sans-serif", fontSize: 15, fontWeight: 700, color: '#016557' }}>
            +{fr(availableHa)}
          </Typography>
          <Typography sx={{ fontSize: 10.5, fontWeight: 600, color: 'rgba(1,101,87,0.7)' }}>ha libres</Typography>
        </Box>
      </Box>

      {/* Grille 2×2 uniforme */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1.25 }}>
        <StatTile icon={<GridViewRounded />} value={overview.domains} label="Domaines" />
        <StatTile icon={<SpaRounded />} value={overview.parcels} label="Parcelles" />
        <StatTile icon={<YardRounded />} value={overview.cropsCount} label="Cultures" />
        <StatTile
          icon={<Box sx={{ width: 12, height: 12, borderRadius: '50%', background: health.color }} />}
          chipBg={health.bg}
          chipColor={health.color}
          value={health.label}
          valueColor={health.color}
          valueSize={15.5}
          label="Santé globale"
        />
      </Box>

      {/* Couverture capteurs — pleine largeur */}
      <Box sx={{ ...cardSx, p: '13px 14px', display: 'flex', alignItems: 'center', gap: 1.25, mt: 1.25 }}>
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
  );
};
