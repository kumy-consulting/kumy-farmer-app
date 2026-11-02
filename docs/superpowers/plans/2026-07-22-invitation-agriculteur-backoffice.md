# Invitation agriculteur depuis le backoffice — plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permettre à un manager d'inviter un agriculteur en un clic depuis le backoffice, et à cet agriculteur d'activer son compte dans l'app Kumy avec le code reçu par SMS ou email.

**Architecture :** Trois repos, un chantier. L'API fiabilise le token d'activation (format de date) et fait transiter le code en clair dans le SMS et l'email ; le backoffice front mutualise le dialogue d'activation existant et le câble sur les agriculteurs ; l'app Kumy accepte indifféremment un code nu ou une URL collée.

**Tech Stack :** NestJS 11 + Firebase Admin + Jest (API) · React 19 + MUI 7 + TanStack Query + Vite (backoffice front) · React 19 + MUI + Vitest + Testing Library (app Kumy).

**Spec :** [2026-07-22-invitation-agriculteur-backoffice-design.md](../specs/2026-07-22-invitation-agriculteur-backoffice-design.md)

## Global Constraints

- Branche de travail : `feature/farmer-invitation` dans les trois repos, déjà créée depuis `main`. Aucun push, aucune PR.
- Commits en français, format conventional commits (les trois repos ont un hook `commit-msg`).
- Code en anglais, libellés d'interface et documentation en français.
- Le lien d'activation `{APP_URL}/activate?token={token}` doit rester présent dans le SMS et l'email : la PWA AgriPilot en dépend.
- `backoffice-activation-email.ts` ne doit pas être modifié.
- Le token d'activation est une chaîne hexadécimale de 12 caractères (`crypto.randomBytes(6).toString('hex')`).
- `agripilot-backoffice-front` n'a ni jsdom ni Testing Library : aucun test de composant n'y est écrit, la vérification passe par `npm run lint` et `npm run build`.

---

### Task 1: Helper `coerceDate` et lecture tolérante du token (API)

Répare le blocage principal : `auth.service.ts` appelle `.toDate()` sur une valeur qui est une string ISO pour tout compte créé via `POST /farmers` ou `POST /engineers`.

**Files:**
- Create: `agripilot-backoffice-api/src/common/date.util.ts`
- Test: `agripilot-backoffice-api/src/common/date.util.spec.ts`
- Modify: `agripilot-backoffice-api/src/auth/auth.service.ts` (lignes 21-23, 277, 325, 394)

**Interfaces:**
- Consumes: rien.
- Produces: `coerceDate(value: unknown): Date | null` exporté depuis `src/common/date.util.ts`. Utilisé uniquement par la Task 1 ; les autres tâches ne s'appuient pas dessus.

- [ ] **Step 1: Write the failing test**

Créer `agripilot-backoffice-api/src/common/date.util.spec.ts` :

```typescript
import { coerceDate } from './date.util';

describe('coerceDate', () => {
  it('accepte un Timestamp Firestore', () => {
    const d = new Date('2026-07-22T10:00:00.000Z');
    const ts = { toDate: () => d };
    expect(coerceDate(ts)?.toISOString()).toBe(d.toISOString());
  });

  it('accepte une string ISO', () => {
    expect(coerceDate('2026-07-22T10:00:00.000Z')?.toISOString()).toBe(
      '2026-07-22T10:00:00.000Z',
    );
  });

  it('accepte un Date', () => {
    const d = new Date('2026-07-22T10:00:00.000Z');
    expect(coerceDate(d)?.toISOString()).toBe(d.toISOString());
  });

  it('renvoie null sur une valeur absente ou illisible', () => {
    expect(coerceDate(undefined)).toBeNull();
    expect(coerceDate(null)).toBeNull();
    expect(coerceDate('pas une date')).toBeNull();
    expect(coerceDate(42)).toBeNull();
    expect(coerceDate({})).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd agripilot-backoffice-api && npx jest src/common/date.util.spec.ts
```

Attendu : ÉCHEC — `Cannot find module './date.util'`.

- [ ] **Step 3: Write minimal implementation**

Créer `agripilot-backoffice-api/src/common/date.util.ts` :

