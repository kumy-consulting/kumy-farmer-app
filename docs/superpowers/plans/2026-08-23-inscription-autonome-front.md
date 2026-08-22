# Inscription autonome — Partie parcours (kumy-farmer-app) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remplacer l'écran « Bientôt disponible » par un parcours de huit écrans qui permet à un agriculteur de créer son compte à partir de son seul numéro de téléphone, et n'exposer qu'un écran de bienvenue tant que personne ne l'a adopté.

**Architecture :** un nouveau dossier `src/features/Register/`, distinct de `Onboarding/`. Les deux parcours partagent des composants (`PhoneNumberInput`, `PinDisplay`, `OnboardingLayout`, `ProfileSelect`, `ErrorBanner`, `onboarding.styled`) mais **pas leur état** : l'un démarre d'un jeton d'invitation, l'autre d'un numéro. L'aiguillage selon le statut du compte est isolé dans une fonction pure (`register.routing.ts`), testée seule. Un store zustand porte l'état inter-écrans. Après connexion, `AppLayout` lit un hook partagé et rend soit l'application complète, soit l'écran de bienvenue seul.

**Tech Stack :** React 19, TypeScript strict, MUI 7, react-router-dom 7, zustand 5, dayjs, MUI X Date Pickers 9, Vitest 3 + Testing Library.

**Spec :** `docs/superpowers/specs/2026-08-23-creation-de-compte-design.md`

**Dépôt de travail :** `/Users/thierno/Documents/Projects/kumy/kumy-farmer-app`
**Plan jumeau :** `2026-08-23-inscription-autonome-api.md` — **à exécuter d'abord**. Ce plan consomme son contrat.

## Global Constraints

- Routes du parcours, exactement : `/inscription/telephone`, `/inscription/code`, `/inscription/deja-inscrit`, `/inscription/suspendu`, `/inscription/profil`, `/inscription/adresse`, `/inscription/code-confidentiel`, `/inscription/resultat`.
- Code SMS : **6 chiffres**. Renvoi : le bouton reste **inerte pendant 60 secondes**.
- Code confidentiel (PIN) : **6 chiffres**, saisi puis **confirmé**.
- Téléphone : format local **9 chiffres**, indicatif **+224**, converti en E.164 par `toE164` (`@/features/Auth/phone.util`).
- Cinq statuts possibles, aucun autre : `active`, `pending`, `inactive`, `suspended`, `absent`.
- Nouveau dossier `src/features/Register/` — **ne pas fusionner** avec `Onboarding/`.
- **Horloge figée** (`vi.useFakeTimers()`) dans tout test touchant à une expiration ou à un compte à rebours, avec `vi.useRealTimers()` dans le `afterEach`.
- Convention Kumy : **un** fichier `*.api.ts` par feature, consommant `@/shared/api/client`. Pas d'agrégat global d'endpoints.
- District et coordonnées GPS **non collectés**.
- Langue : documentation et commits en **français**, code en **anglais** ; textes d'interface en français. Commits conventionnels.
- Commandes de vérification : `npm test`, `npm run lint`, `npm run build`.

## Structure des fichiers

**Créés** — `src/features/Register/` :

| Fichier | Responsabilité |
|---|---|
| `register.types.ts` | Les types du contrat API et de l'état local |
| `register.routing.ts` | Les routes nommées + l'aiguillage pur selon le statut |
| `register.routing.test.ts` | Les cinq statuts mènent aux cinq écrans |
| `register.api.ts` | Les trois appels du parcours + les sous-préfectures |
| `register.store.ts` | L'état inter-écrans (zustand) |
| `register.store.test.ts` | Réinitialisation, pré-remplissage, cascade d'adresse |
| `useResendCountdown.ts` | Compte à rebours du renvoi de code |
| `useResendCountdown.test.ts` | Le bouton reste inerte pendant le délai |
| `pages/RegisterPhonePage.tsx` | `/inscription/telephone` |
| `pages/RegisterCodePage.tsx` | `/inscription/code` |
| `pages/RegisterCodePage.test.tsx` | Vérification, aiguillage, renvoi |
| `pages/RegisterKnownAccountPage.tsx` | `/inscription/deja-inscrit` |
| `pages/RegisterSuspendedPage.tsx` | `/inscription/suspendu` |
| `pages/RegisterProfilePage.tsx` | `/inscription/profil` |
| `pages/RegisterProfilePage.test.tsx` | Validations + pré-remplissage `pending` |
| `pages/RegisterAddressPage.tsx` | `/inscription/adresse` |
| `pages/RegisterAddressPage.test.tsx` | Cascade et remises à zéro |
| `pages/RegisterPinPage.tsx` | `/inscription/code-confidentiel` |
| `pages/RegisterResultPage.tsx` | `/inscription/resultat` |

**Créés** — ailleurs :

| Fichier | Responsabilité |
|---|---|
| `src/features/Home/compte.api.ts` | `GET /farmers/:id/account-state` |
| `src/features/Home/useCompteNouveau.ts` | L'état « compte pas encore adopté », source unique |
| `src/features/Home/useCompteNouveau.test.ts` | Domaine ⇒ app complète ; rien ⇒ bienvenue seule |
| `src/features/Home/BienvenuePage.tsx` | L'écran de bienvenue seul |

**Modifiés :**

| Fichier | Changement |
|---|---|
| `src/shared/routes/index.tsx` | Les huit routes ; `/onboarding/register/phone` redirige |
| `src/features/Onboarding/pages/WelcomeChoicePage.tsx` | « Créer un compte » pointe sur `/inscription/telephone` |
| `src/shared/components/AppLayout.tsx` | Bienvenue seule quand le compte n'est pas adopté |

**Supprimé :** `src/features/Onboarding/pages/RegisterComingSoonPage.tsx`

---

### Task 1 : Types et aiguillage

Le cœur de la fonctionnalité, et c'est du calcul pur : aucune requête, aucun état.

**Files:**
- Create: `src/features/Register/register.types.ts`
- Create: `src/features/Register/register.routing.ts`
- Test: `src/features/Register/register.routing.test.ts`

**Interfaces:**
- Consumes: rien.
- Produces:
  - `type StatutCompte = 'active' | 'pending' | 'inactive' | 'suspended' | 'absent'`
  - `interface ProfilPreRempli { firstName: string; lastName: string; birthDate: string | null }`
  - `interface CompteVerifie { statut: StatutCompte; profil?: ProfilPreRempli }`
  - `interface VerificationResultat { registrationToken: string; account: CompteVerifie }`
  - `interface DemandeCodeResultat { expiresIn: number; resendAfter: number }`
  - `interface CreationComptePayload { registrationToken: string; firstName: string; lastName: string; birthDate: string; regionId: string; prefectureId: string; sousPrefectureId: string; pin: string }`
  - `const ROUTES_INSCRIPTION` (clés : `telephone`, `code`, `dejaInscrit`, `suspendu`, `profil`, `adresse`, `pin`, `resultat`)
  - `function ecranApresVerification(statut: StatutCompte): string`

- [ ] **Step 1 : Écrire le test qui échoue**

Créer `src/features/Register/register.routing.test.ts` :

```ts
import { describe, expect, it } from 'vitest';

import { ecranApresVerification, ROUTES_INSCRIPTION } from './register.routing';

describe('ecranApresVerification', () => {
  it('envoie un compte en service vers « déjà inscrit » : il n’y a rien à créer', () => {
    expect(ecranApresVerification('active')).toBe('/inscription/deja-inscrit');
  });

  it('envoie un compte suspendu vers son écran dédié plutôt que vers la connexion', () => {
    expect(ecranApresVerification('suspended')).toBe('/inscription/suspendu');
  });

  it('envoie un compte préparé par le partenaire vers le profil', () => {
    expect(ecranApresVerification('pending')).toBe('/inscription/profil');
    expect(ecranApresVerification('inactive')).toBe('/inscription/profil');
  });

  it('envoie un numéro sans compte vers le profil', () => {
    expect(ecranApresVerification('absent')).toBe('/inscription/profil');
  });

  it('couvre les cinq statuts et rien d’autre', () => {
    const statuts = ['active', 'pending', 'inactive', 'suspended', 'absent'] as const;
    const cibles = new Set(statuts.map(ecranApresVerification));
    expect(cibles).toEqual(
      new Set([
        ROUTES_INSCRIPTION.dejaInscrit,
        ROUTES_INSCRIPTION.suspendu,
        ROUTES_INSCRIPTION.profil,
      ]),
    );
  });
});
```

- [ ] **Step 2 : Lancer le test pour vérifier qu'il échoue**

```bash
cd /Users/thierno/Documents/Projects/kumy/kumy-farmer-app
npx vitest run src/features/Register/register.routing.test.ts
```

Attendu : ÉCHEC — `Failed to resolve import "./register.routing"`.

- [ ] **Step 3 : Écrire les types**

Créer `src/features/Register/register.types.ts` :

```ts
/**
 * Le contrat de l'inscription autonome, côté app.
 *
 * Cinq statuts, pas six : ce que `POST /auth/phone/otp/verify` peut dire d'un
 * numéro une fois sa possession prouvée.
 */
export type StatutCompte = 'active' | 'pending' | 'inactive' | 'suspended' | 'absent';

/** Ce que le partenaire avait saisi ; l'agriculteur ne fait que le confirmer. */
export interface ProfilPreRempli {
  firstName: string;
  lastName: string;
  birthDate: string | null;
}

export interface CompteVerifie {
  statut: StatutCompte;
  /** Renseigné uniquement pour `pending` et `inactive`. */
  profil?: ProfilPreRempli;
}

export interface VerificationResultat {
  /** Preuve de possession du téléphone : court, à usage unique, 15 minutes. */
  registrationToken: string;
  account: CompteVerifie;
}

export interface DemandeCodeResultat {
  /** Validité du code, en secondes. */
  expiresIn: number;
  /** Délai avant qu'un nouvel envoi soit possible, en secondes. */
  resendAfter: number;
}

export interface CreationComptePayload {
  registrationToken: string;
  firstName: string;
  lastName: string;
  /** ISO `YYYY-MM-DD`. */
  birthDate: string;
  regionId: string;
  prefectureId: string;
  sousPrefectureId: string;
  /** Code confidentiel à 6 chiffres. */
  pin: string;
}

/** Le profil saisi ou confirmé à l'écran `/inscription/profil`. */
export interface ProfilInscription {
  firstName: string;
  lastName: string;
  birthDate: string | null;
}

/** L'adresse saisie à l'écran `/inscription/adresse`, noms compris pour l'affichage. */
export interface AdresseInscription {
  regionId: string | null;
  regionName: string | null;
  prefectureId: string | null;
  prefectureName: string | null;
  sousPrefectureId: string | null;
  sousPrefectureName: string | null;
}
```

- [ ] **Step 4 : Écrire l'aiguillage**

Créer `src/features/Register/register.routing.ts` :

```ts
import type { StatutCompte } from './register.types';

/** Les huit écrans du parcours, nommés une fois pour toutes. */
export const ROUTES_INSCRIPTION = {
  telephone: '/inscription/telephone',
  code: '/inscription/code',
  dejaInscrit: '/inscription/deja-inscrit',
  suspendu: '/inscription/suspendu',
  profil: '/inscription/profil',
  adresse: '/inscription/adresse',
  pin: '/inscription/code-confidentiel',
  resultat: '/inscription/resultat',
} as const;

/**
 * L'aiguillage après vérification du code — le cœur de la fonctionnalité.
 *
 * Un compte `active` sert déjà : il n'y a rien à créer, on invite à se
 * connecter. Un compte `suspended` mérite son propre écran : l'envoyer se
 * connecter le heurterait à un refus incompréhensible. `pending` et `inactive`
 * signifient qu'un partenaire a saisi les informations — l'agriculteur les
 * confirme. `absent` ouvre la saisie complète.
 *
 * Le `switch` est exhaustif sans branche par défaut : ajouter un statut au type
 * fera échouer la compilation ici, là où il faut décider.
 */
export function ecranApresVerification(statut: StatutCompte): string {
  switch (statut) {
    case 'active':
      return ROUTES_INSCRIPTION.dejaInscrit;
    case 'suspended':
      return ROUTES_INSCRIPTION.suspendu;
    case 'pending':
    case 'inactive':
    case 'absent':
      return ROUTES_INSCRIPTION.profil;
  }
}
```

- [ ] **Step 5 : Lancer le test pour vérifier qu'il passe**

```bash
npx vitest run src/features/Register/register.routing.test.ts
```

