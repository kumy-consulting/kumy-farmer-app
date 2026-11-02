/**
 * Initiales du nom affiché : « Mamadou Aliou Barry » → « MB ».
 *
 * Premier et DERNIER mot, pas les deux premiers : ici le nom de famille se
 * porte en dernier, et « MA » ne dirait rien à personne. Un nom d'un seul mot
 * rend une seule lettre, un nom vide ne rend rien — au jeton d'identité de
 * retomber alors sur une silhouette.
 */
export const initiales = (nom: string | undefined | null): string => {
  const mots = (nom ?? '').trim().split(/\s+/).filter(Boolean);
  if (mots.length === 0) return '';
  if (mots.length === 1) return mots[0][0].toUpperCase();
  return `${mots[0][0]}${mots[mots.length - 1][0]}`.toUpperCase();
};
