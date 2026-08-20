import dayjs from 'dayjs';
import { describe, expect, it } from 'vitest';

import type { FarmerAlert } from '@/features/Domaines/domaines.types';
import type { FieldTask } from '@/features/FieldTasks/fieldTasks.types';
import type { ItkParcelTasks, ItkTask } from '@/features/Parcelle/parcelle.types';

import {
  alertsToFeed,
  fieldTasksToFeed,
  itkToFeed,
  visitsToFeed,
  type NameIndex,
  type ParcelItkSource,
  type UnfavourableSource,
} from './home.mappers';

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
        // Le backend caste sans valider : 'high' échappe au type `AlertSeverity`
        // mais c'est précisément la valeur que `alertsToFeed` doit normaliser.
        severity: 'high' as FarmerAlert['severity'],
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

const itkTask = (over: Partial<ItkTask> = {}): ItkTask => ({
  taskId: 'it1',
  type: 'fertilisation',
  title: 'Apport urée',
  description: '',
  timing: 'J+15',
  windowStart: '2026-08-18T00:00:00.000Z',
  windowEnd: '2026-08-20T00:00:00.000Z',
  state: 'pending',
  inputs: [{ product: 'Urée', dosePerHa: 150, unit: 'kg' }],
  ...over,
});

const itkSource = (tasks: ItkTask[]): ParcelItkSource => ({
  farmId: 'f1',
  parcelName: 'Kaporo 1',
  itk: {
    parcelId: 'p1',
    hasActiveCampaign: true,
    daysAfterSowing: 15,
    currentStage: { stageCode: 'S2', stageName: 'Croissance', order: 2 },
    itkValidationStatus: 'web_provisional',
    stages: [
      {
        stageCode: 'S2',
        stageName: 'Croissance',
        order: 2,
        expectedStart: '2026-08-10T00:00:00.000Z',
        expectedEnd: '2026-09-10T00:00:00.000Z',
        status: 'inProgress',
        dayStart: 10,
        dayEnd: 40,
        description: '',
        critical: false,
        tasks: { mandatory: tasks, recommended: [] },
        risks: [],
      },
    ],
  } as ItkParcelTasks,
});

