import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { domainesApi } from '@/features/Domaines/domaines.api';
import type { Domain, DomainsSummary, FarmerAlert, Parcel } from '@/features/Domaines/domaines.types';
import { fieldTasksApi } from '@/features/FieldTasks/fieldTasks.api';
import type { FieldTask } from '@/features/FieldTasks/fieldTasks.types';
import { parcelleApi } from '@/features/Parcelle/parcelle.api';
import type { ItkParcelTasks } from '@/features/Parcelle/parcelle.types';
import { useAuthStore } from '@/shared/stores/authStore';

import { useHomeFeed } from './useHomeFeed';

vi.mock('@/features/Domaines/domaines.api', () => ({
  domainesApi: { alerts: vi.fn(), farms: vi.fn(), parcels: vi.fn(), summary: vi.fn(), liveStation: vi.fn() },
}));
vi.mock('@/features/Parcelle/parcelle.api', () => ({ parcelleApi: { itkTasks: vi.fn() } }));
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

describe('useHomeFeed', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: { uid: 'u1', displayName: 'Awa Diallo', phone: '+224620000000', role: 'farmer' },
      isAuthenticated: true,
    });
    mockedFieldTasks.list.mockResolvedValue([consigne]);
    mockedFieldTasks.transition.mockResolvedValue({ ...consigne, status: 'done' });
    mockedDomaines.alerts.mockResolvedValue(alerts);
    mockedDomaines.farms.mockResolvedValue(farms);
    mockedDomaines.summary.mockResolvedValue(summary);
    mockedDomaines.parcels.mockResolvedValue(parcels);
    mockedDomaines.liveStation.mockResolvedValue({
      station: { online: true, lastSeenAt: '2026-08-19T08:56:00.000Z', measures: { temperature: 29, rain: 0, wind: 8 } },
    });
    mockedParcelle.itkTasks.mockResolvedValue(itk);
  });

  afterEach(() => {
    useAuthStore.setState({ user: null, isAuthenticated: false });
    vi.clearAllMocks();
  });

  it('expose le fil, le récap et la météo une fois les vagues terminées', async () => {
    const { result } = renderHook(() => useHomeFeed());

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => expect(result.current.isEnriching).toBe(false));

    const ids = result.current.groups.flatMap((g) => g.items).map((i) => i.id);
    expect(ids).toContain('task:ft1');
    expect(ids).toContain('alert:al1');
    expect(ids).toContain('itk:p1:it1');
    expect(result.current.recap).toEqual({ domains: 3, parcels: 7, areaHa: 12.5, health: 'critical' });
    expect(result.current.weather?.tempC).toBe(29);
    expect(result.current.weather?.farmName).toBe('Domaine Kaporo');
  });

  it('affiche déjà consignes et alertes à la fin de la première vague', async () => {
    let resolveParcels: (value: Parcel[]) => void = () => {};
    mockedDomaines.parcels.mockReturnValue(new Promise<Parcel[]>((resolve) => { resolveParcels = resolve; }));

    const { result } = renderHook(() => useHomeFeed());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isEnriching).toBe(true);
    expect(result.current.groups.flatMap((g) => g.items).map((i) => i.id)).toContain('task:ft1');

    await act(async () => { resolveParcels(parcels); });
  });

  it('dégrade sans casser quand une source échoue', async () => {
    mockedParcelle.itkTasks.mockRejectedValue(new Error('400'));
    mockedFieldTasks.list.mockRejectedValue(new Error('500'));

    const { result } = renderHook(() => useHomeFeed());
    await waitFor(() => expect(result.current.isEnriching).toBe(false));

    const ids = result.current.groups.flatMap((g) => g.items).map((i) => i.id);
    expect(ids).toEqual(['alert:al1']);
    expect(result.current.error).toBeNull();
  });

  it('met à jour la consigne de façon optimiste puis confirme', async () => {
    const { result } = renderHook(() => useHomeFeed());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => { await result.current.runTaskAction('task:ft1', 'complete'); });

    const item = result.current.groups.flatMap((g) => g.items).find((i) => i.id === 'task:ft1');
    expect(mockedFieldTasks.transition).toHaveBeenCalledWith('ft1', 'complete');
    expect(item?.status).toBe('done');
    expect(result.current.actionError).toBeNull();
  });

  it('revient en arrière et signale l’échec quand la transition est refusée', async () => {
    mockedFieldTasks.transition.mockRejectedValue(new Error('409'));

    const { result } = renderHook(() => useHomeFeed());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => { await result.current.runTaskAction('task:ft1', 'complete'); });

    const item = result.current.groups.flatMap((g) => g.items).find((i) => i.id === 'task:ft1');
    expect(item?.status).toBe('planned');
    expect(result.current.actionError).toBe('Action non enregistrée, réessayez');
  });

  it('efface le message d’échec via dismissActionError', async () => {
    mockedFieldTasks.transition.mockRejectedValue(new Error('409'));

    const { result } = renderHook(() => useHomeFeed());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => { await result.current.runTaskAction('task:ft1', 'complete'); });
    expect(result.current.actionError).toBe('Action non enregistrée, réessayez');

    act(() => { result.current.dismissActionError(); });

    expect(result.current.actionError).toBeNull();
  });
});
