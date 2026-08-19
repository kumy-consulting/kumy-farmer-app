import dayjs, { type Dayjs } from 'dayjs';

import type { AlertSeverity, FarmerAlert } from '@/features/Domaines/domaines.types';
import type { FieldTask, FieldTaskType } from '@/features/FieldTasks/fieldTasks.types';
import type { ItkParcelTasks, ItkTask } from '@/features/Parcelle/parcelle.types';

import type { FeedIcon, FeedItemDraft } from './home.feed.types';

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
 * Normalise une sévérité backend vers les 3 tons connus de l'app (défaut `info`).
 * Source de vérité unique — `useHomeFeed.healthOf` la consomme aussi, pour que le
 * bandeau récap ne puisse jamais contredire le fil.
 */
export function normalizeSeverity(severity: string): AlertSeverity {
  return SEVERITY[severity] ?? 'info';
}

/** Alerte encore active — même filtre que `alertsToFeed`, à réutiliser partout où on lit les alertes. */
export function isActiveAlert(alert: FarmerAlert): boolean {
  return alert.status === 'active';
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
    .filter(isActiveAlert)
    .map((alert) => ({
      id: `alert:${alert.id}`,
      kind: 'alert',
      title: alert.title || alert.message,
      place: alert.parcelName ?? alert.farmName,
      icon: ALERT_ICON[alert.type] ?? 'rain',
      advice: alert.recommendedAction,
      at: alert.createdAt,
      severity: normalizeSeverity(alert.severity),
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

/** Au-delà, un compte rendu n'a plus sa place sur l'accueil. */
const VISIT_MAX_AGE_DAYS = 21;

/**
 * Comptes rendus de visite, reconstitués depuis les consignes.
 *
 * Aucun endpoint de visite n'est ouvert au rôle FARMER : on regroupe les
 * consignes par `visitId`, la date de visite étant la plus ancienne création du
 * groupe. La carte est un récapitulatif en lecture — les consignes elles-mêmes
 * restent dans le fil à leur place d'urgence, une consigne en retard ne doit pas
 * être enterrée dans un compte rendu.
 */
export function visitsToFeed(tasks: FieldTask[], names: NameIndex, now: Dayjs = dayjs()): FeedItemDraft[] {
  const byVisit = new Map<string, FieldTask[]>();

  for (const task of tasks) {
    if (!task.visitId) continue;
    const bucket = byVisit.get(task.visitId);
    if (bucket) bucket.push(task);
    else byVisit.set(task.visitId, [task]);
  }

  const items: FeedItemDraft[] = [];

  for (const [visitId, group] of byVisit) {
    const sorted = [...group].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    const first = sorted[0];
    if (now.diff(dayjs(first.createdAt), 'day') > VISIT_MAX_AGE_DAYS) continue;

    const done = group.filter((t) => t.status === 'done').length;
    const author = first.createdByName ?? 'votre encadreur';
    const parcelName = first.parcelId ? names.parcels.get(first.parcelId) : undefined;
    // Accord en nombre : singulier pour 0 et 1, pluriel au-delà (0 faite, 1 consigne, 2 consignes).
    const consigneLabel = group.length > 1 ? 'consignes' : 'consigne';
    const doneLabel = done > 1 ? 'faites' : 'faite';

    items.push({
      id: `visit:${visitId}`,
      kind: 'visit',
      title: `Visite de ${author}`,
      place: parcelName ?? names.farms.get(first.farmId) ?? 'Mon exploitation',
      icon: 'visit',
      advice: `${group.length} ${consigneLabel} · ${done} ${doneLabel}`,
      at: first.createdAt,
      author: first.createdByName ?? undefined,
      visit: { id: visitId, author, date: first.createdAt, total: group.length, done },
      target: `/domaines/${first.farmId}`,
    });
  }

  return items;
}
