import { useState, type FunctionComponent } from 'react';

import GroupsRounded from '@mui/icons-material/GroupsRounded';
import { Box, Stack, Typography } from '@mui/material';

import { useInViewport } from '@/shared/hooks/useInViewport';

import type { Coordinate, DomainCard as DomainCardModel, ParcelVegetation } from '../domaines.types';
import { getCropIcon } from './cropIcon';
import { fr, plural, prettyCrop, SEVERITY } from './domainesVisuals';
import { DomainMiniMap } from './DomainMiniMap';

interface DomainCardProps {
  domain: DomainCardModel;
  onClick: () => void;
}

const HERO_PERSONAL = 'linear-gradient(135deg, #018675 0%, #006B5D 100%)';
const HERO_COMMUNAL = 'linear-gradient(135deg, #4A685F 0%, #233A33 100%)';

/**
 * Aperçu du domaine, par ordre de préférence : carte satellite live (tuiles
 * Google + polygone + overlays NDVI) si géométrie dispo, sinon image
 * pré-générée, sinon placeholder. Conteneur STABLE ; on échange des types
 * d'éléments DISTINCTS (jamais un swap de balise hôte emotion → removeChild).
 */
const DomainThumb: FunctionComponent<{
  image?: string;
  coords: Coordinate[];
  parcels: ParcelVegetation[];
  name: string;
  communal: boolean;
}> = ({ image, coords, parcels, name, communal }) => {
  const [imageFailed, setImageFailed] = useState(false);
  const { ref, inView } = useInViewport<HTMLDivElement>();

  const hasContour = coords.length >= 3;
  const useImage = !hasContour && Boolean(image?.trim()) && !imageFailed;

  return (
    <Box
      sx={{
        height: 158,
        overflow: 'hidden',
        position: 'relative',
        // Confine les z-index internes de Leaflet sous le badge « Communautaire ».
        isolation: 'isolate',
        background: communal ? HERO_COMMUNAL : HERO_PERSONAL,
      }}
    >
      {/* Wrapper `ref` TOUJOURS monté → l'observer s'attache dès le 1er rendu ;
          la carte n'est montée qu'une fois dans le viewport (tuiles chargées). */}
      <div ref={ref} style={{ position: 'absolute', inset: 0 }}>
        {hasContour ? (
          inView && <DomainMiniMap contour={coords} parcels={parcels} />
        ) : useImage ? (
          <img
            src={image}
            alt={`Aperçu satellite de ${name}`}
            loading="lazy"
            onError={() => setImageFailed(true)}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography sx={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>
              Aperçu satellite bientôt
            </Typography>
          </div>
        )}
      </div>
    </Box>
  );
};

/** Chip d'une culture : icône illustrée (dans une pastille blanche) + nom. */
const CropChip: FunctionComponent<{ crop: string }> = ({ crop }) => (
  <Box
    sx={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      pl: '8px',
      pr: '12px',
      py: '5px',
      borderRadius: 999,
      background: 'rgba(1,134,117,0.08)',
      border: '1px solid rgba(1,134,117,0.18)',
    }}
  >
    <img
      src={getCropIcon(crop)}
      alt=""
      width={16}
      height={16}
      style={{
        padding: '1px',
        borderRadius: '50%',
        background: 'rgba(255,255,255,0.85)',
        boxShadow: 'inset 0 0 0 1px rgba(1,134,117,0.15)',
        objectFit: 'contain',
        display: 'block',
        flexShrink: 0,
      }}
    />
    <Typography
      sx={{
        fontFamily: "'Ubuntu', sans-serif",
        fontSize: 12,
        fontWeight: 500,
        color: '#006B5D',
        lineHeight: '16px',
        letterSpacing: '0.01em',
        whiteSpace: 'nowrap',
      }}
    >
      {prettyCrop(crop)}
    </Typography>
  </Box>
);