```typescript
/**
 * Normalise une date lue depuis Firestore.
 *
 * Les documents `users` portent `activationExpires` sous deux formes selon
 * l'écrivain : un Timestamp Firestore (users.service) ou une string ISO
 * (farmers.service / engineers.service, conséquence du JSON.parse(JSON.stringify)).
 * Renvoie null si la valeur est absente ou illisible — l'appelant traite alors
 * le jeton comme expiré.
 */
export function coerceDate(value: unknown): Date | null {
  if (!value) return null;

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (typeof value === 'string') {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  if (
    typeof value === 'object' &&
    'toDate' in value &&
    typeof (value as { toDate: unknown }).toDate === 'function'
  ) {
    const parsed = (value as { toDate: () => Date }).toDate();
    return parsed instanceof Date && !Number.isNaN(parsed.getTime())
      ? parsed
      : null;
  }

  return null;
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd agripilot-backoffice-api && npx jest src/common/date.util.spec.ts
```

Attendu : PASS, 4 tests.

- [ ] **Step 5: Brancher le helper dans `auth.service.ts`**

Ajouter l'import en tête de fichier, à la suite des imports existants :

```typescript
import { coerceDate } from '../common/date.util';
```

Élargir le type du champ dans l'interface `UserDocument` (ligne 37) pour refléter la réalité de la base :

```typescript
  activationExpires?: FirestoreTimestamp | string;
```

Remplacer les **trois** occurrences identiques (lignes 277, 325, 394) :

```typescript
    const expires = userData.activationExpires?.toDate();
```

par :

```typescript
    const expires = coerceDate(userData.activationExpires);
```

La ligne suivante, `if (!expires || expires < new Date())`, est déjà correcte et reste inchangée : `coerceDate` renvoyant `null` sur une valeur illisible, le jeton est traité comme expiré.

- [ ] **Step 6: Vérifier la compilation et la suite de tests**

```bash
cd agripilot-backoffice-api && npm run build && npm test
```

Attendu : build sans erreur, suite de tests verte.

- [ ] **Step 7: Commit**

```bash
cd agripilot-backoffice-api
git add src/common/date.util.ts src/common/date.util.spec.ts src/auth/auth.service.ts
git commit -m "fix(auth): tolere les deux formats de activationExpires"
```

---

### Task 2: Écriture normalisée de `activationExpires` (API)

Tarit la source du bug : les deux services d'écriture posent désormais un vrai `Date`, converti en Timestamp par Firestore.

**Files:**
- Modify: `agripilot-backoffice-api/src/farmers/farmers.service.ts` (autour de la ligne 620)
- Modify: `agripilot-backoffice-api/src/engineers/engineers.service.ts` (autour de la ligne 347)

**Interfaces:**
- Consumes: rien (la lecture tolérante de la Task 1 couvre les deux formats, ces deux tâches sont indépendantes).
- Produces: rien de consommé par une autre tâche.

- [ ] **Step 1: Corriger `farmers.service.ts`**

Le problème : `activationExpires` est placé à l'intérieur du `JSON.parse(JSON.stringify(...))`, qui sérialise tout `Date` en string. Il faut donc l'ajouter **après** la copie.

Dans `create()`, retirer la ligne `activationExpires: activationExpires.toISOString(),` de l'objet passé à `JSON.stringify`, puis affecter le champ sur l'objet résultant. Le bloc devient :

```typescript
    const userData = JSON.parse(
      JSON.stringify({
        email: dto.email,
        phone: dto.phone,
        firstName: dto.firstName,
        lastName: dto.lastName,
        displayName,
        photoURL: dto.photoURL,
        dateOfBirth: dto.dateOfBirth,
        gender: dto.gender,
        role: UserRole.FARMER,
        status: UserStatus.PENDING,
        accessTier: ACCESS_TIER.FULL, // farmer créé backoffice = plein droit
        partnerId: dto.partnerId,
        languagePreference: dto.languagePreference || 'fr',
        notificationSettings: dto.notificationSettings,
        activationToken,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      }),
    ) as Record<string, unknown>;

    // Hors du JSON round-trip : Firestore doit recevoir un Date pour le
    // convertir en Timestamp, sinon la lecture `.toDate()` côté auth échoue.
    userData.activationExpires = activationExpires;
```

**Note :** la ligne `accessTier: ACCESS_TIER.FULL` n'existe que sur la branche `feature/farmer-access-tier`, non mergée. Sur `main`, elle est absente — recopier le bloc **tel qu'il est dans le fichier**, en n'appliquant que le déplacement de `activationExpires`.

- [ ] **Step 2: Corriger `engineers.service.ts`**

