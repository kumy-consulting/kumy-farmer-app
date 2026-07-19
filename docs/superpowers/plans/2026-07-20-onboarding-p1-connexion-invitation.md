# Onboarding P1 — Connexion + Parcours invité (`full`) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Livrer, dans `kumy-farmer-app`, la connexion agriculteur (téléphone + PIN) et le parcours d'onboarding **invité** (code d'invitation → profil pré-rempli → PIN → activé), avec le champ `accessTier` posé côté backend.

**Architecture:** Le frontend porte les patterns éprouvés de `agripilot-pwa` (authStore cookie+Bearer, PinDisplay robuste WebView, phone +224) et les câble via le client API partagé `@/shared/api/client` et la convention **un `*.api.ts` par feature**. Le parcours invité réutilise **tel quel** le backend existant (`GET /auth/validate-token`, `POST /auth/activate`, `POST /auth/login`) ; seule addition backend : un champ `accessTier` sur le doc user.

**Tech Stack:** React 19, Vite 7, TypeScript strict, MUI 7, Zustand, Dexie, React Router 7, Capacitor 7 (front) ; NestJS + Firebase Admin (back `agripilot-backoffice-api`).

## Global Constraints

- **Convention API :** aucun agrégat global d'endpoints. Une feature = un `<feature>.api.ts` qui importe `apiClient` de `@/shared/api/client`. Valeurs verbatim spec.
- **Formatage :** Prettier single-quote, printWidth 120, trailing all, LF. `npm run lint` et `npm run format:check` doivent passer (hook pre-commit lance `npm run lint`).
- **Commits conventionnels :** header ≤ 100 car., lignes du corps ≤ 100 car. (commitlint via husky commit-msg). Types autorisés : `feat|fix|docs|style|refactor|perf|test|chore|revert|build|ci`.
- **E.164 :** téléphone Guinée = `+224` + 9 chiffres (ex. `+224622201362`). Mapping PIN→Firebase = `${phone.replace(/^\+/,'')}@agripilot.phone`.
- **accessTier :** `'full'` (invité/backoffice, rattaché partenaire) | `'simulation'` (auto-inscrit). Absence de champ = `'full'` (rétro-compat).
- **Pas de secret loggé** (PIN). Le PIN est le mot de passe Firebase, jamais écrit en Firestore.
- **Node :** Vite 7 préfère Node ≥ 20.19 ; le build passe sur 20.17 mais viser 20.19+/22.

---

## File Structure

**Backend (`agripilot-backoffice-api`) :**
- Modify: `src/common/types/` (nouvel `access-tier` union/enum), `src/farmers/farmers.service.ts` (pose `accessTier:'full'` à la création), `AuthUserDto` + réponses `login`/`me` (expose `accessTier`).

**Frontend (`kumy-farmer-app`) :**
- `src/features/Auth/phone.util.ts` — formatage + assemblage E.164 (centralisé).
- `src/features/Auth/components/{PhoneNumberInput,CountryCodeSelector,PinDisplay}.tsx` — portés PWA.
- `src/features/Auth/pages/{PhoneEntryPage,PinEntryPage}.tsx` — connexion.
- `src/features/Auth/auth.api.ts` — (existe) login/me/refresh/logout, + `validateToken`/`activate` déplacés ? → non : validate/activate vont dans `onboarding.api.ts`.
- `src/features/Onboarding/onboarding.api.ts` — `validateToken`, `activate`.
- `src/features/Onboarding/onboarding.store.ts` — wizard Zustand (invité).
- `src/features/Onboarding/components/{OnboardingStepper,OnboardingIcons}.tsx` — portés PWA.
- `src/features/Onboarding/pages/{InvitationCodePage,InvitedWelcomePage,PinPage,SuccessPage}.tsx`.
- `src/shared/stores/authStore.ts` — porté PWA (adapté).
- `src/shared/services/rememberedPhone.service.ts` + table Dexie `authPrefs`.
- `src/shared/components/ProtectedRoute.tsx` — porté PWA.
- `src/features/Home/WelcomeChoicePage.tsx` (ou `src/features/Onboarding/pages/`) — écran de choix.
- `src/shared/routes/index.tsx` — remplacer la route unique par la structure auth/onboarding/app.
- Test: `vitest` + `@testing-library/react` (nouvelle config, Task 2).

---

## Task 1: Backend — champ `accessTier` sur le compte

