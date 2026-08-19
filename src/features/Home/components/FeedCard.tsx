import type { FunctionComponent } from 'react';

import { Box, Stack, Typography } from '@mui/material';

import { formatRelative } from '../formatRelative';
import type { FeedItem } from '../home.feed.types';
import { feedIcon, KIND_TONE, SEVERITY_TONE, TASK_STATUS } from './feedVisuals';
import { TaskActions } from './TaskActions';

interface FeedCardProps {
  item: FeedItem;
  isOnline: boolean;
  onSelect: (item: FeedItem) => void;
  onAction: (id: string, action: 'start' | 'complete') => void;
}

/** Ligne de contexte sous le titre : retard, échéance ou fraîcheur. */
function timingLabel(item: FeedItem): string {
  if (item.overdue && item.daysOverdue) return `En retard de ${item.daysOverdue} j`;
  if (item.kind === 'alert' || item.kind === 'visit') return formatRelative(item.at);
  return formatRelative(item.at);
}

/**
 * Carte polymorphe du fil : même gabarit pour toutes les natures d'élément,
 * seules la teinte, le pictogramme et les actions changent. Une seule carte à
 * maintenir, un seul rythme visuel pour l'agriculteur.
 */
export const FeedCard: FunctionComponent<FeedCardProps> = ({ item, isOnline, onSelect, onAction }) => {
  const tone = item.severity ? SEVERITY_TONE[item.severity] : KIND_TONE[item.kind];
  const status = item.status ? TASK_STATUS[item.status] : null;

  return (
    <Box
      data-kind={item.kind}
      sx={{
        boxSizing: 'border-box',
        width: '100%',
        p: '12px 14px',
        borderRadius: '18px',
        background: '#FFFFFF',
        border: '1px solid rgba(55,75,70,0.07)',
        boxShadow: '0 6px 18px rgba(1,134,117,0.06)',
        borderLeft: `4px solid ${tone.main}`,
      }}
    >
      <Box
        component="button"
        type="button"
        onClick={() => onSelect(item)}
        sx={{
          all: 'unset',
          cursor: 'pointer',
          display: 'flex',
          gap: 1.25,
          width: '100%',
          alignItems: 'flex-start',
          transition: 'transform 0.12s ease',
          '&:active': { transform: 'scale(0.99)' },
        }}
      >
        <Box
          sx={{
            flexShrink: 0,
            width: 40,
            height: 40,
            borderRadius: '13px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: tone.soft,
            '& svg': { fontSize: 22, color: tone.main },
          }}
        >
          {feedIcon(item.icon)}
        </Box>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
            <Typography
              sx={{
                fontFamily: "'Ubuntu', sans-serif",
                fontSize: 11.5,
                fontWeight: 500,
                color: 'rgba(55,75,70,0.62)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {item.place}
            </Typography>
            {status && (
              <Typography
                sx={{
                  flexShrink: 0,
                  px: 0.9,
                  py: 0.2,
                  borderRadius: 999,
                  fontSize: 10.5,
                  fontWeight: 700,
                  color: status.color,
                  background: status.bg,
                }}
              >
                {status.label}
              </Typography>
            )}
          </Stack>

          <Typography
            sx={{
              fontFamily: "'Ubuntu', sans-serif",
              fontSize: 15,
              fontWeight: 700,
              color: '#16241F',
              lineHeight: 1.28,
              letterSpacing: '-0.006em',
              mt: 0.1,
            }}
          >
            {item.title}
          </Typography>

          {item.advice && (
            <Typography sx={{ fontSize: 12.5, fontWeight: 500, color: 'rgba(36,63,56,0.75)', mt: 0.35 }}>
              {item.advice}
            </Typography>
          )}

          {item.note && (
            <Typography sx={{ fontSize: 11.5, fontWeight: 500, color: '#8C5000', mt: 0.35 }}>
              {item.note}
            </Typography>
          )}

          {item.unmetPrerequisites?.length ? (
            <Typography sx={{ fontSize: 11.5, fontWeight: 500, color: 'rgba(55,75,70,0.6)', mt: 0.35 }}>
              À faire avant : {item.unmetPrerequisites.join(', ')}
            </Typography>
          ) : null}

          <Stack direction="row" spacing={0.75} sx={{ mt: 0.4 }}>
            <Typography sx={{ fontSize: 11, fontWeight: 600, color: item.overdue ? '#8C5000' : 'rgba(55,75,70,0.5)' }}>
              {timingLabel(item)}
            </Typography>
            {item.author && (
              <Typography sx={{ fontSize: 11, fontWeight: 500, color: 'rgba(55,75,70,0.5)' }}>
                · Consigne de {item.author}
              </Typography>
            )}
          </Stack>
        </Box>
      </Box>

      {item.actionable && <TaskActions item={item} isOnline={isOnline} onAction={onAction} />}
    </Box>
  );
};
