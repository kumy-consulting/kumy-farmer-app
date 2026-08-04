import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { domainesApi } from '@/features/Domaines/domaines.api';
import type { Domain, FarmerAlert, Parcel } from '@/features/Domaines/domaines.types';
import { parcelleApi } from '@/features/Parcelle/parcelle.api';
import type { ItkParcelTasks } from '@/features/Parcelle/parcelle.types';
import { useAuthStore } from '@/shared/stores/authStore';

import { HomePage } from './HomePage';

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
    farmName: 'Domaine Kaporo',
    type: 'weather',
    severity: 'critical',
    status: 'active',
    title: 'Risque de sécheresse élevé sur vos cultures',
    message: 'Détail météo.',
    createdAt: '2026-07-29T08:00:00.000Z',
  },
];
const farms = [{ id: 'f1', name: 'Domaine Kaporo' }] as unknown as Domain[];
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

const renderPage = () =>
  render(
    <MemoryRouter>
      <HomePage />
    </MemoryRouter>,
  );

describe('HomePage (tableau de bord)', () => {
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

  it('salue l’agriculteur par son prénom après chargement', async () => {
    renderPage();
    expect(await screen.findByText(/Bonjour, Awa/)).toBeDefined();
  });

  it('affiche les alertes et activités ITK branchées + la vue d’ensemble', async () => {
    renderPage();
    await screen.findByText(/Bonjour, Awa/);

    // Sections
    expect(screen.getByText('Alertes')).toBeDefined();
    expect(screen.getByText('Activités planifiées')).toBeDefined();
    expect(screen.getByText('Vos domaines')).toBeDefined();

    // Contenu réel (issu de l'API mockée)
    expect(await screen.findByText(/Risque de sécheresse/)).toBeDefined();
    expect(await screen.findByText('Irrigation goutte-à-goutte')).toBeDefined();

    // Vue d'ensemble (encore maquettée)
    expect(screen.getByText('Domaines')).toBeDefined();
    expect(screen.getByText('Surface exploitée')).toBeDefined();
  });
});
