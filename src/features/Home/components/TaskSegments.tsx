import type { FunctionComponent } from 'react';

import { Box, Stack, Typography } from '@mui/material';

import { error } from '@/theme/colors';

import { TASK_SEGMENT_LABEL, type TaskSegment } from '../home.sections';

interface TaskSegmentsProps {
  counts: Record<TaskSegment, number>;
  active: TaskSegment;
  onChange: (segment: TaskSegment) => void;
}

/**
 * L'alarme d'abord, le cycle de vie ensuite : ce qui est en retard passe avant
 * ce qui avance, qui passe avant ce qui attend.
 */
const ORDER: TaskSegment[] = ['overdue', 'inProgress', 'planned'];

/**
 * Le retard prend le rouge des alertes critiques du fil, pas un ambre à part :
 * une consigne dépassée et une alerte grave demandent la même chose — d'agir
 * maintenant. Un vocabulaire de couleur unique évite à l'agriculteur d'avoir à
 * apprendre deux échelles de gravité sur le même écran. Les deux autres restent
 * dans le vert de la marque.
 */
const TONE: Record<TaskSegment, { text: string; fill: string }> = {
  overdue: { text: error[40], fill: 'rgba(186,26,26,0.13)' },
  inProgress: { text: '#016557', fill: 'rgba(1,134,117,0.14)' },
  planned: { text: '#4E635D', fill: 'rgba(78,99,93,0.12)' },
};

/**
 * Filtre des tâches : une puce par état, dimensionnée par son contenu.
 *
 * Une grille à trois colonnes égales accordait autant de place à « 0 en cours »
 * qu'à « 5 en retard » — ici, un état vide occupe la largeur de ce qu'il a à
 * dire, et l'œil tombe sur ce qui presse.
 */
export const TaskSegments: FunctionComponent<TaskSegmentsProps> = ({ counts, active, onChange }) => (
  <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
    {ORDER.map((segment) => {
      const isActive = segment === active;
      const count = counts[segment];
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
            boxSizing: 'border-box',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'baseline',
            gap: 0.6,
            minHeight: 44,
            px: 1.6,
            py: 1,
            borderRadius: 999,
            // Un seul dispositif d'état : le remplissage. La bordure marque les
            // puces inactives, elle disparaît sous le fond de la puce ouverte.
            background: isActive ? tone.fill : 'transparent',
            border: `1px solid ${isActive ? 'transparent' : 'rgba(55,75,70,0.16)'}`,
            opacity: count === 0 && !isActive ? 0.55 : 1,
            transition: 'background 0.18s ease, opacity 0.18s ease',
            '&:focus-visible': { outline: `2px solid ${tone.text}`, outlineOffset: 2 },
          }}
        >
          <Typography
            component="span"
            sx={{
              fontFamily: "'Ubuntu', sans-serif",
              fontSize: 16,
              fontWeight: 700,
              lineHeight: 1,
              fontVariantNumeric: 'tabular-nums',
              color: count > 0 ? tone.text : 'rgba(55,75,70,0.45)',
            }}
          >
            {count}
          </Typography>
          <Typography
            component="span"
            sx={{
              fontSize: 12.5,
              fontWeight: isActive ? 700 : 500,
              lineHeight: 1,
              color: isActive ? tone.text : 'rgba(55,75,70,0.62)',
            }}
          >
            {TASK_SEGMENT_LABEL[segment]}
          </Typography>
        </Box>
      );
    })}
  </Stack>
);
