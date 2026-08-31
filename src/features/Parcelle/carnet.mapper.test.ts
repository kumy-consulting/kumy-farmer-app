import dayjs from 'dayjs';
import { describe, expect, it } from 'vitest';

import type { FieldTask } from '@/features/FieldTasks/fieldTasks.types';

import { buildCarnet } from './carnet.mapper';
import type { CarnetInspection } from './carnet.types';
import type { ItkCompletedLog, ItkParcelTasks, ItkTask } from './parcelle.types';

const NOW = dayjs('2026-08-20T09:00:00.000Z');

const tacheItk = (over: Partial<ItkTask> & { taskId: string }): ItkTask => ({
  type: 'treatment',
  title: 'Contrôle du paillage',
  description: '',
  timing: 'J+15',
  windowStart: null,
  windowEnd: null,
  state: 'completed',
  inputs: [],
  ...over,
});

const log = (over: Partial<ItkCompletedLog> & { logId: string; completedAt: string }): ItkCompletedLog => ({
  completedBy: { uid: 'e1', role: 'engineer', displayName: 'Dr Camara' },
  ...over,
});

const itkAvec = (taches: ItkTask[]): ItkParcelTasks =>
  ({
    parcelId: 'p1',
    hasActiveCampaign: true,
    stages: [{ tasks: { mandatory: taches, recommended: [] } }],
  }) as unknown as ItkParcelTasks;

const consigne = (over: Partial<FieldTask> & Pick<FieldTask, 'id' | 'title' | 'createdAt'>): FieldTask =>
  ({
    clientTaskId: `c-${over.id}`,
    farmerId: 'u1',
    farmId: 'f1',
    parcelId: 'p1',
    targetType: 'parcel',
    type: 'weeding',
    description: '',
    dueDate: '2026-08-25',
    status: 'planned',
    overdue: false,
    daysOverdue: 0,
    createdBy: 'e1',
    createdByName: 'Dr Camara',
    visitId: 'v1',
    startedAt: null,
    completedAt: null,
    updatedAt: over.createdAt,
    ...over,
  }) as FieldTask;

const inspection = (
  over: Partial<CarnetInspection> & Pick<CarnetInspection, 'id'>,
): CarnetInspection => ({
  parcelId: 'p1',
  inspectionDate: '2026-08-13T09:00:00.000Z',
  weedPressure: undefined,
  weedSpecies: [],
  notes: undefined,
  photoUrls: [],
  visitId: null,
  inspectorUid: 'e1',
  inspectorName: 'Dr Camara',
  createdAt: '2026-08-13T09:01:00.000Z',
  ...over,
});

