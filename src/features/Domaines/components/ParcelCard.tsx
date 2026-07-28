import type { FunctionComponent } from 'react';

import EnergySavingsLeafRounded from '@mui/icons-material/EnergySavingsLeafRounded';
import SatelliteAltRounded from '@mui/icons-material/SatelliteAltRounded';
import { Box, Typography } from '@mui/material';

import type { DetailParcel } from '../domaines.types';
import { getCropIcon } from './cropIcon';
import {
  ALERT_SEV,
  formatAge,
  healthVerdict,
  ndviColor,
  ndviLabel,
  severityIcon,
  type HealthTone,
} from './detailVisuals';

// Résolution des tons santé (bordure de carte, pastille).
const CARD_BORDER: Record<HealthTone, string> = {
  critical: 'rgba(186,26,26,0.35)',
  warning: 'rgba(198,138,26,0.35)',
  ok: '#E2E3E1',
  neutral: '#E2E3E1',
};
const CARD_SHADOW: Record<HealthTone, string> = {
  critical: '0 6px 18px -10px rgba(186,26,26,0.35)',
  warning: '0 6px 18px -10px rgba(198,138,26,0.32)',
  ok: '0 1px 2px rgba(0,0,0,0.04)',
  neutral: '0 1px 2px rgba(0,0,0,0.04)',
};
const CHIP_BG: Record<HealthTone, string> = {
  critical: 'rgba(186,26,26,0.10)',
  warning: 'rgba(198,138,26,0.13)',
  ok: '#B6FFEE',
  neutral: '#F0F1EF',
};
const CHIP_COLOR: Record<HealthTone, string> = {
  critical: '#BA1A1A',
  warning: '#8C5000',
  ok: '#005046',
  neutral: '#5C5F5E',
};
const CHIP_DOT: Record<HealthTone, string> = {
  critical: '#BA1A1A',
  warning: '#C68A1A',
  ok: '#018675',
  neutral: '#8F9291',
};

interface ParcelCardProps {
  parcel: DetailParcel;
  onClick?: () => void;
}

