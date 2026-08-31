import type { FunctionComponent } from 'react';

import { Box, Stack, Typography } from '@mui/material';
import dayjs from 'dayjs';

import { LIBELLE_PILIER } from '../monEspace.demo';
import type { Pilier, ScoreAgriculteur } from '../monEspace.types';
import { Card, SectionTitle } from './espaceUi';

interface BlocScoreProps {
  score: ScoreAgriculteur;
  /** La page dédiée porte déjà le titre dans son en-tête : on ne le répète pas. */
  sansTitre?: boolean;
}

/**
 * Ce que ce pilier coûte au score global, en points.
 *
 * Le score global est la moyenne des piliers pondérée par leur poids — les poids
 * somment à 100, et le calcul redonne bien la valeur renvoyée par l'API. Un
 * pilier fait donc perdre `poids × (100 − score) / 100` points, et c'est cette
 * grandeur, non le score brut, qui dit où l'effort rapporte.
 *
 * Sans elle, la liste triée par score plaçait « Débouchés » (44) en tête alors
 * qu'il ne pèse que 5 % : deux points et demi à récupérer, contre douze sur la
 * situation financière. Le classement désignait le mauvais chantier.
 */
const pointsPerdus = (pilier: Pilier): number => (pilier.poids * (100 - pilier.score)) / 100;

const arrondi = (valeur: number): string => valeur.toLocaleString('fr-FR', { maximumFractionDigits: 1 });

/** Deux tons seulement dans la liste de travail : ce qui presse, ce qui suit. */
const TON = { presse: '#BA1A1A', suit: '#C68A1A', bon: '#018675' } as const;

/**
 * Le score, décomposé en ce sur quoi agir.
 *
 * Un chiffre global seul est un jugement : on le subit. Les six piliers le
 * rendent utilisable — mais alignés à l'identique, ils ne disaient pas lequel
 * mérite l'effort. Trois décisions règlent ça :
 *
 * 1. **Le classement suit les points à récupérer, pas le score.** Un pilier
 *    faible qui pèse 5 % coûte moins qu'un pilier moyen qui en pèse 25.
 * 2. **Les forces quittent la liste de travail.** Elles ferment la page en deux
 *    lignes sourdes : elles rassurent, elles n'appellent aucune action, et
 *    intercalées elles noyaient les quatre lignes qui comptent.
 * 3. **Le poids est dit en toutes lettres.** « 25 % de votre score » se
 *    comprend ; un « 25 % » gris de 11 px à côté d'un autre nombre ne dit pas
 *    de quoi il est le pourcentage.
 */
