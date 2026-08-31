# Spec — Création de compte autonome

**Date :** 2026-08-23
**Statut :** Design validé
**Dépôts :** `kumy-farmer-app` (parcours) **et** `agripilot-backoffice-api` (endpoints)

## Contexte

Aujourd'hui un agriculteur ne peut pas ouvrir un compte seul : il lui faut un code
d'invitation émis par un partenaire. `RegisterComingSoonPage` affiche « Bientôt
disponible ». On ouvre l'inscription autonome : quelqu'un qui télécharge l'app
doit pouvoir créer son compte à partir de son seul numéro de téléphone.

### Ce qui existe déjà — et qui sera réutilisé

Côté `kumy-farmer-app`, le parcours par invitation fournit l'essentiel de la
matière : `PhoneNumberInput` (E.164 Guinée, format local à 9 chiffres), les
écrans PIN, `OnboardingStepper`, `ProfileSelect`, `ErrorBanner`,
`onboardingKeyboard.ts`, et un store zustand par étapes.

Côté `agripilot-backoffice-api` :

| Brique | État |
|---|---|
| `GET /regions`, `GET /prefectures` | `@Public()` |
| `SmsService.send()` (LAfricaMobile) | Opérationnel |
| `UserStatus` = `active` / `inactive` / `suspended` / `pending` | Existe |
| `POST /auth/login`, `/auth/me`, `/auth/activate` | Existent |

### Ce qui manque — le cœur du chantier

| Manque | Constat |
|---|---|
| Envoi d'un code par SMS | Aucune trace d'OTP dans toute l'API |
| Vérification du code | — |
| Reconnaissance d'un compte par téléphone | — |
| Auto-inscription d'un agriculteur | `POST /auth/register` est marqué « dev only », fondé sur l'e-mail et exige un rôle : inutilisable ici |
| `GET /sous-prefectures` | Existe mais protégé par `FirebaseAuthGuard` — inaccessible à qui n'a pas encore de compte |

`CreateFarmerDto` exige par ailleurs une adresse **complète** (`districtId`,
`sousPrefectureId`, `prefectureId`, `regionId`) et des coordonnées GPS, que le
parcours d'inscription ne collecte pas. L'auto-inscription aura donc son propre
modèle, plus léger.

## Décisions validées

| Sujet | Décision |
|---|---|
| Périmètre | **Les deux dépôts** — parcours et endpoints |
| Ce que crée l'inscription | **Utilisateur + fiche agriculteur allégée**, sans partenaire ni technicien |
| Ordre des appels | **Vérification du téléphone AVANT reconnaissance du compte** |
| Branche `suspended` | **Écran dédié**, ajouté au périmètre initial |
| Code | 6 chiffres · 5 min · 5 tentatives · 1 envoi/min, 5/h par numéro |
| Emplacement front | Nouveau `src/features/Register/`, distinct de `Onboarding/` |

Pourquoi un dossier distinct : les deux parcours partagent des composants mais
pas leur état. L'un démarre d'un jeton d'invitation, l'autre d'un numéro.
Fusionner les stores emmêlerait deux machines à états sans rien économiser.

## Le parcours

| Route | Écran | Rôle |
|---|---|---|
| `/inscription/telephone` | Numéro | « Suivant » déclenche l'envoi du code |
| `/inscription/code` | Code à 6 chiffres | Vérifie, puis aiguille |
| `/inscription/deja-inscrit` | Compte actif | « Me connecter » → `/auth/pin-entry` |
| `/inscription/suspendu` | Compte suspendu | Explique et oriente vers le support |
| `/inscription/profil` | Prénom, nom, naissance | Pré-rempli si `pending`, vierge sinon |
| `/inscription/adresse` | Région → préfecture → sous-préfecture | Cascade |
| `/inscription/code-confidentiel` | PIN + confirmation | « Valider » crée le compte |
| `/inscription/resultat` | Succès ou échec | Succès → invitation à se connecter |

### L'aiguillage

Il découle du champ `statut` renvoyé par la vérification du code :

| `statut` | Écran | Pourquoi |
|---|---|---|
| `active` | Déjà inscrit | Le compte existe et sert : rien à créer |
| `pending`, `inactive` | Profil **pré-rempli** | Le partenaire a saisi ses informations, l'agriculteur les confirme |
| `suspended` | Suspendu | L'envoyer se connecter le heurterait à un refus incompréhensible |
| `absent` | Profil **vierge** | Aucun compte : saisie complète |

## Contrat d'API

Quatre endpoints publics à créer, plus une ouverture.

### 1. `POST /auth/phone/otp`

