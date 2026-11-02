import type { FunctionComponent } from 'react';

import CheckCircleRounded from '@mui/icons-material/CheckCircleRounded';
import PersonPinCircleRounded from '@mui/icons-material/PersonPinCircleRounded';
import ReportProblemRounded from '@mui/icons-material/ReportProblemRounded';
import { Box, Stack, Typography } from '@mui/material';

import type { EvenementRecent, NatureEvenement } from '../../home.dashboard.types';
import { SectionHeader } from '../SectionHeader';
import { Carte } from './dashboardVisuals';

interface BlocActiviteProps {
  activite: EvenementRecent[];
  onSelect: (target: string) => void;
}

/**
 * Trois natures, trois signes. Le pictogramme remplace le verbe qu'on collait
 * au titre — « … — signalée », « … — terminée » — et qui allongeait chaque
 * intitulé jusqu'à le faire passer sur deux lignes.
 */
const SIGNE: Record<NatureEvenement, { glyphe: typeof CheckCircleRounded; couleur: string }> = {
  fait: { glyphe: CheckCircleRounded, couleur: '#018675' },
  signal: { glyphe: ReportProblemRounded, couleur: '#C68A1A' },
  passage: { glyphe: PersonPinCircleRounded, couleur: '#4E635D' },
};

/**
 * Ce qui vient de se passer sur l'exploitation (§10).
 *
 * Bloc volontairement secondaire, et placé en dernier : il raconte, il ne
 * demande rien. Il s'était pourtant retrouvé le plus lourd de l'écran — titres
 * en gras sur deux lignes, un lieu par ligne, la même phrase répétée quatre
 * fois. Trois corrections l'ont remis à sa place :
 *
 * 1. **Un fait qui dure n'est pas quatre nouvelles.** Une alerte saisonnière
 *    remontée chaque jour est regroupée, datée de sa dernière occurrence et
 *    suivie du nombre de fois.
 * 2. **Le verbe passe dans le pictogramme.** Trois signes — fait, signalé,
 *    passage — au lieu d'un suffixe collé au titre.
 * 3. **Une ligne, pas un bloc.** Le lieu suit l'intitulé sur la même ligne, en
 *    encre sourde ; l'écriture reste maigre. Un journal se parcourt du regard,
 *    il ne se lit pas.
 *
 * Il est reconstitué des consignes closes et des alertes créées — aucun endpoint
 * d'événements n'existe. C'est moins riche qu'un journal, mais chaque ligne
 * correspond à un fait réel.
 */
export const BlocActivite: FunctionComponent<BlocActiviteProps> = ({ activite, onSelect }) => {
  if (activite.length === 0) return null;

  return (
    <div>
      <SectionHeader title="Activité récente" />
      <Carte pad={1.75}>
        <Stack spacing={0}>
          {activite.map((evenement, index) => {
            const signe = SIGNE[evenement.nature];
            const Glyphe = signe.glyphe;
            const lieu = [evenement.perimetre.parcelle, evenement.perimetre.domaine].filter(Boolean)[0];

            return (
              <Box
                key={evenement.id}
                component="button"
                type="button"
                onClick={() => evenement.target && onSelect(evenement.target)}
                sx={{
                  appearance: 'none',
                  background: 'none',
                  border: 0,
                  font: 'inherit',
                  textAlign: 'left',
                  width: '100%',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '9px',
                  cursor: evenement.target ? 'pointer' : 'default',
                  py: 1,
                  borderTop: index === 0 ? 'none' : '1px solid rgba(55,75,70,0.08)',
                  '&:focus-visible': { outline: '2px solid #016557', outlineOffset: -2, borderRadius: 8 },
                }}
              >
                <Glyphe sx={{ fontSize: 17, color: signe.couleur, flexShrink: 0, mt: '1px' }} />

                <Typography sx={{ flex: 1, minWidth: 0, fontSize: 13, color: '#374B46', lineHeight: 1.4 }}>
                  {evenement.titre}
                  {lieu && (
                    <Box component="span" sx={{ color: '#5C5F5E' }}>
                      {' · '}
                      {lieu}
                    </Box>
                  )}
                  {evenement.occurrences > 1 && (
                    <Box component="span" sx={{ color: '#5C5F5E', fontWeight: 700 }}>
                      {' · '}
                      {evenement.occurrences}×
                    </Box>
                  )}
                </Typography>

                <Typography sx={{ flexShrink: 0, fontSize: 11.5, color: '#5C5F5E', mt: '1px' }} noWrap>
                  {evenement.quand}
                </Typography>
              </Box>
            );
          })}
        </Stack>
      </Carte>
    </div>
  );
};
