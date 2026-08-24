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

/**
 * Profil affiché dans « Mes informations ».
 *
 * **Les données personnelles n'y figurent pas, et n'y transitent pas.** Âge,
 * sexe, situation familiale, niveau d'instruction, années d'expérience et
 * numéro de pièce d'identité ont été retirés du type lui-même, pas seulement de
 * l'affichage : un champ absent de l'interface ne peut pas réapparaître au
 * branchement de `GET /scoring/farmers/:id/profile`, ni fuiter par un log ou un
 * cache. Ces informations restent connues du réseau — elles ne sont simplement
 * pas redescendues jusqu'au téléphone de l'agriculteur, qui peut changer de
 * mains.
 *
 * Ce que l'écran garde est ce qui sert à *se reconnaître et se joindre* : une
 * identité, un contact, un lieu.
 *
 * Cultures, surface et irrigation ont suivi le même chemin, pour une autre
 * raison : aucun composant ne les affiche. Un champ transporté « au cas où »
 * finit par fuiter. Ils reviendront le jour où un écran les demande, avec leur
 * source.
 */
export interface ProfilAgriculteur {
  nomComplet: string;
  /** Référence de l'agriculteur dans le réseau — son identifiant lisible. */
  code: string;
  telephone: string;
  telephoneSecondaire?: string;
  /**
   * Adresse en texte libre — quartier, repère, secteur. Le niveau le plus fin
   * de la localisation, celui qu'aucun découpage administratif ne porte : on
   * n'arrive pas chez quelqu'un avec le nom d'une sous-préfecture.
   */
  adresse?: string;
  village: string;
  sousPrefecture: string;
  prefecture: string;
  region: string;
  cooperative: string;
  /** `simulation` = compte de démonstration : l'écran doit le dire franchement. */
  niveauAcces: 'full' | 'simulation';
}
