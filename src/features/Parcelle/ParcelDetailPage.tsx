import { useState, type FunctionComponent, type ReactNode } from 'react';

import ReplayRounded from '@mui/icons-material/ReplayRounded';
import { Box, CircularProgress, Stack, Typography } from '@mui/material';
import { keyframes } from '@mui/material/styles';
import { useNavigate, useParams } from 'react-router-dom';

import { BackButton } from '@/shared/components/BackButton';
import { NAV_HEIGHT } from '@/shared/components/BottomNav';
import { DraggableBottomSheet } from '@/shared/components/DraggableBottomSheet';

import { CarnetTabContent } from './components/CarnetTab/CarnetTabContent';
import { ConseilsTabContent } from './components/ConseilsTab/ConseilsTabContent';
import { ItkTabContent } from './components/ItkTab/ItkTabContent';
import { OverviewTabContent } from './components/OverviewTab/OverviewTabContent';
import { ParcelKpiRow } from './components/ParcelKpiRow';
import { ParcelMapHero } from './components/ParcelMapHero';
import { useParcelDetail } from './useParcelDetail';

const HEADER_OVERLAY_PX = 96;
const SHEET_SNAPS: (number | string)[] = [120, '45vh', '85vh'];
const CONTENT_BOTTOM_PADDING = NAV_HEIGHT + 40;
// « Carnet » et non « Suivi » ou « Historique » : le carnet de terrain est un
// objet que l'encadrement agricole tient réellement, et le mot dit ce qu'on y
// trouve — des pages datées, écrites par quelqu'un.
const TABS = ["Vue d'ensemble", 'Calendrier', 'Conseils', 'Carnet'];

/** Fondu doux au changement d'onglet. */
const tabIn = keyframes`
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
`;

/**
 * Retour des états transitoires : même bouton que sur l'overlay carte, à la
 * même place. La pastille opaque tient aussi bien sur la surface claire que
 * sur l'image satellite — il n'y a plus deux variantes à maintenir.
 */
const PlainBack: FunctionComponent<{ onClick: () => void }> = ({ onClick }) => (
  <Box
    sx={{
      position: 'absolute',
      top: 'calc(env(safe-area-inset-top, 0px) + 14px)',
      left: 16,
      zIndex: 1000,
    }}
  >
    <BackButton onClick={onClick} />
  </Box>
);

const FullScreen: FunctionComponent<{ children: ReactNode }> = ({ children }) => (
  <Box
    sx={{
      position: 'fixed',
      inset: 0,
      overflow: 'hidden',
      // La surface de l'app, pas une couleur à elle : une transition doit être
      // invisible. L'ancien dégradé vert sombre peignait tout l'écran le temps
      // du chargement, si bien que naviguer depuis l'accueil clair coupait vers
      // un autre monde puis revenait. En état chargé la carte couvre ce fond —
      // il ne se voit que pendant la transition, où il ne doit rien dire.
      backgroundColor: 'background.default',
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
          <CircularProgress sx={{ color: '#018675' }} />
        </Box>
        <PlainBack onClick={backToDomaine} />
      </FullScreen>
    );
  }

  if (error || !detail) {
    return (
      <FullScreen>
        <PlainBack onClick={backToDomaine} />
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
          <Typography sx={{ fontFamily: "'Ubuntu', sans-serif", fontSize: 18, fontWeight: 700, color: '#1A1C1B' }}>
            Chargement impossible
          </Typography>
          <Typography sx={{ fontSize: 14, color: '#5C5F5E', mt: 1, maxWidth: 300 }}>
            {error ?? 'Parcelle introuvable'}
          </Typography>
          <Stack
            component="button"
            direction="row"
            alignItems="center"
            spacing={0.75}
            onClick={reload}
            sx={{
              // Resets ciblés plutôt que `all: 'unset'` : ce dernier remettait
              // aussi `display` à `inline`, ce qui annulait le flex du Stack et
              // empilait l'icône au-dessus du libellé.
              appearance: 'none',
              border: 0,
              font: 'inherit',
              textAlign: 'inherit',
              cursor: 'pointer',
              mt: 2,
              px: 2.5,
              py: 1,
              borderRadius: 999,
              background: '#018675',
              color: '#FFFFFF',
              '& svg': { fontSize: 18 },
            }}
          >
            <ReplayRounded />
            <Typography sx={{ fontFamily: "'Ubuntu', sans-serif", fontSize: 14, fontWeight: 700 }}>
              Réessayer
            </Typography>
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

      <DraggableBottomSheet
        snapPoints={SHEET_SNAPS}
        initialSnap={1}
        contentBottomPadding={CONTENT_BOTTOM_PADDING}
        zIndex={900}
      >
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
          ) : activeTab === 2 ? (
            <ConseilsTabContent itk={detail.itk} ndvi={detail.ndvi} indicators={detail.indicators} />
          ) : (
            <CarnetTabContent visites={detail.carnet} />
          )}
        </Box>
      </DraggableBottomSheet>
    </FullScreen>
  );
};
