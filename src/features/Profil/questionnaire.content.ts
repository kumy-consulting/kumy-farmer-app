/**
 * Contenu figé du questionnaire de profil : les valeurs `valeur` des tranches
 * d'expérience et les codes de `NIVEAUX_EDUCATION` sont ceux que lit le
 * moteur de score (`pillars/social.ts`, backoffice API) — ne pas les changer
 * sans vérifier ce fichier côté serveur. Les libellés, eux, sont libres.
 */

/**
 * `scoreExperience` compare le nombre d'années à 15, 10, 5 puis 2. On envoie
 * donc la BORNE BASSE de chaque tranche, jamais son milieu : un agriculteur
 * qui répond « 2 à 4 ans » doit rester sous le palier des 5 ans.
 */
export const TRANCHES_EXPERIENCE = [
  { valeur: 1, libelle: 'Moins de 2 ans' },
  { valeur: 2, libelle: '2 à 4 ans' },
  { valeur: 5, libelle: '5 à 9 ans' },
  { valeur: 10, libelle: '10 à 14 ans' },
  { valeur: 15, libelle: '15 ans et plus' },
] as const;

/** Codes alignés sur l'enum `EducationLevel` du backoffice. */
export const NIVEAUX_EDUCATION = [
  { valeur: 'none', libelle: 'Aucune scolarité' },
  { valeur: 'primary', libelle: 'Primaire' },
  { valeur: 'secondary', libelle: 'Collège' },
  { valeur: 'high_school', libelle: 'Lycée' },
  { valeur: 'vocational', libelle: 'Formation professionnelle' },
  { valeur: 'university', libelle: 'Université' },
] as const;

/** Codes alignés sur l'enum `MaritalStatus` du backoffice. */
export const SITUATIONS_MATRIMONIALES = [
  { valeur: 'single', libelle: 'Célibataire' },
  { valeur: 'married', libelle: 'Marié(e)' },
  { valeur: 'widowed', libelle: 'Veuf(ve)' },
  { valeur: 'divorced', libelle: 'Divorcé(e)' },
] as const;

/** Codes alignés sur l'enum `DeclaredLandTenure` du backoffice. */
export const FONCIERS = [
  { valeur: 'owned', libelle: 'Elles m’appartiennent' },
  { valeur: 'inherited', libelle: 'Héritage familial' },
  { valeur: 'leased', libelle: 'Je les loue' },
  { valeur: 'communal', libelle: 'Terres communautaires' },
  { valeur: 'other', libelle: 'Autre' },
] as const;

/** Suggestions de puces pour `ChoixMultiple` — l'agriculteur peut en ajouter d'autres. */
export const CULTURES_COURANTES = ['Riz', 'Maïs', 'Manioc', 'Arachide', 'Fonio', 'Ananas', 'Tomate', 'Piment'] as const;
