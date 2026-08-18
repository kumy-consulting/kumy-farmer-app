import dayjs, { type Dayjs } from 'dayjs';

import type { AlertSeverity } from '@/features/Domaines/domaines.types';

import type { FeedBucket, FeedGroup, FeedItem, FeedItemDraft } from './home.feed.types';

const BUCKET_LABEL: Record<FeedBucket, string> = {
  now: 'À traiter maintenant',
  today: 'Aujourd’hui',
  week: 'Cette semaine',
  later: 'À venir',
};

const BUCKET_ORDER: FeedBucket[] = ['now', 'today', 'week', 'later'];

/** Absence de sévérité = rang 3 : une simple tâche passe après une info. */
const SEVERITY_RANK: Record<AlertSeverity, number> = { critical: 0, warning: 1, info: 2 };

/**
 * Groupe d'un élément. Trois raisons d'être épinglé en tête, et elles seules :
 * un retard, une alerte critique, une urgence métier calculée par le mapper
 * (fenêtre qui se ferme sous 48 h, tâche ITK dépassée).
 */
export function bucketOf(item: FeedItemDraft, now: Dayjs): FeedBucket {
  if (item.overdue || item.severity === 'critical' || item.urgentNow) return 'now';

  const at = dayjs(item.at);
  if (at.isBefore(now, 'day') || at.isSame(now, 'day')) return 'today';
  if (at.diff(now, 'day') <= 7) return 'week';
  return 'later';
}

/** Score de tri intra-groupe : plus petit = plus haut. */
export function scoreOf(item: FeedItemDraft): number {
  const severity = item.severity ? (SEVERITY_RANK[item.severity] ?? 3) : 3;
  const overdue = Math.min(item.daysOverdue ?? 0, 99);
  return severity * 100 - overdue;
}

/** Range les éléments en groupes ordonnés ; les groupes vides disparaissent. */
export function buildFeed(drafts: FeedItemDraft[], now: Dayjs = dayjs()): FeedGroup[] {
  const items: FeedItem[] = drafts.map((draft) => ({
    ...draft,
    bucket: bucketOf(draft, now),
    score: scoreOf(draft),
  }));

  return BUCKET_ORDER.map((bucket) => ({
    bucket,
    label: BUCKET_LABEL[bucket],
    items: items
      .filter((item) => item.bucket === bucket)
      .sort((a, b) => a.score - b.score || a.at.localeCompare(b.at) || a.id.localeCompare(b.id)),
  })).filter((group) => group.items.length > 0);
}

/**
 * Plafonne le fil tous groupes confondus (l'accueil montre l'essentiel ; « Voir
 * tout » déplie le reste sur place). Renvoie aussi le nombre d'éléments cachés.
 */
export function takeFirst(groups: FeedGroup[], limit: number): { groups: FeedGroup[]; hidden: number } {
  let left = limit;
  const kept: FeedGroup[] = [];

  for (const group of groups) {
    if (left <= 0) break;
    kept.push({ ...group, items: group.items.slice(0, left) });
    left -= Math.min(group.items.length, left);
  }

  const total = groups.reduce((count, group) => count + group.items.length, 0);
  return { groups: kept, hidden: Math.max(0, total - limit) };
}
