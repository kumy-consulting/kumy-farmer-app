import dayjs from 'dayjs';
import { describe, expect, it } from 'vitest';

import { buildFeed, takeFirst } from './home.feed';
import type { FeedItemDraft } from './home.feed.types';

const NOW = dayjs('2026-08-19T09:00:00.000Z');

const draft = (over: Partial<FeedItemDraft> & Pick<FeedItemDraft, 'id' | 'at'>): FeedItemDraft => ({
  kind: 'task',
  title: 'Tâche',
  place: 'Kaporo 1',
  icon: 'inspection',
  ...over,
});

describe('buildFeed', () => {
  it('épingle en « maintenant » les retards, les alertes critiques et les urgences métier', () => {
    const groups = buildFeed(
      [
        draft({ id: 'a', at: '2026-08-25T09:00:00.000Z', overdue: true, daysOverdue: 2 }),
        draft({ id: 'b', at: '2026-08-30T09:00:00.000Z', kind: 'alert', severity: 'critical' }),
        draft({ id: 'c', at: '2026-08-24T09:00:00.000Z', kind: 'window', urgentNow: true }),
        draft({ id: 'd', at: '2026-08-19T15:00:00.000Z' }),
      ],
      NOW,
    );

    expect(groups[0].bucket).toBe('now');
    expect(groups[0].label).toBe('À traiter maintenant');
    expect(groups[0].items.map((i) => i.id)).toEqual(['b', 'a', 'c']);
    expect(groups[1].bucket).toBe('today');
    expect(groups[1].items.map((i) => i.id)).toEqual(['d']);
  });

  it('range le reste par horizon : aujourd\'hui, cette semaine, à venir', () => {
    const groups = buildFeed(
      [
        draft({ id: 'today', at: '2026-08-19T18:00:00.000Z' }),
        draft({ id: 'week', at: '2026-08-23T09:00:00.000Z' }),
        draft({ id: 'later', at: '2026-09-30T09:00:00.000Z' }),
      ],
      NOW,
    );

    expect(groups.map((g) => g.bucket)).toEqual(['today', 'week', 'later']);
    expect(groups.map((g) => g.label)).toEqual(['Aujourd\'hui', 'Cette semaine', 'À venir']);
  });

  it('trie par gravité, puis retard décroissant, puis échéance croissante', () => {
    const groups = buildFeed(
      [
        draft({ id: 'r1', at: '2026-08-18T09:00:00.000Z', overdue: true, daysOverdue: 1 }),
        draft({ id: 'r5', at: '2026-08-14T09:00:00.000Z', overdue: true, daysOverdue: 5 }),
        draft({ id: 'warn', at: '2026-08-19T09:00:00.000Z', kind: 'alert', severity: 'warning', urgentNow: true }),
      ],
      NOW,
    );

    expect(groups[0].items.map((i) => i.id)).toEqual(['warn', 'r5', 'r1']);
  });

  it('masque les groupes vides', () => {
    const groups = buildFeed([draft({ id: 'x', at: '2026-09-30T09:00:00.000Z' })], NOW);
    expect(groups).toHaveLength(1);
    expect(groups[0].bucket).toBe('later');
  });
});

describe('takeFirst', () => {
  it('plafonne le fil tous groupes confondus et compte le reste', () => {
    const groups = buildFeed(
      [
        draft({ id: '1', at: '2026-08-18T09:00:00.000Z', overdue: true, daysOverdue: 1 }),
        draft({ id: '2', at: '2026-08-19T09:00:00.000Z' }),
        draft({ id: '3', at: '2026-08-19T10:00:00.000Z' }),
        draft({ id: '4', at: '2026-08-23T09:00:00.000Z' }),
      ],
      NOW,
    );

    const { groups: kept, hidden } = takeFirst(groups, 2);

    expect(kept.flatMap((g) => g.items).map((i) => i.id)).toEqual(['1', '2']);
    expect(hidden).toBe(2);
  });

  it('ne cache rien quand le fil tient sous le plafond', () => {
    const groups = buildFeed([draft({ id: '1', at: '2026-08-19T09:00:00.000Z' })], NOW);
    expect(takeFirst(groups, 8).hidden).toBe(0);
  });
});
