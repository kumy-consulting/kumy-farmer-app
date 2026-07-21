import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { onboardingApi } from '@/features/Onboarding/onboarding.api';
import { useOnboardingStore } from '@/features/Onboarding/onboarding.store';
import { useAuthStore } from '@/shared/stores/authStore';

import { OnboardingSuccessPage } from './OnboardingSuccessPage';

vi.mock('@/features/Onboarding/onboarding.api', () => ({
  onboardingApi: {
    activate: vi.fn(),
  },
}));

describe('OnboardingSuccessPage', () => {
  beforeEach(() => {
    useOnboardingStore.getState().reset();
    useOnboardingStore.getState().setToken('token-abc');
    useOnboardingStore.getState().setUserData({
      email: 'a@b.c',
      phone: '+224622201362',
      firstName: 'Awa',
      lastName: 'D',
      role: 'farmer',
    });
    useOnboardingStore.getState().setPassword('123456');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('établit la session (login) avec le téléphone + PIN après une activation réussie', async () => {
    vi.mocked(onboardingApi.activate).mockResolvedValue({ message: 'ok' });
    const loginSpy = vi.spyOn(useAuthStore.getState(), 'login').mockResolvedValue();

    render(
      <MemoryRouter>
        <OnboardingSuccessPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(onboardingApi.activate).toHaveBeenCalledWith({ token: 'token-abc', password: '123456' });
    });

    await waitFor(() => {
      expect(loginSpy).toHaveBeenCalledWith('+224622201362', '123456');
    });

    await waitFor(() => {
      expect(screen.getByText('Compte activé !')).toBeDefined();
    });
  });
});
