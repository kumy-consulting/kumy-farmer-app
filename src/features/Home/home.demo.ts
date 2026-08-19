import dayjs from 'dayjs';

import type { FarmerAlert } from '@/features/Domaines/domaines.types';
import type { FieldTask } from '@/features/FieldTasks/fieldTasks.types';
import type { ItkParcelTasks } from '@/features/Parcelle/parcelle.types';

import type { FeedItemDraft } from './home.feed.types';
import { itkToFeed, type NameIndex, type ParcelItkSource } from './home.mappers';
import type { HomeRecap, HomeWeather } from './useHomeFeed';

/**
 * Jeu de démonstration de l'accueil — **dev uniquement**, activé par `?demo=1`.
 *
 * Il ne remplace pas les données : il remplace le réseau. Les mappers, le
 * rangement en sections et les actions optimistes tournent exactement comme en
 * production, ce qui en fait un banc d'essai visuel fidèle. Contexte : une
 * exploitation de Dubréka (ananas, piment, riz), kit météo en ligne.
 */

const iso = (value: dayjs.Dayjs): string => value.toISOString();
const now = () => dayjs();
const day = (offset: number): string => now().add(offset, 'day').format('YYYY-MM-DD');

const FARM_ID = 'demo-farm-kaporo';
const VISIT_ID = 'demo-visit-0812';

export const demoNames: NameIndex = {
  farms: new Map([
    [FARM_ID, 'Domaine de Kaporo'],
    ['demo-farm-dubreka', 'Plaine de Dubréka'],
  ]),
  parcels: new Map([
    ['p-ananas-nord', 'Ananas Nord'],
    ['p-kaporo-2', 'Kaporo 2'],
    ['p-piment-sud', 'Piment Sud'],
    ['p-riz-bas-fond', 'Riz Bas-fond'],
  ]),
};

/** Dernières mesures du kit du domaine — source unique de la puce ET des conditions. */
const demoStationMeasures = { temperature: 31, rain: 4, wind: 9 };

/** Au-delà, un traitement part en dérive : même seuil que le hook. */
const WIND_LIMIT_KMH = 20;

export const demoWeather: HomeWeather = {
  farmId: FARM_ID,
  farmName: 'Domaine de Kaporo',
  tempC: demoStationMeasures.temperature,
  online: true,
  observedAt: iso(now().subtract(4, 'minute')),
  hasKit: true,
};

/**
 * Domaines où le kit **en ligne** relève des conditions défavorables — même
 * règle que la vague 2 du hook : pluie en cours ou vent trop fort.
 */
const demoUnfavourableFarmIds = new Set(
  demoWeather.online && (demoStationMeasures.rain > 0 || demoStationMeasures.wind > WIND_LIMIT_KMH)
    ? [FARM_ID]
    : [],
);

const alert = (
  id: string,
  over: Partial<FarmerAlert> & Pick<FarmerAlert, 'type' | 'severity' | 'title' | 'createdAt'>,
): FarmerAlert => ({
  id,
  farmId: FARM_ID,
  farmName: 'Domaine de Kaporo',
  status: 'active',
  message: '',
  ...over,
});

export const demoAlerts: FarmerAlert[] = [
  alert('a1', {
    parcelId: 'p-kaporo-2',
    parcelName: 'Kaporo 2',
    type: 'weather',
    severity: 'critical',
    title: 'Fortes pluies attendues jeudi',
    recommendedAction: 'Reporter l’apport d’urée après l’épisode',
    createdAt: iso(now().subtract(3, 'hour')),
  }),
  alert('a2', {
    parcelId: 'p-ananas-nord',
    parcelName: 'Ananas Nord',
    type: 'ndvi',
    severity: 'warning',
    title: 'Vigueur en baisse depuis 10 jours',
    recommendedAction: 'Vérifier le goutte-à-goutte de la rangée est',
    createdAt: iso(now().subtract(1, 'day')),
  }),
  alert('a3', {
    parcelId: 'p-piment-sud',
    parcelName: 'Piment Sud',
    type: 'pest',
    severity: 'warning',
    title: 'Foyer de mouche des fruits',
    recommendedAction: 'Poser des pièges à phéromone en bordure',
    createdAt: iso(now().subtract(2, 'day')),
  }),
  alert('a4', {
    parcelId: 'p-riz-bas-fond',
    parcelName: 'Riz Bas-fond',
    type: 'soil',
    severity: 'info',
    title: 'Humidité du sol sous le seuil',
    createdAt: iso(now().subtract(4, 'day')),
  }),
  // Périmées : elles alimentent « Voir les anciennes » sans polluer le décompte.
  alert('a5', {
    parcelId: 'p-ananas-nord',
    parcelName: 'Ananas Nord',
    type: 'disease',
    severity: 'critical',
    title: 'Phytophthora — risque élevé',
    createdAt: iso(now().subtract(23, 'day')),
  }),
  alert('a6', {
    parcelId: 'p-kaporo-2',
    parcelName: 'Kaporo 2',
    type: 'irrigation',
    severity: 'warning',
    title: 'Irrigation interrompue',
    createdAt: iso(now().subtract(41, 'day')),
  }),
];

export const demoRecap: HomeRecap = {
  domains: 3,
  parcels: 12,
  areaHa: 18.4,
  health: 'attention',
};

