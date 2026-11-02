import type { StatutCompte } from './register.types';

/** Les huit écrans du parcours, nommés une fois pour toutes. */
export const ROUTES_INSCRIPTION = {
  telephone: '/inscription/telephone',
  code: '/inscription/code',
  dejaInscrit: '/inscription/deja-inscrit',
  suspendu: '/inscription/suspendu',
  profil: '/inscription/profil',
  adresse: '/inscription/adresse',
  pin: '/inscription/code-confidentiel',
  resultat: '/inscription/resultat',
} as const;

/**
 * L'aiguillage après vérification du code — le cœur de la fonctionnalité.
 *
 * Un compte `active` sert déjà : il n'y a rien à créer, on invite à se
 * connecter. Un compte `suspended` mérite son propre écran : l'envoyer se
 * connecter le heurterait à un refus incompréhensible. `pending` et `inactive`
 * signifient qu'un partenaire a saisi les informations — l'agriculteur les
 * confirme. `absent` ouvre la saisie complète.
 *
 * Le `switch` est exhaustif sans branche par défaut : ajouter un statut au type
 * fera échouer la compilation ici, là où il faut décider.
 */
export function ecranApresVerification(statut: StatutCompte): string {
  switch (statut) {
    case 'active':
      return ROUTES_INSCRIPTION.dejaInscrit;
    case 'suspended':
      return ROUTES_INSCRIPTION.suspendu;
    case 'pending':
    case 'inactive':
    case 'absent':
      return ROUTES_INSCRIPTION.profil;
  }
}
