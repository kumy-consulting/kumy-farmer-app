import { create } from 'zustand';

import type { OnboardingUserData } from './onboarding.types';

interface OnboardingState {
  token: string | null;
  userData: OnboardingUserData | null;
  password: string | null;
  setToken: (t: string) => void;
  setUserData: (d: OnboardingUserData) => void;
  setPassword: (p: string) => void;
  reset: () => void;
}

export const useOnboardingStore = create<OnboardingState>((set) => ({
  token: null,
  userData: null,
  password: null,
  setToken: (token) => set({ token }),
  setUserData: (userData) => set({ userData }),
  setPassword: (password) => set({ password }),
  reset: () => set({ token: null, userData: null, password: null }),
}));