export const BlocScore: FunctionComponent<BlocScoreProps> = ({ score, sansTitre }) => {
  // `niveau` vient de l'API : on ne réinvente pas de seuil côté écran.
  const aTravailler = score.piliers
    .filter((pilier) => pilier.niveau !== 'high')
    .sort((a, b) => pointsPerdus(b) - pointsPerdus(a));
  const forces = score.piliers.filter((pilier) => pilier.niveau === 'high').sort((a, b) => b.score - a.score);

  const recuperables = aTravailler.reduce((somme, pilier) => somme + pointsPerdus(pilier), 0);

  return (
    <Box>
      {!sansTitre && <SectionTitle>Mon score</SectionTitle>}

      <Card pad={2.25}>
        <Stack direction="row" alignItems="flex-end" spacing={1}>
          <Typography
            sx={{
              fontFamily: "'Ubuntu', sans-serif",
              fontSize: 46,
              fontWeight: 700,
              lineHeight: 0.9,
              letterSpacing: '-0.03em',
              color: '#1A1C1B',
            }}
          >
            {score.scoreGlobal}
          </Typography>
          <Typography sx={{ fontSize: 14, color: '#5C5F5E', pb: '3px' }}>/ 100</Typography>
          <Box
            component="span"
            sx={{
              ml: 'auto',
              px: 1.1,
              py: 0.45,
              borderRadius: 999,
              background: 'rgba(1,134,117,0.12)',
              fontFamily: "'Ubuntu', sans-serif",
              fontSize: 13,
              fontWeight: 700,
              color: '#005046',
            }}
          >
            Grade {score.grade}
          </Box>
        </Stack>

        {/* Un score est daté : sans sa date il passerait pour l'état du jour,
            alors qu'il est recalculé périodiquement. */}
        <Typography sx={{ fontSize: 12, color: '#5C5F5E', mt: 0.9 }}>
          Calculé le {dayjs(score.calculeLe).format('D MMMM')}
        </Typography>

        {recuperables >= 1 && (
          <Typography sx={{ fontSize: 13.5, color: '#374B46', lineHeight: 1.45, mt: 1.4 }}>
            <Box component="strong" sx={{ fontWeight: 700, color: '#1A1C1B' }}>
              {arrondi(recuperables)} points
            </Box>{' '}
            sont à votre portée sur {aTravailler.length === 1 ? 'un pilier' : `${aTravailler.length} piliers`}.
          </Typography>
        )}
      </Card>

      {aTravailler.length > 0 && (
        <Box sx={{ mt: 2.25 }}>
          <SectionTitle>À travailler en priorité</SectionTitle>
          <Card pad={2.25}>
            <Stack spacing={2}>
              {aTravailler.map((pilier) => {
                const perdus = pointsPerdus(pilier);
                const ton = pilier.niveau === 'low' ? TON.presse : TON.suit;

                return (
                  <Box key={pilier.cle}>
                    <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={1.5}>
                      <Typography
                        sx={{
                          fontFamily: "'Ubuntu', sans-serif",
                          fontSize: 14.5,
                          fontWeight: 700,
                          color: '#1A1C1B',
                          minWidth: 0,
                        }}
                      >
                        {LIBELLE_PILIER[pilier.cle] ?? pilier.cle}
                      </Typography>
                      {/* Les points à gagner et le poids vont ensemble : c'est le
                          poids qui explique le nombre de points, les séparer
                          obligeait à faire le lien soi-même. */}
                      <Box sx={{ flexShrink: 0, textAlign: 'right' }}>
                        <Typography
                          sx={{
                            fontFamily: "'Ubuntu', sans-serif",
                            fontSize: 14,
                            fontWeight: 700,
                            color: ton,
                            lineHeight: 1.1,
                            fontVariantNumeric: 'tabular-nums',
                          }}
                        >
                          +{arrondi(perdus)} pts
                        </Typography>
                        <Typography sx={{ fontSize: 11.5, color: '#8F9291', mt: 0.15 }} noWrap>
                          {pilier.poids} % du score
                        </Typography>
                      </Box>
                    </Stack>

                    <Box
                      aria-hidden
                      sx={{
                        height: 6,
                        borderRadius: 999,
                        background: 'rgba(55,75,70,0.10)',
                        mt: 0.75,
                        overflow: 'hidden',
                      }}
                    >
                      <Box
                        sx={{
                          width: `${Math.max(0, Math.min(100, pilier.score))}%`,
                          height: '100%',
                          borderRadius: 999,
                          background: ton,
                        }}
                      />
                    </Box>

                    <Typography sx={{ fontSize: 12.5, color: '#5C5F5E', mt: 0.6, lineHeight: 1.45 }}>
                      {pilier.detail}
                    </Typography>
                  </Box>
                );
              })}
            </Stack>
          </Card>
        </Box>
      )}

      {forces.length > 0 && (
        <Box sx={{ mt: 2.25 }}>
          <SectionTitle>Ce qui vous porte</SectionTitle>
          <Card pad={2}>
            <Stack spacing={0}>
              {forces.map((pilier, index) => (
                <Stack
                  key={pilier.cle}
                  direction="row"
                  alignItems="baseline"
                  justifyContent="space-between"
                  spacing={1.5}
                  sx={{ py: 1, borderTop: index === 0 ? 'none' : '1px solid rgba(55,75,70,0.08)' }}
                >
                  <Box sx={{ minWidth: 0 }}>
                    <Typography sx={{ fontSize: 13.5, fontWeight: 600, color: '#1A1C1B' }}>
                      {LIBELLE_PILIER[pilier.cle] ?? pilier.cle}
                    </Typography>
                    <Typography sx={{ fontSize: 12.5, color: '#5C5F5E', mt: 0.15 }}>{pilier.detail}</Typography>
                  </Box>
                  <Typography
                    sx={{
                      flexShrink: 0,
                      fontFamily: "'Ubuntu', sans-serif",
                      fontSize: 14,
                      fontWeight: 700,
                      color: TON.bon,
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {pilier.score}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          </Card>
        </Box>
      )}
    </Box>
  );
};
