import { apiClient } from '@/shared/api/client';

import type { ValidateTokenResponse } from './onboarding.types';

export const onboardingApi = {
  async validateToken(token: string): Promise<ValidateTokenResponse> {
    const { data } = await apiClient.get<ValidateTokenResponse>(
      `/auth/validate-token?token=${encodeURIComponent(token)}`,
    );
    return data;
  },

  async activate(payload: { token: string; password: string }): Promise<{ message: string }> {
    const { data } = await apiClient.post<{ message: string }>('/auth/activate', payload);
    return data;
  },
};
