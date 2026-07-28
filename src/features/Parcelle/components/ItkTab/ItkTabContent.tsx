import { useMemo, useState, type FunctionComponent } from 'react';

import EnergySavingsLeafRounded from '@mui/icons-material/EnergySavingsLeafRounded';
import { Box, Stack, Typography } from '@mui/material';

import { ItkStageDetail } from './ItkStageDetail';
import { ItkStageTimeline } from './ItkStageTimeline';
import type { ItkParcelTasks } from '../../parcelle.types';

/** Message centré (états vides ITK). */
const EmptyState: FunctionComponent<{ title: string; message: string }> = ({ title, message }) => (
  <Stack alignItems="center" spacing={1.25} sx={{ px: 3, py: 4, textAlign: 'center' }}>
    <Box
      sx={{
        width: 56,
        height: 56,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(1,134,117,0.08)',
        '& svg': { fontSize: 26, color: '#35A18F' },
      }}
    >
      <EnergySavingsLeafRounded />
    </Box>
    <Typography sx={{ fontFamily: "'Ubuntu', sans-serif", fontSize: 14.5, fontWeight: 700, color: '#243F38' }}>
      {title}
    </Typography>
    <Typography sx={{ fontFamily: "'Ubuntu', sans-serif", fontSize: 13, color: '#5C5F5E', maxWidth: 280, lineHeight: 1.5 }}>
      {message}
    </Typography>
  </Stack>
);

/** Onglet ITK (lecture seule) : frise des stades + détail du stade sélectionné. */
export const ItkTabContent: FunctionComponent<{ itk: ItkParcelTasks | null }> = ({ itk }) => {
  const stages = useMemo(() => itk?.stages ?? [], [itk]);
  const [selectedCode, setSelectedCode] = useState<string | undefined>(
    itk?.currentStage?.stageCode ?? stages[0]?.stageCode,
  );

  const selectedStage = useMemo(
    () => stages.find((s) => s.stageCode === selectedCode) ?? stages[0],
    [stages, selectedCode],
  );

  if (!itk || !itk.hasActiveCampaign || stages.length === 0) {
    return (
      <EmptyState
        title="Calendrier en préparation"
        message="Le calendrier de culture de cette parcelle sera disponible dès que votre technicien aura démarré la campagne."
      />
    );
  }

  return (
    <Box>
      <ItkStageTimeline stages={stages} selectedStageCode={selectedStage?.stageCode} onSelectStage={setSelectedCode} />
      {selectedStage && <ItkStageDetail stage={selectedStage} />}
    </Box>
  );
};