Attendu : SUCCÈS, 5 tests.

- [ ] **Step 6 : Commit**

```bash
git add src/features/Register/register.types.ts src/features/Register/register.routing.ts src/features/Register/register.routing.test.ts
git commit -m "feat(inscription): types et aiguillage selon le statut du compte"
```

---

### Task 2 : Appels réseau et état du parcours

**Files:**
- Create: `src/features/Register/register.api.ts`
- Create: `src/features/Register/register.store.ts`
- Test: `src/features/Register/register.store.test.ts`

**Interfaces:**
- Consumes: `apiClient` de `@/shared/api/client` ; `onboardingApi.getRegions/getPrefectures` et `ReferentialItem` de `@/features/Onboarding/onboarding.api` ; tous les types de Task 1.
- Produces:
  - `registerApi.demanderCode(phone: string): Promise<DemandeCodeResultat>`
  - `registerApi.verifierCode(phone: string, code: string): Promise<VerificationResultat>`
  - `registerApi.creerCompte(payload: CreationComptePayload): Promise<{ uid: string }>`
  - `registerApi.getSousPrefectures(prefectureId: string): Promise<ReferentialItem[]>`
  - `useRegisterStore` avec l'état `{ phone, registrationToken, statut, profil, adresse, pin }` et les actions `setPhone`, `setVerification`, `setProfil`, `setAdresse`, `setPin`, `reset`.

- [ ] **Step 1 : Écrire le test qui échoue**

Créer `src/features/Register/register.store.test.ts` :

```ts
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
```

- [ ] **Step 2 : Lancer le test pour vérifier qu'il échoue**

```bash
npx vitest run src/features/Register/register.store.test.ts
```

Attendu : ÉCHEC — `Failed to resolve import "./register.store"`.

- [ ] **Step 3 : Écrire le client d'API**

Créer `src/features/Register/register.api.ts` :

```ts
import type { ReferentialItem } from '@/features/Onboarding/onboarding.api';
import { apiClient } from '@/shared/api/client';

import type {
  CreationComptePayload,
  DemandeCodeResultat,
  VerificationResultat,
} from './register.types';

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface ReferentialRaw {
  id: string;
  name: string;
}

/**
 * API de la feature Register.
 *
 * Les régions et les préfectures sont lues via `onboardingApi` : c'est le même
 * référentiel public, il n'y a pas de raison d'en tenir deux lecteurs. Seules
 * les sous-préfectures manquaient — elles n'apparaissent que dans ce parcours.
 */
export const registerApi = {
  /** Déclenche l'envoi du code. Répond pareil pour un numéro connu ou inconnu. */
  async demanderCode(phone: string): Promise<DemandeCodeResultat> {
    const { data } = await apiClient.post<DemandeCodeResultat>('/auth/phone/otp', { phone });
    return data;
  },

  /** Vérifie le code et découvre, alors seulement, ce que porte le numéro. */
  async verifierCode(phone: string, code: string): Promise<VerificationResultat> {
    const { data } = await apiClient.post<VerificationResultat>('/auth/phone/otp/verify', {
      phone,
      code,
    });
    return data;
  },

  /** Crée le compte. Le jeton d'inscription tient lieu de preuve de possession. */
  async creerCompte(payload: CreationComptePayload): Promise<{ uid: string }> {
    const { data } = await apiClient.post<{ uid: string }>('/auth/phone/register', payload);
    return data;
  },

  async getSousPrefectures(prefectureId: string): Promise<ReferentialItem[]> {
    const { data } = await apiClient.get<PaginatedResponse<ReferentialRaw>>(
      `/sous-prefectures?prefectureId=${encodeURIComponent(prefectureId)}&limit=200`,
    );
    return data.data.map(({ id, name }) => ({ id, name }));
  },
};
```

- [ ] **Step 4 : Écrire le store**

Créer `src/features/Register/register.store.ts` :

```ts
import { create } from 'zustand';

import type {
  AdresseInscription,
  CompteVerifie,
  ProfilInscription,
  StatutCompte,
} from './register.types';

const profilVierge = (): ProfilInscription => ({
  firstName: '',
  lastName: '',
  birthDate: null,
});

const adresseVierge = (): AdresseInscription => ({
  regionId: null,
  regionName: null,
  prefectureId: null,
  prefectureName: null,
  sousPrefectureId: null,
  sousPrefectureName: null,
});

interface RegisterState {
  phone: string | null;
  registrationToken: string | null;
  statut: StatutCompte | null;
  profil: ProfilInscription;
  adresse: AdresseInscription;
  pin: string | null;
  setPhone: (phone: string) => void;
  setVerification: (token: string, account: CompteVerifie) => void;
  setProfil: (profil: ProfilInscription) => void;
  setAdresse: (partial: Partial<AdresseInscription>) => void;
  setPin: (pin: string) => void;
  reset: () => void;
}

/**
 * L'état du parcours d'inscription autonome.
 *
 * Volontairement séparé de `useOnboardingStore` : les deux parcours partagent
 * des composants mais pas leur machine à états. L'un démarre d'un jeton
 * d'invitation, l'autre d'un numéro ; les fusionner emmêlerait deux
 * cheminements sans rien économiser.
 */
export const useRegisterStore = create<RegisterState>((set) => ({
  phone: null,
  registrationToken: null,
  statut: null,
  profil: profilVierge(),
  adresse: adresseVierge(),
  pin: null,

  setPhone: (phone) => set({ phone }),

  setVerification: (registrationToken, account) =>
    set({
      registrationToken,
      statut: account.statut,
      // Le profil n'arrive que sur `pending` / `inactive`. Ailleurs, l'écran
      // s'ouvre vierge plutôt que de traîner une saisie précédente.
      profil: account.profil
        ? {
            firstName: account.profil.firstName,
            lastName: account.profil.lastName,
            birthDate: account.profil.birthDate,
          }
        : profilVierge(),
    }),

  setProfil: (profil) => set({ profil }),

  // La cascade vit ici, pas dans l'écran : changer de région invalide la
  // préfecture, changer de préfecture invalide la sous-préfecture. Laisser ce
  // ménage à l'appelant, c'est se garantir de l'oublier une fois sur deux.
  setAdresse: (partial) =>
    set((state) => {
      const adresse = { ...state.adresse, ...partial };
      if (partial.regionId !== undefined && partial.regionId !== state.adresse.regionId) {
        adresse.prefectureId = null;
        adresse.prefectureName = null;
        adresse.sousPrefectureId = null;
        adresse.sousPrefectureName = null;
      }
      if (
        partial.prefectureId !== undefined &&
        partial.prefectureId !== state.adresse.prefectureId
      ) {
        adresse.sousPrefectureId = null;
        adresse.sousPrefectureName = null;
      }
      return { adresse };
    }),

  setPin: (pin) => set({ pin }),

  reset: () =>
    set({
      phone: null,
      registrationToken: null,
      statut: null,
      profil: profilVierge(),
      adresse: adresseVierge(),
      pin: null,
    }),
}));
```

- [ ] **Step 5 : Lancer le test pour vérifier qu'il passe**

```bash
npx vitest run src/features/Register/register.store.test.ts
```

Attendu : SUCCÈS, 6 tests.

- [ ] **Step 6 : Commit**

```bash
git add src/features/Register/register.api.ts src/features/Register/register.store.ts src/features/Register/register.store.test.ts
git commit -m "feat(inscription): appels reseau et etat du parcours"
```

---

### Task 3 : Compte à rebours du renvoi

**Files:**
- Create: `src/features/Register/useResendCountdown.ts`
- Test: `src/features/Register/useResendCountdown.test.ts`

**Interfaces:**
- Consumes: rien.
- Produces: `function useResendCountdown(secondesInitiales: number): { secondesRestantes: number; relancer: (secondes: number) => void }`

- [ ] **Step 1 : Écrire le test qui échoue**

Créer `src/features/Register/useResendCountdown.test.ts` :

```ts
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useResendCountdown } from './useResendCountdown';

describe('useResendCountdown', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('démarre au délai fourni', () => {
    const { result } = renderHook(() => useResendCountdown(60));
    expect(result.current.secondesRestantes).toBe(60);
  });

  it('décompte une seconde à la fois', () => {
    const { result } = renderHook(() => useResendCountdown(3));

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current.secondesRestantes).toBe(2);

    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(result.current.secondesRestantes).toBe(0);
  });

  it('s’arrête à zéro et n’y descend pas', () => {
    const { result } = renderHook(() => useResendCountdown(1));

    act(() => {
      vi.advanceTimersByTime(10_000);
    });

    expect(result.current.secondesRestantes).toBe(0);
  });

  it('repart au délai demandé après un renvoi', () => {
    const { result } = renderHook(() => useResendCountdown(1));

    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(result.current.secondesRestantes).toBe(0);

    act(() => {
      result.current.relancer(45);
    });
    expect(result.current.secondesRestantes).toBe(45);
  });
});
```

- [ ] **Step 2 : Lancer le test pour vérifier qu'il échoue**

```bash
npx vitest run src/features/Register/useResendCountdown.test.ts
```

Attendu : ÉCHEC — `Failed to resolve import "./useResendCountdown"`.

- [ ] **Step 3 : Écrire le hook**

Créer `src/features/Register/useResendCountdown.ts` :

```ts
import { useEffect, useState } from 'react';

interface ResendCountdown {
  /** Secondes restantes avant qu'un nouvel envoi soit possible. `0` = renvoi ouvert. */
  secondesRestantes: number;
  /** Repart pour `secondes` — appelé après un envoi réussi. */
  relancer: (secondes: number) => void;
}

/**
 * Le délai entre deux demandes de code, tenu côté écran.
 *
 * L'API applique le même plafond, mais un bouton qui reste actif et échoue en
 * silence ne dit rien à l'agriculteur : le compte à rebours, lui, montre
 * l'attente. Un `setTimeout` par seconde plutôt qu'un `setInterval` — le
 * nettoyage à chaque pas rend le hook insensible aux remontages.
 */
export function useResendCountdown(secondesInitiales: number): ResendCountdown {
  const [secondesRestantes, setSecondesRestantes] = useState(secondesInitiales);

  useEffect(() => {
    if (secondesRestantes <= 0) return;
    const id = setTimeout(() => {
      setSecondesRestantes((restantes) => Math.max(0, restantes - 1));
    }, 1000);
    return () => clearTimeout(id);
  }, [secondesRestantes]);

  return { secondesRestantes, relancer: setSecondesRestantes };
}
```

- [ ] **Step 4 : Lancer le test pour vérifier qu'il passe**

```bash
npx vitest run src/features/Register/useResendCountdown.test.ts
```

Attendu : SUCCÈS, 4 tests.

- [ ] **Step 5 : Commit**

```bash
git add src/features/Register/useResendCountdown.ts src/features/Register/useResendCountdown.test.ts
git commit -m "feat(inscription): compte a rebours du renvoi de code"
```

---

### Task 4 : Écran du numéro de téléphone

**Files:**
- Create: `src/features/Register/pages/RegisterPhonePage.tsx`

**Interfaces:**
- Consumes: `registerApi.demanderCode` (Task 2), `useRegisterStore` (Task 2), `ROUTES_INSCRIPTION` (Task 1), `PhoneNumberInput`, `CountryCodeSelector`, `isValidGuineaNumber`, `toE164` (`@/features/Auth/…`), `OnboardingLayout`, `CollapseOnKeyboard`, `onboarding.styled`, `ErrorBanner`, `OnboardingStepper`, `BackButton`.
- Produces: `export const RegisterPhonePage: FunctionComponent`, monté sur `/inscription/telephone` (Task 9).

- [ ] **Step 1 : Écrire l'écran**

Créer `src/features/Register/pages/RegisterPhonePage.tsx` :

