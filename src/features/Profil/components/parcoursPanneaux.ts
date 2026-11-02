import type { FunctionComponent } from 'react';

import type { ReponsesQuestionnaire } from '../profil.types';
import type { EtapeProps } from './ChampsQuestionnaire';
import {
  PanneauCooperative,
  PanneauCultures,
  PanneauExperience,
  PanneauFamille,
  PanneauFinancement,
  PanneauIdentite,
  PanneauTerre,
  PanneauZone,
} from './panneaux';

/**
 * L'ordre des écrans du questionnaire, et ce qu'on en déduit.
 *
 * Séparé de `panneaux.tsx` : ce sont des données et des fonctions, pas des
 * composants, et les mélanger casse le rafraîchissement à chaud de Vite.
 */

export type NumeroEtape = 1 | 2 | 3;

export interface Panneau {
  /** Étape serveur à laquelle ce panneau appartient — décide QUAND on envoie. */
  etape: NumeroEtape;
  /** Titre affiché en tête d'écran : c'est lui qui dit où l'on est. */
  titre: string;
  /**
   * La phrase sous le titre : ce que Kumy fait de ces réponses-là. Une par
   * panneau, concrète — pas un remplissage. C'est la contrepartie honnête de
   * ce qu'on demande, et sur un écran qui ne porte que deux ou trois
   * questions, c'est aussi ce qui l'empêche de sonner creux.
   */
  sousTitre: string;
  /** Champs obligatoires portés par ce panneau, validés avant d'en sortir. */
  obligatoires: (keyof ReponsesQuestionnaire)[];
  Composant: FunctionComponent<EtapeProps>;
}

/**
 * L'ordre des écrans. Chaque panneau reste dans son étape : l'union de leurs
 * `obligatoires` doit redonner exactement les champs requis par étape côté
 * serveur, sans quoi on enverrait une étape incomplète.
 */
export const PANNEAUX: Panneau[] = [
  {
    etape: 1,
    titre: 'Informations personnelles',
    sousTitre: 'De quoi vous reconnaître sur vos documents et vos attestations.',
    obligatoires: ['nomComplet', 'dateNaissance', 'genre'],
    Composant: PanneauIdentite,
  },
  { etape: 1, titre: 'Votre situation', sousTitre: 'Ce qui nous aide à adapter la forme des conseils qu’on vous envoie.',
    obligatoires: ['niveauEducation'], Composant: PanneauFamille },
  { etape: 2, titre: 'Expériences et parcours', sousTitre: 'Vos années de terrain décident du niveau de détail de nos conseils.',
    obligatoires: ['farmingExperience'], Composant: PanneauExperience },
  { etape: 2, titre: 'Coopérative', sousTitre: 'Les membres d’une coopérative reçoivent aussi les alertes de leur groupe.',
    obligatoires: ['estMembreCooperative'], Composant: PanneauCooperative },
  { etape: 2, titre: 'Accès au financement', sousTitre: 'Ce qui ouvre l’accès aux offres d’intrants et de crédit de nos partenaires.',
    obligatoires: ['compteCreditRural'], Composant: PanneauFinancement },
  {
    etape: 3,
    titre: 'Zone d’exploitation',
    sousTitre: 'La météo et les alertes que vous recevrez viennent de cette zone.',
    obligatoires: ['regionId', 'prefectureId', 'sousPrefectureId'],
    Composant: PanneauZone,
  },
  { etape: 3, titre: 'Votre exploitation', sousTitre: 'La surface sert à calculer les doses et les rendements attendus.',
    obligatoires: ['hectares', 'foncier'], Composant: PanneauTerre },
  { etape: 3, titre: 'Vos cultures', sousTitre: 'Chaque culture déclenche son propre calendrier de travaux.',
    obligatoires: ['primaryCrops'], Composant: PanneauCultures },
];

/** Nom de chaque étape, tel que l'invitation les a annoncés. */
export const NOMS_ETAPES: Record<NumeroEtape, string> = {
  1: 'Vous',
  2: 'Parcours',
  3: 'Exploitation',
};

/** Index du premier panneau d'une étape — point d'entrée à la reprise. */
export function premierPanneauDe(etape: NumeroEtape): number {
  return PANNEAUX.findIndex((p) => p.etape === etape);
}

/** `true` si ce panneau est le dernier de son étape : c'est là qu'on envoie. */
export function estDernierDeSonEtape(index: number): boolean {
  return PANNEAUX[index + 1]?.etape !== PANNEAUX[index].etape;
}

/** Avancement dans l'étape courante, de 0 à 1 — remplit le segment du rail. */
export function progressionDansEtape(index: number): number {
  const { etape } = PANNEAUX[index];
  const panneaux = PANNEAUX.filter((p) => p.etape === etape);
  const rang = index - premierPanneauDe(etape);
  return (rang + 1) / panneaux.length;
}
