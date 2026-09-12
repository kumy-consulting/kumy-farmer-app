import { create } from 'zustand';

import type { OnboardingProfile, OnboardingUserData } from './onboarding.types';

const emptyProfile = (): OnboardingProfile => ({
  birthDate: null,
  regionId: null,
  regionName: null,
  prefectureId: null,
  prefectureName: null,
  addressDetail: null,
});

interface OnboardingState {
  token: string | null;
  userData: OnboardingUserData | null;
  password: string | null;
  profile: OnboardingProfile;
  setToken: (t: string) => void;
  setUserData: (d: OnboardingUserData) => void;
  setPassword: (p: string) => void;
  setProfile: (partial: Partial<OnboardingProfile>) => void;
  reset: () => void;
}

export const useOnboardingStore = create<OnboardingState>((set) => ({
  token: null,
  userData: null,
  password: null,
  profile: emptyProfile(),
  setToken: (token) => set({ token }),
  setUserData: (userData) => set({ userData }),
  setPassword: (password) => set({ password }),
  setProfile: (partial) => set((state) => ({ profile: { ...state.profile, ...partial } })),
  reset: () => set({ token: null, userData: null, password: null, profile: emptyProfile() }),
}));
