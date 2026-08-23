import { useCallback, useEffect, useState, type FunctionComponent } from 'react';

import CheckRounded from '@mui/icons-material/CheckRounded';
import ChevronLeftRounded from '@mui/icons-material/ChevronLeftRounded';
import ChevronRightRounded from '@mui/icons-material/ChevronRightRounded';
import CloseRounded from '@mui/icons-material/CloseRounded';
import PersonPinCircleRounded from '@mui/icons-material/PersonPinCircleRounded';
import { Box, Stack, Typography } from '@mui/material';
import dayjs from 'dayjs';

import type { CarnetObservation, CarnetVisite, PressionAdventices } from '../../carnet.types';

interface CarnetTabContentProps {
  visites: CarnetVisite[];
}

/**
 * Le sourcil d'une observation : de quoi elle parle.
 *
 * Deux origines, un seul emplacement. Une observation tirée d'un journal ITK
 * nomme la tâche qu'elle accompagnait ; une observation libre annonce la
 * pression d'adventices constatée. Les deux répondent à la même question, et
 * ne coexistent jamais — leur donner deux traitements typographiques ferait
 * lire deux choses là où il n'y en a qu'une.
 *
 * La pastille pleine porte le degré : un agriculteur qui parcourt son carnet
 * voit d'abord la couleur, et le mot « adventices » est celui que le technicien
 * emploiera de vive voix devant la parcelle.
 */
const PRESSIONS: Record<PressionAdventices, { texte: string; teinte: string }> = {
  none: { texte: 'Adventices : aucune', teinte: '#018675' },
  low: { texte: 'Adventices : faible', teinte: '#018675' },
  moderate: { texte: 'Adventices : modérée', teinte: '#C68A1A' },
  high: { texte: 'Adventices : forte', teinte: '#C13A2C' },
};

const Sourcil: FunctionComponent<{ aPropos?: string; pression?: PressionAdventices }> = ({
  aPropos,
  pression,
}) => {
  if (!pression && !aPropos) return null;
  const p = pression ? PRESSIONS[pression] : null;

  return (
    <Stack direction="row" alignItems="center" spacing={0.75} sx={{ mb: 0.85 }}>
      {p && (
        <Box
          aria-hidden
          sx={{ width: 7, height: 7, borderRadius: '50%', background: p.teinte, flexShrink: 0 }}
        />
      )}
      <Typography
        sx={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.07em',
          textTransform: 'uppercase',
          color: p ? p.teinte : '#5C5F5E',
        }}
      >
        {p ? p.texte : aPropos}
      </Typography>
    </Stack>
  );
};

/**
 * Le visionneur plein écran.
 *
 * Fond `#0B1F1B` — le vert presque noir de la palette Kumy, pas un noir
 * générique : de la terre et des feuilles se lisent mieux sur cette teinte, et
 * on reste dans l'application plutôt que dans une visionneuse d'images.
 *
 * Le compteur et les flèches ne paraissent que s'il y a une suite. Sur une
 * photo seule, ils ne diraient rien.
 */
