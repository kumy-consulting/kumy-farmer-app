import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { domainesApi } from '@/features/Domaines/domaines.api';
import type { Domain, DomainsSummary, FarmerAlert, Parcel } from '@/features/Domaines/domaines.types';
import { fieldTasksApi } from '@/features/FieldTasks/fieldTasks.api';
import type { FieldTask } from '@/features/FieldTasks/fieldTasks.types';
import { parcelleApi } from '@/features/Parcelle/parcelle.api';
import { useAuthStore } from '@/shared/stores/authStore';

import { HomePage } from './HomePage';

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

const renderPage = () =>
  render(
    <MemoryRouter>
      <HomePage />
    </MemoryRouter>,
  );

describe('HomePage (fil d’exploitation)', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: { uid: 'u1', displayName: 'Awa Diallo', phone: '+224620000000', role: 'farmer' },
      isAuthenticated: true,
    });
    mockedFieldTasks.list.mockResolvedValue([consigne]);
    mockedFieldTasks.transition.mockResolvedValue({ ...consigne, status: 'done', overdue: false, daysOverdue: 0 });
    mockedDomaines.alerts.mockResolvedValue(alerts);
    mockedDomaines.farms.mockResolvedValue([{ id: 'f1', name: 'Domaine Kaporo' }] as unknown as Domain[]);
    mockedDomaines.summary.mockResolvedValue(summary);
    mockedDomaines.parcels.mockResolvedValue([{ id: 'p1', name: 'Kaporo 2' }] as unknown as Parcel[]);
    mockedDomaines.liveStation.mockResolvedValue({
      station: { online: true, lastSeenAt: '2026-08-19T08:56:00.000Z', measures: { temperature: 29, rain: 0, wind: 8 } },
    });
    mockedParcelle.itkTasks.mockResolvedValue({ parcelId: 'p1', hasActiveCampaign: false, daysAfterSowing: 0, currentStage: null, itkValidationStatus: 'web_provisional', stages: [] });
  });

  afterEach(() => {
    useAuthStore.setState({ user: null, isAuthenticated: false });
    vi.clearAllMocks();
  });

  it('affiche l’en-tête, le récap et le fil groupé par urgence', async () => {
    renderPage();

    expect(await screen.findByText(/Bonjour, Awa/)).toBeDefined();
    expect(await screen.findByText('À traiter maintenant')).toBeDefined();
    expect(await screen.findByText('Sarclage manuel')).toBeDefined();
    expect(await screen.findByText('Fortes pluies attendues')).toBeDefined();
    expect(await screen.findByText('3 domaines · 7 parcelles · 12,5 ha')).toBeDefined();

    // Plus aucune trace du tableau de bord météo
    expect(screen.queryByText('Prévisions 5 jours')).toBeNull();
    expect(screen.queryByText('Vos domaines')).toBeNull();
  });

  it('valide une consigne depuis le fil', async () => {
    renderPage();
    const done = await screen.findByRole('button', { name: 'Terminé' });

    fireEvent.click(done);

    await waitFor(() => expect(mockedFieldTasks.transition).toHaveBeenCalledWith('ft1', 'complete'));
    expect(await screen.findByText('Fait')).toBeDefined();
  });

  it('annonce un fil vide sans rien inventer', async () => {
    mockedFieldTasks.list.mockResolvedValue([]);
    mockedDomaines.alerts.mockResolvedValue([]);

    renderPage();

    expect(await screen.findByText(/Rien d’urgent aujourd’hui/)).toBeDefined();
  });

  it('déplie « Voir tout » sans perdre d’éléments au-delà du plafond', async () => {
    const manyAlerts: FarmerAlert[] = Array.from({ length: 9 }, (_, index) => ({
      id: `al${index}`,
      farmId: 'f1',
      farmName: 'Domaine Kaporo',
      parcelId: 'p1',
      parcelName: 'Kaporo 2',
      type: 'weather',
      severity: 'critical',
      status: 'active',
      title: `Alerte ${index}`,
      message: '',
      recommendedAction: '',
      createdAt: `2026-08-19T0${index}:00:00.000Z`,
    }));
    mockedFieldTasks.list.mockResolvedValue([]);
    mockedDomaines.alerts.mockResolvedValue(manyAlerts);

    renderPage();

    expect(await screen.findByText('Alerte 0')).toBeDefined();
    expect(screen.queryByText('Alerte 8')).toBeNull();
    const seeAll = await screen.findByRole('button', { name: 'Voir tout (1)' });

    fireEvent.click(seeAll);

    expect(await screen.findByText('Alerte 8')).toBeDefined();
    expect(screen.queryByRole('button', { name: /Voir tout/ })).toBeNull();
  });
});
