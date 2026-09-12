import { beforeEach, describe, expect, it } from 'vitest';

import { useOnboardingStore } from './onboarding.store';

describe('onboarding.store', () => {
  beforeEach(() => useOnboardingStore.getState().reset());
  it('stocke le token + userData + password', () => {
    const s = useOnboardingStore.getState();
    s.setToken('abc');
    s.setUserData({ email: 'a@b.c', phone: '+224622201362', firstName: 'Awa', lastName: 'D', role: 'farmer' });
    s.setPassword('123456');
    const next = useOnboardingStore.getState();
    expect(next.token).toBe('abc');
    expect(next.userData?.firstName).toBe('Awa');
    expect(next.password).toBe('123456');
  });
  it('reset vide tout', () => {
    useOnboardingStore.getState().setToken('x');
    useOnboardingStore.getState().reset();
    expect(useOnboardingStore.getState().token).toBeNull();
  });
});

describe('onboarding.store — tranche profile', () => {
  beforeEach(() => useOnboardingStore.getState().reset());

  it('initialise profile avec tous les champs à null', () => {
    expect(useOnboardingStore.getState().profile).toEqual({
      birthDate: null,
      regionId: null,
      regionName: null,
      prefectureId: null,
      prefectureName: null,
      addressDetail: null,
    });
  });

  it('setProfile fusionne une mise à jour partielle sans écraser le reste', () => {
    useOnboardingStore.getState().setProfile({ regionId: 'r1', regionName: 'Kindia' });
    useOnboardingStore.getState().setProfile({ prefectureId: 'p1', prefectureName: 'Dubréka' });

    expect(useOnboardingStore.getState().profile).toEqual({
      birthDate: null,
      regionId: 'r1',
      regionName: 'Kindia',
      prefectureId: 'p1',
      prefectureName: 'Dubréka',
      addressDetail: null,
    });
  });

  it('reset remet profile à null', () => {
    useOnboardingStore.getState().setProfile({ birthDate: '1990-01-01', regionId: 'r1' });
    useOnboardingStore.getState().reset();

    expect(useOnboardingStore.getState().profile.birthDate).toBeNull();
    expect(useOnboardingStore.getState().profile.regionId).toBeNull();
  });
});