export const ParcelCard: FunctionComponent<ParcelCardProps> = ({ parcel, onClick }) => {
  const { ndvi, tileUrl, alert } = parcel;
  const verdict = healthVerdict(alert?.severity, ndvi);
  const color = ndviColor(ndvi);
  const cropIcon = getCropIcon(parcel.cropType || parcel.name);

  const areaStr = parcel.area != null ? `${parseFloat(parcel.area.toFixed(2))} ha` : null;
  const ageStr = formatAge(parcel.plantingDate);
  const meta = [areaStr, ageStr].filter(Boolean).join(' · ');

  const filledDots = ndvi == null ? 0 : Math.min(5, Math.max(1, Math.ceil(ndvi / 0.2)));
  const showAlert = Boolean(alert && alert.count > 0);

  return (
    <Box
      onClick={onClick}
      sx={{
        mx: 2,
        mb: 1.25,
        p: 1.25,
        display: 'flex',
        gap: 1.5,
        alignItems: 'stretch',
        borderRadius: '14px',
        background: '#FFFFFF',
        border: `1px solid ${CARD_BORDER[verdict.tone]}`,
        boxShadow: CARD_SHADOW[verdict.tone],
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 180ms ease, box-shadow 200ms ease',
        '&:active': onClick ? { transform: 'scale(0.992)' } : undefined,
      }}
    >
      {/* Vignette NDVI + pastille culture */}
      <Box
        sx={{
          position: 'relative',
          flexShrink: 0,
          width: 68,
          height: 68,
          borderRadius: '10px',
          overflow: 'hidden',
          border: '1px solid #E2E3E1',
        }}
      >
        {tileUrl ? (
          <img src={tileUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        ) : ndvi != null ? (
          <Box
            sx={{
              width: '100%',
              height: '100%',
              backgroundImage: `radial-gradient(circle at 30% 30%, ${color}38, ${color}18 60%, transparent), linear-gradient(135deg, #B6FFEE, #E5FFF7)`,
            }}
          />
        ) : (
          // En attente de scan : fond neutre + petit satellite en filigrane.
          <Box
            sx={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundImage: 'linear-gradient(135deg, #EEF2F0, #FCFDFA)',
              '& svg': { fontSize: 22, color: 'rgba(55,75,70,0.28)' },
            }}
          >
            <SatelliteAltRounded />
          </Box>
        )}
        <Box
          sx={{
            position: 'absolute',
            bottom: 4,
            left: 4,
            width: 26,
            height: 26,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.92)',
            backdropFilter: 'blur(4px)',
            boxShadow: '0 1px 4px rgba(0,0,0,0.18)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <img src={cropIcon} alt="" width={18} height={18} style={{ objectFit: 'contain' }} />
        </Box>
      </Box>

      {/* Corps */}
      <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 0.4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, minWidth: 0 }}>
          <Typography
            sx={{
              fontFamily: "'Ubuntu', sans-serif",
              fontSize: 15.5,
              fontWeight: 700,
              color: '#1A1C1B',
              letterSpacing: '-0.005em',
              lineHeight: 1.25,
              flex: 1,
              minWidth: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {parcel.name}
          </Typography>
          <Box
            sx={{
              flexShrink: 0,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.625,
              px: 1,
              py: 0.3,
              borderRadius: 999,
              fontFamily: "'Ubuntu', sans-serif",
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: 0.2,
              background: CHIP_BG[verdict.tone],
              color: CHIP_COLOR[verdict.tone],
            }}
          >
            <Box sx={{ width: 6, height: 6, borderRadius: '50%', background: CHIP_DOT[verdict.tone] }} />
            {verdict.label}
          </Box>
        </Box>

        {(meta || parcel.itkActive) && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap', rowGap: 0.4, minWidth: 0 }}>
            {meta && (
              <Typography
                sx={{ fontFamily: "'Ubuntu', sans-serif", fontSize: 12, fontWeight: 400, color: '#5C5F5E', lineHeight: 1.35, letterSpacing: 0.1 }}
              >
                {meta}
              </Typography>
            )}
            {parcel.itkActive && (
              <Box
                aria-label="Sous ITK"
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  height: 18,
                  pl: '6px',
                  pr: '8px',
                  borderRadius: 999,
                  background: 'linear-gradient(135deg, rgba(0,107,93,0.13) 0%, rgba(0,107,93,0.05) 100%)',
                  border: '0.5px solid rgba(0,107,93,0.30)',
                  '& svg': { fontSize: 12, color: '#006B5D' },
                }}
              >
                <EnergySavingsLeafRounded />
                <Box
                  component="span"
                  sx={{ fontFamily: "'Ubuntu', sans-serif", fontSize: 9.5, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#003730', lineHeight: 1 }}
                >
                  ITK
                </Box>
              </Box>
            )}
          </Box>
        )}

        {/* NDVI : 5 points + libellé quand mesuré ; sinon puce discrète « en attente ». */}
        {ndvi != null ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 0.4, minWidth: 0 }}>
            <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: '3px', flexShrink: 0 }}>
              {[0, 1, 2, 3, 4].map((i) => (
                <Box
                  key={i}
                  sx={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: i < filledDots ? color : '#E2E3E1',
                    transform: i < filledDots ? 'scale(1)' : 'scale(0.85)',
                    transition: 'background-color 180ms ease, transform 180ms ease',
                  }}
                />
              ))}
            </Box>
            <Typography
              sx={{
                fontFamily: "'Ubuntu', sans-serif",
                fontSize: 11.5,
                fontWeight: 600,
                letterSpacing: 0.2,
                color,
                fontVariantNumeric: 'tabular-nums',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {`NDVI · ${ndviLabel(ndvi)} · ${ndvi.toFixed(2)}`}
            </Typography>
          </Box>
        ) : (
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              alignSelf: 'flex-start',
              mt: 0.4,
              pl: '6px',
              pr: '10px',
              py: '3px',
              borderRadius: 999,
              background: 'rgba(55,75,70,0.05)',
              '& svg': { fontSize: 13, color: 'rgba(55,75,70,0.45)' },
            }}
          >
            <SatelliteAltRounded />
            <Typography
              sx={{ fontFamily: "'Ubuntu', sans-serif", fontSize: 11, fontWeight: 600, letterSpacing: 0.2, color: 'rgba(55,75,70,0.55)' }}
            >
              NDVI en attente de scan
            </Typography>
          </Box>
        )}

        {/* Bande d'alerte */}
        {showAlert && alert && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.875,
              mt: 0.875,
              pl: '5px',
              pr: '8px',
              py: '5px',
              borderRadius: '10px',
              background: ALERT_SEV[alert.severity].tint,
              border: `1px solid ${ALERT_SEV[alert.severity].ring}`,
            }}
          >
            <Box
              sx={{
                flexShrink: 0,
                width: 22,
                height: 22,
                borderRadius: '50%',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: ALERT_SEV[alert.severity].badge,
                boxShadow: `0 1px 3px ${ALERT_SEV[alert.severity].solid}73`,
                '& svg': { fontSize: 13, color: '#FFFFFF' },
              }}
            >
              {severityIcon(alert.severity)}
            </Box>
            <Typography
              sx={{
                fontFamily: "'Ubuntu', sans-serif",
                fontSize: 11.5,
                fontWeight: 600,
                lineHeight: 1.3,
                color: ALERT_SEV[alert.severity].deep,
                flex: 1,
                minWidth: 0,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
              noWrap
            >
              {alert.label}
            </Typography>
            {alert.count > 1 && (
              <Box
                component="span"
                sx={{
                  flexShrink: 0,
                  fontFamily: "'Ubuntu', sans-serif",
                  fontSize: 10.5,
                  fontWeight: 700,
                  lineHeight: '16px',
                  color: ALERT_SEV[alert.severity].deep,
                  background: `${ALERT_SEV[alert.severity].solid}24`,
                  borderRadius: 999,
                  px: 0.75,
                }}
              >
                {alert.count}
              </Box>
            )}
          </Box>
        )}
      </Box>
    </Box>
  );
};
