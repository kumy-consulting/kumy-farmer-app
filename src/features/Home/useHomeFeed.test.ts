import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { domainesApi } from '@/features/Domaines/domaines.api';
import type { Domain, DomainsSummary, FarmerAlert, FarmLiveStation, Parcel } from '@/features/Domaines/domaines.types';
import { fieldTasksApi } from '@/features/FieldTasks/fieldTasks.api';
import type { FieldTask } from '@/features/FieldTasks/fieldTasks.types';
import { parcelleApi } from '@/features/Parcelle/parcelle.api';
import type { ItkParcelTasks } from '@/features/Parcelle/parcelle.types';
import { useAuthStore } from '@/shared/stores/authStore';

import { useHomeFeed, type HomeFeedState } from './useHomeFeed';

/** Tous les éléments du fil, sections confondues — les tests raisonnent par id. */
const allItems = (sections: HomeFeedState['sections']) => [
  ...sections.alerts.fresh,
  ...sections.alerts.stale,
  ...sections.tasks.bySegment.inProgress,
  ...sections.tasks.bySegment.overdue,
  ...sections.tasks.bySegment.planned,
  ...sections.tasks.doneToday,
  ...(sections.visits.last ? [sections.visits.last] : []),
];

vi.mock('@/features/Domaines/domaines.api', () => ({
  domainesApi: {
    alerts: vi.fn(),
    farms: vi.fn(),
    parcels: vi.fn(),
    summary: vi.fn(),
    liveStation: vi.fn(),
    visits: vi.fn(),
  },
}));
vi.mock('@/features/Parcelle/parcelle.api', () => ({
  parcelleApi: { itkTasks: vi.fn(), climateContext: vi.fn() },
}));
vi.mock('@/features/FieldTasks/fieldTasks.api', () => ({
  fieldTasksApi: { list: vi.fn(), transition: vi.fn() },
}));

const mockedDomaines = vi.mocked(domainesApi);
const mockedParcelle = vi.mocked(parcelleApi);
const mockedFieldTasks = vi.mocked(fieldTasksApi);

const consigne: FieldTask = {
  id: 'ft1',
  clientTaskId: 'c1',
  farmerId: 'u1',
  farmId: 'f1',
  parcelId: 'p1',
  targetType: 'parcel',
  type: 'weeding',
  title: 'Sarclage manuel',
  description: '',
  dueDate: '2026-08-17',
  status: 'planned',
  overdue: true,
  daysOverdue: 2,
  createdBy: 'e1',
  createdByName: 'Dr Camara',
  visitId: null,
  startedAt: null,
  completedAt: null,
  createdAt: '2026-08-12T08:00:00.000Z',
  updatedAt: '2026-08-12T08:00:00.000Z',
};

const alerts: FarmerAlert[] = [
  {
    id: 'al1',
    farmId: 'f1',
    farmName: 'Domaine Kaporo',
    parcelId: 'p1',
    parcelName: 'Kaporo 2',
    type: 'weather',
    severity: 'critical',
    status: 'active',
    title: 'Fortes pluies attendues',
    message: '',
    recommendedAction: 'Reporter l’apport d’urée',
    createdAt: '2026-08-19T06:00:00.000Z',
  },
];

const summary = {
  farmerId: 'u1',
  totalFarms: 3,
  totalArea: 12.5,
  totalParcels: 7,
  avgNdvi: 0.62,
  avgTemperature: 29,
  alerts: { total: 1, critical: 1, warning: 0, info: 0 },
} as DomainsSummary;

const farms = [{ id: 'f1', name: 'Domaine Kaporo' }] as unknown as Domain[];
const parcels = [{ id: 'p1', name: 'Kaporo 2', currentStageCode: 'S2' }] as unknown as Parcel[];
const itk = {
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
      tasks: {
        mandatory: [
          {
            taskId: 'it1',
            type: 'observation',
            title: 'Observation ravageurs',
            description: '',
            timing: 'J+20',
            windowStart: '2026-08-22T00:00:00.000Z',
            windowEnd: null,
            state: 'pending',
            inputs: [],
          },
        ],
        recommended: [],
      },
      risks: [],
    },
  ],
} as ItkParcelTasks;

/**
 * Station au format réel de `GET /farms/:id/live-station` : mesures sous `live`,
 * chacune enveloppée dans { value, unit, at }, fraîcheur dans `lastSeen`.
 */
