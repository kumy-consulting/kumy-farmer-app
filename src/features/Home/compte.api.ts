import { apiClient } from '@/shared/api/client';

/** L'état de rattachement du compte, tel que le rend l'API. */
export interface EtatDuCompte {
  hasFarms: boolean;
  hasEngineer: boolean;
}

export const compteApi = {
  /**
   * `farmerId` vaut l'uid de l'utilisateur — aucune recherche supplémentaire
   * n'est nécessaire après la connexion.
   */
  async etatDuCompte(farmerId: string): Promise<EtatDuCompte> {
    const { data } = await apiClient.get<EtatDuCompte>(`/farmers/${farmerId}/account-state`);
    return data;
  },
};
