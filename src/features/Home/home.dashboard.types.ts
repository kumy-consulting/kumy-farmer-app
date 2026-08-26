import type { FeedItem, Perimetre } from './home.feed.types';

/**
 * Contrat du tableau de bord de l'accueil.
 *
 * Il suit le modèle conceptuel des recommandations produit (§23) : résumé de
 * l'exploitation, priorités, état des domaines, accompagnement, activité. Le
 * calcul est aujourd'hui fait côté client, à partir des endpoints existants ;
 * l'API pourra le servir tel quel plus tard sans que les composants bougent.
 *
 * C'est le seul contrat que connaissent les blocs de l'accueil.
 */

/** Gravité métier de la situation, pas volume de tâches (§14). */
export type Gravite = 'normal' | 'surveiller' | 'attention' | 'critique';

/** Rang d'un élément affiché (§15). L'accueil montre P0, P1 et une partie des P2. */
export type Priorite = 'P0' | 'P1' | 'P2' | 'P3';

/**
 * Ce que l'élément est, du point de vue de l'utilisateur (§6).
 *
 * Une alerte dit « quelque chose demande mon attention ». Une action dit
 * « voici ce que je dois faire ». Une alerte peut engendrer une action ; ce sont
 * deux objets, et les confondre empêche de savoir s'il faut aller voir ou aller
 * faire.
 */
export type NaturePriorite = 'alerte' | 'action';

export interface ElementPrioritaire {
  id: string;
  priorite: Priorite;
  nature: NaturePriorite;
  titre: string;
  /** Domaine · parcelle · culture — où agir (§8). */
  perimetre: Perimetre;
  /** « Reporter l'apport d'urée » — ce que le technicien ou l'agronome préconise. */
  actionRecommandee?: string;
  /** Phrase prête : « En retard depuis le 12 juin », « Dernier jour : demain » (§12). */
  echeance?: string;
  /** L'échéance est passée — sert au filtre « En retard ». */
  enRetard: boolean;
  /** L'agriculteur l'a démarrée — sert au filtre « En cours ». */
  enCours: boolean;
  /** L'élément d'origine — les actions restent actionnables depuis la carte. */
  source: FeedItem;
}

export interface ResumeExploitation {
  gravite: Gravite;
  /** Pourquoi le statut est celui-ci, en une phrase (§4). */
  explication: string;
  domaines: number;
  parcelles: number;
  surfaceHa: number;
  /** Nombre d'éléments P0 + P1 — ce que la phrase de tête annonce. */
  pointsAttention: number;
  /** Heure du chargement des données (§19) : l'utilisateur doit savoir s'il peut s'y fier. */
  chargeA: string | null;
}

export interface EtatDomaines {
  total: number;
  surfaceHa: number;
  normaux: number;
  aSurveiller: number;
  critiques: number;
}

export interface Accompagnement {
  /**
   * Nom du technicien : celui du dernier passage, à défaut celui de la visite
   * annoncée. `null` tant qu'aucune visite ne le nomme — la carte dit alors
   * « Votre technicien », qui est un rôle et non un nom d'emprunt.
   */
  technicien: string | null;
  derniereVisite: FeedItem | null;
  /**
   * Prochaine visite planifiée, servie par `GET /farmers/:id/visits`. `null`
   * signifie « aucune programmée », jamais « pas de suivi » : la carte parle
   * donc de date non fixée, pas d'absence de technicien (§9).
   */
  prochaineVisite: { date: string; technicien: string | null; domaine?: string; objectif?: string } | null;
}

/** Ce qui s'est passé, du point de vue de l'agriculteur. */
export type NatureEvenement = 'fait' | 'signal' | 'passage';

export interface EvenementRecent {
  id: string;
  nature: NatureEvenement;
  titre: string;
  /** « Il y a 2 h », « Hier », « Le 12 juin » — celui de l'occurrence la plus récente. */
  quand: string;
  at: string;
  /**
   * Combien de fois le même événement s'est produit sur la fenêtre. Certaines
   * alertes saisonnières se répètent chaque jour : les lister une par une
   * remplit le bloc d'une seule phrase recopiée.
   */
  occurrences: number;
  perimetre: Perimetre;
  target?: string;
}

export interface HomeDashboard {
  resume: ResumeExploitation;
  /** Tout ce qui est à traiter, du plus grave au moins grave. */
  elements: ElementPrioritaire[];
  /**
   * Combien s'affichent avant repli. Le tri place les plus graves en tête, si
   * bien que les éléments visibles sont toujours les plus urgents du moment.
   */
  seuilVisible: number;
  domaines: EtatDomaines;
  accompagnement: Accompagnement;
  activite: EvenementRecent[];
}
