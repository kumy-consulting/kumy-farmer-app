import type { AuthTokens } from '@/shared/services/nativeAuth';

/** Identifiants de connexion : téléphone E.164 + code PIN. */
export interface LoginRequest {
  identifier: string;
  password: string;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  phone: string;
  role: string;
}

export interface LoginResponse {
  user: UserProfile;
  // Présents en natif (auth Bearer) ; absents en web (auth par cookie HttpOnly).
  tokens?: AuthTokens;
}

export interface RefreshResponse {
  tokens?: AuthTokens;
}
