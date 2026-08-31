import type { ReferentialItem } from '@/features/Onboarding/onboarding.api';
import { apiClient } from '@/shared/api/client';

import type {
  CreationComptePayload,
  DemandeCodeResultat,
  VerificationResultat,
} from './register.types';

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface ReferentialRaw {
  id: string;
  name: string;
}

/**
 * API de la feature Register.
 *
 * Les régions et les préfectures sont lues via `onboardingApi` : c'est le même
 * référentiel public, il n'y a pas de raison d'en tenir deux lecteurs. Seules
 * les sous-préfectures manquaient — elles n'apparaissent que dans ce parcours.
 */
export const registerApi = {
  /** Déclenche l'envoi du code. Répond pareil pour un numéro connu ou inconnu. */
  async demanderCode(phone: string): Promise<DemandeCodeResultat> {
    const { data } = await apiClient.post<DemandeCodeResultat>('/auth/phone/otp', { phone });
    return data;
  },

  /** Vérifie le code et découvre, alors seulement, ce que porte le numéro. */
  async verifierCode(phone: string, code: string): Promise<VerificationResultat> {
    const { data } = await apiClient.post<VerificationResultat>('/auth/phone/otp/verify', {
      phone,
      code,
    });
    return data;
  },

  /** Crée le compte. Le jeton d'inscription tient lieu de preuve de possession. */
  async creerCompte(payload: CreationComptePayload): Promise<{ uid: string }> {
    const { data } = await apiClient.post<{ uid: string }>('/auth/phone/register', payload);
    return data;
  },

  async getSousPrefectures(prefectureId: string): Promise<ReferentialItem[]> {
    const { data } = await apiClient.get<PaginatedResponse<ReferentialRaw>>(
      `/sous-prefectures?prefectureId=${encodeURIComponent(prefectureId)}&limit=200`,
    );
    return data.data.map(({ id, name }) => ({ id, name }));
  },
};