Appliquer exactement la même transformation dans la fonction de création d'ingénieur : retirer `activationExpires: activationExpires.toISOString(),` de l'objet sérialisé, puis ajouter après le bloc :

```typescript
    // Hors du JSON round-trip : Firestore doit recevoir un Date pour le
    // convertir en Timestamp, sinon la lecture `.toDate()` côté auth échoue.
    userData.activationExpires = activationExpires;
```

Vérifier que la variable locale contenant l'objet s'appelle bien `userData` ; si elle porte un autre nom dans ce fichier, adapter.

- [ ] **Step 3: Vérifier la compilation**

```bash
cd agripilot-backoffice-api && npm run build && npm test
```

Attendu : build sans erreur, suite de tests verte.

- [ ] **Step 4: Commit**

```bash
cd agripilot-backoffice-api
git add src/farmers/farmers.service.ts src/engineers/engineers.service.ts
git commit -m "fix(users): ecrit activationExpires en Timestamp a la creation"
```

---

### Task 3: Code d'activation dans le SMS et WhatsApp (API)

**Files:**
- Modify: `agripilot-backoffice-api/src/notifications/notifications.service.ts` (lignes 91-123)
- Modify: `agripilot-backoffice-api/src/users/users.service.ts` (appel `sendActivationLink`, autour de la ligne 578)

**Interfaces:**
- Consumes: rien.
- Produces: `sendActivationLink(recipient: string, activationLink: string, channel: NotificationChannel, firstName?: string, activationCode?: string): Promise<NotificationResult>` — le 5ᵉ paramètre est optionnel, donc l'appel existant depuis `sendBackofficeActivationLink` et tout autre appelant reste valide sans modification. La Task 4 ajoutera l'usage de `activationCode` côté email.

- [ ] **Step 1: Étendre la signature de `sendActivationLink`**

Dans `notifications.service.ts`, ajouter le paramètre en dernière position :

```typescript
  async sendActivationLink(
    recipient: string,
    activationLink: string,
    channel: NotificationChannel,
    firstName?: string,
    activationCode?: string,
  ): Promise<NotificationResult> {
```

- [ ] **Step 2: Injecter le code dans le message SMS/WhatsApp**

Remplacer les lignes 115-116 :

```typescript
    const greeting = firstName ? `Bonjour ${firstName}` : 'Bonjour';
    const message = `${greeting}, activez votre compte Kumy AgriPilot: ${activationLink}`;
```

par :

```typescript
    const greeting = firstName ? `Bonjour ${firstName}` : 'Bonjour';
    // Le code permet la saisie manuelle dans l'app Kumy (pas de deep link) ;
    // le lien reste indispensable à l'activation web de la PWA AgriPilot.
    const message = activationCode
      ? `${greeting}, votre code Kumy : ${activationCode}. Ou activez ici : ${activationLink}`
      : `${greeting}, activez votre compte Kumy AgriPilot: ${activationLink}`;
```

- [ ] **Step 3: Passer le code depuis `users.service.ts`**

