import dayjs from 'dayjs';

import type { FarmerDashboard } from './dashboard.types';

/**
 * Données maquettées réalistes (contexte Guinée) du tableau de bord agriculteur.
 * Les horodatages sont calculés relativement à « maintenant » pour que les
 * libellés « il y a … / dans … » restent cohérents à chaque montage.
 *
 * À remplacer par un appel API dans `useDashboard` — la forme (`FarmerDashboard`)
 * reste le contrat stable consommé par les composants.
 */
export function buildMockDashboard(): FarmerDashboard {
  const now = dayjs();

  return {
    weather: {
      domainName: 'Domaine Kaporo',
      source: 'station',
      observedAt: now.subtract(4, 'minute').toISOString(),
      tempC: 29,
      condition: 'sunny',
      rainProbability: 15,
      windKmh: 11,
      location: 'Kaporo',
    },
    forecast: [
      { label: "Auj.", condition: 'sunny', tempC: 29, rainProbability: 15 },
      { label: 'Mer', condition: 'cloudy', tempC: 28, rainProbability: 40 },
      { label: 'Jeu', condition: 'rain', tempC: 26, rainProbability: 80 },
      { label: 'Ven', condition: 'storm', tempC: 25, rainProbability: 90 },
      { label: 'Sam', condition: 'cloudy', tempC: 27, rainProbability: 35 },
    ],
    alerts: [
      {
        id: 'a1',
        domainName: 'Domaine Kaporo',
        severity: 'critical',
        type: 'drought',
        message: 'Risque de sécheresse élevé sur vos cultures',
        createdAt: now.subtract(2, 'hour').toISOString(),
      },
      {
        id: 'a2',
        domainName: 'Parcelle Nord',
        severity: 'warning',
        type: 'soil_moisture',
        message: 'Humidité du sol faible, pensez à irriguer',
        createdAt: now.subtract(5, 'hour').toISOString(),
      },
      {
        id: 'a3',
        domainName: 'Domaine Rivière',
        severity: 'info',
        type: 'rain',
        message: 'Fortes pluies attendues demain matin',
        createdAt: now.subtract(35, 'minute').toISOString(),
      },
      {
        id: 'a4',
        domainName: 'Domaine Kaporo',
        severity: 'warning',
        type: 'sensor_offline',
        message: 'Capteur météo hors ligne depuis hier',
        createdAt: now.subtract(1, 'day').toISOString(),
      },
    ],
    activities: [
      {
        id: 't1',
        title: 'Traitement fongicide',
        domainName: 'Domaine Kaporo',
        type: 'treatment',
        scheduledAt: now.hour(7).minute(0).toISOString(),
        status: 'done',
      },
      {
        id: 't2',
        title: 'Inspection des cultures',
        domainName: 'Domaine Rivière',
        type: 'inspection',
        scheduledAt: now.toISOString(),
        status: 'in_progress',
      },
      {
        id: 't3',
        title: 'Irrigation goutte-à-goutte',
        domainName: 'Parcelle Nord',
        type: 'irrigation',
        scheduledAt: now.hour(16).minute(0).toISOString(),
        status: 'todo',
      },
      {
        id: 't4',
        title: 'Semis de maïs',
        domainName: 'Parcelle Sud',
        type: 'sowing',
        scheduledAt: now.add(1, 'day').hour(8).minute(0).toISOString(),
        status: 'todo',
      },
      {
        id: 't5',
        title: 'Récolte du manioc',
        domainName: 'Domaine Kaporo',
        type: 'harvest',
        scheduledAt: now.add(3, 'day').hour(9).minute(0).toISOString(),
        status: 'todo',
      },
    ],
    overview: {
      domains: 3,
      parcels: 7,
      areaHa: 12.5,
      health: 'attention',
    },
  };
}
