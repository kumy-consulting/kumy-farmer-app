import { describe, expect, it } from 'vitest';

import type { FarmerSelfDto } from './monEspace.api';
import { versProfil } from './monEspace.mapper';

const DTO: FarmerSelfDto = {
  farmerCode: 'KMY-DBK-0412',
  displayName: 'Mamadou Aliou Barry',
  phone: '+224621457890',
  alternatePhone: '+224664120355',
  address: {
    detail: 'Quartier Kaporo-Rails',
    districtName: 'Kaporo',
    sousPrefectureName: 'Tanènè',
    prefectureName: 'Dubréka',
    regionName: 'Kindia',
  },
  cooperativeName: 'Coopérative maraîchère de Tanènè',
  notificationSettings: { sms: true },
};

describe('versProfil', () => {
  it('reprend l’identité, le contact, le lieu et la coopérative', () => {
    expect(versProfil(DTO, 'full')).toEqual({
      nomComplet: 'Mamadou Aliou Barry',
      code: 'KMY-DBK-0412',
      telephone: '+224621457890',
      telephoneSecondaire: '+224664120355',
      adresse: 'Quartier Kaporo-Rails',
      village: 'Kaporo',
      sousPrefecture: 'Tanènè',
      prefecture: 'Dubréka',
      region: 'Kindia',
      cooperative: 'Coopérative maraîchère de Tanènè',
      niveauAcces: 'full',
    });
  });

  it('laisse vides les échelons que l’API ne renvoie pas, sans inventer', () => {
    const profil = versProfil(
      { ...DTO, address: {}, alternatePhone: undefined, cooperativeName: undefined },
      'full',
    );

    expect(profil.village).toBe('');
    expect(profil.sousPrefecture).toBe('');
    expect(profil.prefecture).toBe('');
    expect(profil.region).toBe('');
    expect(profil.cooperative).toBe('');
    expect(profil.adresse).toBeUndefined();
    expect(profil.telephoneSecondaire).toBeUndefined();
  });

  it('tient le niveau d’accès de la session, pas de l’API', () => {
    expect(versProfil(DTO, 'simulation').niveauAcces).toBe('simulation');
    expect(versProfil(DTO, undefined).niveauAcces).toBe('full');
  });
});

describe('profilDeSecours', () => {
  it('construit un profil depuis la seule session quand l’API est hors d’atteinte', async () => {
    const { profilDeSecours } = await import('./monEspace.mapper');

    const profil = profilDeSecours({
      uid: 'uid-1',
      displayName: 'Awa Diallo',
      phone: '+224622201362',
      role: 'farmer',
    });

    expect(profil.nomComplet).toBe('Awa Diallo');
    expect(profil.telephone).toBe('+224622201362');
    // Ce que la session ne sait pas reste vide : l'écran masque ces lignes
    // plutôt que d'afficher un gabarit.
    expect(profil.code).toBe('');
    expect(profil.cooperative).toBe('');
    expect(profil.village).toBe('');
  });

  it('rend null sans session — il n’y a alors personne à afficher', async () => {
    const { profilDeSecours } = await import('./monEspace.mapper');
    expect(profilDeSecours(null)).toBeNull();
  });
});
