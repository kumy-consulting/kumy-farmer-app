import { apiClient } from '@/shared/api/client';

/**
 * La vue restreinte qu'un agriculteur a de lui-même, telle que l'API la rend.
 *
 * Le miroir exact de `FarmerSelfDto` côté backoffice : ni pièce d'identité, ni
 * date de naissance, ni sexe, ni comptes mobile money. Ces champs existent dans
 * le dossier de l'agriculteur, ils ne descendent simplement pas jusqu'au
 * téléphone — qui peut changer de mains.
 */
export interface FarmerSelfDto {
  farmerCode: string;
  displayName: string;
  phone: string;
  alternatePhone?: string;
  address: {
    detail?: string;
    districtName?: string;
    sousPrefectureName?: string;
    prefectureName?: string;
    regionName?: string;
  };
  cooperativeName?: string;
  notificationSettings: { sms: boolean };
}

export const monEspaceApi = {
  /**
   * Aucun identifiant en paramètre : l'agriculteur est résolu depuis l'uid du
   * jeton, côté serveur.
   */
  async profil(): Promise<FarmerSelfDto> {
    const { data } = await apiClient.get<FarmerSelfDto>('/farmers/me');
    return data;
  },

  async majAlertesSms(sms: boolean): Promise<{ sms: boolean }> {
    const { data } = await apiClient.patch<{ sms: boolean }>('/farmers/me/notification-settings', {
      sms,
    });
    return data;
  },
};
