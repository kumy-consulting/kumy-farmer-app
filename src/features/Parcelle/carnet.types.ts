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
 * ⚠️ Ce qui manque, et qu'aucun écran ne pourra montrer en l'état : les
 * observations libres. `POST /parcels/:id/inspections` accepte des photos et une
 * note, mais **aucun GET n'existe** — l'app technicien les relit depuis son
 * propre IndexedDB, jamais depuis le serveur. Une observation qui n'est pas
 * accrochée à une tâche ITK est donc invisible pour l'agriculteur tant que
 * l'API n'expose pas la sous-collection `parcels/{id}/inspections`.
 */

export interface CarnetPhoto {
  /** `gs://` ou URL signée renvoyée par l'API. */
  url: string;
  /** Texte de remplacement — décrit ce que la photo montre. */
  legende?: string;
}

export interface CarnetObservation {
  id: string;
  /** Tâche à laquelle l'observation était accrochée, quand il y en a une. */
  aPropos?: string;
  texte?: string;
  photos: CarnetPhoto[];
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
