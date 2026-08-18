/**
 * Types de la feature FieldTasks (consignes de terrain).
 *
 * Miroir TypeScript de `FieldTaskDto` (backend), dates en `string` ISO.
 *
 * ⚠️ Vocabulaire : une « consigne » est une instruction donnée par un encadreur
 * pendant une visite. Ce n'est PAS une tâche ITK, matérialisée depuis le
 * catalogue agronomique. Les deux coexistent et ne doivent jamais être fusionnées.
 */

export type FieldTaskStatus = 'planned' | 'in_progress' | 'done';

export type FieldTaskType =
  | 'weeding'
  | 'fertilization'
  | 'treatment'
  | 'irrigation'
  | 'sowing'
  | 'harvest'
  | 'other';

/**
 * Prérequis résolu par le serveur (libellé + satisfait). ABSENT des réponses de
 * liste allégées : l'UI n'affiche les prérequis que si le champ est présent.
 */
export interface ResolvedPrerequisite {
  kind: 'field_task' | 'itk_task';
  taskId: string;
  label: string;
  satisfied: boolean;
}

export interface FieldTask {
  id: string;
  clientTaskId: string;
  farmerId: string;
  farmId: string;
  /** null quand targetType === 'farm' */
  parcelId: string | null;
  targetType: 'parcel' | 'farm';
  type: FieldTaskType;
  title: string;
  description: string;
  /** Échéance — un JOUR au format YYYY-MM-DD, pas un instant. */
  dueDate: string;
  status: FieldTaskStatus;
  /** Dérivé côté serveur : dueDate < aujourd'hui && status !== 'done'. */
  overdue: boolean;
  daysOverdue: number;
  prerequisitesResolved?: ResolvedPrerequisite[];
  createdBy: string;
  createdByName: string | null;
  /** agent_visits/{id} si la consigne a été créée pendant une visite. */
  visitId: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedFieldTasks {
  data: FieldTask[];
  total: number;
}