```tsx
import { useState, type FunctionComponent } from 'react';

import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import CallOutlinedIcon from '@mui/icons-material/CallOutlined';
import { Box, CircularProgress } from '@mui/material';
import { useNavigate } from 'react-router-dom';

import { CountryCodeSelector } from '@/features/Auth/components/CountryCodeSelector';
import { PhoneNumberInput } from '@/features/Auth/components/PhoneNumberInput';
import { isValidGuineaNumber, toE164 } from '@/features/Auth/phone.util';
import { ErrorBanner } from '@/features/Onboarding/components/ErrorBanner';
import {
  Eyebrow,
  FieldCapsule,
  HelpRow,
  Medallion,
  PrimaryButton,
  Subtitle,
  Title,
} from '@/features/Onboarding/onboarding.styled';
import { CollapseOnKeyboard, OnboardingLayout } from '@/features/Onboarding/OnboardingLayout';
import { registerApi } from '@/features/Register/register.api';
import { ROUTES_INSCRIPTION } from '@/features/Register/register.routing';
import { useRegisterStore } from '@/features/Register/register.store';
import { BackButton } from '@/shared/components/BackButton';

/**
 * Premier écran de l'inscription autonome : le numéro, et rien d'autre.
 *
 * « Suivant » déclenche l'envoi du code. La réponse est la même pour un numéro
 * connu et pour un numéro inconnu — c'est voulu, et c'est la mesure qui ferme
 * l'énumération des inscrits.
 */
export const RegisterPhonePage: FunctionComponent = () => {
  const navigate = useNavigate();
  const setPhone = useRegisterStore((s) => s.setPhone);
  const reset = useRegisterStore((s) => s.reset);

  const [numeroLocal, setNumeroLocal] = useState('');
  const [envoiEnCours, setEnvoiEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const estValide = isValidGuineaNumber(numeroLocal);

  const handleContinue = async () => {
    if (!estValide || envoiEnCours) return;
    const phone = toE164(numeroLocal);
    setEnvoiEnCours(true);
    setErreur(null);
    try {
      const { resendAfter } = await registerApi.demanderCode(phone);
      // Un numéro neuf repart d'un état propre : le parcours peut avoir été
      // abandonné en cours de route.
      reset();
      setPhone(phone);
      navigate(ROUTES_INSCRIPTION.code, { state: { resendAfter } });
    } catch {
      setErreur('Impossible d’envoyer le code. Vérifiez votre connexion et réessayez.');
    } finally {
      setEnvoiEnCours(false);
    }
  };

  return (
    <OnboardingLayout>
      <Box
        sx={{
          position: 'absolute',
          top: 'calc(env(safe-area-inset-top, 0px) + 14px)',
          left: 16,
          zIndex: 2,
        }}
      >
        <BackButton onClick={() => navigate('/welcome')} label="Retour à l’accueil" />
      </Box>

      <CollapseOnKeyboard>
        <Medallion>
          <CallOutlinedIcon />
        </Medallion>
      </CollapseOnKeyboard>

      <Eyebrow>Créer un compte</Eyebrow>

      <Title>Votre numéro de téléphone</Title>

      <Subtitle>Nous vous enverrons un code à 6 chiffres pour le vérifier</Subtitle>

      <FieldCapsule sx={{ mb: 1.75 }}>
        <CountryCodeSelector countryCode="+224" />
        <PhoneNumberInput value={numeroLocal} onChange={setNumeroLocal} placeholder="622 20 13 62" />
      </FieldCapsule>

      <CollapseOnKeyboard>
        <HelpRow sx={{ mb: 3.5 }}>
          Pays : <Box component="span">Guinée</Box> · Format local à 9 chiffres
        </HelpRow>
      </CollapseOnKeyboard>

      {erreur && <ErrorBanner mb={2}>{erreur}</ErrorBanner>}

      <PrimaryButton
        onClick={() => void handleContinue()}
        disabled={!estValide || envoiEnCours}
        endIcon={envoiEnCours ? undefined : <ArrowForwardRoundedIcon sx={{ fontSize: 20 }} />}
      >
        {envoiEnCours ? <CircularProgress size={22} color="inherit" /> : 'Suivant'}
      </PrimaryButton>
    </OnboardingLayout>
  );
};
```

- [ ] **Step 2 : Vérifier la compilation et le lint**

```bash
npx tsc -b --noEmit && npx eslint src/features/Register
```

Attendu : aucune erreur.

Note : si `tsc -b --noEmit` refuse l'option combinée, utiliser `npx tsc -b`.

- [ ] **Step 3 : Commit**

```bash
git add src/features/Register/pages/RegisterPhonePage.tsx
git commit -m "feat(inscription): ecran de saisie du numero de telephone"
```

---

### Task 5 : Écran du code et aiguillage

**Files:**
- Create: `src/features/Register/pages/RegisterCodePage.tsx`
- Test: `src/features/Register/pages/RegisterCodePage.test.tsx`

**Interfaces:**
- Consumes: `registerApi.demanderCode/verifierCode` (Task 2), `useRegisterStore` (Task 2), `ecranApresVerification`, `ROUTES_INSCRIPTION` (Task 1), `useResendCountdown` (Task 3), `PinDisplay`, `formatE164ForDisplay`, `OnboardingLayout`, `onboarding.styled`, `ErrorBanner`, `BackButton`.
- Produces: `export const RegisterCodePage: FunctionComponent`.

- [ ] **Step 1 : Écrire le test qui échoue**

Créer `src/features/Register/pages/RegisterCodePage.test.tsx` :

```tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { registerApi } from '@/features/Register/register.api';
import { useRegisterStore } from '@/features/Register/register.store';

import { RegisterCodePage } from './RegisterCodePage';

const navigateMock = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => navigateMock, useLocation: () => ({ state: { resendAfter: 60 } }) };
});

const renderPage = () =>
  render(
    <MemoryRouter>
      <RegisterCodePage />
    </MemoryRouter>,
  );

/** Le code se saisit dans l'input caché de `PinDisplay`, ciblé par son aria-label. */
const saisirCode = async (user: ReturnType<typeof userEvent.setup>, code: string) => {
  await user.type(screen.getByLabelText('Code de vérification'), code);
};

describe('RegisterCodePage', () => {
  beforeEach(() => {
    navigateMock.mockReset();
    useRegisterStore.getState().reset();
    useRegisterStore.getState().setPhone('+224622201362');
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('affiche le numéro vérifié pour que l’on puisse le relire', () => {
    renderPage();
    expect(screen.getByText('+224 622 20 13 62')).toBeInTheDocument();
  });

  it('envoie « active » vers l’écran « déjà inscrit »', async () => {
    const user = userEvent.setup();
    vi.spyOn(registerApi, 'verifierCode').mockResolvedValue({
      registrationToken: 'tok-1',
      account: { statut: 'active' },
    });

    renderPage();
    await saisirCode(user, '123456');
    await user.click(screen.getByRole('button', { name: 'Vérifier' }));

    await waitFor(() =>
      expect(navigateMock).toHaveBeenCalledWith('/inscription/deja-inscrit'),
    );
  });

  it('envoie « suspended » vers l’écran dédié', async () => {
    const user = userEvent.setup();
    vi.spyOn(registerApi, 'verifierCode').mockResolvedValue({
      registrationToken: 'tok-2',
      account: { statut: 'suspended' },
    });

    renderPage();
    await saisirCode(user, '123456');
    await user.click(screen.getByRole('button', { name: 'Vérifier' }));

    await waitFor(() => expect(navigateMock).toHaveBeenCalledWith('/inscription/suspendu'));
  });

  it('envoie « pending » vers le profil et retient le profil pré-rempli', async () => {
    const user = userEvent.setup();
    vi.spyOn(registerApi, 'verifierCode').mockResolvedValue({
      registrationToken: 'tok-3',
      account: {
        statut: 'pending',
        profil: { firstName: 'Awa', lastName: 'Diallo', birthDate: '1990-05-12' },
      },
    });

    renderPage();
    await saisirCode(user, '123456');
    await user.click(screen.getByRole('button', { name: 'Vérifier' }));

    await waitFor(() => expect(navigateMock).toHaveBeenCalledWith('/inscription/profil'));
    expect(useRegisterStore.getState().profil.firstName).toBe('Awa');
    expect(useRegisterStore.getState().registrationToken).toBe('tok-3');
  });

  it('envoie « absent » vers le profil, vierge', async () => {
    const user = userEvent.setup();
    vi.spyOn(registerApi, 'verifierCode').mockResolvedValue({
      registrationToken: 'tok-4',
      account: { statut: 'absent' },
    });

    renderPage();
    await saisirCode(user, '123456');
    await user.click(screen.getByRole('button', { name: 'Vérifier' }));

    await waitFor(() => expect(navigateMock).toHaveBeenCalledWith('/inscription/profil'));
    expect(useRegisterStore.getState().profil.firstName).toBe('');
  });

  it('affiche un message et vide le champ quand le code est refusé', async () => {
    const user = userEvent.setup();
    vi.spyOn(registerApi, 'verifierCode').mockRejectedValue(new Error('nope'));

    renderPage();
    await saisirCode(user, '000000');
    await user.click(screen.getByRole('button', { name: 'Vérifier' }));

    expect(await screen.findByText(/code est incorrect ou a expiré/i)).toBeInTheDocument();
    expect(navigateMock).not.toHaveBeenCalled();
  });

  it('laisse le renvoi inerte tant que le délai court, puis l’ouvre', async () => {
    vi.useFakeTimers();
    renderPage();

    const bouton = screen.getByRole<HTMLButtonElement>('button', { name: /Renvoyer/ });
    expect(bouton.disabled).toBe(true);
    expect(bouton).toHaveTextContent('60');

    await vi.advanceTimersByTimeAsync(60_000);

    expect(
      screen.getByRole<HTMLButtonElement>('button', { name: /Renvoyer/ }).disabled,
    ).toBe(false);
  });
});
```

- [ ] **Step 2 : Lancer le test pour vérifier qu'il échoue**

```bash
npx vitest run src/features/Register/pages/RegisterCodePage.test.tsx
```

Attendu : ÉCHEC — `Failed to resolve import "./RegisterCodePage"`.

- [ ] **Step 3 : Écrire l'écran**

Créer `src/features/Register/pages/RegisterCodePage.tsx` :

```tsx
import { useState, type FunctionComponent } from 'react';

import SmsOutlinedIcon from '@mui/icons-material/SmsOutlined';
import { Box, CircularProgress } from '@mui/material';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';

import { PinDisplay } from '@/features/Auth/components/PinDisplay';
import { formatE164ForDisplay } from '@/features/Auth/phone.util';
import { ErrorBanner } from '@/features/Onboarding/components/ErrorBanner';
import { OnboardingStepper } from '@/features/Onboarding/components/OnboardingStepper';
import {
  Eyebrow,
  Medallion,
  PhoneChip,
  PrimaryButton,
  Subtitle,
  TextLink,
  Title,
} from '@/features/Onboarding/onboarding.styled';
import { CollapseOnKeyboard, OnboardingLayout } from '@/features/Onboarding/OnboardingLayout';
import { registerApi } from '@/features/Register/register.api';
import { ecranApresVerification, ROUTES_INSCRIPTION } from '@/features/Register/register.routing';
import { useRegisterStore } from '@/features/Register/register.store';
import { useResendCountdown } from '@/features/Register/useResendCountdown';
import { BackButton } from '@/shared/components/BackButton';

const DELAI_RENVOI_PAR_DEFAUT = 60;

/**
 * Le code reçu par SMS. C'est ici que le parcours bifurque : la vérification
 * rapporte le statut du compte, et l'aiguillage — une fonction pure, testée à
 * part — décide de l'écran suivant.
 */
export const RegisterCodePage: FunctionComponent = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const phone = useRegisterStore((s) => s.phone);
  const setVerification = useRegisterStore((s) => s.setVerification);

  const delaiInitial =
    (location.state as { resendAfter?: number } | null)?.resendAfter ?? DELAI_RENVOI_PAR_DEFAUT;

  const [code, setCode] = useState('');
  const [clavierOuvert, setClavierOuvert] = useState(false);
  const [verificationEnCours, setVerificationEnCours] = useState(false);
  const [renvoiEnCours, setRenvoiEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const { secondesRestantes, relancer } = useResendCountdown(delaiInitial);

  // Arrivée directe sur l'URL, sans numéro en mémoire : rien à vérifier.
  if (!phone) return <Navigate to={ROUTES_INSCRIPTION.telephone} replace />;

  const handleVerifier = async () => {
    if (code.length !== 6 || verificationEnCours) return;
    setVerificationEnCours(true);
    setErreur(null);
    try {
      const { registrationToken, account } = await registerApi.verifierCode(phone, code);
      setVerification(registrationToken, account);
      navigate(ecranApresVerification(account.statut));
    } catch {
      setCode('');
      setErreur('Ce code est incorrect ou a expiré. Vérifiez-le, ou demandez-en un nouveau.');
    } finally {
      setVerificationEnCours(false);
    }
  };

  const handleRenvoyer = async () => {
    if (secondesRestantes > 0 || renvoiEnCours) return;
    setRenvoiEnCours(true);
    setErreur(null);
    try {
      const { resendAfter } = await registerApi.demanderCode(phone);
      relancer(resendAfter);
      setCode('');
    } catch {
      setErreur('Impossible de renvoyer le code. Vérifiez votre connexion.');
    } finally {
      setRenvoiEnCours(false);
    }
  };

  return (
    <OnboardingLayout keyboardOpen={clavierOuvert}>
      <Box
        sx={{
          position: 'absolute',
          top: 'calc(env(safe-area-inset-top, 0px) + 14px)',
          left: 16,
          zIndex: 2,
        }}
      >
        <BackButton
          onClick={() => navigate(ROUTES_INSCRIPTION.telephone)}
          label="Changer de numéro"
        />
      </Box>

      <OnboardingStepper current={0} total={4} />

      <CollapseOnKeyboard>
        <Medallion>
          <SmsOutlinedIcon />
        </Medallion>
      </CollapseOnKeyboard>

      <Eyebrow>Vérification</Eyebrow>

      <Title>Entrez le code reçu</Title>

      <Subtitle sx={{ mb: 1.5 }}>Un code à 6 chiffres vient de vous être envoyé par SMS</Subtitle>

      <PhoneChip sx={{ mb: 3 }}>{formatE164ForDisplay(phone)}</PhoneChip>

      <PinDisplay
        pin={code}
        maxLength={6}
        onChange={(valeur) => {
          setCode(valeur);
          if (erreur) setErreur(null);
        }}
        onFocusChange={setClavierOuvert}
        inputLabel="Code de vérification"
      />

      {erreur && <ErrorBanner mb={2}>{erreur}</ErrorBanner>}

      <PrimaryButton
        onClick={() => void handleVerifier()}
        disabled={code.length !== 6 || verificationEnCours}
        sx={{ mt: 1 }}
      >
        {verificationEnCours ? <CircularProgress size={22} color="inherit" /> : 'Vérifier'}
      </PrimaryButton>

      {/* Le compte à rebours porte l'attente : un bouton qui reste actif et
          échoue en silence ne dirait rien de l'intervalle imposé. */}
      <TextLink
        onClick={() => void handleRenvoyer()}
        disabled={secondesRestantes > 0 || renvoiEnCours}
        sx={{ mt: 1.5, color: 'rgba(55,75,70,0.62)' }}
      >
        {secondesRestantes > 0 ? `Renvoyer le code (${secondesRestantes} s)` : 'Renvoyer le code'}
      </TextLink>
    </OnboardingLayout>
  );
};
```

