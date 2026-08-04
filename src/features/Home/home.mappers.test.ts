import { describe, expect, it } from 'vitest';

import type { FarmerAlert } from '@/features/Domaines/domaines.types';
import type { ItkParcelTasks } from '@/features/Parcelle/parcelle.types';

import { toActivities, toDomainAlerts, type ParcelItk } from './home.mappers';

const baseAlert = (over: Partial<FarmerAlert>): FarmerAlert => ({
  id: 'a',
  farmId: 'f1',
  farmName: 'Domaine',
  type: 'ndvi',
  severity: 'critical',
  status: 'active',
  title: 'Titre',
  message: 'Message',
  createdAt: '2026-07-29T08:00:00.000Z',
  ...over,
});

describe('toDomainAlerts', () => {
  it('normalise les sévérités OAD (high/medium/low) vers les 3 tons de l’app', () => {
    const [high, medium, low, unknown] = toDomainAlerts([
      baseAlert({ id: '1', severity: 'high' as FarmerAlert['severity'], createdAt: '2026-07-29T04:00:00Z' }),
      baseAlert({ id: '2', severity: 'medium' as FarmerAlert['severity'], createdAt: '2026-07-29T03:00:00Z' }),
      baseAlert({ id: '3', severity: 'low' as FarmerAlert['severity'], createdAt: '2026-07-29T02:00:00Z' }),
      baseAlert({ id: '4', severity: 'weird' as FarmerAlert['severity'], createdAt: '2026-07-29T01:00:00Z' }),
    ]);

    expect(high.severity).toBe('critical');
    expect(medium.severity).toBe('warning');
    expect(low.severity).toBe('info');
    expect(unknown.severity).toBe('info'); // défaut sûr → pas de crash de rendu
  });

  it('ne garde que les alertes actives, plus récentes en premier', () => {
    const result = toDomainAlerts([
      baseAlert({ id: 'old', createdAt: '2026-07-20T00:00:00Z' }),
      baseAlert({ id: 'resolved', status: 'resolved', createdAt: '2026-07-29T00:00:00Z' }),
      baseAlert({ id: 'new', createdAt: '2026-07-28T00:00:00Z' }),
    ]);
    expect(result.map((a) => a.id)).toEqual(['new', 'old']);
  });
});

const itkWith = (over: Partial<ItkParcelTasks>): ItkParcelTasks => ({
  parcelId: 'p1',
  hasActiveCampaign: true,
  daysAfterSowing: 10,
  currentStage: { stageCode: 'S1', stageName: 'Plantation', order: 1 },
  itkValidationStatus: 'web_provisional',
  stages: [
    {
      stageCode: 'S1',
      stageName: 'Plantation',
      order: 1,
      expectedStart: '2026-07-01T00:00:00.000Z',
      expectedEnd: '2026-08-30T00:00:00.000Z',
      status: 'inProgress',
      dayStart: 0,
      dayEnd: 60,
      description: '',
      critical: false,
      tasks: {
        mandatory: [
          {
            taskId: 't1',
            type: 'fertilisation',
            title: 'Fumure de fond',
            description: '',
            timing: 'J0',
            windowStart: '2026-07-05T00:00:00.000Z',
            windowEnd: null,
            state: 'overdue',
            inputs: [],
          },
        ],
        recommended: [],
      },
      risks: [],
    },
  ],
  ...over,
});

describe('toActivities', () => {
  it('agrège les tâches du stade courant et ignore les parcelles sans campagne', () => {
    const items: ParcelItk[] = [
      { itk: itkWith({}), parcelName: 'Parcelle Nord' },
      { itk: itkWith({ hasActiveCampaign: false, stages: [] }), parcelName: 'Parcelle Sud' },
    ];
    const result = toActivities(items);
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Fumure de fond');
    expect(result[0].type).toBe('treatment');
    expect(result[0].status).toBe('todo');
    expect(result[0].domainName).toBe('Parcelle Nord');
    expect(result[0].id).toBe('p1:t1');
  });
});
