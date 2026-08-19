import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import dayjs from 'dayjs';
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
  dueDate: dayjs().subtract(2, 'day').format('YYYY-MM-DD'),
  status: 'planned',
  overdue: true,
  daysOverdue: 2,
  createdBy: 'e1',
  createdByName: 'Dr Camara',
  visitId: null,
  startedAt: null,
  completedAt: null,
  createdAt: dayjs().subtract(7, 'day').toISOString(),
  updatedAt: dayjs().subtract(7, 'day').toISOString(),
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
    createdAt: dayjs().subtract(3, 'hour').toISOString(),
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

  it('range l’accueil en trois sections : alertes, tâches, visites', async () => {
    renderPage();

    expect(await screen.findByText(/Bonjour, Awa/)).toBeDefined();
    expect(await screen.findByText('Alertes')).toBeDefined();
    expect(await screen.findByText('Tâches')).toBeDefined();
    expect(await screen.findByText('Visites')).toBeDefined();
    expect(await screen.findByText('Fortes pluies attendues')).toBeDefined();
    expect(await screen.findByText('Sarclage manuel')).toBeDefined();
    expect(await screen.findByText('3 domaines · 7 parcelles · 12,5 ha')).toBeDefined();

    // Plus aucune trace du tableau de bord météo
    expect(screen.queryByText('Prévisions 5 jours')).toBeNull();
    expect(screen.queryByText('Vos domaines')).toBeNull();
  });

  it('annonce une prochaine visite inconnue plutôt que d’en inventer une', async () => {
    renderPage();

    expect(await screen.findByText('Prochaine')).toBeDefined();
    expect(await screen.findByText('Non planifiée')).toBeDefined();
  });

  it('valide une consigne depuis la section Tâches', async () => {
    renderPage();
    const done = await screen.findByRole('button', { name: 'Terminé' });

    fireEvent.click(done);

    await waitFor(() => expect(mockedFieldTasks.transition).toHaveBeenCalledWith('ft1', 'complete'));
    expect(await screen.findByText('Fait')).toBeDefined();
  });

  it('ouvre sur le segment le plus urgent et filtre au changement de compteur', async () => {
    mockedFieldTasks.list.mockResolvedValue([
      consigne,
      { ...consigne, id: 'ft2', title: 'Apport urée', overdue: false, daysOverdue: 0, dueDate: dayjs().add(3, 'day').format('YYYY-MM-DD') },
    ]);

    renderPage();

    // Segment « En retard » ouvert par défaut : la consigne en retard est visible, pas l'autre.
    expect(await screen.findByText('Sarclage manuel')).toBeDefined();
    expect(screen.queryByText('Apport urée')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: /Prévu/ }));

    expect(await screen.findByText('Apport urée')).toBeDefined();
    expect(screen.queryByText('Sarclage manuel')).toBeNull();
  });

  it('propose le travail qui attend quand le segment ouvert est vide', async () => {
    mockedFieldTasks.list.mockResolvedValue([consigne]);

    renderPage();

    fireEvent.click(await screen.findByRole('button', { name: /En cours/ }));
    expect(await screen.findByText('Aucune tâche démarrée.')).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: 'Voir la tâche en retard' }));

    expect(await screen.findByText('Sarclage manuel')).toBeDefined();
  });

  it('montre les trois alertes les plus récentes puis déplie le reste', async () => {
    const many: FarmerAlert[] = Array.from({ length: 5 }, (_, index) => ({
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
      createdAt: dayjs().subtract(index, 'hour').toISOString(),
    }));
    mockedDomaines.alerts.mockResolvedValue(many);

    renderPage();

    expect(await screen.findByText('Alerte 0')).toBeDefined();
    expect(screen.queryByText('Alerte 4')).toBeNull();

    fireEvent.click(await screen.findByRole('button', { name: 'Voir les 2 autres alertes' }));

    expect(await screen.findByText('Alerte 4')).toBeDefined();
  });

  it('écarte les alertes périmées du décompte tout en les gardant consultables', async () => {
    mockedDomaines.alerts.mockResolvedValue([
      {
        id: 'vieille',
        farmId: 'f1',
        farmName: 'Domaine Kaporo',
        parcelId: 'p1',
        parcelName: 'Kaporo 2',
        type: 'ndvi',
        severity: 'critical',
        status: 'active',
        title: 'NDVI en chute',
        message: '',
        createdAt: dayjs().subtract(66, 'day').toISOString(),
      },
    ]);

    renderPage();

    expect(await screen.findByText('Aucune alerte récente sur vos parcelles.')).toBeDefined();
    expect(screen.queryByText('NDVI en chute')).toBeNull();

    fireEvent.click(await screen.findByRole('button', { name: 'Voir l’ancienne' }));

    expect(await screen.findByText('NDVI en chute')).toBeDefined();
  });

  it('annonce un accueil vide sans rien inventer', async () => {
    mockedFieldTasks.list.mockResolvedValue([]);
    mockedDomaines.alerts.mockResolvedValue([]);

    renderPage();

    expect(await screen.findByText(/Rien d’urgent aujourd’hui/)).toBeDefined();
  });
});
