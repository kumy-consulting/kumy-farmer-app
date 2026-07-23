import type { FunctionComponent } from 'react';

import { Box, Typography } from '@mui/material';
import dayjs from 'dayjs';

import type { PlannedActivity } from '../dashboard.types';
import { activityIcon, STATUS } from './dashboardVisuals';

interface ActivityItemProps {
  activity: PlannedActivity;
  onClick?: () => void;
}

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Libellé court d'échéance : « Auj. 16:00 », « Demain 08:00 », « Sam 09:00 ». */
function formatSchedule(iso: string): string {
  const date = dayjs(iso);
  const startOfToday = dayjs().startOf('day');
  const days = date.startOf('day').diff(startOfToday, 'day');
  const time = date.format('HH:mm');
  if (days === 0) return `Auj. ${time}`;
  if (days === 1) return `Demain ${time}`;
  return `${capitalize(date.format('ddd'))} ${time}`;
}

export const ActivityItem: FunctionComponent<ActivityItemProps> = ({ activity, onClick }) => {
  const status = STATUS[activity.status];
  const done = activity.status === 'done';

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
        gap: 1.25,
        p: '12px 14px',
        borderRadius: 16,
        background: '#FFFFFF',
        border: '1px solid rgba(55,75,70,0.07)',
        boxShadow: '0 6px 18px rgba(1,134,117,0.06)',
        opacity: done ? 0.72 : 1,
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
          background: 'rgba(1,134,117,0.10)',
          '& svg': { fontSize: 21, color: '#016557' },
        }}
      >
        {activityIcon(activity.type)}
      </Box>

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          sx={{
            fontFamily: "'Ubuntu', sans-serif",
            fontSize: 14,
            fontWeight: 700,
            color: '#1A2B27',
            textDecoration: done ? 'line-through' : 'none',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {activity.title}
        </Typography>
        <Typography sx={{ fontSize: 12, fontWeight: 500, color: 'rgba(55,75,70,0.6)', mt: 0.25 }}>
          {activity.domainName} · {formatSchedule(activity.scheduledAt)}
        </Typography>
      </Box>

      <Box
        sx={{
          flexShrink: 0,
          px: 1.1,
          py: 0.5,
          borderRadius: 999,
          background: status.bg,
          color: status.color,
          fontFamily: "'Ubuntu', sans-serif",
          fontSize: 11,
          fontWeight: 700,
          whiteSpace: 'nowrap',
        }}
      >
        {status.label}
      </Box>
    </Box>
  );
};
