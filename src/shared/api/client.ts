import { Capacitor } from '@capacitor/core';
import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';

import { getIdToken, getRefreshToken, saveTokens, type AuthTokens } from '@/shared/services/nativeAuth';

/**
 * Transport HTTP partagé — instance axios unique + intercepteurs.
 *
 * ⚠️ Convention Kumy : ce fichier ne contient QUE le transport (client +
 * intercepteurs + erreur normalisée). Les endpoints métier vivent dans un
 * fichier `*.api.ts` PAR FEATURE (ex. `features/Auth/auth.api.ts`) qui importe
 * `apiClient` d'ici. Pas d'agrégat global d'endpoints.
 */

const isNative = Capacitor.isNativePlatform();

// URL de l'API selon la plateforme :
// - Natif : URL absolue vers Cloud Run (le WebView est servi depuis
//   https://localhost, pas de rewrite Firebase Hosting `/api`).
// - Web : chemin relatif `/api` résolu par le proxy Vite (dev) / rewrite (prod).
const NATIVE_API_FALLBACK = 'https://agripilot-backoffice-api-dev-rlsznfc4qq-ew.a.run.app/api/v1';
const API_URL = isNative
  ? import.meta.env.VITE_API_URL_NATIVE || NATIVE_API_FALLBACK
  : import.meta.env.VITE_API_URL || '/api/v1';

/** Erreur applicative normalisée levée par le client (message + status HTTP). */
export class ApiRequestError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiRequestError';
    this.status = status;
  }
}

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Requête (natif seulement) : attache le jeton Bearer stocké. No-op sur web.
if (isNative) {
  apiClient.interceptors.request.use(async (config) => {
    const token = await getIdToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });
}

// Endpoints qui ne doivent jamais déclencher l'auto-refresh.
const SKIP_REFRESH_URLS = ['/auth/login', '/auth/refresh', '/auth/logout'];

apiClient.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (!axios.isAxiosError(error)) {
      throw error;
    }

    const originalRequest = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;
    const status = error.response?.status ?? 500;
    const shouldSkipRefresh = SKIP_REFRESH_URLS.some((url) => originalRequest?.url?.includes(url));

    // Auto-refresh sur 401 pour les appels authentifiés uniquement.
    if (status === 401 && originalRequest && !shouldSkipRefresh && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        if (isNative) {
          const refreshToken = await getRefreshToken();
          const { data } = await apiClient.post<{ tokens?: AuthTokens }>(
            '/auth/refresh',
            refreshToken ? { refreshToken } : {},
          );
          if (data?.tokens) {
            await saveTokens(data.tokens);
          }
        } else {
          await apiClient.post('/auth/refresh');
        }
        return apiClient(originalRequest);
      } catch {
        throw new ApiRequestError('Session expirée', 401);
      }
    }

    const body = error.response?.data as { error?: string; message?: string } | undefined;
    const message = body?.error || body?.message || error.message || 'Erreur réseau';
    throw new ApiRequestError(message, status);
  },
);
