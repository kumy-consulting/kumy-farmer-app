/**
 * Types de l'onglet « Mon espace ».
 *
 * Ils recopient volontairement la forme des DTO du backoffice — `FarmerScoreResponseDto`,
 * `CreditEligibilityDto`, `FarmerProfileDto` — pour que le branchement sur les
 * vrais endpoints se réduise à remplacer la source, sans retoucher l'affichage :
 *
 *   GET /scoring/farmers/:id/profile             → ProfilAgriculteur
 *   GET /scoring/farmers/:id                     → ScoreAgriculteur
 *   GET /scoring/farmers/:id/credit-eligibility  → EligibiliteCredit
 *
 * Les trois sont ouverts au rôle FARMER et ne sont, à ce jour, appelés nulle part.
 */

export type Grade = 'A' | 'B' | 'C' | 'D' | 'E';

/** Niveau d'un pilier, tel que le scoring le renvoie. */
export type NiveauPilier = 'high' | 'mid' | 'low';

export interface Pilier {
  /** Clé stable, sert de libellé côté app. */
  cle: 'agronomic' | 'financial' | 'climateRisk' | 'behavioral' | 'social' | 'market';
  score: number;
  /** Poids du pilier dans le score global (%). */
  poids: number;
  niveau: NiveauPilier;
  /** Phrase courte qui explique le niveau — c'est elle qui rend le score actionnable. */
  detail: string;
}

export interface ScoreAgriculteur {
  scoreGlobal: number;
  grade: Grade;
  /** Date de calcul (ISO). Un score est daté, il n'est pas « l'état actuel ». */
  calculeLe: string;
  piliers: Pilier[];
}

export interface CritereEligibilite {
  libelle: string;
  /** Valeur constatée, affichée telle quelle : c'est elle qui dit quoi corriger. */
  valeur: string;
  rempli: boolean;
}

export interface EligibiliteCredit {
  eligible: boolean;
  montantMax: number;
  montantMaxFormate: string;
  criteres: CritereEligibilite[];
}

export interface ProfilAgriculteur {
  nomComplet: string;
  /** Référence de l'agriculteur dans le réseau — son identifiant lisible. */
  code: string;
  /** L'API renvoie un texte libre (« 42 ans »), pas un nombre. */
  age: string;
  sexe: 'male' | 'female';
  situationFamiliale?: string;
  niveauInstruction: string;
  telephone: string;
  telephoneSecondaire?: string;
  /**
   * Pièce d'identité. Jamais affichée en entier par défaut : c'est la donnée la
   * plus sensible de l'écran, et la voir ne sert qu'à vérifier qu'elle est la
   * bonne — les quatre derniers chiffres y suffisent.
   */
  pieceIdentite?: string;
  village: string;
  sousPrefecture: string;
  prefecture: string;
  region: string;
  cooperative: string;
  anneesExperience: number;
  culturesPrincipales: string;
  surfaceTotale: string;
  irrigation: string;
  /** `simulation` = compte de démonstration : l'écran doit le dire franchement. */
  niveauAcces: 'full' | 'simulation';
}