- [ ] **Step 4 : Ouvrir `PinDisplay` à un libellé personnalisé**

Le test cible l'input par son `aria-label`. `PinDisplay` en fixe un en dur ; il faut pouvoir le nommer, sans changer son comportement par défaut.

Dans `src/features/Auth/components/PinDisplay.tsx`, ajouter à l'interface :

```ts
  /**
   * Libellé accessible de l'input caché. Par défaut « Code PIN » : le composant
   * sert aussi à saisir le code SMS, qui n'est pas un code PIN.
   */
  inputLabel?: string;
```

Puis, dans la signature du composant, ajouter `inputLabel = 'Code PIN'` aux props déstructurées, et remplacer l'`aria-label` en dur de l'input caché par `aria-label={inputLabel}`.

Vérifier au préalable la valeur actuelle :

```bash
grep -n "aria-label" src/features/Auth/components/PinDisplay.tsx
```

Si le libellé actuel n'est pas `Code PIN`, conserver la valeur existante comme défaut afin de ne casser aucun test en place (`src/features/Auth/components/PinDisplay.test.tsx`).

- [ ] **Step 5 : Lancer les tests pour vérifier qu'ils passent**

```bash
npx vitest run src/features/Register src/features/Auth
```

Attendu : SUCCÈS — les 7 tests de `RegisterCodePage` et les tests existants de `PinDisplay`.

- [ ] **Step 6 : Commit**

```bash
git add src/features/Register/pages/RegisterCodePage.tsx src/features/Register/pages/RegisterCodePage.test.tsx src/features/Auth/components/PinDisplay.tsx
git commit -m "feat(inscription): ecran du code SMS et aiguillage selon le statut"
```

---

### Task 6 : Les deux impasses — déjà inscrit, suspendu

Deux écrans qui ne créent rien : ils expliquent, et orientent.

**Files:**
- Create: `src/features/Register/pages/RegisterKnownAccountPage.tsx`
- Create: `src/features/Register/pages/RegisterSuspendedPage.tsx`

**Interfaces:**
- Consumes: `useRegisterStore` (Task 2), `ROUTES_INSCRIPTION` (Task 1), `formatE164ForDisplay`, `onboarding.styled`, `OnboardingLayout`.
- Produces: `export const RegisterKnownAccountPage: FunctionComponent`, `export const RegisterSuspendedPage: FunctionComponent`.

- [ ] **Step 1 : Écrire l'écran « déjà inscrit »**

Créer `src/features/Register/pages/RegisterKnownAccountPage.tsx` :

```tsx
import type { FunctionComponent } from 'react';

import HowToRegRoundedIcon from '@mui/icons-material/HowToRegRounded';
import { Navigate, useNavigate } from 'react-router-dom';

import { formatE164ForDisplay } from '@/features/Auth/phone.util';
import {
  Eyebrow,
  Medallion,
  PhoneChip,
  PrimaryButton,
  Subtitle,
  TextLink,
  Title,
} from '@/features/Onboarding/onboarding.styled';
import { OnboardingLayout } from '@/features/Onboarding/OnboardingLayout';
import { ROUTES_INSCRIPTION } from '@/features/Register/register.routing';
import { useRegisterStore } from '@/features/Register/register.store';

/**
 * Le numéro porte déjà un compte en service. Rien à créer : on le dit, et on
 * ouvre la porte de la connexion avec le numéro déjà vérifié — l'agriculteur
 * n'a plus qu'à taper son code.
 */
export const RegisterKnownAccountPage: FunctionComponent = () => {
  const navigate = useNavigate();
  const phone = useRegisterStore((s) => s.phone);
  const reset = useRegisterStore((s) => s.reset);

  if (!phone) return <Navigate to={ROUTES_INSCRIPTION.telephone} replace />;

  const handleConnexion = () => {
    reset();
    navigate('/auth/pin-entry', { state: { phone } });
  };

  return (
    <OnboardingLayout>
      <Medallion>
        <HowToRegRoundedIcon />
      </Medallion>

      <Eyebrow>Compte existant</Eyebrow>

      <Title>Vous avez déjà un compte</Title>

      <Subtitle sx={{ mb: 2 }}>
        Ce numéro est déjà rattaché à un compte Kumy. Connectez-vous avec votre code confidentiel.
      </Subtitle>

      <PhoneChip sx={{ mb: 3.5 }}>{formatE164ForDisplay(phone)}</PhoneChip>

      <PrimaryButton onClick={handleConnexion}>Me connecter</PrimaryButton>

      <TextLink
        onClick={() => {
          reset();
          navigate(ROUTES_INSCRIPTION.telephone);
        }}
        sx={{ mt: 1.5, color: 'rgba(55,75,70,0.62)' }}
      >
        Utiliser un autre numéro
      </TextLink>
    </OnboardingLayout>
  );
};
```

- [ ] **Step 2 : Écrire l'écran « suspendu »**

Créer `src/features/Register/pages/RegisterSuspendedPage.tsx` :

```tsx
import type { FunctionComponent } from 'react';

import LockPersonRoundedIcon from '@mui/icons-material/LockPersonRounded';
import { Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';

import {
  Eyebrow,
  HelpRow,
  Medallion,
  OutlinedButton,
  Subtitle,
  Title,
} from '@/features/Onboarding/onboarding.styled';
import { OnboardingLayout } from '@/features/Onboarding/OnboardingLayout';
import { ROUTES_INSCRIPTION } from '@/features/Register/register.routing';
import { useRegisterStore } from '@/features/Register/register.store';

/** Le numéro du support, affiché en clair : c'est la seule issue depuis cet écran. */
const SUPPORT_TELEPHONE = '+224 622 20 13 62';

/**
 * Un compte suspendu mérite son propre écran. L'envoyer se connecter le
 * heurterait à un refus qu'il ne saurait pas interpréter, et l'inviter à
 * s'inscrire lui promettrait un compte qu'il ne pourra pas obtenir.
 */
export const RegisterSuspendedPage: FunctionComponent = () => {
  const navigate = useNavigate();
  const reset = useRegisterStore((s) => s.reset);

  return (
    <OnboardingLayout>
      <Medallion>
        <LockPersonRoundedIcon />
      </Medallion>

      <Eyebrow>Compte suspendu</Eyebrow>

      <Title>Ce compte est suspendu</Title>

      <Subtitle sx={{ mb: 2.5 }}>
        L’accès à ce numéro a été suspendu. Seul le support Kumy peut le rétablir — l’inscription ne
        le remplacera pas.
      </Subtitle>

      <HelpRow sx={{ mb: 3.5 }}>
        Support : <Box component="span">{SUPPORT_TELEPHONE}</Box>
      </HelpRow>

      <OutlinedButton
        onClick={() => {
          reset();
          navigate(ROUTES_INSCRIPTION.telephone);
        }}
      >
        Utiliser un autre numéro
      </OutlinedButton>
    </OnboardingLayout>
  );
};
```

- [ ] **Step 3 : Vérifier la compilation et le lint**

```bash
npx tsc -b && npx eslint src/features/Register
```

Attendu : aucune erreur.

- [ ] **Step 4 : Commit**

```bash
git add src/features/Register/pages/RegisterKnownAccountPage.tsx src/features/Register/pages/RegisterSuspendedPage.tsx
git commit -m "feat(inscription): ecrans compte existant et compte suspendu"
```

---

### Task 7 : Écran du profil

**Files:**
- Create: `src/features/Register/pages/RegisterProfilePage.tsx`
- Test: `src/features/Register/pages/RegisterProfilePage.test.tsx`

**Interfaces:**
- Consumes: `useRegisterStore` (Task 2), `ROUTES_INSCRIPTION` (Task 1), `OnboardingLayout`, `OnboardingStepper`, `onboarding.styled`, `BackButton`, `MobileDatePicker`, `dayjs`.
- Produces: `export const RegisterProfilePage: FunctionComponent`.

- [ ] **Step 1 : Écrire le test qui échoue**

Créer `src/features/Register/pages/RegisterProfilePage.test.tsx` :

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useRegisterStore } from '@/features/Register/register.store';

import { RegisterProfilePage } from './RegisterProfilePage';

const navigateMock = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => navigateMock };
});

const renderPage = () =>
  render(
    <MemoryRouter>
      <RegisterProfilePage />
    </MemoryRouter>,
  );

