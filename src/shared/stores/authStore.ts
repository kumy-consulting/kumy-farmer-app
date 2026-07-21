import { create } from 'zustand';

import { authApi } from '@/features/Auth/auth.api';
import type { UserProfile } from '@/features/Auth/auth.types';
import { ApiRequestError } from '@/shared/api/client';
import { clearTokens, saveTokens } from '@/shared/services/nativeAuth';
import {
  clearRememberedPhone,
  getRememberedPhone,
  setRememberedPhone,
} from '@/shared/services/rememberedPhone.service';

interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  rememberedPhone: string | null;
}

interface AuthActions {
  login: (phone: string, pin: string) => Promise<void>;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
  initialize: () => Promise<void>;
  forgetPhone: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState & AuthActions>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  rememberedPhone: null,

  login: async (phone: string, pin: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authApi.login({ identifier: phone, password: pin });

      // Natif : persiste les jetons pour le fallback Bearer (no-op si absents /
      // sur web). À faire avant tout appel authentifié ultérieur.
      if (response.tokens) {
        await saveTokens(response.tokens);
      }

      // Mémorise le numéro pour la connexion simplifiée (device-level).
      await setRememberedPhone(phone);

      set({
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
        rememberedPhone: phone,
      });
    } catch (err) {
      const message = err instanceof ApiRequestError ? getLoginErrorMessage(err) : 'Une erreur inattendue est survenue';

      set({ isLoading: false, error: message });
      throw err;
    }
  },

  logout: async () => {
    try {
      await authApi.logout();
    } catch {
      // Continuer le logout même si l'appel API échoue
    }
    // Natif : efface les jetons stockés (no-op sur web).
    await clearTokens().catch(() => {});
    // Connexion simplifiée : oublie le numéro → PhoneEntry à la prochaine visite.
    await clearRememberedPhone();
    set({
      user: null,
      isAuthenticated: false,
      error: null,
      rememberedPhone: null,
    });
  },

  loadUser: async () => {
    try {
      const user = await authApi.me();
      set({ user });
    } catch {
      // Si le cookie est invalide, déconnecter
      set({ user: null, isAuthenticated: false });
    }
  },

  initialize: async () => {
    set({ isLoading: true });
    // Charge le numéro mémorisé AVANT de résoudre isLoading : ProtectedRoute
    // en a besoin dès le premier rendu non-loading pour aiguiller phone/PIN.
    const rememberedPhone = await getRememberedPhone();
    set({ rememberedPhone });
    try {
      const user = await authApi.me();
      set({
        user,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch {
      // Pas de session active ou cookie expiré
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  forgetPhone: async () => {
    await clearRememberedPhone();
    set({ rememberedPhone: null });
  },

  clearError: () => set({ error: null }),
}));

function getLoginErrorMessage(err: ApiRequestError): string {
  switch (err.status) {
    case 401:
      return 'Numéro de téléphone ou code PIN incorrect';
    case 403:
      return err.message.includes('not activated')
        ? "Votre compte n'est pas encore activé"
        : 'Votre compte a été désactivé';
    default:
      return 'Erreur de connexion. Veuillez réessayer.';
  }
}
