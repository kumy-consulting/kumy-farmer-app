import type { FunctionComponent } from 'react';

import { Box, Typography } from '@mui/material';

import type { ItkStage } from '../../parcelle.types';
import { stageStatusColor } from '../itkVisuals';

interface ItkStageTimelineProps {
  stages: ItkStage[];
  selectedStageCode?: string;
  onSelectStage: (stageCode: string) => void;
}

const NODE = 30;
const NODE_SEL = 38;
const ROW_H = 52;

/** Frise horizontale des stades ITK (scroll horizontal, tap = sélection). */
export const ItkStageTimeline: FunctionComponent<ItkStageTimelineProps> = ({
  stages,
  selectedStageCode,
  onSelectStage,
}) => {
  if (stages.length === 0) return null;

  return (
    <Box
      sx={{
        position: 'relative',
        background: 'rgba(1,134,117,0.03)',
        borderTop: '1px solid rgba(55,75,70,0.10)',
        borderBottom: '1px solid rgba(55,75,70,0.10)',
        overflowX: 'auto',
        overflowY: 'visible',
        py: 1.5,
        px: 1.5,
        scrollbarWidth: 'none',
        '&::-webkit-scrollbar': { display: 'none' },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', width: 'max-content', minWidth: '100%' }}>
        {stages.map((s, idx) => {
          const color = stageStatusColor(s.status);
          const selected = s.stageCode === selectedStageCode;
          const completed = s.status === 'completed';
          const active = s.status === 'inProgress';
          const delayed = s.status === 'delayed';
          const filled = completed || active || delayed;
          const accent = filled ? color : '#018675';
          const isFirst = idx === 0;
          const isLast = idx === stages.length - 1;
          const prev = idx > 0 ? stages[idx - 1] : undefined;
          const leftActive =
            prev?.status === 'completed' || prev?.status === 'inProgress' || prev?.status === 'delayed';
          const rightActive = filled;
          const segColor = (on: boolean) => (on ? '#018675' : 'rgba(55,75,70,0.18)');

          return (
            <Box
              key={s.stageCode}
              onClick={() => onSelectStage(s.stageCode)}
              sx={{
                flex: '0 0 auto',
                width: 118,
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
                        height: 2,
                        background: segColor(leftActive),
                      },
                  '&::after': isLast
                    ? undefined
                    : {
                        content: '""',
                        position: 'absolute',
                        top: ROW_H / 2 - 1,
                        right: 0,
                        width: '50%',
                        height: 2,
                        background: segColor(rightActive),
                      },
                }}
              >
                <Box
                  sx={{
                    position: 'relative',
                    width: selected ? NODE_SEL : NODE,
                    height: selected ? NODE_SEL : NODE,
                    borderRadius: '50%',
                    background: filled ? color : selected ? 'rgba(1,134,117,0.10)' : '#FFFFFF',
                    border: `2px solid ${selected && !filled ? accent : color}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: filled ? '#FFFFFF' : selected ? accent : '#5C5F5E',
                    fontFamily: "'Ubuntu', sans-serif",
                    fontSize: selected ? 14 : 12.5,
                    fontWeight: selected ? 800 : 700,
                    transition: 'all 0.22s ease',
                    boxShadow: selected
                      ? `0 0 0 3px #FFFFFF, 0 0 0 5px ${accent}80, 0 6px 16px ${accent}4D`
                      : filled
                        ? `0 2px 4px ${color}40`
                        : 'none',
                    zIndex: 1,
                  }}
                >
                  {completed ? '✓' : active ? (
                    <Box
                      sx={{
                        width: 9,
                        height: 9,
                        borderRadius: '50%',
                        background: '#FFFFFF',
                        animation: 'itkPulse 1.6s ease-in-out infinite',
                        '@keyframes itkPulse': {
                          '0%, 100%': { opacity: 1, transform: 'scale(1)' },
                          '50%': { opacity: 0.5, transform: 'scale(0.85)' },
                        },
                      }}
                    />
                  ) : (
                    idx + 1
                  )}
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
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  fontWeight: selected ? 700 : 500,
                  mt: 0.4,
                }}
              >
                J+{s.dayStart}–{s.dayEnd}
              </Typography>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};
