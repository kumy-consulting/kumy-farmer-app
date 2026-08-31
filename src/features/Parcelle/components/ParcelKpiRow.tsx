import type { FunctionComponent, ReactNode } from 'react';

import { Stack, Typography } from '@mui/material';

import { ndviColor, ndviLabel } from '@/features/Domaines/components/detailVisuals';

import type { YieldEstimate } from '../parcelle.types';

interface ParcelKpiRowProps {
  ndvi: number | null;
  area?: number;
  daysAfterSowing?: number;
  yieldEstimate: YieldEstimate | null;
}

const fr1 = (n: number): string => n.toLocaleString('fr-FR', { maximumFractionDigits: 1 });

/** Placeholder « En attente » homogène (donnée pas encore calculée / scannée). */
const Pending: FunctionComponent = () => (
  <Typography
    component="span"
    sx={{ fontFamily: "'Ubuntu', sans-serif", fontSize: 12, fontWeight: 600, color: '#B0B5B3', lineHeight: 1.2 }}
  >
    En attente
  </Typography>
);

const KpiCell: FunctionComponent<{ label: string; value: ReactNode }> = ({ label, value }) => (
  <Stack spacing={0.3} sx={{ flex: 1, minWidth: 0, alignItems: 'center', textAlign: 'center', px: 0.5 }}>
    <Stack
      direction="row"
      alignItems="center"
      justifyContent="center"
      sx={{ minHeight: 20, maxWidth: '100%', overflow: 'hidden' }}
    >
      {value}
    </Stack>
    <Typography
      sx={{
        fontFamily: "'Ubuntu', sans-serif",
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        color: '#8F9291',
        lineHeight: 1.2,
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </Typography>
  </Stack>
);

/** Valeur numérique + suffixe optionnel, dans le ton demandé. */
const Metric: FunctionComponent<{ main: string; suffix?: string; color?: string }> = ({
  main,
  suffix,
  color = '#1A1C1B',
}) => (
  <Stack direction="row" alignItems="baseline" spacing={0.4} sx={{ minWidth: 0 }}>
    <Typography
      sx={{
        fontFamily: "'Ubuntu', sans-serif",
        fontSize: 15,
        fontWeight: 700,
        color,
        lineHeight: 1.2,
        fontVariantNumeric: 'tabular-nums',
        whiteSpace: 'nowrap',
      }}
    >
      {main}
    </Typography>
    {suffix && (
      <Typography
        sx={{ fontFamily: "'Ubuntu', sans-serif", fontSize: 11, fontWeight: 600, color, opacity: 0.75, whiteSpace: 'nowrap' }}
      >
        {suffix}
      </Typography>
    )}
  </Stack>
);

/** Bande de 4 indicateurs clés : Santé (NDVI fusionné) · Surface · Âge · Rendement. */
export const ParcelKpiRow: FunctionComponent<ParcelKpiRowProps> = ({ ndvi, area, daysAfterSowing, yieldEstimate }) => {
  const health =
    ndvi != null ? <Metric main={ndvi.toFixed(2)} suffix={ndviLabel(ndvi)} color={ndviColor(ndvi)} /> : <Pending />;

  const surface = area != null ? <Metric main={`${parseFloat(area.toFixed(2))}`} suffix="ha" /> : <Pending />;

  const age = daysAfterSowing != null ? <Metric main={`J+${daysAfterSowing}`} /> : <Pending />;

  const yieldCell = yieldEstimate ? (
    <Metric main={fr1(yieldEstimate.value)} suffix={yieldEstimate.unit} color="#016557" />
  ) : (
    <Pending />
  );

  return (
    <Stack
      direction="row"
      alignItems="stretch"
      sx={{
        px: 1.5,
        py: 1.5,
        background: '#FFFFFF',
        borderBottom: '1px solid rgba(55,75,70,0.10)',
        '& > *:not(:last-child)': { borderRight: '1px solid rgba(55,75,70,0.08)' },
      }}
    >
      <KpiCell label="Santé" value={health} />
      <KpiCell label="Surface ha" value={surface} />
      <KpiCell label="Âge" value={age} />
      <KpiCell label="Rendement" value={yieldCell} />
    </Stack>
  );
};
