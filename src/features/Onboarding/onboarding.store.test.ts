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
