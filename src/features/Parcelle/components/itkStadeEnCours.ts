import dayjs from 'dayjs';

import type { ItkStage } from '../parcelle.types';

/**
 * Le stade que l'agriculteur traverse aujourd'hui.
 *
 * Il est déduit des DATES, et non du `status` renvoyé par l'API. Constaté sur
 * données réelles : quand un stade prend du retard, l'API le marque `delayed`,
 * pointe `currentStage` sur lui, et laisse le stade suivant en `upcoming` — même
 * lorsque la date du jour tombe dans sa fenêtre. Aucun stade ne porte alors
 * `inProgress`, si bien qu'aucun n'était mis en valeur dans la frise.
 *
 * Les deux informations ne disent d'ailleurs pas la même chose, et l'app a
 * besoin des deux : le stade en retard est celui qui réclame du travail, celui
 * en cours est celui où l'on se trouve. Le premier reste rouge, le second est
 * mis en avant.
 */
export function stadeEnCours(stages: ItkStage[], maintenant = dayjs()): string | undefined {
  const couvreAujourdhui = (s: ItkStage) => {
    const debut = dayjs(s.expectedStart);
    const fin = dayjs(s.expectedEnd);
    if (!debut.isValid() || !fin.isValid()) return false;
    return !maintenant.isBefore(debut, 'day') && !maintenant.isAfter(fin, 'day');
  };

  // Les fenêtres se chevauchent d'un jour dans les données réelles — « 06–16
  // août » puis « 16 août – 20 sept. ». On retient le DERNIER stade couvrant le
  // jour : au basculement, on est entré dans le suivant, pas resté dans celui
  // qui s'achève.
  for (let i = stages.length - 1; i >= 0; i -= 1) {
    if (couvreAujourdhui(stages[i])) return stages[i].stageCode;
  }

  // Hors campagne (avant le semis, après la récolte) : on s'en remet à l'API
  // plutôt que de désigner un stade au hasard.
  return stages.find((s) => s.status === 'inProgress')?.stageCode;
}

/**
 * Statut à afficher pour un stade, une fois connu celui que l'on traverse.
 *
 * Une seule fonction pour toute l'app : sans elle, la frise disait « en cours »
 * pendant que le panneau de détail affichait « À venir » pour le même stade,
 * chacun lisant le champ brut de l'API.
 */
export function statutEffectif(stage: ItkStage, codeEnCours: string | undefined): ItkStage['status'] {
  return stage.stageCode === codeEnCours ? 'inProgress' : stage.status;
}
