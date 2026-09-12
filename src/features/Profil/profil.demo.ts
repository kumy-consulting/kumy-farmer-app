import type { ProfilLu } from './profil.types';

/**
 * Le dossier montré en aperçu de démonstration (`?demo=1`).
 *
 * `isDemoMode` fait passer `ProtectedRoute` sans session : sans ce court-circuit,
 * le questionnaire appelait `GET /farmers/me`, récoltait un 401 et n'affichait
 * qu'un bandeau d'échec. Même parti pris que `useHomeFeed` et
 * `useCompteNouveau` — l'aperçu montre l'app garnie, pas ses écrans de panne.
 *
 * Étape 1 déjà validée : c'est l'état le plus instructif à regarder, celui
 * d'une reprise en cours de parcours.
 */
export const profilDemo: ProfilLu = {
  displayName: 'Mamadou Aliou Barry',
  address: { regionId: '', prefectureId: '', sousPrefectureId: '' },
  profileSurvey: { step: 1, completedAt: null },
  questionnaire: {
    dateOfBirth: '1985-03-04',
    gender: 'male',
    educationLevel: 'secondary',
    maritalStatus: 'married',
    childrenCount: 4,
  },
};
