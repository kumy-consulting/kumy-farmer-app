import type { FunctionComponent } from 'react';

import CheckCircleRounded from '@mui/icons-material/CheckCircleRounded';
import RadioButtonUncheckedRounded from '@mui/icons-material/RadioButtonUncheckedRounded';
import { Box, Stack, Typography } from '@mui/material';

import type { ItkTask } from '../../parcelle.types';
import { taskStateStyle } from '../itkVisuals';

/** Ligne de tâche ITK (lecture seule) : titre, fenêtre, état, intrants. */
export const ItkTaskRow: FunctionComponent<{ task: ItkTask }> = ({ task }) => {
  const state = taskStateStyle(task.state);
  const done = task.state === 'completed';

  return (
    <Box
      sx={{
        display: 'flex',
        gap: 1.25,
        p: 1.25,
        mx: 2,
        mb: 1,
        borderRadius: '12px',
        background: '#FFFFFF',
        border: '1px solid #E2E3E1',
        boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
      }}
    >
      <Box
        sx={{
          flexShrink: 0,
          mt: '1px',
          '& svg': { fontSize: 20, color: done ? '#018675' : 'rgba(55,75,70,0.30)' },
        }}
      >
        {done ? <CheckCircleRounded /> : <RadioButtonUncheckedRounded />}
      </Box>

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
          <Typography
            sx={{
              fontFamily: "'Ubuntu', sans-serif",
              fontSize: 13.5,
              fontWeight: 700,
              color: '#1A1C1B',
              lineHeight: 1.3,
              flex: 1,
              minWidth: 0,
              textDecoration: done ? 'none' : 'none',
            }}
          >
            {task.title}
          </Typography>
          <Box
            component="span"
            sx={{
              flexShrink: 0,
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
                  sx={{ fontFamily: "'Ubuntu', sans-serif", fontSize: 11, color: '#5C5F5E', fontVariantNumeric: 'tabular-nums' }}
                >
                  {input.dosePerHa} {input.unit}
                </Typography>
              </Box>
            ))}
          </Stack>
        )}
      </Box>
    </Box>
  );
};
