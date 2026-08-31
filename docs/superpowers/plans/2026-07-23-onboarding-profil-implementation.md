# Onboarding — Étape « Complétez votre profil » (adresse + date de naissance)

## Context

Le parcours d'onboarding agriculteur est aujourd'hui `invitation → welcome → pin → success`. L'écran de récap (`InvitedWelcomePage`) promet « compléter votre profil » mais **aucune donnée n'est collectée**. On ajoute une étape `/onboarding/profile` qui recueille la **date de naissance** et l'**adresse** (Région + Préfecture, seuls niveaux dont les endpoints sont `@Public()`), puis transmet le tout via `POST /auth/activate`.

Spec de référence (validée) : `docs/superpowers/specs/2026-07-23-onboarding-profil-adresse-naissance-design.md`.

Nouveau flux : `invitation → welcome → **profil** → pin → success`, stepper à **3 pas** (welcome=0, profil=1, pin=2).

## Contraintes globales

- **Pas de nouvelle dépendance.** `@mui/x-date-pickers@^9`, `dayjs@^1.11` (+ locale FR) déjà installés. Style via `onboarding.styled.ts` (design system PWA partagé).
- **Endpoints publics uniquement** : `GET /regions`, `GET /prefectures?regionId=` (pas de sous-préfecture/district pendant l'onboarding).
- **TDD** : Vitest + Testing Library. Commits fréquents, conventionnels, en français.
- Guard existant `if (!userData) return <Navigate to="/onboarding/invitation" replace />`.

---

## Task 1 — Store : tranche `profile` + types

**Files:** `src/features/Onboarding/onboarding.types.ts`, `onboarding.store.ts`, test `onboarding.store.test.ts` (créer).

- Étendre `ValidateTokenResponse` **et** `OnboardingUserData` : `dateOfBirth?: string | null; gender?: string | null;`.
- Ajouter au store :
  ```ts
  export interface OnboardingProfile {
    birthDate: string | null;      // ISO 'YYYY-MM-DD'
    regionId: string | null;
    regionName: string | null;
    prefectureId: string | null;
    prefectureName: string | null;
    addressDetail: string | null;
  }
  ```
  `profile: OnboardingProfile` (init tous à `null`), `setProfile: (partial: Partial<OnboardingProfile>) => void`, et `reset()` vide aussi `profile`.
- Test : `setProfile` merge partiel ; `reset` remet `profile` à null.

## Task 2 — API : `getRegions` / `getPrefectures` + `activate(profileData)`

**Files:** `src/features/Onboarding/onboarding.api.ts`, test `onboarding.api.test.ts` (créer, mock `apiClient`).

- `export interface ReferentialItem { id: string; name: string }`.
- `getRegions(): Promise<ReferentialItem[]>` → `GET /regions?limit=100`, map `data.data` → `{id, name}`.
- `getPrefectures(regionId: string): Promise<ReferentialItem[]>` → `GET /prefectures?regionId=<id>&limit=200`, même mapping.
- Étendre `activate` avec `profileData?: { birthDate?; regionId?; prefectureId?; addressDetail? }` (POST inchangé, payload étendu).
- Test : URLs correctes, mapping paginé → tableau plat.

## Task 3 — `InvitationCodePage` transmet `dateOfBirth`/`gender`

**Files:** `pages/InvitationCodePage.tsx`, `pages/InvitationCodePage.test.tsx`.

- `setUserData({ …, dateOfBirth: data.dateOfBirth, gender: data.gender })`.
- Test : `setUserData` reçoit les deux champs.

## Task 4 — `ProfileSelect` (Select capsule teal)

**Files:** `src/features/Onboarding/components/ProfileSelect.tsx` (créer) + test.

- Wrapper MUI `FormControl` + `Select` habillé façon `FieldCapsule` (radius 18, fond blanc dégradé, focus glow teal, Ubuntu). Props : `label`, `value`, `options: ReferentialItem[]`, `onChange(id, name)`, `disabled`, `placeholder`. `aria-label` = label.
- Test : rend les options, `onChange` renvoie id+name, respecte `disabled`.

## Task 5 — `OnboardingProfilePage` (écran)

**Files:** `pages/OnboardingProfilePage.tsx` (créer) + `OnboardingProfilePage.test.tsx`.

- Structure PWA : `OnboardingLayout`, back → `/onboarding/welcome`, `OnboardingStepper current={1} total={3}`, `Medallion` (`BadgeOutlinedIcon`), `Eyebrow` « PROFIL », `Title` « Complétez votre profil », `Subtitle`.
- Guard `!userData` → Navigate invitation.
- Champs :
  1. **Date de naissance** — `MobileDatePicker` (`@mui/x-date-pickers`), pré-rempli depuis `userData.dateOfBirth`, `minDate`=aujourd'hui−100 ans, `maxDate`=aujourd'hui−15 ans, format FR, habillage capsule.
  2. **Région** — `ProfileSelect`, options `getRegions()` (au mount, `useEffect`).
  3. **Préfecture** — `ProfileSelect`, `disabled` tant que pas de région ; options `getPrefectures(regionId)` (rechargé au changement de région) ; réinitialisée quand la région change.
  4. **Repère/quartier** (optionnel) — champ texte (`CodeInput`-like) → `addressDetail`.
- Erreur de chargement référentiels → `ErrorBanner` « Impossible de charger la liste. Vérifiez votre connexion. » + bouton Réessayer.
- `PrimaryButton` désactivé tant que `birthDate && regionId && prefectureId` non tous remplis. Au clic : `setProfile({...})` puis `navigate('/onboarding/pin')`.
- Tests : rend 3 champs ; bouton désactivé/actif ; préfecture désactivée sans région ; changer région réinitialise préfecture ; pré-remplissage date ; échec `getRegions` → `ErrorBanner` ; clic persiste + navigue.

## Task 6 — Câblage flux + stepper 3 pas

**Files:** `shared/routes/index.tsx`, `pages/InvitedWelcomePage.tsx`, `pages/OnboardingPinPage.tsx`.

- Route `{ path: '/onboarding/profile', element: <OnboardingProfilePage /> }` (après welcome).
- `InvitedWelcomePage` : `navigate('/onboarding/profile')` (au lieu de pin) ; `OnboardingStepper current={0} total={3}`.
- `OnboardingPinPage` : `OnboardingStepper current={2} total={3}` ; back → `/onboarding/profile` (au lieu de welcome).

## Task 7 — `LocalizationProvider` (dayjs) global

**Files:** `src/App.tsx`.

- Envelopper `<RouterProvider>` dans `<LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="fr">`.

## Task 8 — Envoi `profileData` à l'activation

**Files:** `pages/OnboardingSuccessPage.tsx`, `OnboardingSuccessPage.test.tsx`.

- `runActivation` lit `profile` du store et passe `profileData: { birthDate, regionId, prefectureId, addressDetail }` (`?? undefined`) à `activate`.
- Mettre à jour le test existant (l'assertion `toHaveBeenCalledWith` inclura `profileData`).

## Task 9 — Backend : DTO + `activate()` structuré

**Files (repo `agripilot-backoffice-api`):** `src/auth/dto/activate.dto.ts`, `src/auth/auth.service.ts`, tests Jest.

- `ProfileDataDto` : ajouter `@IsOptional() @IsString() regionId?`, `prefectureId?`, `addressDetail?`.
- `activate()` :
  - **DOB** : écrire `updateData.dateOfBirth = pd.birthDate` (aligne écriture/lecture — corrige l'incohérence `birthDate`/`dateOfBirth`).
  - **Adresse** : si `pd.regionId` → `updateData.address = { regionId, prefectureId: pd.prefectureId ?? null, sousPrefectureId: null, districtId: null, detail: pd.addressDetail ?? null }` ; sinon fallback chaîne existant.
- Tests : DTO valide les nouveaux champs ; `activate` écrit `dateOfBirth` + address structurée quand `regionId` fourni.

> ⚠️ Le changement DOB modifie un comportement backend existant. À acter avant Task 9 (option de repli : écrire les deux clés transitoirement).

## Vérification (par tâche + finale)

- Front : `npm run lint && npm run test && npm run build` — zéro erreur, suite verte.
- Back : `npm run lint && npm run test` (Jest).
- Manuel (`npm run dev`, viewport ~390px) : `/onboarding/profile` → choisir date + Région → Préfecture s'active → Préfecture chargée → Continuer actif → PIN → success ; changer de région réinitialise la préfecture ; hors-ligne → `ErrorBanner`.

## Hors périmètre (YAGNI)

Sous-préfecture/district à l'onboarding, GPS, endpoint self-update farmer, autres champs profil (genre/étude/photo).
