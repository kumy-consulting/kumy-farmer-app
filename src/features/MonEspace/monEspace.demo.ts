import type { EligibiliteCredit, ProfilAgriculteur, ScoreAgriculteur } from './monEspace.types';

/**
 * Jeu de maquette de « Mon espace » — **aucun appel réseau n'est encore branché**.
 *
 * Même exploitation que la démo de l'accueil (Dubréka : ananas, piment, riz) pour
 * que les deux onglets racontent le même agriculteur. Les valeurs sont plausibles
 * et volontairement imparfaites : un profil tout vert ne permet pas de juger
 * l'écran qui compte, celui où il manque quelque chose.
 */

export const demoProfil: ProfilAgriculteur = {
  nomComplet: 'Mamadou Aliou Barry',
  code: 'KMY-DBK-0412',
  age: '42 ans',
  sexe: 'male',
  situationFamiliale: 'Marié, 6 enfants',
  niveauInstruction: 'Primaire achevé',
  telephone: '+224 621 45 78 90',
  telephoneSecondaire: '+224 664 12 03 55',
  pieceIdentite: 'GN-CNI-004721',
  village: 'Kaporo',
  sousPrefecture: 'Tanènè',
  prefecture: 'Dubréka',
  region: 'Kindia',
  cooperative: 'Coopérative maraîchère de Tanènè',
  anneesExperience: 14,
  culturesPrincipales: 'Ananas, piment, riz de bas-fond',
  surfaceTotale: '18,4 ha',
  irrigation: 'Goutte-à-goutte partiel',
  niveauAcces: 'full',
};

export const demoScore: ScoreAgriculteur = {
  scoreGlobal: 68,
  grade: 'B',
  calculeLe: '2026-08-18T06:00:00.000Z',
  piliers: [
    { cle: 'agronomic', score: 78, poids: 30, niveau: 'high', detail: 'Itinéraires suivis, 3 campagnes closes' },
    { cle: 'financial', score: 52, poids: 25, niveau: 'mid', detail: 'Deux remboursements en retard en 2025' },
    { cle: 'climateRisk', score: 61, poids: 15, niveau: 'mid', detail: 'Bas-fond exposé aux crues de juillet' },
    { cle: 'behavioral', score: 84, poids: 15, niveau: 'high', detail: 'Consignes traitées sous 48 h' },
    { cle: 'social', score: 70, poids: 10, niveau: 'mid', detail: 'Membre actif de la coopérative' },
    { cle: 'market', score: 44, poids: 5, niveau: 'low', detail: 'Aucun contrat d’achat déclaré' },
  ],
};

export const demoEligibilite: EligibiliteCredit = {
  eligible: true,
  montantMax: 1_500_000,
  montantMaxFormate: '1 500 000 GNF',
  criteres: [
    { libelle: 'Campagnes terminées', valeur: '3 sur 2 requises', rempli: true },
    { libelle: 'Parcelles cartographiées', valeur: '12 sur 12', rempli: true },
    { libelle: 'Ancienneté sur la plateforme', valeur: '2 ans', rempli: true },
    { libelle: 'Score financier', valeur: '52 — il en faut 60', rempli: false },
    { libelle: 'Contrat d’achat déclaré', valeur: 'aucun', rempli: false },
  ],
};

/** Libellés des piliers — le mot que l'agriculteur lit, pas la clé du backend. */
export const LIBELLE_PILIER: Record<string, string> = {
  agronomic: 'Conduite des cultures',
  financial: 'Situation financière',
  climateRisk: 'Exposition au climat',
  behavioral: 'Suivi des consignes',
  social: 'Vie de la coopérative',
  market: 'Débouchés',
};
