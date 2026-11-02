import { afterEach, describe, expect, it, vi } from 'vitest';

import { apiClient } from '@/shared/api/client';

import { onboardingApi } from './onboarding.api';

vi.mock('@/shared/api/client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

const paginated = <T>(data: T[]) => ({
  data: { data, total: data.length, page: 1, limit: 100, totalPages: 1 },
});

describe('onboardingApi.getRegions', () => {
  afterEach(() => vi.clearAllMocks());

  it('appelle GET /regions?limit=100 et aplatit la réponse paginée', async () => {
    vi.mocked(apiClient.get).mockResolvedValue(
      paginated([
        { id: 'r1', name: 'Kindia', extra: 'ignoré' },
        { id: 'r2', name: 'Boké' },
      ]),
    );

    const result = await onboardingApi.getRegions();

    expect(apiClient.get).toHaveBeenCalledWith('/regions?limit=100');
    expect(result).toEqual([
      { id: 'r1', name: 'Kindia' },
      { id: 'r2', name: 'Boké' },
    ]);
  });
});

describe('onboardingApi.getPrefectures', () => {
  afterEach(() => vi.clearAllMocks());

  it('appelle GET /prefectures avec le filtre regionId', async () => {
    vi.mocked(apiClient.get).mockResolvedValue(paginated([{ id: 'p1', name: 'Dubréka' }]));

    const result = await onboardingApi.getPrefectures('r1');

    expect(apiClient.get).toHaveBeenCalledWith('/prefectures?regionId=r1&limit=200');
    expect(result).toEqual([{ id: 'p1', name: 'Dubréka' }]);
  });
});

describe('onboardingApi.activate', () => {
  afterEach(() => vi.clearAllMocks());

  it('transmet le profileData au backend', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({ data: { message: 'ok' } });

    await onboardingApi.activate({
      token: 't',
      password: '123456',
      profileData: { birthDate: '1990-01-01', regionId: 'r1', prefectureId: 'p1', addressDetail: 'Marché' },
    });

    expect(apiClient.post).toHaveBeenCalledWith('/auth/activate', {
      token: 't',
      password: '123456',
      profileData: { birthDate: '1990-01-01', regionId: 'r1', prefectureId: 'p1', addressDetail: 'Marché' },
    });
  });
});
