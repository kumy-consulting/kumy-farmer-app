/**
 * Types de la feature Parcelle (écran détail parcelle — onglets ITK & Conseils).
 *
 * Miroir TypeScript des DTO backend consommés, avec dates en `string` ISO :
 *  - `ParcelItkTasksDto`                  → {@link ItkParcelTasks}  (GET /parcels/:id/itk-tasks)
 *  - `ParcelIndicatorsHistoryResponseDto` → {@link IndicatorPoint} (GET /parcels/:id/indicators)
 *
 * La méta parcelle réutilise le type {@link Parcel} de la feature Domaines.
 */

export type ItkStageStatus = 'upcoming' | 'inProgress' | 'completed' | 'skipped' | 'delayed';
export type ItkTaskState = 'completed' | 'pending' | 'upcoming' | 'overdue' | 'manual';
export type RiskSeverity = 'low' | 'medium' | 'high';

/** Intrant associé à une tâche ITK (produit + dose). */
export interface ItkTaskInput {
  product: string;
  dosePerHa: number;
  unit: string;
  optional?: boolean;
}

/** Tâche ITK d'un stade (lecture seule côté agriculteur). */
export interface ItkTask {
  taskId: string;
  type: string;
  title: string;
  description: string;
  /** Chaîne lisible d'origine du catalogue, ex. « J+15 à J+20 ». */
  timing: string;
  windowStart: string | null;
  windowEnd: string | null;
  state: ItkTaskState;
  inputs: ItkTaskInput[];
}

/** Risque agronomique estimé d'un stade — source du conseil accessible FARMER. */
export interface StageRisk {
  /** hydric | parasitic | nutritional | climatic | disease | … */
  type: string;
  name: string;
  scientificName?: string;
  /** « Pourquoi » — cause déclenchante. */
  trigger: string;
  severity: RiskSeverity | string;
  /** « Que faire » — recommandation agronomique. */
  recommendation: string;
}

/** Stade ITK enrichi (tâches + risques). */
export interface ItkStage {
  stageCode: string;
  stageName: string;
  order: number;
  expectedStart: string;
  expectedEnd: string;
  status: ItkStageStatus;
  /** Jour de début du stade relatif au semis (J+x). */
  dayStart: number;
  /** Jour de fin du stade relatif au semis (J+y). */
  dayEnd: number;
  description: string;
  critical: boolean;
  tasks: { mandatory: ItkTask[]; recommended: ItkTask[] };
  risks: StageRisk[];
}

/** Réponse `GET /parcels/:id/itk-tasks?stage=all`. */
export interface ItkParcelTasks {
  parcelId: string;
  hasActiveCampaign: boolean;
  cropType?: string;
  variety?: string;
  plantingDate?: string;
  daysAfterSowing: number;
  currentStage: { stageCode: string; stageName: string; order: number } | null;
  stages: ItkStage[];
  itkValidationStatus: 'web_provisional' | 'irag_validated';
}

/** Estimation de rendement (`GET /parcels/:id/yield-estimate`). */
export interface YieldEstimate {
  /** Rendement estimé (t/ha). */
  value: number;
  unit: string;
  /** Intervalle de confiance autour de `value` (t/ha). */
  confidenceInterval: { low: number; high: number };
  /** Score de confiance global (0-100). */
  confidence: number;
  /** Rendement de référence / normale (t/ha). */
  referenceYield: number;
  /** Potentiel maximal théorique (t/ha). */
  potential: number;
  daysSinceSowing: number;
}

/** Point d'historique NDVI (`GET /parcels/:id/indicators`). */
export interface IndicatorPoint {
  /** Date « YYYY-MM-DD ». */
  date: string;
  ndvi?: number | null;
  evi?: number | null;
  ndwi?: number | null;
  savi?: number | null;
}
