/**
 * Extrait le code d'invitation d'une saisie utilisateur.
 *
 * L'app n'a pas de deep link : l'agriculteur recopie le code, colle l'URL
 * d'activation, ou colle le SMS entier. Les trois formes sont acceptées.
 * Le code est une chaîne hexadécimale de 12 caractères.
 *
 * Si aucun motif ne correspond, la saisie brute (nettoyée) est renvoyée
 * telle quelle plutôt qu'une chaîne vide : le formulaire ne soumet que sur
 * une saisie non vide (`if (!trimmed) return;`), donc renvoyer '' ferait
 * paraître le bouton inerte. La saisie part à l'API, qui répond « code
 * invalide » — un échec explicite plutôt qu'un silence.
 */
const TOKEN_IN_URL = /token=([0-9a-fA-F]{12})/;
const BARE_TOKEN = /\b([0-9a-fA-F]{12})\b/;

export function extractInvitationCode(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return '';

  const fromUrl = TOKEN_IN_URL.exec(trimmed);
  if (fromUrl) return fromUrl[1].toLowerCase();

  const bare = BARE_TOKEN.exec(trimmed);
  if (bare) return bare[1].toLowerCase();

  return trimmed.toLowerCase();
}
