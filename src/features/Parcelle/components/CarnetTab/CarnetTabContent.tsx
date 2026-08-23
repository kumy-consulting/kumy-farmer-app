import type { FunctionComponent } from 'react';

import CheckRounded from '@mui/icons-material/CheckRounded';
import PersonPinCircleRounded from '@mui/icons-material/PersonPinCircleRounded';
import { Box, Stack, Typography } from '@mui/material';
import dayjs from 'dayjs';

import type { CarnetObservation, CarnetVisite, PressionAdventices } from '../../carnet.types';

interface CarnetTabContentProps {
  visites: CarnetVisite[];
}

/**
 * Pression d'adventices constatée.
 *
 * Le mot du technicien est « adventices » ; on le garde, parce que c'est celui
 * qu'il emploiera de vive voix devant la parcelle. La teinte porte le degré —
 * un agriculteur qui parcourt son carnet voit d'abord la couleur.
 */
const PRESSIONS: Record<PressionAdventices, { texte: string; fond: string; encre: string }> = {
  none: { texte: 'Adventices : aucune', fond: 'rgba(1,134,117,0.12)', encre: '#016557' },
  low: { texte: 'Adventices : faible', fond: 'rgba(1,134,117,0.12)', encre: '#016557' },
  moderate: { texte: 'Adventices : modérée', fond: 'rgba(198,138,26,0.16)', encre: '#8C5000' },
  high: { texte: 'Adventices : forte', fond: 'rgba(193,58,44,0.14)', encre: '#A3271B' },
};

const Pression: FunctionComponent<{ niveau?: PressionAdventices }> = ({ niveau }) => {
  if (!niveau) return null;
  const { texte, fond, encre } = PRESSIONS[niveau];
  return (
    <Box
      component="span"
      sx={{
        display: 'inline-block',
        mt: 0.75,
        px: 1,
        py: 0.4,
        borderRadius: 999,
        background: fond,
        fontSize: 11,
        fontWeight: 700,
        color: encre,
      }}
    >
      {texte}
    </Box>
  );
};

/**
 * Photos d'une observation.
 *
 * Bande défilante et non grille : sur un téléphone, une grille de vignettes
 * rétrécit chaque photo jusqu'à ce qu'on n'y distingue plus la feuille du sol.
 * Une bande garde des vignettes lisibles et laisse la place au texte, qui reste
 * la partie qui se lit.
 */
const Photos: FunctionComponent<{ photos: CarnetObservation['photos'] }> = ({ photos }) => {
  if (photos.length === 0) return null;
  return (
    <Stack
      direction="row"
      spacing={1}
      sx={{
        mt: 1.25,
        overflowX: 'auto',
        pb: 0.5,
        scrollbarWidth: 'none',
        '&::-webkit-scrollbar': { display: 'none' },
        // La bande déborde de la carte jusqu'au bord, pour qu'on voie qu'il y a
        // une suite à faire défiler.
        mx: -1.75,
        px: 1.75,
      }}
    >
      {photos.map((photo) => (
        <Box
          key={photo.url}
          component="img"
          src={photo.url}
          alt={photo.legende ?? 'Photo prise sur la parcelle'}
          loading="lazy"
          sx={{
            flexShrink: 0,
            width: 112,
            height: 112,
            objectFit: 'cover',
            borderRadius: '14px',
            background: 'rgba(55,75,70,0.08)',
            border: '1px solid rgba(55,75,70,0.10)',
          }}
        />
      ))}
    </Stack>
  );
};

/**
 * Le carnet du technicien, parcelle par parcelle.
 *
 * **Le passage est l'unité, pas la donnée.** L'agriculteur ne se souvient pas
 * d'« une observation » et d'« une consigne » séparément : il se souvient du
 * jour où le technicien est venu. Le carnet est donc un journal de visites, et
 * chaque entrée raconte la même chose dans le même ordre — ce qu'il a vu, puis
 * ce qu'il a demandé. Deux listes à plat auraient obligé à recoudre soi-même.
 *
 * **Les photos passent avant le texte.** Sur une parcelle, l'image est la preuve
 * : elle montre le foyer de ravageurs ou la couleur des feuilles mieux que trois
 * lignes. Elle porte aussi une part du sens pour qui lit peu — et sur ce public,
 * ce n'est pas un détail de confort.
 *
 * **Le rail vertical à gauche** relie les passages entre eux : c'est le fil du
 * temps sur la parcelle, pas une décoration. Il s'arrête au dernier passage,
 * parce que la suite n'est pas écrite.
 */
