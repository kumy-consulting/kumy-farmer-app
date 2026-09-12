import { useMemo, useState, type FunctionComponent } from 'react';

import TaskAltRounded from '@mui/icons-material/TaskAltRounded';
import { Box, Stack, Typography } from '@mui/material';

import type { ElementPrioritaire } from '../../home.dashboard.types';
import type { FeedItem } from '../../home.feed.types';
import { useCollapsible } from '../../useCollapsible';
import { EmptyState } from '../EmptyState';
import { ExpandToggle } from '../ExpandToggle';
import { SectionHeader } from '../SectionHeader';
import { TaskActions } from '../TaskActions';
import { TONS_PASTILLE, tonPastilleDe } from './dashboardTons';
import { LignePerimetre, PastilleElement } from './dashboardVisuals';
import { FiltreATraiter } from './FiltreATraiter';
import { appartientAu, compterSegments, type SegmentATraiter } from './segmentsATraiter';

interface BlocATraiterProps {
  elements: ElementPrioritaire[];
  seuilVisible: number;
  isOnline: boolean;
  onSelect: (item: FeedItem) => void;
  onAction: (id: string, action: 'start' | 'complete') => void;
}

/** Une alerte se consulte, une action se fait — l'étiquette le dit avant le tap (§6). */
const NATURE_LABEL = { alerte: 'Alerte', action: 'Action' } as const;

const CarteElement: FunctionComponent<{
  element: ElementPrioritaire;
  isOnline: boolean;
  onSelect: (item: FeedItem) => void;
  onAction: (id: string, action: 'start' | 'complete') => void;
}> = ({ element, isOnline, onSelect, onAction }) => {
  const alerte = element.nature === 'alerte';
  const ton = tonPastilleDe(element.priorite);
  const teinte = TONS_PASTILLE[ton];

  return (
    <Box
      sx={{
        position: 'relative',
        borderRadius: '16px',
        background: '#FFFFFF',
        border: '1px solid rgba(55,75,70,0.07)',
        boxShadow: alerte ? `0 6px 20px -10px ${teinte.halo}` : '0 4px 14px rgba(1,134,117,0.05)',
        p: 1.75,
        // Le fanion : il ne longe que les alertes, et il déborde légèrement à
        // gauche pour se voir même quand le pouce couvre le corps de la carte.
        // Une consigne à faire n'en porte pas — c'est la deuxième marque, après
        // la forme de la pastille, qui sépare « à regarder » de « à faire ».
        ...(alerte && {
          '&::before': {
            content: '""',
            position: 'absolute',
            left: -2,
            top: 14,
            bottom: 14,
            width: 4,
            borderRadius: 999,
            background: teinte.plein,
          },
        }),
      }}
    >
      <Box
        component="button"
        type="button"
        onClick={() => onSelect(element.source)}
        sx={{
          appearance: 'none',
          background: 'none',
          border: 0,
          p: 0,
          font: 'inherit',
          textAlign: 'left',
          width: '100%',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px',
          cursor: 'pointer',
          '&:focus-visible': { outline: '2px solid #016557', outlineOffset: 3, borderRadius: 8 },
        }}
      >
        <PastilleElement nature={element.nature} ton={ton} icon={element.source.icon} />

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Stack direction="row" alignItems="baseline" justifyContent="space-between" spacing={1}>
            <Typography
              sx={{
                fontSize: 10.5,
                fontWeight: 700,
                letterSpacing: '0.09em',
                textTransform: 'uppercase',
                color: teinte.plein,
                flexShrink: 0,
              }}
            >
              {NATURE_LABEL[element.nature]}
            </Typography>

            {element.echeance && (
              <Typography sx={{ fontSize: 11.5, fontWeight: 600, color: '#5C5F5E', textAlign: 'right' }}>
                {element.echeance}
              </Typography>
            )}
          </Stack>

          <Typography
            sx={{
              fontFamily: "'Ubuntu', sans-serif",
              fontSize: 15,
              fontWeight: 700,
              color: '#1A1C1B',
              lineHeight: 1.3,
              mt: 0.4,
            }}
          >
            {element.titre}
          </Typography>

          <LignePerimetre perimetre={element.perimetre} />

          {element.actionRecommandee && (
            <Typography sx={{ fontSize: 13, color: '#374B46', lineHeight: 1.45, mt: 0.6 }}>
              {element.actionRecommandee}
            </Typography>
          )}
        </Box>
      </Box>

      {element.source.actionable && (
        <TaskActions item={element.source} isOnline={isOnline} onAction={onAction} />
      )}
    </Box>
  );
};

/**
 * Le cœur opérationnel de l'accueil (§5).
 *
 * Il ne montre pas tout : il montre ce qui demande une décision, alertes et
 * actions mélangées, du plus grave au moins grave. Séparer « alertes » et
 * « tâches » en deux listes obligeait à lire les deux pour savoir par quoi
 * commencer — alors que la question est unique.
 *
 * Trois éléments avant repli, quel que soit leur nombre. Le tri par gravité
 * garantit que ces trois-là sont les plus urgents du moment ; le reste est à un
 * geste. Sans ce plafond, six consignes en retard poussaient les blocs suivants
 * hors de portée — un tableau de bord doit tenir dans une hauteur prévisible.
 */
export const BlocATraiter: FunctionComponent<BlocATraiterProps> = ({
  elements,
  seuilVisible,
  isOnline,
  onSelect,
  onAction,
}) => {
  const { expanded, toggle, sectionRef } = useCollapsible();
  const [segment, setSegment] = useState<SegmentATraiter>('tout');

  const counts = useMemo(() => compterSegments(elements), [elements]);
  const filtres = useMemo(() => elements.filter((e) => appartientAu(e, segment)), [elements, segment]);

  const visibles = filtres.slice(0, seuilVisible);
  const restants = filtres.length - visibles.length;

  if (elements.length === 0) {
    return (
      <Box>
        <SectionHeader title="À traiter" />
        <EmptyState
          icon={<TaskAltRounded />}
          message="Rien à traiter aujourd’hui — aucune alerte ni action en attente sur vos parcelles."
        />
      </Box>
    );
  }

  return (
    <Box ref={sectionRef}>
      <SectionHeader title="À traiter" count={elements.length} />

      <FiltreATraiter
        counts={counts}
        actif={segment}
        onChange={(suivant) => {
          setSegment(suivant);
          // Changer de découpe rend une liste courte : la garder dépliée
          // laisserait l'écran dans l'état qu'on cherchait à quitter.
          toggle(false);
        }}
      />

      <Stack spacing={1.25}>
        {visibles.map((element) => (
          <CarteElement
            key={element.id}
            element={element}
            isOnline={isOnline}
            onSelect={onSelect}
            onAction={onAction}
          />
        ))}

        {expanded &&
          filtres
            .slice(seuilVisible)
            .map((element) => (
              <CarteElement
                key={element.id}
                element={element}
                isOnline={isOnline}
                onSelect={onSelect}
                onAction={onAction}
              />
            ))}
      </Stack>

      {restants > 0 && (
        <ExpandToggle expanded={expanded} moreLabel={`Voir les ${restants} autres`} onToggle={toggle} />
      )}
    </Box>
  );
};
