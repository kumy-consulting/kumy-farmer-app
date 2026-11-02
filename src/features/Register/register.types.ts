/**
 * Le contrat de l'inscription autonome, côté app.
 *
 * Cinq statuts, pas six : ce que `POST /auth/phone/otp/verify` peut dire d'un
 * numéro une fois sa possession prouvée.
 */
export type StatutCompte = 'active' | 'pending' | 'inactive' | 'suspended' | 'absent';

/** Ce que le partenaire avait saisi ; l'agriculteur ne fait que le confirmer. */
export interface ProfilPreRempli {
  firstName: string;
  lastName: string;
  birthDate: string | null;
}

export interface CompteVerifie {
  statut: StatutCompte;
  /** Renseigné uniquement pour `pending` et `inactive`. */
  profil?: ProfilPreRempli;
}

export interface VerificationResultat {
  /** Preuve de possession du téléphone : court, à usage unique, 15 minutes. */
  registrationToken: string;
  account: CompteVerifie;
}

export interface DemandeCodeResultat {
  /** Validité du code, en secondes. */
  expiresIn: number;
  /** Délai avant qu'un nouvel envoi soit possible, en secondes. */
  resendAfter: number;
}

export interface CreationComptePayload {
  registrationToken: string;
  firstName: string;
  lastName: string;
  /** ISO `YYYY-MM-DD`. */
  birthDate: string;
  regionId: string;
  prefectureId: string;
  sousPrefectureId: string;
  /** Code confidentiel à 6 chiffres. */
  pin: string;
}

/** Le profil saisi ou confirmé à l'écran `/inscription/profil`. */
export interface ProfilInscription {
  firstName: string;
  lastName: string;
  birthDate: string | null;
}

/** L'adresse saisie à l'écran `/inscription/adresse`, noms compris pour l'affichage. */
export interface AdresseInscription {
  regionId: string | null;
  regionName: string | null;
  prefectureId: string | null;
  prefectureName: string | null;
  sousPrefectureId: string | null;
  sousPrefectureName: string | null;
}
