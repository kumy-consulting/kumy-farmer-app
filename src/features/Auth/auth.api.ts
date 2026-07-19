import { apiClient } from '@/shared/api/client';

import type { LoginRequest, LoginResponse, RefreshResponse, UserProfile } from './auth.types';

/**
 * API de la feature Auth.
 *
 * Convention Kumy : UN fichier `*.api.ts` par feature, co-localisé avec la
 * feature, qui consomme le client partagé `@/shared/api/client`. Aucun agrégat
 * global d'endpoints (on n'entasse PAS tout dans un `shared/services/api.ts`).
 */
export const authApi = {
  async login(payload: LoginRequest): Promise<LoginResponse> {
    const { data } = await apiClient.post<LoginResponse>('/auth/login', payload);
    return data;
  },

  async me(): Promise<UserProfile> {
    const { data } = await apiClient.get<UserProfile>('/auth/me');
    return data;
  },

  async refresh(): Promise<RefreshResponse> {
    const { data } = await apiClient.post<RefreshResponse>('/auth/refresh');
    return data;
  },

  async logout(): Promise<void> {
    await apiClient.post('/auth/logout');
  },
};
