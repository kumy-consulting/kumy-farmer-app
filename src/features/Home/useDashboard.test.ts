import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { domainesApi } from '@/features/Domaines/domaines.api';
import type { Domain, FarmerAlert, Parcel } from '@/features/Domaines/domaines.types';
import { parcelleApi } from '@/features/Parcelle/parcelle.api';
import type { ItkParcelTasks } from '@/features/Parcelle/parcelle.types';
import { useAuthStore } from '@/shared/stores/authStore';

import { useDashboard } from './useDashboard';

vi.mock('@/features/Domaines/domaines.api', () => ({
  domainesApi: { alerts: vi.fn(), farms: vi.fn(), parcels: vi.fn() },
}));
vi.mock('@/features/Parcelle/parcelle.api', () => ({ parcelleApi: { itkTasks: vi.fn() } }));

const mockedDomaines = vi.mocked(domainesApi);
const mockedParcelle = vi.mocked(parcelleApi);

const alerts: FarmerAlert[] = [
  {
    id: 'al1',
    farmId: 'f1',
    farmName: 'Domaine Test',
    type: 'ndvi',
    severity: 'critical',
    status: 'active',
    title: 'NDVI en baisse critique',
    message: 'Le NDVI a chuté.',
    createdAt: '2026-07-29T08:00:00.000Z',
  },
];
const farms = [{ id: 'f1', name: 'Domaine Test' }] as unknown as Domain[];
const parcels = [{ id: 'p1', name: 'Parcelle Nord', status: 'active', currentStageCode: 'S1' }] as unknown as Parcel[];
const itk: ItkParcelTasks = {
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
            type: 'irrigation',
            title: 'Irrigation goutte-à-goutte',
            description: '',
            timing: 'J0',
            windowStart: '2026-07-29T00:00:00.000Z',
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
};

describe('useDashboard', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: { uid: 'u1', displayName: 'Awa Diallo', phone: '+224620000000', role: 'farmer' },
      isAuthenticated: true,
    });
    mockedDomaines.alerts.mockResolvedValue(alerts);
    mockedDomaines.farms.mockResolvedValue(farms);
    mockedDomaines.parcels.mockResolvedValue(parcels);
    mockedParcelle.itkTasks.mockResolvedValue(itk);
  });

  afterEach(() => {
    useAuthStore.setState({ user: null, isAuthenticated: false });
    vi.clearAllMocks();
  });

  it('démarre en chargement puis expose alertes et activités ITK branchées', async () => {
    const { result } = renderHook(() => useDashboard());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeNull();

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data?.alerts).toHaveLength(1);
    expect(result.current.data?.alerts[0].message).toBe('NDVI en baisse critique');
    expect(result.current.data?.activities).toHaveLength(1);
    expect(result.current.data?.activities[0].title).toBe('Irrigation goutte-à-goutte');
    // Sections encore maquettées
    expect(result.current.data?.overview.domains).toBeGreaterThan(0);
    expect(result.current.data?.weather.location).toBeTruthy();
  });
});
