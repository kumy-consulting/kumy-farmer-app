# Spec — Étape onboarding « Complétez votre profil » (adresse + date de naissance)

**Date :** 2026-07-23
**Statut :** Design validé
**Repos concernés :** `kumy-farmer-app` (front) · `agripilot-backoffice-api` (extension légère)

## Contexte

Le parcours d'onboarding de l'agriculteur invité est aujourd'hui :

`invitation` (validate-token) → `welcome` (récap des infos pré-remplies par l'admin) → `pin` (création du code) → `success` (activation).

Il **manque une étape de collecte de profil** : l'écran de récap (`InvitedWelcomePage`) promet déjà « compléter votre profil », mais aucune donnée d'adresse ni de date de naissance n'est recueillie. On veut collecter l'**adresse** (découpage administratif guinéen) et la **date de naissance** avant l'activation.

### Contraintes backend (déterminantes)

1. **Barrière d'authentification.** Pendant l'onboarding, l'agriculteur n'est pas encore authentifié (activation + login à la fin). Côté API :
   - `GET /regions` et `GET /prefectures` (avec filtre `?regionId=`) sont **`@Public()`**.
   - `GET /sous-prefectures` et `GET /districts` exigent une **session authentifiée**.
   → Une cascade à 4 niveaux est impossible avant login. **On se limite à Région + Préfecture** (publics), les 2 niveaux inférieurs seront complétés plus tard par l'ingénieur.
2. **Canal unique de soumission.** Il n'existe **aucun** endpoint de mise à jour de profil pour le rôle `farmer`. Le seul canal est `POST /auth/activate` avec `profileData` (le farmer-app ne l'alimente pas encore).
3. **`validate-token` renvoie déjà `dateOfBirth` et `gender`.** L'admin peut avoir pré-rempli la date → l'écran la pré-remplit si présente.

## Décisions validées

| Sujet | Décision |
|---|---|
| Type d'adresse | Découpage administratif, **limité à Région + Préfecture** |
| Date de naissance | **Sur le même écran** que l'adresse |
| Obligatoire | **Date + Région + Préfecture obligatoires** (non contournables). Repère/quartier optionnel. |

## Architecture front (`kumy-farmer-app`)

### Flux & stepper

Nouveau flux : `invitation → welcome → **profil** → pin → success`.
`OnboardingStepper` passe à **3 pas** : `welcome=0`, `profil=1`, `pin=2` (mettre à jour `total` et les `current` dans `InvitedWelcomePage`, la nouvelle page, et `OnboardingPinPage`).

Nouvelle route : `/onboarding/profile` (dans `src/shared/routes/index.tsx`), entre `/onboarding/welcome` et `/onboarding/pin`. `InvitedWelcomePage` navigue désormais vers `/onboarding/profile` ; la page profil navigue vers `/onboarding/pin`.

### Nouvel écran `OnboardingProfilePage.tsx`

Réutilise le langage PWA partagé : `OnboardingLayout` (keyboard-aware), `Medallion`, `Eyebrow` « PROFIL », `Title` « Complétez votre profil », `Subtitle`, `PrimaryButton`, `OnboardingStepper current={1}`, flèche retour vers `/onboarding/welcome`. Guard `if (!userData) return <Navigate to="/onboarding/invitation" replace />` (comme `OnboardingPinPage`).

Champs (de haut en bas) :

1. **Date de naissance** — `MobileDatePicker` (`@mui/x-date-pickers`, `AdapterDayjs`).
   - Locale FR déjà configurée dans `main.tsx` (`dayjs.locale('fr')`). **Ajouter** un `LocalizationProvider` + `AdapterDayjs` autour de `<RouterProvider>` dans `App.tsx`/`main.tsx`.
   - Pré-remplie depuis `userData.dateOfBirth` si présent.
   - Validation : date passée, âge ∈ [15, 100] ans (bornes `minDate`/`maxDate` sur le picker).
   - Style aligné sur `FieldCapsule` (capsule teal, focus glow).
2. **Région** — `Select` stylé « capsule », options depuis `GET /regions`.
3. **Préfecture** — `Select` en cascade, **désactivé** tant qu'aucune région n'est choisie ; options depuis `GET /prefectures?regionId=<regionId>`. Réinitialisé si la région change.
4. **Quartier / repère** *(optionnel)* — champ texte libre (`CodeInput`-like), mappé sur `address.detail`.

`PrimaryButton` **désactivé** tant que `birthDate && regionId && prefectureId` ne sont pas tous renseignés. Au clic : persiste dans le store puis `navigate('/onboarding/pin')`.

Composants de sélection : construire un petit `<ProfileSelect>` stylé (MUI `Select`/`FormControl` habillé façon capsule teal) pour Région/Préfecture, cohérent avec `onboarding.styled.ts`. Pas de librairie de formulaire supplémentaire (rester sur MUI + `useState`).

### État (`onboarding.store.ts`)

Ajouter une tranche `profile` :

```ts
interface OnboardingProfile {
  birthDate: string | null;      // ISO 'YYYY-MM-DD'
  regionId: string | null;
  regionName: string | null;
  prefectureId: string | null;
  prefectureName: string | null;
  addressDetail: string | null;  // repère/quartier, optionnel
}
// + setProfile(partial), et reset() étendu pour vider profile
```

### Types (`onboarding.types.ts`)

Étendre `ValidateTokenResponse` **et** `OnboardingUserData` avec les champs déjà renvoyés par le backend :

```ts
dateOfBirth?: string | null;
gender?: string | null;
```

`InvitationCodePage.setUserData(...)` transmet ces deux champs supplémentaires.

### API (`onboarding.api.ts`)

Ajouter (endpoints **publics**, réponse paginée `{ data, total, page, limit, totalPages }`) :

