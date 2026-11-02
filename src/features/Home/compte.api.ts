import { apiClient } from '@/shared/api/client';

/** L'état de rattachement du compte, tel que le rend l'API. */
export interface EtatDuCompte {
  hasFarms: boolean;
  hasEngineer: boolean;
}

/** Dernière demande d'étude de sol transmise, `null` si l'agriculteur n'en a jamais faite. */
export interface EtudeDeSol {
  requestedAt: string | null;
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

  /** Où en est la demande d'étude de sol de l'agriculteur connecté. */
  async etudeDeSol(): Promise<EtudeDeSol> {
    const { data } = await apiClient.get<EtudeDeSol>('/farmers/me/soil-study-request');
    return data;
  },

  /**
   * Demande une étude de sol. Le corps est vide à dessein : le serveur relit le
   * nom, l'adresse et le téléphone depuis la fiche de l'agriculteur connecté,
   * l'app n'a aucune donnée personnelle à transporter.
   *
   * Répond 409 quand une demande date de moins de 24 h, 502 si l'e-mail n'a pas
   * pu partir — auquel cas la demande reste rejouable.
   */
  async demanderEtudeDeSol(): Promise<EtudeDeSol> {
    const { data } = await apiClient.post<EtudeDeSol>('/farmers/me/soil-study-request');
    return data;
  },
};
