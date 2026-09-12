import dayjs from 'dayjs';
import { describe, expect, it } from 'vitest';

import type { FarmerAlert, FarmerVisit } from '@/features/Domaines/domaines.types';
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
  crops: new Map([['p1', 'Piment']]),
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
    // Le périmètre complet, pour que la carte dise où agir sans ouvrir le détail.
    expect(item.perimetre).toEqual({ domaine: 'Domaine Kaporo', parcelle: 'Kaporo 2', culture: 'Piment' });
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
    const [item] = alertsToFeed(
      [
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
      ],
      names,
    );

    expect(item.id).toBe('alert:al1');
    expect(item.kind).toBe('alert');
    expect(item.title).toBe('Fortes pluies attendues');
    expect(item.place).toBe('Kaporo 2');
    expect(item.advice).toBe('Reporter l’apport d’urée');
    expect(item.severity).toBe('critical');
    expect(item.icon).toBe('rain');
    expect(item.target).toBe('/domaines/f1/parcelles/p1');
    // Le périmètre complet, pour que la carte dise où agir sans ouvrir le détail.
    expect(item.perimetre).toEqual({ domaine: 'Domaine Kaporo', parcelle: 'Kaporo 2', culture: 'Piment' });
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
      ], names),
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
    // La borne de fenêtre est passée dans l'échéance de la carte : le conseil ne
    // garde que ce qu'il est seul à porter.
    expect(items[0].advice).toBe('Urée 150 kg/ha');
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
    // Le retard n'est plus répété dans le conseil : l'échéance le date, et le
    // conseil garde ce qu'il est seul à dire.
    expect(items[0].advice).not.toBe('Fenêtre dépassée');
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

  it('promeut par type même sans intrant, et laisse alors le conseil vide', () => {
    const items = itkToFeed(
      [
        itkSource([
          itkTask({ taskId: 'itNoInput', inputs: [], windowStart: null, windowEnd: '2026-08-21T00:00:00.000Z' }),
        ]),
      ],
      ctx,
    );

    expect(items[0].kind).toBe('window');
    // Sans intrant, il n'y a rien à conseiller : la carte n'affiche pas une
    // ligne vide, et la date de fermeture est déjà dans son échéance.
    expect(items[0].advice).toBeUndefined();
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
    // Le carnet de la parcelle visitée : c'est là que le passage est raconté.
    expect(items[0].target).toBe('/domaines/f1/parcelles/p1?onglet=carnet');
  });

  it('ignore les consignes sans visite et les visites de plus de 21 jours', () => {
    const items = visitsToFeed(
      [task({ id: 'x', visitId: null }), task({ id: 'y', visitId: 'vieux', createdAt: '2026-07-01T09:00:00.000Z' })],
      names,
      NOW,
    );

    expect(items).toEqual([]);
  });

  it('reste lisible quand le nom du technicien est absent', () => {
    const items = visitsToFeed([task({ id: 'z', visitId: 'v2', createdByName: null })], names, NOW);

    expect(items[0].title).toBe('Visite de votre technicien');
  });

  it('accorde « consigne » et « faite » au singulier pour une visite à consigne unique', () => {
    const items = visitsToFeed([task({ id: 'unique', visitId: 'v3', status: 'planned' })], names, NOW);

    expect(items[0].advice).toBe('1 consigne · 0 faite');
  });
});

