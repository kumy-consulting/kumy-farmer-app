import { apiClient } from '@/shared/api/client';

import type { ValidateTokenResponse } from './onboarding.types';

export interface ReferentialItem {
  id: string;
  name: string;
}

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

const toItems = (rows: ReferentialRaw[]): ReferentialItem[] =>
  rows.map(({ id, name }) => ({ id, name }));

export interface ActivateProfileData {
  birthDate?: string;
  regionId?: string;
  prefectureId?: string;
  addressDetail?: string;
}

export const onboardingApi = {
  async validateToken(token: string): Promise<ValidateTokenResponse> {
    const { data } = await apiClient.get<ValidateTokenResponse>(
      `/auth/validate-token?token=${encodeURIComponent(token)}`,
    );
    return data;
  },

  async getRegions(): Promise<ReferentialItem[]> {
    const { data } = await apiClient.get<PaginatedResponse<ReferentialRaw>>('/regions?limit=100');
    return toItems(data.data);
  },

  async getPrefectures(regionId: string): Promise<ReferentialItem[]> {
    const { data } = await apiClient.get<PaginatedResponse<ReferentialRaw>>(
      `/prefectures?regionId=${encodeURIComponent(regionId)}&limit=200`,
    );
    return toItems(data.data);
  },

  async activate(payload: {
    token: string;
    password: string;
    profileData?: ActivateProfileData;
  }): Promise<{ message: string }> {
    const { data } = await apiClient.post<{ message: string }>('/auth/activate', payload);
    return data;
  },
};
