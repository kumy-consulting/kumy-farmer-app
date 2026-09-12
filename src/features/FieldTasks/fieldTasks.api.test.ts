import { describe, expect, it, vi } from 'vitest';

import { apiClient } from '@/shared/api/client';

import { fieldTasksApi } from './fieldTasks.api';

vi.mock('@/shared/api/client', () => ({
  apiClient: { get: vi.fn(), patch: vi.fn() },
}));

describe('fieldTasksApi', () => {
  it('liste les consignes de l\'agriculteur et déballe l\'enveloppe paginée', async () => {
    // `apiClient.get` est une méthode surchargée d'AxiosInstance : `vi.mocked(apiClient)`
    // renvoie ce type surchargé et non le mock — on type la méthode individuellement.
    vi.mocked(apiClient.get).mockResolvedValue({ data: { data: [{ id: 'ft1' }], total: 1 } });

    const tasks = await fieldTasksApi.list('u1');

    expect(apiClient.get).toHaveBeenCalledWith('/field-tasks', {
      params: { farmerId: 'u1', limit: 100 },
    });
    expect(tasks).toHaveLength(1);
    expect(tasks[0].id).toBe('ft1');
  });

  it('fait avancer une consigne via une transition', async () => {
    vi.mocked(apiClient.patch).mockResolvedValue({ data: { id: 'ft1', status: 'done' } });

    const task = await fieldTasksApi.transition('ft1', 'complete');

    expect(apiClient.patch).toHaveBeenCalledWith('/field-tasks/ft1', { action: 'complete' });
    expect(task.status).toBe('done');
  });
});