describe('visitsToFeed — visites effectuées servies par l’API', () => {
  const visite = (over: Partial<FarmerVisit> = {}): FarmerVisit => ({
    id: 'v7',
    status: 'done',
    type: 'consultation',
    category: null,
    scheduledFor: '2026-08-14T08:00:00.000Z',
    startedAt: '2026-08-14T08:05:00.000Z',
    endedAt: '2026-08-14T10:30:00.000Z',
    farmId: 'f1',
    farmName: 'Domaine Kaporo',
    technicianName: 'Dr Camara',
    parcelIds: [],
    note: null,
    ...over,
  });

  it('retient une visite effectuée même quand elle n’a produit aucune consigne', () => {
    const items = visitsToFeed([], names, NOW, [visite({ parcelIds: ['p1'] })]);

    expect(items).toHaveLength(1);
    expect(items[0].id).toBe('visit:v7');
    expect(items[0].kind).toBe('visit');
    expect(items[0].title).toBe('Visite de Dr Camara');
    expect(items[0].author).toBe('Dr Camara');
    // La fin de visite fait foi : c'est l'instant où le technicien est reparti.
    expect(items[0].at).toBe('2026-08-14T10:30:00.000Z');
    expect(items[0].place).toBe('Domaine Kaporo');
    expect(items[0].target).toBe('/domaines/f1/parcelles/p1?onglet=carnet');
    expect(items[0].advice).toBeUndefined();
  });

  it('fusionne la visite de l’API avec les consignes qu’elle a produites', () => {
    const items = visitsToFeed(
      [
        task({ id: 'a', visitId: 'v7', createdAt: '2026-08-14T09:00:00.000Z', status: 'done' }),
        task({ id: 'b', visitId: 'v7', createdAt: '2026-08-14T09:05:00.000Z', status: 'planned' }),
      ],
      names,
      NOW,
      [visite({ technicianName: 'Mme Bah' })],
    );

    // Une seule carte : la même visite vue de deux sources.
    expect(items).toHaveLength(1);
    expect(items[0].advice).toBe('2 consignes · 1 faite');
    // Le nom servi par l'API fait autorité sur celui recopié dans la consigne.
    expect(items[0].title).toBe('Visite de Mme Bah');
    expect(items[0].author).toBe('Mme Bah');
    expect(items[0].visit).toMatchObject({ id: 'v7', author: 'Mme Bah', total: 2, done: 1 });
    // L'API ne nomme aucune parcelle ici : le carnet désigné par les consignes
    // reste la meilleure destination connue.
    expect(items[0].target).toBe('/domaines/f1/parcelles/p1?onglet=carnet');
  });

  it('corrige la parcelle du carnet quand l’API en nomme une', () => {
    const items = visitsToFeed([task({ id: 'a', visitId: 'v7' })], names, NOW, [visite({ parcelIds: ['p9'] })]);

    expect(items[0].target).toBe('/domaines/f1/parcelles/p9?onglet=carnet');
  });

  it('garde une visite effectuée ancienne, que le plafond des consignes aurait perdue', () => {
    const items = visitsToFeed([], names, NOW, [
      visite({ id: 'vieille', endedAt: '2026-05-02T10:00:00.000Z', scheduledFor: null, startedAt: null }),
    ]);

    expect(items.map((item) => item.id)).toEqual(['visit:vieille']);
    expect(items[0].at).toBe('2026-05-02T10:00:00.000Z');
  });

  it('ne retient pas une visite qui n’a pas eu lieu', () => {
    const items = visitsToFeed([], names, NOW, [
      visite({ id: 'planifiee', status: 'planned', startedAt: null, endedAt: null }),
      visite({ id: 'manquee', status: 'missed', startedAt: null, endedAt: null }),
    ]);

    expect(items).toEqual([]);
  });

  it('reste lisible quand l’API ne connaît pas le nom du technicien', () => {
    const items = visitsToFeed([], names, NOW, [visite({ technicianName: null, farmName: null, farmId: null })]);

    expect(items[0].title).toBe('Visite de votre technicien');
    expect(items[0].author).toBeUndefined();
    expect(items[0].place).toBe('Mon exploitation');
    expect(items[0].target).toBeUndefined();
  });

  it('retrouve la parcelle dans les consignes d’une visite que l’API confirme', () => {
    // L'app technicien n'envoie jamais `parcelIds` : la seule parcelle connue
    // est celle sur laquelle le passage a laissé du travail.
    const items = visitsToFeed(
      [
        task({ id: 'a', visitId: 'v7', parcelId: null, createdAt: '2026-08-14T09:00:00.000Z' }),
        task({ id: 'b', visitId: 'v7', parcelId: 'p1', createdAt: '2026-08-14T09:05:00.000Z' }),
      ],
      names,
      NOW,
      [visite({ parcelIds: [] })],
    );

    expect(items[0].target).toBe('/domaines/f1/parcelles/p1?onglet=carnet');
  });

  it('garde les consignes d’une visite confirmée même passé le plafond d’âge', () => {
    // Le plafond protégeait une déduction : une visite servie par l'API est un
    // fait, et ses consignes disent encore quelle parcelle elle a touchée.
    const items = visitsToFeed(
      [task({ id: 'vieille', visitId: 'v7', parcelId: 'p1', createdAt: '2026-06-02T09:00:00.000Z' })],
      names,
      NOW,
      [visite({ endedAt: '2026-06-02T16:00:00.000Z', scheduledFor: null, startedAt: null })],
    );

    expect(items).toHaveLength(1);
    expect(items[0].advice).toBe('1 consigne · 0 faite');
    expect(items[0].target).toBe('/domaines/f1/parcelles/p1?onglet=carnet');
  });

  it('mène au domaine quand aucune source ne nomme de parcelle', () => {
    // Un carnet est tenu par parcelle : sans parcelle, il n'y a pas de page à
    // ouvrir, et le domaine est le plus près qu'on sache faire.
    const items = visitsToFeed([], names, NOW, [visite({ parcelIds: [] })]);

    expect(items[0].target).toBe('/domaines/f1');
  });

  it('ouvre le carnet de la parcelle où le GPS a validé le passage', () => {
    // `visitedParcelId` : la parcelle sur laquelle le technicien se tenait,
    // servie par l'API quand la géovalidation a réussi.
    const items = visitsToFeed([], names, NOW, [visite({ parcelIds: [], visitedParcelId: 'p1' })]);

    expect(items[0].target).toBe('/domaines/f1/parcelles/p1?onglet=carnet');
  });
});