Requête `{ phone }` (E.164). Réponse `{ expiresIn, resendAfter }`.

**Répond toujours 200**, y compris pour un numéro inconnu. Une réponse
différenciée révélerait qui est inscrit avant toute vérification.

### 2. `POST /auth/phone/otp/verify`

Requête `{ phone, code }`. Réponse :

```
{
  registrationToken: string,   // court, à usage unique
  account: {
    statut: 'active' | 'pending' | 'inactive' | 'suspended' | 'absent',
    profil?: { firstName, lastName, birthDate }   // seulement si pending/inactive
  }
}
```

Le `registrationToken` matérialise la preuve de possession du téléphone et
autorise l'appel suivant. Sans lui, l'inscription serait ouverte à quiconque
connaît un numéro.

### 3. `POST /auth/phone/register`

Requête :

```
{
  registrationToken, firstName, lastName, birthDate,
  regionId, prefectureId, sousPrefectureId, pin
}
```

Crée l'utilisateur Firebase (téléphone → e-mail fictif `<msisdn>@agripilot.phone`,
selon la convention existante), rôle `farmer`, statut `active`, **et** une fiche
agriculteur avec adresse partielle, sans `partnerId` ni technicien.

Rejette si le `registrationToken` est absent, expiré, déjà consommé, ou si le
numéro porte déjà un compte `active`.

### 4. `GET /sous-prefectures` → `@Public()`

Même traitement que `/regions` et `/prefectures` : c'est un référentiel
administratif public, sans donnée personnelle.

## Sécurité

**L'ordre des appels est la mesure principale.** Ne rien révéler d'un compte
avant que la possession du téléphone soit prouvée ferme l'énumération des
inscrits — quelqu'un qui essaie mille numéros n'apprend rien.

| Mesure | Valeur |
|---|---|
| Longueur du code | 6 chiffres, tirés d'un générateur cryptographique |
| Validité | 5 minutes |
| Tentatives | 5, puis le code est invalidé |
| Renvoi | 1 par minute, 5 par heure et par numéro |
| Stockage | Empreinte du code, jamais le code en clair |
| `registrationToken` | 15 minutes, usage unique, lié au numéro vérifié |

Le plafond horaire protège autant l'agriculteur (pas de harcèlement par SMS) que
le budget : chaque envoi est facturé par LAfricaMobile.

## La page de bienvenue seule

Un compte auto-inscrit n'a ni technicien ni domaine tant qu'un partenaire ne l'a
pas adopté. Le tableau de bord n'aurait rien à montrer, et la barre de navigation
mènerait à trois écrans vides.

`farmerId` vaut `user.uid` — aucune recherche supplémentaire n'est nécessaire.
Après connexion, l'app interroge les domaines : s'il n'y en a aucun et qu'aucun
technicien n'est rattaché, `AppLayout` masque la barre de navigation et rend un
écran de bienvenue unique, qui explique la suite.

L'état est exposé par un hook partagé, afin que la mise en page et la route
lisent la même source plutôt que d'interroger l'API chacune de leur côté.

## Stratégie de test

**Front, automatisé :**

- Machine à états de l'aiguillage : les cinq valeurs de `statut` mènent bien aux
  cinq écrans. C'est le cœur de la fonctionnalité, et c'est du calcul pur.
- Formulaire de profil : validations, pré-remplissage en branche `pending`.
- Cascade d'adresse : sélectionner une région remet à zéro préfecture et
  sous-préfecture, une omission classique.
- Renvoi du code : le bouton reste inerte pendant le délai.
- `useCompteNouveau` : sans domaine et sans technicien → bienvenue seule ;
  dès qu'un domaine existe → app complète.
- Horloge figée dans tout test touchant à une expiration.

**API, automatisé :**

- Un numéro inconnu reçoit la même réponse qu'un numéro connu.
- Code expiré, code faux, sixième tentative : tous rejetés.
- `registrationToken` rejoué : refusé.
- Inscription sur un numéro déjà `active` : refusée.
- Les plafonds d'envoi tiennent.

**Manuel, sur appareil :** réception réelle du SMS et lisibilité du parcours en
plein soleil — ni l'un ni l'autre ne se vérifie en test automatisé.

## Hors périmètre

- Réinitialisation du code confidentiel oublié — parcours voisin, chantier à part.
- Rattachement d'un inscrit à un partenaire, qui relève du backoffice.
- Envoi du code par WhatsApp : la plomberie existe (`WhatsappService`), mais le
  choix du canal est une décision produit qui n'a pas été prise.
- District et coordonnées GPS de l'agriculteur, volontairement non collectés.
