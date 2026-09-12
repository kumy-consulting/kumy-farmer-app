import { useState, type FunctionComponent } from 'react';

import { Stack, Typography } from '@mui/material';

import type { FeedItem } from '../home.feed.types';
import type { AlertsSection } from '../home.sections';
import { useCollapsible } from '../useCollapsible';
import { ExpandToggle } from './ExpandToggle';
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
  const { sectionRef, expanded, toggle } = useCollapsible();
  const [showStale, setShowStale] = useState(false);

  const visible = expanded ? alerts.fresh : alerts.fresh.slice(0, PREVIEW);
  // Mesuré sur l'aperçu et non sur l'affiché : sinon le bouton s'efface dès
  // qu'on déplie, et la liste ne se referme plus.
  const overflow = alerts.fresh.length - PREVIEW;

  return (
    <Stack ref={sectionRef}>
      <SectionHeader
        title="Alertes"
        count={alerts.fresh.length}
        // Les anciennes se nomment dans les deux sens : « Voir moins » ici ne
        // dirait pas moins de QUOI, entre les récentes et les anciennes.
        actionLabel={
          alerts.stale.length === 0
            ? undefined
            : showStale
              ? 'Masquer les anciennes'
              : alerts.stale.length > 1
                ? `Voir les ${alerts.stale.length} anciennes`
                : 'Voir l’ancienne'
        }
        actionExpanded={alerts.stale.length > 0 ? showStale : undefined}
        onAction={() => setShowStale((shown) => !shown)}
      />

      {alerts.fresh.length === 0 ? (
        <Typography
          sx={{
            fontSize: 13,
            color: 'rgba(55,75,70,0.72)',
            p: '14px 16px',
            borderRadius: '18px',
            background: 'rgba(1,134,117,0.04)',
            border: '1px dashed rgba(1,134,117,0.2)',
          }}
        >
          Aucune alerte récente sur vos parcelles.
        </Typography>
      ) : (
        <Stack spacing={1.25}>
          {visible.map((item) => (
            <FeedCard key={item.id} item={item} isOnline onSelect={onSelect} onAction={noop} />
          ))}
        </Stack>
      )}

      {overflow > 0 && (
        <ExpandToggle
          expanded={expanded}
          moreLabel={`Voir ${overflow > 1 ? `les ${overflow} autres alertes` : 'l’autre alerte'}`}
          onToggle={toggle}
        />
      )}

      {showStale && (
        <Stack spacing={1.25} sx={{ mt: 1.25, opacity: 0.6 }}>
          <Typography sx={{ fontSize: 11.5, fontWeight: 600, color: 'rgba(55,75,70,0.55)' }}>
            Sans suite depuis plus d’une semaine
          </Typography>
          {alerts.stale.map((item) => (
            <FeedCard key={item.id} item={item} isOnline onSelect={onSelect} onAction={noop} />
          ))}
        </Stack>
      )}
    </Stack>
  );
};
