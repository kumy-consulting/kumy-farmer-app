import type { ReactElement } from 'react';

import ErrorRounded from '@mui/icons-material/ErrorRounded';
import InfoRounded from '@mui/icons-material/InfoRounded';
import WarningRounded from '@mui/icons-material/WarningRounded';

import type { AlertSeverity } from '../domaines.types';

/** Couleur NDVI (seuils identiques à la PWA ingénieur). */
export const ndviColor = (ndvi: number | null | undefined): string => {
  if (ndvi == null) return '#9E9E9E';
  if (ndvi < 0.2) return '#D84315';
  if (ndvi < 0.35) return '#EF6C00';
  if (ndvi < 0.5) return '#F9A825';
  if (ndvi < 0.65) return '#7CB342';
  return '#2E7D32';
};

/** Libellé NDVI. */
export const ndviLabel = (ndvi: number | null | undefined): string => {
  if (ndvi == null) return 'N/A';
  if (ndvi < 0.2) return 'Critique';
  if (ndvi < 0.35) return 'Faible';
  if (ndvi < 0.5) return 'Modéré';
  if (ndvi < 0.65) return 'Bon';
  return 'Excellent';
};

/** Âge depuis la date de plantation : « N j » (<30j), « N mois », « N ans ». */
export const formatAge = (plantingDate?: string): string | null => {
  if (!plantingDate) return null;
  const planting = new Date(plantingDate);
  if (Number.isNaN(planting.getTime())) return null;
  const now = new Date();
  const days = Math.max(0, Math.round((now.getTime() - planting.getTime()) / 86_400_000));
  if (days < 30) return `${days} j`;
  const months =
    (now.getFullYear() - planting.getFullYear()) * 12 + (now.getMonth() - planting.getMonth());
  if (months < 12) return `${months} mois`;
  const years = Math.floor(months / 12);
  const rem = months % 12;
  return rem === 0 ? `${years} an${years > 1 ? 's' : ''}` : `${years} an${years > 1 ? 's' : ''} ${rem} m`;
};

export type HealthTone = 'critical' | 'warning' | 'ok' | 'neutral';

interface HealthVerdict {
  label: string;
  tone: HealthTone;
}

/** Verdict santé d'une parcelle : sévérité d'alerte prioritaire, sinon seuils NDVI. */
export const healthVerdict = (
  severity: AlertSeverity | undefined,
  ndvi: number | null | undefined,
): HealthVerdict => {
  if (severity === 'critical') return { label: 'Critique', tone: 'critical' };
  if (severity === 'warning') return { label: 'Vigilance', tone: 'warning' };
  if (ndvi == null) return { label: 'Données absentes', tone: 'neutral' };
  if (ndvi < 0.2) return { label: 'Critique', tone: 'critical' };
  if (ndvi < 0.35) return { label: 'Faible', tone: 'warning' };
  if (ndvi < 0.5) return { label: 'Modéré', tone: 'warning' };
  if (ndvi < 0.65) return { label: 'Bon', tone: 'ok' };
  return { label: 'Excellent', tone: 'ok' };
};

/** Icône par sévérité (bande d'alerte parcelle). */
export const severityIcon = (severity: AlertSeverity): ReactElement =>
  ({
    critical: <ErrorRounded />,
    warning: <WarningRounded />,
    info: <InfoRounded />,
  })[severity];

/** Palette de sévérité de la bande d'alerte (identique à la référence). */
export const ALERT_SEV: Record<AlertSeverity, { solid: string; deep: string; tint: string; ring: string; badge: string }> = {
  critical: {
    solid: '#E53935',
    deep: '#B3261E',
    tint: 'rgba(229,57,53,0.09)',
    ring: 'rgba(229,57,53,0.26)',
    badge: 'linear-gradient(135deg, #E53935 0%, #C62828 100%)',
  },
  warning: {
    solid: '#F59E0B',
    deep: '#A85D00',
    tint: 'rgba(245,158,11,0.11)',
    ring: 'rgba(245,158,11,0.30)',
    badge: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
  },
  info: {
    solid: '#018675',
    deep: '#016557',
    tint: 'rgba(1,134,117,0.09)',
    ring: 'rgba(1,134,117,0.24)',
    badge: 'linear-gradient(135deg, #018675 0%, #016557 100%)',
  },
};
