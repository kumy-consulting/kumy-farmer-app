import dayjs from 'dayjs';
import { describe, expect, it } from 'vitest';

import type { FeedItem, FeedItemDraft } from './home.feed.types';
import { buildSections, defaultSegment, segmentOf } from './home.sections';

const NOW = dayjs('2026-08-19T09:00:00.000Z');

const draft = (over: Partial<FeedItemDraft> & Pick<FeedItemDraft, 'id' | 'at'>): FeedItemDraft => ({
  kind: 'task',
  title: 'Tâche',
  place: 'Kaporo 1',
  icon: 'inspection',
  ...over,
});

const alert = (over: Partial<FeedItemDraft> & Pick<FeedItemDraft, 'id' | 'at'>): FeedItemDraft =>
  draft({ kind: 'alert', icon: 'rain', severity: 'critical', title: 'Stress hydrique', ...over });

describe('buildSections — alertes', () => {
  it('ne garde que les alertes fraîches et écarte les périmées', () => {
    const { alerts } = buildSections(
      [
        alert({ id: 'alert:frais', at: '2026-08-18T09:00:00.000Z', title: 'Stress hydrique' }),
        alert({ id: 'alert:vieux', at: '2026-06-14T09:00:00.000Z', title: 'Carence azotée' }),
      ],
      NOW,
    );

    expect(alerts.fresh.map((a) => a.id)).toEqual(['alert:frais']);
    expect(alerts.stale.map((a) => a.id)).toEqual(['alert:vieux']);
  });

  it('garde une alerte d’exactement 7 jours, écarte celle de 8 jours', () => {
    const { alerts } = buildSections(
      [
        alert({ id: 'alert:j7', at: '2026-08-12T09:00:00.000Z', title: 'Sept jours' }),
        alert({ id: 'alert:j8', at: '2026-08-11T09:00:00.000Z', title: 'Huit jours' }),
      ],
      NOW,
    );

    expect(alerts.fresh.map((a) => a.id)).toEqual(['alert:j7']);
    expect(alerts.stale.map((a) => a.id)).toEqual(['alert:j8']);
  });

  it('dédoublonne la même anomalie répétée sur la même parcelle et garde la plus récente', () => {
    const { alerts } = buildSections(
      [
        alert({ id: 'alert:1', at: '2026-08-15T09:00:00.000Z', title: 'Phytophthora ananas' }),
        alert({ id: 'alert:2', at: '2026-08-17T09:00:00.000Z', title: 'Phytophthora ananas' }),
        alert({ id: 'alert:3', at: '2026-08-16T09:00:00.000Z', title: 'Phytophthora ananas' }),
      ],
      NOW,
    );

    expect(alerts.fresh).toHaveLength(1);
    expect(alerts.fresh[0].id).toBe('alert:2');
  });

  it('distingue la même anomalie sur deux parcelles différentes', () => {
    const { alerts } = buildSections(
      [
        alert({ id: 'alert:a', at: '2026-08-17T09:00:00.000Z', place: 'Kaporo 1' }),
        alert({ id: 'alert:b', at: '2026-08-17T09:00:00.000Z', place: 'Kaporo 2' }),
      ],
      NOW,
    );

    expect(alerts.fresh).toHaveLength(2);
  });

  it('trie de la plus récente à la plus ancienne', () => {
    const { alerts } = buildSections(
      [
        alert({ id: 'alert:hier', at: '2026-08-18T09:00:00.000Z', title: 'Hier' }),
        alert({ id: 'alert:aujourdhui', at: '2026-08-19T08:00:00.000Z', title: 'Aujourd’hui' }),
      ],
      NOW,
    );

    expect(alerts.fresh.map((a) => a.id)).toEqual(['alert:aujourdhui', 'alert:hier']);
  });
});

describe('buildSections — tâches', () => {
  it('compte et répartit les tâches par segment', () => {
    const { tasks } = buildSections(
      [
        draft({ id: 'task:1', at: '2026-08-17T00:00:00', overdue: true, daysOverdue: 2, status: 'planned' }),
        draft({ id: 'task:2', at: '2026-08-19T00:00:00', status: 'in_progress' }),
        draft({ id: 'task:3', at: '2026-08-22T00:00:00', status: 'planned' }),
        draft({ id: 'window:1', at: '2026-08-20T00:00:00', kind: 'window', urgentNow: true }),
      ],
      NOW,
    );

    expect(tasks.counts).toEqual({ inProgress: 1, overdue: 2, planned: 1 });
    expect(tasks.bySegment.overdue.map((t) => t.id)).toEqual(['task:1', 'window:1']);
    expect(tasks.bySegment.inProgress.map((t) => t.id)).toEqual(['task:2']);
    expect(tasks.total).toBe(4);
  });

  it('sort les consignes cochées des compteurs sans les faire disparaître', () => {
    const { tasks } = buildSections(
      [
        draft({ id: 'task:fait', at: '2026-08-19T00:00:00', status: 'done' }),
        draft({ id: 'task:reste', at: '2026-08-19T00:00:00', status: 'planned' }),
      ],
      NOW,
    );

    expect(tasks.counts).toEqual({ inProgress: 0, overdue: 0, planned: 1 });
    expect(tasks.doneToday.map((t) => t.id)).toEqual(['task:fait']);
  });

  it('classe le retard avant l’avancement', () => {
    const started = { id: 'task:x', at: '2026-08-17T00:00:00', status: 'in_progress' as const, overdue: true };
    expect(segmentOf({ ...draft(started), score: 0 } as FeedItem)).toBe('overdue');
  });
});

describe('buildSections — visites', () => {
  it('retient la visite la plus récente et n’invente pas la prochaine', () => {
    const { visits } = buildSections(
      [
        draft({ id: 'visit:1', at: '2026-08-05T09:00:00.000Z', kind: 'visit', icon: 'visit' }),
        draft({ id: 'visit:2', at: '2026-08-12T09:00:00.000Z', kind: 'visit', icon: 'visit' }),
      ],
      NOW,
    );

    expect(visits.last?.id).toBe('visit:2');
    expect(visits.next).toBeNull();
  });
});

describe('buildSections — vide', () => {
  it('signale un accueil sans rien à dire', () => {
    expect(buildSections([], NOW).isEmpty).toBe(true);
  });

  it('ne se dit pas vide quand seules des alertes périmées subsistent', () => {
    const sections = buildSections([alert({ id: 'alert:vieux', at: '2026-06-14T09:00:00.000Z' })], NOW);
    expect(sections.isEmpty).toBe(false);
  });
});

describe('defaultSegment', () => {
  it('ouvre sur le segment le plus urgent qui contient quelque chose', () => {
    expect(defaultSegment({ inProgress: 2, overdue: 1, planned: 5 })).toBe('overdue');
    expect(defaultSegment({ inProgress: 2, overdue: 0, planned: 5 })).toBe('inProgress');
    expect(defaultSegment({ inProgress: 0, overdue: 0, planned: 5 })).toBe('planned');
    expect(defaultSegment({ inProgress: 0, overdue: 0, planned: 0 })).toBe('planned');
  });
});
