import type { FunctionComponent, ReactElement, ReactNode } from 'react';

import EnergySavingsLeafOutlined from '@mui/icons-material/EnergySavingsLeafOutlined';
import GrassOutlined from '@mui/icons-material/GrassOutlined';
import VisibilityOutlined from '@mui/icons-material/VisibilityOutlined';
import WarningAmberRounded from '@mui/icons-material/WarningAmberRounded';
import { Box, Typography } from '@mui/material';

import type { DomaineStats } from '../useDomaineDetail';

type Tone = 'neutral' | 'alert' | 'success';

const ICON_BG: Record<Tone, string> = {
  neutral: 'rgba(1,134,117,0.10)',
  alert: 'rgba(186,26,26,0.10)',
  success: 'rgba(1,134,117,0.12)',
};
const ICON_COLOR: Record<Tone, string> = {
  neutral: '#006B5D',
  alert: '#BA1A1A',
  success: '#018675',
};
const VALUE_COLOR: Record<Tone, string> = {
  neutral: '#1A1C1B',
  alert: '#BA1A1A',
  success: '#018675',
};

interface StatDef {
  icon: ReactElement;
  tone: Tone;
  value: ReactNode;
  label: string;
}

const StatItem: FunctionComponent<StatDef & { withDivider: boolean }> = ({
  icon,
  tone,
  value,
  label,
  withDivider,
}) => (
  <Box
    sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '4px',
      flex: 1,
      position: 'relative',
      ...(withDivider && {
        '&::before': {
          content: '""',
          position: 'absolute',
          left: 0,
          top: '18%',
          bottom: '18%',
          width: '1px',
          background: 'rgba(55,75,70,0.14)',
        },
      }),
    }}
  >
    <Box
      sx={{
        width: 24,
        height: 24,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        mb: '1px',
        background: ICON_BG[tone],
        color: ICON_COLOR[tone],
        '& svg': { fontSize: 14 },
      }}
    >
      {icon}
    </Box>
    <Typography
      sx={{
        fontSize: '16px',
        fontWeight: 700,
        color: VALUE_COLOR[tone],
        lineHeight: 1.1,
        letterSpacing: '-0.01em',
        fontVariantNumeric: 'tabular-nums',
      }}
    >
      {value}
    </Typography>
    <Typography
      sx={{ fontSize: '10.5px', fontWeight: 500, color: '#5C5F5E', lineHeight: 1.2, letterSpacing: '0.02em', textAlign: 'center' }}
    >
      {label}
    </Typography>
  </Box>
);

/** Fraction « x/N » : x en gros, /N atténué. */
const Fraction: FunctionComponent<{ x: number; total: number }> = ({ x, total }) => (
  <>
    {x}
    <Box component="span" sx={{ fontSize: '11px', opacity: 0.55, ml: '2px' }}>
      /{total}
    </Box>
  </>
);

interface DomaineStatsRowProps {
  stats: DomaineStats;
}

export const DomaineStatsRow: FunctionComponent<DomaineStatsRowProps> = ({ stats }) => {
  const hasAlert = stats.vigilanceCount > 0;

  const vigilance: StatDef = {
    icon: <WarningAmberRounded />,
    tone: hasAlert ? 'alert' : 'neutral',
    value: stats.vigilanceCount,
    label: stats.criticalCount > 0 ? `${stats.criticalCount} critique${stats.criticalCount > 1 ? 's' : ''}` : hasAlert ? 'Vigilance' : 'Alertes',
  };

  const ndvi: StatDef = stats.hasCoverage
    ? {
        icon: <VisibilityOutlined />,
        tone: stats.toWatch > 0 ? 'alert' : 'success',
        value: stats.toWatch,
        label: 'à surveiller',
      }
    : {
        icon: <VisibilityOutlined />,
        tone: 'neutral',
        value: <Fraction x={0} total={stats.parcelTotal} />,
        label: 'Couverture NDVI',
      };

  const itk: StatDef = {
    icon: <EnergySavingsLeafOutlined />,
    tone: 'success',
    value: <Fraction x={stats.onItk} total={stats.parcelTotal} />,
    label: 'Sous ITK',
  };

  const cultivated: StatDef = {
    icon: <GrassOutlined />,
    tone: 'neutral',
    value: stats.cultivatedHa > 0 ? parseFloat(stats.cultivatedHa.toFixed(1)) : '—',
    label: 'Cultivée (ha)',
  };

  const items = [vigilance, ndvi, itk, cultivated];

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'stretch',
        justifyContent: 'space-between',
        padding: '12px 12px 10px',
        borderBottom: '1px solid rgba(55,75,70,0.12)',
        background: 'linear-gradient(180deg, rgba(1,134,117,0.04) 0%, #FFFFFF 100%)',
      }}
    >
      {items.map((item, i) => (
        <StatItem key={item.label} {...item} withDivider={i > 0} />
      ))}
    </Box>
  );
};
