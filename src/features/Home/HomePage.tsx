import type { FunctionComponent } from 'react';

import { Alert, Box, Button, Snackbar, Stack, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';

import { useIsOnline } from '@/shared/hooks/useIsOnline';
import { useAuthStore } from '@/shared/stores/authStore';

import { BlocAccompagnement } from './components/dashboard/BlocAccompagnement';
import { BlocActivite } from './components/dashboard/BlocActivite';
import { BlocATraiter } from './components/dashboard/BlocATraiter';
import { BlocDomaines } from './components/dashboard/BlocDomaines';
import { BlocExploitation } from './components/dashboard/BlocExploitation';
import { HomeHeader } from './components/HomeHeader';
import { HomeSkeleton } from './components/HomeSkeleton';
import { isDemoMode } from './home.demo';
import type { FeedItem } from './home.feed.types';
import { useHomeFeed } from './useHomeFeed';

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
  const { dashboard, weather, isLoading, error, actionError, reload, runTaskAction, dismissActionError } =
    useHomeFeed();
  const firstName = useFirstName();
  const isOnline = useIsOnline();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <Page>
        <HomeSkeleton />
      </Page>
    );
  }

  const openItem = (item: FeedItem) => {
    if (item.target) navigate(item.target);
  };

  return (
    <Page>
      <Reveal>
        <HomeHeader firstName={firstName} weather={weather} onWeatherClick={(id) => navigate(`/domaines/${id}`)} />
      </Reveal>

      <Stack spacing={2.75} sx={{ px: 2.5, mt: 2, pb: 4 }}>
        {isDemoMode() && (
          <Typography
            sx={{
              alignSelf: 'flex-start',
              px: 1.1,
              py: 0.35,
              borderRadius: 999,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: '#8C5000',
              background: 'rgba(198,138,26,0.16)',
            }}
          >
            Données de démonstration
          </Typography>
        )}

        {error && (
          <Stack spacing={1} alignItems="flex-start">
            <Typography sx={{ fontSize: 13.5, color: '#8C5000' }}>{error}</Typography>
            <Button onClick={reload} sx={{ textTransform: 'none' }}>
              Réessayer
            </Button>
          </Stack>
        )}

        <Reveal sx={{ animationDelay: '0.06s' }}>
          <BlocExploitation resume={dashboard.resume} />
        </Reveal>

        <Reveal sx={{ animationDelay: '0.12s' }}>
          <BlocATraiter
            elements={dashboard.elements}
            seuilVisible={dashboard.seuilVisible}
            isOnline={isOnline}
            onSelect={openItem}
            onAction={runTaskAction}
          />
        </Reveal>

        {dashboard.domaines.total > 0 && (
          <Reveal sx={{ animationDelay: '0.18s' }}>
            <BlocDomaines domaines={dashboard.domaines} onVoirDomaines={() => navigate('/domaines')} />
          </Reveal>
        )}

        <Reveal sx={{ animationDelay: '0.24s' }}>
          <BlocAccompagnement
            accompagnement={dashboard.accompagnement}
            onVoirVisite={() =>
              navigate(dashboard.accompagnement.derniereVisite?.target ?? '/domaines')
            }
          />
        </Reveal>

        <Reveal sx={{ animationDelay: '0.3s' }}>
          <BlocActivite activite={dashboard.activite} onSelect={(target) => navigate(target)} />
        </Reveal>
      </Stack>

      <Snackbar open={actionError !== null} autoHideDuration={4000} onClose={dismissActionError}>
        <Alert severity="warning" variant="filled">
          {actionError}
        </Alert>
      </Snackbar>
    </Page>
  );
};