**Files:**
- Create: `agripilot-backoffice-api/src/common/types/access-tier.enum.ts`
- Modify: `agripilot-backoffice-api/src/farmers/farmers.service.ts` (méthode `create`, ~ligne 599 où le doc `users/{uid}` est écrit)
- Modify: `AuthUserDto` (grep `class AuthUserDto` — probable `src/auth/dto/auth-user.dto.ts`) + la construction de la réponse dans `auth.service.ts` (`login`/`buildAuthUser`/`me`)
- Test: `agripilot-backoffice-api/src/farmers/farmers.service.spec.ts` (ou le spec existant du service)

**Interfaces:**
- Produces: `AccessTier = 'full' | 'simulation'` ; `users/{uid}.accessTier` ; `AuthUserDto.accessTier?: AccessTier`.

- [ ] **Step 1: Écrire le test qui échoue** — la création d'un farmer pose `accessTier: 'full'`.

Ajouter dans le spec du service farmers (adapter le harness de mock Firestore existant du fichier) :

```ts
it("pose accessTier='full' sur le doc users à la création d'un farmer", async () => {
  const { usersDocData } = await createFarmerAndCapture(service, {
    phone: '+224622000001', firstName: 'Awa', lastName: 'Diallo',
  });
  expect(usersDocData.accessTier).toBe('full');
});
```

- [ ] **Step 2: Lancer le test → échec**

Run: `cd agripilot-backoffice-api && npx jest src/farmers/farmers.service.spec.ts -t accessTier`
Expected: FAIL (`accessTier` absent / undefined).

- [ ] **Step 3: Créer l'enum**

`src/common/types/access-tier.enum.ts` :
```ts
/** Niveau d'accès d'un agriculteur. `full` = rattaché (tous services) ;
 *  `simulation` = auto-inscrit (simulations uniquement). Absence = `full`. */
export type AccessTier = 'full' | 'simulation';

export const ACCESS_TIER = {
  FULL: 'full',
  SIMULATION: 'simulation',
} as const satisfies Record<string, AccessTier>;
```

- [ ] **Step 4: Poser le champ à la création du farmer**

Dans `farmers.service.ts`, à l'objet écrit dans `users/{uid}` (là où `role: UserRole.FARMER, status: UserStatus.PENDING` sont posés), ajouter :
```ts
accessTier: ACCESS_TIER.FULL, // farmer créé backoffice = plein droit
```
Importer `ACCESS_TIER` depuis `../common/types/access-tier.enum`.

- [ ] **Step 5: Exposer `accessTier` dans `AuthUserDto` + réponses auth**

Dans `AuthUserDto`, ajouter le champ (avec décorateur Swagger si le DTO en utilise) :
```ts
@ApiPropertyOptional({ enum: ['full', 'simulation'] })
accessTier?: AccessTier;
```
Dans `auth.service.ts`, là où l'`AuthUserDto` est construit à partir du doc users (login + `me`), propager :
```ts
accessTier: (userData.accessTier as AccessTier) ?? 'full',
```

- [ ] **Step 6: Lancer les tests → succès**

Run: `cd agripilot-backoffice-api && npx jest src/farmers/farmers.service.spec.ts -t accessTier && npm run build`
Expected: PASS + build OK.

- [ ] **Step 7: Commit**

```bash
cd agripilot-backoffice-api
git add src/common/types/access-tier.enum.ts src/farmers/farmers.service.ts src/auth
git commit -m "feat(auth): champ accessTier sur le compte (full par defaut, farmer backoffice=full)"
```

---

## Task 2: Frontend — harness de test (vitest)

**Files:**
- Modify: `kumy-farmer-app/package.json` (deps + scripts `test`)
- Create: `kumy-farmer-app/vitest.config.ts`, `kumy-farmer-app/vitest.setup.ts`
- Modify: `kumy-farmer-app/tsconfig.app.json` (types vitest si besoin)

**Interfaces:**
- Produces: commande `npm run test` (vitest jsdom + testing-library) pour les tâches suivantes.

- [ ] **Step 1: Installer les deps**

Run:
```bash
cd kumy-farmer-app
npm i -D vitest@^3 jsdom@^25 @testing-library/react@^16 @testing-library/jest-dom@^6 @testing-library/user-event@^14 @vitest/coverage-v8@^3
```

- [ ] **Step 2: Config vitest**

`vitest.config.ts` :
```ts
import path from 'node:path';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    css: false,
  },
});
```

`vitest.setup.ts` :
```ts
import '@testing-library/jest-dom/vitest';
```

- [ ] **Step 3: Script test**

Dans `package.json` scripts, ajouter :
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 4: Test de fumée + lint/format**