const liveStation = (o: {
  online: boolean;
  lastSeen: string;
  temperature?: number;
  rainRate?: number;
  windSpeed?: number;
}): FarmLiveStation['station'] => {
  const at = o.lastSeen;
  return {
    id: 'st1',
    stationId: 'ST-1',
    label: 'Kit Kaporo',
    online: o.online,
    status: o.online ? 'active' : 'inactive',
    lastSeen: o.lastSeen,
    live: {
      ...(o.temperature !== undefined && { temperature: { value: o.temperature, unit: '\u00B0C', at } }),
      ...(o.rainRate !== undefined && { rainRate: { value: o.rainRate, unit: 'mm/h', at } }),
      ...(o.windSpeed !== undefined && { windSpeed: { value: o.windSpeed, unit: 'km/h', at } }),
    },
  };
};

/**
 * Les fixtures de ce fichier sont datées en dur — fenêtres de traitement,
 * échéances, relevés de station. Sans horloge figée, elles vieillissent : la
 * suite est passée verte jusqu'au 21 août 2026, puis les fenêtres se sont
 * fermées d'elles-mêmes et trois tests ont cassé sans qu'une ligne de code ait
 * bougé. On fige donc « maintenant » au milieu des fenêtres décrites.
 */
const MAINTENANT = new Date('2026-08-20T09:00:00.000Z');

