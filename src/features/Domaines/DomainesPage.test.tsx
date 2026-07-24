import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useAuthStore } from '@/shared/stores/authStore';

import { domainesApi } from './domaines.api';
import type { Domain, DomainsSummary, FarmerAlert } from './domaines.types';
import { DomainesPage } from './DomainesPage';

vi.mock('./domaines.api', () => ({
  domainesApi: { farms: vi.fn(), alerts: vi.fn(), summary: vi.fn(), vegetation: vi.fn() },
}));

// La carte Leaflet ne s'initialise pas sous jsdom → on la remplace par un stub.
vi.mock('./components/DomainMiniMap', () => ({
  DomainMiniMap: () => <div data-testid="mini-map" />,
}));

const mocked = vi.mocked(domainesApi);

const baseDomain: Domain = {
  id: 'farm-1',
  farmCode: 'FARM-001',
  farmerId: 'u1',
  name: 'Mamadou Aliou Barry',
  area: 13.8,
  areaUnit: 'hectares',
  coordinates: [
    { latitude: 9.5, longitude: -13.7 },
    { latitude: 9.6, longitude: -13.6 },
    { latitude: 9.55, longitude: -13.5 },
  ],
  centroid: { latitude: 9.55, longitude: -13.6 },
  status: 'active',
  parcelsCount: 4,
  stationMetrics: { ndvi: 0, temperature: 26, humidity: 68, wind: 12 },
  activeCultures: [
    { parcelId: 'p1', parcelName: 'Nord', cropType: 'Piment' },
    { parcelId: 'p2', parcelName: 'Sud', cropType: 'Banane' },
    { parcelId: 'p3', parcelName: 'Est', cropType: 'Ananas_baronne' },
  ],
  tasksCount: 0,
};

const summary: DomainsSummary = {
  farmerId: 'u1',
  totalFarms: 1,
  totalArea: 13.8,
  totalParcels: 4,
  avgNdvi: 0,
  avgTemperature: 26,
  alerts: { total: 2, critical: 0, warning: 2, info: 0 },
};

const alerts: FarmerAlert[] = [
  { id: 'a1', farmId: 'farm-1', farmName: 'Mamadou Aliou Barry', type: 'ndvi', severity: 'warning', status: 'active', title: 'x', message: 'x', createdAt: '2026-07-24' },
  { id: 'a2', farmId: 'farm-1', farmName: 'Mamadou Aliou Barry', type: 'soil', severity: 'info', status: 'active', title: 'y', message: 'y', createdAt: '2026-07-24' },
];

const renderPage = () =>
  render(
    <MemoryRouter>
      <DomainesPage />
    </MemoryRouter>,
  );

describe('DomainesPage', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: { uid: 'u1', displayName: 'Mamadou', phone: '+224620000000', role: 'farmer' },
      isAuthenticated: true,
    });
    // Végétation (NDVI) : optionnelle — vide par défaut, surchargeable par test.
    mocked.vegetation.mockResolvedValue({ farms: [] });
  });

  afterEach(() => {
    useAuthStore.setState({ user: null, isAuthenticated: false });
    vi.clearAllMocks();
  });

  it('affiche la barre de stats et la carte de domaine avec badge et cultures', async () => {
    mocked.farms.mockResolvedValue([baseDomain]);
    mocked.alerts.mockResolvedValue(alerts);
    mocked.summary.mockResolvedValue(summary);

    renderPage();

    // La carte apparaît après chargement
    expect(await screen.findByText('Mamadou Aliou Barry')).toBeDefined();

    // Barre de stats
    expect(screen.getByText('Parcelles')).toBeDefined();
    expect(screen.getByText('Hectares')).toBeDefined();
    expect(screen.getByText('NDVI moy.')).toBeDefined();

    // Ligne méta + badge (pire sévérité = warning → « Vigilance », libellé + compte séparés)
    expect(screen.getByText('13,8 ha · 4 parcelles · 3 cultures')).toBeDefined();
    expect(screen.getByText('Vigilance')).toBeDefined();
    expect(screen.getByText(/2 alertes/)).toBeDefined();

    // Chips cultures (initiale en majuscule, underscore conservé comme la référence)
    expect(screen.getByText('Piment')).toBeDefined();
    expect(screen.getByText('Ananas_baronne')).toBeDefined();

    // En-tête de section avec compteur
    expect(screen.getByText('Domaines')).toBeDefined();
  });

  it('dérive la barre de stats des domaines quand /dashboard renvoie 0 parcelle', async () => {
    mocked.farms.mockResolvedValue([{ ...baseDomain, parcelsCount: 9 }]);
    mocked.alerts.mockResolvedValue([]);
    mocked.summary.mockResolvedValue({
      ...summary,
      totalParcels: 0, // bug d'agrégation backend
      alerts: { total: 0, critical: 0, warning: 0, info: 0 },
    });

    renderPage();
    await screen.findByText('Mamadou Aliou Barry');

    // La valeur « Parcelles » de la barre reflète la somme des domaines (9), pas 0.
    expect(screen.getAllByText('9').length).toBeGreaterThan(0);
  });

  it('ne remonte pas une sévérité OAD inconnue (high) en Critique — plancher Info', async () => {
    mocked.farms.mockResolvedValue([baseDomain]);
    mocked.alerts.mockResolvedValue([{ ...alerts[0], severity: 'high' as never }]);
    mocked.summary.mockResolvedValue({ ...summary, alerts: { total: 1, critical: 0, warning: 0, info: 1 } });

    renderPage();

    // Aucune critical/warning explicite → plancher « Info » (pas d'escalade), sans planter.
    expect(await screen.findByText('Info')).toBeDefined();
    expect(screen.getByText(/1 alerte/)).toBeDefined();
  });

  it('affiche l’état vide quand l’agriculteur n’a aucun domaine', async () => {
    mocked.farms.mockResolvedValue([]);
    mocked.alerts.mockResolvedValue([]);
    mocked.summary.mockResolvedValue({ ...summary, totalFarms: 0, totalParcels: 0, totalArea: 0, alerts: { total: 0, critical: 0, warning: 0, info: 0 } });

    renderPage();

    expect(await screen.findByText(/Aucun domaine pour l’instant/)).toBeDefined();
  });

  it('affiche l’état d’erreur seulement si les domaines (farms) échouent', async () => {
    mocked.farms.mockRejectedValue(new Error('boom'));
    mocked.alerts.mockResolvedValue([]);
    mocked.summary.mockResolvedValue(summary);

    renderPage();

    expect(await screen.findByText('Chargement impossible')).toBeDefined();

    // Régression : le libellé du bouton ne doit pas être un <p> imbriqué dans le
    // <button> (nesting invalide → removeChild en navigateur). Doit être inline.
    const button = screen.getByText('Réessayer').closest('button');
    expect(button).not.toBeNull();
    expect(button?.querySelector('p')).toBeNull();
  });

  it('affiche quand même les domaines si un endpoint secondaire échoue', async () => {
    mocked.farms.mockResolvedValue([baseDomain]);
    mocked.alerts.mockRejectedValue(new Error('alerts down'));
    mocked.summary.mockRejectedValue(new Error('summary down'));

    renderPage();

    // Cœur de donnée (farms) disponible → carte affichée, pas d'état d'erreur.
    expect(await screen.findByText('Mamadou Aliou Barry')).toBeDefined();
    expect(screen.queryByText('Chargement impossible')).toBeNull();
    // Alertes indisponibles → aucun badge d'alerte (masqué quand 0 alerte).
    expect(screen.queryByText('Vigilance')).toBeNull();
    expect(screen.queryByText('Critique')).toBeNull();
  });
});
