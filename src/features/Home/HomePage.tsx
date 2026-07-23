import type { FunctionComponent } from 'react';

import { Box, Stack } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';

import { useAuthStore } from '@/shared/stores/authStore';

import { ActivitiesSection } from './components/ActivitiesSection';
import { AlertsSection } from './components/AlertsSection';
import { DashboardHeader } from './components/DashboardHeader';
import { DashboardSkeleton } from './components/DashboardSkeleton';
import { DomainsOverview } from './components/DomainsOverview';
import { ForecastStrip } from './components/ForecastStrip';
import { useDashboard } from './useDashboard';

const Page = styled(Box)({
  minHeight: '100dvh',
  background: 'linear-gradient(180deg, #F3FFFA 0%, #F0F1EF 100%)',
});

/** Révélation en fondu montant, mise en cascade via `animation-delay`. */
const Reveal = styled(Box)({
  animation: 'dashIn 0.5s cubic-bezier(0.22, 0.61, 0.36, 1) both',
  '@keyframes dashIn': {
    from: { opacity: 0, transform: 'translateY(12px)' },
    to: { opacity: 1, transform: 'translateY(0)' },
  },
  '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
});

/** Prénom depuis la session (premier mot du displayName), repli neutre. */
const useFirstName = (): string => {
  const displayName = useAuthStore((s) => s.user?.displayName);
  return displayName?.trim().split(/\s+/)[0] || 'agriculteur';
};

export const HomePage: FunctionComponent = () => {
  const { data, isLoading } = useDashboard();
  const firstName = useFirstName();
  const navigate = useNavigate();

  if (isLoading || !data) {
    return (
      <Page>
        <DashboardSkeleton />
      </Page>
    );
  }

  const goDomaines = () => navigate('/domaines');

  return (
    <Page>
      <Reveal>
        <DashboardHeader firstName={firstName} weather={data.weather} />
      </Reveal>

      <Box sx={{ px: 2.5, mt: -3 }}>
        <Reveal sx={{ animationDelay: '0.05s' }}>
          <ForecastStrip forecast={data.forecast} />
        </Reveal>

        <Stack spacing={3} sx={{ mt: 3, pb: 3 }}>
          <Reveal sx={{ animationDelay: '0.1s' }}>
            <DomainsOverview overview={data.overview} />
          </Reveal>
          <Reveal sx={{ animationDelay: '0.16s' }}>
            <AlertsSection alerts={data.alerts} onSelect={goDomaines} onSeeAll={goDomaines} />
          </Reveal>
          <Reveal sx={{ animationDelay: '0.22s' }}>
            <ActivitiesSection activities={data.activities} onSelect={goDomaines} onSeeAll={goDomaines} />
          </Reveal>
        </Stack>
      </Box>
    </Page>
  );
};