```ts
getRegions(): Promise<ReferentialItem[]>                 // GET /regions?limit=100
getPrefectures(regionId: string): Promise<ReferentialItem[]> // GET /prefectures?regionId=<id>&limit=200
```

`ReferentialItem = { id: string; name: string }` (mapper depuis la réponse ; ignorer la pagination en demandant une `limit` large — les référentiels sont petits).

Étendre `activate()` pour transmettre `profileData` :

```ts
activate(payload: {
  token: string;
  password: string;
  profileData?: {
    birthDate?: string;      // ISO
    regionId?: string;
    prefectureId?: string;
    addressDetail?: string;
  };
}): Promise<{ message: string }>
```

### Envoi (`OnboardingSuccessPage.tsx`)

`runActivation` lit `profile` du store et appelle :

```ts
await onboardingApi.activate({
  token, password,
  profileData: {
    birthDate: profile.birthDate ?? undefined,
    regionId: profile.regionId ?? undefined,
    prefectureId: profile.prefectureId ?? undefined,
    addressDetail: profile.addressDetail ?? undefined,
  },
});
```

## Extension backend (`agripilot-backoffice-api`)

Fichier `src/auth/dto/activate.dto.ts` — étendre `ProfileDataDto` :

```ts
@IsOptional() @IsString() regionId?: string;
@IsOptional() @IsString() prefectureId?: string;
@IsOptional() @IsString() addressDetail?: string;
```

(`birthDate?` et `address?` existent déjà. On garde `address` pour compat ; `addressDetail` porte le repère libre.)

Fichier `src/auth/auth.service.ts` — dans `activate()` (bloc `pd` vers `updateData`, ~l.353-366), remplacer l'écriture actuelle par une **adresse structurée** et **réconcilier le nommage DOB** :

- Actuel : `if (pd.birthDate) updateData.birthDate = pd.birthDate;` et `if (pd.address) updateData.address = pd.address;` (chaîne).
- Cible :
  - **DOB** : écrire `updateData.dateOfBirth = pd.birthDate` (aligné sur le modèle Farmer et sur ce que `validate-token` **lit** — corrige l'incohérence existante `birthDate` écrit / `dateOfBirth` lu). *(Décision : on standardise sur `dateOfBirth`.)*
  - **Adresse** : si `pd.regionId` présent, écrire un objet structuré
    `updateData.address = { regionId, prefectureId: pd.prefectureId ?? null, sousPrefectureId: null, districtId: null, detail: pd.addressDetail ?? null }`.
    Sinon, conserver le comportement chaîne pour compat.

Écriture toujours sur `firestore.collection('users').doc(uid)`. Sous-préfecture/district restent `null` (complétés ensuite par l'ingénieur via le backoffice — `PUT /farmers/:id`).

> **Note de cohérence à acter** : le changement DOB modifie un comportement existant (`birthDate` → `dateOfBirth`). Vérifier qu'aucun autre lecteur ne dépend de `users.birthDate`. Si un doute subsiste, écrire les deux clés transitoirement.

## Gestion d'erreur

- **Chargement référentiels** : si `getRegions()`/`getPrefectures()` échoue (hors-ligne), afficher `ErrorBanner` (composant partagé) « Impossible de charger la liste. Vérifiez votre connexion. » + bouton réessayer ; laisser le champ repère saisissable. Les `Select` restent désactivés tant que les données ne sont pas chargées.
- **Validation** : bouton désactivé tant que les 3 champs requis ne sont pas remplis (pas d'erreur bloquante à afficher).
- **Activation** : inchangée (`OnboardingSuccessPage` gère déjà l'échec d'`activate` avec réessai).

## Tests

Front (`kumy-farmer-app`, Vitest + Testing Library) :
- `OnboardingProfilePage` : rend date + région + préfecture ; bouton désactivé tant que requis manquants, activé quand remplis.
- Préfecture désactivée tant qu'aucune région ; changer de région réinitialise la préfecture.
- Pré-remplissage de la date depuis `userData.dateOfBirth`.
- Mock `onboardingApi.getRegions/getPrefectures` (succès + échec → `ErrorBanner`).
- Store : `setProfile` met à jour, `reset` vide `profile`.
- `InvitationCodePage` : `setUserData` transmet `dateOfBirth`/`gender`.

Back (`agripilot-backoffice-api`, Jest) :
- `ProfileDataDto` valide les nouveaux champs.
- `activate()` écrit `dateOfBirth` et une `address` structurée quand `regionId` fourni ; garde le fallback chaîne sinon.

## Hors périmètre (YAGNI)

- Sous-préfecture / district pendant l'onboarding (auth requise ; complétés par l'ingénieur).
- Géolocalisation GPS de l'agriculteur.
- Endpoint self-update de profil pour le rôle `farmer`.
- Autres champs profil (genre, niveau d'études, profession, photo) — bien que supportés par `ProfileDataDto`, non demandés ici.

## Fichiers impactés (récapitulatif)

**Front** — `src/features/Onboarding/pages/OnboardingProfilePage.tsx` (nouveau), `onboarding.store.ts`, `onboarding.types.ts`, `onboarding.api.ts`, `pages/InvitationCodePage.tsx`, `pages/InvitedWelcomePage.tsx`, `pages/OnboardingPinPage.tsx`, `pages/OnboardingSuccessPage.tsx`, `components/OnboardingStepper.tsx` (total=3), `shared/routes/index.tsx`, `App.tsx`/`main.tsx` (LocalizationProvider), + composant `ProfileSelect` (dans `onboarding.styled.ts` ou `components/`).

**Back** — `src/auth/dto/activate.dto.ts`, `src/auth/auth.service.ts`.