describe('itkToFeed', () => {
  const ctx = { now: NOW, unfavourable: new Map<string, UnfavourableSource>() };

  it('promeut une tâche d’intrant en fenêtre de traitement, urgente si elle se ferme sous 48 h', () => {
    const items = itkToFeed([itkSource([itkTask()])], ctx);

    expect(items).toHaveLength(1);
    expect(items[0].kind).toBe('window');
    expect(items[0].id).toBe('window:p1:it1');
    expect(items[0].icon).toBe('window');
    expect(items[0].at).toBe('2026-08-20T00:00:00.000Z');
    expect(items[0].urgentNow).toBe(true);
    expect(items[0].advice).toContain('Jusqu’au 20/08');
    expect(items[0].target).toBe('/domaines/f1/parcelles/p1');
  });

  it('signale les conditions défavorables mesurées par le kit du domaine', () => {
    const items = itkToFeed([itkSource([itkTask()])], {
      now: NOW,
      unfavourable: new Map<string, UnfavourableSource>([['f1', 'kit']]),
    });

    expect(items[0].note).toBe('Conditions défavorables en ce moment — mesuré par le kit');
  });

  it('laisse une tâche sans intrant ni fenêtre datée en simple tâche ITK', () => {
    const items = itkToFeed(
      [
        itkSource([
          itkTask({
            taskId: 'it2',
            type: 'observation',
            title: 'Observation ravageurs',
            inputs: [],
            windowStart: '2026-08-22T00:00:00.000Z',
            windowEnd: null,
          }),
        ]),
      ],
      ctx,
    );

    expect(items[0].kind).toBe('itk');
    expect(items[0].id).toBe('itk:p1:it2');
    expect(items[0].icon).toBe('inspection');
    expect(items[0].at).toBe('2026-08-22T00:00:00.000Z');
    expect(items[0].urgentNow).toBeUndefined();
  });

  it('épingle une tâche ITK dont la fenêtre est dépassée', () => {
    const items = itkToFeed(
      [
        itkSource([
          itkTask({
            taskId: 'it3',
            type: 'observation',
            inputs: [],
            windowStart: '2026-08-10T00:00:00.000Z',
            windowEnd: '2026-08-14T00:00:00.000Z',
          }),
        ]),
      ],
      ctx,
    );

    expect(items[0].kind).toBe('itk');
    expect(items[0].urgentNow).toBe(true);
    expect(items[0].advice).toBe('Fenêtre dépassée');
  });

  it('écarte les tâches faites et les parcelles sans campagne active', () => {
    const done = itkToFeed([itkSource([itkTask({ state: 'completed' })])], ctx);
    expect(done).toEqual([]);

    const noCampaign = itkSource([itkTask()]);
    noCampaign.itk.hasActiveCampaign = false;
    expect(itkToFeed([noCampaign], ctx)).toEqual([]);
  });

  it('résume les intrants comme conseil de la fenêtre', () => {
    const items = itkToFeed([itkSource([itkTask()])], ctx);
    expect(items[0].advice).toContain('Urée 150 kg/ha');
  });

  it('promeut une fenêtre qui ferme pile à 7 jours, pas au-delà', () => {
    const withinSeven = itkToFeed(
      [itkSource([itkTask({ taskId: 'itSeven', windowStart: null, windowEnd: '2026-08-26T09:00:00.000Z' })])],
      ctx,
    );
    expect(withinSeven[0].kind).toBe('window');

    const beyondSeven = itkToFeed(
      [itkSource([itkTask({ taskId: 'itEight', windowStart: null, windowEnd: '2026-08-27T09:00:00.000Z' })])],
      ctx,
    );
    expect(beyondSeven[0].kind).toBe('itk');
  });

  it('bascule urgentNow pile à 48 h de la fermeture, pas au-delà', () => {
    const atFortyEight = itkToFeed(
      [itkSource([itkTask({ taskId: 'itFortyEight', windowStart: null, windowEnd: '2026-08-21T09:00:00.000Z' })])],
      ctx,
    );
    expect(atFortyEight[0].kind).toBe('window');
    expect(atFortyEight[0].urgentNow).toBeUndefined();

    const underFortyEight = itkToFeed(
      [itkSource([itkTask({ taskId: 'itFortySeven', windowStart: null, windowEnd: '2026-08-21T08:00:00.000Z' })])],
      ctx,
    );
    expect(underFortyEight[0].urgentNow).toBe(true);
  });

  it('promeut une fenêtre qui s’ouvre pile à 24 h, pas au-delà', () => {
    const atTwentyFour = itkToFeed(
      [
        itkSource([
          itkTask({
            taskId: 'itOpen24',
            windowStart: '2026-08-20T09:00:00.000Z',
            windowEnd: '2026-08-25T09:00:00.000Z',
          }),
        ]),
      ],
      ctx,
    );
    expect(atTwentyFour[0].kind).toBe('window');

    const beyondTwentyFour = itkToFeed(
      [
        itkSource([
          itkTask({
            taskId: 'itOpen25',
            windowStart: '2026-08-20T10:00:00.000Z',
            windowEnd: '2026-08-25T09:00:00.000Z',
          }),
        ]),
      ],
      ctx,
    );
    expect(beyondTwentyFour[0].kind).toBe('itk');
  });

  it('promeut par type même sans intrant, conseil limité à la date', () => {
    const items = itkToFeed(
      [
        itkSource([
          itkTask({ taskId: 'itNoInput', inputs: [], windowStart: null, windowEnd: '2026-08-21T00:00:00.000Z' }),
        ]),
      ],
      ctx,
    );

    expect(items[0].kind).toBe('window');
    expect(items[0].advice).toBe('Jusqu’au 21/08');
  });
});

describe('visitsToFeed', () => {
  it('reconstitue une visite depuis les consignes qui en sont issues', () => {
    const items = visitsToFeed(
      [
        task({ id: 'a', visitId: 'v1', createdAt: '2026-08-12T09:00:00.000Z', status: 'done' }),
        task({ id: 'b', visitId: 'v1', createdAt: '2026-08-12T09:05:00.000Z', status: 'planned' }),
        task({ id: 'c', visitId: 'v1', createdAt: '2026-08-12T09:10:00.000Z', status: 'done' }),
      ],
      names,
      NOW,
    );

    expect(items).toHaveLength(1);
    expect(items[0].id).toBe('visit:v1');
    expect(items[0].kind).toBe('visit');
    expect(items[0].title).toBe('Visite de Dr Camara');
    expect(items[0].place).toBe('Kaporo 2');
    expect(items[0].icon).toBe('visit');
    expect(items[0].at).toBe('2026-08-12T09:00:00.000Z');
    expect(items[0].advice).toBe('3 consignes · 2 faites');
    expect(items[0].visit).toEqual({
      id: 'v1',
      author: 'Dr Camara',
      date: '2026-08-12T09:00:00.000Z',
      total: 3,
      done: 2,
    });
  });

  it('ignore les consignes sans visite et les visites de plus de 21 jours', () => {
    const items = visitsToFeed(
      [task({ id: 'x', visitId: null }), task({ id: 'y', visitId: 'vieux', createdAt: '2026-07-01T09:00:00.000Z' })],
      names,
      NOW,
    );

    expect(items).toEqual([]);
  });

  it('reste lisible quand le nom de l’encadreur est absent', () => {
    const items = visitsToFeed([task({ id: 'z', visitId: 'v2', createdByName: null })], names, NOW);

    expect(items[0].title).toBe('Visite de votre encadreur');
  });

  it('accorde « consigne » et « faite » au singulier pour une visite à consigne unique', () => {
    const items = visitsToFeed([task({ id: 'unique', visitId: 'v3', status: 'planned' })], names, NOW);

    expect(items[0].advice).toBe('1 consigne · 0 faite');
  });
});
