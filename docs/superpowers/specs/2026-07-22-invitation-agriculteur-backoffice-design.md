# Invitation d'un agriculteur depuis le backoffice — design

**Date :** 2026-07-22
**Branches :** `feature/farmer-invitation` dans `agripilot-backoffice-api`, `agripilot-backoffice-front` et `kumy-farmer-app` (issues de `main`, sans push ni PR).
**Chantier lié :** [2026-07-20-onboarding-connexion-agriculteurs-design.md](./2026-07-20-onboarding-connexion-agriculteurs-design.md) — ce document livre le maillon manquant du parcours A (agriculteur invité).

## Problème

L'app Kumy propose « J'ai une invitation », mais rien ne permet d'émettre cette invitation.

1. **Aucune UI backoffice.** `POST /users/:uid/send-activation` existe et fonctionne, le dialogue `SendActivationDialog` existe, mais il n'est câblé que sur les ingénieurs. `grep -rniI "activation|invit" src/features/farmers/` ne renvoie rien. Inviter un agriculteur impose aujourd'hui un appel curl manuel.
2. **Le token de création est inutilisable.** `farmers.service.ts:620` et `engineers.service.ts:347` écrivent `activationExpires` en **string ISO** (conséquence du `JSON.parse(JSON.stringify(...))`), alors que `auth.service.ts:277` lit `userData.activationExpires?.toDate()` — méthode qui n'existe que sur un `Timestamp` Firestore. `GET /auth/validate-token` échoue donc sur tout token issu de `POST /farmers`. Seul le token régénéré par `users.service.ts:551` (qui écrit un vrai `Date`) est exploitable.
3. **Le canal ne transporte pas ce que l'app demande.** Le SMS envoie `Bonjour {prénom}, activez votre compte Kumy AgriPilot: {lien}` (`notifications.service.ts:116`), alors que `InvitationCodePage` attend le token nu (12 caractères hex). L'app n'a pas de deep link — décision assumée et différée dans la spec d'onboarding.

## Objectif

Un manager crée un agriculteur au backoffice, déclenche l'envoi de l'invitation en un clic, et l'agriculteur active son compte dans l'app — que le code soit recopié à la main ou que le SMS soit collé tel quel.

Hors périmètre : deep links, parcours B (auto-inscription OTP), réclamation par un agent.

## Décisions

| Sujet | Décision | Raison |
|---|---|---|
| Placement de l'action | Liste + après création | Miroir exact du pattern ingénieurs déjà en place ; aucun nouveau concept UI |
| Code vs lien | SMS et email portent **code + lien**, l'app tolère les deux | Couvre la recopie manuelle et le copier-coller sans casser l'activation web |
| `activationExpires` | Écriture normalisée **et** lecture tolérante | La lecture tolérante débloque les comptes déjà en base, sans script de migration |
| Branches | Une par repo, même nom, pas de PR | `gh` non authentifié sur ce poste ; cohérent avec les chantiers en cours |

## 1 — Backoffice front (`agripilot-backoffice-front`)

### Mutualisation du dialogue

`SendActivationDialog` ne contient rien de spécifique aux ingénieurs : il reçoit `userName` et `userTypeLabel` en props. Il passe de `features/engineers/components/` à `features/common/`, où réside déjà `ConfirmDeleteDialog`, mutualisé de la même façon. Les deux imports existants (`EngineersList.tsx:41`, `AddEngineer.tsx:5`) suivent le déplacement. Le comportement côté ingénieurs ne change pas.

### `FarmersList.tsx`

Une `IconButton` « Envoyer l'invitation » rejoint la colonne actions, avant Éditer. Le câblage reprend `EngineersList.tsx:105-130` :

- state `farmerToActivate` et `isActivationDialogOpen` ;
- `useSendActivation().mutate({ uid: farmer.userId, channel })` ;
- retour utilisateur via `useNotificationStore` (succès et erreur).

L'icône n'apparaît que si `status !== "active"`, avec le libellé « Renvoyer l'invitation » quand `status === "pending"`. L'API accepterait un renvoi sur un compte actif, mais cela régénérerait le token et invaliderait le compte : on ne l'expose pas.

