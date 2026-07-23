export type AlertSeverity = 'critical' | 'warning' | 'info';
export type AlertType = 'drought' | 'frost' | 'disease' | 'sensor_offline' | 'soil_moisture' | 'rain';
export type ActivityType = 'irrigation' | 'treatment' | 'sowing' | 'harvest' | 'inspection';
export type ActivityStatus = 'todo' | 'in_progress' | 'done';
export type WeatherCondition = 'sunny' | 'cloudy' | 'rain' | 'storm';
export type DomainsHealth = 'good' | 'attention' | 'critical';

export type WeatherSource = 'station' | 'regional';

export interface WeatherNow {
  domainName: string;
  source: WeatherSource; // 'station' = mesuré par le kit du domaine ; 'regional' = prévision fournisseur
  observedAt: string; // ISO — fraîcheur de la mesure (surtout pour 'station')
  stationOffline?: boolean; // kit HS → repli automatique sur régional
  tempC: number;
  condition: WeatherCondition;
  rainProbability: number; // %
  windKmh: number;
  location: string;
}

export interface ForecastDay {
  label: string; // ex. « Mer »
  condition: WeatherCondition;
  tempC: number;
  rainProbability: number; // %
}

export interface DomainAlert {
  id: string;
  domainName: string;
  severity: AlertSeverity;
  type: AlertType;
  message: string;
  createdAt: string; // ISO
}

export interface PlannedActivity {
  id: string;
  title: string;
  domainName: string;
  type: ActivityType;
  scheduledAt: string; // ISO
  status: ActivityStatus;
}

export interface DomainsOverview {
  domains: number;
  parcels: number;
  areaHa: number;
  health: DomainsHealth;
}

export interface FarmerDashboard {
  weather: WeatherNow;
  forecast: ForecastDay[];
  alerts: DomainAlert[];
  activities: PlannedActivity[];
  overview: DomainsOverview;
}
