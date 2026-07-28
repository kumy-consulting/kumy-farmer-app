import type { FunctionComponent, ReactNode } from 'react';

import CalendarMonthRounded from '@mui/icons-material/CalendarMonthRounded';
import EventAvailableRounded from '@mui/icons-material/EventAvailableRounded';
import GrassRounded from '@mui/icons-material/GrassRounded';
import SpaRounded from '@mui/icons-material/SpaRounded';
import { Box, Stack, Typography } from '@mui/material';

import { formatAge } from '@/features/Domaines/components/detailVisuals';

import { YieldCard } from './YieldCard';
import type { ParcelDetail } from '../../useParcelDetail';

const fmtDate = (iso?: string): string | null => {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
};

const cap = (s?: string): string | undefined => (s ? s.charAt(0).toUpperCase() + s.slice(1) : undefined);

interface InfoRowProps {
  icon: ReactNode;
  label: string;
  value?: string | null;
  hint?: string;
}

const InfoRow: FunctionComponent<InfoRowProps> = ({ icon, label, value, hint }) => (
  <Stack direction="row" alignItems="center" spacing={1.25} sx={{ px: 1.75, py: 1.375 }}>
    <Box
      sx={{
        width: 34,
        height: 34,
        flexShrink: 0,
        borderRadius: '10px',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, rgba(1,134,117,0.11) 0%, rgba(1,134,117,0.045) 100%)',
        border: '0.5px solid rgba(1,134,117,0.14)',
        '& svg': { fontSize: 18, color: '#018675' },
      }}
    >
      {icon}
    </Box>
    <Box sx={{ flex: 1, minWidth: 0 }}>
      <Typography sx={{ fontFamily: "'Ubuntu', sans-serif", fontSize: 11.5, fontWeight: 600, color: '#8F9291', lineHeight: 1.2, letterSpacing: '0.01em' }}>
        {label}
      </Typography>
      <Typography sx={{ fontFamily: "'Ubuntu', sans-serif", fontSize: 14, fontWeight: 700, color: value ? '#1A1C1B' : '#B0B5B3', lineHeight: 1.3 }}>
        {value ?? 'Non renseigné'}
      </Typography>
    </Box>
    {hint && (
      <Box
        sx={{
          flexShrink: 0,
          px: 1,
          py: 0.375,
          borderRadius: 999,
          background: 'rgba(1,134,117,0.10)',
          fontFamily: "'Ubuntu', sans-serif",
          fontSize: 11,
          fontWeight: 700,
          color: '#018675',
          letterSpacing: '0.01em',
          whiteSpace: 'nowrap',
        }}
      >
        {hint}
      </Box>
    )}
  </Stack>
);

/** Onglet Vue d'ensemble : informations générales + estimation de rendement. */
export const OverviewTabContent: FunctionComponent<{ detail: ParcelDetail }> = ({ detail }) => {
  const age = formatAge(detail.plantingDate);

  return (
    <Box sx={{ pt: 1.5, pb: 1 }}>
      <Typography sx={{ fontFamily: "'Ubuntu', sans-serif", fontSize: 15, fontWeight: 700, color: '#1A1C1B', px: 2, pb: 1 }}>
        Informations générales
      </Typography>

      <Box sx={{ mx: 2, borderRadius: '16px', background: '#FFFFFF', border: '1px solid #E2E3E1', boxShadow: '0 1px 2px rgba(0,0,0,0.04)', overflow: 'hidden', '& > *:not(:last-child)': { borderBottom: '1px solid #EEF1F0' } }}>
        <InfoRow icon={<GrassRounded />} label="Culture" value={cap(detail.cropType)} />
        <InfoRow icon={<SpaRounded />} label="Variété" value={cap(detail.variety)} />
        <InfoRow icon={<CalendarMonthRounded />} label="Date de semis" value={fmtDate(detail.plantingDate)} hint={age ?? undefined} />
        <InfoRow icon={<EventAvailableRounded />} label="Récolte prévue" value={fmtDate(detail.expectedHarvestDate)} />
      </Box>

      <Typography sx={{ fontFamily: "'Ubuntu', sans-serif", fontSize: 15, fontWeight: 700, color: '#1A1C1B', px: 2, pt: 2.5, pb: 1 }}>
        Estimation de rendement
      </Typography>
      <YieldCard estimate={detail.yieldEstimate} />
    </Box>
  );
};
