import type { FunctionComponent } from 'react';

import { Box, Stack, Typography } from '@mui/material';

import type { ItkStage, ItkTask } from '../../parcelle.types';
import { stageStatusColor, stageStatusLabel } from '../itkVisuals';
import { ItkTaskRow } from './ItkTaskRow';

const SectionHeading: FunctionComponent<{ label: string; count: number }> = ({ label, count }) => (
  <Stack direction="row" alignItems="center" spacing={0.875} sx={{ px: 2, pt: 2, pb: 1 }}>
    <Typography sx={{ fontFamily: "'Ubuntu', sans-serif", fontSize: 13, fontWeight: 700, color: '#243F38', letterSpacing: '0.02em' }}>
      {label}
    </Typography>
    <Box
      sx={{
        minWidth: 20,
        height: 20,
        px: '6px',
        borderRadius: 999,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(1,134,117,0.12)',
        color: '#006B5D',
        fontFamily: "'Ubuntu', sans-serif",
        fontSize: 11,
        fontWeight: 700,
      }}
    >
      {count}
    </Box>
  </Stack>
);

const TaskGroup: FunctionComponent<{ label: string; tasks: ItkTask[] }> = ({ label, tasks }) => {
  if (tasks.length === 0) return null;
  return (
    <>
      <SectionHeading label={label} count={tasks.length} />
      {tasks.map((t) => (
        <ItkTaskRow key={t.taskId} task={t} />
      ))}
    </>
  );
};

/** Détail d'un stade ITK : en-tête + description + tâches (obligatoires / recommandées). */
export const ItkStageDetail: FunctionComponent<{ stage: ItkStage }> = ({ stage }) => {
  const color = stageStatusColor(stage.status);
  const noTasks = stage.tasks.mandatory.length === 0 && stage.tasks.recommended.length === 0;

  return (
    <Box sx={{ pb: 1 }}>
      {/* En-tête du stade */}
      <Box sx={{ px: 2, pt: 2 }}>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
          <Typography sx={{ fontFamily: "'Ubuntu', sans-serif", fontSize: 17, fontWeight: 700, color: '#1A1C1B', lineHeight: 1.2 }}>
            {stage.stageName}
          </Typography>
          <Box
            component="span"
            sx={{
              px: 0.875,
              py: 0.3,
              borderRadius: 999,
              fontFamily: "'Ubuntu', sans-serif",
              fontSize: 10.5,
              fontWeight: 700,
              color: '#FFFFFF',
              background: color,
            }}
          >
            {stageStatusLabel(stage.status)}
          </Box>
        </Stack>
        <Typography sx={{ fontFamily: "'Ubuntu', sans-serif", fontSize: 12, fontWeight: 600, color: '#8F9291', letterSpacing: '0.02em' }}>
          J+{stage.dayStart} à J+{stage.dayEnd}
        </Typography>
        {stage.description && (
          <Typography sx={{ fontFamily: "'Ubuntu', sans-serif", fontSize: 13, color: '#5C5F5E', lineHeight: 1.5, mt: 1 }}>
            {stage.description}
          </Typography>
        )}
      </Box>

      <TaskGroup label="Tâches obligatoires" tasks={stage.tasks.mandatory} />
      <TaskGroup label="Tâches recommandées" tasks={stage.tasks.recommended} />

      {noTasks && (
        <Typography
          sx={{ fontFamily: "'Ubuntu', sans-serif", fontSize: 13, color: '#8F9291', px: 2, py: 2, textAlign: 'center' }}
        >
          Aucune tâche pour ce stade.
        </Typography>
      )}
    </Box>
  );
};
