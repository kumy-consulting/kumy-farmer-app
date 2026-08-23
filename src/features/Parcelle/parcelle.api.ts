import type { Parcel } from '@/features/Domaines/domaines.types';
import { apiClient } from '@/shared/api/client';

import type { CarnetInspection } from './carnet.types';
import type { ClimateContext, IndicatorPoint, ItkParcelTasks, YieldEstimate } from './parcelle.types';

/**
 * API de la feature Parcelle.
 *
 * Convention Kumy : UN fichier `*.api.ts` par feature qui consomme le client
 * partagé `@/shared/api/client`.
 *
 * Tous les endpoints ci-dessous sont autorisés au rôle FARMER. Les endpoints OAD
 * (oad-snapshot, recommendations, alerts, forecast, fertilizer-window) sont
 * réservés aux rôles internes (403 pour FARMER) et ne sont donc jamais appelés —
 * y compris `GET /farms/:id/forecast`, d'où le recours à `climate-context` pour
 * la météo d'un domaine sans kit.
 */
export const parcelleApi = {
  /** Méta d'une parcelle rattachée à un domaine (culture, surface, coords, NDVI). */
  async parcel(farmId: string, parcelId: string): Promise<Parcel> {
    const { data } = await apiClient.get<Parcel>(`/farms/${farmId}/parcels/${parcelId}`);
    return data;
  },

  /**
   * Observations libres laissées sur la parcelle, de la plus récente à la plus
   * ancienne. Ouvert au FARMER : le serveur vérifie qu'il possède la parcelle.
   */
  async inspections(parcelId: string): Promise<CarnetInspection[]> {
    const { data } = await apiClient.get<{ data?: CarnetInspection[] }>(
      `/parcels/${parcelId}/inspections`,
    );
    return data.data ?? [];
  },

  /** Plan ITK complet de la parcelle (stades, tâches, risques par stade). */
  async itkTasks(parcelId: string): Promise<ItkParcelTasks> {
    const { data } = await apiClient.get<ItkParcelTasks>(`/parcels/${parcelId}/itk-tasks`, {
      params: { stage: 'all' },
    });
    return data;
  },

  /**
   * Contexte climatique de la parcelle. Seule source météo ouverte au FARMER qui
   * fonctionne sans station : elle retombe sur CHIRPS + NASA POWER.
   */
  async climateContext(parcelId: string): Promise<ClimateContext> {
    const { data } = await apiClient.get<ClimateContext>(`/parcels/${parcelId}/climate-context`);
    return data;
  },

  /** Historique des indicateurs NDVI de la parcelle (courbe onglet Conseils). */
  async indicators(parcelId: string, months = 6): Promise<IndicatorPoint[]> {
    const { data } = await apiClient.get<{ indicators?: IndicatorPoint[] } | IndicatorPoint[]>(
      `/parcels/${parcelId}/indicators`,
      { params: { months } },
    );
    // Le backend renvoie une enveloppe { indicators, currentStage, stageBands… } ;
    // on se contente de la série. Repli défensif si un tableau brut est renvoyé.
    return Array.isArray(data) ? data : (data.indicators ?? []);
  },

  /** Estimation de rendement de la parcelle (404 si pas encore calculée). */
  async yieldEstimate(parcelId: string): Promise<YieldEstimate> {
    const { data } = await apiClient.get<YieldEstimate>(`/parcels/${parcelId}/yield-estimate`);
    return data;
  },
};
