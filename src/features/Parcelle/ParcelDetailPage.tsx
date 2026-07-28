import { useState, type FunctionComponent, type ReactNode } from 'react';

import ChevronLeftRounded from '@mui/icons-material/ChevronLeftRounded';
import ReplayRounded from '@mui/icons-material/ReplayRounded';
import { Box, CircularProgress, IconButton, Stack, Typography } from '@mui/material';
import { keyframes } from '@mui/material/styles';
import { useNavigate, useParams } from 'react-router-dom';

import { NAV_HEIGHT } from '@/shared/components/BottomNav';
import { DraggableBottomSheet } from '@/shared/components/DraggableBottomSheet';

import { ConseilsTabContent } from './components/ConseilsTab/ConseilsTabContent';
import { ItkTabContent } from './components/ItkTab/ItkTabContent';
import { OverviewTabContent } from './components/OverviewTab/OverviewTabContent';
import { ParcelKpiRow } from './components/ParcelKpiRow';
import { ParcelMapHero } from './components/ParcelMapHero';
import { useParcelDetail } from './useParcelDetail';

const HEADER_OVERLAY_PX = 96;
const SHEET_SNAPS: (number | string)[] = [120, '45vh', '85vh'];
const CONTENT_BOTTOM_PADDING = NAV_HEIGHT + 40;
const TABS = ["Vue d'ensemble", 'Calendrier', 'Conseils'];

/** Fondu doux au changement d'onglet. */
const tabIn = keyframes`
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
`;

const BackButton: FunctionComponent<{ onClick: () => void }> = ({ onClick }) => (
  <IconButton
    onClick={onClick}
    aria-label="Retour"
    sx={{
      width: 38,
      height: 38,
      flexShrink: 0,
      background: 'rgba(0,0,0,0.28)',
      backdropFilter: 'blur(14px)',
      WebkitBackdropFilter: 'blur(14px)',
      border: '1px solid rgba(255,255,255,0.18)',
      '&:hover': { background: 'rgba(0,0,0,0.38)' },
    }}
  >
    <ChevronLeftRounded sx={{ color: '#FFFFFF' }} />
  </IconButton>
);

const FullScreen: FunctionComponent<{ children: ReactNode }> = ({ children }) => (
  <Box
    sx={{
      position: 'fixed',
      inset: 0,
      overflow: 'hidden',
      background: 'linear-gradient(150deg, #0A6656 0%, #04382F 100%)',
    }}
  >
    {children}
  </Box>
);

/** En-tête superposé : retour + fil d'Ariane domaine + nom parcelle + culture, scrim dégradé. */
const HeaderOverlay: FunctionComponent<{ crumb: string; title: string; subtitle?: string; onBack: () => void }> = ({
  crumb,
  title,
  subtitle,
  onBack,
}) => (
  <Box
    sx={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 1000,
      padding: 'calc(env(safe-area-inset-top, 0px) + 14px) 16px 32px',
      background:
        'linear-gradient(180deg, rgba(0,0,0,0.60) 0%, rgba(0,0,0,0.34) 42%, rgba(0,0,0,0.12) 72%, transparent 100%)',
    }}
  >
    <Stack direction="row" alignItems="flex-start" spacing="14px">
      <BackButton onClick={onBack} />
      <Box sx={{ minWidth: 0, pt: '2px' }}>
        {crumb && (
          <Typography
            sx={{
              fontFamily: "'Ubuntu', sans-serif",
              fontSize: '10.5px',
              fontWeight: 700,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.78)',
              textShadow: '0 1px 3px rgba(0,0,0,0.4)',
              lineHeight: 1.2,
            }}
            noWrap
          >
            {crumb}
          </Typography>
        )}
        <Typography
          sx={{
            fontFamily: "'Ubuntu', sans-serif",
            fontSize: '20px',
            fontWeight: 700,
            color: '#FFFFFF',
            lineHeight: '26px',
            letterSpacing: '0.01em',
            textShadow: '0 1px 8px rgba(0,0,0,0.5)',
          }}
          noWrap
        >
          {title}
        </Typography>
        {subtitle && (
          <Typography
            sx={{
              fontFamily: "'Ubuntu', sans-serif",
              fontSize: '12.5px',
              fontWeight: 500,
              color: 'rgba(255,255,255,0.92)',
              lineHeight: '16px',
              textShadow: '0 1px 3px rgba(0,0,0,0.4)',
              mt: '3px',
            }}
            noWrap
          >
            {subtitle}
          </Typography>
        )}
      </Box>
    </Stack>
  </Box>
);

