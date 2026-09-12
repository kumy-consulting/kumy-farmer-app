import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useAuthStore } from '@/shared/stores/authStore';

import { DomaineDetailPage } from './DomaineDetailPage';
import { domainesApi } from './domaines.api';
import type { Domain, FarmerFarmsVegetation, FarmForecast, Parcel } from './domaines.types';

vi.mock('./domaines.api', () => ({
  domainesApi: {
    vegetation: vi.fn(),
    farms: vi.fn(),
    parcels: vi.fn(),
    alerts: vi.fn(),
    summary: vi.fn(),
    liveStation: vi.fn(),
    forecast: vi.fn(),
  },
}));

// La carte Leaflet ne s'initialise pas sous jsdom → stub.
vi.mock('./components/DomaineDetailMap', () => ({
  DomaineDetailMap: () => <div data-testid="detail-map" />,
}));

const mocked = vi.mocked(domainesApi);

const vegetation: FarmerFarmsVegetation = {
  farms: [
    {
      farmId: 'farm-1',
      name: 'Test Ingenieurs',
      coordinates: [
        [9.5, -13.7],
        [9.6, -13.6],
        [9.55, -13.5],
      ],
      parcels: [
        {
          parcelId: 'p1',
          name: 'Ananas 2',
          culture: 'ananas',
          variety: '',
          area: '0.74 ha',
          status: 'active',
          stade: '',
          coordinates: [
            [9.5, -13.7],
            [9.6, -13.6],
            [9.55, -13.5],
          ],
          bounds: { north: 9.6, south: 9.5, east: -13.5, west: -13.7 },
          ndvi: 0,
        },
      ],
    },
  ],
};

const enrichedFarm: Domain = {
  id: 'farm-1',
  farmCode: 'F1',
  farmerId: 'u1',
  name: 'Test Ingenieurs',
  area: 12.2,
  areaUnit: 'hectares',
  coordinates: [],
  centroid: { latitude: 9.55, longitude: -13.6 },
  status: 'active',
  parcelsCount: 6,
  stationMetrics: { ndvi: 0, temperature: 26, humidity: 68, wind: 12 },
  activeCultures: [],
  tasksCount: 0,
};

const parcels: Parcel[] = [
  {
    id: 'p1',
    name: 'Ananas 2',
    area: 0.74,
    status: 'active',
    currentStageCode: 'S1', // → sous ITK
    currentCrop: { cropType: 'ananas', plantingDate: '2026-06-24' },
    // NDVI via lastIndicators (parcels) — couverture plus large que la végétation.
    lastIndicators: {
      ndvi: 0.62,
      status: 'healthy',
      tileUrl: 'https://example.test/ndvi/p1.png',
      bounds: { north: 9.6, south: 9.5, east: -13.5, west: -13.7 },
    },
  },
  {
    id: 'p2',
    name: 'Aubergine',
    area: 0.39,
    status: 'active',
    currentCrop: { cropType: 'aubergine', plantingDate: '2026-06-24' },
    // Pas de lastIndicators ni de végétation → « Données absentes ».
  },
];

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={['/domaines/farm-1']}>
      <Routes>
        <Route path="/domaines/:id" element={<DomaineDetailPage />} />
      </Routes>
    </MemoryRouter>,
  );

const conf = (value: number) => ({ value, confidence: 0.9, tier: 'c1' as const });

/** Prévision minimale : une seule journée, aucune heure. */
const forecast: FarmForecast = {
  resolvedFrom: {
    source: 'station',
    track: 'A',
    stationId: 'KMY-WE-2606-00001-K',
    distanceM: 120,
    cellId: '9.6_-13.5',
  },
  daily5d: [
    {
      date: '2026-08-28',
      tmin: conf(23),
      tmax: conf(30),
      tavg: conf(27),
      humidity: conf(90),
      windMax: conf(13.7),
      windGust: conf(18),
      solar: conf(18),
      etp: conf(4),
      rain: {
        probGt1mm: 0.97,
        probGt10mm: 0.4,
        probGt20mm: 0.1,
        expectedMm: 6,
        p10Mm: 0,
        p90Mm: 18,
        spreadMm: 9,
        confidence: 0.5,
        tier: 'c3',
      },
    },
  ],
  todayHourly: [],
  overallConfidence: { daily: 0.82, hourly: 0.6 },
};

