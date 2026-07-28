import { useCallback, useEffect, useState } from 'react';

import { ApiRequestError } from '@/shared/api/client';
import { useAuthStore } from '@/shared/stores/authStore';

import { domainesApi } from './domaines.api';
import type {
  AlertSeverity,
  DetailParcel,
  FarmerAlert,
  FarmLiveStation,
  Parcel,
  ParcelAlert,
  ParcelVegetation,
} from './domaines.types';

/** Pire sévérité reconnue d'un lot d'alertes (pas d'escalade des valeurs OAD). */
function worstSeverity(alerts: FarmerAlert[]): AlertSeverity {
  if (alerts.some((a) => a.severity === 'critical')) return 'critical';
  if (alerts.some((a) => a.severity === 'warning')) return 'warning';
  return 'info';
}

/** Regroupe les alertes actives par parcelle → { sévérité pire, intitulé, nombre }. */
function alertsByParcel(alerts: FarmerAlert[]): Map<string, ParcelAlert> {
  const byParcel = new Map<string, FarmerAlert[]>();
  for (const a of alerts) {
    if (!a.parcelId) continue;
    const bucket = byParcel.get(a.parcelId);
    if (bucket) bucket.push(a);
    else byParcel.set(a.parcelId, [a]);
  }
  const result = new Map<string, ParcelAlert>();
  for (const [parcelId, list] of byParcel) {
    const severity = worstSeverity(list);
    const worst = list.find((a) => a.severity === severity) ?? list[0];
    result.set(parcelId, { severity, label: worst?.title || worst?.message || 'Alerte', count: list.length });
  }
  return result;
}

const itkActive = (p: Parcel): boolean =>
  Boolean(p.currentCrop?.itkRef) ||
  Boolean(p.currentStageCode) ||
  p.itkMaterializationStatus?.status === 'success';

/** Convertit une parcelle de végétation en base de fusion (repli sans endpoint parcels). */
function parcelFromVegetation(v: ParcelVegetation): Parcel {
  return {
    id: v.parcelId,
    name: v.name,
    area: parseFloat(v.area) || undefined,
    status: v.status,
    currentCrop: { cropType: v.culture, variety: v.variety, growthStage: v.stade },
  };
}

export interface DomaineStats {
  vigilanceCount: number;
  criticalCount: number;
  covered: number;
  toWatch: number;
  hasCoverage: boolean;
  parcelTotal: number;
  onItk: number;
  cultivatedHa: number;
}

export interface DomaineDetail {
  farmName: string;
  /** Nom de l'agriculteur (affiché en filigrane dans l'en-tête). */
  ownerName?: string;
  headerTitle: string;
  headerSubtitle: string;
  contour: [number, number][];
  parcels: DetailParcel[];
  stats: DomaineStats;
  liveStation: FarmLiveStation | null;
}

interface DomaineDetailState {
  detail: DomaineDetail | null;
  isLoading: boolean;
  error: string | null;
  reload: () => void;
}

const fr1 = (n: number): string => n.toLocaleString('fr-FR', { maximumFractionDigits: 1 });