describe('buildCarnet', () => {
  it('réunit dans un même passage ce qui a été vu et ce qui a été demandé le même jour', () => {
    const itk = itkAvec([
      tacheItk({
        taskId: 't1',
        completedLog: log({ logId: 'l1', completedAt: '2026-08-13T10:00:00.000Z', notes: 'Paillage trop mince' }),
      }),
    ]);
    const taches = [consigne({ id: 'c1', title: 'Compléter le paillage', createdAt: '2026-08-13T11:30:00.000Z' })];

    const carnet = buildCarnet(itk, taches, NOW);

    // Deux sources, deux heures différentes, un seul passage : même jour, même auteur.
    expect(carnet).toHaveLength(1);
    expect(carnet[0].auteur).toBe('Dr Camara');
    expect(carnet[0].observations.map((o) => o.texte)).toEqual(['Paillage trop mince']);
    expect(carnet[0].consignes.map((c) => c.titre)).toEqual(['Compléter le paillage']);
  });

  it('écarte ce que l’agriculteur a lui-même consigné — c’est le carnet du technicien', () => {
    const itk = itkAvec([
      tacheItk({
        taskId: 't1',
        completedLog: log({
          logId: 'l1',
          completedAt: '2026-08-13T10:00:00.000Z',
          notes: 'Fait ce matin',
          completedBy: { uid: 'u1', role: 'farmer', displayName: 'Mamadou' },
        }),
      }),
    ]);

    expect(buildCarnet(itk, [], NOW)).toEqual([]);
  });

  it('écarte une clôture sans note ni photo : une case cochée n’est pas une observation', () => {
    const itk = itkAvec([
      tacheItk({ taskId: 't1', completedLog: log({ logId: 'l1', completedAt: '2026-08-13T10:00:00.000Z' }) }),
    ]);

    expect(buildCarnet(itk, [], NOW)).toEqual([]);
  });

  it('garde les photos même quand aucune note ne les accompagne', () => {
    const itk = itkAvec([
      tacheItk({
        taskId: 't1',
        completedLog: log({
          logId: 'l1',
          completedAt: '2026-08-13T10:00:00.000Z',
          photoUrls: ['gs://b/1.jpg', 'gs://b/2.jpg'],
        }),
      }),
    ]);

    const carnet = buildCarnet(itk, [], NOW);
    expect(carnet[0].observations[0].photos).toHaveLength(2);
    expect(carnet[0].observations[0].texte).toBeUndefined();
  });

  it('garde une consigne donnée hors visite : seul un technicien peut en écrire', () => {
    // L'app technicien ne pose un `visitId` que si une visite est ouverte à cet
    // instant. Exiger ce champ vidait le carnet de la plupart des consignes
    // réellement données sur la parcelle.
    const taches = [consigne({ id: 'c1', title: 'Sarclage', createdAt: '2026-08-13T11:00:00.000Z', visitId: null })];

    const carnet = buildCarnet(null, taches, NOW);
    expect(carnet).toHaveLength(1);
    expect(carnet[0].auteur).toBe('Dr Camara');
    expect(carnet[0].consignes.map((c) => c.titre)).toEqual(['Sarclage']);
  });

  it('range une consigne hors visite dans le passage du même jour que l’observation', () => {
    const itk = itkAvec([
      tacheItk({
        taskId: 't1',
        completedLog: log({ logId: 'l1', completedAt: '2026-08-13T10:00:00.000Z', notes: 'Adventices fortes' }),
      }),
    ]);
    const taches = [
      consigne({ id: 'c1', title: 'Désherbage parcelle', createdAt: '2026-08-13T11:30:00.000Z', visitId: null }),
    ];

    const carnet = buildCarnet(itk, taches, NOW);
    expect(carnet).toHaveLength(1);
    expect(carnet[0].observations.map((o) => o.texte)).toEqual(['Adventices fortes']);
    expect(carnet[0].consignes.map((c) => c.titre)).toEqual(['Désherbage parcelle']);
  });

  it('range une observation libre dans le passage de son auteur', () => {
    const carnet = buildCarnet(null, [], NOW, [
      inspection({ id: 'o1', notes: 'Patches en bordure sud.', inspectorName: 'Dr Camara' }),
    ]);

    expect(carnet).toHaveLength(1);
    expect(carnet[0].auteur).toBe('Dr Camara');
    expect(carnet[0].observations.map((o) => o.texte)).toEqual(['Patches en bordure sud.']);
  });

  it('fusionne observation libre et consigne du même jour en un seul passage', () => {
    // C'est tout l'intérêt de résoudre le nom côté API : sans lui, une visite
    // se couperait en deux à l'écran.
    const taches = [consigne({ id: 'c1', title: 'Désherbage parcelle', createdAt: '2026-08-13T11:30:00.000Z' })];
    const observations = [
      inspection({ id: 'o1', inspectionDate: '2026-08-13T09:00:00.000Z', notes: 'Adventices fortes' }),
    ];

    const carnet = buildCarnet(null, taches, NOW, observations);

    expect(carnet).toHaveLength(1);
    expect(carnet[0].observations.map((o) => o.texte)).toEqual(['Adventices fortes']);
    expect(carnet[0].consignes.map((c) => c.titre)).toEqual(['Désherbage parcelle']);
  });

  it('garde une observation qui ne porte que la pression d’adventices', () => {
    // Une pression est un constat, pas une case cochée : contrairement à une
    // clôture de tâche ITK vide, elle a sa place dans le carnet.
    const carnet = buildCarnet(null, [], NOW, [
      inspection({ id: 'o1', notes: undefined, weedPressure: 'high' }),
    ]);

    expect(carnet[0].observations).toHaveLength(1);
    expect(carnet[0].observations[0].pression).toBe('high');
    expect(carnet[0].observations[0].texte).toBeUndefined();
  });

  it('écarte une observation totalement vide', () => {
    const carnet = buildCarnet(null, [], NOW, [
      inspection({ id: 'o1', notes: undefined, weedPressure: undefined, photoUrls: [] }),
    ]);

    expect(carnet).toEqual([]);
  });

  it('nomme l’auteur « Votre technicien » quand l’API n’a pas résolu le nom', () => {
    const carnet = buildCarnet(null, [], NOW, [
      inspection({ id: 'o1', inspectorName: null, notes: 'Vu ce matin' }),
    ]);

    expect(carnet[0].auteur).toBe('Votre technicien');
  });

  it('porte les photos d’une observation libre', () => {
    const carnet = buildCarnet(null, [], NOW, [
      inspection({ id: 'o1', notes: undefined, photoUrls: ['gs://b/1.jpg', 'gs://b/2.jpg'] }),
    ]);

    expect(carnet[0].observations[0].photos).toHaveLength(2);
  });

  it('rend les passages du plus récent au plus ancien', () => {
    const taches = [
      consigne({ id: 'c1', title: 'Ancien', createdAt: '2026-08-02T09:00:00.000Z' }),
      consigne({ id: 'c2', title: 'Récent', createdAt: '2026-08-13T09:00:00.000Z' }),
    ];

    expect(buildCarnet(null, taches, NOW).map((v) => v.consignes[0].titre)).toEqual(['Récent', 'Ancien']);
  });

  it('dit l’échéance dans le vocabulaire de l’accueil', () => {
    const taches = [
      consigne({ id: 'c1', title: 'En retard', createdAt: '2026-08-13T09:00:00.000Z', overdue: true, daysOverdue: 2 }),
      consigne({
        id: 'c2',
        title: 'Faite',
        createdAt: '2026-08-13T09:00:00.000Z',
        status: 'done',
        completedAt: '2026-08-15T09:00:00.000Z',
      }),
    ];

    const [visite] = buildCarnet(null, taches, NOW);
    expect(visite.consignes.find((c) => c.titre === 'En retard')).toMatchObject({
      echeance: 'En retard de 2 j',
      enRetard: true,
      faite: false,
    });
    expect(visite.consignes.find((c) => c.titre === 'Faite')).toMatchObject({
      echeance: 'Fait le 15 août',
      faite: true,
    });
  });
});
