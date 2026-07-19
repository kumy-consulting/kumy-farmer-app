import { Preferences } from '@capacitor/preferences';

/**
 * Stockage des jetons d'authentification en natif (Capacitor Preferences).
 *
 * En natif, le cookie HttpOnly `__session` ne traverse pas fiablement le WebView
 * (`https://localhost` → Cloud Run = cross-site). On persiste donc les jetons et
 * le client API attache un `Authorization: Bearer <idToken>` (voir
 * `@/shared/api/client`). Sur web, l'auth reste par cookie et ces fonctions ne
 * sont pas sollicitées.
 */

export interface AuthTokens {
  idToken: string;
  refreshToken: string;
}

const ID_TOKEN_KEY = 'kumy.auth.idToken';
const REFRESH_TOKEN_KEY = 'kumy.auth.refreshToken';

export async function getIdToken(): Promise<string | null> {
  const { value } = await Preferences.get({ key: ID_TOKEN_KEY });
  return value;
}

export async function getRefreshToken(): Promise<string | null> {
  const { value } = await Preferences.get({ key: REFRESH_TOKEN_KEY });
  return value;
}

export async function saveTokens(tokens: AuthTokens): Promise<void> {
  await Preferences.set({ key: ID_TOKEN_KEY, value: tokens.idToken });
  await Preferences.set({ key: REFRESH_TOKEN_KEY, value: tokens.refreshToken });
}

export async function clearTokens(): Promise<void> {
  await Preferences.remove({ key: ID_TOKEN_KEY });
  await Preferences.remove({ key: REFRESH_TOKEN_KEY });
}
