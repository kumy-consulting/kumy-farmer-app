import { useCallback, useEffect, useLayoutEffect, useRef, useState, type FunctionComponent } from 'react';

import ChevronLeftRounded from '@mui/icons-material/ChevronLeftRounded';
import ChevronRightRounded from '@mui/icons-material/ChevronRightRounded';
import { Box, Typography } from '@mui/material';

import type { ItkStage } from '../../parcelle.types';
import { formatPeriodeStade } from '../itkPeriode';
import { statutEffectif } from '../itkStadeEnCours';
import { stageStatusColor } from '../itkVisuals';

interface ItkStageTimelineProps {
  stages: ItkStage[];
  selectedStageCode?: string;
  /** Stade traversé aujourd'hui, calculé par `ItkTabContent`. */
  codeEnCours?: string;
  onSelectStage: (stageCode: string) => void;
}

const NODE = 30;
const NODE_SEL = 38;
const ROW_H = 52;
const CARTE = 118;
const PAD_Y = 12;

/** Frise horizontale des stades ITK (défilement, tap = sélection). */
export const ItkStageTimeline: FunctionComponent<ItkStageTimelineProps> = ({
  stages,
  selectedStageCode,
  codeEnCours,
  onSelectStage,
}) => {
  const pisteRef = useRef<HTMLDivElement>(null);
  const cartesRef = useRef(new Map<string, HTMLDivElement>());
  const [bords, setBords] = useState({ debut: true, fin: false });

  const majBords = useCallback(() => {
    const piste = pisteRef.current;
    if (!piste) return;
    const reste = piste.scrollWidth - piste.clientWidth;
    setBords({ debut: piste.scrollLeft <= 1, fin: piste.scrollLeft >= reste - 1 });
  }, []);

  /**
   * Centre le stade courant à l'arrivée. Sans cela il était bien sélectionné,
   * mais hors écran dès qu'il dépassait le troisième : on ouvrait le calendrier
   * sur des phases déjà terminées.
   *
   * On agit sur `scrollLeft` de la piste plutôt que par `scrollIntoView`, qui
   * déplacerait aussi la page verticalement. Sans animation : un défilement au
   * premier rendu se lit comme un bug, pas comme une intention.
   */
  useLayoutEffect(() => {
    const piste = pisteRef.current;
    const cible = codeEnCours ?? selectedStageCode;
    const carte = cible ? cartesRef.current.get(cible) : undefined;
    if (!piste || !carte) return;
    piste.scrollLeft = carte.offsetLeft - (piste.clientWidth - carte.offsetWidth) / 2;
    majBords();
    // Au montage uniquement : recentrer à chaque sélection arracherait la frise
    // sous le doigt de celui qui vient de taper un stade.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    majBords();
  }, [majBords, stages.length]);

  const glisser = (sens: -1 | 1) => {
    pisteRef.current?.scrollBy({ left: sens * CARTE * 2, behavior: 'smooth' });
  };

  if (stages.length === 0) return null;

  const Chevron: FunctionComponent<{ cote: 'gauche' | 'droite'; desactive: boolean }> = ({ cote, desactive }) => (
    <Box
      component="button"
      type="button"
      aria-label={cote === 'gauche' ? 'Stades précédents' : 'Stades suivants'}
      disabled={desactive}
      onClick={() => glisser(cote === 'gauche' ? -1 : 1)}
      sx={{
        position: 'absolute',
        [cote === 'gauche' ? 'left' : 'right']: 6,
        top: PAD_Y + ROW_H / 2,
        transform: 'translateY(-50%)',
        zIndex: 2,
        width: 28,
        height: 28,
        p: 0,
        borderRadius: '50%',
        border: '1px solid rgba(55,75,70,0.14)',
        background: '#FFFFFF',
        boxShadow: '0 2px 6px rgba(26,28,27,0.10)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        opacity: desactive ? 0 : 1,
        pointerEvents: desactive ? 'none' : 'auto',
        transition: 'opacity 0.18s ease',
        '& svg': { fontSize: 19, color: '#374B46' },
        '&:active': { transform: 'translateY(-50%) scale(0.92)' },
        '&:focus-visible': { outline: '2px solid #018675', outlineOffset: 2 },
      }}
    >
      {cote === 'gauche' ? <ChevronLeftRounded /> : <ChevronRightRounded />}
    </Box>
  );

  return (
    <Box
      sx={{
        position: 'relative',
        background: 'rgba(1,134,117,0.03)',
        borderTop: '1px solid rgba(55,75,70,0.10)',
        borderBottom: '1px solid rgba(55,75,70,0.10)',
      }}
    >
      <Chevron cote="gauche" desactive={bords.debut} />
      <Chevron cote="droite" desactive={bords.fin} />

      <Box
        ref={pisteRef}
        onScroll={majBords}
        sx={{
          overflowX: 'auto',
          overflowY: 'visible',
          py: `${PAD_Y}px`,
          px: 1.5,
          scrollbarWidth: 'none',
          '&::-webkit-scrollbar': { display: 'none' },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'flex-start', width: 'max-content', minWidth: '100%' }}>
          {stages.map((s, idx) => {
            // Le statut effectif, et non le champ brut : sans cela le stade en
            // cours gardait la couleur grise de l'`upcoming` renvoyé par l'API.
            const statut = statutEffectif(s, codeEnCours);
            const color = stageStatusColor(statut);
            const selected = s.stageCode === selectedStageCode;
            const completed = statut === 'completed';
            const active = statut === 'inProgress';
            const delayed = statut === 'delayed';
            // Le stade en cours n'est plus un disque plein : c'est un double
            // cercle, fond blanc et anneau, qui laisse lire son numéro.
            const plein = completed || delayed;
            const accent = plein || active ? color : '#018675';
            const isFirst = idx === 0;
            const isLast = idx === stages.length - 1;
            const prev = idx > 0 ? stages[idx - 1] : undefined;

            /**
             * Une liaison appartient au stade qu'elle QUITTE, et en porte la
             * couleur : rouge après un stade en retard, verte après un stade
             * terminé. Le trajet non encore parcouru reste en pointillé gris —
             * il n'a pas eu lieu, il ne doit pas se donner l'air d'un acquis.
             */
            const liaison = (depuis?: ItkStage) => {
              const st = depuis ? statutEffectif(depuis, codeEnCours) : undefined;
              const franchi = st === 'completed' || st === 'delayed';
              return franchi
                ? { background: stageStatusColor(st), height: 2, borderTop: 'none' }
                : { background: 'transparent', height: 0, borderTop: '2px dashed rgba(55,75,70,0.28)' };
            };

            const anneaux = [
              active ? `0 0 0 3px #FFFFFF, 0 0 0 5px ${color}` : '',
              selected && !active ? `0 0 0 3px #FFFFFF, 0 0 0 5px ${accent}80` : '',
              selected ? `0 6px 16px ${accent}4D` : plein ? `0 2px 4px ${color}40` : '',
            ].filter(Boolean);

            return (
              <Box
                key={s.stageCode}
                ref={(el: HTMLDivElement | null) => {
                  if (el) cartesRef.current.set(s.stageCode, el);
                  else cartesRef.current.delete(s.stageCode);
                }}
                onClick={() => onSelectStage(s.stageCode)}
                sx={{
                  flex: '0 0 auto',
                  width: CARTE,
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  userSelect: 'none',
                  transition: 'transform 0.2s ease',
                  '&:active': { transform: 'scale(0.97)' },
                }}
              >
                <Box
                  sx={{
                    position: 'relative',
                    height: ROW_H,
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    '&::before': isFirst
                      ? undefined
                      : {
                          content: '""',
                          position: 'absolute',
                          top: ROW_H / 2 - 1,
                          left: 0,
                          width: '50%',
                          ...liaison(prev),
                        },
                    '&::after': isLast
                      ? undefined
                      : {
                          content: '""',
                          position: 'absolute',
                          top: ROW_H / 2 - 1,
                          right: 0,
                          width: '50%',
                          ...liaison(s),
                        },
                  }}
                >
                  <Box
                    sx={{
                      position: 'relative',
                      width: selected ? NODE_SEL : NODE,
                      height: selected ? NODE_SEL : NODE,
                      borderRadius: '50%',
                      background: plein ? color : '#FFFFFF',
                      border: `${active ? 2.5 : 2}px solid ${plein || active ? color : selected ? accent : color}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: plein ? '#FFFFFF' : active ? color : selected ? accent : '#5C5F5E',
                      fontFamily: "'Ubuntu', sans-serif",
                      fontSize: selected ? 14 : 12.5,
                      fontWeight: selected || active ? 800 : 700,
                      transition: 'all 0.22s ease',
                      boxShadow: anneaux.join(', '),
                      zIndex: 1,
                    }}
                  >
                    {completed ? '✓' : idx + 1}
                    {s.critical && (
                      <Box
                        sx={{
                          position: 'absolute',
                          top: -3,
                          right: -3,
                          width: 10,
                          height: 10,
                          borderRadius: '50%',
                          background: '#F59E0B',
                          border: '2px solid #FFFFFF',
                        }}
                      />
                    )}
                  </Box>
                </Box>

                <Typography
                  title={s.stageName}
                  sx={{
                    fontFamily: "'Ubuntu', sans-serif",
                    fontSize: 11,
                    fontWeight: selected ? 800 : 600,
                    color: selected ? '#1A1C1B' : '#5C5F5E',
                    textAlign: 'center',
                    lineHeight: 1.25,
                    mt: 0.75,
                    px: 0.5,
                    width: '100%',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {s.stageName}
                </Typography>
                <Typography
                  sx={{
                    fontFamily: "'Ubuntu', sans-serif",
                    fontSize: 9.5,
                    color: selected ? '#016557' : '#8F9291',
                    textAlign: 'center',
                    letterSpacing: '0.03em',
                    fontWeight: selected ? 700 : 500,
                    mt: 0.4,
                    px: 0.25,
                    width: '100%',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {formatPeriodeStade(s.expectedStart, s.expectedEnd)}
                </Typography>
              </Box>
            );
          })}
        </Box>
      </Box>
    </Box>
  );
};
