import { useEffect, useState } from 'react';

import { domainesApi } from '@/features/Domaines/domaines.api';
import type { Parcel } from '@/features/Domaines/domaines.types';
import { parcelleApi } from '@/features/Parcelle/parcelle.api';
import { useAuthStore } from '@/shared/stores/authStore';

import { buildMockDashboard } from './dashboard.mock';
import type { FarmerDashboard } from './dashboard.types';
import { toActivities, toDomainAlerts, type ParcelItk } from './home.mappers';

interface DashboardState {
  data: FarmerDashboard | null;
  isLoading: boolean;
}

/**
 * Parcelle sous suivi ITK — sinon `itk-tasks` renvoie 400/404. On filtre en
 * amont pour éviter d'inonder l'accueil d'appels inutiles.
 */
const isItkActive = (p: Parcel): boolean =>
  Boolean(p.currentCrop?.itkRef) ||
  Boolean(p.currentStageCode) ||
  p.itkMaterializationStatus?.status === 'success';

/**
 * Source du tableau de bord agriculteur.
 *
 * Sections **branchées sur l'API** (endpoints farmer-scoped, autorisés FARMER) :
 *  - Alertes    ← `GET /farmers/:id/alerts`
 *  - Activités  ← tâches ITK du stade courant, agrégées sur les parcelles de
 *                l'agriculteur (`/farms/:id/parcels` → `/parcels/:id/itk-tasks`).
 *
 * Météo, prévisions et vue d'ensemble restent maquettées pour l'instant (le
 * contrat `FarmerDashboard` ne change pas ; ces sections seront branchées plus tard).
 */
export function useDashboard(): DashboardState {
  const farmerId = useAuthStore((s) => s.user?.uid);
  const [state, setState] = useState<DashboardState>({ data: null, isLoading: true });

  useEffect(() => {
    let active = true;
    setState({ data: null, isLoading: true });

    void (async () => {
      // Base maquettée : météo / prévisions / vue d'ensemble (non branchées ici).
      const base = buildMockDashboard();

      if (!farmerId) {
        if (active) setState({ data: { ...base, alerts: [], activities: [] }, isLoading: false });
        return;
      }

      const [alertsRes, farmsRes] = await Promise.allSettled([
        domainesApi.alerts(farmerId),
        domainesApi.farms(farmerId),
      ]);
      const rawAlerts = alertsRes.status === 'fulfilled' ? alertsRes.value : [];
      const farms = farmsRes.status === 'fulfilled' ? farmsRes.value : [];

      // Parcelles de chaque domaine, puis plan ITK de chaque parcelle
      // (dégradation gracieuse à chaque niveau ; itk-tasks 400 = pas de campagne).
      const parcelsPerFarm = await Promise.allSettled(farms.map((f) => domainesApi.parcels(f.id)));
      const parcels = parcelsPerFarm
        .flatMap((r) => (r.status === 'fulfilled' ? r.value : []))
        .filter(isItkActive);

      const itkPerParcel = await Promise.allSettled(parcels.map((p) => parcelleApi.itkTasks(p.id)));
      const parcelItks: ParcelItk[] = itkPerParcel.flatMap((r, i) =>
        r.status === 'fulfilled' ? [{ itk: r.value, parcelName: parcels[i].name }] : [],
      );

      if (!active) return;

      const alerts = toDomainAlerts(rawAlerts);
      setState({
        data: {
          ...base,
          alerts,
          activities: toActivities(parcelItks),
          overview: { ...base.overview, alertsCount: alerts.length },
        },
        isLoading: false,
      });
    })();

    return () => {
      active = false;
    };
  }, [farmerId]);

  return state;
}
