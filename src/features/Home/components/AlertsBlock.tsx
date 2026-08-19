import { useState, type FunctionComponent } from 'react';

import { Button, Stack, Typography } from '@mui/material';

import type { FeedItem } from '../home.feed.types';
import type { AlertsSection } from '../home.sections';
import { FeedCard } from './FeedCard';
import { SectionHeader } from './SectionHeader';

interface AlertsBlockProps {
  alerts: AlertsSection;
  onSelect: (item: FeedItem) => void;
}

/** Ce que l'accueil montre sans déplier. */
const PREVIEW = 3;

const noop = () => {};

/**
 * Section Alertes : les trois plus récentes, un badge portant le total, et le
 * reste derrière « Voir tout ». Les alertes trop anciennes (voir
 * `ALERT_FRESH_DAYS`) sortent du décompte : elles ne décrivent plus la parcelle
 * d'aujourd'hui, mais elles restent consultables plutôt que d'être escamotées.
 */
export const AlertsBlock: FunctionComponent<AlertsBlockProps> = ({ alerts, onSelect }) => {
  const [expanded, setExpanded] = useState(false);
  const [showStale, setShowStale] = useState(false);

  const visible = expanded ? alerts.fresh : alerts.fresh.slice(0, PREVIEW);
  const hidden = alerts.fresh.length - visible.length;

  return (
    <Stack>
      <SectionHeader title="Alertes" count={alerts.fresh.length} />

      {alerts.fresh.length === 0 ? (
        <Typography sx={{ fontSize: 13, color: 'rgba(55,75,70,0.6)', mb: alerts.stale.length > 0 ? 0.5 : 0 }}>
          Aucune alerte récente sur vos parcelles.
        </Typography>
      ) : (
        <Stack spacing={1.25}>
          {visible.map((item) => (
            <FeedCard key={item.id} item={item} isOnline onSelect={onSelect} onAction={noop} />
          ))}
        </Stack>
      )}

      {hidden > 0 && (
        <Button onClick={() => setExpanded(true)} sx={{ textTransform: 'none', alignSelf: 'center', mt: 0.5 }}>
          Voir les {alerts.fresh.length} alertes
        </Button>
      )}

      {alerts.stale.length > 0 && !showStale && (
        <Button
          onClick={() => setShowStale(true)}
          sx={{ textTransform: 'none', alignSelf: 'center', mt: 0.5, color: 'rgba(55,75,70,0.6)', fontSize: 12.5 }}
        >
          {alerts.stale.length} {alerts.stale.length > 1 ? 'alertes plus anciennes' : 'alerte plus ancienne'}
        </Button>
      )}

      {showStale && (
        <Stack spacing={1.25} sx={{ mt: 1.25, opacity: 0.62 }}>
          {alerts.stale.map((item) => (
            <FeedCard key={item.id} item={item} isOnline onSelect={onSelect} onAction={noop} />
          ))}
        </Stack>
      )}
    </Stack>
  );
};
