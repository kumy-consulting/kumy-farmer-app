import { beforeEach, describe, expect, it } from 'vitest';

import { useRegisterStore } from './register.store';

const etat = () => useRegisterStore.getState();

describe('useRegisterStore', () => {
  beforeEach(() => {
    etat().reset();
  });

  it('part d’un état vierge', () => {
    expect(etat().phone).toBeNull();
    expect(etat().registrationToken).toBeNull();
    expect(etat().statut).toBeNull();
    expect(etat().profil).toEqual({ firstName: '', lastName: '', birthDate: null });
    expect(etat().adresse.regionId).toBeNull();
    expect(etat().pin).toBeNull();
  });

  it('pré-remplit le profil quand la vérification en rapporte un', () => {
    etat().setVerification('tok-1', {
      statut: 'pending',
      profil: { firstName: 'Awa', lastName: 'Diallo', birthDate: '1990-05-12' },
    });

    expect(etat().registrationToken).toBe('tok-1');
    expect(etat().statut).toBe('pending');
    expect(etat().profil).toEqual({
      firstName: 'Awa',
      lastName: 'Diallo',
      birthDate: '1990-05-12',
    });
  });

  it('laisse le profil vierge quand aucun compte ne porte le numéro', () => {
    etat().setVerification('tok-2', { statut: 'absent' });

    expect(etat().profil).toEqual({ firstName: '', lastName: '', birthDate: null });
  });

  it('remet préfecture et sous-préfecture à zéro quand la région change', () => {
    etat().setAdresse({
      regionId: 'r1',
      regionName: 'Kindia',
      prefectureId: 'p1',
      prefectureName: 'Coyah',
      sousPrefectureId: 'sp1',
      sousPrefectureName: 'Manéah',
    });

    etat().setAdresse({ regionId: 'r2', regionName: 'Boké' });

    expect(etat().adresse).toEqual({
      regionId: 'r2',
      regionName: 'Boké',
      prefectureId: null,
      prefectureName: null,
      sousPrefectureId: null,
      sousPrefectureName: null,
    });
  });

  it('remet la sous-préfecture à zéro quand la préfecture change', () => {
    etat().setAdresse({
      regionId: 'r1',
      regionName: 'Kindia',
      prefectureId: 'p1',
      prefectureName: 'Coyah',
      sousPrefectureId: 'sp1',
      sousPrefectureName: 'Manéah',
    });

    etat().setAdresse({ prefectureId: 'p2', prefectureName: 'Dubréka' });

    expect(etat().adresse.prefectureId).toBe('p2');
    expect(etat().adresse.sousPrefectureId).toBeNull();
    expect(etat().adresse.sousPrefectureName).toBeNull();
    expect(etat().adresse.regionId).toBe('r1');
  });

  it('efface tout, jeton et code confidentiel compris, à la réinitialisation', () => {
    etat().setPhone('+224622201362');
    etat().setVerification('tok-3', { statut: 'absent' });
    etat().setPin('123456');

    etat().reset();

    expect(etat().phone).toBeNull();
    expect(etat().registrationToken).toBeNull();
    expect(etat().pin).toBeNull();
  });
});
