import { create } from 'zustand';

import type { AdresseInscription, CompteVerifie, ProfilInscription } from './register.types';

const profilVierge = (): ProfilInscription => ({
  firstName: '',
  lastName: '',
  birthDate: null,
});

const adresseVierge = (): AdresseInscription => ({
  regionId: null,
  regionName: null,
  prefectureId: null,
  prefectureName: null,
  sousPrefectureId: null,
  sousPrefectureName: null,
});

interface RegisterState {
  phone: string | null;
  registrationToken: string | null;
  profil: ProfilInscription;
  adresse: AdresseInscription;
  pin: string | null;
  setPhone: (phone: string) => void;
  setVerification: (token: string, account: CompteVerifie) => void;
  setProfil: (profil: ProfilInscription) => void;
  setAdresse: (partial: Partial<AdresseInscription>) => void;
  setPin: (pin: string) => void;
  reset: () => void;
}

/**
 * L'état du parcours d'inscription autonome.
 *
 * Volontairement séparé de `useOnboardingStore` : les deux parcours partagent
 * des composants mais pas leur machine à états. L'un démarre d'un jeton
 * d'invitation, l'autre d'un numéro ; les fusionner emmêlerait deux
 * cheminements sans rien économiser.
 */
export const useRegisterStore = create<RegisterState>((set) => ({
  phone: null,
  registrationToken: null,
  profil: profilVierge(),
  adresse: adresseVierge(),
  pin: null,

  setPhone: (phone) => set({ phone }),

  setVerification: (registrationToken, account) =>
    set({
      registrationToken,
      // Le profil n'arrive que sur `pending` / `inactive`. Ailleurs, l'écran
      // s'ouvre vierge plutôt que de traîner une saisie précédente.
      profil: account.profil
        ? {
            firstName: account.profil.firstName,
            lastName: account.profil.lastName,
            birthDate: account.profil.birthDate,
          }
        : profilVierge(),
    }),

  setProfil: (profil) => set({ profil }),

  // La cascade vit ici, pas dans l'écran : changer de région invalide la
  // préfecture, changer de préfecture invalide la sous-préfecture. Laisser ce
  // ménage à l'appelant, c'est se garantir de l'oublier une fois sur deux.
  setAdresse: (partial) =>
    set((state) => {
      const adresse = { ...state.adresse, ...partial };
      const regionChanged =
        partial.regionId !== undefined && partial.regionId !== state.adresse.regionId;
      const prefectureChanged =
        partial.prefectureId !== undefined && partial.prefectureId !== state.adresse.prefectureId;

      // On ne remet à zéro que ce que l'appelant n'a PAS fourni : changer de
      // région invalide la préfecture héritée, pas celle qu'on vient de
      // choisir dans le même geste. Une valeur explicite l'emporte toujours
      // sur la remise à zéro automatique.
      if (regionChanged && partial.prefectureId === undefined) {
        adresse.prefectureId = null;
        adresse.prefectureName = null;
      }
      if ((regionChanged || prefectureChanged) && partial.sousPrefectureId === undefined) {
        adresse.sousPrefectureId = null;
        adresse.sousPrefectureName = null;
      }
      return { adresse };
    }),

  setPin: (pin) => set({ pin }),

  reset: () =>
    set({
      phone: null,
      registrationToken: null,
      profil: profilVierge(),
      adresse: adresseVierge(),
      pin: null,
    }),
}));
