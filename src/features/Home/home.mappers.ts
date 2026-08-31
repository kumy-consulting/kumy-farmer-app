import dayjs, { type Dayjs } from 'dayjs';

import type { AlertSeverity, FarmerAlert, FarmerVisit } from '@/features/Domaines/domaines.types';
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
  /** parcelId → culture en cours. Absent tant que la vague 2 n'a pas répondu. */
  crops: Map<string, string>;
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
    .filter(
      (task) => task.status !== 'done' || (task.completedAt != null && dayjs(task.completedAt).isSame(now, 'day')),
    )
    .map((task) => {
      const parcelName = task.parcelId ? names.parcels.get(task.parcelId) : undefined;
      const farmName = names.farms.get(task.farmId);
      const unmet = task.prerequisitesResolved?.filter((p) => !p.satisfied).map((p) => p.label);

      return {
        id: `task:${task.id}`,
        kind: 'task',
        title: task.title,
        place: parcelName ?? farmName ?? 'Mon exploitation',
        perimetre: {
          domaine: farmName,
          parcelle: parcelName,
          culture: task.parcelId ? names.crops.get(task.parcelId) : undefined,
        },
        icon: TASK_ICON[task.type] ?? 'inspection',
        advice: task.description || undefined,
        // Une consigne cochée se lit à l'heure où elle a été faite ; les autres
        // à leur échéance, qui est un jour et non un instant.
        at: task.status === 'done' && task.completedAt ? task.completedAt : `${task.dueDate}T00:00:00`,
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
export function alertsToFeed(alerts: FarmerAlert[], names: NameIndex): FeedItemDraft[] {
  return alerts.filter(isActiveAlert).map((alert) => ({
    id: `alert:${alert.id}`,
    kind: 'alert',
    title: alert.title || alert.message,
    place: alert.parcelName ?? alert.farmName,
    perimetre: {
      domaine: alert.farmName,
      parcelle: alert.parcelName,
      culture: alert.parcelId ? names.crops.get(alert.parcelId) : undefined,
    },
    icon: ALERT_ICON[alert.type] ?? 'rain',
    advice: alert.recommendedAction,
    at: alert.createdAt,
    severity: normalizeSeverity(alert.severity),
    target: alert.parcelId ? `/domaines/${alert.farmId}/parcelles/${alert.parcelId}` : `/domaines/${alert.farmId}`,
  }));
}

/** Plan ITK d'une parcelle, avec de quoi nommer et router la carte. */
export interface ParcelItkSource {
  itk: ItkParcelTasks;
  parcelName: string;
  farmId: string;
  farmName?: string;
  culture?: string;
}

/** Ce qui a établi que les conditions sont défavorables sur un domaine. */
export type UnfavourableSource = 'kit' | 'satellite';

/**
 * La source change ce que l'app a le droit d'affirmer : un kit mesure l'instant
 * sur place, le satellite donne une estimation à la journée. Créditer le kit
 * d'une estimation satellite serait faux — et un agriculteur qui n'a pas de kit
 * ne comprendrait pas d'où sort la mention.
 */
const UNFAVOURABLE_NOTE: Record<UnfavourableSource, string> = {
  kit: 'Conditions défavorables en ce moment — mesuré par le kit',
  satellite: 'Conditions défavorables aujourd’hui — estimation satellite',
};

export interface ItkFeedContext {
  now: Dayjs;
  /** Domaines aux conditions défavorables, et par quoi on le sait. */
  unfavourable: Map<string, UnfavourableSource>;
}

const unfavourableNote = (ctx: ItkFeedContext, farmId: string): string | undefined => {
  const source = ctx.unfavourable.get(farmId);
  return source ? UNFAVOURABLE_NOTE[source] : undefined;
};

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
  return task.inputs
    .map((input) => {
      // Le catalogue ITK renvoie tantôt « kg », tantôt « kg/ha » : ajouter
      // « /ha » sans regarder produisait « 1.2 l/ha/ha » sur l'écran.
      const unite = /\/\s*ha$/i.test(input.unit) ? input.unit : `${input.unit}/ha`;
      return `${input.product} ${input.dosePerHa} ${unite}`;
    })
    .join(' · ');
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

  for (const { itk, parcelName, farmId, farmName, culture } of sources) {
    if (!itk.hasActiveCampaign) continue;
    const stage = itk.stages.find((s) => s.stageCode === itk.currentStage?.stageCode);
    if (!stage) continue;

    const target = `/domaines/${farmId}/parcelles/${itk.parcelId}`;
    const perimetre = { domaine: farmName, parcelle: parcelName, culture };

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
          perimetre,
          icon: 'window',
          // La borne de fenêtre n'est plus ici : l'échéance de la carte la dit en
          // toutes lettres (« Dernier jour : demain »), et « Jusqu'au 22/08 »
          // juste en dessous la répétait en chiffres. Reste ce que le conseil
          // est seul à porter : les intrants.
          advice: inputs || undefined,
          note: unfavourableNote(ctx, farmId),
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
        perimetre,
        icon,
        // Le retard n'est plus écrit ici : l'échéance le date (« En retard
        // depuis le 31 mai »), et « Fenêtre dépassée » sous cette ligne ne
        // faisait que la répéter dans un mot de système. Le conseil garde sa
        // place pour ce qu'il est seul à dire — les intrants, le moment.
        advice: inputs || task.timing || undefined,
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
 * Où le passage est raconté : le carnet de la parcelle visitée.
 *
 * Le carnet se tient par parcelle — c'est là que les constats, les photos et les
 * consignes du technicien sont datés. Sans parcelle, il n'y a pas de carnet à
 * ouvrir : le domaine est le plus près qu'on sache faire.
 */
const carnetDe = (farmId: string | null, parcelId?: string | null): string | undefined => {
  if (!farmId) return undefined;
  return parcelId ? `/domaines/${farmId}/parcelles/${parcelId}?onglet=carnet` : `/domaines/${farmId}`;
};

/** Instant de référence d'une visite faite : elle est datée de sa fin. */
const quandFaite = (visit: FarmerVisit): string | null =>
  visit.endedAt ?? visit.startedAt ?? visit.scheduledFor;

/**
 * Comptes rendus de visite.
 *
 * Deux sources, et une seule carte par visite :
 *
 * 1. **`GET /farmers/:id/visits`** (`faites`) fait autorité. Une visite y existe
 *    dès qu'elle a eu lieu, avec le nom du technicien — même si elle n'a laissé
 *    aucune consigne derrière elle.
 * 2. **Les consignes portant un `visitId`** complètent : elles seules disent
 *    combien de travail la visite a laissé, et où il en est.
 *
 * Le fil ne s'est longtemps appuyé que sur la source 2, faute d'endpoint. Une
 * visite sans consigne restait donc invisible, et « Aucune enregistrée »
 * s'affichait alors que le technicien était bien passé.
 *
 * Le plafond d'âge ne vaut que pour la reconstitution : dès que l'API confirme
 * la visite, ni elle ni ses consignes ne sont écartées pour leur âge. Un fait
 * daté n'est pas une déduction, et la fiche d'accompagnement doit pouvoir nommer
 * le dernier passage même s'il remonte à la saison dernière.
 *
 * **La parcelle du carnet** se cherche dans cet ordre : celle que la visite
 * déclare (`parcelIds`), à défaut celle qu'une de ses consignes désigne, à
 * défaut celle où le GPS a validé le passage (`visitedParcelId`). L'app
 * technicien n'envoie pas `parcelIds` : sans les deux replis, le lien retomberait
 * toujours sur le domaine.
 */
export function visitsToFeed(
  tasks: FieldTask[],
  names: NameIndex,
  now: Dayjs = dayjs(),
  faites: FarmerVisit[] = [],
): FeedItemDraft[] {
  const byVisit = new Map<string, FieldTask[]>();

  for (const task of tasks) {
    if (!task.visitId) continue;
    const bucket = byVisit.get(task.visitId);
    if (bucket) bucket.push(task);
    else byVisit.set(task.visitId, [task]);
  }

  const confirmees = new Set(faites.filter((v) => v.status === 'done').map((v) => v.id));
  const items: FeedItemDraft[] = [];
  /** Parcelle retenue par visite — c'est elle qui désigne le carnet à ouvrir. */
  const parcelleDe = new Map<string, string>();

  for (const [visitId, group] of byVisit) {
    const sorted = [...group].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    const first = sorted[0];
    if (!confirmees.has(visitId) && now.diff(dayjs(first.createdAt), 'day') > VISIT_MAX_AGE_DAYS) continue;

    const done = group.filter((t) => t.status === 'done').length;
    const author = first.createdByName ?? 'votre technicien';
    // La première consigne qui nomme une parcelle, pas la première consigne :
    // une visite peut ouvrir sur une tâche de domaine et n'atterrir sur une
    // parcelle qu'ensuite — c'est pourtant elle qui tient le carnet.
    const parcelId = sorted.find((t) => t.parcelId)?.parcelId ?? undefined;
    if (parcelId) parcelleDe.set(visitId, parcelId);
    const parcelName = parcelId ? names.parcels.get(parcelId) : undefined;
    // Accord en nombre : singulier pour 0 et 1, pluriel au-delà (0 faite, 1 consigne, 2 consignes).
    const consigneLabel = group.length > 1 ? 'consignes' : 'consigne';
    const doneLabel = done > 1 ? 'faites' : 'faite';

    items.push({
      id: `visit:${visitId}`,
      kind: 'visit',
      title: `Visite de ${author}`,
      place: parcelName ?? names.farms.get(first.farmId) ?? 'Mon exploitation',
      perimetre: {
        domaine: names.farms.get(first.farmId),
        parcelle: parcelName,
        culture: parcelId ? names.crops.get(parcelId) : undefined,
      },
      icon: 'visit',
      advice: `${group.length} ${consigneLabel} · ${done} ${doneLabel}`,
      at: first.createdAt,
      author: first.createdByName ?? undefined,
      visit: { id: visitId, author, date: first.createdAt, total: group.length, done },
      target: carnetDe(first.farmId, parcelId),
    });
  }

  // Les visites servies par l'API, ensuite : elles ajoutent celles qu'aucune
  // consigne ne trahissait, et corrigent les autres avec ce que le serveur sait
  // de mieux — le nom du technicien, la date de fin, le domaine visité.
  for (const visite of faites) {
    if (visite.status !== 'done') continue;
    const at = quandFaite(visite);
    if (!at) continue;

    const nom = visite.technicianName ?? undefined;
    const auteur = nom ?? 'votre technicien';
    const domaine = visite.farmName ?? (visite.farmId ? names.farms.get(visite.farmId) : undefined);
    const existant = items.find((item) => item.id === `visit:${visite.id}`);
    const parcelle = visite.parcelIds[0] ?? parcelleDe.get(visite.id) ?? visite.visitedParcelId ?? undefined;

    if (existant) {
      existant.title = `Visite de ${auteur}`;
      existant.author = nom;
      existant.at = at;
      existant.perimetre = { ...existant.perimetre, domaine: domaine ?? existant.perimetre.domaine };
      if (existant.visit) existant.visit = { ...existant.visit, author: auteur, date: at };
      existant.target = carnetDe(visite.farmId, parcelle) ?? existant.target;
      continue;
    }

    items.push({
      id: `visit:${visite.id}`,
      kind: 'visit',
      title: `Visite de ${auteur}`,
      place: domaine ?? 'Mon exploitation',
      perimetre: { domaine },
      icon: 'visit',
      at,
      author: nom,
      // Pas de compte de consignes : cette visite n'en a laissé aucune, et
      // annoncer « 0 consigne » ferait passer un passage utile pour un vide.
      visit: { id: visite.id, author: auteur, date: at, total: 0, done: 0 },
      target: carnetDe(visite.farmId, parcelle),
    });
  }

  return items;
}