export const DomainCard: FunctionComponent<DomainCardProps> = ({ domain, onClick }) => {
  const tone = domain.alertSeverity ? SEVERITY[domain.alertSeverity] : null;
  const isCommunal = domain.ownership?.type === 'communal';

  // Cultures dédupliquées par type (comme la référence) → compteur + chips.
  const cultures = [...new Map(domain.activeCultures.map((c) => [c.cropType, c])).values()];

  const meta = [
    `${fr(domain.area)} ha`,
    plural(domain.parcelsCount, 'parcelle'),
    plural(cultures.length, 'culture'),
  ].join(' · ');

  return (
    <Box
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      sx={{
        cursor: 'pointer',
        background: '#FFFFFF',
        borderRadius: '16px',
        overflow: 'hidden',
        border: '1px solid #E2E3E1',
        boxShadow: '0 1px 2px rgba(18,49,41,0.04), 0 6px 18px rgba(18,49,41,0.06)',
        transition: 'transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease',
        '&:hover': {
          transform: 'translateY(-2px)',
          borderColor: '#35A18F',
          boxShadow: '0 2px 4px rgba(18,49,41,0.05), 0 14px 30px rgba(1,134,117,0.18)',
        },
        '&:active': { transform: 'scale(0.995)' },
      }}
    >
      <Box sx={{ position: 'relative' }}>
        <DomainThumb
          image={domain.polygonImage}
          coords={domain.coordinates}
          parcels={domain.vegetationParcels}
          name={domain.name}
          communal={isCommunal}
        />
        {isCommunal && (
          <Stack
            direction="row"
            alignItems="center"
            spacing="5px"
            sx={{
              position: 'absolute',
              top: 10,
              left: 12,
              zIndex: 2,
              pl: '8px',
              pr: '11px',
              py: '5px',
              borderRadius: 999,
              background: 'rgba(0,28,24,0.42)',
              backdropFilter: 'blur(10px) saturate(1.3)',
              WebkitBackdropFilter: 'blur(10px) saturate(1.3)',
              border: '1px solid rgba(255,255,255,0.30)',
              boxShadow: '0 4px 14px rgba(0,32,27,0.28)',
            }}
          >
            <GroupsRounded sx={{ fontSize: 14, color: '#FFFFFF', flexShrink: 0 }} />
            <Typography
              sx={{
                fontFamily: "'Ubuntu', sans-serif",
                fontSize: 11.5,
                fontWeight: 700,
                letterSpacing: 0.3,
                color: '#FFFFFF',
                lineHeight: 1.2,
              }}
            >
              Communautaire
            </Typography>
          </Stack>
        )}
      </Box>

      <Box sx={{ p: '14px 14px 12px' }}>
        <Typography
          sx={{
            fontFamily: "'Ubuntu', sans-serif",
            fontSize: 16,
            fontWeight: 600,
            color: '#1A1C1B',
            lineHeight: '22px',
          }}
          noWrap
        >
          {domain.name}
        </Typography>
        <Typography
          sx={{
            mt: '2px',
            mb: '10px',
            fontFamily: "'Ubuntu', sans-serif",
            fontSize: 12.5,
            fontWeight: 400,
            color: '#5C5F5E',
            lineHeight: 1.4,
            letterSpacing: 0.1,
          }}
          noWrap
        >
          {meta}
        </Typography>

        {domain.alertCount > 0 && tone && (
          <Box
            sx={{
              alignSelf: 'flex-start',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              pl: '5px',
              pr: '13px',
              py: '5px',
              mb: '10px',
              maxWidth: '100%',
              borderRadius: 999,
              background: tone.tint,
              border: `1px solid ${tone.ring}`,
            }}
          >
            <Box
              sx={{
                flexShrink: 0,
                width: 24,
                height: 24,
                borderRadius: '50%',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: tone.badge,
                boxShadow: `0 1px 4px ${tone.glow}`,
                '& svg': { fontSize: 14, color: '#FFFFFF' },
              }}
            >
              {tone.icon}
            </Box>
            <Typography
              sx={{
                fontFamily: "'Ubuntu', sans-serif",
                fontSize: 12.5,
                fontWeight: 700,
                lineHeight: '16px',
                letterSpacing: '0.01em',
                color: tone.deep,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {tone.label}
              <Box component="span" sx={{ fontWeight: 500, opacity: 0.72 }}>
                {' · '}
                {plural(domain.alertCount, 'alerte')}
              </Box>
            </Typography>
          </Box>
        )}

        {cultures.length > 0 && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {cultures.map((culture) => (
              <CropChip key={culture.cropType} crop={culture.cropType} />
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
};
