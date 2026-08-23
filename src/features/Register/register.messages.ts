/**
 * Les messages d'erreur du parcours partagés par plusieurs écrans.
 *
 * Le plafond horaire d'envoi de SMS (cinq par numéro) se heurte aussi bien au
 * premier écran qu'au bouton « Renvoyer le code » : la phrase doit être la même
 * des deux côtés, sans quoi le même refus se raconterait de deux façons.
 */

/** L'API a répondu 429 : le plafond horaire d'envoi est atteint pour ce numéro. */
export const MESSAGE_PLAFOND_SMS =
  'Trop de codes ont été demandés pour ce numéro. Réessayez dans une heure.';
