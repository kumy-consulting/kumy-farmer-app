import type { UserProfile } from '@/features/Auth/auth.types';

import type { FarmerSelfDto } from './monEspace.api';
import type { ProfilAgriculteur } from './monEspace.types';

/**
 * `FarmerSelfDto` → `ProfilAgriculteur`.
 *
 * Le mapper ne complète rien : un échelon que l'API ne connaît pas ressort
 * vide, et l'écran le masque. Écrire « Non renseigné » à la place donnerait à
 * une lacune l'apparence d'une donnée.
 */
export function versProfil(dto: FarmerSelfDto, accessTier?: UserProfile['accessTier']): ProfilAgriculteur {
  return {
    nomComplet: dto.displayName,
    code: dto.farmerCode,
    telephone: dto.phone,
    telephoneSecondaire: dto.alternatePhone,
    adresse: dto.address.detail,
    village: dto.address.districtName ?? '',
    sousPrefecture: dto.address.sousPrefectureName ?? '',
    prefecture: dto.address.prefectureName ?? '',
    region: dto.address.regionName ?? '',
    cooperative: dto.cooperativeName ?? '',
    // Le niveau d'accès vient de la session, pas de l'API : il est déjà connu à
    // la connexion, et un second porteur de la même vérité finirait par diverger.
    niveauAcces: accessTier === 'simulation' ? 'simulation' : 'full',
  };
}

/**
 * Le profil de repli quand l'API est hors d'atteinte — panne, hors réseau, ou
 * compte pas encore rattaché à une fiche agriculteur.
 *
 * Il ne porte que ce que la session sait déjà : le nom et le numéro de la
 * personne connectée. C'est peu, mais c'est *elle*. La seule alternative — un
 * gabarit de démonstration — reviendrait à afficher le nom de quelqu'un d'autre
 * sur son propre téléphone.
 */
export function profilDeSecours(user: UserProfile | null): ProfilAgriculteur | null {
  if (!user) return null;

  return {
    nomComplet: user.displayName,
    code: '',
    telephone: user.phone,
    adresse: undefined,
    village: '',
    sousPrefecture: '',
    prefecture: '',
    region: '',
    cooperative: '',
    niveauAcces: user.accessTier === 'simulation' ? 'simulation' : 'full',
  };
}
