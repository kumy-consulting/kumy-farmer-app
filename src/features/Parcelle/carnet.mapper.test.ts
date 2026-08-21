import dayjs from 'dayjs';
import { describe, expect, it } from 'vitest';

import type { FieldTask } from '@/features/FieldTasks/fieldTasks.types';

import { buildCarnet } from './carnet.mapper';
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

  it('ignore une consigne sans visite : elle vit dans le fil, pas dans le carnet', () => {
    const taches = [consigne({ id: 'c1', title: 'Sarclage', createdAt: '2026-08-13T11:00:00.000Z', visitId: null })];

    expect(buildCarnet(null, taches, NOW)).toEqual([]);
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
