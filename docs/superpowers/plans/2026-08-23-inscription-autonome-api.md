# Inscription autonome — Partie API Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ouvrir dans `agripilot-backoffice-api` les quatre endpoints publics qui permettent à un agriculteur de créer son compte à partir de son seul numéro de téléphone, sans invitation.

**Architecture :** un sous-dossier `src/auth/phone-registration/` (même patron que `src/auth/federated/` : contrôleur + services + DTO propres au parcours) porte l'OTP et l'inscription. Deux collections Firestore nouvelles — `phone_otps/{msisdn}` et `registration_tokens/{empreinte}` — tiennent l'état éphémère ; aucune n'stocke de secret en clair. La création de compte réutilise les briques existantes (`FarmersService.createMinimalProfile`, convention `<msisdn>@agripilot.phone`, `NotificationsService.send({channel:'sms'})`).

**Tech Stack :** NestJS 11, `firebase-admin` 13, `class-validator`, Jest + ts-jest (tests unitaires avec doubles Firestore faits main — pas d'émulateur), Node `crypto`.

**Spec :** `docs/superpowers/specs/2026-08-23-creation-de-compte-design.md` (dépôt `kumy-farmer-app`)

**Dépôt de travail :** `/Users/thierno/Documents/Projects/kumy/agripilot-backoffice-api`
**Plan jumeau :** `2026-08-23-inscription-autonome-front.md` (dépôt `kumy-farmer-app`) — à exécuter APRÈS celui-ci, il consomme ce contrat.

## Global Constraints

Valeurs arrêtées par la spec, à reprendre telles quelles :

- Code OTP : **6 chiffres**, tiré d'un générateur **cryptographique** (`crypto.randomInt`).
- Validité du code : **5 minutes**.
- Tentatives de vérification : **5**, puis le code est invalidé.
- Renvoi : **1 par minute**, **5 par heure et par numéro**.
- Stockage : **empreinte** du code, **jamais le code en clair**.
- `registrationToken` : **15 minutes**, **usage unique**, **lié au numéro vérifié**.
- `POST /auth/phone/otp` **répond toujours 200** pour un numéro inconnu — aucune réponse différenciée qui révélerait qui est inscrit. (Le plafond horaire, lui, répond 429 : il parle du débit de l'appelant, pas du titulaire du numéro.)
- Format téléphone : **E.164** (`+224621234567`). E-mail Firebase fictif : `<msisdn sans +>@agripilot.phone`.
- L'inscription autonome crée **utilisateur + fiche agriculteur allégée**, **sans `partnerId` ni technicien**, avec `accessTier: 'simulation'`.
- District et coordonnées GPS **volontairement non collectés**.
- Langue : documentation et messages de commit en **français**, code en **anglais**. Commits conventionnels (`feat(auth): ...`).
- Commandes de vérification : `npm test`, `npm run lint`, `npm run build`.

## Structure des fichiers

**Créés** — `src/auth/phone-registration/` :

| Fichier | Responsabilité |
|---|---|
| `otp.constants.ts` | Les valeurs de la spec, en un seul endroit |
| `otp.util.ts` | Génération du code, empreintes HMAC, comparaison à temps constant, id de document |
| `otp.util.spec.ts` | Tests des utilitaires (calcul pur) |
| `phone-otp.service.ts` | Envoi du code (plafonds) et vérification (tentatives, aiguillage, jeton) |
| `phone-otp.service.spec.ts` | Tests d'envoi et de vérification |
| `phone-registration.service.ts` | Consommation du jeton, création/reprise du compte, fiche agriculteur |
| `phone-registration.service.spec.ts` | Tests de création, rejeu, doublon |
| `phone-registration.controller.ts` | Les trois routes `POST /auth/phone/*` |
| `dto/send-otp.dto.ts` | `SendOtpDto`, `SendOtpResponseDto` |
| `dto/verify-otp.dto.ts` | `VerifyOtpDto`, `VerifyOtpResponseDto`, `VerifiedAccountDto`, `PrefilledProfileDto` |
| `dto/register-by-phone.dto.ts` | `RegisterByPhoneDto`, `RegisterByPhoneResponseDto` |

**Modifiés :**

| Fichier | Changement |
|---|---|
| `src/auth/auth.module.ts` | Enregistre le contrôleur, les deux services, importe `NotificationsModule` et `FarmersModule` |
| `src/sous-prefectures/sous-prefectures.controller.ts` | `@Public()` sur `GET /` |
| `src/farmers/farmers.controller.ts` | Ajoute `GET :id/account-state` |
| `src/farmers/farmers.service.ts` | Ajoute `getAccountState()` |
| `src/farmers/dto/farmer-account-state.dto.ts` | *(créé)* `FarmerAccountStateDto` |

---

### Task 1 : Constantes et utilitaires OTP

Le calcul pur d'abord : sans état, sans Firestore, entièrement testable.

**Files:**
- Create: `src/auth/phone-registration/otp.constants.ts`
- Create: `src/auth/phone-registration/otp.util.ts`
- Test: `src/auth/phone-registration/otp.util.spec.ts`

**Interfaces:**
- Consumes: rien.
- Produces:
  - `OTP_LENGTH: number`, `OTP_TTL_MS: number`, `OTP_MAX_ATTEMPTS: number`, `OTP_RESEND_COOLDOWN_MS: number`, `OTP_HOURLY_SEND_LIMIT: number`, `OTP_HOURLY_WINDOW_MS: number`, `REGISTRATION_TOKEN_TTL_MS: number`, `OTP_COLLECTION: string`, `REGISTRATION_TOKEN_COLLECTION: string`
  - `phoneToDocId(phone: string): string`
  - `generateOtpCode(): string`
  - `hashOtpCode(code: string, phone: string, secret: string): string`
  - `hashesMatch(a: string, b: string): boolean`
  - `generateRegistrationToken(): string`
  - `hashRegistrationToken(token: string, secret: string): string`

- [ ] **Step 1 : Écrire le test qui échoue**

Créer `src/auth/phone-registration/otp.util.spec.ts` :

```ts
import {
  generateOtpCode,
  generateRegistrationToken,
  hashesMatch,
  hashOtpCode,
  hashRegistrationToken,
  phoneToDocId,
} from './otp.util';

describe('otp.util', () => {
  it('produit un code de 6 chiffres, zéros de tête compris', () => {
    for (let i = 0; i < 200; i += 1) {
      expect(generateOtpCode()).toMatch(/^\d{6}$/);
    }
  });

  it('dérive un identifiant de document sans le +', () => {
    expect(phoneToDocId('+224622201362')).toBe('224622201362');
  });

  it('sale l empreinte par le numéro : même code, deux numéros, deux empreintes', () => {
    const a = hashOtpCode('123456', '+224622201362', 'pepper');
    const b = hashOtpCode('123456', '+224622201363', 'pepper');
    expect(a).not.toBe(b);
  });

  it('sale l empreinte par le secret de déploiement', () => {
    const a = hashOtpCode('123456', '+224622201362', 'pepper-a');
    const b = hashOtpCode('123456', '+224622201362', 'pepper-b');
    expect(a).not.toBe(b);
  });

  it('ne laisse jamais le code en clair dans son empreinte', () => {
    expect(hashOtpCode('123456', '+224622201362', 'pepper')).not.toContain('123456');
  });

  it('compare deux empreintes identiques', () => {
    const h = hashOtpCode('123456', '+224622201362', 'pepper');
    expect(hashesMatch(h, h)).toBe(true);
  });

  it('rejette deux empreintes différentes', () => {
    const a = hashOtpCode('123456', '+224622201362', 'pepper');
    const b = hashOtpCode('654321', '+224622201362', 'pepper');
    expect(hashesMatch(a, b)).toBe(false);
  });

  it('rejette une comparaison de longueurs différentes sans lever', () => {
    expect(hashesMatch('ab12', 'ab1234')).toBe(false);
    expect(hashesMatch('', '')).toBe(false);
  });

  it('produit un jeton d inscription de 64 caractères hexadécimaux, distinct à chaque appel', () => {
    const a = generateRegistrationToken();
    const b = generateRegistrationToken();
    expect(a).toMatch(/^[0-9a-f]{64}$/);
    expect(a).not.toBe(b);
  });

  it('empreinte le jeton d inscription de façon stable et non réversible', () => {
    const token = generateRegistrationToken();
    expect(hashRegistrationToken(token, 'pepper')).toBe(hashRegistrationToken(token, 'pepper'));
    expect(hashRegistrationToken(token, 'pepper')).not.toBe(token);
  });
});
```

- [ ] **Step 2 : Lancer le test pour vérifier qu'il échoue**

```bash
cd /Users/thierno/Documents/Projects/kumy/agripilot-backoffice-api
npx jest src/auth/phone-registration/otp.util.spec.ts
```

Attendu : ÉCHEC — `Cannot find module './otp.util'`.

- [ ] **Step 3 : Écrire les constantes**

Créer `src/auth/phone-registration/otp.constants.ts` :

```ts
/**
 * Paramètres du code à usage unique — valeurs arrêtées par la spec
 * « Création de compte autonome ». Un seul endroit : les tests, le service et
 * la documentation Swagger lisent tous ceux-ci.
 */
export const OTP_LENGTH = 6;
export const OTP_TTL_MS = 5 * 60 * 1000;
export const OTP_MAX_ATTEMPTS = 5;
export const OTP_RESEND_COOLDOWN_MS = 60 * 1000;
export const OTP_HOURLY_SEND_LIMIT = 5;
export const OTP_HOURLY_WINDOW_MS = 60 * 60 * 1000;
export const REGISTRATION_TOKEN_TTL_MS = 15 * 60 * 1000;

export const OTP_COLLECTION = 'phone_otps';
export const REGISTRATION_TOKEN_COLLECTION = 'registration_tokens';
```

- [ ] **Step 4 : Écrire les utilitaires**

Créer `src/auth/phone-registration/otp.util.ts` :

```ts
import { createHmac, randomBytes, randomInt, timingSafeEqual } from 'crypto';
import { OTP_LENGTH } from './otp.constants';

/** `+224622201362` → `224622201362` : identifiant de document Firestore sûr. */
export function phoneToDocId(phone: string): string {
  return phone.replace(/\D/g, '');
}

/**
 * Code à 6 chiffres tiré d'un générateur cryptographique. Le `padStart`
 * conserve les zéros de tête : `000042` est un code valide, et l'exclure
 * réduirait l'espace de tirage.
 */
export function generateOtpCode(): string {
  return randomInt(0, 10 ** OTP_LENGTH)
    .toString()
    .padStart(OTP_LENGTH, '0');
}

/**
 * Empreinte du code : HMAC-SHA256 salé par le numéro ET par un secret de
 * déploiement. Le numéro interdit une table pré-calculée commune à tous les
 * enregistrements ; le secret rend cette table impossible à construire sans la
 * clé, ce qui compte pour un code de six chiffres — 10^6 possibilités se
 * balaient en une seconde.
 */
export function hashOtpCode(code: string, phone: string, secret: string): string {
  return createHmac('sha256', secret)
    .update(`${phoneToDocId(phone)}:${code}`)
    .digest('hex');
}

/**
 * Comparaison à temps constant de deux empreintes hexadécimales. Une
 * comparaison naïve (`===`) sort au premier octet différent et laisse fuir,
 * par la durée, la position de l'erreur.
 */
export function hashesMatch(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'hex');
  const bufB = Buffer.from(b, 'hex');
  if (bufA.length === 0 || bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

/** Jeton d'inscription : 32 octets aléatoires, rendus en hexadécimal. */
export function generateRegistrationToken(): string {
  return randomBytes(32).toString('hex');
}

/**
 * Empreinte du jeton d'inscription — elle sert d'identifiant de document, si
 * bien que le jeton en clair ne transite jamais en base et qu'une lecture de
 * Firestore ne permet pas de rejouer une inscription.
 */
export function hashRegistrationToken(token: string, secret: string): string {
  return createHmac('sha256', secret).update(token).digest('hex');
}
```

- [ ] **Step 5 : Lancer le test pour vérifier qu'il passe**

```bash
npx jest src/auth/phone-registration/otp.util.spec.ts
```

Attendu : SUCCÈS, 10 tests.

- [ ] **Step 6 : Commit**

```bash
git add src/auth/phone-registration/otp.constants.ts src/auth/phone-registration/otp.util.ts src/auth/phone-registration/otp.util.spec.ts
git commit -m "feat(auth): utilitaires du code a usage unique par telephone"
```

---

### Task 2 : Envoi du code — `PhoneOtpService.requestCode`

**Files:**
- Create: `src/auth/phone-registration/phone-otp.service.ts`
- Test: `src/auth/phone-registration/phone-otp.service.spec.ts`

**Interfaces:**
- Consumes: `OTP_*` et `REGISTRATION_TOKEN_*` (Task 1), `phoneToDocId`, `generateOtpCode`, `hashOtpCode` (Task 1) ; `FirebaseService.getFirestore()` ; `NotificationsService.send({ to, message, channel })` ; `coerceDate` de `../../common/date.util`.
- Produces:
  - `type AccountStatut = 'active' | 'pending' | 'inactive' | 'suspended' | 'absent'`
  - `interface OtpDocument { codeHash: string; expiresAt: unknown; attempts: number; lastSentAt: unknown; sendCount: number; windowStartedAt: unknown }`
  - `class PhoneOtpService { requestCode(phone: string, now?: Date): Promise<{ expiresIn: number; resendAfter: number }> }`

- [ ] **Step 1 : Écrire le test qui échoue**

Créer `src/auth/phone-registration/phone-otp.service.spec.ts` :

```ts
import { HttpException } from '@nestjs/common';
import { PhoneOtpService } from './phone-otp.service';
import {
  OTP_HOURLY_SEND_LIMIT,
  OTP_RESEND_COOLDOWN_MS,
} from './otp.constants';

const PHONE = '+224622201362';

/**
 * Double Firestore minimal : un seul document `phone_otps/{msisdn}` et un seul
 * document `registration_tokens/{empreinte}`, plus la requête `users` par
 * téléphone. Même approche que `auth.service.activate.spec.ts` — pas
 * d'émulateur, on observe ce qui est écrit.
 */
function makeService(options: {
  otpDoc?: Record<string, unknown> | null;
  userDoc?: Record<string, unknown> | null;
  smsSuccess?: boolean;
} = {}) {
  const otpSet = jest.fn().mockResolvedValue(undefined);
  const otpUpdate = jest.fn().mockResolvedValue(undefined);
  const otpDelete = jest.fn().mockResolvedValue(undefined);
  const otpGet = jest.fn().mockResolvedValue({
    exists: Boolean(options.otpDoc),
    data: () => options.otpDoc ?? undefined,
  });
  const otpRef = { get: otpGet, set: otpSet, update: otpUpdate, delete: otpDelete };

  const tokenSet = jest.fn().mockResolvedValue(undefined);
  const tokenRef = { set: tokenSet };

  const usersGet = jest.fn().mockResolvedValue({
    empty: !options.userDoc,
    docs: options.userDoc ? [{ id: 'uid-1', data: () => options.userDoc }] : [],
  });

  const firestore = {
    collection: jest.fn((name: string) => {
      if (name === 'phone_otps') return { doc: () => otpRef };
      if (name === 'registration_tokens') return { doc: () => tokenRef };
      return { where: () => ({ limit: () => ({ get: usersGet }) }) };
    }),
  };

  const send = jest
    .fn()
    .mockResolvedValue({ success: options.smsSuccess ?? true, channel: 'sms' });

  const service = new PhoneOtpService(
    { getFirestore: () => firestore } as never,
    { get: jest.fn().mockReturnValue('pepper') } as never,
    { send } as never,
  );

  return { service, otpSet, otpUpdate, otpDelete, tokenSet, send };
}

describe('PhoneOtpService.requestCode', () => {
  it('envoie un SMS et enregistre une empreinte, jamais le code en clair', async () => {
    const { service, otpSet, send } = makeService();

    const result = await service.requestCode(PHONE);

    expect(send).toHaveBeenCalledTimes(1);
    const sms = send.mock.calls[0][0] as { to: string; message: string; channel: string };
    expect(sms.to).toBe(PHONE);
    expect(sms.channel).toBe('sms');
    const code = /(\d{6})/.exec(sms.message)?.[1];
    expect(code).toMatch(/^\d{6}$/);

    const written = otpSet.mock.calls[0][0] as Record<string, unknown>;
    expect(written.codeHash).toEqual(expect.any(String));
    expect(JSON.stringify(written)).not.toContain(code as string);
    expect(written.attempts).toBe(0);
    expect(written.sendCount).toBe(1);
    expect(result.expiresIn).toBe(300);
    expect(result.resendAfter).toBe(60);
  });

  it('répond 200 sans envoyer de SMS tant que le délai d une minute court', async () => {
    const now = new Date('2026-08-23T10:00:00Z');
    const { service, otpSet, send } = makeService({
      otpDoc: {
        codeHash: 'aa',
        expiresAt: new Date(now.getTime() + 60_000),
        attempts: 0,
        lastSentAt: new Date(now.getTime() - 20_000),
        sendCount: 1,
        windowStartedAt: new Date(now.getTime() - 20_000),
      },
    });

    const result = await service.requestCode(PHONE, now);

    expect(send).not.toHaveBeenCalled();
    expect(otpSet).not.toHaveBeenCalled();
    expect(result.resendAfter).toBe(40);
  });

  it('refuse au-delà de cinq envois dans l heure', async () => {
    const now = new Date('2026-08-23T10:00:00Z');
    const { service, send } = makeService({
      otpDoc: {
        codeHash: 'aa',
        expiresAt: now,
        attempts: 0,
        lastSentAt: new Date(now.getTime() - OTP_RESEND_COOLDOWN_MS - 1000),
        sendCount: OTP_HOURLY_SEND_LIMIT,
        windowStartedAt: new Date(now.getTime() - 30 * 60 * 1000),
      },
    });

    await expect(service.requestCode(PHONE, now)).rejects.toBeInstanceOf(HttpException);
    expect(send).not.toHaveBeenCalled();
  });

  it('rouvre une fenêtre neuve passée l heure', async () => {
    const now = new Date('2026-08-23T10:00:00Z');
    const { service, otpSet, send } = makeService({
      otpDoc: {
        codeHash: 'aa',
        expiresAt: now,
        attempts: 3,
        lastSentAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
        sendCount: OTP_HOURLY_SEND_LIMIT,
        windowStartedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
      },
    });

    await service.requestCode(PHONE, now);

    expect(send).toHaveBeenCalledTimes(1);
    const written = otpSet.mock.calls[0][0] as Record<string, unknown>;
    expect(written.sendCount).toBe(1);
    expect(written.attempts).toBe(0);
  });

  it('répond exactement pareil pour un numéro connu et pour un numéro inconnu', async () => {
    const inconnu = makeService();
    const connu = makeService({ userDoc: { status: 'active', firstName: 'Awa' } });

    const reponseInconnu = await inconnu.service.requestCode(PHONE);
    const reponseConnu = await connu.service.requestCode(PHONE);

    expect(reponseConnu).toEqual(reponseInconnu);
    // Et surtout : l'envoi ne consulte jamais la collection `users`. Rien à
    // révéler tant que la possession du téléphone n'est pas prouvée.
    expect(connu.send).toHaveBeenCalledTimes(1);
  });

  it('répond 200 même quand l opérateur SMS échoue', async () => {
    const { service } = makeService({ smsSuccess: false });

    await expect(service.requestCode(PHONE)).resolves.toEqual({
      expiresIn: 300,
      resendAfter: 60,
    });
  });
});
```

- [ ] **Step 2 : Lancer le test pour vérifier qu'il échoue**

```bash
npx jest src/auth/phone-registration/phone-otp.service.spec.ts
```

Attendu : ÉCHEC — `Cannot find module './phone-otp.service'`.

- [ ] **Step 3 : Écrire le service (envoi seulement)**

Créer `src/auth/phone-registration/phone-otp.service.ts` :

```ts
import {
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FirebaseService } from '../../firebase/firebase.service';
import { NotificationsService } from '../../notifications/notifications.service';
import { coerceDate } from '../../common/date.util';
import {
  OTP_COLLECTION,
  OTP_HOURLY_SEND_LIMIT,
  OTP_HOURLY_WINDOW_MS,
  OTP_RESEND_COOLDOWN_MS,
  OTP_TTL_MS,
} from './otp.constants';
import { generateOtpCode, hashOtpCode, phoneToDocId } from './otp.util';

export type AccountStatut =
  | 'active'
  | 'pending'
  | 'inactive'
  | 'suspended'
  | 'absent';

export interface OtpDocument {
  codeHash: string;
  expiresAt: unknown;
  attempts: number;
  lastSentAt: unknown;
  sendCount: number;
  windowStartedAt: unknown;
}

@Injectable()
export class PhoneOtpService {
  private readonly logger = new Logger(PhoneOtpService.name);
  private readonly hashSecret: string;

  constructor(
    private firebaseService: FirebaseService,
    private configService: ConfigService,
    private notificationsService: NotificationsService,
  ) {
    this.hashSecret = this.configService.get<string>('OTP_HASH_SECRET') ?? '';
    if (!this.hashSecret) {
      this.logger.warn(
        'OTP_HASH_SECRET absent : les empreintes ne sont salées que par le numéro',
      );
    }
  }

  /**
   * Émet un code et l'envoie par SMS. Ne dit JAMAIS si le numéro porte un
   * compte : une réponse différenciée permettrait d'énumérer les inscrits sans
   * rien prouver de la possession du téléphone.
   *
   * `now` est injectable pour que les tests figent l'horloge — tout ici est une
   * histoire de fenêtres temporelles.
   */
  async requestCode(
    phone: string,
    now: Date = new Date(),
  ): Promise<{ expiresIn: number; resendAfter: number }> {
    const docRef = this.firebaseService
      .getFirestore()
      .collection(OTP_COLLECTION)
      .doc(phoneToDocId(phone));

    const snapshot = await docRef.get();
    const existing = snapshot.exists
      ? (snapshot.data() as OtpDocument)
      : null;

    const windowStartedAt = coerceDate(existing?.windowStartedAt);
    const inWindow =
      windowStartedAt !== null &&
      now.getTime() - windowStartedAt.getTime() < OTP_HOURLY_WINDOW_MS;
    const sendCount = inWindow ? (existing?.sendCount ?? 0) : 0;

    // Plafond horaire : refus franc. Un 429 parle du débit de l'appelant, pas
    // du titulaire du numéro — il ne révèle donc rien. Il protège l'agriculteur
    // du harcèlement par SMS autant que le budget : chaque envoi est facturé.
    if (sendCount >= OTP_HOURLY_SEND_LIMIT) {
      throw new HttpException(
        'Trop de demandes de code pour ce numéro. Réessayez dans une heure.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // Délai d'une minute entre deux envois : pas d'erreur (le parcours affiche
    // déjà un compte à rebours), mais ni SMS ni nouveau code. Le code en cours
    // reste valide, ce qui est exactement ce qu'attend qui a tapé deux fois.
    const lastSentAt = coerceDate(existing?.lastSentAt);
    if (lastSentAt !== null) {
      const elapsed = now.getTime() - lastSentAt.getTime();
      if (elapsed < OTP_RESEND_COOLDOWN_MS) {
        return {
          expiresIn: Math.ceil(OTP_TTL_MS / 1000),
          resendAfter: Math.ceil((OTP_RESEND_COOLDOWN_MS - elapsed) / 1000),
        };
      }
    }

    const code = generateOtpCode();
    await docRef.set({
      codeHash: hashOtpCode(code, phone, this.hashSecret),
      expiresAt: new Date(now.getTime() + OTP_TTL_MS),
      attempts: 0,
      lastSentAt: now,
      sendCount: sendCount + 1,
      windowStartedAt: inWindow && windowStartedAt ? windowStartedAt : now,
    });

    // Message sans accent : le SMS reste en alphabet GSM-7, donc en un seul
    // segment facturé chez LAfricaMobile.
    const result = await this.notificationsService.send({
      to: phone,
      channel: 'sms',
      message: `Kumy : votre code de verification est ${code}. Il expire dans 5 minutes.`,
    });

    if (!result.success) {
      // Échec opérateur tracé, jamais rendu : une réponse différenciée dirait
      // ce que l'opérateur sait du numéro.
      this.logger.error(
        `Envoi du code echoue pour ${phone} : ${result.error ?? 'raison inconnue'}`,
      );
    }

    return {
      expiresIn: Math.ceil(OTP_TTL_MS / 1000),
      resendAfter: Math.ceil(OTP_RESEND_COOLDOWN_MS / 1000),
    };
  }
}
```

- [ ] **Step 4 : Lancer le test pour vérifier qu'il passe**

```bash
npx jest src/auth/phone-registration/phone-otp.service.spec.ts
```

Attendu : SUCCÈS, 6 tests.

- [ ] **Step 5 : Commit**

```bash
git add src/auth/phone-registration/phone-otp.service.ts src/auth/phone-registration/phone-otp.service.spec.ts
git commit -m "feat(auth): envoi du code par SMS avec plafonds par numero"
```

---

### Task 3 : Vérification du code et aiguillage — `PhoneOtpService.verifyCode`

**Files:**
- Modify: `src/auth/phone-registration/phone-otp.service.ts` (ajout de `verifyCode` et `readAccount`)
- Test: `src/auth/phone-registration/phone-otp.service.spec.ts` (nouveau bloc `describe`)

**Interfaces:**
- Consumes: tout Task 1 et Task 2 ; `UserStatus` de `../../common/types/user-role.enum`.
- Produces:
  - `interface VerifiedProfile { firstName: string; lastName: string; birthDate: string | null }`
  - `interface VerifiedAccount { statut: AccountStatut; profil?: VerifiedProfile }`
  - `PhoneOtpService.verifyCode(phone: string, code: string): Promise<{ registrationToken: string; account: VerifiedAccount }>`

- [ ] **Step 1 : Écrire le test qui échoue**

Ajouter à la fin de `src/auth/phone-registration/phone-otp.service.spec.ts` :

```ts
describe('PhoneOtpService.verifyCode', () => {
  const secret = 'pepper';

  /** Fabrique un document OTP valide portant l'empreinte de `code`. */
  function otpDocFor(code: string, overrides: Record<string, unknown> = {}) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { hashOtpCode } = require('./otp.util') as typeof import('./otp.util');
    return {
      codeHash: hashOtpCode(code, PHONE, secret),
      expiresAt: new Date(Date.now() + 60_000),
      attempts: 0,
      lastSentAt: new Date(),
      sendCount: 1,
      windowStartedAt: new Date(),
      ...overrides,
    };
  }

  it('renvoie statut « absent » et un jeton quand aucun compte ne porte le numéro', async () => {
    const { service, tokenSet, otpDelete } = makeService({ otpDoc: otpDocFor('123456') });

    const result = await service.verifyCode(PHONE, '123456');

    expect(result.account).toEqual({ statut: 'absent' });
    expect(result.registrationToken).toMatch(/^[0-9a-f]{64}$/);
    expect(otpDelete).toHaveBeenCalled();
    const stored = tokenSet.mock.calls[0][0] as Record<string, unknown>;
    expect(stored.phone).toBe(PHONE);
    expect(stored.usedAt).toBeNull();
  });

  it('renvoie « active » sans profil pour un compte en service', async () => {
    const { service } = makeService({
      otpDoc: otpDocFor('123456'),
      userDoc: { status: 'active', firstName: 'Awa', lastName: 'Diallo' },
    });

    const result = await service.verifyCode(PHONE, '123456');

    expect(result.account).toEqual({ statut: 'active' });
  });

  it('renvoie « pending » avec le profil préparé par le partenaire', async () => {
    const { service } = makeService({
      otpDoc: otpDocFor('123456'),
      userDoc: {
        status: 'pending',
        firstName: 'Awa',
        lastName: 'Diallo',
        dateOfBirth: '1990-05-12',
      },
    });

    const result = await service.verifyCode(PHONE, '123456');

    expect(result.account).toEqual({
      statut: 'pending',
      profil: { firstName: 'Awa', lastName: 'Diallo', birthDate: '1990-05-12' },
    });
  });

  it('renvoie « suspended » sans profil', async () => {
    const { service } = makeService({
      otpDoc: otpDocFor('123456'),
      userDoc: { status: 'suspended', firstName: 'Awa', lastName: 'Diallo' },
    });

    const result = await service.verifyCode(PHONE, '123456');

    expect(result.account).toEqual({ statut: 'suspended' });
  });

  it('traite un document sans statut comme actif', async () => {
    const { service } = makeService({
      otpDoc: otpDocFor('123456'),
      userDoc: { firstName: 'Awa', lastName: 'Diallo' },
    });

    const result = await service.verifyCode(PHONE, '123456');

    expect(result.account).toEqual({ statut: 'active' });
  });

  it('rejette un code faux et incrémente le compteur de tentatives', async () => {
    const { service, otpUpdate, tokenSet } = makeService({ otpDoc: otpDocFor('123456') });

    await expect(service.verifyCode(PHONE, '000000')).rejects.toThrow(
      'Code invalide ou expiré',
    );
    // L'incrément passe par la transaction : `tx.update(ref, data)`.
    expect(otpUpdate).toHaveBeenCalledWith(expect.anything(), { attempts: 1 });
    expect(tokenSet).not.toHaveBeenCalled();
  });

  it('lit le compteur et l incrémente dans la MÊME transaction', async () => {
    const { service, runTransaction, otpUpdate } = makeService({
      otpDoc: otpDocFor('123456'),
    });

    await expect(service.verifyCode(PHONE, '000000')).rejects.toThrow(
      'Code invalide ou expiré',
    );

    // Sans indivisibilité, des essais simultanés liraient tous `attempts: 0`
    // et le plafond de cinq tentatives ne tiendrait pas.
    expect(runTransaction).toHaveBeenCalledTimes(1);
    expect(otpUpdate).toHaveBeenCalled();
  });

  it('consomme le code dans la transaction, jamais après', async () => {
    const { service, otpDelete, runTransaction } = makeService({
      otpDoc: otpDocFor('123456'),
    });

    await service.verifyCode(PHONE, '123456');

    expect(runTransaction).toHaveBeenCalledTimes(1);
    expect(otpDelete).toHaveBeenCalledWith(expect.anything());
  });

  it('rejette un code expiré', async () => {
    const { service } = makeService({
      otpDoc: otpDocFor('123456', { expiresAt: new Date(Date.now() - 1000) }),
    });

    await expect(service.verifyCode(PHONE, '123456')).rejects.toThrow(
      'Code invalide ou expiré',
    );
  });

  it('rejette la sixième tentative, même avec le bon code', async () => {
    const { service, tokenSet } = makeService({
      otpDoc: otpDocFor('123456', { attempts: 5 }),
    });

    await expect(service.verifyCode(PHONE, '123456')).rejects.toThrow(
      'Code invalide ou expiré',
    );
    expect(tokenSet).not.toHaveBeenCalled();
  });

  it('rejette quand aucun code n a été demandé', async () => {
    const { service } = makeService({ otpDoc: null });

    await expect(service.verifyCode(PHONE, '123456')).rejects.toThrow(
      'Code invalide ou expiré',
    );
  });
});
```

- [ ] **Step 2 : Lancer le test pour vérifier qu'il échoue**

```bash
npx jest src/auth/phone-registration/phone-otp.service.spec.ts
```

Attendu : ÉCHEC — `service.verifyCode is not a function`.

- [ ] **Step 3 : Écrire la vérification**

Dans `src/auth/phone-registration/phone-otp.service.ts`, ajouter les imports manquants en tête :

```ts
import { BadRequestException } from '@nestjs/common';
import { UserStatus } from '../../common/types/user-role.enum';
import {
  OTP_MAX_ATTEMPTS,
  REGISTRATION_TOKEN_COLLECTION,
  REGISTRATION_TOKEN_TTL_MS,
} from './otp.constants';
import {
  generateRegistrationToken,
  hashesMatch,
  hashRegistrationToken,
} from './otp.util';
```

Ajouter les types exportés à côté de `OtpDocument` :

```ts
export interface VerifiedProfile {
  firstName: string;
  lastName: string;
  birthDate: string | null;
}

export interface VerifiedAccount {
  statut: AccountStatut;
  profil?: VerifiedProfile;
}

interface UserSummary {
  status?: string;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
}
```

Puis, dans la classe, après `requestCode` :

```ts
  /**
   * Vérifie le code, puis — et seulement alors — dit ce que le numéro porte.
   * L'ordre est la mesure de sécurité principale du parcours : rien n'est
   * révélé d'un compte avant que la possession du téléphone soit prouvée.
   */
  async verifyCode(
    phone: string,
    code: string,
  ): Promise<{ registrationToken: string; account: VerifiedAccount }> {
    const firestore = this.firebaseService.getFirestore();
    const docRef = firestore
      .collection(OTP_COLLECTION)
      .doc(phoneToDocId(phone));

    // Message unique pour « pas de code », « expiré », « faux » et « trop de
    // tentatives » : distinguer ces cas renseignerait un attaquant sur l'état
    // de la cible sans jamais l'aider, lui, à taper le bon code.
    const invalid = () => new BadRequestException('Code invalide ou expiré');

    // Lecture, contrôle du compteur et écriture dans UNE transaction. Sans
    // elle, mille essais simultanés liraient tous `attempts: 0`, passeraient
    // tous le plafond de cinq, et le code à six chiffres tomberait par force
    // brute — le plafond ne tient que s'il est indivisible.
    await firestore.runTransaction(async (tx) => {
      const snapshot = await tx.get(docRef);
      const otp = snapshot.exists ? (snapshot.data() as OtpDocument) : null;

      const expiresAt = coerceDate(otp?.expiresAt);
      if (!otp || !expiresAt || expiresAt.getTime() < Date.now()) throw invalid();

      const attempts = otp.attempts ?? 0;
      if (attempts >= OTP_MAX_ATTEMPTS) throw invalid();

      if (!hashesMatch(otp.codeHash, hashOtpCode(code, phone, this.hashSecret))) {
        tx.update(docRef, { attempts: attempts + 1 });
        throw invalid();
      }

      // Un code vérifié est consommé : il ne servira pas une seconde fois.
      tx.delete(docRef);
    });

    const account = await this.readAccount(phone);

    const token = generateRegistrationToken();
    await firestore
      .collection(REGISTRATION_TOKEN_COLLECTION)
      .doc(hashRegistrationToken(token, this.hashSecret))
      .set({
        phone,
        statut: account.statut,
        expiresAt: new Date(Date.now() + REGISTRATION_TOKEN_TTL_MS),
        usedAt: null,
        createdAt: new Date(),
      });

    return { registrationToken: token, account };
  }

  /**
   * Ce que le numéro porte, réduit aux cinq statuts du parcours. Le profil
   * n'accompagne que `pending` et `inactive` : c'est le partenaire qui a saisi
   * ces informations, l'agriculteur ne fait que les confirmer.
   */
  private async readAccount(phone: string): Promise<VerifiedAccount> {
    const snapshot = await this.firebaseService
      .getFirestore()
      .collection('users')
      .where('phone', '==', phone)
      .limit(1)
      .get();

    if (snapshot.empty) return { statut: 'absent' };

    const user = snapshot.docs[0].data() as UserSummary;
    // Un document sans statut est un document historique : il est en service.
    const status = user.status ?? UserStatus.ACTIVE;

    if (status === UserStatus.PENDING || status === UserStatus.INACTIVE) {
      return {
        statut: status as AccountStatut,
        profil: {
          firstName: user.firstName ?? '',
          lastName: user.lastName ?? '',
          birthDate: user.dateOfBirth ?? null,
        },
      };
    }

    return { statut: status === UserStatus.SUSPENDED ? 'suspended' : 'active' };
  }
```

- [ ] **Step 4 : Lancer le test pour vérifier qu'il passe**

```bash
npx jest src/auth/phone-registration/phone-otp.service.spec.ts
```

Attendu : SUCCÈS, 17 tests (6 de la Task 2 + 11).

- [ ] **Step 5 : Commit**

```bash
git add src/auth/phone-registration/phone-otp.service.ts src/auth/phone-registration/phone-otp.service.spec.ts
git commit -m "feat(auth): verification du code et aiguillage selon le statut du compte"
```

---

### Task 4 : Création du compte — `PhoneRegistrationService`

**Files:**
- Create: `src/auth/phone-registration/phone-registration.service.ts`
- Test: `src/auth/phone-registration/phone-registration.service.spec.ts`

**Interfaces:**
- Consumes: `REGISTRATION_TOKEN_COLLECTION` (Task 1), `hashRegistrationToken` (Task 1), `coerceDate`, `UserRole`/`UserStatus`, `ACCESS_TIER` de `../../common/types/access-tier.enum`, `FarmersService.createMinimalProfile(userId: string): Promise<string>`.
- Produces:
  - `interface RegisterByPhoneInput { registrationToken: string; firstName: string; lastName: string; birthDate: string; regionId: string; prefectureId: string; sousPrefectureId: string; pin: string }`
  - `class PhoneRegistrationService { register(input: RegisterByPhoneInput): Promise<{ uid: string; message: string }> }`

- [ ] **Step 1 : Écrire le test qui échoue**

Créer `src/auth/phone-registration/phone-registration.service.spec.ts` :

```ts
import { BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';
import { PhoneRegistrationService } from './phone-registration.service';
import { hashRegistrationToken } from './otp.util';

const PHONE = '+224622201362';
const TOKEN = 'a'.repeat(64);
const SECRET = 'pepper';

const input = {
  registrationToken: TOKEN,
  firstName: 'Awa',
  lastName: 'Diallo',
  birthDate: '1990-05-12',
  regionId: 'r1',
  prefectureId: 'p1',
  sousPrefectureId: 'sp1',
  pin: '123456',
};

function makeService(options: {
  tokenDoc?: Record<string, unknown> | null;
  userDoc?: Record<string, unknown> | null;
  farmerExists?: boolean;
  createUserError?: { code?: string; message?: string };
} = {}) {
  const tokenDoc =
    options.tokenDoc === undefined
      ? { phone: PHONE, statut: 'absent', expiresAt: new Date(Date.now() + 60_000), usedAt: null }
      : options.tokenDoc;

  const tokenUpdate = jest.fn();
  const tokenRef = { id: hashRegistrationToken(TOKEN, SECRET) };

  const transaction = {
    get: jest.fn().mockResolvedValue({
      exists: Boolean(tokenDoc),
      data: () => tokenDoc ?? undefined,
    }),
    update: tokenUpdate,
  };
  const runTransaction = jest.fn(
    async (fn: (tx: typeof transaction) => Promise<unknown>) => fn(transaction),
  );

  const userSet = jest.fn().mockResolvedValue(undefined);
  const userUpdate = jest.fn().mockResolvedValue(undefined);
  const usersGet = jest.fn().mockResolvedValue({
    empty: !options.userDoc,
    docs: options.userDoc
      ? [{ id: 'uid-existant', data: () => options.userDoc, ref: { update: userUpdate } }]
      : [],
  });

  const farmerUpdate = jest.fn().mockResolvedValue(undefined);
  const farmersGet = jest.fn().mockResolvedValue({
    empty: !options.farmerExists,
    docs: options.farmerExists ? [{ id: 'farmer-1', ref: { update: farmerUpdate } }] : [],
  });

  const firestore = {
    runTransaction,
    collection: jest.fn((name: string) => {
      if (name === 'registration_tokens') return { doc: () => tokenRef };
      if (name === 'users') {
        return {
          doc: () => ({ set: userSet }),
          where: () => ({ limit: () => ({ get: usersGet }) }),
        };
      }
      return {
        doc: () => ({ update: farmerUpdate }),
        where: () => ({ limit: () => ({ get: farmersGet }) }),
      };
    }),
  };

  const createUser = options.createUserError
    ? jest.fn().mockRejectedValue(Object.assign(new Error(options.createUserError.message ?? 'boom'), { code: options.createUserError.code }))
    : jest.fn().mockResolvedValue({ uid: 'uid-neuf' });
  const updateUser = jest.fn().mockResolvedValue(undefined);

  const createMinimalProfile = jest.fn().mockResolvedValue('farmer-neuf');

  const service = new PhoneRegistrationService(
    { getFirestore: () => firestore, getAuth: () => ({ createUser, updateUser }) } as never,
    { get: jest.fn().mockReturnValue(SECRET) } as never,
    { createMinimalProfile } as never,
  );

  return { service, userSet, userUpdate, farmerUpdate, createUser, updateUser, createMinimalProfile, tokenUpdate };
}

describe('PhoneRegistrationService.register', () => {
  it('crée le compte Firebase, le document utilisateur et la fiche agriculteur', async () => {
    const { service, userSet, createUser, createMinimalProfile, farmerUpdate } = makeService();

    const result = await service.register(input);

    expect(result.uid).toBe('uid-neuf');
    expect(createUser).toHaveBeenCalledWith(
      expect.objectContaining({
        email: '224622201362@agripilot.phone',
        password: '123456',
        displayName: 'Awa Diallo',
        phoneNumber: PHONE,
      }),
    );

    const user = userSet.mock.calls[0][0] as Record<string, unknown>;
    expect(user.role).toBe('farmer');
    expect(user.status).toBe('active');
    expect(user.accessTier).toBe('simulation');
    expect(user.phone).toBe(PHONE);
    expect(user.dateOfBirth).toBe('1990-05-12');
    expect(user.partnerId).toBeUndefined();

    expect(createMinimalProfile).toHaveBeenCalledWith('uid-neuf');
    const farmer = farmerUpdate.mock.calls[0][0] as { address: Record<string, unknown> };
    expect(farmer.address).toEqual({
      regionId: 'r1',
      prefectureId: 'p1',
      sousPrefectureId: 'sp1',
      districtId: null,
    });
  });

  it('marque le jeton consommé dans la même transaction que sa lecture', async () => {
    const { service, tokenUpdate } = makeService();

    await service.register(input);

    expect(tokenUpdate).toHaveBeenCalledWith(expect.anything(), { usedAt: expect.any(Date) });
  });

  it('refuse un jeton déjà consommé', async () => {
    const { service, createUser } = makeService({
      tokenDoc: { phone: PHONE, statut: 'absent', expiresAt: new Date(Date.now() + 60_000), usedAt: new Date() },
    });

    await expect(service.register(input)).rejects.toBeInstanceOf(BadRequestException);
    expect(createUser).not.toHaveBeenCalled();
  });

  it('refuse un jeton expiré', async () => {
    const { service } = makeService({
      tokenDoc: { phone: PHONE, statut: 'absent', expiresAt: new Date(Date.now() - 1000), usedAt: null },
    });

    await expect(service.register(input)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('refuse un jeton inconnu', async () => {
    const { service } = makeService({ tokenDoc: null });

    await expect(service.register(input)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('refuse un numéro qui porte déjà un compte en service', async () => {
    const { service, createUser } = makeService({ userDoc: { status: 'active' } });

    await expect(service.register(input)).rejects.toBeInstanceOf(ConflictException);
    expect(createUser).not.toHaveBeenCalled();
  });

  it('refuse un compte suspendu', async () => {
    const { service } = makeService({ userDoc: { status: 'suspended' } });

    await expect(service.register(input)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('reprend un compte pending : pose le PIN, active, et neutralise le jeton d invitation', async () => {
    const { service, updateUser, userUpdate, createUser } = makeService({
      userDoc: { status: 'pending', firstName: 'Awa', lastName: 'Diallo' },
    });

    const result = await service.register(input);

    expect(createUser).not.toHaveBeenCalled();
    expect(result.uid).toBe('uid-existant');
    expect(updateUser).toHaveBeenCalledWith('uid-existant', {
      password: '123456',
      displayName: 'Awa Diallo',
    });
    const written = userUpdate.mock.calls[0][0] as Record<string, unknown>;
    expect(written.status).toBe('active');
    expect(written.activationToken).toBeNull();
  });

  it('réutilise la fiche agriculteur existante au lieu d en créer une seconde', async () => {
    const { service, createMinimalProfile, farmerUpdate } = makeService({
      userDoc: { status: 'pending' },
      farmerExists: true,
    });

    await service.register(input);

    expect(createMinimalProfile).not.toHaveBeenCalled();
    expect(farmerUpdate).toHaveBeenCalled();
  });

  it('traduit un compte Firebase déjà pris en conflit lisible', async () => {
    const { service } = makeService({
      createUserError: { code: 'auth/email-already-exists' },
    });

    await expect(service.register(input)).rejects.toBeInstanceOf(ConflictException);
  });
});
```

- [ ] **Step 2 : Lancer le test pour vérifier qu'il échoue**

```bash
npx jest src/auth/phone-registration/phone-registration.service.spec.ts
```

Attendu : ÉCHEC — `Cannot find module './phone-registration.service'`.

- [ ] **Step 3 : Écrire le service**

Créer `src/auth/phone-registration/phone-registration.service.ts` :

```ts
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FirebaseService } from '../../firebase/firebase.service';
import { FarmersService } from '../../farmers/farmers.service';
import { coerceDate } from '../../common/date.util';
import { UserRole, UserStatus } from '../../common/types/user-role.enum';
import { ACCESS_TIER } from '../../common/types/access-tier.enum';
import { REGISTRATION_TOKEN_COLLECTION } from './otp.constants';
import { hashRegistrationToken, phoneToDocId } from './otp.util';

export interface RegisterByPhoneInput {
  registrationToken: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  regionId: string;
  prefectureId: string;
  sousPrefectureId: string;
  pin: string;
}

interface RegistrationTokenDocument {
  phone: string;
  statut: string;
  expiresAt: unknown;
  usedAt: unknown;
}

@Injectable()
export class PhoneRegistrationService {
  private readonly hashSecret: string;

  constructor(
    private firebaseService: FirebaseService,
    private configService: ConfigService,
    private farmersService: FarmersService,
  ) {
    this.hashSecret = this.configService.get<string>('OTP_HASH_SECRET') ?? '';
  }

  /**
   * Crée — ou reprend — le compte d'un agriculteur qui vient de prouver qu'il
   * détient le numéro. Sans partenaire ni technicien : c'est le backoffice qui
   * adoptera l'inscrit plus tard.
   */
  async register(
    input: RegisterByPhoneInput,
  ): Promise<{ uid: string; message: string }> {
    const phone = await this.consumeRegistrationToken(input.registrationToken);
    const firestore = this.firebaseService.getFirestore();
    const auth = this.firebaseService.getAuth();
    const now = new Date();
    const displayName = `${input.firstName} ${input.lastName}`;

    const existing = await firestore
      .collection('users')
      .where('phone', '==', phone)
      .limit(1)
      .get();

    if (!existing.empty) {
      const doc = existing.docs[0];
      const status =
        (doc.data() as { status?: string }).status ?? UserStatus.ACTIVE;

      if (status === UserStatus.SUSPENDED) {
        throw new ForbiddenException(
          'Ce compte est suspendu. Contactez le support Kumy.',
        );
      }
      if (status === UserStatus.ACTIVE) {
        throw new ConflictException('Un compte existe déjà pour ce numéro.');
      }

      // `pending` / `inactive` : le partenaire avait préparé la fiche,
      // l'agriculteur la reprend en posant son propre code.
      await auth.updateUser(doc.id, { password: input.pin, displayName });
      await doc.ref.update({
        firstName: input.firstName,
        lastName: input.lastName,
        displayName,
        dateOfBirth: input.birthDate,
        status: UserStatus.ACTIVE,
        // Le lien d'invitation ne doit plus permettre de reposer un code sur
        // un compte désormais tenu par son titulaire.
        activationToken: null,
        updatedAt: now.toISOString(),
      });
      await this.ensureFarmerProfile(doc.id, input, now);
      return { uid: doc.id, message: 'Compte activé' };
    }

    let uid: string;
    try {
      const record = await auth.createUser({
        email: this.phoneToEmail(phone),
        password: input.pin,
        displayName,
        phoneNumber: phone,
      });
      uid = record.uid;
    } catch (error: unknown) {
      const code = (error as { code?: string })?.code ?? '';
      const message = (error as { message?: string })?.message ?? '';
      if (
        code === 'auth/email-already-exists' ||
        code === 'auth/phone-number-already-exists' ||
        message.includes('already-exists')
      ) {
        throw new ConflictException('Un compte existe déjà pour ce numéro.');
      }
      throw error;
    }

    await firestore
      .collection('users')
      .doc(uid)
      .set({
        email: this.phoneToEmail(phone),
        phone,
        firstName: input.firstName,
        lastName: input.lastName,
        displayName,
        dateOfBirth: input.birthDate,
        role: UserRole.FARMER,
        status: UserStatus.ACTIVE,
        // Auto-inscrit : pas encore adopté par un partenaire, donc pas de
        // plein droit. Le backoffice remontera ce niveau à l'adoption.
        accessTier: ACCESS_TIER.SIMULATION,
        languagePreference: 'fr',
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      });

    await this.ensureFarmerProfile(uid, input, now);

    return { uid, message: 'Compte créé' };
  }

  /** Convention Kumy : le téléphone porte un e-mail fictif côté Firebase Auth. */
  private phoneToEmail(phone: string): string {
    return `${phoneToDocId(phone)}@agripilot.phone`;
  }

  /**
   * Lecture ET marquage du jeton dans une seule transaction : sans quoi deux
   * requêtes simultanées rejoueraient le même jeton et créeraient deux comptes.
   */
  private async consumeRegistrationToken(token: string): Promise<string> {
    const firestore = this.firebaseService.getFirestore();
    const ref = firestore
      .collection(REGISTRATION_TOKEN_COLLECTION)
      .doc(hashRegistrationToken(token, this.hashSecret));

    return firestore.runTransaction(async (tx) => {
      const snapshot = await tx.get(ref);
      const expired = new BadRequestException(
        'Inscription expirée. Recommencez la vérification du numéro.',
      );

      if (!snapshot.exists) throw expired;
      const data = snapshot.data() as RegistrationTokenDocument;
      if (data.usedAt) throw expired;

      const expiresAt = coerceDate(data.expiresAt);
      if (!expiresAt || expiresAt.getTime() < Date.now()) throw expired;

      tx.update(ref, { usedAt: new Date() });
      return data.phone;
    });
  }

  /**
   * Fiche agriculteur allégée : adresse partielle (ni district ni GPS — non
   * collectés), aucun partenaire, aucun technicien. `createMinimalProfile`
   * fournit le `farmerCode` et les tableaux vides attendus par le reste de
   * l'API.
   */
  private async ensureFarmerProfile(
    uid: string,
    input: RegisterByPhoneInput,
    now: Date,
  ): Promise<void> {
    const firestore = this.firebaseService.getFirestore();
    const address = {
      regionId: input.regionId,
      prefectureId: input.prefectureId,
      sousPrefectureId: input.sousPrefectureId,
      districtId: null,
    };

    const existing = await firestore
      .collection('farmers')
      .where('userId', '==', uid)
      .limit(1)
      .get();

    if (!existing.empty) {
      await existing.docs[0].ref.update({
        address,
        updatedAt: now.toISOString(),
      });
      return;
    }

    const farmerId = await this.farmersService.createMinimalProfile(uid);
    await firestore.collection('farmers').doc(farmerId).update({
      address,
      origin: 'kumy',
      hasLogin: true,
      updatedAt: now.toISOString(),
    });
  }
}
```

- [ ] **Step 4 : Lancer le test pour vérifier qu'il passe**

```bash
npx jest src/auth/phone-registration/phone-registration.service.spec.ts
```

Attendu : SUCCÈS, 10 tests.

- [ ] **Step 5 : Commit**

```bash
git add src/auth/phone-registration/phone-registration.service.ts src/auth/phone-registration/phone-registration.service.spec.ts
git commit -m "feat(auth): creation du compte agriculteur par numero verifie"
```

---

### Task 5 : DTO, contrôleur et câblage du module

**Files:**
- Create: `src/auth/phone-registration/dto/send-otp.dto.ts`
- Create: `src/auth/phone-registration/dto/verify-otp.dto.ts`
- Create: `src/auth/phone-registration/dto/register-by-phone.dto.ts`
- Create: `src/auth/phone-registration/phone-registration.controller.ts`
- Modify: `src/auth/auth.module.ts`

**Interfaces:**
- Consumes: `PhoneOtpService.requestCode/verifyCode` (Tasks 2-3), `PhoneRegistrationService.register` (Task 4), `Public` de `../decorators/public.decorator`.
- Produces: les routes `POST /api/v1/auth/phone/otp`, `POST /api/v1/auth/phone/otp/verify`, `POST /api/v1/auth/phone/register`.

- [ ] **Step 1 : Écrire les DTO**

Créer `src/auth/phone-registration/dto/send-otp.dto.ts` :

```ts
import { ApiProperty } from '@nestjs/swagger';
import { Matches } from 'class-validator';

export class SendOtpDto {
  @ApiProperty({ example: '+224622201362', description: 'Numéro au format E.164' })
  @Matches(/^\+\d{8,15}$/, {
    message: 'Le numéro doit être au format E.164 (ex. +224622201362)',
  })
  phone: string;
}

export class SendOtpResponseDto {
  @ApiProperty({ example: 300, description: 'Durée de validité du code, en secondes' })
  expiresIn: number;

  @ApiProperty({ example: 60, description: 'Délai avant un nouvel envoi possible, en secondes' })
  resendAfter: number;
}
```

Créer `src/auth/phone-registration/dto/verify-otp.dto.ts` :

```ts
import { ApiProperty } from '@nestjs/swagger';
import { Matches } from 'class-validator';

export class VerifyOtpDto {
  @ApiProperty({ example: '+224622201362' })
  @Matches(/^\+\d{8,15}$/, {
    message: 'Le numéro doit être au format E.164 (ex. +224622201362)',
  })
  phone: string;

  @ApiProperty({ example: '123456', description: 'Code à 6 chiffres reçu par SMS' })
  @Matches(/^\d{6}$/, { message: 'Le code comporte 6 chiffres' })
  code: string;
}

export class PrefilledProfileDto {
  @ApiProperty({ example: 'Awa' })
  firstName: string;

  @ApiProperty({ example: 'Diallo' })
  lastName: string;

  @ApiProperty({ example: '1990-05-12', nullable: true })
  birthDate: string | null;
}

export class VerifiedAccountDto {
  @ApiProperty({
    enum: ['active', 'pending', 'inactive', 'suspended', 'absent'],
    description: "Ce que porte le numéro. Aiguille l'écran suivant du parcours.",
  })
  statut: 'active' | 'pending' | 'inactive' | 'suspended' | 'absent';

  @ApiProperty({
    required: false,
    type: PrefilledProfileDto,
    description: 'Présent seulement pour pending / inactive',
  })
  profil?: PrefilledProfileDto;
}

export class VerifyOtpResponseDto {
  @ApiProperty({ description: 'Jeton court, à usage unique, valable 15 minutes' })
  registrationToken: string;

  @ApiProperty({ type: VerifiedAccountDto })
  account: VerifiedAccountDto;
}
```

Créer `src/auth/phone-registration/dto/register-by-phone.dto.ts` :

```ts
import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class RegisterByPhoneDto {
  @ApiProperty({ description: 'Jeton délivré par /auth/phone/otp/verify' })
  @IsString()
  registrationToken: string;

  @ApiProperty({ example: 'Awa' })
  @IsString()
  @MinLength(2)
  @MaxLength(60)
  firstName: string;

  @ApiProperty({ example: 'Diallo' })
  @IsString()
  @MinLength(2)
  @MaxLength(60)
  lastName: string;

  @ApiProperty({ example: '1990-05-12' })
  @IsDateString()
  birthDate: string;

  @ApiProperty({ example: 'region-id-123' })
  @IsString()
  regionId: string;

  @ApiProperty({ example: 'pref-id-123' })
  @IsString()
  prefectureId: string;

  @ApiProperty({ example: 'sous-pref-id-123' })
  @IsString()
  sousPrefectureId: string;

  @ApiProperty({ example: '123456', description: 'Code confidentiel à 6 chiffres' })
  @Matches(/^\d{6}$/, { message: 'Le code confidentiel comporte 6 chiffres' })
  pin: string;
}

export class RegisterByPhoneResponseDto {
  @ApiProperty({ example: 'Xh3k...' })
  uid: string;

  @ApiProperty({ example: 'Compte créé' })
  message: string;
}
```

- [ ] **Step 2 : Écrire le contrôleur**

Créer `src/auth/phone-registration/phone-registration.controller.ts` :

```ts
import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '../decorators/public.decorator';
import { PhoneOtpService } from './phone-otp.service';
import { PhoneRegistrationService } from './phone-registration.service';
import { SendOtpDto, SendOtpResponseDto } from './dto/send-otp.dto';
import { VerifyOtpDto, VerifyOtpResponseDto } from './dto/verify-otp.dto';
import {
  RegisterByPhoneDto,
  RegisterByPhoneResponseDto,
} from './dto/register-by-phone.dto';

/**
 * Inscription autonome d'un agriculteur, à partir de son seul numéro.
 *
 * Les trois routes sont publiques par construction : celui qui les appelle
 * n'a, par définition, pas encore de compte. `@Public()` le dit explicitement
 * pour que l'ajout ultérieur d'un garde global ne les ferme pas par accident.
 */
@ApiTags('Auth')
@Controller('auth/phone')
export class PhoneRegistrationController {
  constructor(
    private otpService: PhoneOtpService,
    private registrationService: PhoneRegistrationService,
  ) {}

  @Post('otp')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Envoyer un code de vérification par SMS',
    description:
      "Répond 200 même pour un numéro inconnu : une réponse différenciée révélerait qui est inscrit avant toute preuve de possession du téléphone. 429 uniquement au-delà du plafond horaire d'envois.",
  })
  @ApiResponse({ status: 200, type: SendOtpResponseDto })
  @ApiResponse({ status: 429, description: 'Plafond horaire atteint pour ce numéro' })
  async sendOtp(@Body() dto: SendOtpDto): Promise<SendOtpResponseDto> {
    return this.otpService.requestCode(dto.phone);
  }

  @Post('otp/verify')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Vérifier le code et découvrir ce que porte le numéro',
    description:
      "Rend un jeton d'inscription à usage unique (15 min) et le statut du compte, qui aiguille l'écran suivant.",
  })
  @ApiResponse({ status: 200, type: VerifyOtpResponseDto })
  @ApiResponse({ status: 400, description: 'Code invalide ou expiré' })
  async verifyOtp(@Body() dto: VerifyOtpDto): Promise<VerifyOtpResponseDto> {
    return this.otpService.verifyCode(dto.phone, dto.code);
  }

  @Post('register')
  @Public()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Créer le compte agriculteur',
    description:
      "Crée l'utilisateur Firebase et une fiche agriculteur allégée, sans partenaire ni technicien.",
  })
  @ApiResponse({ status: 201, type: RegisterByPhoneResponseDto })
  @ApiResponse({ status: 400, description: "Jeton d'inscription absent, expiré ou déjà consommé" })
  @ApiResponse({ status: 403, description: 'Compte suspendu' })
  @ApiResponse({ status: 409, description: 'Un compte existe déjà pour ce numéro' })
  async register(
    @Body() dto: RegisterByPhoneDto,
  ): Promise<RegisterByPhoneResponseDto> {
    return this.registrationService.register(dto);
  }
}
```

- [ ] **Step 3 : Câbler le module**

Remplacer intégralement `src/auth/auth.module.ts` par :

```ts
import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { FirebaseAuthGuard } from './guards/firebase-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { EngineersModule } from '../engineers/engineers.module';
import { PartnersModule } from '../partners/partners.module';
import { FarmersModule } from '../farmers/farmers.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { FederatedAuthController } from './federated/federated-auth.controller';
import { FederatedAuthService } from './federated/federated-auth.service';
import { PhoneRegistrationController } from './phone-registration/phone-registration.controller';
import { PhoneOtpService } from './phone-registration/phone-otp.service';
import { PhoneRegistrationService } from './phone-registration/phone-registration.service';

@Module({
  // `FarmersModule` fournit `createMinimalProfile` (fiche agriculteur allégée)
  // et `NotificationsModule` le canal SMS de l'OTP.
  imports: [
    EngineersModule,
    PartnersModule,
    FarmersModule,
    NotificationsModule,
  ],
  controllers: [
    AuthController,
    FederatedAuthController,
    PhoneRegistrationController,
  ],
  providers: [
    AuthService,
    FederatedAuthService,
    PhoneOtpService,
    PhoneRegistrationService,
    FirebaseAuthGuard,
    RolesGuard,
  ],
  exports: [AuthService, FirebaseAuthGuard, RolesGuard],
})
export class AuthModule {}
```

- [ ] **Step 4 : Vérifier que l'application démarre et que tout compile**

```bash
npm run build && npm test && npm run lint
```

Attendu : build sans erreur, tous les tests au vert, lint propre.

Si le build signale une dépendance circulaire `AuthModule → FarmersModule`, c'est un faux positif attendu du chemin `AuthModule → EngineersModule → FarmersModule` déjà existant : vérifier avec `npm run start:dev` que l'application démarre bien et que `GET /api/docs` liste les trois routes `auth/phone`.

- [ ] **Step 5 : Commit**

```bash
git add src/auth/phone-registration/dto src/auth/phone-registration/phone-registration.controller.ts src/auth/auth.module.ts
git commit -m "feat(auth): expose les trois routes publiques d inscription par telephone"
```

---

### Task 6 : Ouvrir `GET /sous-prefectures`

Un référentiel administratif public, sans donnée personnelle — même traitement que `/regions` et `/prefectures`, que le parcours consomme déjà sans compte.

**Files:**
- Modify: `src/sous-prefectures/sous-prefectures.controller.ts`

**Interfaces:**
- Consumes: `Public` de `../auth/decorators/public.decorator`.
- Produces: `GET /api/v1/sous-prefectures?prefectureId=…&limit=200` accessible sans jeton.

- [ ] **Step 1 : Ajouter l'import**

Dans `src/sous-prefectures/sous-prefectures.controller.ts`, sous l'import de `Roles` :

```ts
import { Public } from '../auth/decorators/public.decorator';
```

- [ ] **Step 2 : Marquer la route publique**

Remplacer, dans le même fichier :

```ts
  @Get()
  @ApiOperation({ summary: 'List all sous-prefectures' })
```

par :

```ts
  @Get()
  // Référentiel administratif public, sans donnée personnelle — aligné sur
  // /regions et /prefectures. Le parcours d'inscription en a besoin avant que
  // le compte n'existe : le laisser derrière le garde le rendrait inatteignable.
  @Public()
  @ApiOperation({ summary: 'List all sous-prefectures' })
```

- [ ] **Step 3 : Vérifier**

```bash
npm run build && npm run lint
```

Puis, application lancée (`npm run start:dev`), sans en-tête d'autorisation :

```bash
curl -s -o /dev/null -w '%{http_code}\n' 'http://localhost:8080/api/v1/sous-prefectures?limit=1'
```

Attendu : `200`. (Avant le changement : `401`.)

- [ ] **Step 4 : Commit**

```bash
git add src/sous-prefectures/sous-prefectures.controller.ts
git commit -m "feat(referentiel): ouvre la liste des sous-prefectures aux appels publics"
```

---

### Task 7 : `GET /farmers/:id/account-state`

L'app a besoin de savoir si un compte auto-inscrit a été adopté — un domaine, ou un technicien. `GET /farmers/:id` n'est pas ouvert au rôle FARMER et ne le sera pas (il rendrait lisible la fiche d'autrui) : d'où une route étroite, qui ne rend que deux booléens.

**Files:**
- Create: `src/farmers/dto/farmer-account-state.dto.ts`
- Modify: `src/farmers/farmers.service.ts`
- Modify: `src/farmers/farmers.controller.ts`
- Test: `src/farmers/farmers.service.account-state.spec.ts`

**Interfaces:**
- Consumes: `FarmerDocument`, `enforceFarmerAccess(user, farmer)` (privés, déjà dans `farmers.service.ts`), `AuthUserDto`.
- Produces:
  - `class FarmerAccountStateDto { hasFarms: boolean; hasEngineer: boolean }`
  - `FarmersService.getAccountState(userId: string, user: AuthUserDto): Promise<FarmerAccountStateDto>`
  - `GET /api/v1/farmers/:id/account-state`

- [ ] **Step 1 : Écrire le test qui échoue**

Créer `src/farmers/farmers.service.account-state.spec.ts` :

```ts
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { FarmersService } from './farmers.service';
import { UserRole } from '../common/types/user-role.enum';

const FARMER_USER = { uid: 'uid-1', role: UserRole.FARMER } as never;

function makeService(options: {
  farmerDoc?: Record<string, unknown> | null;
  farmsEmpty?: boolean;
}) {
  const farmersGet = jest.fn().mockResolvedValue({
    empty: !options.farmerDoc,
    docs: options.farmerDoc ? [{ id: 'farmer-1', data: () => options.farmerDoc }] : [],
  });
  const farmsGet = jest
    .fn()
    .mockResolvedValue({ empty: options.farmsEmpty ?? true, docs: [] });

  const firestore = {
    collection: jest.fn((name: string) =>
      name === 'farms'
        ? { where: () => ({ limit: () => ({ get: farmsGet }) }) }
        : { where: () => ({ limit: () => ({ get: farmersGet }) }) },
    ),
  };

  // `FarmersService` ne prend que deux dépendances : Firebase et la config.
  return new FarmersService(
    { getFirestore: () => firestore } as never,
    { get: jest.fn().mockReturnValue('') } as never,
  );
}

describe('FarmersService.getAccountState', () => {
  it('dit « rien de rattaché » pour un compte auto-inscrit', async () => {
    const service = makeService({
      farmerDoc: { userId: 'uid-1', farmIds: [] },
      farmsEmpty: true,
    });

    await expect(service.getAccountState('uid-1', FARMER_USER)).resolves.toEqual({
      hasFarms: false,
      hasEngineer: false,
    });
  });

  it('voit un domaine tracé sur la collection farms', async () => {
    const service = makeService({
      farmerDoc: { userId: 'uid-1', farmIds: [] },
      farmsEmpty: false,
    });

    const state = await service.getAccountState('uid-1', FARMER_USER);
    expect(state.hasFarms).toBe(true);
  });

  it('voit un domaine listé sur le tableau dénormalisé farmIds', async () => {
    const service = makeService({
      farmerDoc: { userId: 'uid-1', farmIds: ['farm-9'] },
      farmsEmpty: true,
    });

    const state = await service.getAccountState('uid-1', FARMER_USER);
    expect(state.hasFarms).toBe(true);
  });

  it('voit un technicien assigné, principal ou remplaçant', async () => {
    const principal = makeService({
      farmerDoc: { userId: 'uid-1', farmIds: [], assignedEngineerId: 'eng-1' },
    });
    await expect(principal.getAccountState('uid-1', FARMER_USER)).resolves.toEqual({
      hasFarms: false,
      hasEngineer: true,
    });

    const remplacant = makeService({
      farmerDoc: { userId: 'uid-1', farmIds: [], engineerIds: ['eng-2'] },
    });
    const state = await remplacant.getAccountState('uid-1', FARMER_USER);
    expect(state.hasEngineer).toBe(true);
  });

  it('refuse à un agriculteur la lecture de l état d un autre', async () => {
    const service = makeService({ farmerDoc: { userId: 'uid-2', farmIds: [] } });

    await expect(service.getAccountState('uid-2', FARMER_USER)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('renvoie 404 quand aucune fiche agriculteur ne porte cet utilisateur', async () => {
    const service = makeService({ farmerDoc: null });

    await expect(service.getAccountState('uid-1', FARMER_USER)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
```

- [ ] **Step 2 : Lancer le test pour vérifier qu'il échoue**

```bash
npx jest src/farmers/farmers.service.account-state.spec.ts
```

Attendu : ÉCHEC — `service.getAccountState is not a function`.

- [ ] **Step 3 : Écrire le DTO**

Créer `src/farmers/dto/farmer-account-state.dto.ts` :

```ts
import { ApiProperty } from '@nestjs/swagger';

/**
 * L'état de rattachement d'un agriculteur, réduit à ce dont l'app a besoin
 * pour décider entre « application complète » et « écran de bienvenue seul ».
 * Volontairement pauvre : elle est lisible par l'agriculteur lui-même.
 */
export class FarmerAccountStateDto {
  @ApiProperty({ description: 'Au moins un domaine existe' })
  hasFarms: boolean;

  @ApiProperty({ description: 'Un technicien est assigné (principal ou remplaçant)' })
  hasEngineer: boolean;
}
```

- [ ] **Step 4 : Écrire la méthode du service**

Dans `src/farmers/farmers.service.ts`, ajouter l'import du DTO auprès des autres imports de `./dto/…` :

```ts
import { FarmerAccountStateDto } from './dto/farmer-account-state.dto';
```

Puis insérer la méthode juste avant `async getFarms(` :

```ts
  /**
   * Deux booléens, et rien d'autre : l'app doit savoir si le compte a été
   * adopté (un domaine tracé, ou un technicien assigné) pour choisir entre
   * l'application complète et l'écran de bienvenue seul. Une route étroite
   * plutôt que l'ouverture de `GET /farmers/:id`, qui rendrait lisible la
   * fiche complète d'un tiers.
   */
  async getAccountState(
    userId: string,
    user: AuthUserDto,
  ): Promise<FarmerAccountStateDto> {
    const firestore = this.firebaseService.getFirestore();
    const snapshot = await firestore
      .collection(this.collection)
      .where('userId', '==', userId)
      .limit(1)
      .get();

    if (snapshot.empty) {
      throw new NotFoundException('Farmer not found');
    }

    const farmer = snapshot.docs[0].data() as FarmerDocument;
    await this.enforceFarmerAccess(user, farmer);

    // Même union que `getFarms` : la requête directe sur `farms` rattrape les
    // domaines absents du tableau dénormalisé, et réciproquement.
    const ownedSnap = await firestore
      .collection('farms')
      .where('farmerId', '==', userId)
      .limit(1)
      .get();

    const hasFarms =
      !ownedSnap.empty ||
      (farmer.farmIds?.length ?? 0) > 0 ||
      (farmer.communalFarmIds?.length ?? 0) > 0;

    const hasEngineer =
      Boolean(farmer.assignedEngineerId) ||
      (farmer.engineerIds?.length ?? 0) > 0;

    return { hasFarms, hasEngineer };
  }
```

- [ ] **Step 5 : Lancer le test pour vérifier qu'il passe**

```bash
npx jest src/farmers/farmers.service.account-state.spec.ts
```

Attendu : SUCCÈS, 6 tests.

- [ ] **Step 6 : Exposer la route**

Dans `src/farmers/farmers.controller.ts`, ajouter l'import :

```ts
import { FarmerAccountStateDto } from './dto/farmer-account-state.dto';
```

Puis insérer, juste avant `@Get(':id/farms')` :

```ts
  @Get(':id/account-state')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.PARTNER_ADMIN,
    UserRole.PARTNER_MANAGER,
    UserRole.ENGINEER,
    UserRole.FARMER,
  )
  @ApiOperation({
    summary: "État de rattachement du compte agriculteur",
    description:
      "Deux booléens : `hasFarms` (au moins un domaine) et `hasEngineer` (un technicien assigné). L'app mobile s'en sert pour distinguer un compte auto-inscrit non encore adopté — qui ne voit qu'un écran de bienvenue — d'un compte suivi.",
  })
  @ApiResponse({ status: 200, type: FarmerAccountStateDto })
  @ApiResponse({ status: 404, description: 'Farmer not found' })
  async getAccountState(
    @Param('id') id: string,
    @CurrentUser() user: AuthUserDto,
  ): Promise<FarmerAccountStateDto> {
    return this.farmersService.getAccountState(id, user);
  }
```

- [ ] **Step 7 : Vérification complète**

```bash
npm test && npm run lint && npm run build
```

Attendu : tous les tests au vert, lint propre, build sans erreur.

- [ ] **Step 8 : Commit**

```bash
git add src/farmers/dto/farmer-account-state.dto.ts src/farmers/farmers.service.ts src/farmers/farmers.controller.ts src/farmers/farmers.service.account-state.spec.ts
git commit -m "feat(farmers): expose l etat de rattachement du compte agriculteur"
```

---

## Après le plan

**Variable d'environnement à poser avant tout déploiement :**

`OTP_HASH_SECRET` — chaîne aléatoire d'au moins 32 octets, distincte en DEV et en PROD. Sans elle, le service démarre mais l'avertissement `OTP_HASH_SECRET absent` apparaît au journal et les empreintes ne sont salées que par le numéro. À ajouter aux secrets Cloud Run des deux environnements.

**Vérification manuelle, sur l'API déployée en DEV :**

1. `POST /api/v1/auth/phone/otp` avec un numéro **inconnu** → `200 {expiresIn:300, resendAfter:60}`.
2. Le même appel avec un numéro **connu** → réponse **identique au caractère près**.
3. Rejouer immédiatement → `200` avec `resendAfter` < 60, **aucun second SMS reçu**.
4. Six appels espacés de plus d'une minute → le sixième renvoie `429`.
5. `POST /auth/phone/otp/verify` avec un mauvais code, cinq fois, puis le bon → `400` les six fois.
6. Réception réelle du SMS sur un téléphone guinéen (facturé — un seul essai suffit).
