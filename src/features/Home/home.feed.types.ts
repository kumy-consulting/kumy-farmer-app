import type { AlertSeverity } from '@/features/Domaines/domaines.types';
import type { FieldTaskStatus } from '@/features/FieldTasks/fieldTasks.types';

/**
 * Contrat du fil d'exploitation de l'accueil.
 *
 * Toutes les sources (consignes, alertes, tâches ITK, fenêtres de traitement,
 * visites) sont normalisées en `FeedItemDraft` par les mappers, puis rangées par
 * `buildFeed`. Les composants ne connaissent QUE ce contrat.
 */

export type FeedKind = 'alert' | 'task' | 'itk' | 'window' | 'visit';

export type FeedBucket = 'now' | 'today' | 'week' | 'later';

/** Pictogramme de la carte — choisi par le mapper, rendu par `feedVisuals`. */
export type FeedIcon =
  | 'drought'
  | 'frost'
  | 'disease'
  | 'sensor_offline'
  | 'soil_moisture'
  | 'rain'
  | 'irrigation'
  | 'treatment'
  | 'sowing'
  | 'harvest'
  | 'inspection'
  | 'window'
  | 'visit';

/** Récapitulatif d'une visite d'encadreur, reconstitué depuis ses consignes. */
export interface FeedVisitSummary {
  id: string;
  author: string;
  date: string; // ISO
  total: number;
  done: number;
}

export interface FeedItemDraft {
  /** `${kind}:${sourceId}` — stable, sert de clé React. */
  id: string;
  kind: FeedKind;
  title: string;
  /** Parcelle, à défaut domaine. */
  place: string;
  icon: FeedIcon;
  /** « Vérifier l'irrigation », « Urée 150 kg/ha », « Jusqu'au 20/08 »… */
  advice?: string;
  /** Précision secondaire, ex. conditions météo mesurées par le kit. */
  note?: string;
  /** Date de référence ISO : échéance, fermeture de fenêtre, création d'alerte, date de visite. */
  at: string;
  severity?: AlertSeverity;
  status?: FieldTaskStatus;
  overdue?: boolean;
  daysOverdue?: number;
  /** Vrai uniquement pour `kind === 'task'` : seule source que l'agriculteur peut faire avancer. */
  actionable?: boolean;
  /** Nom de l'encadreur (consigne, visite). */
  author?: string;
  /** Libellés des prérequis non satisfaits — vide si le serveur ne les a pas résolus. */
  unmetPrerequisites?: string[];
  visit?: FeedVisitSummary;
  /** Route de navigation au tap. */
  target?: string;
  /**
   * Urgence propre au métier (fenêtre qui se ferme, tâche ITK dépassée). Le
   * mapper la connaît, `buildFeed` se contente de la respecter.
   */
  urgentNow?: boolean;
}

export interface FeedItem extends FeedItemDraft {
  bucket: FeedBucket;
  score: number;
}

export interface FeedGroup {
  bucket: FeedBucket;
  label: string;
  items: FeedItem[];
}
