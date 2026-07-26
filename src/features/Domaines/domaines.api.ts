import { apiClient } from '@/shared/api/client';

import type {
  Domain,
  DomainsSummary,
  FarmerAlert,
  FarmerFarmsVegetation,
  FarmLiveStation,
  Paginated,
  Parcel,
} from './domaines.types';

/**
 * API de la feature Domaines.
 *
 * Convention Kumy : UN fichier `*.api.ts` par feature qui consomme le client
 * partagé `@/shared/api/client`.
 *
 * Un « domaine » côté backend est un `farm`. Les endpoints ci-dessous sont
 * ceux exposés au rôle FARMER et renvoient des données déjà agrégées :
 *  - `farms`     : tableau brut de {@link Domain} (pas d'enveloppe paginée)
 *  - `alerts`    : tableau brut de {@link FarmerAlert}
 *  - `dashboard` : totaux tous domaines confondus
 */
export const domainesApi = {
  /** Domaines (farms) enrichis de l'agriculteur, triés par date décroissante. */
  async farms(farmerId: string): Promise<Domain[]> {
    const { data } = await apiClient.get<Domain[]>(`/farmers/${farmerId}/farms`);
    return data;
  },

  /** Alertes actives de l'agriculteur (à grouper par `farmId` pour le badge). */
  async alerts(farmerId: string): Promise<FarmerAlert[]> {
    const { data } = await apiClient.get<FarmerAlert[]>(`/farmers/${farmerId}/alerts`);
    return data;
  },

  /** Totaux (parcelles, surface, NDVI, alertes) tous domaines confondus. */
  async summary(farmerId: string): Promise<DomainsSummary> {
    const { data } = await apiClient.get<DomainsSummary>(`/farmers/${farmerId}/dashboard`);
    return data;
  },

  /** Végétation : contours + parcelles avec tuiles NDVI (pour le fond carte). */
  async vegetation(farmerId: string): Promise<FarmerFarmsVegetation> {
    const { data } = await apiClient.get<FarmerFarmsVegetation>(`/farmers/${farmerId}/farms/vegetation`);
    return data;
  },

  /** Parcelles d'un domaine (culture, plantation/âge, statut ITK). */
  async parcels(farmId: string): Promise<Parcel[]> {
    const { data } = await apiClient.get<Paginated<Parcel>>(`/farms/${farmId}/parcels`, {
      params: { limit: 200 },
    });
    return data.data;
  },

  /** Station météo live d'un domaine (onglet Météos). */
  async liveStation(farmId: string): Promise<FarmLiveStation> {
    const { data } = await apiClient.get<FarmLiveStation>(`/farms/${farmId}/live-station`);
    return data;
  },
};
