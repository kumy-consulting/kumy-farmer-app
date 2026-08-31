import { useCallback, useEffect, useState } from 'react';

import { ApiRequestError } from '@/shared/api/client';
import { useAuthStore } from '@/shared/stores/authStore';

import { domainesApi } from './domaines.api';
import type {
  AlertSeverity,
  DomainCard,
  DomainsSummary,
  FarmerAlert,
  ParcelVegetation,
} from './domaines.types';

/**
 * Sévérité « pire cas » d'un domaine — logique EXACTE de la PWA ingénieur :
 * `critical` si une alerte est explicitement critique, sinon `warning` si une
 * est en vigilance, sinon `info` dès qu'il existe au moins une alerte. On
 * n'escalade PAS les valeurs OAD non standard (ex. « high ») — elles retombent
 * au plancher `info`, ce qui évite d'afficher « Critique » à tort.
 */
function summariseAlerts(alerts: FarmerAlert[]): { count: number; severity: AlertSeverity | null } {
  if (alerts.length === 0) return { count: 0, severity: null };
  if (alerts.some((a) => a.severity === 'critical')) return { count: alerts.length, severity: 'critical' };
  if (alerts.some((a) => a.severity === 'warning')) return { count: alerts.length, severity: 'warning' };
  return { count: alerts.length, severity: 'info' };
}

interface DomainesState {
  domains: DomainCard[];
  summary: DomainsSummary | null;
  isLoading: boolean;
  error: string | null;
  reload: () => void;
}

/**
 * Source de l'onglet Domaines. Charge en parallèle les farms, les alertes et
 * les totaux de l'agriculteur connecté, puis fusionne le badge d'alerte
 * (nombre + sévérité maximale) sur chaque domaine.
 */
export function useDomaines(): DomainesState {
  const farmerId = useAuthStore((s) => s.user?.uid);
  const [domains, setDomains] = useState<DomainCard[]>([]);
  const [summary, setSummary] = useState<DomainsSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const reload = useCallback(() => setReloadKey((k) => k + 1), []);

  useEffect(() => {
    if (!farmerId) {
      setIsLoading(false);
      setError('Session introuvable');
      return;
    }

    let active = true;
    setIsLoading(true);
    setError(null);

    // `allSettled` : les farms sont la donnée cœur ; alertes, totaux et
    // végétation (NDVI) sont optionnels. Un endpoint secondaire en échec ne doit
    // pas vider l'écran (on dégrade : pas de badge / pas de barre / pas de NDVI),
    // seul l'échec des farms constitue une vraie erreur.
    Promise.allSettled([
      domainesApi.farms(farmerId),
      domainesApi.alerts(farmerId),
      domainesApi.summary(farmerId),
      domainesApi.vegetation(farmerId),
    ])
      .then(([farmsRes, alertsRes, summaryRes, vegetationRes]) => {
        if (!active) return;

        if (farmsRes.status === 'rejected') {
          const reason = farmsRes.reason;
          const message =
            reason instanceof ApiRequestError ? reason.message : 'Impossible de charger vos domaines';
          setError(message);
          setIsLoading(false);
          return;
        }

        const farms = farmsRes.value;
        const alerts = alertsRes.status === 'fulfilled' ? alertsRes.value : [];
        const dashboard = summaryRes.status === 'fulfilled' ? summaryRes.value : null;
        const vegetation = vegetationRes.status === 'fulfilled' ? vegetationRes.value.farms : [];

        // Regroupe les alertes actives par domaine (farmId).
        const byFarm = new Map<string, FarmerAlert[]>();
        for (const alert of alerts) {
          const bucket = byFarm.get(alert.farmId);
          if (bucket) bucket.push(alert);
          else byFarm.set(alert.farmId, [alert]);
        }

        // Indexe les parcelles NDVI par domaine (farmId).
        const vegByFarm = new Map<string, ParcelVegetation[]>();
        for (const farm of vegetation) {
          vegByFarm.set(farm.farmId, farm.parcels ?? []);
        }

        const cards: DomainCard[] = farms.map((farm) => {
          const { count, severity } = summariseAlerts(byFarm.get(farm.id) ?? []);
          return {
            ...farm,
            alertCount: count,
            alertSeverity: severity,
            vegetationParcels: vegByFarm.get(farm.id) ?? [],
          };
        });

        setDomains(cards);
        setSummary(dashboard);
        setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [farmerId, reloadKey]);

  return { domains, summary, isLoading, error, reload };
}