const task = (
  id: string,
  over: Partial<FieldTask> & Pick<FieldTask, 'title' | 'type' | 'dueDate' | 'status'>,
): FieldTask => ({
  id,
  clientTaskId: `c-${id}`,
  farmerId: 'demo-farmer',
  farmId: FARM_ID,
  parcelId: 'p-kaporo-2',
  targetType: 'parcel',
  description: '',
  overdue: false,
  daysOverdue: 0,
  createdBy: 'demo-engineer',
  createdByName: 'Dr Camara',
  visitId: null,
  startedAt: null,
  completedAt: null,
  createdAt: iso(now().subtract(7, 'day')),
  updatedAt: iso(now().subtract(7, 'day')),
  ...over,
});

export const demoTasks: FieldTask[] = [
  task('t1', {
    title: 'Sarclage manuel des inter-rangs',
    description: 'Sarcler avant la reprise des pluies, sur toute la bande est.',
    type: 'weeding',
    dueDate: day(-2),
    status: 'planned',
    overdue: true,
    daysOverdue: 2,
    visitId: VISIT_ID,
    createdAt: iso(now().subtract(6, 'day')),
  }),
  task('t2', {
    title: 'Traitement fongique préventif',
    description: 'Bouillie bordelaise, 2 kg/ha.',
    type: 'treatment',
    parcelId: 'p-ananas-nord',
    dueDate: day(-1),
    status: 'planned',
    overdue: true,
    daysOverdue: 1,
    visitId: VISIT_ID,
    prerequisitesResolved: [
      { kind: 'field_task', taskId: 't0', label: 'Épandage du fumier', satisfied: false },
    ],
    createdAt: iso(now().subtract(6, 'day')),
  }),
  task('t3', {
    title: 'Apport d’urée 150 kg/ha',
    description: 'Fractionné en deux passages.',
    type: 'fertilization',
    parcelId: 'p-ananas-nord',
    dueDate: day(0),
    status: 'in_progress',
    startedAt: iso(now().subtract(2, 'hour')),
  }),
  task('t4', {
    title: 'Relevé du piégeage',
    type: 'other',
    parcelId: 'p-piment-sud',
    dueDate: day(2),
    status: 'planned',
  }),
  task('t5', {
    title: 'Récolte du piment — première passe',
    type: 'harvest',
    parcelId: 'p-piment-sud',
    dueDate: day(5),
    status: 'planned',
  }),
  task('t6', {
    title: 'Contrôle du paillage',
    type: 'other',
    parcelId: 'p-kaporo-2',
    dueDate: day(0),
    status: 'done',
    completedAt: iso(now().subtract(90, 'minute')),
    visitId: VISIT_ID,
  }),
];

/**
 * Plans ITK de démonstration. Ils traversent le VRAI mapper : la promotion en
 * fenêtre de traitement, l'échéance et la mention météo sont dérivées ici comme
 * en production, pas écrites à la main.
 */
const demoItkSources: ParcelItkSource[] = [
  {
    farmId: FARM_ID,
    parcelName: 'Riz Bas-fond',
    itk: {
      parcelId: 'p-riz-bas-fond',
      hasActiveCampaign: true,
      cropType: 'Riz',
      daysAfterSowing: 28,
      currentStage: { stageCode: 'TALLAGE', stageName: 'Tallage', order: 3 },
      itkValidationStatus: 'irag_validated',
      stages: [
        {
          stageCode: 'TALLAGE',
          stageName: 'Tallage',
          order: 3,
          expectedStart: iso(now().subtract(10, 'day')),
          expectedEnd: iso(now().add(12, 'day')),
          status: 'inProgress',
          dayStart: 20,
          dayEnd: 45,
          description: '',
          critical: true,
          tasks: {
            mandatory: [
              {
                taskId: 'w1',
                type: 'weeding',
                title: 'Désherbage chimique du riz',
                description: '',
                timing: 'J+25 à J+30',
                windowStart: iso(now().subtract(1, 'day')),
                windowEnd: iso(now().add(30, 'hour')),
                state: 'pending',
                inputs: [{ product: 'Bispyribac', dosePerHa: 25, unit: 'g' }],
              },
            ],
            recommended: [],
          },
          risks: [],
        },
      ],
    } as ItkParcelTasks,
  },
  {
    farmId: FARM_ID,
    parcelName: 'Ananas Nord',
    itk: {
      parcelId: 'p-ananas-nord',
      hasActiveCampaign: true,
      cropType: 'Ananas',
      daysAfterSowing: 45,
      currentStage: { stageCode: 'CROISSANCE', stageName: 'Croissance', order: 2 },
      itkValidationStatus: 'web_provisional',
      stages: [
        {
          stageCode: 'CROISSANCE',
          stageName: 'Croissance',
          order: 2,
          expectedStart: iso(now().subtract(20, 'day')),
          expectedEnd: iso(now().add(30, 'day')),
          status: 'inProgress',
          dayStart: 30,
          dayEnd: 90,
          description: '',
          critical: false,
          tasks: {
            mandatory: [
              {
                taskId: 'i1',
                type: 'observation',
                title: 'Observation des ravageurs',
                description: '',
                timing: 'J+45',
                windowStart: iso(now().add(3, 'day')),
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
    } as ItkParcelTasks,
  },
];

export const demoItkDrafts: FeedItemDraft[] = itkToFeed(demoItkSources, {
  now: now(),
  unfavourableFarmIds: demoUnfavourableFarmIds,
});

/** `?demo=1` en développement — jamais actif dans un build de production. */
export function isDemoMode(): boolean {
  return import.meta.env.DEV && new URLSearchParams(window.location.search).has('demo');
}
