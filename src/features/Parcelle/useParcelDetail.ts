import { useCallback, useEffect, useState } from 'react';

import type { GeoBounds, Parcel } from '@/features/Domaines/domaines.types';
import { fieldTasksApi } from '@/features/FieldTasks/fieldTasks.api';
import { ApiRequestError } from '@/shared/api/client';
import { useAuthStore } from '@/shared/stores/authStore';

import { buildCarnet } from './carnet.mapper';
import type { CarnetVisite } from './carnet.types';
import { parcelleApi } from './parcelle.api';
import type { IndicatorPoint, ItkParcelTasks, YieldEstimate } from './parcelle.types';

/** Modèle prêt à afficher pour l'écran détail parcelle. */
export interface ParcelDetail {
  parcelName: string;
  /** Culture affichée : variété si connue, sinon type de culture. */
  cropLabel?: string;
  /** Type de culture (onglet Vue d'ensemble). */
  cropType?: string;
  /** Variété si renseignée (onglet Vue d'ensemble). */
  variety?: string;
  /** Date de semis / plantation ISO (onglet Vue d'ensemble). */
  plantingDate?: string;
  /** Date de récolte prévue ISO (onglet Vue d'ensemble). */
  expectedHarvestDate?: string;
  /** `true` si la récolte prévue est dérivée du plan ITK (backend non renseigné). */
  expectedHarvestEstimated?: boolean;
  /** Polygone de la parcelle [lat, lng][]. */
  coordinates: [number, number][];
  tileUrl?: string;
  tileBounds?: GeoBounds;
  ndvi: number | null;
  ndviStatus?: string;
  area?: number;
  /** Nom du stade ITK courant (KPI). */
  currentStageName?: string;
  /** Jours après semis (KPI « âge »). */
  daysAfterSowing?: number;
  /** Plan ITK complet (null si indisponible / pas de campagne). */
  itk: ItkParcelTasks | null;
  /**
   * Le carnet de la parcelle : ce que l'encadreur y a vu et demandé, passage par
   * passage. Dérivé des journaux ITK et des consignes rattachées à une visite.
   */
  carnet: CarnetVisite[];
  /** Série NDVI (courbe onglet Conseils). */
  indicators: IndicatorPoint[];
  /** Estimation de rendement (null si pas encore calculée / 404). */
  yieldEstimate: YieldEstimate | null;
}

interface ParcelDetailState {
  detail: ParcelDetail | null;
  isLoading: boolean;
  error: string | null;
  reload: () => void;
}

const toLatLng = (coords: Parcel['coordinates']): [number, number][] =>
  (coords ?? []).map((c) => [c.latitude, c.longitude] as [number, number]);

/** Dernier NDVI valide (> 0) de l'historique, par date décroissante. */
const latestNdvi = (indicators: IndicatorPoint[]): number | undefined => {
  const valid = indicators
    .filter((d) => typeof d.ndvi === 'number' && (d.ndvi as number) > 0)
    .sort((a, b) => a.date.localeCompare(b.date));
  return valid.length ? (valid[valid.length - 1].ndvi as number) : undefined;
};

/** Renvoie la valeur seulement si elle parse en date valide (ISO string), sinon undefined. */
const asValidDate = (v: unknown): string | undefined => {
  if (typeof v !== 'string' || v.trim() === '') return undefined;
  return Number.isNaN(new Date(v).getTime()) ? undefined : v;
};

/**
 * Récolte prévue dérivée du plan ITK : fin (`expectedEnd`) du dernier stade,
 * qui vaut semis + durée totale du cycle — la même base que le calcul backend.
 */
const deriveExpectedHarvest = (itk: ItkParcelTasks | null): string | undefined => {
  if (!itk?.stages?.length) return undefined;
  const last = itk.stages.reduce((a, b) => (b.order > a.order ? b : a));
  return asValidDate(last.expectedEnd);
};