describe('RegisterProfilePage', () => {
  beforeEach(() => {
    navigateMock.mockReset();
    useRegisterStore.getState().reset();
    useRegisterStore.getState().setPhone('+224622201362');
    useRegisterStore.getState().setVerification('tok-1', { statut: 'absent' });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('ouvre un formulaire vierge en branche « absent »', () => {
    renderPage();

    expect(screen.getByLabelText('Prénom')).toHaveValue('');
    expect(screen.getByLabelText('Nom')).toHaveValue('');
  });

  it('pré-remplit prénom, nom et date en branche « pending »', () => {
    useRegisterStore.getState().setVerification('tok-2', {
      statut: 'pending',
      profil: { firstName: 'Awa', lastName: 'Diallo', birthDate: '1990-05-12' },
    });

    renderPage();

    expect(screen.getByLabelText('Prénom')).toHaveValue('Awa');
    expect(screen.getByLabelText('Nom')).toHaveValue('Diallo');
    expect(screen.getByLabelText('Date de naissance')).toHaveValue('12/05/1990');
  });

  it('garde le bouton inerte tant que prénom, nom et date ne sont pas tous renseignés', async () => {
    const user = userEvent.setup();
    renderPage();

    const bouton = () => screen.getByRole<HTMLButtonElement>('button', { name: 'Continuer' });
    expect(bouton().disabled).toBe(true);

    await user.type(screen.getByLabelText('Prénom'), 'Awa');
    expect(bouton().disabled).toBe(true);

    await user.type(screen.getByLabelText('Nom'), 'Diallo');
    expect(bouton().disabled).toBe(true);

    await user.type(screen.getByLabelText('Date de naissance'), '12/05/1990');
    expect(bouton().disabled).toBe(false);
  });

  it('refuse un prénom d’une seule lettre', async () => {
    const user = userEvent.setup();
    useRegisterStore.getState().setVerification('tok-3', {
      statut: 'pending',
      profil: { firstName: 'A', lastName: 'Diallo', birthDate: '1990-05-12' },
    });

    renderPage();

    expect(screen.getByRole<HTMLButtonElement>('button', { name: 'Continuer' }).disabled).toBe(
      true,
    );

    await user.type(screen.getByLabelText('Prénom'), 'wa');
    expect(screen.getByRole<HTMLButtonElement>('button', { name: 'Continuer' }).disabled).toBe(
      false,
    );
  });

  it('enregistre le profil et passe à l’adresse', async () => {
    const user = userEvent.setup();
    useRegisterStore.getState().setVerification('tok-4', {
      statut: 'pending',
      profil: { firstName: 'Awa', lastName: 'Diallo', birthDate: '1990-05-12' },
    });

    renderPage();
    await user.click(screen.getByRole('button', { name: 'Continuer' }));

    expect(useRegisterStore.getState().profil).toEqual({
      firstName: 'Awa',
      lastName: 'Diallo',
      birthDate: '1990-05-12',
    });
    expect(navigateMock).toHaveBeenCalledWith('/inscription/adresse');
  });

  it('renvoie au téléphone quand aucun jeton d’inscription n’est en mémoire', () => {
    useRegisterStore.getState().reset();
    renderPage();

    expect(screen.queryByLabelText('Prénom')).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2 : Lancer le test pour vérifier qu'il échoue**

```bash
npx vitest run src/features/Register/pages/RegisterProfilePage.test.tsx
```

Attendu : ÉCHEC — `Failed to resolve import "./RegisterProfilePage"`.

- [ ] **Step 3 : Écrire l'écran**

Créer `src/features/Register/pages/RegisterProfilePage.tsx` :

```tsx
import { useState, type FunctionComponent } from 'react';

import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined';
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded';
import { Box, InputAdornment, Stack, TextField } from '@mui/material';
import { MobileDatePicker } from '@mui/x-date-pickers/MobileDatePicker';
import dayjs, { type Dayjs } from 'dayjs';
import { Navigate, useNavigate } from 'react-router-dom';

import { OnboardingStepper } from '@/features/Onboarding/components/OnboardingStepper';
import {
  Eyebrow,
  Medallion,
  PrimaryButton,
  Subtitle,
  Title,
} from '@/features/Onboarding/onboarding.styled';
import { CollapseOnKeyboard, OnboardingLayout } from '@/features/Onboarding/OnboardingLayout';
import { ROUTES_INSCRIPTION } from '@/features/Register/register.routing';
import { useRegisterStore } from '@/features/Register/register.store';
import { BackButton } from '@/shared/components/BackButton';

const AGE_MIN = 15;
const AGE_MAX = 100;
const LONGUEUR_NOM_MIN = 2;

/** Habillage capsule commun aux deux champs texte, aligné sur `ProfileSelect`. */
const champSx = {
  width: '100%',
  maxWidth: 395,
  '& .MuiInputLabel-root': {
    fontFamily: "'Ubuntu', sans-serif",
    fontWeight: 500,
    color: 'rgba(55,75,70,0.62)',
    '&.Mui-focused': { color: '#016557' },
  },
  '& .MuiOutlinedInput-root': {
    borderRadius: '18px',
    fontFamily: "'Ubuntu', sans-serif",
    fontSize: 15,
    fontWeight: 600,
    color: 'rgba(20,40,35,0.92)',
    background: 'linear-gradient(135deg, rgba(255,255,255,0.96) 0%, rgba(250,251,247,0.96) 100%)',
    boxShadow: '0 6px 20px rgba(1,134,117,0.08), 0 1px 0 rgba(255,255,255,0.85) inset',
    '& fieldset': { borderColor: 'rgba(55,75,70,0.08)', borderWidth: 1 },
    '&:hover fieldset': { borderColor: 'rgba(1,134,117,0.28)' },
    '&.Mui-focused fieldset': { borderColor: 'rgba(1,134,117,0.38)', borderWidth: 1 },
  },
} as const;

const datePickerSlotProps = {
  textField: {
    fullWidth: true,
    label: 'Date de naissance',
    InputLabelProps: { shrink: true },
    InputProps: {
      startAdornment: (
        <InputAdornment position="start" sx={{ ml: 0.25, mr: 0.5 }}>
          <CalendarMonthRoundedIcon sx={{ fontSize: 21, color: '#016557' }} />
        </InputAdornment>
      ),
    },
    sx: {
      ...champSx,
      '& .MuiPickersInputBase-root': {
        borderRadius: '18px',
        paddingLeft: '16px',
        fontFamily: "'Ubuntu', sans-serif",
        fontSize: 15,
        fontWeight: 600,
        color: 'rgba(20,40,35,0.92)',
        background:
          'linear-gradient(135deg, rgba(255,255,255,0.96) 0%, rgba(250,251,247,0.96) 100%)',
        boxShadow: '0 6px 20px rgba(1,134,117,0.08), 0 1px 0 rgba(255,255,255,0.85) inset',
      },
      '& .MuiPickersSectionList-root': { padding: '14px 0' },
      '& .MuiPickersOutlinedInput-notchedOutline': {
        borderColor: 'rgba(55,75,70,0.08)',
        borderWidth: 1,
      },
      '& .MuiInputAdornment-positionEnd': { display: 'none' },
    },
  },
} as const;

/**
 * Prénom, nom, date de naissance.
 *
 * En branche `pending` / `inactive`, les champs arrivent pré-remplis : le
 * partenaire a saisi ces informations, l'agriculteur les confirme ou les
 * corrige. En branche `absent`, tout est vierge.
 */
export const RegisterProfilePage: FunctionComponent = () => {
  const navigate = useNavigate();
  const registrationToken = useRegisterStore((s) => s.registrationToken);
  const profilMemorise = useRegisterStore((s) => s.profil);
  const setProfil = useRegisterStore((s) => s.setProfil);

  const [firstName, setFirstName] = useState(profilMemorise.firstName);
  const [lastName, setLastName] = useState(profilMemorise.lastName);
  const [birthDate, setBirthDate] = useState<Dayjs | null>(
    profilMemorise.birthDate ? dayjs(profilMemorise.birthDate) : null,
  );

  // Arrivée directe sur l'URL : sans jeton, il n'y a pas d'inscription en cours.
  if (!registrationToken) return <Navigate to={ROUTES_INSCRIPTION.telephone} replace />;

  const estValide =
    firstName.trim().length >= LONGUEUR_NOM_MIN &&
    lastName.trim().length >= LONGUEUR_NOM_MIN &&
    Boolean(birthDate?.isValid());

  const handleContinue = () => {
    if (!estValide || !birthDate) return;
    setProfil({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      birthDate: birthDate.format('YYYY-MM-DD'),
    });
    navigate(ROUTES_INSCRIPTION.adresse);
  };

  const aujourdhui = dayjs();

  return (
    <OnboardingLayout>
      <Box
        sx={{
          position: 'absolute',
          top: 'calc(env(safe-area-inset-top, 0px) + 14px)',
          left: 16,
          zIndex: 2,
        }}
      >
        <BackButton onClick={() => navigate(ROUTES_INSCRIPTION.code)} label="Retour au code" />
      </Box>

      <OnboardingStepper current={1} total={4} />

      <CollapseOnKeyboard>
        <Medallion>
          <BadgeOutlinedIcon />
        </Medallion>
      </CollapseOnKeyboard>

      <Eyebrow>Profil</Eyebrow>

      <Title>Qui êtes-vous ?</Title>

      <Subtitle sx={{ mb: 3 }}>Ces informations figureront sur votre carte d’agriculteur</Subtitle>

      <Stack spacing={1.75} sx={{ width: '100%', alignItems: 'center' }}>
        <TextField
          label="Prénom"
          value={firstName}
          onChange={(event) => setFirstName(event.target.value)}
          InputLabelProps={{ shrink: true }}
          sx={champSx}
        />

        <TextField
          label="Nom"
          value={lastName}
          onChange={(event) => setLastName(event.target.value)}
          InputLabelProps={{ shrink: true }}
          sx={champSx}
        />

        <MobileDatePicker
          value={birthDate}
          onChange={setBirthDate}
          format="DD/MM/YYYY"
          minDate={aujourdhui.subtract(AGE_MAX, 'year')}
          maxDate={aujourdhui.subtract(AGE_MIN, 'year')}
          slotProps={datePickerSlotProps}
        />
      </Stack>

      <PrimaryButton onClick={handleContinue} disabled={!estValide} sx={{ mt: 3 }}>
        Continuer
      </PrimaryButton>
    </OnboardingLayout>
  );
};
```

- [ ] **Step 4 : Lancer le test pour vérifier qu'il passe**

```bash
npx vitest run src/features/Register/pages/RegisterProfilePage.test.tsx
```

Attendu : SUCCÈS, 7 tests.

Si le test de saisie de la date échoue parce que `MobileDatePicker` n'expose pas un champ tapable sous jsdom, remplacer dans le test la frappe `await user.type(screen.getByLabelText('Date de naissance'), '12/05/1990')` par une pré-alimentation du store (`setVerification` avec un `profil` portant `birthDate`) et ne conserver dans ce test que les assertions sur prénom et nom. Ne pas modifier le composant pour satisfaire le test.

- [ ] **Step 5 : Commit**

```bash
git add src/features/Register/pages/RegisterProfilePage.tsx src/features/Register/pages/RegisterProfilePage.test.tsx
git commit -m "feat(inscription): ecran de profil avec pre-remplissage"
```

---

### Task 8 : Écran de l'adresse en cascade

**Files:**
- Create: `src/features/Register/pages/RegisterAddressPage.tsx`
- Test: `src/features/Register/pages/RegisterAddressPage.test.tsx`

**Interfaces:**
- Consumes: `onboardingApi.getRegions/getPrefectures` et `ReferentialItem` (`@/features/Onboarding/onboarding.api`), `registerApi.getSousPrefectures` (Task 2), `useRegisterStore` (Task 2), `ROUTES_INSCRIPTION` (Task 1), `ProfileSelect`, `ErrorBanner`, `OnboardingStepper`, `onboarding.styled`, `BackButton`.
- Produces: `export const RegisterAddressPage: FunctionComponent`.

- [ ] **Step 1 : Écrire le test qui échoue**

Créer `src/features/Register/pages/RegisterAddressPage.test.tsx` :

```tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { onboardingApi } from '@/features/Onboarding/onboarding.api';
import { registerApi } from '@/features/Register/register.api';
import { useRegisterStore } from '@/features/Register/register.store';

import { RegisterAddressPage } from './RegisterAddressPage';

const navigateMock = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => navigateMock };
});

const renderPage = () =>
  render(
    <MemoryRouter>
      <RegisterAddressPage />
    </MemoryRouter>,
  );

/** Choisit une option dans un `ProfileSelect` (Select MUI, liste en portail). */
const choisir = async (
  user: ReturnType<typeof userEvent.setup>,
  libelle: string,
  option: string,
) => {
  await user.click(screen.getByLabelText(libelle));
  await user.click(await screen.findByRole('option', { name: option }));
};

describe('RegisterAddressPage', () => {
  beforeEach(() => {
    navigateMock.mockReset();
    useRegisterStore.getState().reset();
    useRegisterStore.getState().setVerification('tok-1', { statut: 'absent' });

    vi.spyOn(onboardingApi, 'getRegions').mockResolvedValue([
      { id: 'r1', name: 'Kindia' },
      { id: 'r2', name: 'Boké' },
    ]);
    vi.spyOn(onboardingApi, 'getPrefectures').mockImplementation(async (regionId) =>
      regionId === 'r1'
        ? [{ id: 'p1', name: 'Coyah' }, { id: 'p2', name: 'Dubréka' }]
        : [{ id: 'p3', name: 'Boffa' }],
    );
    vi.spyOn(registerApi, 'getSousPrefectures').mockImplementation(async (prefectureId) =>
      prefectureId === 'p1' ? [{ id: 'sp1', name: 'Manéah' }] : [{ id: 'sp2', name: 'Tanéné' }],
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('charge les régions à l’ouverture', async () => {
    renderPage();
    await waitFor(() => expect(onboardingApi.getRegions).toHaveBeenCalled());
  });

  it('laisse préfecture et sous-préfecture inertes tant qu’il n’y a pas de région', async () => {
    renderPage();
    await waitFor(() => expect(onboardingApi.getRegions).toHaveBeenCalled());

    expect(screen.getByLabelText('Préfecture')).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByLabelText('Sous-préfecture')).toHaveAttribute('aria-disabled', 'true');
  });

  it('charge les préfectures de la région choisie', async () => {
    const user = userEvent.setup();
    renderPage();
    await waitFor(() => expect(onboardingApi.getRegions).toHaveBeenCalled());

    await choisir(user, 'Région', 'Kindia');

    await waitFor(() => expect(onboardingApi.getPrefectures).toHaveBeenCalledWith('r1'));
  });

  it('remet préfecture et sous-préfecture à zéro quand la région change', async () => {
    const user = userEvent.setup();
    renderPage();
    await waitFor(() => expect(onboardingApi.getRegions).toHaveBeenCalled());

    await choisir(user, 'Région', 'Kindia');
    await choisir(user, 'Préfecture', 'Coyah');
    await choisir(user, 'Sous-préfecture', 'Manéah');
    expect(useRegisterStore.getState().adresse.sousPrefectureId).toBe('sp1');

    await choisir(user, 'Région', 'Boké');

    await waitFor(() => {
      const adresse = useRegisterStore.getState().adresse;
      expect(adresse.regionId).toBe('r2');
      expect(adresse.prefectureId).toBeNull();
      expect(adresse.sousPrefectureId).toBeNull();
    });
  });

  it('n’ouvre le bouton qu’une fois les trois niveaux choisis, puis passe au code confidentiel', async () => {
    const user = userEvent.setup();
    renderPage();
    await waitFor(() => expect(onboardingApi.getRegions).toHaveBeenCalled());

    const bouton = () => screen.getByRole<HTMLButtonElement>('button', { name: 'Continuer' });
    expect(bouton().disabled).toBe(true);

    await choisir(user, 'Région', 'Kindia');
    expect(bouton().disabled).toBe(true);

    await choisir(user, 'Préfecture', 'Coyah');
    expect(bouton().disabled).toBe(true);

    await choisir(user, 'Sous-préfecture', 'Manéah');
    expect(bouton().disabled).toBe(false);

    await user.click(bouton());
    expect(navigateMock).toHaveBeenCalledWith('/inscription/code-confidentiel');
  });

  it('signale un référentiel injoignable sans vider l’écran', async () => {
    vi.spyOn(onboardingApi, 'getRegions').mockRejectedValue(new Error('offline'));

    renderPage();

    expect(await screen.findByText(/Impossible de charger la liste/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2 : Lancer le test pour vérifier qu'il échoue**

```bash
npx vitest run src/features/Register/pages/RegisterAddressPage.test.tsx
```

Attendu : ÉCHEC — `Failed to resolve import "./RegisterAddressPage"`.

- [ ] **Step 3 : Écrire l'écran**

Créer `src/features/Register/pages/RegisterAddressPage.tsx` :

```tsx
import { useCallback, useEffect, useState, type FunctionComponent } from 'react';

import HolidayVillageRoundedIcon from '@mui/icons-material/HolidayVillageRounded';
import LocationCityRoundedIcon from '@mui/icons-material/LocationCityRounded';
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined';
import PublicRoundedIcon from '@mui/icons-material/PublicRounded';
import { Box, Stack } from '@mui/material';
import { Navigate, useNavigate } from 'react-router-dom';

import { ErrorBanner } from '@/features/Onboarding/components/ErrorBanner';
import { OnboardingStepper } from '@/features/Onboarding/components/OnboardingStepper';
import { ProfileSelect } from '@/features/Onboarding/components/ProfileSelect';
import { onboardingApi, type ReferentialItem } from '@/features/Onboarding/onboarding.api';
import {
  Eyebrow,
  Medallion,
  PrimaryButton,
  Subtitle,
  TextLink,
  Title,
} from '@/features/Onboarding/onboarding.styled';
import { OnboardingLayout } from '@/features/Onboarding/OnboardingLayout';
import { registerApi } from '@/features/Register/register.api';
import { ROUTES_INSCRIPTION } from '@/features/Register/register.routing';
import { useRegisterStore } from '@/features/Register/register.store';
import { BackButton } from '@/shared/components/BackButton';

/**
 * L'adresse administrative, en trois niveaux dépendants.
 *
 * La remise à zéro de la cascade vit dans le store (`setAdresse`) : elle est
 * trop facile à oublier ici, et la laisser à l'écran signifierait la réécrire
 * à chaque nouvel appelant.
 *
 * Ni district ni coordonnées GPS — volontairement non collectés.
 */
export const RegisterAddressPage: FunctionComponent = () => {
  const navigate = useNavigate();
  const registrationToken = useRegisterStore((s) => s.registrationToken);
  const adresse = useRegisterStore((s) => s.adresse);
  const setAdresse = useRegisterStore((s) => s.setAdresse);

  const [regions, setRegions] = useState<ReferentialItem[]>([]);
  const [prefectures, setPrefectures] = useState<ReferentialItem[]>([]);
  const [sousPrefectures, setSousPrefectures] = useState<ReferentialItem[]>([]);
  const [erreurChargement, setErreurChargement] = useState(false);

  const chargerRegions = useCallback(async () => {
    setErreurChargement(false);
    try {
      setRegions(await onboardingApi.getRegions());
    } catch {
      setErreurChargement(true);
    }
  }, []);

  useEffect(() => {
    void chargerRegions();
  }, [chargerRegions]);

  if (!registrationToken) return <Navigate to={ROUTES_INSCRIPTION.telephone} replace />;

  const handleRegion = async (id: string, name: string) => {
    setAdresse({ regionId: id, regionName: name });
    setPrefectures([]);
    setSousPrefectures([]);
    setErreurChargement(false);
    try {
      setPrefectures(await onboardingApi.getPrefectures(id));
    } catch {
      setErreurChargement(true);
    }
  };

  const handlePrefecture = async (id: string, name: string) => {
    setAdresse({ prefectureId: id, prefectureName: name });
    setSousPrefectures([]);
    setErreurChargement(false);
    try {
      setSousPrefectures(await registerApi.getSousPrefectures(id));
    } catch {
      setErreurChargement(true);
    }
  };

  const estValide = Boolean(
    adresse.regionId && adresse.prefectureId && adresse.sousPrefectureId,
  );

  return (
    <OnboardingLayout>
      <Box
        sx={{
          position: 'absolute',
          top: 'calc(env(safe-area-inset-top, 0px) + 14px)',
          left: 16,
          zIndex: 2,
        }}
      >
        <BackButton onClick={() => navigate(ROUTES_INSCRIPTION.profil)} label="Retour au profil" />
      </Box>

      <OnboardingStepper current={2} total={4} />

      <Medallion>
        <PlaceOutlinedIcon />
      </Medallion>

      <Eyebrow>Localité</Eyebrow>

      <Title>Où cultivez-vous ?</Title>

      <Subtitle sx={{ mb: 3 }}>Votre région, votre préfecture et votre sous-préfecture</Subtitle>

      <Stack spacing={1.75} sx={{ width: '100%', alignItems: 'center' }}>
        <ProfileSelect
          label="Région"
          value={adresse.regionId ?? ''}
          options={regions}
          onChange={(id, name) => void handleRegion(id, name)}
          placeholder="Sélectionnez votre région"
          icon={<PublicRoundedIcon />}
        />

        <ProfileSelect
          label="Préfecture"
          value={adresse.prefectureId ?? ''}
          options={prefectures}
          onChange={(id, name) => void handlePrefecture(id, name)}
          disabled={!adresse.regionId}
          placeholder="Sélectionnez votre préfecture"
          icon={<LocationCityRoundedIcon />}
        />

        <ProfileSelect
          label="Sous-préfecture"
          value={adresse.sousPrefectureId ?? ''}
          options={sousPrefectures}
          onChange={(id, name) => setAdresse({ sousPrefectureId: id, sousPrefectureName: name })}
          disabled={!adresse.prefectureId}
          placeholder="Sélectionnez votre sous-préfecture"
          icon={<HolidayVillageRoundedIcon />}
        />
      </Stack>

      {erreurChargement && (
        <ErrorBanner mb={0}>
          Impossible de charger la liste. Vérifiez votre connexion.{' '}
          <TextLink
            onClick={() => void chargerRegions()}
            sx={{ p: 0, minWidth: 0, fontSize: 12.75, verticalAlign: 'baseline' }}
          >
            Réessayer
          </TextLink>
        </ErrorBanner>
      )}

      <PrimaryButton
        onClick={() => navigate(ROUTES_INSCRIPTION.pin)}
        disabled={!estValide}
        sx={{ mt: 3 }}
      >
        Continuer
      </PrimaryButton>
    </OnboardingLayout>
  );
};
```

- [ ] **Step 4 : Lancer le test pour vérifier qu'il passe**

```bash
npx vitest run src/features/Register/pages/RegisterAddressPage.test.tsx
```

Attendu : SUCCÈS, 7 tests.

Si l'assertion `aria-disabled` échoue, remplacer dans le test l'assertion par une vérification équivalente sur la classe MUI (`expect(screen.getByLabelText('Préfecture').closest('.Mui-disabled')).not.toBeNull()`). Ne pas modifier `ProfileSelect`, qui est partagé avec le parcours d'invitation.

- [ ] **Step 5 : Commit**

```bash
git add src/features/Register/pages/RegisterAddressPage.tsx src/features/Register/pages/RegisterAddressPage.test.tsx
git commit -m "feat(inscription): ecran d adresse en cascade region-prefecture-sous-prefecture"
```

---

### Task 9 : Code confidentiel, résultat, et branchement des routes

**Files:**
- Create: `src/features/Register/pages/RegisterPinPage.tsx`
- Create: `src/features/Register/pages/RegisterResultPage.tsx`
- Modify: `src/shared/routes/index.tsx`
- Modify: `src/features/Onboarding/pages/WelcomeChoicePage.tsx`
- Delete: `src/features/Onboarding/pages/RegisterComingSoonPage.tsx`

**Interfaces:**
- Consumes: `registerApi.creerCompte` (Task 2), `useRegisterStore` (Task 2), `ROUTES_INSCRIPTION` (Task 1), `useAuthStore.login` (`@/shared/stores/authStore`), `PinDisplay`, `OnboardingLayout`, `onboarding.styled`, `ErrorBanner`.
- Produces: `export const RegisterPinPage: FunctionComponent`, `export const RegisterResultPage: FunctionComponent`, les huit routes.

- [ ] **Step 1 : Écrire l'écran du code confidentiel**

Créer `src/features/Register/pages/RegisterPinPage.tsx` :

```tsx
import { useState, type FunctionComponent } from 'react';

import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { Box } from '@mui/material';
import { Navigate, useNavigate } from 'react-router-dom';

import { PinDisplay } from '@/features/Auth/components/PinDisplay';
import { ErrorBanner } from '@/features/Onboarding/components/ErrorBanner';
import { OnboardingStepper } from '@/features/Onboarding/components/OnboardingStepper';
import {
  Eyebrow,
  Medallion,
  PrimaryButton,
  Subtitle,
  Title,
} from '@/features/Onboarding/onboarding.styled';
import { CollapseOnKeyboard, OnboardingLayout } from '@/features/Onboarding/OnboardingLayout';
import { ROUTES_INSCRIPTION } from '@/features/Register/register.routing';
import { useRegisterStore } from '@/features/Register/register.store';
import { BackButton } from '@/shared/components/BackButton';

/**
 * Le code confidentiel, saisi puis confirmé.
 *
 * Deux saisies plutôt qu'une : ce code sera le seul moyen d'entrer, et il n'y
 * a pas encore de parcours de réinitialisation. Une faute de frappe non
 * détectée fermerait le compte le jour même de sa création.
 */
export const RegisterPinPage: FunctionComponent = () => {
  const navigate = useNavigate();
  const registrationToken = useRegisterStore((s) => s.registrationToken);
  const setPin = useRegisterStore((s) => s.setPin);

  const [etape, setEtape] = useState<'saisie' | 'confirmation'>('saisie');
  const [premier, setPremier] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [clavierOuvert, setClavierOuvert] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  if (!registrationToken) return <Navigate to={ROUTES_INSCRIPTION.telephone} replace />;

  const enConfirmation = etape === 'confirmation';
  const valeur = enConfirmation ? confirmation : premier;

  const handleValider = () => {
    if (valeur.length !== 6) return;
    if (!enConfirmation) {
      setEtape('confirmation');
      setErreur(null);
      return;
    }
    if (confirmation !== premier) {
      setConfirmation('');
      setErreur('Les deux codes ne correspondent pas. Recommencez la confirmation.');
      return;
    }
    setPin(premier);
    navigate(ROUTES_INSCRIPTION.resultat);
  };

  const handleRetour = () => {
    if (enConfirmation) {
      setEtape('saisie');
      setConfirmation('');
      setErreur(null);
      return;
    }
    navigate(ROUTES_INSCRIPTION.adresse);
  };

  return (
    <OnboardingLayout keyboardOpen={clavierOuvert}>
      <Box
        sx={{
          position: 'absolute',
          top: 'calc(env(safe-area-inset-top, 0px) + 14px)',
          left: 16,
          zIndex: 2,
        }}
      >
        <BackButton onClick={handleRetour} label="Retour" />
      </Box>

      <OnboardingStepper current={3} total={4} />

      <CollapseOnKeyboard>
        <Medallion>
          <LockOutlinedIcon />
        </Medallion>
      </CollapseOnKeyboard>

      <Eyebrow>Sécurité</Eyebrow>

      <Title>{enConfirmation ? 'Confirmez votre code' : 'Créez votre code secret'}</Title>

      <Subtitle sx={{ mb: 1.5 }}>
        {enConfirmation
          ? 'Saisissez à nouveau les 6 chiffres pour les confirmer'
          : 'Choisissez un code à 6 chiffres — il vous servira à vous connecter'}
      </Subtitle>

      <PinDisplay
        // La clé force un composant neuf entre les deux étapes : sans elle, la
        // confirmation hériterait de l'affichage de la première saisie.
        key={etape}
        pin={valeur}
        maxLength={6}
        onChange={(saisi) => {
          if (erreur) setErreur(null);
          if (enConfirmation) setConfirmation(saisi);
          else setPremier(saisi);
        }}
        onFocusChange={setClavierOuvert}
        inputLabel={enConfirmation ? 'Confirmation du code confidentiel' : 'Code confidentiel'}
      />

      {erreur && <ErrorBanner mb={2}>{erreur}</ErrorBanner>}

      <PrimaryButton onClick={handleValider} disabled={valeur.length !== 6} sx={{ mt: 1 }}>
        {enConfirmation ? 'Valider' : 'Continuer'}
      </PrimaryButton>
    </OnboardingLayout>
  );
};
```

- [ ] **Step 2 : Écrire l'écran de résultat**

Créer `src/features/Register/pages/RegisterResultPage.tsx` :

```tsx
import { useCallback, useEffect, useState, type FunctionComponent } from 'react';

import { Box, Button, CircularProgress, Typography } from '@mui/material';
import { Navigate, useNavigate } from 'react-router-dom';

import { CheckCircleIcon } from '@/features/Onboarding/components/OnboardingIcons';
import { registerApi } from '@/features/Register/register.api';
import { ROUTES_INSCRIPTION } from '@/features/Register/register.routing';
import { useRegisterStore } from '@/features/Register/register.store';
import { ApiRequestError } from '@/shared/api/client';
import { useAuthStore } from '@/shared/stores/authStore';
import { error as errorPalette, neutral, primary } from '@/theme/colors';

/** Traduit l'échec de création en une phrase qui dit quoi faire. */
function messageErreur(erreur: unknown): string {
  if (!(erreur instanceof ApiRequestError)) {
    return 'La création du compte a échoué. Vérifiez votre connexion et réessayez.';
  }
  switch (erreur.status) {
    case 400:
      return 'Votre vérification a expiré. Recommencez depuis votre numéro de téléphone.';
    case 403:
      return 'Ce compte est suspendu. Contactez le support Kumy.';
    case 409:
      return 'Un compte existe déjà pour ce numéro. Connectez-vous avec votre code confidentiel.';
    default:
      return 'La création du compte a échoué. Réessayez dans un instant.';
  }
}

/**
 * Dernier écran : il crée le compte, puis ouvre la session.
 *
 * `POST /auth/phone/register` n'établit aucune session — il pose le code
 * confidentiel comme mot de passe Firebase. On se connecte donc ensuite avec
 * ces mêmes identifiants, comme le fait déjà le parcours par invitation.
 */
export const RegisterResultPage: FunctionComponent = () => {
  const navigate = useNavigate();
  const { phone, registrationToken, profil, adresse, pin, reset } = useRegisterStore();

  const [enCours, setEnCours] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);

  const creer = useCallback(async () => {
    if (
      !phone ||
      !registrationToken ||
      !pin ||
      !profil.birthDate ||
      !adresse.regionId ||
      !adresse.prefectureId ||
      !adresse.sousPrefectureId
    ) {
      setEnCours(false);
      setErreur('Votre inscription est incomplète. Recommencez depuis votre numéro.');
      return;
    }

    setEnCours(true);
    setErreur(null);
    try {
      await registerApi.creerCompte({
        registrationToken,
        firstName: profil.firstName,
        lastName: profil.lastName,
        birthDate: profil.birthDate,
        regionId: adresse.regionId,
        prefectureId: adresse.prefectureId,
        sousPrefectureId: adresse.sousPrefectureId,
        pin,
      });
      await useAuthStore.getState().login(phone, pin);
    } catch (echec) {
      setErreur(messageErreur(echec));
    } finally {
      setEnCours(false);
    }
  }, [phone, registrationToken, pin, profil, adresse]);

  useEffect(() => {
    void creer();
    // Une seule tentative au montage ; le bouton « Réessayer » rappelle `creer`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!phone) return <Navigate to={ROUTES_INSCRIPTION.telephone} replace />;

  if (enCours) {
    return (
      <Box
        sx={{
          minHeight: '100dvh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          px: 3,
        }}
      >
        <CircularProgress sx={{ color: primary[50] }} />
        <Typography sx={{ mt: 2, color: neutral[50] }}>Création de votre compte…</Typography>
      </Box>
    );
  }

  if (erreur) {
    return (
      <Box
        sx={{
          minHeight: '100dvh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
          px: 3,
        }}
      >
        <Typography sx={{ fontSize: 18, fontWeight: 600, color: errorPalette[40], mb: 2 }}>
          Inscription impossible
        </Typography>
        <Typography sx={{ fontSize: 14, color: neutral[50], mb: 3, maxWidth: 280 }}>
          {erreur}
        </Typography>
        <Button
          size="large"
          variant="contained"
          onClick={() => void creer()}
          sx={{ maxWidth: 395, width: '100%' }}
        >
          Réessayer
        </Button>
        <Button
          size="large"
          onClick={() => {
            reset();
            navigate(ROUTES_INSCRIPTION.telephone, { replace: true });
          }}
          sx={{ maxWidth: 395, width: '100%', mt: 1, color: neutral[50] }}
        >
          Recommencer l’inscription
        </Button>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center',
        px: 3,
        pb: 3,
      }}
    >
      <Box
        sx={{
          width: 100,
          height: 100,
          borderRadius: '50%',
          bgcolor: primary[98],
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mb: 3,
          '@keyframes scaleIn': {
            from: { transform: 'scale(0.5)', opacity: 0 },
            to: { transform: 'scale(1)', opacity: 1 },
          },
          animation: 'scaleIn 0.5s ease',
        }}
      >
        <CheckCircleIcon />
      </Box>

      <Typography sx={{ fontSize: 24, fontWeight: 700, color: neutral[10], mb: 1.5 }}>
        Compte créé !
      </Typography>
      <Typography sx={{ fontSize: 14, color: neutral[50], lineHeight: 1.5, maxWidth: 280, mb: 4 }}>
        Bienvenue {profil.firstName}, votre compte Kumy est prêt.
      </Typography>

      <Button
        size="large"
        variant="contained"
        onClick={() => {
          reset();
          navigate('/', { replace: true });
        }}
        sx={{ maxWidth: 395, width: '100%', mt: 4 }}
      >
        Accéder à Kumy
      </Button>
    </Box>
  );
};
```

- [ ] **Step 3 : Brancher les routes**

Dans `src/shared/routes/index.tsx` :

1. Supprimer la ligne d'import de `RegisterComingSoonPage`.
2. Ajouter les imports du parcours, dans l'ordre alphabétique des chemins :

```tsx
import { RegisterAddressPage } from '@/features/Register/pages/RegisterAddressPage';
import { RegisterCodePage } from '@/features/Register/pages/RegisterCodePage';
import { RegisterKnownAccountPage } from '@/features/Register/pages/RegisterKnownAccountPage';
import { RegisterPhonePage } from '@/features/Register/pages/RegisterPhonePage';
import { RegisterPinPage } from '@/features/Register/pages/RegisterPinPage';
import { RegisterProfilePage } from '@/features/Register/pages/RegisterProfilePage';
import { RegisterResultPage } from '@/features/Register/pages/RegisterResultPage';
import { RegisterSuspendedPage } from '@/features/Register/pages/RegisterSuspendedPage';
```

3. Remplacer la ligne :

```tsx
  { path: '/onboarding/register/phone', element: <RegisterComingSoonPage /> },
```

par :

```tsx
  // Ancienne adresse de l'écran « Bientôt disponible » : elle a pu être mise en
  // favori ou partagée. On la fait mener au parcours réel plutôt qu'au repli.
  { path: '/onboarding/register/phone', element: <Navigate to="/inscription/telephone" replace /> },

  { path: '/inscription/telephone', element: <RegisterPhonePage /> },
  { path: '/inscription/code', element: <RegisterCodePage /> },
  { path: '/inscription/deja-inscrit', element: <RegisterKnownAccountPage /> },
  { path: '/inscription/suspendu', element: <RegisterSuspendedPage /> },
  { path: '/inscription/profil', element: <RegisterProfilePage /> },
  { path: '/inscription/adresse', element: <RegisterAddressPage /> },
  { path: '/inscription/code-confidentiel', element: <RegisterPinPage /> },
  { path: '/inscription/resultat', element: <RegisterResultPage /> },
```

- [ ] **Step 4 : Pointer le bouton « Créer un compte » sur le parcours**

Dans `src/features/Onboarding/pages/WelcomeChoicePage.tsx`, remplacer :

```tsx
        <OutlinedButton onClick={() => navigate('/onboarding/register/phone')}>Créer un compte</OutlinedButton>
```

par :

```tsx
        <OutlinedButton onClick={() => navigate('/inscription/telephone')}>Créer un compte</OutlinedButton>
```

- [ ] **Step 5 : Supprimer le placeholder**

```bash
git rm src/features/Onboarding/pages/RegisterComingSoonPage.tsx
grep -rn "RegisterComingSoonPage" src || echo "aucune référence restante"
```

Attendu : `aucune référence restante`.

- [ ] **Step 6 : Vérifier**

```bash
npm test && npm run lint && npm run build
```

Attendu : tous les tests au vert (y compris `WelcomeChoicePage.test.tsx`, qui peut affirmer l'ancienne cible — le mettre à jour vers `/inscription/telephone` si c'est le cas), lint propre, build sans erreur.

- [ ] **Step 7 : Commit**

```bash
git add -A src/features/Register src/shared/routes/index.tsx src/features/Onboarding
git commit -m "feat(inscription): code confidentiel, resultat et branchement des huit routes"
```

---

### Task 10 : La page de bienvenue seule

Un compte auto-inscrit n'a ni technicien ni domaine tant qu'un partenaire ne l'a pas adopté. Le tableau de bord n'aurait rien à montrer, et la barre de navigation mènerait à trois écrans vides.

**Files:**
- Create: `src/features/Home/compte.api.ts`
- Create: `src/features/Home/useCompteNouveau.ts`
- Create: `src/features/Home/BienvenuePage.tsx`
- Test: `src/features/Home/useCompteNouveau.test.ts`
- Modify: `src/shared/components/AppLayout.tsx`

**Interfaces:**
- Consumes: `apiClient` (`@/shared/api/client`), `useAuthStore` (`@/shared/stores/authStore`), `isDemoMode` (`@/features/Home/home.demo`).
- Produces:
  - `interface EtatDuCompte { hasFarms: boolean; hasEngineer: boolean }`
  - `compteApi.etatDuCompte(farmerId: string): Promise<EtatDuCompte>`
  - `interface CompteNouveauState { estNouveau: boolean; isLoading: boolean }`
  - `function useCompteNouveau(): CompteNouveauState`
  - `export const BienvenuePage: FunctionComponent`

- [ ] **Step 1 : Écrire le test qui échoue**

Créer `src/features/Home/useCompteNouveau.test.ts` :

```ts
import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { compteApi } from '@/features/Home/compte.api';
import { useCompteNouveau } from '@/features/Home/useCompteNouveau';
import { useAuthStore } from '@/shared/stores/authStore';

describe('useCompteNouveau', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: { uid: 'uid-1', displayName: 'Awa Diallo', phone: '+224622201362', role: 'farmer' },
      isAuthenticated: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    useAuthStore.setState({ user: null, isAuthenticated: false });
  });

  it('dit « nouveau » sans domaine et sans technicien', async () => {
    vi.spyOn(compteApi, 'etatDuCompte').mockResolvedValue({
      hasFarms: false,
      hasEngineer: false,
    });

    const { result } = renderHook(() => useCompteNouveau());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.estNouveau).toBe(true);
  });

  it('rend l’application complète dès qu’un domaine existe', async () => {
    vi.spyOn(compteApi, 'etatDuCompte').mockResolvedValue({
      hasFarms: true,
      hasEngineer: false,
    });

    const { result } = renderHook(() => useCompteNouveau());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.estNouveau).toBe(false);
  });

  it('rend l’application complète dès qu’un technicien est rattaché', async () => {
    vi.spyOn(compteApi, 'etatDuCompte').mockResolvedValue({
      hasFarms: false,
      hasEngineer: true,
    });

    const { result } = renderHook(() => useCompteNouveau());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.estNouveau).toBe(false);
  });

  it('ouvre l’application complète quand l’appel échoue, plutôt que d’enfermer un agriculteur établi', async () => {
    vi.spyOn(compteApi, 'etatDuCompte').mockRejectedValue(new Error('offline'));

    const { result } = renderHook(() => useCompteNouveau());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.estNouveau).toBe(false);
  });

  it('n’appelle rien sans session', async () => {
    useAuthStore.setState({ user: null, isAuthenticated: false });
    const spy = vi.spyOn(compteApi, 'etatDuCompte');

    const { result } = renderHook(() => useCompteNouveau());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(spy).not.toHaveBeenCalled();
    expect(result.current.estNouveau).toBe(false);
  });
});
```

- [ ] **Step 2 : Lancer le test pour vérifier qu'il échoue**

```bash
npx vitest run src/features/Home/useCompteNouveau.test.ts
```

Attendu : ÉCHEC — `Failed to resolve import "@/features/Home/compte.api"`.

- [ ] **Step 3 : Écrire l'appel réseau**

Créer `src/features/Home/compte.api.ts` :

```ts
import { apiClient } from '@/shared/api/client';

