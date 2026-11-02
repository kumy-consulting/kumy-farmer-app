/**
 * Le carnet d'une parcelle : ce que le technicien y a vu et demandé, passage par
 * passage.
 *
 * Les deux moitiés viennent de sources réelles, toutes deux ouvertes au FARMER :
 *
 * - **Les observations** sortent des journaux de tâches ITK
 *   (`GET /parcels/:id/itk-tasks` → `completedLog`), qui portent `notes`,
 *   `photoUrls`, `completedBy.displayName` et `completedAt`.
 * - **Les consignes** sont les `field-tasks` de la parcelle. Seul un superviseur
 *   peut en créer : toute consigne est donc, par construction, une instruction
 *   de technicien. On ne filtre pas sur `visitId` — l'app technicien ne le
 *   renseigne que si une visite est ouverte à l'instant de la saisie, si bien
 *   qu'exiger ce champ masquait la plupart des consignes réellement données.
 *
 * Passages regroupés par date et auteur : les deux sources ne partagent aucun
 * identifiant commun, et « le jour où le technicien est venu » est de toute
 * façon la façon dont un passage existe pour l'agriculteur.
 *
 * - **Les observations libres** viennent de `GET /parcels/:id/inspections` : ce
 *   que le technicien a constaté sans que ce soit accroché à une tâche. Le
 *   serveur y résout `inspectorName` depuis `users/{uid}`, faute de quoi elles
 *   formeraient un passage séparé de celui des consignes du même jour.
 */

export interface CarnetPhoto {
  /** `gs://` ou URL signée renvoyée par l'API. */
  url: string;
  /** Texte de remplacement — décrit ce que la photo montre. */
  legende?: string;
}

export type PressionAdventices = 'none' | 'low' | 'moderate' | 'high';

export interface CarnetObservation {
  id: string;
  /** Tâche à laquelle l'observation était accrochée, quand il y en a une. */
  aPropos?: string;
  texte?: string;
  photos: CarnetPhoto[];
  /**
   * Pression d'adventices constatée. Absente des observations tirées d'un
   * journal ITK, qui ne portent pas d'évaluation.
   */
  pression?: PressionAdventices;
}

/**
 * Une observation libre telle que l'API la rend — miroir de
 * `InspectionResponseDto`, dates en chaînes ISO.
 */
export interface CarnetInspection {
  id: string;
  parcelId: string;
  inspectionDate: string;
  weedPressure?: PressionAdventices;
  weedSpecies?: string[];
  notes?: string;
  photoUrls?: string[];
  visitId?: string | null;
  inspectorUid: string;
  /** Résolu par le serveur ; `null` quand le compte est introuvable. */
  inspectorName?: string | null;
  createdAt: string;
}

export interface CarnetConsigne {
  id: string;
  titre: string;
  /** « il y a 2 j », « dans 3 j » — déjà formaté au moment du rendu. */
  echeance: string;
  faite: boolean;
  enRetard: boolean;
}

export interface CarnetVisite {
  id: string;
  /** ISO. Un passage est daté ; c'est ce qui ordonne le carnet. */
  date: string;
  auteur: string;
  observations: CarnetObservation[];
  consignes: CarnetConsigne[];
}
