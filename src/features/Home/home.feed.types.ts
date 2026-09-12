import type { AlertSeverity } from '@/features/Domaines/domaines.types';
import type { FieldTaskStatus } from '@/features/FieldTasks/fieldTasks.types';

/**
 * Contrat du fil d'exploitation de l'accueil.
 *
 * Toutes les sources (consignes, alertes, tâches ITK, fenêtres de traitement,
 * visites) sont normalisées en `FeedItemDraft` par les mappers, puis réparties
 * en sections par `buildSections`. Les composants ne connaissent QUE ce contrat.
 */

export type FeedKind = 'alert' | 'task' | 'itk' | 'window' | 'visit';

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

/**
 * Où agir. « Alerte sanitaire » ne suffit pas : l'agriculteur doit savoir sur
 * quel domaine, quelle parcelle et quelle culture avant de se déplacer. Les
 * trois niveaux ne sont pas toujours connus — une alerte de domaine n'a pas de
 * parcelle —, l'affichage ne montre donc que ce qui existe.
 */
export interface Perimetre {
  domaine?: string;
  parcelle?: string;
  culture?: string;
}

/** Récapitulatif d'une visite de technicien, reconstitué depuis ses consignes. */
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
  /** Parcelle, à défaut domaine — libellé court des affichages compacts. */
  place: string;
  /** Domaine · parcelle · culture, pour les cartes qui doivent situer l'action. */
  perimetre: Perimetre;
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
  /** Nom du technicien (consigne, visite). */
  author?: string;
  /** Libellés des prérequis non satisfaits — vide si le serveur ne les a pas résolus. */
  unmetPrerequisites?: string[];
  visit?: FeedVisitSummary;
  /** Route de navigation au tap. */
  target?: string;
  /**
   * Urgence propre au métier (fenêtre qui se ferme, tâche ITK dépassée). Le
   * mapper la connaît, les sections se contentent de la respecter.
   */
  urgentNow?: boolean;
}

export interface FeedItem extends FeedItemDraft {
  /** Rang d'urgence calculé — plus petit = plus haut dans sa section. */
  score: number;
}
