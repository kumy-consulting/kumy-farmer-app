/**
 * Le contact du support Kumy — **écrit une seule fois**.
 *
 * Il vivait en deux exemplaires, un par écran qui l'affiche. Les deux ont
 * divergé de la réalité en même temps, et personne ne pouvait le voir : un
 * numéro faux ne casse aucun test, il fait juste sonner dans le vide chez
 * quelqu'un qui n'a pas d'autre issue.
 */
export const SUPPORT_TELEPHONE = '+224 628 89 89 19';

/** Le même, sous la forme qu'attend un lien `tel:`. */
export const SUPPORT_TEL_HREF = `tel:${SUPPORT_TELEPHONE.replace(/\s/g, '')}`;

/**
 * Le même encore, sans l'indicatif : la forme sous laquelle un Guinéen compose
 * et retient un numéro. Dérivé plutôt que réécrit — un second littéral, c'est
 * exactement la divergence que ce fichier existe pour empêcher.
 */
export const SUPPORT_TELEPHONE_LOCAL = SUPPORT_TELEPHONE.replace('+224 ', '');
