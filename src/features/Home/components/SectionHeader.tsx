import type { FunctionComponent } from 'react';

import { Box, Stack, Typography } from '@mui/material';

interface SectionHeaderProps {
  title: string;
  count?: number;
  actionLabel?: string;
  onAction?: () => void;
}

export const SectionHeader: FunctionComponent<SectionHeaderProps> = ({ title, count, actionLabel, onAction }) => (
  <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.25 }}>
    <Stack direction="row" alignItems="center" spacing={1}>
      <Typography sx={{ fontFamily: "'Ubuntu', sans-serif", fontSize: 16, fontWeight: 700, color: '#243F38' }}>
        {title}
      </Typography>
      {count !== undefined && count > 0 && (
        <Box
          sx={{
            minWidth: 20,
            height: 20,
            px: 0.75,
            borderRadius: 999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(1,134,117,0.12)',
            color: '#016557',
            fontFamily: "'Ubuntu', sans-serif",
            fontSize: 12,
            fontWeight: 700,
          }}
        >
          {count}
        </Box>
      )}
    </Stack>
    {actionLabel && (
      <Typography
        component="button"
        onClick={onAction}
        sx={{
          all: 'unset',
          cursor: 'pointer',
          fontFamily: "'Ubuntu', sans-serif",
          fontSize: 13,
          fontWeight: 600,
          color: '#018675',
          '&:active': { opacity: 0.6 },
        }}
      >
        {actionLabel}
      </Typography>
    )}
  </Stack>
);
