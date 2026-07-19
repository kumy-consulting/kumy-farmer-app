# Spec — Onboarding & Connexion des agriculteurs (Kumy)

**Date :** 2026-07-20 · **App :** `kumy-farmer-app` (+ `agripilot-backoffice-api`) · **Statut :** proposé

## Contexte & objectif

L'app agriculteur Kumy doit permettre à un agriculteur, dès le 1er lancement (app
téléchargée depuis le store), de **se connecter** ou de **créer/activer son compte**.
Deux populations coexistent, avec deux niveaux d'accès :

| Tier | Origine du compte | Preuve d'identité | Accès après onboarding |
|------|-------------------|-------------------|------------------------|
| **`full`** | Créé au **backoffice** par un admin/agent (rattaché à un partenaire) | **Code d'invitation** reçu par SMS | **Tous les services** |
| **`simulation`** | **Auto-inscrit** depuis l'app (non rattaché) | **OTP SMS** | **Simulations uniquement** *(features définies ultérieurement)* |

Le tier est porté par un champ **`accessTier: 'full' | 'simulation'`** sur le doc
`users/{uid}` (dérivé de l'origine : invité → `full`, auto-inscrit → `simulation`).
L'app ouvre/masque les features selon ce tier. **Le catalogue exact des « simulations »
et le gating fin sont hors périmètre de cette spec** (à spécifier plus tard) ; ici on pose
seulement le champ et un routage post-login conscient du tier.

L'existant réutilisable (audité) : login téléphone+PIN (`POST /auth/login`) marche déjà
pour les fermiers ; l'onboarding par **token** (`/auth/validate-token` + `/auth/activate`)
utilisé par l'ingénieur est directement réemployable pour le **parcours invité** ; les
pickers préfecture/sous-préfecture sont servis par l'endpoint **public**
`/prefectures/:id/subdivisions`.

## Parcours utilisateur

### Écran d'accueil (1er lancement, non authentifié)
`WelcomeChoicePage` — logo Kumy + 3 actions :
- **Connexion** → parcours login
- **Créer un compte** → parcours B (auto-inscription)
- **J'ai une invitation** → parcours A (saisie de code)

Au 2ᵉ lancement, si un numéro est mémorisé et l'utilisateur non authentifié, on va
directement au PIN (UX « numéro mémorisé », comme la PWA).

### Connexion (tous tiers)
`PhoneEntryPage` → `PinEntryPage` → `POST /auth/login { identifier: E164, password: PIN }`.
Session posée (cookie web / Bearer natif). Numéro mémorisé sur le device (Dexie).

### Parcours A — Invité (`full`) — réutilise l'existant
1. `InvitationCodePage` — saisie du code reçu par SMS → `GET /auth/validate-token?token=CODE`.
   - invalide/expiré → écran d'erreur « Lien expiré ou invalide ».
2. `InvitedWelcomePage` — profil **pré-rempli** (prénom, nom, email, téléphone non-modifiable)
   issu de `validate-token`. Bouton « Continuer ».
3. `PinPage` — création du PIN 6 chiffres.
4. `SuccessPage` — au montage : `POST /auth/activate { token, password: PIN }` → compte actif.
   L'adresse est déjà renseignée par le backoffice → pas d'écran adresse ici.

> Aucun endpoint backend neuf pour A : `validate-token` + `activate` existent et acceptent
> le rôle `farmer`. Seule exigence : la création backoffice d'un farmer pose `accessTier:'full'`.

### Parcours B — Auto-inscription (`simulation`) — chantier neuf
1. `PhoneEntryPage` — numéro +224.
2. `OtpVerifyPage` — au montage `POST /auth/otp/send { phone }` ; saisie du code 6 chiffres ;
   `POST /auth/otp/verify { phone, code }` → `{ registrationToken, exists, status?, prefill? }`.
   Renvoi possible du code (cooldown 60 s). Branches :
   - `exists && status==='active'` → « Ce compte existe déjà » → redirection Connexion.
   - `exists && status==='pending'` → profil **pré-rempli** (cas d'un fermier pré-créé qui
     s'auto-inscrit) → suite.
   - `!exists` → profil **vierge** → suite.
3. `ProfilePage` — **Prénom** (requis), **Nom** (requis), **Email** (optionnel),
   **Date de naissance** (optionnel). Téléphone affiché en **rappel non-modifiable**.
4. `AddressPage` — **préfecture** → **sous-préfecture** (pickers cascadants via
   `/prefectures/:id/subdivisions`, public). District optionnel/ignoré au MVP.
5. `PinPage` — création du PIN 6 chiffres.
6. Soumission → `POST /auth/onboard-farmer { registrationToken, profile, address, pin }`.
7. `SuccessPage` — « Compte créé ! » → « Accéder à Kumy » (session déjà posée par l'onboard).

## Backend — `agripilot-backoffice-api`

### Nouveaux endpoints (tous `@Public()`)

**`POST /auth/otp/send { phone }`**
- Génère un code 6 chiffres, stocke `otp_codes/{phoneE164}` : `{ codeHash, expiresAt (+5 min),
  attempts: 0, lastSentAt, sendCount }`. Code **hashé** au repos (jamais en clair).
- Envoie le SMS via le **module notifications existant (Twilio)** du backoffice-api.
- Garde-fous : cooldown **60 s** entre deux envois (`lastSentAt`), plafond d'envois/heure.
- Réponse : `{ sent: true, cooldownSeconds }` (ne divulgue pas l'existence du numéro).

**`POST /auth/otp/verify { phone, code }`**
- Vérifie le code (expiry 5 min, **max 5 tentatives** puis invalidation).
- Succès → supprime/invalide l'OTP, renvoie :
  `{ registrationToken, exists, status?, prefill?: { firstName, lastName, email, dateOfBirth } }`.
- `registrationToken` = **JWT court (~15 min)** signé, claim = `phone` vérifié (+ `purpose:'onboarding'`).
  C'est la preuve de possession du numéro consommée par `onboard-farmer`.

**`POST /auth/onboard-farmer { registrationToken, profile, address, pin }`**
- Valide le `registrationToken` (signature + expiry + `phone` == `profile.phone` déduit du token).
- Selon l'état du numéro :
  - `active` → **409** (« compte déjà actif, connectez-vous »).
  - `pending` (pré-créé) → complète profil + adresse structurée, pose le PIN
    (`auth.updateUser(uid,{password})`), `status: active`. `accessTier` **inchangé**
    (reste `full` si pré-créé plein droit).
  - **inexistant** → crée l'utilisateur Firebase (email `${phone}@agripilot.phone`,
    password = PIN, phoneNumber), doc `users/{uid}` : `role: farmer`, `status: active`,
    **`accessTier: 'simulation'`**, `selfRegistered: true`, `partnerId: null`,
    `assignedEngineerId: null` ; doc `farmers/{...}` avec **adresse structurée** (`AddressDto`).
- Renvoie une **session** (tokens + cookie `__session`) → l'app atterrit connectée.

### Modifs sur l'existant
- **`accessTier`** ajouté au schéma `users` + exposé dans `AuthUserDto`/`UserProfile`
  (login + `/auth/me`) → l'app peut gater les features.
- **Création backoffice d'un farmer** (`POST /farmers`) pose `accessTier: 'full'`
  (rétro-compat : absence de champ = `full` pour les comptes existants rattachés).
- `AddressDto` (préfecture/sous-préf IDs, déjà défini) accepté par `onboard-farmer`
  (l'activation token actuelle ne prenait qu'une adresse texte — inchangée pour A).

### Collections Firestore
- **`otp_codes/{phoneE164}`** *(nouveau, TTL court)* : `codeHash, expiresAt, attempts, lastSentAt, sendCount`.
- `users/{uid}` : **+ `accessTier`**, `+ selfRegistered?`.
- `farmers/{...}` : inchangé (adresse structurée déjà supportée par le schéma).

## Architecture front — `kumy-farmer-app`

Respecte la convention **un `*.api.ts` par feature** + client partagé `@/shared/api/client`.

```
src/
├─ shared/
│  ├─ stores/authStore.ts              # porté PWA : login, initialize, logout, rememberedPhone, tokens
│  └─ services/rememberedPhone.service.ts + db (table Dexie authPrefs)
└─ features/
   ├─ Auth/                            # CONNEXION
   │  ├─ auth.api.ts                   # (existe) login/me/refresh/logout
   │  ├─ PhoneEntry/…                  # porté PWA
   │  └─ PinEntry/…                    # porté PWA (PinDisplay robuste WebView)
   ├─ Onboarding/                      # LES DEUX PARCOURS
   │  ├─ onboarding.api.ts             # otp/send, otp/verify, onboard-farmer, validate-token, activate
   │  ├─ geography.api.ts              # regions, prefectures/subdivisions
   │  ├─ onboarding.store.ts           # wizard Zustand : mode('self'|'invited'), phone, tokens, prefill, profile, address, pin, step
   │  ├─ components/                   # OnboardingStepper, OnboardingIcons, ProfileForm, AddressPicker (portés/adaptés)
   │  └─ pages/                        # WelcomeChoice, InvitationCode, InvitedWelcome, OtpVerify, Profile, Address, Pin, Success
   └─ (Home existant → branchera par accessTier plus tard)
```

Composants **portés** de la PWA : `PinDisplay`, `PhoneNumberInput`, `CountryCodeSelector`,
`formatPhoneNumber` util, `OnboardingStepper` + styles, `OnboardingIcons`, pickers
`SelectPrefecture`/`SelectSubPrefecture`.

**Routage** : `WelcomeChoicePage` = destination non-authentifiée par défaut ;
`ProtectedRoute` (porté) route authed→app, non-authed→accueil (ou PIN si numéro mémorisé).
Post-login, l'app lit `user.accessTier` (gating détaillé = plus tard).

## Paramètres & sécurité
- OTP : **6 chiffres**, expiry **5 min**, resend cooldown **60 s**, **5 tentatives** max, **hashé** au repos.
- `registrationToken` : JWT signé, **~15 min**, claim `phone` vérifié + `purpose`.
- PIN : 6 chiffres = **mot de passe Firebase** (modèle existant `…@agripilot.phone`), jamais en Firestore.
- Aucun OTP/PIN loggé. Endpoints OTP anti-énumération (réponses neutres).

## Découpage d'implémentation (pour le plan)
1. **Backend P1** — champ `accessTier` + création backoffice `full` (débloque parcours A tout de suite).
2. **Frontend P1** — `authStore` + Connexion + `WelcomeChoicePage` + **Parcours A** (invitation code → validate-token → welcome → PIN → activate). *Zéro backend neuf.*
3. **Backend P2** — module OTP (`send`/`verify`) via Twilio + `onboard-farmer` + collection `otp_codes`.
4. **Frontend P2** — **Parcours B** (téléphone → OTP → profil → adresse → PIN → onboard).
5. Le frontend peut avancer contre un **contrat mocké** dans `onboarding.api.ts` en attendant P2 backend.

## Hors périmètre (différé)
- Catalogue et gating fin des **simulations** (tier `simulation`).
- **Deep links** d'invitation (App Links/Universal Links) — MVP = saisie de code.
- Flux de **réclamation** d'un auto-inscrit par un agent (passage `simulation` → `full`).
- Sécurité par-parcelle via règles Firestore (déjà différée globalement).