Créer `src/_smoke.test.ts` :
```ts
import { describe, expect, it } from 'vitest';

describe('smoke', () => {
  it('addition', () => {
    expect(1 + 1).toBe(2);
  });
});
```
Run: `npm run test && npm run lint && npm run format:check`
Expected: 1 test PASS, lint clean, format clean.

- [ ] **Step 5: Supprimer le smoke + commit**

```bash
rm src/_smoke.test.ts
git add package.json package-lock.json vitest.config.ts vitest.setup.ts
git commit -m "chore: harness de test vitest + testing-library"
```

---

## Task 3: Frontend — util téléphone + E.164 (TDD)

**Files:**
- Create: `kumy-farmer-app/src/features/Auth/phone.util.ts`
- Test: `kumy-farmer-app/src/features/Auth/phone.util.test.ts`

**Interfaces:**
- Produces: `formatPhoneNumber(local9: string): string` (`622201362`→`622 20 13 62`), `unformat(s): string`, `isValidGuineaNumber(local9): boolean` (9 chiffres), `toE164(local9, dialCode='224'): string` (`+224622201362`), `formatE164ForDisplay(e164): string` (`+224 622 20 13 62`).

- [ ] **Step 1: Test qui échoue**

`phone.util.test.ts` :
```ts
import { describe, expect, it } from 'vitest';

import { formatE164ForDisplay, isValidGuineaNumber, toE164, unformat } from './phone.util';

describe('phone.util', () => {
  it('valide 9 chiffres', () => {
    expect(isValidGuineaNumber('622201362')).toBe(true);
    expect(isValidGuineaNumber('62220')).toBe(false);
  });
  it('assemble E.164', () => {
    expect(toE164('622201362')).toBe('+224622201362');
    expect(toE164('622 20 13 62')).toBe('+224622201362');
  });
  it('affiche E.164 lisible', () => {
    expect(formatE164ForDisplay('+224622201362')).toBe('+224 622 20 13 62');
  });
  it('unformat garde les chiffres', () => {
    expect(unformat('622 20 13 62')).toBe('622201362');
  });
});
```

- [ ] **Step 2: Lancer → échec**

Run: `cd kumy-farmer-app && npm run test -- phone.util`
Expected: FAIL (module introuvable).

- [ ] **Step 3: Implémenter**

`phone.util.ts` :
```ts
/** Utilitaires téléphone Guinée (9 chiffres locaux, indicatif +224). */

export function unformat(value: string): string {
  return value.replace(/\D/g, '');
}

export function isValidGuineaNumber(local9: string): boolean {
  return unformat(local9).length === 9;
}

/** `622201362` → `622 20 13 62` (affichage saisie). */
export function formatPhoneNumber(value: string): string {
  const d = unformat(value).slice(0, 9);
  const parts = [d.slice(0, 3), d.slice(3, 5), d.slice(5, 7), d.slice(7, 9)];
  return parts.filter(Boolean).join(' ');
}

/** Assemble l'E.164 : indicatif + 9 chiffres locaux. */
export function toE164(local9: string, dialCode = '224'): string {
  return `+${unformat(dialCode)}${unformat(local9)}`;
}

/** `+224622201362` → `+224 622 20 13 62`. */
export function formatE164ForDisplay(e164: string): string {
  const m = /^\+(\d{1,4})(\d{9})$/.exec(e164);
  if (!m) return e164;
  const [, cc, n] = m;
  return `+${cc} ${n.slice(0, 3)} ${n.slice(3, 5)} ${n.slice(5, 7)} ${n.slice(7, 9)}`;
}
```

- [ ] **Step 4: Lancer → succès + lint/format**

Run: `npm run test -- phone.util && npm run lint && npm run format:check`
Expected: PASS, clean.

- [ ] **Step 5: Commit**

```bash
git add src/features/Auth/phone.util.ts src/features/Auth/phone.util.test.ts
git commit -m "feat(auth): util telephone + assemblage E.164 centralise"
```

---

## Task 4: Frontend — composants UI portés (phone input + PIN)

**Files:**
- Create: `kumy-farmer-app/src/features/Auth/components/CountryCodeSelector.tsx`
- Create: `kumy-farmer-app/src/features/Auth/components/PhoneNumberInput.tsx`
- Create: `kumy-farmer-app/src/features/Auth/components/PinDisplay.tsx`
- Create: `kumy-farmer-app/src/assets/icons/flag-guinea.svg` (copier depuis la PWA)

