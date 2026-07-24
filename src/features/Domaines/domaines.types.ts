/**
 * Types de la feature Domaines.
 *
 * Côté backend un « domaine » est modélisé comme un `farm` (module `farms`).
 * Ces types reflètent les DTO renvoyés par l'API backoffice :
 *  - `FarmEnrichedDto`     → {@link Domain}       (GET /farmers/:id/farms)
 *  - `FarmerAlertDto`      → {@link FarmerAlert}  (GET /farmers/:id/alerts)
 *  - `FarmerDashboardDto`  → {@link DomainsSummary} (GET /farmers/:id/dashboard)
 */

export type AreaUnit = 'hectares' | 'acres';
export type FarmStatus = 'active' | 'fallow' | 'inactive';
export type AlertSeverity = 'critical' | 'warning' | 'info';

export interface Coordinate {
  latitude: number;
  longitude: number;
}

/** Culture active d'une parcelle (sert de « chip » sur la carte du domaine). */
export interface ActiveCulture {
  parcelId: string;
  parcelName: string;
  cropType: string;
  variety?: string;
  growthStage?: string;
}

/** Métriques agrégées de la station météo/sol associée au domaine. */
export interface StationMetrics {
  stationCode?: string;
  installDate?: string;
  ndvi: number;
  temperature: number;
  humidity: number;
  wind: number;
}

/** Domaine enrichi (déjà agrégé côté serveur). */
export interface Domain {
  id: string;
  farmCode: string;
  farmerId: string;
  name: string;
  area: number;
  areaUnit: AreaUnit;
  coordinates: Coordinate[];
  centroid: Coordinate;
  polygonImage?: string;
  status: FarmStatus;
  parcelsCount: number;
  stationMetrics: StationMetrics;
  activeCultures: ActiveCulture[];
  tasksCount: number;
  ownership?: { type: 'individual' | 'communal' };
}

/** Alerte active rattachée à un domaine (`farmId`). */
export interface FarmerAlert {
  id: string;
  farmId: string;
  farmName: string;
  type: string;
  severity: AlertSeverity;
  status: string;
  title: string;
  message: string;
  createdAt: string;
}

/** Totaux tous domaines confondus (barre de statistiques du haut). */
export interface DomainsSummary {
  farmerId: string;
  totalFarms: number;
  totalArea: number;
  totalParcels: number;
  avgNdvi: number;
  avgTemperature: number;
  alerts: {
    total: number;
    critical: number;
    warning: number;
    info: number;
  };
}

/** Cadre géographique d'une image raster (overlay NDVI). */
export interface GeoBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

/** Parcelle avec sa tuile NDVI pré-rendue (PNG serveur, transparent hors parcelle). */
export interface ParcelVegetation {
  parcelId: string;
  /** [latitude, longitude][] */
  coordinates: [number, number][];
  bounds: GeoBounds;
  ndvi: number;
  /** URL PNG NDVI (Firebase Storage). Absent si pas de scène fiable. */
  tileUrl?: string;
  tileBounds?: GeoBounds;
}

/** Végétation d'un domaine (contour + parcelles NDVI). */
export interface FarmVegetation {
  farmId: string;
  coordinates: [number, number][];
  parcels: ParcelVegetation[];
}

/** Réponse `GET /farmers/:id/farms/vegetation`. */
export interface FarmerFarmsVegetation {
  farms: FarmVegetation[];
}

/** Domaine + résumé d'alertes + parcelles NDVI fusionnés — modèle consommé par la carte. */
export interface DomainCard extends Domain {
  alertCount: number;
  alertSeverity: AlertSeverity | null;
  vegetationParcels: ParcelVegetation[];
}
