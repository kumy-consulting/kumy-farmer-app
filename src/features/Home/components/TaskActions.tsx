import type { FunctionComponent } from 'react';

import CheckRounded from '@mui/icons-material/CheckRounded';
import PlayArrowRounded from '@mui/icons-material/PlayArrowRounded';
import { Button, Stack, Typography } from '@mui/material';

import type { FeedItem } from '../home.feed.types';

interface TaskActionsProps {
  item: FeedItem;
  isOnline: boolean;
  onAction: (id: string, action: 'start' | 'complete') => void;
}

/**
 * Cible tactile d'au moins 44 px : ces deux boutons sont les seuls gestes que le
 * backend autorise à l'agriculteur, et ils vivent sur une carte qui navigue au
 * tap — une cible trop courte fait ouvrir la parcelle au lieu de clôturer.
 */
const base = {
  borderRadius: '999px',
  textTransform: 'none',
  fontFamily: "'Ubuntu', sans-serif",
  fontSize: 13,
  fontWeight: 600,
  px: 2,
  minHeight: 44,
  minWidth: 96,
} as const;

/**
 * Transitions offertes à l'agriculteur. « Démarrer » ne s'affiche que sur une
 * consigne planifiée, et une consigne faite n'offre plus rien : les transitions
 * légales côté serveur sont `planned → in_progress → done`.
 */
export const TaskActions: FunctionComponent<TaskActionsProps> = ({ item, isOnline, onAction }) => {
  if (item.status === 'done') return null;

  return (
    <Stack spacing={0.5} alignItems="flex-end" sx={{ mt: 1.25 }}>
      <Stack direction="row" spacing={1.5}>
        {item.status === 'planned' && (
          <Button
            variant="outlined"
            disabled={!isOnline}
            startIcon={<PlayArrowRounded />}
            onClick={(event) => {
              event.stopPropagation();
              onAction(item.id, 'start');
            }}
            sx={{ ...base, borderColor: 'rgba(1,134,117,0.3)', color: '#016557' }}
          >
            Démarrer
          </Button>
        )}
        <Button
          variant="contained"
          disableElevation
          disabled={!isOnline}
          startIcon={<CheckRounded />}
          onClick={(event) => {
            event.stopPropagation();
            onAction(item.id, 'complete');
          }}
          sx={{ ...base, background: '#018675', '&:hover': { background: '#016557' } }}
        >
          Terminé
        </Button>
      </Stack>
      {!isOnline && (
        <Typography sx={{ fontSize: 11.5, fontWeight: 500, color: 'rgba(55,75,70,0.6)' }}>
          Reconnectez-vous pour valider
        </Typography>
      )}
    </Stack>
  );
};
