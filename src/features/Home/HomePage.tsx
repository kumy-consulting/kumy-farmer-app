import { useEffect, useState, type FunctionComponent } from 'react';

import TaskAltRounded from '@mui/icons-material/TaskAltRounded';
import { Alert, Box, Button, Snackbar, Stack, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';

import { useAuthStore } from '@/shared/stores/authStore';

import { EmptyState } from './components/EmptyState';
import { FeedSection } from './components/FeedSection';
import { HomeHeader } from './components/HomeHeader';
import { HomeSkeleton } from './components/HomeSkeleton';
import { RecapBar } from './components/RecapBar';
import { takeFirst } from './home.feed';
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

/** Nombre d'éléments montrés avant « Voir tout ». */
const VISIBLE_ITEMS = 8;

/** Prénom depuis la session (premier mot du displayName), repli neutre. */
const useFirstName = (): string => {
  const displayName = useAuthStore((s) => s.user?.displayName);
  return displayName?.trim().split(/\s+/)[0] || 'agriculteur';
};

/** État réseau du navigateur — les transitions de consigne exigent la ligne. */
const useIsOnline = (): boolean => {
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);

  useEffect(() => {
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  return isOnline;
};

export const HomePage: FunctionComponent = () => {
  const { groups, totalItems, recap, weather, isLoading, error, actionError, reload, runTaskAction } = useHomeFeed();
  const firstName = useFirstName();
  const isOnline = useIsOnline();
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);

  if (isLoading) {
    return (
      <Page>
        <HomeSkeleton />
      </Page>
    );
  }

  const { groups: visibleGroups, hidden } = expanded
    ? { groups, hidden: 0 }
    : takeFirst(groups, VISIBLE_ITEMS);

  const openItem = (item: FeedItem) => {
    if (item.target) navigate(item.target);
  };

  return (
    <Page>
      <Reveal>
        <HomeHeader firstName={firstName} weather={weather} onWeatherClick={(id) => navigate(`/domaines/${id}`)} />
      </Reveal>

      <Stack spacing={2.5} sx={{ px: 2.5, mt: 2, pb: 4 }}>
        {recap && (
          <Reveal sx={{ animationDelay: '0.05s' }}>
            <RecapBar recap={recap} onClick={() => navigate('/domaines')} />
          </Reveal>
        )}

        {error && (
          <Stack spacing={1} alignItems="flex-start">
            <Typography sx={{ fontSize: 13.5, color: '#8C5000' }}>{error}</Typography>
            <Button onClick={reload} sx={{ textTransform: 'none' }}>
              Réessayer
            </Button>
          </Stack>
        )}

        {!error && totalItems === 0 && (
          <EmptyState
            icon={<TaskAltRounded />}
            message="Rien d’urgent aujourd’hui — aucune consigne ni alerte en attente sur vos parcelles."
          />
        )}

        {visibleGroups.map((group, index) => (
          <Reveal key={group.bucket} sx={{ animationDelay: `${0.1 + index * 0.06}s` }}>
            <FeedSection group={group} isOnline={isOnline} onSelect={openItem} onAction={runTaskAction} />
          </Reveal>
        ))}

        {hidden > 0 && (
          <Button onClick={() => setExpanded(true)} sx={{ textTransform: 'none', alignSelf: 'center' }}>
            Voir tout ({hidden})
          </Button>
        )}
      </Stack>

      <Snackbar open={actionError !== null} autoHideDuration={4000}>
        <Alert severity="warning" variant="filled">
          {actionError}
        </Alert>
      </Snackbar>
    </Page>
  );
};