**Interfaces:**
- Produces: `<PhoneNumberInput value onChange onEnter? />` (valeur = local formaté), `<PinDisplay pin maxLength=6 onChange onFocusChange? />` (input caché + 6 cellules, robuste WebView).

- [ ] **Step 1: Copier l'asset drapeau**

```bash
cp /Users/thierno/Documents/Projects/kumy/agripilot-pwa/src/assets/icons/flag-guinea.svg \
   kumy-farmer-app/src/assets/icons/flag-guinea.svg
```

- [ ] **Step 2: Porter `PinDisplay.tsx`**

Copier `agripilot-pwa/src/features/Auth/PinEntry/components/PinDisplay.tsx` vers `src/features/Auth/components/PinDisplay.tsx`. Adapter : imports MUI/thème inchangés ; convertir les guillemets en single-quote ; ne PAS ré-implémenter (garder l'input caché overlay + 6 cellules — c'est la version robuste WebView). Vérifier qu'aucun import ne pointe vers un chemin PWA inexistant ici (retirer/adapter).

- [ ] **Step 3: Porter `CountryCodeSelector.tsx` + `PhoneNumberInput.tsx`**

Copier les deux depuis `agripilot-pwa/src/features/Auth/PhoneEntry/components/`. Adapter : l'import de l'asset drapeau → `@/assets/icons/flag-guinea.svg` ; `formatPhoneNumber` → importer depuis `@/features/Auth/phone.util` (au lieu de l'util PWA) ; single-quote.

- [ ] **Step 4: Test de rendu minimal**

`src/features/Auth/components/PinDisplay.test.tsx` :
```tsx
import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { PinDisplay } from './PinDisplay';

describe('PinDisplay', () => {
  it('rend 6 cellules', () => {
    const { container } = render(<PinDisplay pin="" onChange={vi.fn()} />);
    expect(container.querySelectorAll('[data-pin-cell]').length).toBe(6);
  });
});
```
> Si le composant porté n'expose pas `data-pin-cell`, ajouter l'attribut `data-pin-cell` sur l'élément de cellule (petite adaptation, non intrusive).

- [ ] **Step 5: Lancer test + build + lint/format**

Run: `npm run test -- PinDisplay && npm run build && npm run lint && npm run format:check`
Expected: PASS, build OK, clean.

- [ ] **Step 6: Commit**

```bash
git add src/features/Auth/components src/assets/icons/flag-guinea.svg
git commit -m "feat(auth): composants portes PinDisplay + PhoneNumberInput (+224)"
```

---

## Task 5: Frontend — persistance du numéro mémorisé (Dexie) + authStore

**Files:**
- Modify: `kumy-farmer-app/src/shared/db/database.ts` (table `authPrefs`)
- Create: `kumy-farmer-app/src/shared/services/rememberedPhone.service.ts`
- Modify: `kumy-farmer-app/src/features/Auth/auth.api.ts` (ajouter `refresh` retour type, déjà présent)
- Create: `kumy-farmer-app/src/shared/stores/authStore.ts`
- Test: `kumy-farmer-app/src/shared/services/rememberedPhone.service.test.ts`

**Interfaces:**
- Consumes: `authApi` (`@/features/Auth/auth.api`), `nativeAuth` (`@/shared/services/nativeAuth`), `AuthTokens`.
- Produces: `useAuthStore` (Zustand) exposant `{ user, isAuthenticated, isLoading, error, rememberedPhone, login(phone,pin), logout(), initialize(), forgetPhone(), clearError() }` ; `getRememberedPhone()/setRememberedPhone(e164)/clearRememberedPhone()`.

- [ ] **Step 1: Étendre le schéma Dexie**

Dans `database.ts`, passer à la version 2 avec la table `authPrefs` :
```ts
this.version(1).stores({});
this.version(2).stores({ authPrefs: 'id' }); // ligne unique id='current'
```
Ajouter le type + la table :
```ts
export interface AuthPrefRow {
  id: 'current';
  rememberedPhone: string | null;
}
// dans la classe : authPrefs!: Table<AuthPrefRow, string>;
```
> `Table` est déjà importé/réexporté dans ce fichier.

- [ ] **Step 2: Test rememberedPhone**

`rememberedPhone.service.test.ts` :
```ts
import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';

import { db } from '@/shared/db/database';

import { clearRememberedPhone, getRememberedPhone, setRememberedPhone } from './rememberedPhone.service';

describe('rememberedPhone', () => {
  beforeEach(async () => {
    await db.authPrefs.clear();
  });
  it('persiste puis relit', async () => {
    await setRememberedPhone('+224622201362');
    expect(await getRememberedPhone()).toBe('+224622201362');
  });
  it('efface', async () => {
    await setRememberedPhone('+224622201362');
    await clearRememberedPhone();
    expect(await getRememberedPhone()).toBeNull();
  });
});
```
Installer le mock IndexedDB : `npm i -D fake-indexeddb@^6`.

- [ ] **Step 3: Lancer → échec**

Run: `npm run test -- rememberedPhone`
Expected: FAIL (service absent).

- [ ] **Step 4: Implémenter le service**

`rememberedPhone.service.ts` :
```ts
import { db } from '@/shared/db/database';

const ROW_ID = 'current' as const;

export async function getRememberedPhone(): Promise<string | null> {
  const row = await db.authPrefs.get(ROW_ID);
  return row?.rememberedPhone ?? null;
}

export async function setRememberedPhone(phone: string): Promise<void> {
  await db.authPrefs.put({ id: ROW_ID, rememberedPhone: phone });
}

export async function clearRememberedPhone(): Promise<void> {
  await db.authPrefs.put({ id: ROW_ID, rememberedPhone: null });
}
```

- [ ] **Step 5: Porter `authStore.ts`**

Copier `agripilot-pwa/src/shared/stores/authStore.ts`. Adapter :
- imports → `@/features/Auth/auth.api` (`authApi`), `@/shared/services/nativeAuth` (`saveTokens`/`clearTokens`), `@/shared/services/rememberedPhone.service`.
- retirer l'intégration FCM (pas encore de service FCM dans cette app) : supprimer les appels `fcmService.*` (login/logout/initialize).
- `login(phone,pin)` → `authApi.login({ identifier: phone, password: pin })` ; en natif `saveTokens(res.tokens)` si présent ; `setRememberedPhone(phone)` ; set `user`/`isAuthenticated`.
- `initialize()` → charge `getRememberedPhone()` AVANT de baisser `isLoading`, puis `authApi.me()` (cookie/Bearer) ; succès→authed, échec→déconnecté.
- `logout()` → `authApi.logout()`, `clearTokens()`, `clearRememberedPhone()`, reset.
- single-quote, `UserProfile` = type de `@/features/Auth/auth.types` (aligner le champ `role` + ajouter `accessTier?`).

Mettre à jour `auth.types.ts` `UserProfile` pour inclure `accessTier?: 'full' | 'simulation'`.

- [ ] **Step 6: Lancer test + build + lint/format**

Run: `npm run test -- rememberedPhone && npm run build && npm run lint && npm run format:check`
Expected: PASS, build OK, clean.

- [ ] **Step 7: Commit**

```bash
git add src/shared/db/database.ts src/shared/services/rememberedPhone.service.ts \
        src/shared/services/rememberedPhone.service.test.ts src/shared/stores/authStore.ts \
        src/features/Auth/auth.types.ts package.json package-lock.json
git commit -m "feat(auth): authStore + numero memorise (Dexie authPrefs)"
```

---

## Task 6: Frontend — Connexion (écran de choix + téléphone + PIN + routage)

**Files:**
- Create: `kumy-farmer-app/src/features/Onboarding/pages/WelcomeChoicePage.tsx`
- Create: `kumy-farmer-app/src/features/Auth/pages/PhoneEntryPage.tsx`
- Create: `kumy-farmer-app/src/features/Auth/pages/PinEntryPage.tsx`
- Create: `kumy-farmer-app/src/shared/components/ProtectedRoute.tsx`
- Modify: `kumy-farmer-app/src/shared/routes/index.tsx`
- Modify: `kumy-farmer-app/src/App.tsx` (initialize au démarrage) + `src/main.tsx` (déjà initDatabase)

**Interfaces:**
- Consumes: `useAuthStore`, `phone.util`, `PhoneNumberInput`, `PinDisplay`.
- Produces: routes `/welcome`, `/auth/phone-entry`, `/auth/pin-entry`, app protégée `/`.

- [ ] **Step 1: `ProtectedRoute` (porté)**

Copier `agripilot-pwa/src/shared/components/ProtectedRoute.tsx`. Adapter : `ROUTES` → chemins littéraux de cette app ; destination non-authed = `/welcome` (au lieu de phone-entry direct) SAUF si `rememberedPhone` → `/auth/pin-entry`. Rendu :
```tsx
if (isLoading) return null;
if (!isAuthenticated) {
  const target = rememberedPhone ? '/auth/pin-entry' : '/welcome';
  return <Navigate to={target} replace />;
}
return <>{children}</>;
```

- [ ] **Step 2: `WelcomeChoicePage`**

Écran Kumy (logo + 3 boutons). Code :
```tsx
import { Box, Button, Stack, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';

export function WelcomeChoicePage() {
  const navigate = useNavigate();
  return (
    <Box sx={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', justifyContent: 'center', px: 3, gap: 4 }}>
      <Stack spacing={1.5} alignItems="center" textAlign="center">
        <Box component="img" src="/logo-kumy.svg" alt="Kumy" sx={{ width: 88 }} />
        <Typography variant="h4" fontWeight={700}>
          Bienvenue sur Kumy
        </Typography>
        <Typography color="text.secondary">Votre exploitation, dans votre poche.</Typography>
      </Stack>
      <Stack spacing={1.5}>
        <Button size="large" variant="contained" onClick={() => navigate('/auth/phone-entry')}>
          Connexion
        </Button>
        <Button size="large" variant="outlined" onClick={() => navigate('/onboarding/register/phone')}>
          Créer un compte
        </Button>
        <Button variant="text" onClick={() => navigate('/onboarding/invitation')}>
          J'ai une invitation
        </Button>
      </Stack>
    </Box>
  );
}
```
> Le bouton « Créer un compte » pointe vers une route du Plan 2 (Parcours B) — laisser le lien ; en attendant Plan 2, une route placeholder « Bientôt disponible » peut être ajoutée (voir Task 8 note).

- [ ] **Step 3: `PhoneEntryPage` (connexion)**

Porter la logique de `agripilot-pwa/src/features/Auth/PhoneEntry/PhoneEntryPage.tsx`, simplifiée : saisie via `PhoneNumberInput`, validation `isValidGuineaNumber`, sur « Continuer » → `navigate('/auth/pin-entry', { state: { phone: toE164(local) } })`. Utiliser `@/features/Auth/phone.util`.

- [ ] **Step 4: `PinEntryPage` (connexion)**

Porter `agripilot-pwa/src/features/Auth/PinEntry/PinEntryPage.tsx` : lit `phone` depuis `location.state` OU `rememberedPhone` (via store) ; affiche le rappel `formatE164ForDisplay(phone)` ; `PinDisplay` 6 chiffres ; sur submit → `useAuthStore().login(phone, pin)` puis `navigate('/', { replace: true })` ; erreur → reset le PIN. Bouton « Changer de numéro » → `forgetPhone()` + retour `/auth/phone-entry`.

- [ ] **Step 5: Router + App.initialize**

Remplacer `src/shared/routes/index.tsx` :
```tsx
import { createBrowserRouter, Navigate } from 'react-router-dom';

import { PhoneEntryPage } from '@/features/Auth/pages/PhoneEntryPage';
import { PinEntryPage } from '@/features/Auth/pages/PinEntryPage';
import { HomePage } from '@/features/Home/HomePage';
import { WelcomeChoicePage } from '@/features/Onboarding/pages/WelcomeChoicePage';
import { ProtectedRoute } from '@/shared/components/ProtectedRoute';

export const router = createBrowserRouter([
  { path: '/welcome', element: <WelcomeChoicePage /> },
  { path: '/auth/phone-entry', element: <PhoneEntryPage /> },
  { path: '/auth/pin-entry', element: <PinEntryPage /> },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <HomePage />
      </ProtectedRoute>
    ),
  },
  { path: '*', element: <Navigate to="/welcome" replace /> },
]);
```
Dans `src/App.tsx`, appeler `useAuthStore.getState().initialize()` une fois au montage (avant/pendant un petit splash), puis rendre `<RouterProvider router={router} />` :
```tsx
import { useEffect, useState } from 'react';
import { RouterProvider } from 'react-router-dom';

import { router } from '@/shared/routes';
import { useAuthStore } from '@/shared/stores/authStore';

const App = () => {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    void useAuthStore.getState().initialize().finally(() => setReady(true));
  }, []);
  if (!ready) return null;
  return <RouterProvider router={router} />;
};
export default App;
```

- [ ] **Step 6: Vérif build + lint + format + drive**

Run: `npm run build && npm run lint && npm run format:check`
Puis drive le flux (skill `verify` ou `npm run dev`) : `/welcome` → Connexion → téléphone (9 chiffres) → PIN → login. Vérifier qu'un mauvais PIN affiche l'erreur et reset, et qu'au reload le numéro mémorisé renvoie direct au PIN.
> Nécessite `VITE_API_URL` (dev proxy) vers le backoffice-api dev ; utiliser un compte farmer de test actif.

- [ ] **Step 7: Commit**

```bash
git add src/features/Auth/pages src/features/Onboarding/pages/WelcomeChoicePage.tsx \
        src/shared/components/ProtectedRoute.tsx src/shared/routes/index.tsx src/App.tsx
git commit -m "feat(auth): connexion agriculteur (choix + telephone + PIN + routage protege)"
```

---

## Task 7: Frontend — API + store d'onboarding (invité)

**Files:**
- Create: `kumy-farmer-app/src/features/Onboarding/onboarding.api.ts`
- Create: `kumy-farmer-app/src/features/Onboarding/onboarding.types.ts`
- Create: `kumy-farmer-app/src/features/Onboarding/onboarding.store.ts`
- Test: `kumy-farmer-app/src/features/Onboarding/onboarding.store.test.ts`

**Interfaces:**
- Consumes: `apiClient` (`@/shared/api/client`).
- Produces:
  - `onboardingApi.validateToken(token): Promise<ValidateTokenResponse>` (`GET /auth/validate-token?token=`),
  - `onboardingApi.activate({ token, password }): Promise<{ message: string }>` (`POST /auth/activate`).
  - `useOnboardingStore` : `{ token, userData, password, setToken, setUserData, setPassword, reset }`.
  - Types `ValidateTokenResponse { valid; email; phone; firstName; lastName; role }`, `OnboardingUserData`.

- [ ] **Step 1: Types + API**

`onboarding.types.ts` :
```ts
export interface ValidateTokenResponse {
  valid: boolean;
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  role: string;
}

export interface OnboardingUserData {
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  role: string;
}
```
`onboarding.api.ts` :
```ts
import { apiClient } from '@/shared/api/client';

import type { ValidateTokenResponse } from './onboarding.types';

export const onboardingApi = {
  async validateToken(token: string): Promise<ValidateTokenResponse> {
    const { data } = await apiClient.get<ValidateTokenResponse>(
      `/auth/validate-token?token=${encodeURIComponent(token)}`,
    );
    return data;
  },

  async activate(payload: { token: string; password: string }): Promise<{ message: string }> {
    const { data } = await apiClient.post<{ message: string }>('/auth/activate', payload);
    return data;
  },
};
```

- [ ] **Step 2: Test store qui échoue**

`onboarding.store.test.ts` :
```ts
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
```

- [ ] **Step 3: Lancer → échec**

Run: `npm run test -- onboarding.store`
Expected: FAIL.

- [ ] **Step 4: Implémenter le store**

`onboarding.store.ts` :
```ts
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
```

- [ ] **Step 5: Lancer → succès + lint/format**

Run: `npm run test -- onboarding.store && npm run lint && npm run format:check`
Expected: PASS, clean.

- [ ] **Step 6: Commit**

```bash
git add src/features/Onboarding/onboarding.api.ts src/features/Onboarding/onboarding.types.ts \
        src/features/Onboarding/onboarding.store.ts src/features/Onboarding/onboarding.store.test.ts
git commit -m "feat(onboarding): api validate/activate + store wizard (invite)"
```

---

## Task 8: Frontend — Parcours invité (code → welcome → PIN → succès)

**Files:**
- Create: `kumy-farmer-app/src/features/Onboarding/components/OnboardingStepper.tsx`
- Create: `kumy-farmer-app/src/features/Onboarding/components/OnboardingIcons.tsx`
- Create: `kumy-farmer-app/src/features/Onboarding/pages/InvitationCodePage.tsx`
- Create: `kumy-farmer-app/src/features/Onboarding/pages/InvitedWelcomePage.tsx`
- Create: `kumy-farmer-app/src/features/Onboarding/pages/OnboardingPinPage.tsx`
- Create: `kumy-farmer-app/src/features/Onboarding/pages/OnboardingSuccessPage.tsx`
- Modify: `kumy-farmer-app/src/shared/routes/index.tsx` (routes onboarding)

**Interfaces:**
- Consumes: `onboardingApi`, `useOnboardingStore`, `PinDisplay`, `OnboardingStepper`, `OnboardingIcons`.
- Produces: routes `/onboarding/invitation`, `/onboarding/welcome`, `/onboarding/pin`, `/onboarding/success`.

- [ ] **Step 1: Porter stepper + icônes**

Copier `agripilot-pwa/src/features/Onboarding/components/OnboardingStepper.tsx` et `OnboardingIcons.tsx`. Adapter : imports thème/couleurs → `@/theme/colors` ; single-quote. Le stepper prend `current: number` et `total = 2`.

- [ ] **Step 2: `InvitationCodePage`**

Saisie du code + validation. Sur « Continuer » :
```tsx
const data = await onboardingApi.validateToken(code.trim());
if (!data.valid) throw new Error('invalid');
setToken(code.trim());
setUserData({ email: data.email, phone: data.phone, firstName: data.firstName, lastName: data.lastName, role: data.role });
navigate('/onboarding/welcome');
```
Erreur → message « Code d'invitation invalide ou expiré ». (S'inspirer de `OnboardingGuard` PWA pour la gestion d'erreur, mais ici la saisie remplace le `?token=` URL.)

- [ ] **Step 3: `InvitedWelcomePage`**

Porter `agripilot-pwa/src/features/Onboarding/pages/WelcomePage.tsx`. Adapte : lit `userData` du store (`if (!userData) return <Navigate to="/onboarding/invitation" replace />`), `OnboardingStepper current={0}`, titre `Bienvenue {userData.firstName} !`, 4 `InfoRow` (Prénom/Nom/Email/Téléphone read-only), bouton « Continuer » → `navigate('/onboarding/pin')`.

- [ ] **Step 4: `OnboardingPinPage`**

`OnboardingStepper current={1}`, `PinDisplay` 6 chiffres, sur « Continuer » → `setPassword(pin)` + `navigate('/onboarding/success')`. Bouton retour → `/onboarding/welcome`.

- [ ] **Step 5: `OnboardingSuccessPage`**

Porter `agripilot-pwa/src/features/Onboarding/pages/SuccessPage.tsx`. L'appel activation part au montage :
```tsx
useEffect(() => {
  const run = async () => {
    if (!token || !password) return;
    try {
      await onboardingApi.activate({ token, password });
      setDone(true);
    } catch {
      setError('Échec de l’activation. Réessayez.');
    }
  };
  void run();
}, []);
```
Succès → check animé + « Compte activé ! » + bouton « Accéder à Kumy » → `reset()` puis `window.location.href = '/'` (relance `initialize()`). Erreur → « Réessayer » (reload).

- [ ] **Step 6: Routes onboarding**

Ajouter au router les 4 routes (`/onboarding/invitation|welcome|pin|success`) rendant les pages ci-dessus. Ajouter aussi une route placeholder pour `/onboarding/register/phone` (bouton « Créer un compte ») rendant un écran « Bientôt disponible » jusqu'au Plan 2.

- [ ] **Step 7: Vérif build + lint + format + drive**

Run: `npm run build && npm run lint && npm run format:check`
Drive : `/welcome` → « J'ai une invitation » → saisir un token d'activation VALIDE d'un farmer `pending` (généré au backoffice ou via `POST /farmers` + `send-activation`) → welcome pré-rempli → PIN → succès → l'app charge connectée. Vérifier qu'un code invalide affiche l'erreur.
> Pré-requis test : un farmer `pending` avec `activationToken` non expiré (48h). Le générer via le backoffice ou un script.

- [ ] **Step 8: Commit**

```bash
git add src/features/Onboarding/components src/features/Onboarding/pages src/shared/routes/index.tsx
git commit -m "feat(onboarding): parcours invite (code -> welcome -> PIN -> active)"
```

---

## Self-Review (couverture spec)

- Connexion téléphone+PIN → Tasks 5-6. ✅
- Écran de choix (connexion / créer / invitation) → Task 6 (`WelcomeChoicePage`). ✅
- Parcours A invité (code → validate-token → welcome → PIN → activate) → Tasks 7-8. ✅
- Champ `accessTier` (full par défaut, farmer backoffice=full) → Task 1. ✅
- Numéro mémorisé (UX 2ᵉ lancement) → Tasks 5-6. ✅
- Convention `.api.ts` par feature respectée (auth.api / onboarding.api) ; client partagé. ✅
- **Hors périmètre de CE plan (→ Plan 2)** : Parcours B (OTP `send/verify`, `onboard-farmer`, écrans téléphone/OTP/profil/adresse auto-inscription), gating fin `simulation`. Le bouton « Créer un compte » mène à un placeholder.
- **Note test** : le front n'avait pas de harness → Task 2 l'ajoute (vitest) ; les écrans UI sont vérifiés par build+lint+drive (le projet ne fait pas de test d'intégration UI, cohérent avec la PWA).

## Execution Handoff

Plan 2 (Parcours B — OTP + auto-inscription) sera rédigé séparément après livraison du Plan 1.
