import type { FunctionComponent } from 'react';

import ChevronRightRounded from '@mui/icons-material/ChevronRightRounded';
import { Box, Stack, Typography } from '@mui/material';

import type { DomainAlert } from '../dashboard.types';
import { alertIcon, SEVERITY } from './dashboardVisuals';
import { formatRelative } from '../formatRelative';

interface AlertCardProps {
  alert: DomainAlert;
  onClick?: () => void;
}

export const AlertCard: FunctionComponent<AlertCardProps> = ({ alert, onClick }) => {
  const tone = SEVERITY[alert.severity];

  return (
    <Box
      component="button"
      type="button"
      onClick={onClick}
      data-severity={alert.severity}
      sx={{
        all: 'unset',
        cursor: 'pointer',
        boxSizing: 'border-box',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: 1.25,
        p: '12px 14px',
        borderRadius: 16,
        background: '#FFFFFF',
        border: '1px solid rgba(55,75,70,0.07)',
        boxShadow: '0 6px 18px rgba(1,134,117,0.06)',
        borderLeft: `4px solid ${tone.main}`,
        transition: 'transform 0.12s ease',
        '&:active': { transform: 'scale(0.985)' },
      }}
    >
      <Box
        sx={{
          flexShrink: 0,
          width: 40,
          height: 40,
          borderRadius: 12,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: tone.soft,
          '& svg': { fontSize: 22, color: tone.main },
        }}
      >
        {alertIcon(alert.type)}
      </Box>

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Stack direction="row" alignItems="center" spacing={0.75}>
          <Typography
            sx={{
              fontFamily: "'Ubuntu', sans-serif",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.02em',
              color: tone.main,
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {alert.domainName}
          </Typography>
        </Stack>
        <Typography
          sx={{
            fontFamily: "'Ubuntu', sans-serif",
            fontSize: 13.5,
            fontWeight: 500,
            color: 'rgba(26,43,39,0.92)',
            lineHeight: 1.3,
            mt: 0.25,
          }}
        >
          {alert.message}
        </Typography>
        <Typography sx={{ fontSize: 11, fontWeight: 500, color: 'rgba(55,75,70,0.5)', mt: 0.4 }}>
          {formatRelative(alert.createdAt)}
        </Typography>
      </Box>

      <ChevronRightRounded sx={{ color: 'rgba(55,75,70,0.35)', flexShrink: 0 }} />
    </Box>
  );
};