Dans `sendActivation()`, la variable `activationToken` est déjà en portée (elle vient d'être générée). Compléter l'appel dans la branche `else` :

```typescript
      result = await this.notificationsService.sendActivationLink(
        recipient,
        activationLink,
        sendActivationDto.channel,
        firstName,
        activationToken,
      );
```

L'appel à `sendBackofficeActivationLink` dans la branche `if` reste inchangé.

- [ ] **Step 4: Vérifier la compilation**

```bash
cd agripilot-backoffice-api && npm run build && npm test
```

Attendu : build sans erreur, suite de tests verte.

- [ ] **Step 5: Commit**

```bash
cd agripilot-backoffice-api
git add src/notifications/notifications.service.ts src/users/users.service.ts
git commit -m "feat(notifications): ajoute le code d activation dans le SMS"
```

---

### Task 4: Code d'activation dans l'email (API)

**Files:**
- Modify: `agripilot-backoffice-api/src/notifications/templates/activation-email.ts`
- Modify: `agripilot-backoffice-api/src/notifications/notifications.service.ts` (branche email, lignes 97-113)

**Interfaces:**
- Consumes: le paramètre `activationCode` de `sendActivationLink` ajouté en Task 3.
- Produces: `renderActivationEmail({ firstName, activationLink, appUrl, activationCode })` — `activationCode` optionnel.

- [ ] **Step 1: Étendre les props du template**

Dans `activation-email.ts`, ajouter le champ à l'interface (ligne 21) :

```typescript
interface ActivationEmailProps {
  firstName?: string;
  activationLink: string;
  appUrl: string;
  activationCode?: string;
}
```

et à la déstructuration du composant (ligne 27) :

```typescript
function ActivationEmail({
  firstName,
  activationLink,
  appUrl,
  activationCode,
}: ActivationEmailProps) {
```

- [ ] **Step 2: Afficher le code au-dessus du bouton**

Dans la `Section` de contenu, insérer le bloc entre le `Text` d'introduction et le `buttonSection`. Le rendu utilise `React.createElement` via l'alias `e`, comme le reste du fichier :

```typescript
          activationCode
            ? e(
                Section,
                { style: codeSection },
                e(
                  Text,
                  { style: codeLabel },
                  "Votre code d'activation pour l'application Kumy :",
                ),
                e(Text, { style: codeValue }, activationCode),
              )
            : null,
```

Ajouter les trois styles à la suite de `buttonSection` (vers la ligne 172) :

```typescript
const codeSection: React.CSSProperties = {
  backgroundColor: '#f4f4f5',
  borderRadius: '6px',
  margin: '24px 0',
  padding: '16px',
  textAlign: 'center' as const,
};

const codeLabel: React.CSSProperties = {
  color: '#71717a',
  fontSize: '13px',
  lineHeight: '20px',
  margin: '0 0 8px',
};

const codeValue: React.CSSProperties = {
  color: '#27272a',
  fontFamily: 'monospace',
  fontSize: '22px',
  fontWeight: '700',
  letterSpacing: '2px',
  margin: '0',
};
```

- [ ] **Step 3: Passer le code depuis le service**

Dans `notifications.service.ts`, branche email :

```typescript
      const html = await renderActivationEmail({
        firstName,
        activationLink,
        appUrl,
        activationCode,
      });
```

- [ ] **Step 4: Vérifier la compilation**

```bash
cd agripilot-backoffice-api && npm run build && npm test
```

Attendu : build sans erreur, suite de tests verte.

- [ ] **Step 5: Commit**

```bash
cd agripilot-backoffice-api
git add src/notifications/templates/activation-email.ts src/notifications/notifications.service.ts
git commit -m "feat(notifications): affiche le code d activation dans l email"
```

---

### Task 5: Mutualiser `SendActivationDialog` (backoffice front)

Le composant ne contient rien de spécifique aux ingénieurs : il reçoit `userName` et `userTypeLabel` en props. Il rejoint `features/common/`, où réside déjà `ConfirmDeleteDialog`.

**Files:**
- Move: `agripilot-backoffice-front/src/features/engineers/components/SendActivationDialog.tsx` → `agripilot-backoffice-front/src/features/common/SendActivationDialog.tsx`
- Modify: `agripilot-backoffice-front/src/features/engineers/EngineersList.tsx` (lignes 41-42)
- Modify: `agripilot-backoffice-front/src/features/engineers/components/AddEngineer.tsx` (ligne 5)

**Interfaces:**
- Consumes: rien.
- Produces: `SendActivationDialog` et `ActivationMethod` exportés depuis `@/features/common/SendActivationDialog`. Props inchangées : `{ open: boolean, onClose: () => void, onConfirm: (method: ActivationMethod) => void, userName: string, userTypeLabel?: string, isLoading?: boolean }`. `ActivationMethod` vaut `"email" | "sms" | "whatsapp"`. Consommé par les Tasks 6 et 7.

- [ ] **Step 1: Déplacer le fichier**

```bash
cd agripilot-backoffice-front
git mv src/features/engineers/components/SendActivationDialog.tsx src/features/common/SendActivationDialog.tsx
```

Le contenu du fichier n'est pas modifié : il n'a aucun import relatif vers `features/engineers`.

- [ ] **Step 2: Mettre à jour les imports côté ingénieurs**

Dans `EngineersList.tsx`, remplacer les lignes 41-42 :

```typescript
import { SendActivationDialog } from "../common/SendActivationDialog";
import type { ActivationMethod } from "../common/SendActivationDialog";
```

Dans `AddEngineer.tsx`, remplacer la ligne 5 :

```typescript
import { SendActivationDialog, ActivationMethod } from "@/features/common/SendActivationDialog";
```

- [ ] **Step 3: Vérifier qu'aucun import ne pointe plus vers l'ancien chemin**

```bash
cd agripilot-backoffice-front && grep -rn "engineers/components/SendActivationDialog\|./SendActivationDialog" src
```

Attendu : aucune sortie.

- [ ] **Step 4: Vérifier lint et build**

```bash
cd agripilot-backoffice-front && npm run lint && npm run build
```

Attendu : les deux commandes passent sans erreur.

- [ ] **Step 5: Commit**

```bash
cd agripilot-backoffice-front
git add src/features/common/SendActivationDialog.tsx src/features/engineers/EngineersList.tsx src/features/engineers/components/AddEngineer.tsx
git commit -m "refactor(activation): mutualise SendActivationDialog dans features/common"
```

---

### Task 6: Action « Envoyer l'invitation » dans la liste des agriculteurs

**Files:**
- Modify: `agripilot-backoffice-front/src/features/farmers/hooks/useFarmers.ts` (type `Farmer`)
- Modify: `agripilot-backoffice-front/src/features/farmers/FarmersList.tsx`

**Interfaces:**
- Consumes: `SendActivationDialog` et `ActivationMethod` depuis `@/features/common/SendActivationDialog` (Task 5) ; `useSendActivation` depuis `@/features/users/hooks/useUsers`, dont la signature est `mutate({ uid: string, channel: string })`.
- Produces: `Farmer.status?: string` — valeurs observées `"pending"` et `"active"`, renvoyées par `GET /farmers` (`farmers.service.ts:268`). Utilisé uniquement dans cette tâche.

- [ ] **Step 1: Ajouter `status` au type `Farmer`**

Dans `useFarmers.ts`, dans le type `Farmer`, ajouter le champ à la suite de `role` :

```typescript
  /** Statut du compte utilisateur : "pending" tant que l'invitation n'a pas été acceptée. */
  status?: string;
```

- [ ] **Step 2: Ajouter les imports dans `FarmersList.tsx`**

Ajouter l'icône au bloc `@mui/icons-material` existant :

```typescript
  Send as SendIcon,
```

Ajouter après l'import de `ConfirmDeleteDialog` :

```typescript
import { SendActivationDialog } from "../common/SendActivationDialog";
import type { ActivationMethod } from "../common/SendActivationDialog";
import { useSendActivation } from "@/features/users/hooks/useUsers";
```

Ajouter `Tooltip` à la liste des imports `@mui/material`.

- [ ] **Step 3: Ajouter le state et les handlers**

Après la déclaration `const [farmerToDelete, setFarmerToDelete] = useState<Farmer | null>(null);` :

```typescript
  const sendActivation = useSendActivation();
  const [isActivationDialogOpen, setIsActivationDialogOpen] = useState(false);
  const [farmerToActivate, setFarmerToActivate] = useState<Farmer | null>(null);

  const handleActivationClick = (farmer: Farmer) => {
    setFarmerToActivate(farmer);
    setIsActivationDialogOpen(true);
  };

  const handleCloseActivationDialog = () => {
    setIsActivationDialogOpen(false);
    setFarmerToActivate(null);
  };

  const handleConfirmActivation = (method: ActivationMethod) => {
    if (!farmerToActivate) return;
    sendActivation.mutate(
      { uid: farmerToActivate.userId, channel: method },
      {
        onSuccess: () => {
          showNotification("L'invitation a été envoyée avec succès", "success");
          handleCloseActivationDialog();
        },
        onError: () => {
          showNotification("Erreur lors de l'envoi de l'invitation", "error");
        },
      },
    );
  };
```

- [ ] **Step 4: Ajouter le bouton dans la colonne actions**

Dans le `<Stack direction="row" spacing={1} justifyContent="flex-end">` de la cellule d'actions, insérer **avant** l'`IconButton` d'édition :

```tsx
                        {farmer.status !== "active" && (
                          <Tooltip
                            title={farmer.status === "pending" ? "Renvoyer l'invitation" : "Envoyer l'invitation"}
                          >
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleActivationClick(farmer);
                              }}
                              sx={{
                                color: "info.main",
                                bgcolor: "rgba(2, 132, 199, 0.06)",
                                "&:hover": { bgcolor: "info.main", color: "white" },
                                transition: "all 0.2s",
                              }}
                            >
                              <SendIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
```

L'action est masquée sur un compte actif : l'API accepterait le renvoi, mais régénérer le token invaliderait un compte déjà utilisable.

- [ ] **Step 5: Monter le dialogue**

À la suite de `<ConfirmDeleteDialog ... />`, avant la fermeture du composant :

```tsx
      <SendActivationDialog
        open={isActivationDialogOpen}
        onClose={handleCloseActivationDialog}
        onConfirm={handleConfirmActivation}
        userName={farmerToActivate ? `${farmerToActivate.firstName} ${farmerToActivate.lastName}` : ""}
        userTypeLabel="à l'agriculteur"
        isLoading={sendActivation.isPending}
      />
```

- [ ] **Step 6: Vérifier lint et build**

```bash
cd agripilot-backoffice-front && npm run lint && npm run build
```

Attendu : les deux commandes passent sans erreur.

- [ ] **Step 7: Commit**

```bash
cd agripilot-backoffice-front
git add src/features/farmers/FarmersList.tsx src/features/farmers/hooks/useFarmers.ts
git commit -m "feat(farmers): envoie l invitation depuis la liste des agriculteurs"
```

---

### Task 7: Proposer l'invitation juste après la création d'un agriculteur

**Files:**
- Modify: `agripilot-backoffice-front/src/features/farmers/components/FarmerBasicInfo.tsx` (lignes 82 et 208-212)
- Modify: `agripilot-backoffice-front/src/features/farmers/components/AddFarmer.tsx`

**Interfaces:**
- Consumes: `SendActivationDialog` et `ActivationMethod` depuis `@/features/common/SendActivationDialog` (Task 5) ; `useSendActivation` depuis `@/features/users/hooks/useUsers`.
- Produces: `FarmerBasicInfo` appelle désormais `onSuccess(uid: string, fullName: string)` — second paramètre ajouté, aligné sur `EngineerBasicInfo`.

- [ ] **Step 1: Faire remonter le nom complet depuis `FarmerBasicInfo`**

Ligne 82, élargir la prop :

```typescript
  onSuccess?: (uid: string, fullName: string) => void;
```

Dans `handleFormSubmit`, la callback de création devient :

```typescript
        onSuccess: (response) => {
          showNotification("Utilisateur créé avec succès", "success");
          if (onSuccess && response.userId) {
            onSuccess(response.userId, `${data.firstName} ${data.lastName}`);
          }
        },
```

- [ ] **Step 2: Réécrire `AddFarmer.tsx`**

Le fichier complet après modification :

```tsx
import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Box, Paper, Tab, Tabs, Container } from "@mui/material";
import { FarmerBasicInfo } from "./FarmerBasicInfo";
import { NavigationButton } from "@/features/users/components/UserDetailShared";
import { SendActivationDialog, ActivationMethod } from "@/features/common/SendActivationDialog";
import { useSendActivation } from "@/features/users/hooks/useUsers";
import { useNotificationStore } from "@stores/useNotificationStore";

export const AddFarmer = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = parseInt(searchParams.get("tab") || "0", 10);
  const [createdUserId, setCreatedUserId] = useState<string>("");
  const [createdUserFullName, setCreatedUserFullName] = useState("");
  const [isActivationDialogOpen, setIsActivationDialogOpen] = useState(false);
  const showNotification = useNotificationStore((state) => state.showNotification);
  const { mutate: sendActivation, isPending: isSendingActivation } = useSendActivation();

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setSearchParams({ tab: newValue.toString() });
  };

  const handleCreationSuccess = (userId: string, fullName: string) => {
    setCreatedUserId(userId);
    setCreatedUserFullName(fullName);
    setIsActivationDialogOpen(true);
  };

  const goToDetails = (userId: string) => {
    setSearchParams({ tab: "1" });
    navigate(`/farmers/${userId}/edit?tab=1`);
  };

  const handleCloseActivationDialog = () => {
    setIsActivationDialogOpen(false);
    if (createdUserId) goToDetails(createdUserId);
  };

  const handleSendActivation = (method: ActivationMethod) => {
    if (!createdUserId) return;
    sendActivation(
      { uid: createdUserId, channel: method },
      {
        onSuccess: () => {
          showNotification(`L'invitation a été envoyée par ${method} avec succès`, "success");
          setIsActivationDialogOpen(false);
          goToDetails(createdUserId);
        },
        onError: () => {
          showNotification("Erreur lors de l'envoi de l'invitation", "error");
        },
      },
    );
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <NavigationButton />
      <Paper elevation={0} sx={{ p: 4, borderRadius: 1, border: "1px solid", borderColor: "divider" }}>
        <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 4 }}>
          <Tabs value={activeTab} onChange={handleTabChange} sx={{ "& .MuiTab-root": { fontWeight: 700, px: 4 } }}>
            <Tab label="Informations Générales" />
            <Tab label="Détails Agriculteur" disabled={!createdUserId} />
          </Tabs>
        </Box>

        <Box sx={{ display: activeTab === 0 ? "block" : "none" }}>
          <FarmerBasicInfo isAdding={!createdUserId} onSuccess={handleCreationSuccess} />
        </Box>
      </Paper>

      {createdUserId && (
        <SendActivationDialog
          open={isActivationDialogOpen}
          onClose={handleCloseActivationDialog}
          onConfirm={handleSendActivation}
          userName={createdUserFullName}
          userTypeLabel="à l'agriculteur"
          isLoading={isSendingActivation}
        />
      )}
    </Container>
  );
};
```

Fermer le dialogue sans envoyer redirige quand même vers l'onglet de détail : l'invitation reste disponible depuis la liste (Task 6).

- [ ] **Step 3: Vérifier lint et build**

```bash
cd agripilot-backoffice-front && npm run lint && npm run build
```

Attendu : les deux commandes passent sans erreur.

- [ ] **Step 4: Commit**

```bash
cd agripilot-backoffice-front
git add src/features/farmers/components/AddFarmer.tsx src/features/farmers/components/FarmerBasicInfo.tsx
git commit -m "feat(farmers): propose l envoi de l invitation apres creation"
```

---

### Task 8: Tolérer une URL collée dans l'écran code d'invitation (app Kumy)

Le SMS contient un code **et** un lien. L'agriculteur peut coller le message entier, coller l'URL, ou taper les 12 caractères.

**Files:**
- Create: `kumy-farmer-app/src/features/Onboarding/invitationCode.util.ts`
- Test: `kumy-farmer-app/src/features/Onboarding/invitationCode.util.test.ts`
- Modify: `kumy-farmer-app/src/features/Onboarding/pages/InvitationCodePage.tsx` (lignes 16-26, 81)

**Interfaces:**
- Consumes: rien.
- Produces: `extractInvitationCode(input: string): string` exporté depuis `src/features/Onboarding/invitationCode.util.ts`. Renvoie une chaîne vide sur une saisie vide ; sinon, si aucun motif reconnu ne matche, renvoie la saisie brute (nettoyée) telle quelle — un `''` ferait paraître le bouton inerte à cause du garde `if (!trimmed) return;` côté formulaire, alors que laisser passer la saisie déclenche un rejet explicite côté API.

- [ ] **Step 1: Write the failing test**

Créer `kumy-farmer-app/src/features/Onboarding/invitationCode.util.test.ts` :

```typescript
import { describe, expect, it } from 'vitest';

