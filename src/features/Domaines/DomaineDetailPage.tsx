import { useState, type FunctionComponent, type ReactNode } from 'react';

import ChevronLeftRounded from '@mui/icons-material/ChevronLeftRounded';
import GridViewRounded from '@mui/icons-material/GridViewRounded';
import ReplayRounded from '@mui/icons-material/ReplayRounded';
import { Box, CircularProgress, IconButton, Stack, Typography } from '@mui/material';
import { keyframes } from '@mui/material/styles';
import { useNavigate, useParams } from 'react-router-dom';

import { NAV_HEIGHT } from '@/shared/components/BottomNav';
import { DraggableBottomSheet } from '@/shared/components/DraggableBottomSheet';

import { DomaineDetailMap } from './components/DomaineDetailMap';
import { DomaineStatsRow } from './components/DomaineStatsRow';
import { DomaineWeather } from './components/DomaineWeather';
import { ParcelCard } from './components/ParcelCard';
import { useDomaineDetail } from './useDomaineDetail';

const HEADER_OVERLAY_PX = 96;
const SHEET_SNAPS: (number | string)[] = [120, '45vh', '85vh'];
const CONTENT_BOTTOM_PADDING = NAV_HEIGHT + 40;
const TABS = ['Parcelles', 'Météos'];

/** Révélation en fondu montant (cartes de parcelles, en cascade). */
const cardIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;
/** Fondu doux au changement d'onglet. */
const tabIn = keyframes`
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
`;

/** Bouton retour translucide sombre (variante overlay). */
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

/** En-tête superposé sur la carte : retour + (agriculteur) + nom du domaine + stats, scrim dégradé. */
const HeaderOverlay: FunctionComponent<{ owner: string; title: string; subtitle: string; onBack: () => void }> = ({
  owner,
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
      // Scrim plus haut et progressif (3 paliers) → titre lisible sur satellite.
      background:
        'linear-gradient(180deg, rgba(0,0,0,0.60) 0%, rgba(0,0,0,0.34) 42%, rgba(0,0,0,0.12) 72%, transparent 100%)',
    }}
  >
    <Stack direction="row" alignItems="flex-start" spacing="14px">
      <BackButton onClick={onBack} />
      <Box sx={{ minWidth: 0, pt: '2px' }}>
        {owner && (
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
            {owner}
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
          <Stack direction="row" alignItems="center" spacing="5px" sx={{ mt: '3px' }}>
            <GridViewRounded sx={{ fontSize: 13, color: 'rgba(255,255,255,0.9)' }} />
            <Typography
              sx={{
                fontFamily: "'Ubuntu', sans-serif",
                fontSize: '12.5px',
                fontWeight: 500,
                color: 'rgba(255,255,255,0.92)',
                lineHeight: '16px',
                textShadow: '0 1px 3px rgba(0,0,0,0.4)',
              }}
              noWrap
            >
              {subtitle}
            </Typography>
          </Stack>
        )}
      </Box>
    </Stack>
  </Box>
);

export const DomaineDetailPage: FunctionComponent = () => {
  const { id: farmId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { detail, isLoading, error, reload } = useDomaineDetail(farmId);
  const [activeTab, setActiveTab] = useState(0);

  if (isLoading || (!detail && !error)) {
    return (
      <FullScreen>
        <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CircularProgress sx={{ color: '#93F4E0' }} />
        </Box>
        <HeaderOverlay owner="" title="" subtitle="" onBack={() => navigate('/domaines')} />
      </FullScreen>
    );
  }

  if (error || !detail) {
    return (
      <FullScreen>
        <HeaderOverlay owner="" title="" subtitle="" onBack={() => navigate('/domaines')} />
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
            {error ?? 'Domaine introuvable'}
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
      {/* Carte plein écran */}
      <Box sx={{ position: 'absolute', inset: 0 }}>
        <DomaineDetailMap
          contour={detail.contour}
          parcels={detail.parcels}
          topReservedPx={HEADER_OVERLAY_PX}
          bottomReservedPx={bottomReservedPx}
        />
      </Box>

      <HeaderOverlay
        owner={detail.ownerName ?? ''}
        title={detail.headerTitle}
        subtitle={detail.headerSubtitle}
        onBack={() => navigate('/domaines')}
      />

      <DraggableBottomSheet
        snapPoints={SHEET_SNAPS}
        initialSnap={1}
        contentBottomPadding={CONTENT_BOTTOM_PADDING}
        zIndex={900}
      >
        <DomaineStatsRow stats={detail.stats} />

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
            <Box sx={{ pt: 0.5 }}>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ padding: '18px 16px 12px' }}>
                <Typography sx={{ fontFamily: "'Ubuntu', sans-serif", fontSize: 18, fontWeight: 700, color: '#1A1C1B' }}>
                  Parcelles
                </Typography>
                <Box
                  sx={{
                    minWidth: 22,
                    height: 22,
                    px: '6px',
                    borderRadius: 999,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'rgba(1,134,117,0.14)',
                    color: '#006B5D',
                    fontFamily: "'Ubuntu', sans-serif",
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  {detail.parcels.length}
                </Box>
              </Stack>

              {detail.parcels.length === 0 ? (
                <Stack alignItems="center" spacing={1.25} sx={{ px: 3, py: 4, textAlign: 'center' }}>
                  <Box
                    sx={{
                      width: 56,
                      height: 56,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'rgba(1,134,117,0.08)',
                      '& svg': { fontSize: 26, color: '#35A18F' },
                    }}
                  >
                    <GridViewRounded />
                  </Box>
                  <Typography sx={{ fontFamily: "'Ubuntu', sans-serif", fontSize: 14.5, fontWeight: 700, color: '#243F38' }}>
                    Aucune parcelle
                  </Typography>
                  <Typography sx={{ fontSize: 13, color: '#5C5F5E', maxWidth: 260, lineHeight: 1.5 }}>
                    Les parcelles de ce domaine apparaîtront ici dès que votre technicien les aura tracées.
                  </Typography>
                </Stack>
              ) : (
                detail.parcels.map((parcel, i) => (
                  <Box
                    key={parcel.parcelId}
                    sx={{
                      animation: `${cardIn} 0.42s cubic-bezier(0.22,0.61,0.36,1) both`,
                      animationDelay: `${Math.min(i, 8) * 0.05}s`,
                      '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
                    }}
                  >
                    <ParcelCard parcel={parcel} />
                  </Box>
                ))
              )}
            </Box>
          ) : (
            <DomaineWeather liveStation={detail.liveStation} />
          )}
        </Box>
      </DraggableBottomSheet>
    </FullScreen>
  );
};
