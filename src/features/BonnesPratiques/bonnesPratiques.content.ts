/**
 * Les six sujets des bonnes pratiques agricoles.
 *
 * Le contenu vit ici, séparé du rendu, pour deux raisons : il se relit sans
 * traverser du JSX, et le jour où il viendra de l'API, seuls les appelants de ce
 * module changeront — pas les écrans.
 *
 * Les textes sont ceux de la maquette, repris mot pour mot. Ce ne sont pas des
 * conseils agronomiques mais les PORTES vers ces conseils : dire à un
 * agriculteur guinéen à quelle dose fertiliser engage sa récolte, et cette
 * phrase-là doit venir des agronomes Kumy, pas d'ici.
 */

/** Clé de l'illustration, résolue par `IllustrationSujet`. */
export type SujetId = 'sol' | 'parcelle' | 'cultures' | 'eau' | 'engrais' | 'ravageurs';

export interface Sujet {
  id: SujetId;
  titre: string;
  /**
   * Trois ou quatre mots sous le titre, dans la tuile.
   *
   * Distincte du `resume` : celui-ci reformule le titre en plus long — « Bien
   * gérer l'eau » / « Optimiser l'utilisation de l'eau pour des cultures
   * saines » — quand l'accroche doit AJOUTER quelque chose. Elle nomme donc à
   * chaque fois l'angle du sujet : ce qu'on regarde, ou quand on agit.
   *
   * Aucune ne prescrit : pas de dose, pas de produit, pas de calendrier. Ces
   * phrases-là engagent une récolte, et elles viendront des agronomes Kumy.
   */
  accroche: string;
  resume: string;
}

export const SUJETS: readonly Sujet[] = [
  {
    id: 'sol',
    titre: 'Pourquoi faire une étude de sol ?',
    accroche: 'Ce que votre terre contient',
    resume: 'Connaître les caractéristiques de votre sol pour mieux fertiliser et augmenter vos rendements.',
  },
  {
    id: 'parcelle',
    titre: 'Bien préparer sa parcelle',
    accroche: 'Nettoyer, labourer, tracer',
    resume: 'Les bonnes pratiques pour préparer le sol et créer les meilleures conditions pour vos cultures.',
  },
  {
    id: 'cultures',
    titre: 'Bien choisir ses cultures',
    accroche: 'Selon votre sol et la saison',
    resume: 'Choisir les cultures adaptées à votre sol, à la saison et à vos objectifs.',
  },
  {
    id: 'eau',
    titre: 'Bien gérer l’eau',
    accroche: 'Arroser juste, au bon moment',
    resume: 'Optimiser l’utilisation de l’eau pour des cultures saines et un meilleur rendement.',
  },
  {
    id: 'engrais',
    titre: 'Bien utiliser les engrais',
    accroche: 'La bonne dose, au bon stade',
    resume: 'Fertiliser au bon moment et à la bonne dose pour nourrir efficacement vos cultures.',
  },
  {
    id: 'ravageurs',
    titre: 'Prévenir les maladies et ravageurs',
    accroche: 'Repérer tôt, agir vite',
    resume: 'Adopter les bons réflexes pour prévenir et gérer les maladies et ravageurs.',
  },
] as const;

/** Numéro d'assistance Kumy, déjà affiché sur l'écran d'attente. */
export const TELEPHONE_CONSEILLER = '+224628898919';
export const TELEPHONE_CONSEILLER_AFFICHE = '628 89 89 19';
