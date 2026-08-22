import type { FunctionComponent } from 'react';

import { Box, Stack, Typography } from '@mui/material';

import type { ItkTask } from '../../parcelle.types';
import { taskStateStyle } from '../itkVisuals';

/**
 * Ligne de tâche ITK — une fiche en LECTURE SEULE.
 *
 * Elle portait un `RadioButtonUnchecked` à gauche : le glyphe universel du
 * contrôle, qui invitait à cocher alors que rien n'est cochable ici. Il faisait
 * en plus doublon avec la pastille d'état — cercle vide et « À faire » disaient
 * la même chose, l'un en mentant. Il a été retiré, pas remplacé.
 *
 * Le fanion suit la grammaire de l'accueil (voir `BlocATraiter`) : il ne longe
 * que ce qui cloche, jamais ce qui reste à faire. Une tâche en retard le porte ;
 * les autres n'ont que leur pastille.
 */
export const ItkTaskRow: FunctionComponent<{ task: ItkTask }> = ({ task }) => {
  const state = taskStateStyle(task.state);
  const done = task.state === 'completed';
  const enRetard = task.state === 'overdue';

  return (
    <Box
      sx={{
        position: 'relative',
        p: 1.25,
        pl: enRetard ? 1.75 : 1.25,
        mx: 2,
        mb: 1,
        borderRadius: '12px',
        background: '#FFFFFF',
        // Sans ombre portée : elle surélevait la fiche et achevait de la faire
        // passer pour un bouton. Un simple filet suffit à la détacher du fond.
        border: '1px solid #E2E3E1',
        ...(enRetard && {
          '&::before': {
            content: '""',
            position: 'absolute',
            left: -2,
            top: 12,
            bottom: 12,
            width: 4,
            borderRadius: 999,
            background: state.color,
          },
        }),
      }}
    >
      <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={1}>
        <Typography
          sx={{
            fontFamily: "'Ubuntu', sans-serif",
            fontSize: 13.5,
            fontWeight: 700,
            // Une tâche faite est de l'historique : elle recule, pour que l'œil
            // tombe sur ce qui reste.
            color: done ? '#5C5F5E' : '#1A1C1B',
            lineHeight: 1.3,
            flex: 1,
            minWidth: 0,
          }}
        >
          {task.title}
        </Typography>
        <Box
          component="span"
          sx={{
            flexShrink: 0,
            mt: '1px',
            px: 0.875,
            py: 0.3,
            borderRadius: 999,
            fontFamily: "'Ubuntu', sans-serif",
            fontSize: 10.5,
            fontWeight: 700,
            color: state.color,
            background: state.bg,
          }}
        >
          {state.label}
        </Box>
      </Stack>

      {task.timing && (
        <Typography
          sx={{ fontFamily: "'Ubuntu', sans-serif", fontSize: 11.5, color: '#8F9291', mt: 0.4, lineHeight: 1.3 }}
        >
          {task.timing}
        </Typography>
      )}

      {task.inputs.length > 0 && (
        <Stack direction="row" flexWrap="wrap" gap={0.625} sx={{ mt: 0.75 }}>
          {task.inputs.map((input, i) => (
            <Box
              key={`${input.product}-${i}`}
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.5,
                px: 0.875,
                py: 0.375,
                borderRadius: '8px',
                background: 'rgba(1,134,117,0.07)',
                border: '0.5px solid rgba(1,134,117,0.18)',
              }}
            >
              <Typography sx={{ fontFamily: "'Ubuntu', sans-serif", fontSize: 11, fontWeight: 600, color: '#016557' }}>
                {input.product}
              </Typography>
              <Typography
                sx={{
                  fontFamily: "'Ubuntu', sans-serif",
                  fontSize: 11,
                  color: '#5C5F5E',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {input.dosePerHa} {input.unit}
              </Typography>
            </Box>
          ))}
        </Stack>
      )}
    </Box>
  );
};
