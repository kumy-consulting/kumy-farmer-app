import type { ReactElement } from 'react';

import ErrorRounded from '@mui/icons-material/ErrorRounded';
import InfoRounded from '@mui/icons-material/InfoRounded';
import WarningRounded from '@mui/icons-material/WarningRounded';

import type { AlertSeverity } from '../domaines.types';

/** Nombre au format fr-FR, 1 décimale max (13.8, 0.65, 4). */
export const fr = (n: number, maxDecimals = 1): string =>
  n.toLocaleString('fr-FR', { maximumFractionDigits: maxDecimals });

/**
 * Surface d'une parcelle telle que la végétation la renvoie : une chaîne, dont
 * le séparateur décimal et l'unité suffixée varient (« 2.5 », « 2,5 », « 2,5 ha »).
 * Tout ce qui n'est pas un chiffre ou un séparateur est écarté ; une valeur
 * illisible vaut 0 plutôt que NaN, qui contaminerait la somme.
 */
export const parseArea = (raw: string | number | undefined): number => {
  if (typeof raw === 'number') return Number.isFinite(raw) ? raw : 0;
  if (!raw) return 0;
  const n = parseFloat(raw.replace(/\s/g, '').replace(',', '.').replace(/[^0-9.]/g, ''));
  return Number.isFinite(n) ? n : 0;
};

/** Pluriel simple : `n` + singulier/pluriel selon la valeur. */
export const plural = (n: number, singular: string, pluralForm = `${singular}s`): string =>
  `${n} ${n > 1 ? pluralForm : singular}`;

/**
 * Nom de culture présentable : initiale en majuscule, underscores CONSERVÉS
 * (aligné sur la PWA ingénieur → « Ananas_baronne », « Arachide »).
 */
export const prettyCrop = (raw: string): string =>
  raw ? raw.charAt(0).toUpperCase() + raw.slice(1) : raw;

interface SeverityTone {
  label: string;
  /** Couleur du texte. */
  deep: string;
  /** Fond de la pilule. */
  tint: string;
  /** Bordure de la pilule. */
  ring: string;
  /** Dégradé de la pastille icône. */
  badge: string;
  /** Ombre/halo de la pastille. */
  glow: string;
  icon: ReactElement;
}

/**
 * Badge d'alerte par domaine — valeurs EXACTES de la PWA ingénieur (ALERT_SEV).
 * `critical` = rouge « Critique », `warning` = ambre « Vigilance », `info` = teal.
 */
export const SEVERITY: Record<AlertSeverity, SeverityTone> = {
  critical: {
    label: 'Critique',
    deep: '#B3261E',
    tint: 'rgba(229,57,53,0.09)',
    ring: 'rgba(229,57,53,0.26)',
    badge: 'linear-gradient(135deg, #E53935 0%, #C62828 100%)',
    glow: 'rgba(229,57,53,0.45)',
    icon: <ErrorRounded />,
  },
  warning: {
    label: 'Vigilance',
    deep: '#A85D00',
    tint: 'rgba(245,158,11,0.11)',
    ring: 'rgba(245,158,11,0.30)',
    badge: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
    glow: 'rgba(245,158,11,0.45)',
    icon: <WarningRounded />,
  },
  info: {
    label: 'Info',
    deep: '#016557',
    tint: 'rgba(1,134,117,0.09)',
    ring: 'rgba(1,134,117,0.24)',
    badge: 'linear-gradient(135deg, #018675 0%, #016557 100%)',
    glow: 'rgba(1,134,117,0.45)',
    icon: <InfoRounded />,
  },
};
