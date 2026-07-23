import type { FunctionComponent } from 'react';

import EventAvailableRounded from '@mui/icons-material/EventAvailableRounded';
import { Box, Stack } from '@mui/material';

import type { PlannedActivity } from '../dashboard.types';
import { ActivityItem } from './ActivityItem';
import { EmptyState } from './EmptyState';
import { SectionHeader } from './SectionHeader';

interface ActivitiesSectionProps {
  activities: PlannedActivity[];
  onSelect?: (activity: PlannedActivity) => void;
  onSeeAll?: () => void;
}

export const ActivitiesSection: FunctionComponent<ActivitiesSectionProps> = ({ activities, onSelect, onSeeAll }) => (
  <Box>
    <SectionHeader
      title="Activités planifiées"
      actionLabel={activities.length > 0 ? 'Voir tout' : undefined}
      onAction={onSeeAll}
    />
    {activities.length === 0 ? (
      <EmptyState icon={<EventAvailableRounded />} message="Aucune activité planifiée pour le moment." />
    ) : (
      <Stack spacing={1.25}>
        {activities.map((activity) => (
          <ActivityItem key={activity.id} activity={activity} onClick={() => onSelect?.(activity)} />
        ))}
      </Stack>
    )}
  </Box>
);
