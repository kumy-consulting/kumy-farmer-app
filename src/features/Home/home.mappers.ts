import dayjs, { type Dayjs } from 'dayjs';

import type { FarmerAlert } from '@/features/Domaines/domaines.types';
import type { FieldTask, FieldTaskType } from '@/features/FieldTasks/fieldTasks.types';
import type { ItkParcelTasks, ItkTask } from '@/features/Parcelle/parcelle.types';

import type {
  ActivityStatus,
  ActivityType,
  AlertSeverity,
  AlertType,
  DomainAlert,
  PlannedActivity,
} from './dashboard.types';
import type { FeedIcon, FeedItemDraft } from './home.feed.types';

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

/** Index des noms lisibles, alimenté au fil des vagues de chargement. */
export interface NameIndex {
  parcels: Map<string, string>;
  farms: Map<string, string>;
}

/** Type de consigne → pictogramme de la carte. */
const TASK_ICON: Record<FieldTaskType, FeedIcon> = {
  weeding: 'treatment',
  fertilization: 'treatment',
  treatment: 'treatment',
  irrigation: 'irrigation',
  sowing: 'sowing',
  harvest: 'harvest',
  other: 'inspection',
};

/** Type d'alerte backend → pictogramme. */
const ALERT_ICON: Record<string, FeedIcon> = {
  weather: 'rain',
  pest: 'disease',
  disease: 'disease',
  irrigation: 'soil_moisture',
  ndvi: 'drought',
  soil: 'soil_moisture',
};

/**
 * Consignes de terrain → éléments du fil.
 *
 * Seule source actionnable : l'agriculteur peut la démarrer et la terminer.
 * Une consigne terminée reste visible le jour même (elle ne doit pas disparaître
 * sous le doigt), puis sort du fil.
 */
export function fieldTasksToFeed(tasks: FieldTask[], names: NameIndex, now: Dayjs = dayjs()): FeedItemDraft[] {
  return tasks
    .filter((task) => task.status !== 'done' || (task.completedAt != null && dayjs(task.completedAt).isSame(now, 'day')))
    .map((task) => {
      const parcelName = task.parcelId ? names.parcels.get(task.parcelId) : undefined;
      const farmName = names.farms.get(task.farmId);
      const unmet = task.prerequisitesResolved?.filter((p) => !p.satisfied).map((p) => p.label);

      return {
        id: `task:${task.id}`,
        kind: 'task',
        title: task.title,
        place: parcelName ?? farmName ?? 'Mon exploitation',
        icon: TASK_ICON[task.type] ?? 'inspection',
        advice: task.description || undefined,
        at: `${task.dueDate}T00:00:00`,
        status: task.status,
        overdue: task.overdue,
        daysOverdue: task.daysOverdue,
        actionable: true,
        author: task.createdByName ?? undefined,
        unmetPrerequisites: unmet && unmet.length > 0 ? unmet : undefined,
        target: task.parcelId ? `/domaines/${task.farmId}/parcelles/${task.parcelId}` : `/domaines/${task.farmId}`,
      } satisfies FeedItemDraft;
    });
}

/**
 * Alertes actives → éléments du fil. La sévérité passe par la normalisation
 * `SEVERITY` déjà en place (le backend renvoie parfois `high|medium|low`).
 */
export function alertsToFeed(alerts: FarmerAlert[]): FeedItemDraft[] {
  return alerts
    .filter((alert) => alert.status === 'active')
    .map((alert) => ({
      id: `alert:${alert.id}`,
      kind: 'alert',
      title: alert.title || alert.message,
      place: alert.parcelName ?? alert.farmName,
      icon: ALERT_ICON[alert.type] ?? 'rain',
      advice: alert.recommendedAction,
      at: alert.createdAt,
      severity: SEVERITY[alert.severity] ?? 'info',
      target: alert.parcelId
        ? `/domaines/${alert.farmId}/parcelles/${alert.parcelId}`
        : `/domaines/${alert.farmId}`,
    }));
}

