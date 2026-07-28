import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { Parcel } from '@/features/Domaines/domaines.types';

import { ParcelDetailPage } from './ParcelDetailPage';
import { parcelleApi } from './parcelle.api';
import type { IndicatorPoint, ItkParcelTasks, ItkStage, YieldEstimate } from './parcelle.types';

vi.mock('./parcelle.api', () => ({
  parcelleApi: {
    parcel: vi.fn(),
    itkTasks: vi.fn(),
    indicators: vi.fn(),
    yieldEstimate: vi.fn(),
  },
}));

// La carte Leaflet ne s'initialise pas sous jsdom → stub.
vi.mock('./components/ParcelMapHero', () => ({
  ParcelMapHero: () => <div data-testid="parcel-map" />,
}));

const mocked = vi.mocked(parcelleApi);

const parcel: Parcel = {
  id: 'p1',
  name: 'Ananas 2',
  area: 0.74,
  status: 'active',
  currentCrop: {
    cropType: 'ananas',
    variety: 'MD2',
    plantingDate: '2026-06-24',
    expectedHarvestDate: '2027-01-15',
  },
  lastIndicators: {
    ndvi: 0.62,
    status: 'healthy',
    tileUrl: 'https://example.test/ndvi/p1.png',
    bounds: { north: 9.6, south: 9.5, east: -13.5, west: -13.7 },
  },
};

const stages: ItkStage[] = [
  {
    stageCode: 'S1',
    stageName: 'Préparation',
    order: 1,
    expectedStart: '2026-06-01',
    expectedEnd: '2026-06-10',
    status: 'completed',
    dayStart: 0,
    dayEnd: 10,
    description: 'Préparation du sol.',
    critical: false,
    tasks: { mandatory: [], recommended: [] },
    risks: [],
  },
  {
    stageCode: 'S2',
    stageName: 'Croissance',
    order: 2,
    expectedStart: '2026-06-11',
    expectedEnd: '2026-07-20',
    status: 'inProgress',
    dayStart: 11,
    dayEnd: 40,
    description: 'Phase de croissance végétative.',
    critical: true,
    tasks: {
      mandatory: [
        {
          taskId: 't1',
          type: 'fertilization',
          title: 'Apport azoté',
          description: 'Épandre 50 kg/ha.',
          timing: 'J+15 à J+20',
          windowStart: null,
          windowEnd: null,
          state: 'pending',
          inputs: [{ product: 'Urée', dosePerHa: 50, unit: 'kg' }],
        },
      ],
      recommended: [],
    },
    risks: [
      {
        type: 'parasitic',
        name: 'Cochenille',
        scientificName: 'Dysmicoccus brevipes',
        trigger: 'Temps chaud et sec prolongé',
        severity: 'high',
        recommendation: 'Inspecter le collet et traiter si présence.',
      },
    ],
  },
  {
    stageCode: 'S3',
    stageName: 'Floraison',
    order: 3,
    expectedStart: '2026-07-21',
    expectedEnd: '2026-08-30',
    status: 'upcoming',
    dayStart: 41,
    dayEnd: 90,
    description: 'Induction florale.',
    critical: false,
    tasks: { mandatory: [], recommended: [] },
    risks: [],
  },
];

const itk: ItkParcelTasks = {
  parcelId: 'p1',
  hasActiveCampaign: true,
  cropType: 'ananas',
  variety: 'MD2',
  plantingDate: '2026-06-24',
  daysAfterSowing: 34,
  currentStage: { stageCode: 'S2', stageName: 'Croissance', order: 2 },
  stages,
  itkValidationStatus: 'web_provisional',
};

const indicators: IndicatorPoint[] = [
  { date: '2026-06-01', ndvi: 0.4 },
  { date: '2026-07-01', ndvi: 0.62 },
];

const yieldEstimate: YieldEstimate = {
  value: 42.5,
  unit: 't/ha',
  confidenceInterval: { low: 38, high: 47 },
  confidence: 72,
  referenceYield: 40,
  potential: 50,
  daysSinceSowing: 34,
};

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={['/domaines/farm-1/parcelles/p1']}>
      <Routes>
        <Route path="/domaines/:id/parcelles/:parcelId" element={<ParcelDetailPage />} />
      </Routes>
    </MemoryRouter>,
  );

describe('ParcelDetailPage', () => {
  beforeEach(() => {
    mocked.parcel.mockResolvedValue(parcel);
    mocked.itkTasks.mockResolvedValue(itk);
    mocked.indicators.mockResolvedValue(indicators);
    mocked.yieldEstimate.mockResolvedValue(yieldEstimate);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('affiche l’en-tête, les 3 onglets et la vue d’ensemble par défaut', async () => {
    renderPage();

    // En-tête : nom de la parcelle + culture en sous-titre.
    expect(await screen.findByText('Ananas 2')).toBeDefined();

    // Onglets Vue d'ensemble + Calendrier + Conseils.
    expect(screen.getByText("Vue d'ensemble")).toBeDefined();
    expect(screen.getByText('Calendrier')).toBeDefined();
    expect(screen.getByText('Conseils')).toBeDefined();

    // Vue d'ensemble par défaut : infos générales + estimation de rendement.
    expect(screen.getByText('Informations générales')).toBeDefined();
    expect(screen.getByText('Date de semis')).toBeDefined();
    expect(screen.getByText('Récolte prévue')).toBeDefined();
    expect(screen.getByText('Estimation de rendement')).toBeDefined();
    // « 42,5 » apparaît dans la bande KPI ET la carte rendement de la vue d'ensemble.
    expect(screen.getAllByText('42,5').length).toBeGreaterThan(0);
  });

  it('bascule sur Calendrier et affiche le stade courant avec sa tâche', async () => {
    const { findByText, getByText, getAllByText } = renderPage();
    await findByText('Ananas 2');

    getByText('Calendrier').click();

    expect(await findByText('Apport azoté')).toBeDefined();
    expect(getAllByText('Croissance').length).toBeGreaterThan(0);
    expect(getByText('Tâches obligatoires')).toBeDefined();
  });

  it('bascule sur Conseils et affiche synthèse, risque et évolution NDVI', async () => {
    const { findByText, getByText } = renderPage();
    await findByText('Ananas 2');

    getByText('Conseils').click();

    // Carte de risque : nom + « Que faire » (recommandation).
    expect(await findByText('Cochenille')).toBeDefined();
    expect(getByText('Inspecter le collet et traiter si présence.')).toBeDefined();
    expect(getByText('Risques & recommandations')).toBeDefined();
    expect(getByText('Évolution de la végétation')).toBeDefined();
  });

  it('affiche un état vide Calendrier quand la campagne n’est pas active', async () => {
    mocked.itkTasks.mockResolvedValue({ ...itk, hasActiveCampaign: false, stages: [], currentStage: null });
    const { findByText, getByText } = renderPage();
    await findByText('Ananas 2');

    getByText('Calendrier').click();

    expect(await findByText('Calendrier en préparation')).toBeDefined();
  });

  it('affiche l’écran de nouvelle tentative en cas d’erreur', async () => {
    mocked.parcel.mockRejectedValue(new Error('boom'));
    mocked.itkTasks.mockRejectedValue(new Error('boom'));
    mocked.indicators.mockRejectedValue(new Error('boom'));
    const { findByText } = renderPage();

    expect(await findByText('Réessayer')).toBeDefined();
  });
});