export function useParcelDetail(farmId: string | undefined, parcelId: string | undefined): ParcelDetailState {
  const farmerId = useAuthStore((s) => s.user?.uid);
  const [detail, setDetail] = useState<ParcelDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const reload = useCallback(() => setReloadKey((k) => k + 1), []);

  useEffect(() => {
    if (!farmId || !parcelId) {
      setIsLoading(false);
      setError('Parcelle introuvable');
      return;
    }

    let active = true;
    setIsLoading(true);
    setError(null);

    Promise.allSettled([
      parcelleApi.parcel(farmId, parcelId),
      parcelleApi.itkTasks(parcelId),
      parcelleApi.indicators(parcelId, 6),
      parcelleApi.yieldEstimate(parcelId),
      // Consignes de l'agriculteur, filtrées ensuite sur cette parcelle :
      // `GET /field-tasks` ne prend pas de `parcelId`, seulement un `farmerId`.
      farmerId ? fieldTasksApi.list(farmerId) : Promise.resolve([]),
    ])
      .then(([parcelRes, itkRes, indicatorsRes, yieldRes, tasksRes]) => {
        if (!active) return;

        const parcel = parcelRes.status === 'fulfilled' ? parcelRes.value : undefined;
        const itk = itkRes.status === 'fulfilled' ? itkRes.value : null;
        const indicators = indicatorsRes.status === 'fulfilled' ? indicatorsRes.value : [];
        const yieldEstimate = yieldRes.status === 'fulfilled' ? yieldRes.value : null;
        const taches = tasksRes.status === 'fulfilled' ? tasksRes.value.filter((t) => t.parcelId === parcelId) : [];

        // La parcelle doit exister quelque part (méta ou plan ITK), sinon erreur.
        if (!parcel && !itk) {
          setError('Parcelle introuvable');
          setIsLoading(false);
          return;
        }

        // NDVI : instantané dénormalisé `lastIndicators` en priorité (couverture
        // large), sinon dernier point valide de l'historique `/indicators`.
        const li = parcel?.lastIndicators;
        const liNdvi = typeof li?.ndvi === 'number' && li.ndvi > 0 ? li.ndvi : undefined;
        const ndvi = liNdvi ?? latestNdvi(indicators) ?? null;

        const cropType = parcel?.currentCrop?.cropType ?? itk?.cropType;
        const variety = parcel?.currentCrop?.variety ?? itk?.variety;
        const cropLabel = variety ?? cropType;

        // Récolte prévue : valeur backend si elle est une date valide, sinon
        // dérivée du plan ITK. On valide ('' , null, Timestamp mal sérialisé,
        // chaîne invalide → tous ignorés) pour ne jamais afficher « Non renseigné »
        // alors que l'ITK permet de l'estimer.
        const officialHarvest = asValidDate(parcel?.currentCrop?.expectedHarvestDate);
        const derivedHarvest = officialHarvest ? undefined : deriveExpectedHarvest(itk);
        const expectedHarvestDate = officialHarvest ?? derivedHarvest;

        setDetail({
          carnet: buildCarnet(itk, taches),
          parcelName: parcel?.name ?? 'Parcelle',
          cropLabel: cropLabel || undefined,
          cropType: cropType || undefined,
          variety: variety || undefined,
          plantingDate: parcel?.currentCrop?.plantingDate ?? itk?.plantingDate,
          expectedHarvestDate,
          expectedHarvestEstimated: !officialHarvest && Boolean(derivedHarvest),
          coordinates: toLatLng(parcel?.coordinates),
          tileUrl: li?.tileUrl,
          tileBounds: li?.bounds,
          ndvi,
          ndviStatus: li?.status,
          area: parcel?.area,
          currentStageName: itk?.currentStage?.stageName,
          daysAfterSowing: itk?.hasActiveCampaign ? itk.daysAfterSowing : undefined,
          itk,
          indicators,
          yieldEstimate,
        });
        setIsLoading(false);
      })
      .catch((err: unknown) => {
        if (!active) return;
        setError(err instanceof ApiRequestError ? err.message : 'Impossible de charger la parcelle');
        setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [farmId, parcelId, farmerId, reloadKey]);

  return { detail, isLoading, error, reload };
}
