import type { FarmerAlert } from '@/features/Domaines/domaines.types';
import type { ItkParcelTasks } from '@/features/Parcelle/parcelle.types';

import type {
  ActivityStatus,
  ActivityType,
  AlertSeverity,
  AlertType,
  DomainAlert,
  PlannedActivity,
} from './dashboard.types';

/** Type d'alerte backend (`weather|pest|disease|irrigation|ndvi|soil`) → icône app. */
const ALERT_TYPE: Record<string, AlertType> = {
  weather: 'rain',
  pest: 'disease',
  disease: 'disease',
  irrigation: 'soil_moisture',
  ndvi: 'drought',
  soil: 'soil_moisture',
};

/**
 * Normalise la sévérité backend. Le backend caste sans valider : les alertes OAD
 * peuvent renvoyer `high|medium|low` en plus de `critical|warning|info`. On
 * ramène tout aux 3 tons de l'app (défaut `info`) pour ne jamais planter le rendu.
 */
const SEVERITY: Record<string, AlertSeverity> = {
  critical: 'critical',
  high: 'critical',
  warning: 'warning',
  medium: 'warning',
  info: 'info',
  low: 'info',
};

/**
 * Alertes farmer (`GET /farmers/:id/alerts`) → alertes du tableau de bord.
 * On ne garde que les actives, triées de la plus récente à la plus ancienne.
 */
export function toDomainAlerts(alerts: FarmerAlert[], limit = 5): DomainAlert[] {
  return alerts
    .filter((a) => a.status === 'active')
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit)
    .map((a) => ({
      id: a.id,
      domainName: a.parcelName ?? a.farmName,
      severity: SEVERITY[a.severity] ?? 'info',
      type: ALERT_TYPE[a.type] ?? 'rain',
      message: a.title || a.message,
      createdAt: a.createdAt,
    }));
}

/** Type de tâche ITK → type d'activité (icône). */
const ITK_ACTIVITY_TYPE: Record<string, ActivityType> = {
  observation: 'inspection',
  monitoring: 'inspection',
  fertilisation: 'treatment',
  fertilization: 'treatment',
  weeding: 'treatment',
  treatment: 'treatment',
  harvest: 'harvest',
  planting: 'sowing',
  sowing: 'sowing',
  irrigation: 'irrigation',
};

/** État d'une tâche ITK → statut d'activité (l'ITK n'a pas d'« en cours »). */
const ITK_STATE_STATUS: Record<string, ActivityStatus> = {
  completed: 'done',
  pending: 'todo',
  overdue: 'todo',
  upcoming: 'todo',
  manual: 'todo',
};

/** Plan ITK d'une parcelle + son nom (pour l'agrégation des activités). */
export interface ParcelItk {
  itk: ItkParcelTasks;
  parcelName: string;
}

/**
 * Tâches ITK du **stade courant** de chaque parcelle → activités planifiées.
 * On agrège les parcelles en campagne active, on trie par échéance croissante
 * (les tâches en retard, fenêtre la plus ancienne, remontent en tête).
 */
export function toActivities(items: ParcelItk[], limit = 6): PlannedActivity[] {
  const activities: PlannedActivity[] = [];

  for (const { itk, parcelName } of items) {
    if (!itk.hasActiveCampaign) continue;
    const current = itk.stages.find((s) => s.stageCode === itk.currentStage?.stageCode);
    if (!current) continue;

    for (const t of [...current.tasks.mandatory, ...current.tasks.recommended]) {
      const scheduledAt = t.windowStart ?? t.windowEnd ?? current.expectedStart;
      if (!scheduledAt) continue;
      activities.push({
        id: `${itk.parcelId}:${t.taskId}`,
        title: t.title,
        domainName: parcelName,
        type: ITK_ACTIVITY_TYPE[t.type] ?? 'inspection',
        scheduledAt,
        status: ITK_STATE_STATUS[t.state] ?? 'todo',
      });
    }
  }

  return activities.sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt)).slice(0, limit);
}
