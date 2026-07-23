import type { FunctionComponent } from 'react';

import CheckCircleRounded from '@mui/icons-material/CheckCircleRounded';
import { Box, Stack } from '@mui/material';

import type { DomainAlert } from '../dashboard.types';
import { AlertCard } from './AlertCard';
import { EmptyState } from './EmptyState';
import { SectionHeader } from './SectionHeader';

interface AlertsSectionProps {
  alerts: DomainAlert[];
  onSelect?: (alert: DomainAlert) => void;
  onSeeAll?: () => void;
}

export const AlertsSection: FunctionComponent<AlertsSectionProps> = ({ alerts, onSelect, onSeeAll }) => (
  <Box>
    <SectionHeader
      title="Alertes"
      count={alerts.length}
      actionLabel={alerts.length > 0 ? 'Voir tout' : undefined}
      onAction={onSeeAll}
    />
    {alerts.length === 0 ? (
      <EmptyState icon={<CheckCircleRounded />} message="Aucune alerte — tout va bien sur vos domaines." />
    ) : (
      <Stack spacing={1.25}>
        {alerts.map((alert) => (
          <AlertCard key={alert.id} alert={alert} onClick={() => onSelect?.(alert)} />
        ))}
      </Stack>
    )}
  </Box>
);