export const CarnetTabContent: FunctionComponent<CarnetTabContentProps> = ({ visites }) => {
  if (visites.length === 0) {
    return (
      <Box sx={{ px: 2, py: 3 }}>
        <Box
          sx={{
            p: '18px 16px',
            borderRadius: '18px',
            background: 'rgba(1,134,117,0.05)',
            border: '1px dashed rgba(1,134,117,0.22)',
          }}
        >
          <Typography sx={{ fontFamily: "'Ubuntu', sans-serif", fontSize: 14, fontWeight: 600, color: '#1A1C1B' }}>
            Aucun passage enregistré
          </Typography>
          <Typography sx={{ fontSize: 13, color: '#5C5F5E', mt: 0.5, lineHeight: 1.5 }}>
            Les photos et les consignes laissées par votre technicien sur cette parcelle apparaîtront ici après sa
            prochaine visite.
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ px: 2, py: 2.5 }}>
      <Stack spacing={0}>
        {visites.map((visite, index) => {
          const dernier = index === visites.length - 1;
          return (
            <Stack key={visite.id} direction="row" spacing={1.5} sx={{ position: 'relative' }}>
              {/* Rail du temps : la pastille marque le passage, le trait relie au
                  suivant et s'interrompt après le dernier. */}
              <Stack alignItems="center" sx={{ flexShrink: 0, width: 32 }}>
                <Box
                  aria-hidden
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'rgba(58,90,140,0.12)',
                    '& svg': { fontSize: 18, color: '#3A5A8C' },
                  }}
                >
                  <PersonPinCircleRounded />
                </Box>
                {!dernier && (
                  <Box aria-hidden sx={{ flex: 1, width: '2px', background: 'rgba(55,75,70,0.12)', mt: 0.5 }} />
                )}
              </Stack>

              <Box sx={{ flex: 1, minWidth: 0, pb: dernier ? 0 : 2.5 }}>
                <Typography
                  sx={{
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: '#3A5A8C',
                  }}
                >
                  {dayjs(visite.date).format('D MMMM')} · {visite.auteur}
                </Typography>

                <Box
                  sx={{
                    mt: 0.85,
                    p: 1.75,
                    borderRadius: '18px',
                    background: '#FFFFFF',
                    border: '1px solid rgba(55,75,70,0.07)',
                    boxShadow: '0 6px 18px rgba(1,134,117,0.06)',
                    overflow: 'hidden',
                  }}
                >
                  {visite.observations.map((observation, rang) => (
                    <Box key={observation.id} sx={{ mt: rang === 0 ? 0 : 1.75 }}>
                      {observation.aPropos && (
                        <Typography sx={{ fontSize: 11.5, fontWeight: 700, color: '#5C5F5E', mb: 0.35 }}>
                          {observation.aPropos}
                        </Typography>
                      )}
                      {observation.texte && (
                        <Typography sx={{ fontSize: 13.5, color: '#1A1C1B', lineHeight: 1.5 }}>
                          {observation.texte}
                        </Typography>
                      )}
                      <Pression niveau={observation.pression} />
                      <Photos photos={observation.photos} />
                    </Box>
                  ))}

                  {visite.consignes.length > 0 && (
                    <Box
                      sx={{
                        mt: visite.observations.length > 0 ? 1.75 : 0,
                        pt: visite.observations.length > 0 ? 1.5 : 0,
                        borderTop: visite.observations.length > 0 ? '1px solid rgba(55,75,70,0.08)' : 'none',
                      }}
                    >
                      <Typography
                        sx={{
                          fontSize: 11,
                          fontWeight: 700,
                          letterSpacing: '0.08em',
                          textTransform: 'uppercase',
                          color: '#5C5F5E',
                          mb: 0.85,
                        }}
                      >
                        Ce qu’il a demandé
                      </Typography>
                      <Stack spacing={0.85}>
                        {visite.consignes.map((consigne) => (
                          <Stack key={consigne.id} direction="row" alignItems="flex-start" spacing={1}>
                            <Box
                              aria-hidden
                              sx={{
                                flexShrink: 0,
                                mt: '1px',
                                width: 17,
                                height: 17,
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: consigne.faite ? 'rgba(1,134,117,0.14)' : 'transparent',
                                border: consigne.faite ? 'none' : '1.5px solid rgba(55,75,70,0.28)',
                                '& svg': { fontSize: 12, color: '#016557' },
                              }}
                            >
                              {consigne.faite && <CheckRounded />}
                            </Box>
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Typography
                                sx={{
                                  fontSize: 13.5,
                                  fontWeight: 500,
                                  lineHeight: 1.35,
                                  color: consigne.faite ? '#5C5F5E' : '#1A1C1B',
                                  textDecoration: consigne.faite ? 'line-through' : 'none',
                                }}
                              >
                                {consigne.titre}
                              </Typography>
                              <Typography
                                sx={{
                                  fontSize: 12,
                                  fontWeight: consigne.enRetard ? 700 : 500,
                                  color: consigne.enRetard ? '#BA1A1A' : '#8F9291',
                                  mt: 0.1,
                                }}
                              >
                                {consigne.echeance}
                              </Typography>
                            </Box>
                          </Stack>
                        ))}
                      </Stack>
                    </Box>
                  )}
                </Box>
              </Box>
            </Stack>
          );
        })}
      </Stack>
    </Box>
  );
};