/** Plan ITK d'une parcelle, avec de quoi nommer et router la carte. */
export interface ParcelItkSource {
  itk: ItkParcelTasks;
  parcelName: string;
  farmId: string;
}

export interface ItkFeedContext {
  now: Dayjs;
  /** Domaines dont le kit mesure de la pluie ou du vent fort en ce moment. */
  unfavourableFarmIds: Set<string>;
}

/** Types de tâches ITK qui méritent une fenêtre de traitement. */
const WINDOW_TYPES = new Set(['treatment', 'fertilisation', 'fertilization', 'weeding', 'irrigation']);

/** Type de tâche ITK → pictogramme. */
const ITK_ICON: Record<string, FeedIcon> = {
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

/** « Urée 150 kg/ha · KCl 50 kg/ha » — vide si la tâche n'a pas d'intrant. */
function inputsSummary(task: ItkTask): string {
  return task.inputs.map((input) => `${input.product} ${input.dosePerHa} ${input.unit}/ha`).join(' · ');
}

/**
 * Tâches ITK du **stade courant** → éléments du fil.
 *
 * Une tâche d'un type traitable (`WINDOW_TYPES` : `treatment | fertilisation |
 * fertilization | weeding | irrigation`) dont la fenêtre est datée, ouverte (ou
 * s'ouvre sous 24 h) et se ferme sous 7 jours, est **promue** en carte
 * « fenêtre de traitement » : elle n'apparaît donc jamais deux fois. Les
 * intrants ne conditionnent pas la promotion — ils enrichissent seulement le
 * conseil affiché. On ne prédit rien — la prévision météo est inaccessible au
 * rôle FARMER — on se contente de dater la fenêtre agronomique et de
 * mentionner ce que le kit mesure à l'instant.
 */
export function itkToFeed(sources: ParcelItkSource[], ctx: ItkFeedContext): FeedItemDraft[] {
  const items: FeedItemDraft[] = [];

  for (const { itk, parcelName, farmId } of sources) {
    if (!itk.hasActiveCampaign) continue;
    const stage = itk.stages.find((s) => s.stageCode === itk.currentStage?.stageCode);
    if (!stage) continue;

    const target = `/domaines/${farmId}/parcelles/${itk.parcelId}`;

    for (const task of [...stage.tasks.mandatory, ...stage.tasks.recommended]) {
      if (task.state === 'completed') continue;

      const at = task.windowStart ?? task.windowEnd ?? stage.expectedStart;

      const icon = ITK_ICON[task.type] ?? 'inspection';
      const end = task.windowEnd ? dayjs(task.windowEnd) : null;
      const start = task.windowStart ? dayjs(task.windowStart) : null;
      const inputs = inputsSummary(task);

      const isOpenWindow =
        WINDOW_TYPES.has(task.type) &&
        end !== null &&
        end.isAfter(ctx.now) &&
        end.diff(ctx.now, 'day') <= 7 &&
        (start === null || start.diff(ctx.now, 'hour') <= 24);

      if (isOpenWindow && end) {
        const closingSoon = end.diff(ctx.now, 'hour') < 48;
        items.push({
          id: `window:${itk.parcelId}:${task.taskId}`,
          kind: 'window',
          title: task.title,
          place: parcelName,
          icon: 'window',
          advice: [`Jusqu’au ${end.format('DD/MM')}`, inputs].filter(Boolean).join(' · '),
          note: ctx.unfavourableFarmIds.has(farmId)
            ? 'Conditions défavorables en ce moment — mesuré par le kit'
            : undefined,
          at: end.toISOString(),
          urgentNow: closingSoon || undefined,
          target,
        });
        continue;
      }

      const missed = end !== null && end.isBefore(ctx.now);
      items.push({
        id: `itk:${itk.parcelId}:${task.taskId}`,
        kind: 'itk',
        title: task.title,
        place: parcelName,
        icon,
        advice: missed ? 'Fenêtre dépassée' : inputs || task.timing || undefined,
        at,
        urgentNow: missed || undefined,
        target,
      });
    }
  }

  return items;
}