describe('DomaineDetailPage', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: { uid: 'u1', displayName: 'Mamadou Aliou Barry', phone: '+224620000000', role: 'farmer' },
      isAuthenticated: true,
    });
    mocked.vegetation.mockResolvedValue(vegetation);
    mocked.farms.mockResolvedValue([enrichedFarm]);
    mocked.parcels.mockResolvedValue(parcels);
    mocked.alerts.mockResolvedValue([]);
    mocked.summary.mockResolvedValue({
      farmerId: 'u1',
      totalFarms: 7,
      totalArea: 822.3,
      totalParcels: 20,
      avgNdvi: 0,
      avgTemperature: 26,
      alerts: { total: 0, critical: 0, warning: 0, info: 0 },
    });
    mocked.liveStation.mockResolvedValue({ station: null });
    // Par défaut : prévision pas encore calculée (404) — le bloc reste masqué.
    mocked.forecast.mockRejectedValue(new Error('404'));
  });

  afterEach(() => {
    useAuthStore.setState({ user: null, isAuthenticated: false });
    vi.clearAllMocks();
  });

  it('affiche l’en-tête (nom agriculteur + total), les stats et la liste de parcelles', async () => {
    renderPage();

    // En-tête : nom du DOMAINE en titre + sous-titre propre à ce domaine + agriculteur en filigrane
    expect(await screen.findByText('Test Ingenieurs')).toBeDefined();
    expect(screen.getByText(/2 parcelles · 12,2 ha/)).toBeDefined();
    expect(screen.getByText('Mamadou Aliou Barry')).toBeDefined();

    // Stats (4 tuiles)
    expect(screen.getByText('Sous ITK')).toBeDefined();
    expect(screen.getByText('Cultivée (ha)')).toBeDefined();

    // Section + carte parcelle (« Parcelles » apparaît en onglet ET en titre)
    expect(screen.getAllByText('Parcelles').length).toBeGreaterThan(0);
    expect(screen.getByText('Ananas 2')).toBeDefined();

    // Ananas 2 a un NDVI via lastIndicators → libellé NDVI présent.
    expect(screen.getByText(/NDVI · Bon · 0\.62/)).toBeDefined();

    // Aubergine sans indicateurs → badge « En attente » + état de scan gracieux.
    expect(screen.getByText('En attente')).toBeDefined();
    expect(screen.getByText('NDVI en attente de scan')).toBeDefined();
  });

  it('bascule sur l’onglet Météos et affiche l’état sans station', async () => {
    const { findByText, getByText, queryByText } = renderPage();
    await findByText('Ananas 2');

    getByText('Météos').click();

    expect(await findByText(/Aucune station météo installée/)).toBeDefined();
    // Prévision en échec (404 par défaut) → aucun encart vide à sa place.
    expect(queryByText(/Prévision 5 jours/i)).toBeNull();
  });

  it('affiche la prévision du domaine quand l’API la renvoie', async () => {
    // Régression : `GET /farms/:id/forecast` a longtemps répondu 403 au rôle
    // FARMER. Ce test tient le câblage — hook → page → onglet — le jour où
    // l'API redevient muette pour de mauvaises raisons.
    mocked.forecast.mockResolvedValue(forecast);

    const { findByText, getByText } = renderPage();
    await findByText('Ananas 2');

    getByText('Météos').click();

    expect(await findByText(/Prévision 5 jours/i)).toBeDefined();
    expect(getByText('30°')).toBeDefined();
  });
});