`GET /farmers` renvoie déjà `status` (`farmers.service.ts:268`) ; il suffit d'ajouter `status?: string` au type `Farmer` dans `hooks/useFarmers.ts`.

### `AddFarmer.tsx`

Dans `handleCreationSuccess(userId)`, le dialogue s'ouvre avant la redirection vers l'onglet d'édition — transposition de `AddEngineer.tsx:31`. Fermer le dialogue sans envoyer laisse la redirection se faire normalement ; l'invitation reste alors disponible depuis la liste.

## 2 — API (`agripilot-backoffice-api`)

### a. Format de `activationExpires`

Un helper `coerceDate(value: unknown): Date | null` dans `src/common/utils/` accepte `Timestamp`, `Date` et string ISO. Il remplace les trois occurrences de `userData.activationExpires?.toDate()` dans `auth.service.ts` (lignes 277, 325, 394). Un token dont la date est illisible ou absente reste traité comme expiré.

Côté écriture, `farmers.service.ts:620` et `engineers.service.ts:347` posent un vrai `Date`. Cela impose de sortir `activationExpires` du `JSON.parse(JSON.stringify(...))` — qui le re-sérialiserait en string — en l'ajoutant à l'objet après la copie, juste avant le `.set()`.

Les deux moitiés sont complémentaires : la lecture tolérante répare l'existant, l'écriture normalisée tarit la source.

### b. Code dans le SMS

`sendActivationLink` prend un paramètre `activationCode` en plus du lien. Le message SMS et WhatsApp devient :

```
Bonjour {prénom}, votre code Kumy : {code}. Ou activez ici : {lien}
```

Le lien est conservé : l'activation web de la PWA AgriPilot en dépend.

Le token est déjà en main dans `users.service.ts:551` au moment de l'appel — rien à régénérer ni à relire.

### c. Code dans l'email

`renderActivationEmail` (`templates/activation-email.ts`) affiche le code en monospace, en évidence, au-dessus du bouton d'activation existant. `backoffice-activation-email.ts` n'est pas modifié : les administrateurs backoffice n'utilisent pas l'app mobile.

## 3 — App Kumy (`kumy-farmer-app`)

`InvitationCodePage.tsx:17` remplace `code.trim()` par `extractInvitationCode(code)`, fonction pure placée dans `src/features/Onboarding/invitationCode.util.ts` — même convention que `features/Auth/phone.util.ts` :

1. `trim` de l'entrée ;
2. si elle contient `token=`, retour de la valeur du paramètre ;
3. sinon, retour de l'entrée en minuscules.

L'agriculteur peut ainsi coller le SMS entier, coller l'URL seule, ou taper les 12 caractères. Un test vitest couvre les trois formes plus l'entrée vide ; le harness est déjà en place sur `main`.

## Vérification

- `npm run lint` et `npm run build` sur les trois repos.
- `npx vitest run` sur `kumy-farmer-app`.
- Suite de tests existante de l'API.

Le parcours de bout en bout — créer un agriculteur, recevoir le SMS Twilio, activer dans l'app — reste un **suivi manuel** : ni compte live ni numéro de test disponible dans cette session. C'est la seule vérification qui prouve que la chaîne complète fonctionne ; le reste ne prouve que l'absence de régression locale.

## Risques

**Renvoi d'invitation sur un compte actif.** `sendActivation` régénère le token sans vérifier le statut. L'UI masque le cas, mais l'API reste permissive. Ajouter un garde-fou serveur relève d'un chantier distinct.

**Deux formats en base pendant la transition.** Les documents créés avant ce correctif gardent leur string ISO. La lecture tolérante les couvre indéfiniment ; aucune migration n'est prévue ni nécessaire.

**Longueur du SMS.** Ajouter le code allonge le message d'une trentaine de caractères. Avec un lien `https://agripilot.kumy.app/activate?token=…` déjà long, le SMS peut basculer sur deux segments Twilio. Coût marginal accepté au regard du gain d'usage.
