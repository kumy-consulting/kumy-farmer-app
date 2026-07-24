import type { FunctionComponent } from 'react';

import { Box, Typography } from '@mui/material';

import { fr } from './domainesVisuals';

/** Totaux affichés dans la barre — dérivés des domaines (voir DomainesPage). */
export interface DomainesTotals {
  parcels: number;
  hectares: number;
  avgNdvi: number;
  alerts: number;
}

interface DomainesStatBarProps {
  totals: DomainesTotals;
}

interface Cell {
  value: string;
  label: string;
}

/** Cellule stat (valeur + label) avec séparateur court dégradé à droite. */
const Stat: FunctionComponent<Cell> = ({ value, label }) => (
  <Box
    sx={{
      flex: 1,
      minWidth: 0,
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2px 4px',
      // Séparateur court, fondu en haut/bas (centré) — pas une bordure pleine hauteur.
      '&:not(:last-of-type)::after': {
        content: '""',
        position: 'absolute',
        right: 0,
        top: '22%',
        bottom: '22%',
        width: '1px',
        background: 'linear-gradient(180deg, transparent 0%, rgba(1,134,117,0.18) 50%, transparent 100%)',
      },
    }}
  >
    <Typography
      sx={{
        fontFamily: "'Ubuntu', sans-serif",
        fontSize: '19px',
        fontWeight: 700,
        color: '#1A1C1B',
        lineHeight: '24px',
        letterSpacing: '-0.01em',
        fontVariantNumeric: 'tabular-nums',
      }}
      noWrap
    >
      {value}
    </Typography>
    <Typography
      sx={{
        mt: '3px',
        fontFamily: "'Ubuntu', sans-serif",
        fontSize: '9.75px',
        fontWeight: 600,
        color: 'rgba(55,75,70,0.60)',
        lineHeight: '14px',
        letterSpacing: '0.10em',
        textTransform: 'uppercase',
      }}
      noWrap
    >
      {label}
    </Typography>
  </Box>
);

/** Barre de synthèse (Parcelles / Hectares / NDVI moy. / Alertes) — style PWA ingénieur. */
export const DomainesStatBar: FunctionComponent<DomainesStatBarProps> = ({ totals }) => {
  const cells: Cell[] = [
    { value: fr(totals.parcels, 0), label: 'Parcelles' },
    { value: fr(totals.hectares), label: 'Hectares' },
    { value: totals.avgNdvi > 0 ? fr(totals.avgNdvi, 2) : '—', label: 'NDVI moy.' },
    { value: fr(totals.alerts, 0), label: 'Alertes' },
  ];

  return (
    <Box
      sx={{
        position: 'relative',
        display: 'flex',
        alignItems: 'stretch',
        justifyContent: 'space-between',
        padding: '12px 8px',
        borderRadius: '18px',
        background: 'linear-gradient(135deg, rgba(255,255,255,0.86) 0%, rgba(247,251,246,0.86) 100%)',
        border: '1px solid rgba(1,134,117,0.14)',
        backdropFilter: 'blur(12px) saturate(140%)',
        WebkitBackdropFilter: 'blur(12px) saturate(140%)',
        boxShadow: '0 8px 22px rgba(55,75,70,0.06), 0 1px 0 rgba(255,255,255,0.9) inset',
        // Liseré d'accent teal fondu, en haut de la carte.
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 16,
          right: 16,
          height: '2px',
          borderRadius: '2px',
          opacity: 0.7,
          background: 'linear-gradient(90deg, transparent 0%, rgba(1,134,117,0.40) 50%, transparent 100%)',
        },
      }}
    >
      {cells.map((cell) => (
        <Stat key={cell.label} {...cell} />
      ))}
    </Box>
  );
};
