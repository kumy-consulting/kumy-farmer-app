import { useCallback, useEffect, useState } from 'react';

import type { GeoBounds, Parcel } from '@/features/Domaines/domaines.types';
import { ApiRequestError } from '@/shared/api/client';

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

export function useParcelDetail(
  farmId: string | undefined,
  parcelId: string | undefined,
): ParcelDetailState {
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
    ])
      .then(([parcelRes, itkRes, indicatorsRes, yieldRes]) => {
        if (!active) return;

        const parcel = parcelRes.status === 'fulfilled' ? parcelRes.value : undefined;
        const itk = itkRes.status === 'fulfilled' ? itkRes.value : null;
        const indicators = indicatorsRes.status === 'fulfilled' ? indicatorsRes.value : [];
        const yieldEstimate = yieldRes.status === 'fulfilled' ? yieldRes.value : null;

        // La parcelle doit exister quelque part (méta ou plan ITK), sinon erreur.
        if (!parcel && !itk) {
          setError('Parcelle introuvable');
          setIsLoading(false);
          return;
        }

        const li = parcel?.lastIndicators;
        const ndviRaw = li?.ndvi;
        const ndvi = typeof ndviRaw === 'number' && ndviRaw > 0 ? ndviRaw : null;

        const cropType = parcel?.currentCrop?.cropType ?? itk?.cropType;
        const variety = parcel?.currentCrop?.variety ?? itk?.variety;
        const cropLabel = variety ?? cropType;

        setDetail({
          parcelName: parcel?.name ?? 'Parcelle',
          cropLabel: cropLabel || undefined,
          cropType: cropType || undefined,
          variety: variety || undefined,
          plantingDate: parcel?.currentCrop?.plantingDate ?? itk?.plantingDate,
          expectedHarvestDate: parcel?.currentCrop?.expectedHarvestDate,
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
  }, [farmId, parcelId, reloadKey]);

  return { detail, isLoading, error, reload };
}
