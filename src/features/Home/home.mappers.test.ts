import dayjs from 'dayjs';
import { describe, expect, it } from 'vitest';

import type { FarmerAlert } from '@/features/Domaines/domaines.types';
import type { FieldTask } from '@/features/FieldTasks/fieldTasks.types';
import type { ItkParcelTasks } from '@/features/Parcelle/parcelle.types';

import {
  alertsToFeed,
  fieldTasksToFeed,
  toActivities,
  toDomainAlerts,
  type NameIndex,
  type ParcelItk,
} from './home.mappers';

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

const NOW = dayjs('2026-08-19T09:00:00.000Z');

const names: NameIndex = {
  parcels: new Map([['p1', 'Kaporo 2']]),
  farms: new Map([['f1', 'Domaine Kaporo']]),
};

const task = (over: Partial<FieldTask> = {}): FieldTask => ({
  id: 'ft1',
  clientTaskId: 'c1',
  farmerId: 'u1',
  farmId: 'f1',
  parcelId: 'p1',
  targetType: 'parcel',
  type: 'weeding',
  title: 'Sarclage manuel',
  description: 'Sarcler les inter-rangs',
  dueDate: '2026-08-17',
  status: 'planned',
  overdue: true,
  daysOverdue: 2,
  createdBy: 'e1',
  createdByName: 'Dr Camara',
  visitId: 'v1',
  startedAt: null,
  completedAt: null,
  createdAt: '2026-08-12T08:00:00.000Z',
  updatedAt: '2026-08-12T08:00:00.000Z',
  ...over,
});

describe('fieldTasksToFeed', () => {
  it('transforme une consigne en retard en élément actionnable situé sur sa parcelle', () => {
    const [item] = fieldTasksToFeed([task()], names, NOW);

    expect(item.id).toBe('task:ft1');
    expect(item.kind).toBe('task');
    expect(item.title).toBe('Sarclage manuel');
    expect(item.place).toBe('Kaporo 2');
    expect(item.author).toBe('Dr Camara');
    expect(item.overdue).toBe(true);
    expect(item.daysOverdue).toBe(2);
    expect(item.actionable).toBe(true);
    expect(item.status).toBe('planned');
    expect(item.icon).toBe('treatment');
    expect(item.target).toBe('/domaines/f1/parcelles/p1');
  });

  it('retombe sur le nom du domaine quand la consigne porte sur le domaine entier', () => {
    const [item] = fieldTasksToFeed([task({ targetType: 'farm', parcelId: null })], names, NOW);

    expect(item.place).toBe('Domaine Kaporo');
    expect(item.target).toBe('/domaines/f1');
  });

  it('n’affiche les prérequis que lorsque le serveur les a résolus', () => {
    const withPrereqs = task({
      prerequisitesResolved: [
        { kind: 'field_task', taskId: 'ft0', label: 'Épandage fumier', satisfied: false },
        { kind: 'field_task', taskId: 'ft2', label: 'Labour', satisfied: true },
      ],
    });

    expect(fieldTasksToFeed([withPrereqs], names, NOW)[0].unmetPrerequisites).toEqual(['Épandage fumier']);
    expect(fieldTasksToFeed([task()], names, NOW)[0].unmetPrerequisites).toBeUndefined();
  });

  it('garde une consigne terminée du jour et écarte les plus anciennes', () => {
    const doneToday = task({
      id: 'ft-today',
      status: 'done',
      overdue: false,
      daysOverdue: 0,
      completedAt: '2026-08-19T07:00:00.000Z',
    });
    const doneLastWeek = task({
      id: 'ft-old',
      status: 'done',
      overdue: false,
      daysOverdue: 0,
      completedAt: '2026-08-10T07:00:00.000Z',
    });

    const ids = fieldTasksToFeed([doneToday, doneLastWeek], names, NOW).map((i) => i.id);

    expect(ids).toEqual(['task:ft-today']);
  });
});

describe('alertsToFeed', () => {
  it('porte la recommandation du backend comme conseil et normalise la sévérité', () => {
    const [item] = alertsToFeed([
      {
        id: 'al1',
        farmId: 'f1',
        farmName: 'Domaine Kaporo',
        parcelId: 'p1',
        parcelName: 'Kaporo 2',
        type: 'weather',
        severity: 'high',
        status: 'active',
        title: 'Fortes pluies attendues',
        message: 'Cumul de 40 mm attendu.',
        recommendedAction: 'Reporter l’apport d’urée',
        createdAt: '2026-08-19T06:00:00.000Z',
      },
    ]);

    expect(item.id).toBe('alert:al1');
    expect(item.kind).toBe('alert');
    expect(item.title).toBe('Fortes pluies attendues');
    expect(item.place).toBe('Kaporo 2');
    expect(item.advice).toBe('Reporter l’apport d’urée');
    expect(item.severity).toBe('critical');
    expect(item.icon).toBe('rain');
    expect(item.target).toBe('/domaines/f1/parcelles/p1');
  });

  it('ignore les alertes qui ne sont plus actives', () => {
    expect(
      alertsToFeed([
        {
          id: 'al2',
          farmId: 'f1',
          farmName: 'Domaine Kaporo',
          type: 'ndvi',
          severity: 'warning',
          status: 'resolved',
          title: 'NDVI en baisse',
          message: '',
          createdAt: '2026-08-18T06:00:00.000Z',
        },
      ]),
    ).toEqual([]);
  });
});