describe('useHomeFeed', () => {
  beforeEach(() => {
    // `shouldAdvanceTime` : les mappers lisent l'heure, mais le hook attend de
    // vraies promesses réseau. Sans avance automatique, `waitFor` boucle
    // jusqu'au timeout sur une horloge arrêtée.
    vi.useFakeTimers({ now: MAINTENANT, shouldAdvanceTime: true });
    useAuthStore.setState({
      user: { uid: 'u1', displayName: 'Awa Diallo', phone: '+224620000000', role: 'farmer' },
      isAuthenticated: true,
    });
    mockedFieldTasks.list.mockResolvedValue([consigne]);
    mockedFieldTasks.transition.mockResolvedValue({ ...consigne, status: 'done' });
    mockedDomaines.alerts.mockResolvedValue(alerts);
    mockedDomaines.farms.mockResolvedValue(farms);
    mockedDomaines.summary.mockResolvedValue(summary);
    // Aucune visite programmée : l'état par défaut tant que personne n'en planifie.
    mockedDomaines.visits.mockResolvedValue({ next: null, recent: [] });
    mockedDomaines.parcels.mockResolvedValue(parcels);
    mockedDomaines.liveStation.mockResolvedValue({
      station: liveStation({
        online: true,
        lastSeen: '2026-08-19T08:56:00.000Z',
        temperature: 29,
        rainRate: 0,
        windSpeed: 8,
      }),
    });
    mockedParcelle.itkTasks.mockResolvedValue(itk);
    mockedParcelle.climateContext.mockRejectedValue(new Error('pas de contexte'));
  });

  afterEach(() => {
    vi.useRealTimers();
    useAuthStore.setState({ user: null, isAuthenticated: false });
    vi.clearAllMocks();
  });

  it('expose le fil, le récap et la météo une fois les vagues terminées', async () => {
    const { result } = renderHook(() => useHomeFeed());

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => expect(result.current.isEnriching).toBe(false));

    const ids = allItems(result.current.sections).map((i) => i.id);
    expect(ids).toContain('task:ft1');
    expect(ids).toContain('alert:al1');
    expect(ids).toContain('itk:p1:it1');
    expect(result.current.recap).toEqual({
      domains: 3,
      parcels: 7,
      areaHa: 12.5,
      health: 'critical',
    });
    expect(result.current.weather?.tempC).toBe(29);
    expect(result.current.weather?.farmName).toBe('Domaine Kaporo');
  });

  it('affiche déjà consignes et alertes à la fin de la première vague', async () => {
    let resolveParcels: (value: Parcel[]) => void = () => {};
    mockedDomaines.parcels.mockReturnValue(
      new Promise<Parcel[]>((resolve) => {
        resolveParcels = resolve;
      }),
    );

    const { result } = renderHook(() => useHomeFeed());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isEnriching).toBe(true);
    expect(allItems(result.current.sections).map((i) => i.id)).toContain('task:ft1');

    await act(async () => {
      resolveParcels(parcels);
    });
  });

  it('remonte la prochaine visite planifiée dans l’accompagnement', async () => {
    mockedDomaines.visits.mockResolvedValue({
      next: {
        id: 'v9',
        status: 'planned',
        type: 'consultation',
        category: null,
        scheduledFor: '2026-08-27T08:00:00.000Z',
        startedAt: null,
        endedAt: null,
        farmId: 'f1',
        farmName: 'Domaine Kaporo',
        technicianName: 'Dr Camara',
        parcelIds: [],
        note: 'Contrôle floraison ananas',
      },
      recent: [],
    });

    const { result } = renderHook(() => useHomeFeed());
    await waitFor(() => expect(result.current.dashboard.accompagnement.prochaineVisite).not.toBeNull());

    // Une visite à venir n'a encore produit aucune consigne : elle ne pouvait
    // pas être reconstituée depuis le fil, seul l'endpoint la connaît.
    expect(result.current.dashboard.accompagnement.prochaineVisite).toEqual({
      date: '2026-08-27T08:00:00.000Z',
      technicien: 'Dr Camara',
      domaine: 'Domaine Kaporo',
      objectif: 'Contrôle floraison ananas',
    });
  });

  it('dégrade sans casser quand une source échoue', async () => {
    mockedParcelle.itkTasks.mockRejectedValue(new Error('400'));
    mockedFieldTasks.list.mockRejectedValue(new Error('500'));

    const { result } = renderHook(() => useHomeFeed());
    await waitFor(() => expect(result.current.isEnriching).toBe(false));

    const ids = allItems(result.current.sections).map((i) => i.id);
    expect(ids).toEqual(['alert:al1']);
    expect(result.current.error).toBeNull();
  });

  it('met à jour la consigne de façon optimiste puis confirme', async () => {
    const { result } = renderHook(() => useHomeFeed());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.runTaskAction('task:ft1', 'complete');
    });

    const item = allItems(result.current.sections).find((i) => i.id === 'task:ft1');
    expect(mockedFieldTasks.transition).toHaveBeenCalledWith('ft1', 'complete');
    expect(item?.status).toBe('done');
    expect(result.current.actionError).toBeNull();
  });

  it('revient en arrière et signale l’échec quand la transition est refusée', async () => {
    mockedFieldTasks.transition.mockRejectedValue(new Error('409'));

    const { result } = renderHook(() => useHomeFeed());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.runTaskAction('task:ft1', 'complete');
    });

    const item = allItems(result.current.sections).find((i) => i.id === 'task:ft1');
    expect(item?.status).toBe('planned');
    expect(result.current.actionError).toBe('Action non enregistrée, réessayez');
  });

  it('aligne la santé du récap sur la sévérité normalisée d’une alerte active', async () => {
    mockedDomaines.alerts.mockResolvedValue([
      { ...alerts[0], id: 'al-high', severity: 'high' as FarmerAlert['severity'], status: 'active' },
    ]);

    const { result } = renderHook(() => useHomeFeed());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.recap?.health).toBe('critical');
  });

  it('ignore une alerte critique résolue dans le calcul de santé du récap', async () => {
    mockedDomaines.alerts.mockResolvedValue([{ ...alerts[0], id: 'al-resolved', status: 'resolved' }]);

    const { result } = renderHook(() => useHomeFeed());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.recap?.health).toBe('good');
  });

  it('ne marque pas de conditions défavorables quand le kit qui les mesure est hors ligne', async () => {
    mockedDomaines.liveStation.mockResolvedValue({
      station: liveStation({
        online: false,
        lastSeen: '2026-08-16T08:00:00.000Z',
        temperature: 22,
        rainRate: 12,
        windSpeed: 5,
      }),
    });
    mockedParcelle.itkTasks.mockResolvedValue({
      ...itk,
      stages: [
        {
          ...itk.stages[0],
          tasks: {
            mandatory: [
              {
                taskId: 'itWindow',
                type: 'treatment',
                title: 'Traitement fongicide',
                description: '',
                timing: 'J+15',
                windowStart: '2026-08-18T00:00:00.000Z',
                windowEnd: '2026-08-22T00:00:00.000Z',
                state: 'pending',
                inputs: [],
              },
            ],
            recommended: [],
          },
        },
      ],
    } as ItkParcelTasks);

    const { result } = renderHook(() => useHomeFeed());
    await waitFor(() => expect(result.current.isEnriching).toBe(false));

    const windowItem = allItems(result.current.sections).find((i) => i.id === 'window:p1:itWindow');
    expect(windowItem).toBeDefined();
    expect(windowItem?.note).toBeUndefined();
  });

  it('marque la fenêtre défavorable sur un domaine sans kit, via le satellite', async () => {
    // Aucun kit : sans contexte climatique, ce domaine n'aurait jamais le
    // moindre avertissement sur ses fenêtres de traitement.
    mockedDomaines.liveStation.mockResolvedValue({ station: null });
    mockedParcelle.climateContext.mockResolvedValue({
      parcelId: 'p1',
      dataSource: 'external',
      asOfDate: '2026-08-19',
      temperature: { avg7dC: 24.4, expectedC: 26, deltaC: -1.6 },
      wind: { avgKmh: 11, direction: 'SO', treatmentWindowOpen: false },
      rainfall: { cumulMm: 120, expectedMm: 100, deltaPct: 20 },
    });
    mockedParcelle.itkTasks.mockResolvedValue({
      ...itk,
      stages: [
        {
          ...itk.stages[0],
          tasks: {
            mandatory: [
              {
                taskId: 'itWindow',
                type: 'treatment',
                title: 'Traitement fongicide',
                description: '',
                timing: 'J+15',
                windowStart: '2026-08-18T00:00:00.000Z',
                windowEnd: '2026-08-22T00:00:00.000Z',
                state: 'pending',
                inputs: [],
              },
            ],
            recommended: [],
          },
        },
      ],
    } as ItkParcelTasks);

    const { result } = renderHook(() => useHomeFeed());
    await waitFor(() => expect(result.current.isEnriching).toBe(false));

    const windowItem = allItems(result.current.sections).find((i) => i.id === 'window:p1:itWindow');
    // La note nomme sa source : créditer le kit d'une estimation serait faux.
    expect(windowItem?.note).toBe('Conditions défavorables aujourd’hui — estimation satellite');
    expect(result.current.weather).toMatchObject({ hasKit: false, climate: { avgTempC: 24.4 } });
  });

  it('marque la fenêtre défavorable quand le kit en ligne mesure de la pluie', async () => {
    // Le débit `rainRate` (mm/h) dit qu'il pleut MAINTENANT. `rainfall` est le
    // compteur cumulatif de la station : le lire ici marquerait tout domaine
    // équipé comme défavorable en permanence.
    mockedDomaines.liveStation.mockResolvedValue({
      station: liveStation({
        online: true,
        lastSeen: '2026-08-20T07:00:00.000Z',
        temperature: 24,
        rainRate: 3,
        windSpeed: 5,
      }),
    });
    mockedParcelle.itkTasks.mockResolvedValue({
      ...itk,
      stages: [
        {
          ...itk.stages[0],
          tasks: {
            mandatory: [
              {
                taskId: 'itWindow',
                type: 'treatment',
                title: 'Traitement fongicide',
                description: '',
                timing: 'J+15',
                windowStart: '2026-08-18T00:00:00.000Z',
                windowEnd: '2026-08-22T00:00:00.000Z',
                state: 'pending',
                inputs: [],
              },
            ],
            recommended: [],
          },
        },
      ],
    } as ItkParcelTasks);

    const { result } = renderHook(() => useHomeFeed());
    await waitFor(() => expect(result.current.isEnriching).toBe(false));

    const windowItem = allItems(result.current.sections).find((i) => i.id === 'window:p1:itWindow');
    expect(windowItem?.note).toBe('Conditions défavorables en ce moment — mesuré par le kit');
  });

  it('lit la température et la fraîcheur de la puce météo au format réel de l’API', async () => {
    const { result } = renderHook(() => useHomeFeed());
    await waitFor(() => expect(result.current.isEnriching).toBe(false));

    expect(result.current.weather).toMatchObject({
      tempC: 29,
      online: true,
      observedAt: '2026-08-19T08:56:00.000Z',
      hasKit: true,
    });
  });

  it('efface le message d’échec via dismissActionError', async () => {
    mockedFieldTasks.transition.mockRejectedValue(new Error('409'));

    const { result } = renderHook(() => useHomeFeed());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.runTaskAction('task:ft1', 'complete');
    });
    expect(result.current.actionError).toBe('Action non enregistrée, réessayez');

    act(() => {
      result.current.dismissActionError();
    });

    expect(result.current.actionError).toBeNull();
  });
});
