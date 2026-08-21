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

/** Alerte active rattachée à un domaine (`farmId`) et éventuellement une parcelle. */
export interface FarmerAlert {
  id: string;
  farmId: string;
  farmName: string;
  parcelId?: string;
  parcelName?: string;
  type: string;
  severity: AlertSeverity;
  status: string;
  title: string;
  message: string;
  /** « Que faire » côté agronome — présent dans le DTO, affiché tel quel sur la carte. */
  recommendedAction?: string;
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
  name: string;
  culture: string;
  variety: string;
  area: string;
  status: string;
  stade: string;
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
  name: string;
  region?: string;
  totalArea?: string;
  center?: { latitude: number; longitude: number };
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

// ─── Détail d'un domaine ───

export interface CurrentCrop {
  cropType?: string;
  variety?: string;
  plantingDate?: string;
  expectedHarvestDate?: string;
  growthStage?: string;
  itkRef?: string;
}

/**
 * Instantané « dernière bonne valeur » NDVI dénormalisé sur le doc parcelle
 * (parcels/{id}.lastIndicators). Couverture plus large que la végétation, qui
 * ne lit que la scène la plus récente de la sous-collection indicators/history.
 */
export interface LastIndicators {
  ndvi?: number;
  status?: 'healthy' | 'stressed' | 'critical' | string;
  tileUrl?: string;
  bounds?: GeoBounds;
}

/** Parcelle brute (GET /farms/:farmId/parcels → ParcelResponseDto). */
export interface Parcel {
  id: string;
  name: string;
  area?: number;
  areaUnit?: string;
  coordinates?: { latitude: number; longitude: number }[];
  currentCrop?: CurrentCrop;
  currentStageCode?: string | null;
  itkMaterializationStatus?: { status: 'pending' | 'success' | 'skipped' | 'failed' };
  status: string;
  lastIndicators?: LastIndicators;
}

/** Enveloppe paginée générique du backoffice. */
export interface Paginated<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/** Alerte agrégée d'une parcelle (pire sévérité + intitulé + nombre). */
export interface ParcelAlert {
  severity: AlertSeverity;
  label: string;
  count: number;
}

/** Parcelle fusionnée (végétation + parcelle + alertes) consommée par la carte parcelle. */
export interface DetailParcel {
  parcelId: string;
  name: string;
  cropType?: string;
  plantingDate?: string;
  area?: number;
  ndvi: number | null;
  ndviStatus?: string;
  tileUrl?: string;
  tileBounds?: GeoBounds;
  coordinates: [number, number][];
  itkActive: boolean;
  alert?: ParcelAlert;
}

/** Station météo live d'un domaine (GET /farms/:id/live-station). */
/** Une mesure instantanée du kit : valeur, unité, horodatage de la lecture. */
export interface StationLiveMeasure {
  value: number;
  unit: string;
  at: string | null;
}

/**
 * Réponse de `GET /farms/:id/live-station`.
 *
 * La forme suit le `FarmStationLiveResponseDto` du backoffice : les mesures sont
 * sous `live`, chacune enveloppée dans { value, unit, at }, et la fraîcheur est
 * `lastSeen`. Attention à `rainfall` : c'est le compteur cumulatif brut de la
 * station, pas la pluie du moment — pour « il pleut maintenant » c'est `rainRate`
 * (mm/h), et pour un cumul lisible c'est `rainfall24h`, que l'API calcule.
 */
export interface FarmLiveStation {
  station: {
    id: string;
    stationId: string;
    label: string | null;
    online: boolean;
    status: string;
    lastSeen: string | null;
    batteryLevel?: number | null;
    signalStrength?: number | null;
    live: {
      temperature?: StationLiveMeasure;
      humidity?: StationLiveMeasure;
      pressure?: StationLiveMeasure;
      windSpeed?: StationLiveMeasure;
      windDir?: { value: number; label: string; at: string | null };
      rainfall?: StationLiveMeasure;
      rainRate?: StationLiveMeasure;
      rainfall24h?: { valueMm: number; windowHours: number; at: string | null };
    };
  } | null;
}

// ─── Accompagnement ───

export type VisiteStatut = 'planned' | 'in_progress' | 'done' | 'missed' | 'cancelled';

/** Visite telle que `GET /farmers/:id/visits` la renvoie au rôle FARMER. */
export interface FarmerVisit {
  id: string;
  status: VisiteStatut;
  type: 'consultation' | 'manager_directed';
  category: string | null;
  scheduledFor: string | null;
  startedAt: string | null;
  endedAt: string | null;
  farmId: string | null;
  farmName: string | null;
  technicianName: string | null;
  parcelIds: string[];
  note: string | null;
}

/** Réponse `GET /farmers/:id/visits`. */
export interface FarmerVisits {
  /** La plus proche à venir. `null` = aucune programmée, ce qui est une information. */
  next: FarmerVisit | null;
  recent: FarmerVisit[];
}
