import { apiClient } from '@/shared/api/client';

import type { FieldTask, PaginatedFieldTasks } from './fieldTasks.types';

/**
 * API des consignes de terrain.
 *
 * `GET /field-tasks` et `PATCH /field-tasks/:id` sont ouverts au rôle FARMER :
 * un agriculteur est toujours forcé sur ses propres consignes côté serveur, et
 * seule la forme « transition » du PATCH (`start` / `complete`) lui est permise —
 * éditer le contenu reste réservé au technicien.
 */
export const fieldTasksApi = {
  /** Consignes de l'agriculteur, toutes parcelles confondues. */
  async list(farmerId: string, limit = 100): Promise<FieldTask[]> {
    const { data } = await apiClient.get<PaginatedFieldTasks>('/field-tasks', {
      params: { farmerId, limit },
    });
    return data.data;
  },

  /** Fait avancer une consigne : planned → in_progress → done. */
  async transition(id: string, action: 'start' | 'complete'): Promise<FieldTask> {
    const { data } = await apiClient.patch<FieldTask>(`/field-tasks/${id}`, { action });
    return data;
  },
};
