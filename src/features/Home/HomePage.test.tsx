import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import dayjs from 'dayjs';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { domainesApi } from '@/features/Domaines/domaines.api';
import type { Domain, DomainsSummary, FarmerAlert, FarmLiveStation, Parcel } from '@/features/Domaines/domaines.types';
import { fieldTasksApi } from '@/features/FieldTasks/fieldTasks.api';
import type { FieldTask } from '@/features/FieldTasks/fieldTasks.types';
import { parcelleApi } from '@/features/Parcelle/parcelle.api';
import { useAuthStore } from '@/shared/stores/authStore';

import { HomePage } from './HomePage';

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

describe('HomePage (tableau de bord)', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: { uid: 'u1', displayName: 'Awa Diallo', phone: '+224620000000', role: 'farmer' },
      isAuthenticated: true,
    });
    mockedFieldTasks.list.mockResolvedValue([consigne]);
    mockedFieldTasks.transition.mockResolvedValue({ ...consigne, status: 'done', overdue: false, daysOverdue: 0 });
    mockedDomaines.alerts.mockResolvedValue(alerts);
    mockedDomaines.farms.mockResolvedValue([
      { id: 'f1', name: 'Domaine Kaporo' },
      { id: 'f2', name: 'Plaine de Dubréka' },
      { id: 'f3', name: 'Bas-fond Tanènè' },
    ] as unknown as Domain[]);
    mockedDomaines.summary.mockResolvedValue(summary);
    mockedDomaines.visits.mockResolvedValue({ next: null, recent: [] });
    mockedDomaines.parcels.mockResolvedValue([
      { id: 'p1', name: 'Kaporo 2', currentCrop: { cropType: 'ananas' } },
    ] as unknown as Parcel[]);
    mockedDomaines.liveStation.mockResolvedValue({
      station: liveStation({
        online: true,
        lastSeen: '2026-08-19T08:56:00.000Z',
        temperature: 29,
        rainRate: 0,
        windSpeed: 8,
      }),
    });
    mockedParcelle.itkTasks.mockResolvedValue({
      parcelId: 'p1',
      hasActiveCampaign: false,
      daysAfterSowing: 0,
      currentStage: null,
      itkValidationStatus: 'web_provisional',
      stages: [],
    });
    mockedParcelle.climateContext.mockRejectedValue(new Error('pas de contexte'));
  });

  afterEach(() => {
    useAuthStore.setState({ user: null, isAuthenticated: false });
    vi.clearAllMocks();
  });

  it('ouvre sur l’état de l’exploitation, avec la raison du verdict', async () => {
    renderPage();

    expect(await screen.findByText(/Bonjour, Awa/)).toBeDefined();
    // Une alerte critique commande le verdict — et le verdict dit quoi faire,
    // pas seulement à quel point c'est grave.
    expect(await screen.findByText('Intervention urgente')).toBeDefined();
    expect(await screen.findByText('1 alerte active et 1 action en retard.')).toBeDefined();
    // Le compte de parcelles vient de celles réellement chargées : `/dashboard`
    // renvoie parfois 0 par bug d'agrégation, et « 0 parcelle » se lirait comme
    // une exploitation vide.
    expect(await screen.findByText('3 domaines · 12,5 ha · 1 parcelle')).toBeDefined();
  });

  it('fond alertes et actions dans une seule liste à traiter, la plus grave en tête', async () => {
    renderPage();

    expect(await screen.findByText('À traiter')).toBeDefined();
    const alerte = await screen.findByText('Fortes pluies attendues');
    const action = await screen.findByText('Sarclage manuel');
    // L'alerte critique passe avant la consigne en retard : gravité d'abord.
    expect(alerte.compareDocumentPosition(action) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    // Chaque élément dit s'il se consulte ou s'il se fait.
    expect(await screen.findByText('Alerte')).toBeDefined();
    expect(await screen.findByText('Action')).toBeDefined();
  });

  it('situe chaque élément : domaine, parcelle et culture', async () => {
    renderPage();

    // « Alerte sanitaire » ne suffit pas : il faut savoir où agir.
    expect(await screen.findAllByText('Domaine Kaporo · Kaporo 2 · Ananas')).toHaveLength(2);
  });

  it('date les échéances au lieu d’en compter les jours', async () => {
    renderPage();

    const attendu = `En retard depuis le ${dayjs().subtract(2, 'day').format('D MMMM')}`;
    expect(await screen.findByText(attendu)).toBeDefined();
    expect(screen.queryByText(/il y a 2 j/)).toBeNull();
  });

  it('valide une consigne depuis la liste à traiter', async () => {
    renderPage();
    const done = await screen.findByRole('button', { name: 'Terminé' });

    fireEvent.click(done);

    await waitFor(() => expect(mockedFieldTasks.transition).toHaveBeenCalledWith('ft1', 'complete'));
  });

  it('n’affiche pas « 0 parcelle » quand le compte est inconnu', async () => {
    // Ni parcelle chargée, ni total côté dashboard : le compte est inconnu, pas nul.
    mockedDomaines.parcels.mockResolvedValue([]);
    mockedDomaines.summary.mockResolvedValue({ ...summary, totalParcels: 0 });

    renderPage();

    expect(await screen.findByText('3 domaines · 12,5 ha')).toBeDefined();
    expect(screen.queryByText(/0 parcelle/)).toBeNull();
  });

  it('résume l’état des domaines sans les lister', async () => {
    renderPage();

    expect(await screen.findByText('Mes domaines')).toBeDefined();
    // Le domaine porteur de l'alerte critique est compté comme tel, les autres normaux.
    expect(await screen.findByText(/critique/)).toBeDefined();
    expect(await screen.findByText(/normaux/)).toBeDefined();
    // La répartition est annoncée d'un bloc aux lecteurs d'écran.
    expect(
      await screen.findByRole('img', { name: 'Répartition de vos 3 domaines : 1 critique, 2 normaux' }),
    ).toBeDefined();
  });

  it('annonce une prochaine visite inconnue plutôt que d’en inventer une', async () => {
    renderPage();

    expect(await screen.findByText('Mon accompagnement')).toBeDefined();
    // « Pas encore fixée » dit ce qu'on sait ; « Non planifiée » affirmerait
    // qu'il n'y a pas de visite prévue, ce que l'API ne permet pas de savoir.
    expect(await screen.findByText('Pas encore fixée')).toBeDefined();
    expect(screen.queryByText('Non planifiée')).toBeNull();
    // Sans visite enregistrée, aucun lien : il n'y a rien à ouvrir.
    expect(screen.queryByText('Voir la dernière visite')).toBeNull();
  });

  it('ne laisse pas le volume de retards rendre l’exploitation critique', async () => {
    // Cinq consignes en retard, aucune alerte : c'est « Attention requise », pas
    // une urgence — la gravité est métier, pas quantitative (règle 3).
    mockedDomaines.alerts.mockResolvedValue([]);
    mockedFieldTasks.list.mockResolvedValue(
      Array.from({ length: 5 }, (_, i) => ({ ...consigne, id: `ft${i}`, title: `Consigne ${i}` })),
    );
    mockedDomaines.summary.mockResolvedValue({ ...summary, alerts: { total: 0, critical: 0, warning: 0, info: 0 } });

    renderPage();

    expect(await screen.findByText('Attention requise')).toBeDefined();
    expect(screen.queryByText('Intervention urgente')).toBeNull();
    expect(await screen.findByText('5 actions en retard.')).toBeDefined();
  });

  it('ne montre que trois éléments, et déplie puis replie le reste', async () => {
    mockedDomaines.alerts.mockResolvedValue([]);
    mockedFieldTasks.list.mockResolvedValue(
      Array.from({ length: 6 }, (_, i) => ({
        ...consigne,
        id: `ft${i}`,
        title: `Consigne ${i}`,
        status: 'planned' as const,
        overdue: false,
        daysOverdue: 0,
        dueDate: dayjs().add(i + 3, 'day').format('YYYY-MM-DD'),
      })),
    );

    renderPage();

    // Six consignes, trois affichées : le bloc garde une hauteur prévisible
    // quel que soit l'état de l'exploitation.
    const voir = await screen.findByText('Voir les 3 autres');
    expect(screen.getByText('Consigne 0')).toBeDefined();
    expect(screen.queryByText('Consigne 5')).toBeNull();

    fireEvent.click(voir);
    expect(await screen.findByText('Consigne 5')).toBeDefined();

    // Et la liste se referme : elle s'ouvrait sans jamais se replier.
    fireEvent.click(screen.getByText('Voir moins'));
    expect(screen.queryByText('Consigne 5')).toBeNull();
  });

  it('replie même les urgences au-delà de trois', async () => {
    mockedDomaines.alerts.mockResolvedValue([]);
    mockedFieldTasks.list.mockResolvedValue(
      Array.from({ length: 5 }, (_, i) => ({ ...consigne, id: `ft${i}`, title: `Retard ${i}` })),
    );
    mockedDomaines.summary.mockResolvedValue({ ...summary, alerts: { total: 0, critical: 0, warning: 0, info: 0 } });

    renderPage();

    // Cinq consignes en retard : le plafond tient quand même, sinon la liste
    // occupait quatre écrans et le bloc suivant devenait inatteignable.
    expect(await screen.findByText('Voir les 2 autres')).toBeDefined();
  });

  it('filtre la liste par découpe pour rendre la page en une hauteur d’écran', async () => {
    renderPage();

    // Deux découpes réelles : une alerte, une action en retard. « Tout » ouvre.
    // La puce porte son compte : « 1 En retard ». Le libellé seul se confondrait
    // avec l'échéance imprimée sur la carte, qui vit dans un bouton elle aussi.
    const enRetard = await screen.findByRole('button', { name: '1 En retard' });
    expect(await screen.findByText('Fortes pluies attendues')).toBeDefined();

    fireEvent.click(enRetard);

    expect(await screen.findByText('Sarclage manuel')).toBeDefined();
    expect(screen.queryByText('Fortes pluies attendues')).toBeNull();
  });

  it('n’affiche pas de découpe vide', async () => {
    // Aucune consigne démarrée : la puce « En cours » n'a rien à ouvrir.
    renderPage();

    await screen.findByText('À traiter');
    expect(screen.queryByRole('button', { name: /^\d+ En cours$/ })).toBeNull();
  });

  it('annonce un accueil vide sans rien inventer', async () => {
    mockedFieldTasks.list.mockResolvedValue([]);
    mockedDomaines.alerts.mockResolvedValue([]);
    mockedDomaines.summary.mockResolvedValue({ ...summary, alerts: { total: 0, critical: 0, warning: 0, info: 0 } });

    renderPage();

    expect(await screen.findByText('Situation normale')).toBeDefined();
    expect(await screen.findByText('Rien ne demande votre attention aujourd’hui.')).toBeDefined();
    expect(await screen.findByText(/Rien à traiter aujourd’hui/)).toBeDefined();
  });
});
