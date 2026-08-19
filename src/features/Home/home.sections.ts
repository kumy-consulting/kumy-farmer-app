import dayjs, { type Dayjs } from 'dayjs';

import type { AlertSeverity } from '@/features/Domaines/domaines.types';

import type { FeedItem, FeedItemDraft } from './home.feed.types';

/**
 * Répartition du fil d'exploitation en trois sections : Alertes, Tâches, Visites.
 *
 * Tout est calculé ici, en pur, à partir des `FeedItemDraft` produits par les
 * mappers — aucune dépendance à React ni au réseau, donc testable directement.
 */

/** Absence de sévérité = rang 3 : une simple tâche passe après une info. */
const SEVERITY_RANK: Record<AlertSeverity, number> = { critical: 0, warning: 1, info: 2 };

/**
 * Au-delà, une alerte n'informe plus sur la parcelle d'aujourd'hui : elle raconte
 * une anomalie que personne n'a traitée. Le backend n'expose aucune date de
 * péremption, on la dérive donc de l'âge.
 */
export const ALERT_FRESH_DAYS = 7;

export type TaskSegment = 'inProgress' | 'overdue' | 'planned';

export const TASK_SEGMENT_LABEL: Record<TaskSegment, string> = {
  inProgress: 'En cours',
  overdue: 'En retard',
  planned: 'Prévu',
};

/** Ordre d'affichage des compteurs, et ordre de repli du segment ouvert par défaut. */
export const TASK_SEGMENTS: TaskSegment[] = ['inProgress', 'overdue', 'planned'];

export interface AlertsSection {
  /** Alertes actives et fraîches, dédoublonnées, de la plus récente à la plus ancienne. */
  fresh: FeedItem[];
  /** Actives mais trop anciennes pour parler du terrain d'aujourd'hui. */
  stale: FeedItem[];
}

export interface TasksSection {
  counts: Record<TaskSegment, number>;
  bySegment: Record<TaskSegment, FeedItem[]>;
  /** Consignes cochées aujourd'hui — hors compteurs, gardées comme confirmation. */
  doneToday: FeedItem[];
  total: number;
}

export interface VisitsSection {
  /** Dernière visite reconstituée depuis les consignes qui en sont issues. */
  last: FeedItem | null;
  /**
   * Toujours `null` : aucun endpoint de visite n'est ouvert au rôle FARMER, donc
   * la prochaine visite est inconnue. On l'affiche comme telle plutôt que de
   * l'inventer.
   */
  next: null;
}

export interface HomeSections {
  alerts: AlertsSection;
  tasks: TasksSection;
  visits: VisitsSection;
  /** Vrai quand les trois sections sont vides — l'accueil n'a rien à dire. */
  isEmpty: boolean;
}

/** Rang d'urgence : gravité d'abord, puis ampleur du retard. */
export function scoreOf(item: FeedItemDraft): number {
  const severity = item.severity ? (SEVERITY_RANK[item.severity] ?? 3) : 3;
  const overdue = Math.min(item.daysOverdue ?? 0, 99);
  return severity * 100 - overdue;
}

/** Segment d'une tâche : le retard prime sur l'avancement, qui prime sur le reste. */
export function segmentOf(item: FeedItem): TaskSegment {
  if (item.overdue || item.urgentNow) return 'overdue';
  if (item.status === 'in_progress') return 'inProgress';
  return 'planned';
}

/**
 * Le backend émet une alerte par détection : une même anomalie sur une même
 * parcelle revient à l'identique jour après jour. On ne garde que la plus
 * récente de chaque (parcelle, nature, intitulé).
 */
function dedupe(items: FeedItem[]): FeedItem[] {
  const seen = new Map<string, FeedItem>();

  for (const item of items) {
    const key = `${item.place}|${item.icon}|${item.title}`;
    const kept = seen.get(key);
    if (!kept || item.at.localeCompare(kept.at) > 0) seen.set(key, item);
  }

  return [...seen.values()];
}

const byRecency = (a: FeedItem, b: FeedItem): number => b.at.localeCompare(a.at) || a.id.localeCompare(b.id);
const byUrgency = (a: FeedItem, b: FeedItem): number =>
  a.score - b.score || a.at.localeCompare(b.at) || a.id.localeCompare(b.id);

/** Répartit les éléments du fil en sections prêtes à rendre. */
export function buildSections(drafts: FeedItemDraft[], now: Dayjs = dayjs()): HomeSections {
  const items: FeedItem[] = drafts.map((draft) => ({ ...draft, score: scoreOf(draft) }));

  const alerts = dedupe(items.filter((item) => item.kind === 'alert')).sort(byRecency);
  const fresh = alerts.filter((item) => now.diff(dayjs(item.at), 'day') <= ALERT_FRESH_DAYS);
  const stale = alerts.filter((item) => now.diff(dayjs(item.at), 'day') > ALERT_FRESH_DAYS);

  const actionable = items.filter(
    (item) => item.kind === 'task' || item.kind === 'itk' || item.kind === 'window',
  );
  const doneToday = actionable.filter((item) => item.status === 'done').sort(byUrgency);
  const pending = actionable.filter((item) => item.status !== 'done');

  const bySegment: Record<TaskSegment, FeedItem[]> = { inProgress: [], overdue: [], planned: [] };
  for (const item of pending) bySegment[segmentOf(item)].push(item);
  for (const segment of TASK_SEGMENTS) bySegment[segment].sort(byUrgency);

  const visits = items.filter((item) => item.kind === 'visit').sort(byRecency);

  return {
    alerts: { fresh, stale },
    tasks: {
      counts: {
        inProgress: bySegment.inProgress.length,
        overdue: bySegment.overdue.length,
        planned: bySegment.planned.length,
      },
      bySegment,
      doneToday,
      total: pending.length,
    },
    visits: { last: visits[0] ?? null, next: null },
    isEmpty: fresh.length === 0 && stale.length === 0 && actionable.length === 0 && visits.length === 0,
  };
}

/** Segment ouvert à l'arrivée : le plus urgent qui contient quelque chose. */
export function defaultSegment(counts: Record<TaskSegment, number>): TaskSegment {
  if (counts.overdue > 0) return 'overdue';
  if (counts.inProgress > 0) return 'inProgress';
  return 'planned';
}