/** L'état de rattachement du compte, tel que le rend l'API. */
export interface EtatDuCompte {
  hasFarms: boolean;
  hasEngineer: boolean;
}

export const compteApi = {
  /**
   * `farmerId` vaut l'uid de l'utilisateur — aucune recherche supplémentaire
   * n'est nécessaire après la connexion.
   */
  async etatDuCompte(farmerId: string): Promise<EtatDuCompte> {
    const { data } = await apiClient.get<EtatDuCompte>(`/farmers/${farmerId}/account-state`);
    return data;
  },
};
```

- [ ] **Step 4 : Écrire le hook**

Créer `src/features/Home/useCompteNouveau.ts` :

```ts
import { useEffect, useState } from 'react';

import { compteApi } from '@/features/Home/compte.api';
import { isDemoMode } from '@/features/Home/home.demo';
import { useAuthStore } from '@/shared/stores/authStore';

export interface CompteNouveauState {
  /** Aucun domaine et aucun technicien : le compte n'a pas encore été adopté. */
  estNouveau: boolean;
  isLoading: boolean;
}

/**
 * La source unique de « ce compte a-t-il été adopté ».
 *
 * La mise en page et la route la lisent toutes deux ici plutôt que d'interroger
 * l'API chacune de leur côté — deux lectures indépendantes finiraient par
 * diverger sur un rechargement.
 *
 * En cas d'échec réseau, le hook ouvre l'application complète : enfermer un
 * agriculteur établi derrière un écran de bienvenue serait bien pire que de
 * montrer un tableau de bord vide à un inscrit de la veille.
 */
