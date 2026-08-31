/**
 * Réponses du questionnaire de profil, à plat — champs à noms français côté
 * formulaire. `useQuestionnaireProfil` traduit ce format vers celui attendu
 * par `PATCH /farmers/me/profil` au moment de l'envoi de chaque étape.
 */
export interface ReponsesQuestionnaire {
  nomComplet?: string;
  dateNaissance?: string;
  genre?: string;
  niveauEducation?: string;
  situationMatrimoniale?: string;
  nombreEnfants?: number;
  farmingExperience?: number;
  estMembreCooperative?: boolean;
  nomCooperative?: string;
  anneeAdhesion?: number;
  compteCreditRural?: boolean;
  /** Texte libre — pas une liste : le serveur valide `@IsString() @MaxLength(500)`. */
  formations?: string;
  /** Texte libre — pas une liste : le serveur valide `@IsString() @MaxLength(500)`. */
  equipements?: string;
  regionId?: string;
  prefectureId?: string;
  sousPrefectureId?: string;
  hectares?: number;
  primaryCrops?: string[];
  foncier?: string;
}

/** Le dossier tel que rendu par `GET /farmers/me`, réduit à ce que lit le questionnaire. */
export interface ProfilLu {
  displayName: string;
  /**
   * Ces trois blocs sont OPTIONNELS parce que le serveur les omet — il ne les
   * renvoie pas vides — tant que l'agriculteur n'a rien rempli. Les avoir
   * déclarés obligatoires faisait passer un compte neuf pour un dossier
   * illisible : `versReponses` jetait un TypeError depuis le `.then()`, et
   * l'écran affichait un échec de chargement sur une requête pourtant réussie.
   */
  address?: {
    regionId?: string;
    prefectureId?: string;
    sousPrefectureId?: string;
  };
  profileSurvey?: {
    step: number;
    completedAt: string | null;
  };
  questionnaire?: {
    educationLevel?: string;
    maritalStatus?: string;
    childrenCount?: number;
    farmingExperience?: number;
    cooperative?: {
      isMember: true;
      name?: string;
      joinDate?: string;
    };
    hasCreditRuralAccount?: boolean;
    /** Texte libre — pas une liste : le serveur valide `@IsString() @MaxLength(500)`. */
    declaredTrainings?: string;
    /** Texte libre — pas une liste : le serveur valide `@IsString() @MaxLength(500)`. */
    declaredEquipment?: string;
    cultivatedHectares?: number;
    primaryCrops?: string[];
    declaredLandTenure?: string;
    dateOfBirth?: string;
    gender?: string;
  };
}

/** Retour de `PATCH /farmers/me/profil` : marque l'étape validée. */
export interface MarqueurQuestionnaire {
  step: number;
  completedAt: string | null;
}
