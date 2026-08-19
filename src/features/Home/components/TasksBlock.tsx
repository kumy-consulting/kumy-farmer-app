import { useState, type FunctionComponent } from 'react';

import { Button, Stack, Typography } from '@mui/material';

import type { FeedItem } from '../home.feed.types';
import { defaultSegment, type TasksSection, type TaskSegment } from '../home.sections';
import { FeedCard } from './FeedCard';
import { SectionHeader } from './SectionHeader';
import { TaskSegments } from './TaskSegments';

interface TasksBlockProps {
  tasks: TasksSection;
  isOnline: boolean;
  onSelect: (item: FeedItem) => void;
  onAction: (id: string, action: 'start' | 'complete') => void;
}

/** Ce que l'accueil montre sans déplier. */
const PREVIEW = 3;

const EMPTY_SEGMENT: Record<TaskSegment, string> = {
  inProgress: 'Aucune tâche démarrée.',
  overdue: 'Rien en retard, tout est à jour.',
  planned: 'Rien de prévu pour l’instant.',
};

/** Vers quoi renvoyer quand le segment ouvert est vide : le travail qui attend. */
function suggestion(counts: Record<TaskSegment, number>, active: TaskSegment): TaskSegment | null {
  const order: TaskSegment[] = ['overdue', 'inProgress', 'planned'];
  return order.find((segment) => segment !== active && counts[segment] > 0) ?? null;
}

const SUGGESTION_LABEL: Record<TaskSegment, (count: number) => string> = {
  overdue: (count) => (count > 1 ? `Voir les ${count} en retard` : 'Voir la tâche en retard'),
  inProgress: (count) => (count > 1 ? `Voir les ${count} en cours` : 'Voir la tâche en cours'),
  planned: (count) => (count > 1 ? `Voir les ${count} prévues` : 'Voir la tâche prévue'),
};

/**
 * Section Tâches : trois compteurs qui résument le travail et filtrent la liste.
 * Le segment ouvert par défaut est le plus urgent qui contient quelque chose,
 * pour que l'agriculteur tombe sur ce qui presse sans avoir à choisir.
 */
export const TasksBlock: FunctionComponent<TasksBlockProps> = ({ tasks, isOnline, onSelect, onAction }) => {
  const [chosen, setChosen] = useState<TaskSegment | null>(null);
  const [expanded, setExpanded] = useState(false);

  const active = chosen ?? defaultSegment(tasks.counts);
  const items = tasks.bySegment[active];
  const visible = expanded ? items : items.slice(0, PREVIEW);
  const hidden = items.length - visible.length;

  const next = suggestion(tasks.counts, active);

  const select = (segment: TaskSegment) => {
    setChosen(segment);
    setExpanded(false);
  };

  return (
    <Stack>
      <SectionHeader title="Tâches" />

      <TaskSegments counts={tasks.counts} active={active} onChange={select} />

      {items.length === 0 ? (
        <Stack
          spacing={0.75}
          alignItems="flex-start"
          sx={{
            mt: 1.5,
            p: '14px 16px',
            borderRadius: '18px',
            background: 'rgba(1,134,117,0.04)',
            border: '1px dashed rgba(1,134,117,0.2)',
          }}
        >
          <Typography sx={{ fontSize: 13, color: 'rgba(55,75,70,0.72)' }}>{EMPTY_SEGMENT[active]}</Typography>
          {next && (
            <Button
              onClick={() => select(next)}
              sx={{ textTransform: 'none', px: 0, minWidth: 0, fontSize: 13, fontWeight: 600 }}
            >
              {SUGGESTION_LABEL[next](tasks.counts[next])}
            </Button>
          )}
        </Stack>
      ) : (
        <Stack spacing={1.25} sx={{ mt: 1.5 }}>
          {visible.map((item) => (
            <FeedCard key={item.id} item={item} isOnline={isOnline} onSelect={onSelect} onAction={onAction} />
          ))}
        </Stack>
      )}

      {hidden > 0 && (
        <Button onClick={() => setExpanded(true)} sx={{ textTransform: 'none', alignSelf: 'center', mt: 0.5 }}>
          Voir les {items.length} tâches
        </Button>
      )}

      {tasks.doneToday.length > 0 && (
        <Stack spacing={1.25} sx={{ mt: 1.5 }}>
          <Typography sx={{ fontSize: 12, fontWeight: 600, color: 'rgba(55,75,70,0.55)' }}>
            Fait aujourd’hui
          </Typography>
          {tasks.doneToday.map((item) => (
            <FeedCard key={item.id} item={item} isOnline={isOnline} onSelect={onSelect} onAction={onAction} />
          ))}
        </Stack>
      )}
    </Stack>
  );
};
