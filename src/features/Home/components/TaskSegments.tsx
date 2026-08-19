import type { FunctionComponent } from 'react';

import { Box, Typography } from '@mui/material';

import { TASK_SEGMENT_LABEL, TASK_SEGMENTS, type TaskSegment } from '../home.sections';

interface TaskSegmentsProps {
  counts: Record<TaskSegment, number>;
  active: TaskSegment;
  onChange: (segment: TaskSegment) => void;
}

/** Le retard se voit de loin ; les deux autres restent dans le vert de la marque. */
const TONE: Record<TaskSegment, { text: string; fill: string }> = {
  inProgress: { text: '#016557', fill: 'rgba(1,134,117,0.12)' },
  overdue: { text: '#8C5000', fill: 'rgba(198,138,26,0.18)' },
  planned: { text: '#4E635D', fill: 'rgba(78,99,93,0.10)' },
};

/**
 * Les trois compteurs de la section Tâches. Ils résument l'état du travail ET
 * servent de sélecteur : taper « En retard » n'affiche que les tâches en retard.
 */
export const TaskSegments: FunctionComponent<TaskSegmentsProps> = ({ counts, active, onChange }) => (
  <Box
    sx={{
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: 0.75,
      p: 0.75,
      borderRadius: '20px',
      background: '#FFFFFF',
      border: '1px solid rgba(55,75,70,0.07)',
      boxShadow: '0 6px 18px rgba(1,134,117,0.06)',
    }}
  >
    {TASK_SEGMENTS.map((segment) => {
      const isActive = segment === active;
      const tone = TONE[segment];

      return (
        <Box
          key={segment}
          component="button"
          type="button"
          aria-pressed={isActive}
          onClick={() => onChange(segment)}
          sx={{
            all: 'unset',
            cursor: 'pointer',
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 0.15,
            py: 1.1,
            borderRadius: '15px',
            background: isActive ? tone.fill : 'transparent',
            // Le segment actif s'ancre sur la liste qui le suit : le trait le
            // relie à son contenu, comme un onglet ouvert.
            boxShadow: isActive ? `inset 0 -3px 0 ${tone.text}` : 'none',
            transition: 'background 0.18s ease, box-shadow 0.18s ease',
            '&:focus-visible': { outline: `2px solid ${tone.text}`, outlineOffset: 2 },
          }}
        >
          <Typography
            sx={{
              fontFamily: "'Ubuntu', sans-serif",
              fontSize: 23,
              fontWeight: 700,
              lineHeight: 1.05,
              fontVariantNumeric: 'tabular-nums',
              color: counts[segment] > 0 ? tone.text : 'rgba(55,75,70,0.35)',
            }}
          >
            {counts[segment]}
          </Typography>
          <Typography
            sx={{
              fontSize: 11.5,
              fontWeight: isActive ? 700 : 500,
              color: isActive ? tone.text : 'rgba(55,75,70,0.6)',
            }}
          >
            {TASK_SEGMENT_LABEL[segment]}
          </Typography>
        </Box>
      );
    })}
  </Box>
);
