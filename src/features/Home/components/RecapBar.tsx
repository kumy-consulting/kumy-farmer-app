import type { FunctionComponent } from 'react';

import ChevronRightRounded from '@mui/icons-material/ChevronRightRounded';
import { Box, Stack, Typography } from '@mui/material';

import type { HomeRecap } from '../useHomeFeed';

interface RecapBarProps {
  recap: HomeRecap;
  onClick: () => void;
}

const HEALTH_LABEL: Record<HomeRecap['health'], { label: string; color: string }> = {
  good: { label: 'Santé : bonne', color: '#016557' },
  attention: { label: 'Santé : attention', color: '#8C5000' },
  critical: { label: 'Santé : critique', color: '#BA1A1A' },
};

/** Chiffres d'exploitation en une ligne — le détail vit sur l'écran Domaines. */
export const RecapBar: FunctionComponent<RecapBarProps> = ({ recap, onClick }) => {
  const health = HEALTH_LABEL[recap.health];
  const area = recap.areaHa.toLocaleString('fr-FR', { maximumFractionDigits: 1 });

  return (
    <Box
      component="button"
      type="button"
      onClick={onClick}
      sx={{
        all: 'unset',
        cursor: 'pointer',
        boxSizing: 'border-box',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        p: '12px 14px',
        borderRadius: '18px',
        background: '#FFFFFF',
        border: '1px solid rgba(55,75,70,0.07)',
        boxShadow: '0 6px 18px rgba(1,134,117,0.06)',
      }}
    >
      <Stack sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          sx={{ fontFamily: "'Ubuntu', sans-serif", fontSize: 13.5, fontWeight: 700, color: '#243F38' }}
        >
          {recap.domains} domaines · {recap.parcels} parcelles · {area} ha
        </Typography>
        <Stack direction="row" alignItems="center" spacing={0.75} sx={{ mt: 0.3 }}>
          <Box sx={{ width: 8, height: 8, borderRadius: '50%', background: health.color }} />
          <Typography sx={{ fontSize: 12, fontWeight: 600, color: health.color }}>{health.label}</Typography>
        </Stack>
      </Stack>
      <ChevronRightRounded sx={{ color: 'rgba(55,75,70,0.35)' }} />
    </Box>
  );
};
