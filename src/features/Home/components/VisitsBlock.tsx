import type { FunctionComponent } from 'react';

import ChevronRightRounded from '@mui/icons-material/ChevronRightRounded';
import PersonPinCircleRounded from '@mui/icons-material/PersonPinCircleRounded';
import ScheduleRounded from '@mui/icons-material/ScheduleRounded';
import { Box, Stack, Typography } from '@mui/material';
import dayjs from 'dayjs';

import type { FeedItem } from '../home.feed.types';
import type { VisitsSection } from '../home.sections';
import { SectionHeader } from './SectionHeader';

interface VisitsBlockProps {
  visits: VisitsSection;
  onSelect: (item: FeedItem) => void;
}

const row = {
  display: 'flex',
  alignItems: 'center',
  gap: 1.25,
  p: '12px 14px',
} as const;

const label = { fontSize: 11, fontWeight: 700, letterSpacing: '0.02em', textTransform: 'uppercase' } as const;

/**
 * Section Visites : la dernière visite de l'encadreur et son avancement, puis
 * la prochaine — inconnue, et annoncée comme telle : aucun endpoint de visite
 * n'est ouvert au rôle FARMER, donc l'app ne peut pas promettre une date.
 */
export const VisitsBlock: FunctionComponent<VisitsBlockProps> = ({ visits, onSelect }) => {
  const last = visits.last;

  return (
    <Stack>
      <SectionHeader title="Visites" />

      <Box
        sx={{
          borderRadius: '18px',
          background: '#FFFFFF',
          border: '1px solid rgba(55,75,70,0.07)',
          boxShadow: '0 6px 18px rgba(1,134,117,0.06)',
          overflow: 'hidden',
        }}
      >
        <Box
          component={last ? 'button' : 'div'}
          type={last ? 'button' : undefined}
          onClick={last ? () => onSelect(last) : undefined}
          sx={{
            all: 'unset',
            boxSizing: 'border-box',
            width: '100%',
            cursor: last ? 'pointer' : 'default',
            ...row,
          }}
        >
          <Box
            sx={{
              flexShrink: 0,
              width: 38,
              height: 38,
              borderRadius: '13px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(58,90,140,0.12)',
              '& svg': { fontSize: 21, color: '#3A5A8C' },
            }}
          >
            <PersonPinCircleRounded />
          </Box>

          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ ...label, color: '#3A5A8C' }}>
              Dernière {last && `· ${dayjs(last.at).format('D MMMM')}`}
            </Typography>
            <Typography
              sx={{
                fontFamily: "'Ubuntu', sans-serif",
                fontSize: 14,
                fontWeight: 600,
                color: 'rgba(26,43,39,0.92)',
                mt: 0.2,
              }}
            >
              {last ? last.title : 'Aucune visite enregistrée'}
            </Typography>
            {last?.advice && (
              <Typography sx={{ fontSize: 12.5, color: 'rgba(36,63,56,0.75)', mt: 0.25 }}>{last.advice}</Typography>
            )}
          </Box>

          {last && <ChevronRightRounded sx={{ color: 'rgba(55,75,70,0.35)', flexShrink: 0 }} />}
        </Box>

        <Box sx={{ height: '1px', background: 'rgba(55,75,70,0.08)', mx: 1.75 }} />

        <Box sx={row}>
          <Box
            sx={{
              flexShrink: 0,
              width: 38,
              height: 38,
              borderRadius: '13px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(78,99,93,0.10)',
              '& svg': { fontSize: 21, color: 'rgba(55,75,70,0.5)' },
            }}
          >
            <ScheduleRounded />
          </Box>

          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ ...label, color: 'rgba(55,75,70,0.55)' }}>Prochaine</Typography>
            <Typography sx={{ fontSize: 13.5, fontWeight: 500, color: 'rgba(55,75,70,0.7)', mt: 0.2 }}>
              Non planifiée
            </Typography>
          </Box>
        </Box>
      </Box>
    </Stack>
  );
};