export function useCompteNouveau(): CompteNouveauState {
  const uid = useAuthStore((s) => s.user?.uid);
  const [state, setState] = useState<CompteNouveauState>({
    estNouveau: false,
    isLoading: true,
  });

  useEffect(() => {
    // Aperçu de démonstration : il montre l'app garnie, pas l'écran d'accueil
    // d'un compte neuf.
    if (isDemoMode() || !uid) {
      setState({ estNouveau: false, isLoading: false });
      return;
    }

    let actif = true;
    setState((precedent) => ({ ...precedent, isLoading: true }));

    compteApi
      .etatDuCompte(uid)
      .then((etat) => {
        if (!actif) return;
        setState({
          estNouveau: !etat.hasFarms && !etat.hasEngineer,
          isLoading: false,
        });
      })
      .catch(() => {
        if (!actif) return;
        setState({ estNouveau: false, isLoading: false });
      });

    return () => {
      actif = false;
    };
  }, [uid]);

  return state;
}
```

- [ ] **Step 5 : Lancer le test pour vérifier qu'il passe**

```bash
npx vitest run src/features/Home/useCompteNouveau.test.ts
```

Attendu : SUCCÈS, 5 tests.

- [ ] **Step 6 : Écrire l'écran de bienvenue**

Créer `src/features/Home/BienvenuePage.tsx` :

```tsx
import type { FunctionComponent } from 'react';