export const ParcelDetailPage: FunctionComponent = () => {
  const { id: farmId, parcelId } = useParams<{ id: string; parcelId: string }>();
  const navigate = useNavigate();
  const { detail, isLoading, error, reload } = useParcelDetail(farmId, parcelId);
  const [activeTab, setActiveTab] = useState(0);

  const backToDomaine = () => navigate(`/domaines/${farmId ?? ''}`);

  if (isLoading || (!detail && !error)) {
    return (
      <FullScreen>
        <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CircularProgress sx={{ color: '#93F4E0' }} />
        </Box>
        <HeaderOverlay crumb="" title="" onBack={backToDomaine} />
      </FullScreen>
    );
  }

  if (error || !detail) {
    return (
      <FullScreen>
        <HeaderOverlay crumb="" title="" onBack={backToDomaine} />
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            px: 3,
          }}
        >
          <Typography sx={{ fontFamily: "'Ubuntu', sans-serif", fontSize: 18, fontWeight: 700, color: '#FFFFFF' }}>
            Chargement impossible
          </Typography>
          <Typography sx={{ fontSize: 14, color: 'rgba(255,255,255,0.85)', mt: 1, maxWidth: 300 }}>
            {error ?? 'Parcelle introuvable'}
          </Typography>
          <Stack
            component="button"
            direction="row"
            alignItems="center"
            spacing={0.75}
            onClick={reload}
            sx={{
              all: 'unset',
              cursor: 'pointer',
              mt: 2,
              px: 2.5,
              py: 1,
              borderRadius: 999,
              background: '#FFFFFF',
              color: '#016557',
              '& svg': { fontSize: 18 },
            }}
          >
            <ReplayRounded />
            <Typography sx={{ fontFamily: "'Ubuntu', sans-serif", fontSize: 14, fontWeight: 700 }}>Réessayer</Typography>
          </Stack>
        </Box>
      </FullScreen>
    );
  }

  const bottomReservedPx = typeof window !== 'undefined' ? window.innerHeight * 0.45 : 360;

  return (
    <FullScreen>
      <Box sx={{ position: 'absolute', inset: 0 }}>
        <ParcelMapHero
          coordinates={detail.coordinates}
          tileUrl={detail.tileUrl}
          tileBounds={detail.tileBounds}
          topReservedPx={HEADER_OVERLAY_PX}
          bottomReservedPx={bottomReservedPx}
        />
      </Box>

      <HeaderOverlay crumb="Parcelle" title={detail.parcelName} subtitle={detail.cropLabel} onBack={backToDomaine} />

      <DraggableBottomSheet snapPoints={SHEET_SNAPS} initialSnap={1} contentBottomPadding={CONTENT_BOTTOM_PADDING} zIndex={900}>
        <ParcelKpiRow
          ndvi={detail.ndvi}
          area={detail.area}
          daysAfterSowing={detail.daysAfterSowing}
          yieldEstimate={detail.yieldEstimate}
        />

        {/* Onglets */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '7px 16px',
            background: '#FFFFFF',
            borderBottom: '1px solid rgba(55,75,70,0.12)',
            overflowX: 'auto',
            scrollbarWidth: 'none',
            '&::-webkit-scrollbar': { display: 'none' },
          }}
        >
          {TABS.map((label, i) => (
            <Box
              key={label}
              component="button"
              onClick={() => setActiveTab(i)}
              sx={{
                appearance: 'none',
                cursor: 'pointer',
                fontFamily: "'Ubuntu', sans-serif",
                fontSize: '12.5px',
                fontWeight: activeTab === i ? 700 : 500,
                color: activeTab === i ? '#006B5D' : '#5C5F5E',
                lineHeight: 1,
                padding: '7px 14px',
                borderRadius: 999,
                whiteSpace: 'nowrap',
                letterSpacing: '0.01em',
                background: activeTab === i ? 'rgba(1,134,117,0.12)' : 'transparent',
                border: activeTab === i ? '1px solid rgba(1,134,117,0.24)' : '1px solid transparent',
                transition: 'background 0.25s ease, color 0.25s ease, border-color 0.25s ease',
              }}
            >
              {label}
            </Box>
          ))}
        </Box>

        <Box key={activeTab} sx={{ animation: `${tabIn} 0.28s ease both` }}>
          {activeTab === 0 ? (
            <OverviewTabContent detail={detail} />
          ) : activeTab === 1 ? (
            <ItkTabContent itk={detail.itk} />
          ) : (
            <ConseilsTabContent itk={detail.itk} ndvi={detail.ndvi} indicators={detail.indicators} />
          )}
        </Box>
      </DraggableBottomSheet>
    </FullScreen>
  );
};
