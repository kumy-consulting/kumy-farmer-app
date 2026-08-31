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

/** Qui a clos une tâche. `role` distingue le technicien de l'agriculteur. */
export interface ItkLogAuteur {
  uid: string;
  role: string;
  displayName?: string;
}

/**
 * Journal de clôture d'une tâche ITK.
 *
 * C'est la seule voie par laquelle une observation de terrain — note et photos —
 * redescend jusqu'à l'agriculteur : `POST /parcels/:id/inspections` accepte les
 * mêmes contenus mais n'a aucun GET, donc ce qui y est déposé reste invisible.
 */
export interface ItkCompletedLog {
  logId: string;
  completedAt: string;
  completedBy: ItkLogAuteur;
  notes?: string;
  photoUrls?: string[];
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
  /** Présent une fois la tâche close — porte notes et photos. */
  completedLog?: ItkCompletedLog;
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

/**
 * Contexte climatique 30 j d'une parcelle (`GET /parcels/:id/climate-context`).
 *
 * `dataSource` dit d'où viennent les chiffres : `'iot'` quand une station du
 * domaine a pu être lue, `'external'` sinon — CHIRPS + NASA POWER, donc
 * disponible même sans le moindre kit posé. C'est ce qui en fait la seule source
 * météo ouverte au rôle FARMER qui fonctionne sur un domaine non équipé.
 *
 * Rien ici n'est une mesure « en ce moment » : `avg7dC` est une moyenne sur sept
 * jours, `asOfDate` la dernière date réellement lue. L'affichage doit le dire.
 */
export interface ClimateContext {
  parcelId: string;
  dataSource: 'iot' | 'external';
  asOfDate: string | null;
  temperature: { avg7dC: number | null; expectedC: number | null; deltaC: number | null };
  wind: { avgKmh: number | null; direction: string | null; treatmentWindowOpen: boolean; treatmentLabel?: string };
  rainfall: { cumulMm: number | null; expectedMm: number | null; deltaPct: number | null };
}