import AgricultureRoundedIcon from '@mui/icons-material/AgricultureRounded';
import { Box, Button, Stack, Typography } from '@mui/material';

import { KumySprout } from '@/shared/components/KumySprout';
import { useAuthStore } from '@/shared/stores/authStore';
import { neutral, primary } from '@/theme/colors';

/** Ce qui va se passer, dit dans l'ordre où cela arrivera. */
const ETAPES = [
  'Un technicien Kumy prend contact avec vous',
  'Vous tracez ensemble vos domaines et vos parcelles',
  'Vos conseils, vos alertes et votre calendrier apparaissent ici',
] as const;

/**
 * Le seul écran d'un compte auto-inscrit que personne n'a encore adopté.
 *
 * Sans domaine ni technicien, le tableau de bord n'aurait rien à montrer et les
 * quatre onglets mèneraient à des écrans vides. Un écran qui explique la suite
 * vaut mieux que quatre qui ne disent rien.
 */
export const BienvenuePage: FunctionComponent = () => {
  const prenom = useAuthStore((s) => s.user?.displayName?.split(' ')[0]);
  const logout = useAuthStore((s) => s.logout);

  return (
    <Box
      sx={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        px: 3,
        py: 6,
        background: 'linear-gradient(180deg, #F3FFFA 0%, #F0F1EF 100%)',
      }}
    >
      <Box
        sx={{
          width: 96,
          height: 96,
          borderRadius: '50%',
          bgcolor: primary[98],
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mb: 3,
        }}
      >
        <KumySprout size={52} />
      </Box>

      <Typography sx={{ fontSize: 24, fontWeight: 700, color: neutral[10], mb: 1 }}>
        Bienvenue{prenom ? ` ${prenom}` : ''} !
      </Typography>

      <Typography
        sx={{ fontSize: 14.5, color: neutral[50], lineHeight: 1.55, maxWidth: 300, mb: 4 }}
      >
        Votre compte Kumy est créé. Il ne contient encore aucune exploitation — voici ce qui vient
        ensuite.
      </Typography>

      <Stack spacing={1.75} sx={{ width: '100%', maxWidth: 340, mb: 5 }}>
        {ETAPES.map((etape, index) => (
          <Stack
            key={etape}
            direction="row"
            spacing={1.5}
            alignItems="center"
            sx={{
              px: 2,
              py: 1.75,
              borderRadius: '16px',
              textAlign: 'left',
              background: 'rgba(255,255,255,0.92)',
              border: '1px solid rgba(55,75,70,0.08)',
              boxShadow: '0 6px 20px rgba(1,134,117,0.06)',
            }}
          >
            <Box
              sx={{
                width: 26,
                height: 26,
                flexShrink: 0,
                borderRadius: '50%',
                bgcolor: primary[98],
                color: primary[50],
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: "'Ubuntu', sans-serif",
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              {index + 1}
            </Box>
            <Typography sx={{ fontSize: 13.5, color: neutral[30], lineHeight: 1.4 }}>
              {etape}
            </Typography>
          </Stack>
        ))}
      </Stack>

      <Stack
        direction="row"
        spacing={1}
        alignItems="center"
        sx={{ color: neutral[50], fontSize: 12.5, mb: 3 }}
      >
        <AgricultureRoundedIcon sx={{ fontSize: 18 }} />
        <Typography sx={{ fontSize: 12.5 }}>
          Cet écran laissera place à votre tableau de bord dès la première visite.
        </Typography>
      </Stack>

      <Button onClick={() => void logout()} sx={{ color: neutral[50], fontSize: 13 }}>
        Se déconnecter
      </Button>
    </Box>
  );
};
```

Vérifier au préalable la signature de `KumySprout` :

```bash
grep -n "interface\|Props\|FunctionComponent" src/shared/components/KumySprout.tsx | head
```

Si le composant n'accepte pas de prop `size`, l'utiliser sans prop et régler la taille par le conteneur.

- [ ] **Step 7 : Brancher la mise en page**

Remplacer intégralement `src/shared/components/AppLayout.tsx` par :

```tsx
import type { FunctionComponent } from 'react';

import { Box } from '@mui/material';
import { Outlet } from 'react-router-dom';

import { BienvenuePage } from '@/features/Home/BienvenuePage';
import { useCompteNouveau } from '@/features/Home/useCompteNouveau';
import { BottomNav, NAV_HEIGHT } from '@/shared/components/BottomNav';
import { ErrorBoundary } from '@/shared/components/ErrorBoundary';

/**
 * Coquille des écrans authentifiés : rend l'onglet courant (`Outlet`) au-dessus
 * de la barre de navigation basse Kumy, en réservant l'espace du dock + safe-area.
 *
 * Sauf pour un compte auto-inscrit que personne n'a encore adopté : il n'a ni
 * domaine ni technicien, les quatre onglets mèneraient à des écrans vides. Il
 * reçoit alors un écran de bienvenue unique, sans barre de navigation.
 */
export const AppLayout: FunctionComponent = () => {
  const { estNouveau, isLoading } = useCompteNouveau();

  // Ni squelette ni écran vide pendant la résolution : afficher la barre puis la
  // retirer produirait un clignotement au premier rendu de chaque session.
  if (isLoading) return null;

  if (estNouveau) {
    return (
      <ErrorBoundary>
        <BienvenuePage />
      </ErrorBoundary>
    );
  }

  return (
    <Box sx={{ minHeight: '100dvh', position: 'relative' }}>
      <Box sx={{ pb: `calc(${NAV_HEIGHT}px + env(safe-area-inset-bottom, 0px))` }}>
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </Box>
      <BottomNav />
    </Box>
  );
};
```

- [ ] **Step 8 : Vérification complète**

```bash
npm test && npm run lint && npm run build
```

Attendu : tous les tests au vert, lint propre, build sans erreur.

Si un test existant rendait `AppLayout` sans session (ce qui déclenchait auparavant un rendu immédiat), il faut désormais attendre la résolution du hook : y ajouter un `await waitFor(...)` plutôt que de changer `AppLayout`.

- [ ] **Step 9 : Commit**

```bash
git add src/features/Home/compte.api.ts src/features/Home/useCompteNouveau.ts src/features/Home/useCompteNouveau.test.ts src/features/Home/BienvenuePage.tsx src/shared/components/AppLayout.tsx
git commit -m "feat(inscription): ecran de bienvenue seul tant que le compte n est pas adopte"
```

---

## Après le plan

**Vérification manuelle, sur appareil — ce qu'aucun test automatisé ne couvre :**

1. Réception réelle du SMS sur un téléphone guinéen, et lisibilité du code à six chiffres dans le message.
2. Lisibilité du parcours **en plein soleil** : contraste des huit écrans, taille des cibles tactiles.
3. Parcours complet sur un numéro neuf : téléphone → code → profil → adresse → code confidentiel → résultat → écran de bienvenue.
4. Parcours sur un numéro `pending` créé depuis le backoffice : les champs prénom, nom et date arrivent bien pré-remplis.
5. Parcours sur un numéro `active` : l'écran « déjà inscrit », puis « Me connecter » qui mène au PIN avec le numéro déjà rempli.
6. Renvoi du code : le bouton reste inerte pendant soixante secondes, puis un second SMS arrive.