import { extractInvitationCode } from './invitationCode.util';

describe('extractInvitationCode', () => {
  it('accepte un code nu', () => {
    expect(extractInvitationCode('a3f9c1d20b7e')).toBe('a3f9c1d20b7e');
  });

  it('normalise la casse et les espaces', () => {
    expect(extractInvitationCode('  A3F9C1D20B7E ')).toBe('a3f9c1d20b7e');
  });

  it('extrait le code d une URL d activation', () => {
    expect(extractInvitationCode('https://agripilot.kumy.app/activate?token=a3f9c1d20b7e')).toBe(
      'a3f9c1d20b7e',
    );
  });

  it('extrait le code d un SMS colle en entier', () => {
    const sms =
      'Bonjour Mamadou, votre code Kumy : a3f9c1d20b7e. Ou activez ici : https://agripilot.kumy.app/activate?token=a3f9c1d20b7e';
    expect(extractInvitationCode(sms)).toBe('a3f9c1d20b7e');
  });

  it('renvoie une chaine vide sur une entree vide', () => {
    expect(extractInvitationCode('   ')).toBe('');
  });

  it('laisse passer une saisie non reconnue', () => {
    expect(extractInvitationCode('bonjour')).toBe('bonjour');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd kumy-farmer-app && npx vitest run src/features/Onboarding/invitationCode.util.test.ts
```

Attendu : ÉCHEC — module `./invitationCode.util` introuvable.

- [ ] **Step 3: Write minimal implementation**

Créer `kumy-farmer-app/src/features/Onboarding/invitationCode.util.ts` :

```typescript
/**
 * Extrait le code d'invitation d'une saisie utilisateur.
 *
 * L'app n'a pas de deep link : l'agriculteur recopie le code, colle l'URL
 * d'activation, ou colle le SMS entier. Les trois formes sont acceptées.
 * Le code est une chaîne hexadécimale de 12 caractères.
 *
 * Si aucun motif ne correspond, la saisie brute (nettoyée) est renvoyée
 * telle quelle plutôt qu'une chaîne vide : le formulaire ne soumet que sur
 * une saisie non vide (`if (!trimmed) return;`), donc renvoyer '' ferait
 * paraître le bouton inerte. La saisie part à l'API, qui répond « code
 * invalide » — un échec explicite plutôt qu'un silence.
 */
const TOKEN_IN_URL = /token=([0-9a-fA-F]{12})/;
const BARE_TOKEN = /\b([0-9a-fA-F]{12})\b/;

export function extractInvitationCode(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return '';

  const fromUrl = TOKEN_IN_URL.exec(trimmed);
  if (fromUrl) return fromUrl[1].toLowerCase();

  const bare = BARE_TOKEN.exec(trimmed);
  if (bare) return bare[1].toLowerCase();

  return trimmed.toLowerCase();
}
```

L'ordre compte : sur un SMS collé, le code apparaît avant l'URL, mais c'est bien la forme `token=` qu'on privilégie car elle est sans ambiguïté.

- [ ] **Step 4: Run test to verify it passes**

```bash
cd kumy-farmer-app && npx vitest run src/features/Onboarding/invitationCode.util.test.ts
```

Attendu : PASS, 6 tests.

- [ ] **Step 5: Brancher la fonction dans la page**

Dans `InvitationCodePage.tsx`, ajouter l'import :

```typescript
import { extractInvitationCode } from '@/features/Onboarding/invitationCode.util';
```

Remplacer les lignes 17-18 :

```typescript
    const trimmed = extractInvitationCode(code);
    if (!trimmed) return;
```

La variable `trimmed` reste utilisée telle quelle aux lignes 23 et 26 — aucun autre changement dans `handleSubmit`.

Adapter aussi le libellé d'aide (ligne 57) pour refléter la tolérance :

```tsx
        <Typography color="text.secondary">
          Saisissez le code reçu par SMS, ou collez le message entier
        </Typography>
```

La condition `disabled={!code.trim() || isSubmitting}` (ligne 81) reste inchangée : elle porte sur la saisie brute, pas sur le code extrait.

- [ ] **Step 6: Vérifier la suite complète**

```bash
cd kumy-farmer-app && npm run lint && npm test && npm run build
```

Attendu : lint propre, tous les tests verts (les 14 existants plus les 5 nouveaux), build produisant `dist/`.

- [ ] **Step 7: Commit**

```bash
cd kumy-farmer-app
git add src/features/Onboarding/invitationCode.util.ts src/features/Onboarding/invitationCode.util.test.ts src/features/Onboarding/pages/InvitationCodePage.tsx
git commit -m "feat(onboarding): accepte une URL ou un SMS colle comme code d invitation"
```

---

## Vérification finale

- [ ] **API :** `cd agripilot-backoffice-api && npm run lint && npm run build && npm test`
- [ ] **Backoffice front :** `cd agripilot-backoffice-front && npm run lint && npm run build`
- [ ] **App Kumy :** `cd kumy-farmer-app && npm run lint && npm test && npm run build`
- [ ] **Les trois branches sont bien sur `feature/farmer-invitation`** : `for r in agripilot-backoffice-api agripilot-backoffice-front kumy-farmer-app; do git -C $r branch --show-current; done`

## Suivi manuel (hors plan)

Le parcours de bout en bout ne peut pas être automatisé ici : ni compte live ni numéro de test. À dérouler après déploiement en dev :

1. Créer un agriculteur au backoffice, envoyer l'invitation par SMS.
2. Vérifier la réception du message et la présence du code.
3. Saisir le code dans l'app Kumy, puis recommencer en collant le SMS entier.
4. Vérifier que le compte passe à `status: "active"` et que la session s'ouvre.

C'est la seule vérification qui prouve que la chaîne complète fonctionne ; les commandes ci-dessus n'attestent que de l'absence de régression locale.
