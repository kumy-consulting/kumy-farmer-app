import type { ItkStageStatus, ItkTaskState, RiskSeverity } from '../parcelle.types';

/** Couleur d'un stade ITK (frise + détail). Aligné sur la sémantique PWA. */
export const stageStatusColor = (status: ItkStageStatus): string =>
  ({
    completed: '#018675',
    inProgress: '#0EA5A0',
    delayed: '#E53935',
    skipped: '#9AA6A2',
    upcoming: '#C4CCC9',
  })[status];

/** Libellé court d'un statut de stade. */
export const stageStatusLabel = (status: ItkStageStatus): string =>
  ({
    completed: 'Terminé',
    inProgress: 'En cours',
    delayed: 'En retard',
    skipped: 'Sauté',
    upcoming: 'À venir',
  })[status];

interface TaskStateStyle {
  label: string;
  color: string;
  bg: string;
  /**
   * Fanion vertical à gauche de la fiche, quand il y en a un.
   *
   * Il marque ce qui est RÉGLÉ : terminé, ou manqué. Ce qui reste ouvert — à
   * faire, à venir — n'en porte pas, parce que rien n'y est encore joué ; sa
   * pastille suffit. Sans cette règle, un stade entièrement fait n'affichait que
   * la même pastille pâle répétée, et rien ne disait qu'il était boucle.
   *
   * Le vert est volontairement plus discret que le rouge : le fait accompli se
   * constate, le retard réclame.
   */
  rail?: string;
}

/** Style d'un badge d'état de tâche. */
export const taskStateStyle = (state: ItkTaskState): TaskStateStyle =>
  ({
    completed: { label: 'Fait', color: '#005046', bg: 'rgba(1,134,117,0.12)', rail: 'rgba(1,134,117,0.68)' },
    pending: { label: 'À faire', color: '#8C5000', bg: 'rgba(198,138,26,0.14)' },
    overdue: { label: 'En retard', color: '#BA1A1A', bg: 'rgba(186,26,26,0.11)', rail: '#BA1A1A' },
    upcoming: { label: 'À venir', color: '#5C5F5E', bg: 'rgba(55,75,70,0.08)' },
    manual: { label: 'Manuel', color: '#5C5F5E', bg: 'rgba(55,75,70,0.08)' },
  })[state];

interface RiskSeverityStyle {
  label: string;
  solid: string;
  deep: string;
  tint: string;
  ring: string;
}

const RISK_STYLE: Record<RiskSeverity, RiskSeverityStyle> = {
  high: { label: 'Élevé', solid: '#E53935', deep: '#B3261E', tint: 'rgba(229,57,53,0.09)', ring: 'rgba(229,57,53,0.26)' },
  medium: { label: 'Modéré', solid: '#F59E0B', deep: '#A85D00', tint: 'rgba(245,158,11,0.11)', ring: 'rgba(245,158,11,0.30)' },
  low: { label: 'Faible', solid: '#018675', deep: '#016557', tint: 'rgba(1,134,117,0.09)', ring: 'rgba(1,134,117,0.24)' },
};

/** Style d'une carte de risque selon sa sévérité (repli sur « modéré »). */
export const riskSeverityStyle = (severity: string): RiskSeverityStyle =>
  RISK_STYLE[(severity as RiskSeverity) in RISK_STYLE ? (severity as RiskSeverity) : 'medium'];

/** Libellé lisible d'un type de risque. */
export const riskTypeLabel = (type: string): string =>
  ({
    hydric: 'Hydrique',
    parasitic: 'Parasitaire',
    nutritional: 'Nutritionnel',
    climatic: 'Climatique',
    disease: 'Maladie',
  })[type] ?? type;
