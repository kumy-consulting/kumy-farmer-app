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

/**
 * L'API a répondu 503 à la vérification du code : la lecture du compte
 * Firebase Auth a échoué pour une raison transitoire, APRÈS que le code a
 * déjà été détruit par la transaction de vérification (`verifyCode`). Il ne
 * peut donc plus être rejoué — le message ne doit surtout pas laisser croire
 * que le code tapé était faux, ce qui est précisément le mensonge que le
 * statut 503 existe pour supprimer.
 */
export const MESSAGE_SERVICE_INDISPONIBLE_VERIFICATION =
  "Ce n'est pas votre code : le service est momentanément indisponible. Demandez-en un nouveau dans un instant.";

/**
 * L'API a répondu 503 à la création du compte (`POST /auth/phone/register`) :
 * même panne transitoire que ci-dessus, cette fois pendant la reprise d'un
 * compte préparé par un partenaire (`isAuthDisabled` côté API). Le jeton
 * d'inscription est lui aussi déjà consommé quand cette erreur arrive — un
 * message qui parlerait d'un échec de saisie serait tout aussi faux ici.
 */
export const MESSAGE_SERVICE_INDISPONIBLE_INSCRIPTION =
  'Le service est momentanément indisponible. Réessayez dans un instant.';
