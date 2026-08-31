import { apiClient } from '@/shared/api/client';

import type { MarqueurQuestionnaire, ProfilLu } from './profil.types';

export const profilApi = {
  /** Le dossier tel que l'agriculteur peut le voir — sert au préremplissage. */
  async lireProfil(): Promise<ProfilLu> {
    const { data } = await apiClient.get<ProfilLu>('/farmers/me');
    return data;
  },

  /**
   * Écrit une étape validée. Le corps ne porte que les champs de cette étape :
   * perdre douze réponses parce que le réseau tombe à la troisième est le
   * scénario que cette découpe évite.
   */
  async envoyerEtape(corps: Record<string, unknown>): Promise<MarqueurQuestionnaire> {
    const { data } = await apiClient.patch<MarqueurQuestionnaire>('/farmers/me/profil', corps);
    return data;
  },
};
