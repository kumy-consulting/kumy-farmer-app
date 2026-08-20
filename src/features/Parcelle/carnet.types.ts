/**
 * Le carnet d'une parcelle : ce que l'encadreur y a vu et demandé, passage par
 * passage.
 *
 * Les deux moitiés viennent de sources réelles, toutes deux ouvertes au FARMER :
 *
 * - **Les observations** sortent des journaux de tâches ITK
 *   (`GET /parcels/:id/itk-tasks` → `completedLog`), qui portent `notes`,
 *   `photoUrls`, `completedBy.displayName` et `completedAt`.
 * - **Les consignes** sont les `field-tasks` partageant un même `visitId` —
 *   exactement le regroupement que l'accueil utilise déjà pour dire
 *   « Visite de Dr Camara · 3 consignes · 1 faite ».
 *
 * ⚠️ Ce qui manque, et qu'aucun écran ne pourra montrer en l'état : les
 * observations libres. `POST /parcels/:id/inspections` accepte des photos et une
 * note, mais **aucun GET n'existe** — elles partent au serveur et personne ne
 * peut les relire. Une observation qui n'est pas accrochée à une tâche ITK est
 * donc invisible pour l'agriculteur.
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