const Visionneuse: FunctionComponent<{
  photos: CarnetObservation['photos'];
  depart: number;
  onFermer: () => void;
}> = ({ photos, depart, onFermer }) => {
  const [rang, setRang] = useState(depart);
  const plusieurs = photos.length > 1;

  const bouger = useCallback(
    (pas: number) => setRang((r) => (r + pas + photos.length) % photos.length),
    [photos.length],
  );

  useEffect(() => {
    const auClavier = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onFermer();
      if (e.key === 'ArrowRight') bouger(1);
      if (e.key === 'ArrowLeft') bouger(-1);
    };
    window.addEventListener('keydown', auClavier);
    return () => window.removeEventListener('keydown', auClavier);
  }, [bouger, onFermer]);

  const photo = photos[rang];

  const commande = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    appearance: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#FFFFFF',
    background: 'rgba(255,255,255,0.12)',
    '&:focus-visible': { outline: '2px solid #93F4E0', outlineOffset: 2 },
  } as const;

  return (
    <Box
      role="dialog"
      aria-modal="true"
      aria-label="Photo de la parcelle"
      sx={{
        position: 'fixed',
        inset: 0,
        zIndex: 1400,
        background: '#0B1F1B',
        display: 'flex',
        flexDirection: 'column',
        pt: 'calc(env(safe-area-inset-top, 0px) + 10px)',
        pb: 'calc(env(safe-area-inset-bottom, 0px) + 14px)',
      }}
    >
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 2, flexShrink: 0 }}>
        <Typography sx={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', color: 'rgba(255,255,255,0.72)' }}>
          {plusieurs ? `${rang + 1} / ${photos.length}` : ''}
        </Typography>
        <Box component="button" type="button" aria-label="Fermer" onClick={onFermer}
          sx={{ ...commande, width: 38, height: 38, borderRadius: '50%' }}>
          <CloseRounded sx={{ fontSize: 22 }} />
        </Box>
      </Stack>

      <Box sx={{ flex: 1, minHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', px: 2 }}>
        <Box
          component="img"
          src={photo.url}
          alt={photo.legende ?? 'Photo prise sur la parcelle'}
          sx={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: '10px' }}
        />
      </Box>

      {plusieurs && (
        <Stack direction="row" alignItems="center" justifyContent="center" spacing={2.5} sx={{ pt: 1.5, flexShrink: 0 }}>
          <Box component="button" type="button" aria-label="Photo précédente" onClick={() => bouger(-1)}
            sx={{ ...commande, width: 46, height: 46, borderRadius: '50%' }}>
            <ChevronLeftRounded sx={{ fontSize: 26 }} />
          </Box>
          <Box component="button" type="button" aria-label="Photo suivante" onClick={() => bouger(1)}
            sx={{ ...commande, width: 46, height: 46, borderRadius: '50%' }}>
            <ChevronRightRounded sx={{ fontSize: 26 }} />
          </Box>
        </Stack>
      )}
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
const Photos: FunctionComponent<{
  photos: CarnetObservation['photos'];
  onOuvrir: (rang: number) => void;
}> = ({ photos, onOuvrir }) => {
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
      {photos.map((photo, rang) => (
        <Box
          key={photo.url}
          component="button"
          type="button"
          aria-label={`Agrandir la photo ${rang + 1}`}
          onClick={() => onOuvrir(rang)}
          sx={{
            flexShrink: 0,
            p: 0,
            appearance: 'none',
            border: '1px solid rgba(55,75,70,0.10)',
            borderRadius: '14px',
            overflow: 'hidden',
            cursor: 'pointer',
            background: 'rgba(55,75,70,0.08)',
            lineHeight: 0,
            transition: 'transform 0.16s ease',
            '&:active': { transform: 'scale(0.97)' },
            '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
            '&:focus-visible': { outline: '2px solid #016557', outlineOffset: 2 },
          }}
        >
          <Box
            component="img"
            src={photo.url}
            alt={photo.legende ?? 'Photo prise sur la parcelle'}
            loading="lazy"
            sx={{ width: 112, height: 112, objectFit: 'cover', display: 'block' }}
          />
        </Box>
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
  // La photo regardée, et le rang d'où l'on est parti. `null` = personne ne
  // regarde. L'état vit ici plutôt que dans chaque observation : un seul
  // visionneur peut être ouvert, et c'est la page qui le sait.
  const [visionnee, setVisionnee] = useState<{
    photos: CarnetObservation['photos'];
    depart: number;
  } | null>(null);

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
                    <Box
                      key={observation.id}
                      sx={{
                        // Un filet sépare deux constats du même passage : sans
                        // lui, deux notes courtes se lisent comme un paragraphe.
                        mt: rang === 0 ? 0 : 1.6,
                        pt: rang === 0 ? 0 : 1.6,
                        borderTop: rang === 0 ? 'none' : '1px solid rgba(55,75,70,0.08)',
                      }}
                    >
                      <Sourcil aPropos={observation.aPropos} pression={observation.pression} />
                      <Photos
                        photos={observation.photos}
                        onOuvrir={(depart) => setVisionnee({ photos: observation.photos, depart })}
                      />
                      {observation.texte && (
                        <Typography
                          sx={{
                            fontSize: 13.5,
                            color: '#1A1C1B',
                            lineHeight: 1.55,
                            mt: observation.photos.length > 0 ? 1.1 : 0,
                          }}
                        >
                          {observation.texte}
                        </Typography>
                      )}
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

      {visionnee && (
        <Visionneuse
          photos={visionnee.photos}
          depart={visionnee.depart}
          onFermer={() => setVisionnee(null)}
        />
      )}
    </Box>
  );
};