export function useDomaineDetail(farmId: string | undefined): DomaineDetailState {
  const user = useAuthStore((s) => s.user);
  const farmerId = user?.uid;
  const [detail, setDetail] = useState<DomaineDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const reload = useCallback(() => setReloadKey((k) => k + 1), []);

  useEffect(() => {
    if (!farmerId || !farmId) {
      setIsLoading(false);
      setError('Session introuvable');
      return;
    }

    let active = true;
    setIsLoading(true);
    setError(null);

    Promise.allSettled([
      domainesApi.vegetation(farmerId),
      domainesApi.farms(farmerId),
      domainesApi.parcels(farmId),
      domainesApi.alerts(farmerId),
      domainesApi.liveStation(farmId),
    ])
      .then(([vegRes, farmsRes, parcelsRes, alertsRes, stationRes]) => {
        if (!active) return;

        const vegFarm =
          vegRes.status === 'fulfilled'
            ? vegRes.value.farms.find((f) => f.farmId === farmId)
            : undefined;
        const enrichedFarm =
          farmsRes.status === 'fulfilled' ? farmsRes.value.find((f) => f.id === farmId) : undefined;

        // Le domaine doit exister quelque part, sinon vraie erreur.
        if (!vegFarm && !enrichedFarm) {
          setError('Domaine introuvable');
          setIsLoading(false);
          return;
        }

        const rawParcels = parcelsRes.status === 'fulfilled' ? parcelsRes.value : [];
        const vegParcels = vegFarm?.parcels ?? [];
        const alerts = alertsRes.status === 'fulfilled' ? alertsRes.value : [];
        const liveStation = stationRes.status === 'fulfilled' ? stationRes.value : null;

        const farmAlerts = alerts.filter((a) => a.farmId === farmId && a.status === 'active');
        const byParcel = alertsByParcel(farmAlerts);
        const vegByParcel = new Map(vegParcels.map((p) => [p.parcelId, p]));

        // Base : endpoint parcels (complet) ; repli sur les parcelles de végétation.
        const base = rawParcels.length > 0 ? rawParcels : vegParcels.map(parcelFromVegetation);

        const parcels: DetailParcel[] = base.map((p) => {
          const v = vegByParcel.get(p.id);
          const li = p.lastIndicators;

          // Tuile NDVI : `lastIndicators` (parcels, couverture large) en priorité,
          // repli sur la végétation (indicators/*/history, couverture étroite).
          const tileUrl = li?.tileUrl ?? v?.tileUrl;
          const tileBounds = li?.bounds ?? v?.tileBounds;
          const ndviRaw = li?.ndvi ?? (v && v.ndvi > 0 ? v.ndvi : undefined);
          const ndvi = typeof ndviRaw === 'number' && ndviRaw > 0 ? ndviRaw : null;

          // Contour : végétation ([lat,lng][]) si présent, sinon coords de la parcelle.
          const coordinates =
            v?.coordinates && v.coordinates.length > 0
              ? v.coordinates
              : (p.coordinates ?? []).map((c) => [c.latitude, c.longitude] as [number, number]);

          const area = p.area ?? (v ? parseFloat(v.area) || undefined : undefined);
          return {
            parcelId: p.id,
            name: p.name,
            cropType: p.currentCrop?.cropType || v?.culture,
            plantingDate: p.currentCrop?.plantingDate,
            area,
            ndvi,
            ndviStatus: li?.status,
            tileUrl,
            tileBounds,
            coordinates,
            itkActive: itkActive(p),
            alert: byParcel.get(p.id),
          };
        });

        // ─── 4 statistiques (calculées côté client) ───
        const parcelTotal = parcels.length;
        const covered = parcels.filter((p) => p.ndvi != null || p.tileUrl).length;
        const toWatch = parcels.filter(
          (p) =>
            p.ndviStatus === 'stressed' ||
            p.ndviStatus === 'critical' ||
            (p.ndvi != null && p.ndvi < 0.35),
        ).length;
        const onItk = parcels.filter((p) => p.itkActive).length;
        const cultivatedHa = parcels.reduce((s, p) => s + (p.area ?? 0), 0);
        const criticalCount = farmAlerts.filter((a) => a.severity === 'critical').length;

        const stats: DomaineStats = {
          vigilanceCount: farmAlerts.length,
          criticalCount,
          covered,
          toWatch,
          hasCoverage: covered > 0,
          parcelTotal,
          onItk,
          cultivatedHa,
        };

        // En-tête = identité de CE domaine (nom + ses parcelles/surface), pas le
        // total tous domaines confondus.
        const domainName = enrichedFarm?.name ?? vegFarm?.name ?? 'Domaine';
        const domainArea = enrichedFarm?.area ?? cultivatedHa;

        setDetail({
          farmName: domainName,
          ownerName: user?.displayName?.trim() || undefined,
          headerTitle: domainName,
          headerSubtitle: `${parcelTotal} parcelle${parcelTotal > 1 ? 's' : ''} · ${fr1(domainArea)} ha`,
          contour: vegFarm?.coordinates ?? [],
          parcels,
          stats,
          liveStation,
        });
        setIsLoading(false);
      })
      .catch((err: unknown) => {
        if (!active) return;
        setError(err instanceof ApiRequestError ? err.message : 'Impossible de charger le domaine');
        setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [farmerId, farmId, reloadKey, user?.displayName]);

  return { detail, isLoading, error, reload };
}
