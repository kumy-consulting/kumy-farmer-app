# Inviter l'agriculteur à compléter son profil — Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Proposer à un agriculteur sans domaine tracé, cinq secondes après son arrivée sur l'accueil, un questionnaire en trois étapes dont les réponses alimentent son dossier et le pilier Social de son AgriScore.

**Architecture:** Une route d'écriture `PATCH /farmers/me/profil` en liste blanche, qui répartit les réponses entre `users/{uid}` (identité) et `farmers/{id}` (exploitation) et tient un marqueur d'avancement. Côté app, un questionnaire plein écran hors `AppLayout`, une écriture par étape validée, et une modale d'invitation dont la règle de déclenchement vit dans `AppLayout`.

**Tech Stack:** NestJS 11 + Firestore côté API (tests Jest) ; React 19 + MUI + Zustand côté app (tests Vitest + Testing Library).

**Spec:** `docs/superpowers/specs/2026-08-28-profil-scoring-design.md`

## Global Constraints

- **Deux dépôts.** Tâches 1 à 4 : `agripilot-backoffice-api`. Tâches 5 à 10 : `kumy-farmer-app`. Chaque dépôt a sa branche et ses commits.
- **Langue.** Documentation, commentaires et messages de commit en français ; identifiants de code en anglais quand ils prolongent l'existant (`profileSurvey`, `declaredLandTenure`), en français quand ils sont nouveaux et propres à l'app (`useQuestionnaireProfil`, `EtapeVous`).
- **Phrase de la modale, au mot près :** « Ces réponses nous aident à mieux vous accompagner, et comptent dans votre AgriScore. » Aucune promesse chiffrée, aucun « améliorez votre score ».
- **Police** `'Ubuntu', sans-serif` sur tout titre ; vert de marque `#018675`, vert profond `#016557`.
- **Piège du moteur de score :** l'engin considère qu'un agriculteur est membre d'une coopérative dès que `cooperativeMembership` **existe**, même vide (600/1000 au lieu de 200). Un non-membre ne doit donc jamais recevoir d'objet vide : le champ est supprimé.
- **Commits conventionnels** (`feat(...)`, `test(...)`), hooks Husky actifs côté app (ESLint au pre-commit).

## Structure des fichiers

**`agripilot-backoffice-api`**

| Fichier | Responsabilité |
|---|---|
| `src/farmers/dto/update-own-profile.dto.ts` *(créer)* | Liste blanche des champs que l'agriculteur peut écrire, bornes, énumérés |
| `src/farmers/dto/farmer-self.dto.ts` *(modifier)* | Ajout de `profileSurvey`, des identifiants d'échelons et des champs de préremplissage |
| `src/farmers/farmers.service.ts` *(modifier)* | `updateOwnProfile()` — répartition users/farmers, marqueur, coopérative |
| `src/farmers/farmers.controller.ts` *(modifier)* | Route `PATCH me/profil`, déclarée avant `@Get(':id')` |
| `src/farmers/farmers.service.spec.ts` *(modifier)* | Tests de la répartition, du marqueur et des bornes |
| `src/farmers/farmers.controller.spec.ts` *(modifier)* | Test des rôles et de l'ordre de déclaration |

**`kumy-farmer-app`**

| Fichier | Responsabilité |
|---|---|
| `src/features/Profil/profil.types.ts` *(créer)* | Types du questionnaire et du marqueur |
| `src/features/Profil/profil.api.ts` *(créer)* | `GET /farmers/me` (préremplissage) et `PATCH /farmers/me/profil` |
| `src/features/Profil/useQuestionnaireProfil.ts` *(créer)* | Chargement, préremplissage, envoi par étape, reprise |
| `src/features/Profil/questionnaire.content.ts` *(créer)* | Libellés, tranches d'expérience, options des listes |
| `src/features/Profil/components/ChampsQuestionnaire.tsx` *(créer)* | Champ texte, choix oui/non, choix multiple — l'habillage commun |
| `src/features/Profil/components/EtapeVous.tsx` *(créer)* | Étape 1 |
| `src/features/Profil/components/EtapeParcours.tsx` *(créer)* | Étape 2 |
| `src/features/Profil/components/EtapeExploitation.tsx` *(créer)* | Étape 3 |
| `src/features/Profil/QuestionnaireProfilPage.tsx` *(créer)* | Rail, navigation, envoi, erreurs |
| `src/features/Profil/ModaleInvitationProfil.tsx` *(créer)* | La modale |
| `src/features/Profil/invitationProfil.store.ts` *(créer)* | Drapeau de session « déjà proposée » |
| `src/shared/components/AppLayout.tsx` *(modifier)* | Règle de déclenchement + porte `/mon-profil/completer` |
| `src/shared/routes/index.tsx` *(modifier)* | Route hors `AppLayout` |
| `src/features/Home/useCompteNouveau.ts` *(modifier)* | Expose `aDesDomaines` |
| `src/features/MonEspace/MesInformationsPage.tsx` *(modifier)* | Entrée permanente avec avancement |

---

### Task 1 : DTO d'écriture en liste blanche

**Files:**
- Create: `src/farmers/dto/update-own-profile.dto.ts`
- Test: `src/farmers/dto/update-own-profile.dto.spec.ts`

**Interfaces:**
- Consumes: `EducationLevel`, `Gender` de `./create-farmer.dto`
- Produces: `UpdateOwnProfileDto`, `MaritalStatus`, `DeclaredLandTenure`

- [ ] **Step 1: Écrire le test qui échoue**

```typescript
// src/farmers/dto/update-own-profile.dto.spec.ts
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { UpdateOwnProfileDto } from './update-own-profile.dto';

const valider = (donnees: Record<string, unknown>) =>
  validateSync(plainToInstance(UpdateOwnProfileDto, donnees), {
    whitelist: true,
    forbidNonWhitelisted: true,
  });

describe('UpdateOwnProfileDto', () => {
  it('accepte une étape valide', () => {
    expect(valider({ step: 2, farmingExperience: 5, hasCreditRuralAccount: true })).toHaveLength(0);
  });

  it('refuse un champ hors liste — le partenaire ne se choisit pas', () => {
    const erreurs = valider({ step: 1, partnerId: 'partenaire-2' });
    expect(erreurs.map((e) => e.property)).toContain('partnerId');
  });

  it('refuse une étape hors des trois', () => {
    expect(valider({ step: 4 })).not.toHaveLength(0);
  });

  it('borne les hectares et le nombre d’enfants', () => {
    expect(valider({ step: 3, cultivatedHectares: 20000 })).not.toHaveLength(0);
    expect(valider({ step: 1, childrenCount: 45 })).not.toHaveLength(0);
  });

  it('borne la liste des cultures', () => {
    expect(valider({ step: 3, primaryCrops: new Array(16).fill('riz') })).not.toHaveLength(0);
  });
});
```

- [ ] **Step 2: Lancer le test pour le voir échouer**

Run: `npx jest src/farmers/dto/update-own-profile.dto.spec.ts`
Expected: FAIL — `Cannot find module './update-own-profile.dto'`

- [ ] **Step 3: Écrire le DTO**

```typescript
// src/farmers/dto/update-own-profile.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize, IsArray, IsBoolean, IsDateString, IsEnum, IsIn, IsInt,
  IsNumber, IsOptional, IsString, MaxLength, Max, Min, ValidateNested,
} from 'class-validator';
import { EducationLevel, Gender } from './create-farmer.dto';

export enum MaritalStatus {
  SINGLE = 'single',
  MARRIED = 'married',
  WIDOWED = 'widowed',
  DIVORCED = 'divorced',
}

/** Foncier DÉCLARÉ par l'agriculteur — distinct de `farms.landTenure`, constaté au traçage. */
export enum DeclaredLandTenure {
  OWNED = 'owned',
  INHERITED = 'inherited',
  LEASED = 'leased',
  COMMUNAL = 'communal',
  OTHER = 'other',
}

export class OwnCooperativeDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  isMember: boolean;

  @ApiProperty({ required: false, example: 'Coopérative maraîchère de Tanènè' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @ApiProperty({ required: false, example: '2019-01-01' })
  @IsOptional()
  @IsDateString()
  joinDate?: string;
}

/**
 * Ce qu'un agriculteur peut écrire dans son propre dossier — et rien d'autre.
 *
 * `partnerId`, `assignedEngineerId`, `subscription` et `tags` sont absents à
 * dessein : un téléphone volé ne doit pas pouvoir réaffecter son porteur.
 * Le contrôleur valide avec `forbidNonWhitelisted`, donc leur seule absence ici
 * suffit à faire répondre 400.
 */
export class UpdateOwnProfileDto {
  @ApiProperty({ example: 2, description: "L'étape validée : 1, 2 ou 3." })
  @IsInt()
  @IsIn([1, 2, 3])
  step: number;

  @ApiProperty({ required: false, example: 'Mamadou' })
  @IsOptional() @IsString() @MaxLength(60)
  firstName?: string;

  @ApiProperty({ required: false, example: 'Barry' })
  @IsOptional() @IsString() @MaxLength(60)
  lastName?: string;

  @ApiProperty({ required: false, example: '1986-04-12' })
  @IsOptional() @IsDateString()
  dateOfBirth?: string;

  @ApiProperty({ required: false, enum: Gender })
  @IsOptional() @IsEnum(Gender)
  gender?: Gender;

  @ApiProperty({ required: false, enum: EducationLevel })
  @IsOptional() @IsEnum(EducationLevel)
  educationLevel?: EducationLevel;

  @ApiProperty({ required: false, enum: MaritalStatus })
  @IsOptional() @IsEnum(MaritalStatus)
  maritalStatus?: MaritalStatus;

  @ApiProperty({ required: false, example: 3 })
  @IsOptional() @IsInt() @Min(0) @Max(30)
  childrenCount?: number;

  @ApiProperty({ required: false, example: 5, description: 'Borne basse de la tranche choisie.' })
  @IsOptional() @IsInt() @Min(0) @Max(80)
  farmingExperience?: number;

  @ApiProperty({ required: false, type: OwnCooperativeDto })
  @IsOptional() @ValidateNested() @Type(() => OwnCooperativeDto)
  cooperative?: OwnCooperativeDto;

  @ApiProperty({ required: false, example: false })
  @IsOptional() @IsBoolean()
  hasCreditRuralAccount?: boolean;

  @ApiProperty({ required: false, example: 'Fertilisation, irrigation' })
  @IsOptional() @IsString() @MaxLength(500)
  declaredTrainings?: string;

  @ApiProperty({ required: false, example: 'Motopompe, pulvérisateur' })
  @IsOptional() @IsString() @MaxLength(500)
  declaredEquipment?: string;

  @ApiProperty({ required: false, example: 'reg-1' })
  @IsOptional() @IsString()
  regionId?: string;

  @ApiProperty({ required: false, example: 'pref-1' })
  @IsOptional() @IsString()
  prefectureId?: string;

  @ApiProperty({ required: false, example: 'sp-1' })
  @IsOptional() @IsString()
  sousPrefectureId?: string;

  @ApiProperty({ required: false, example: 2.5 })
  @IsOptional() @IsNumber() @Min(0) @Max(10000)
  cultivatedHectares?: number;

  @ApiProperty({ required: false, example: ['riz', 'maïs'] })
  @IsOptional() @IsArray() @ArrayMaxSize(15) @IsString({ each: true }) @MaxLength(40, { each: true })
  primaryCrops?: string[];

  @ApiProperty({ required: false, enum: DeclaredLandTenure })
  @IsOptional() @IsEnum(DeclaredLandTenure)
  declaredLandTenure?: DeclaredLandTenure;
}
```

- [ ] **Step 4: Lancer le test pour le voir passer**

Run: `npx jest src/farmers/dto/update-own-profile.dto.spec.ts`
Expected: PASS — 5 tests

- [ ] **Step 5: Commit**

```bash
git add src/farmers/dto/update-own-profile.dto.ts src/farmers/dto/update-own-profile.dto.spec.ts
git commit -m "feat(profil): la liste blanche des champs qu'un agriculteur peut ecrire"
```

---

### Task 2 : Écriture répartie entre les deux documents

**Files:**
- Modify: `src/farmers/farmers.service.ts` (après `updateOwnNotificationSettings`)
- Test: `src/farmers/farmers.service.spec.ts` (bloc `buildSelfService`, en fin de fichier)

**Interfaces:**
- Consumes: `UpdateOwnProfileDto` (Task 1), le double Firestore `makeSelfFirestore` déjà présent dans le spec
- Produces: `FarmersService.updateOwnProfile(userId: string, dto: UpdateOwnProfileDto): Promise<{ step: number; completedAt: string | null }>`

- [ ] **Step 1: Écrire les tests qui échouent**

Ajouter en fin de `src/farmers/farmers.service.spec.ts`. Le double `makeSelfFirestore` ne connaît que `get` et `update` : lui ajouter `set` (fusion) sur le magasin `farmerDocs` et sur `users` avant d'écrire ces tests.

```typescript
describe('FarmersService.updateOwnProfile — le questionnaire de profil', () => {
  it('range l’identité sur users et l’exploitation sur farmers', async () => {
    const users = JSON.parse(JSON.stringify(USERS)) as Record<string, Record<string, unknown>>;
    const fiches = JSON.parse(JSON.stringify(FICHE_COMPLETE)) as Record<string, Record<string, unknown>>;
    const { service } = await buildSelfService(fiches, users);

    await service.updateOwnProfile('uid-1', {
      step: 1,
      firstName: 'Mamadou',
      gender: Gender.MALE,
      educationLevel: EducationLevel.SECONDARY,
    } as UpdateOwnProfileDto);

    expect(users['uid-1'].firstName).toBe('Mamadou');
    expect(users['uid-1'].gender).toBe('male');
    expect(fiches.f1.educationLevel).toBe('secondary');
    // L'identité ne se duplique pas dans le dossier agriculteur.
    expect(fiches.f1.firstName).toBeUndefined();
  });

  it('n’écrit AUCUNE coopérative pour un non-membre', async () => {
    // Le moteur de score compte membre dès que le champ existe, même vide :
    // un objet vide vaudrait 600/1000 au lieu de 200.
    const fiches = JSON.parse(JSON.stringify(FICHE_COMPLETE)) as Record<string, Record<string, unknown>>;
    const { service } = await buildSelfService(fiches);

    await service.updateOwnProfile('uid-1', {
      step: 2,
      cooperative: { isMember: false },
    } as UpdateOwnProfileDto);

    expect(fiches.f1.cooperativeMembership).toBeUndefined();
  });

  it('écrit la coopérative avec sa date d’adhésion', async () => {
    const fiches = JSON.parse(JSON.stringify(FICHE_COMPLETE)) as Record<string, Record<string, unknown>>;
    const { service } = await buildSelfService(fiches);

    await service.updateOwnProfile('uid-1', {
      step: 2,
      cooperative: { isMember: true, name: 'Tanènè', joinDate: '2019-01-01' },
    } as UpdateOwnProfileDto);

    expect(fiches.f1.cooperativeMembership).toEqual({ name: 'Tanènè', joinDate: '2019-01-01' });
  });

  it('avance le marqueur sans jamais le faire reculer', async () => {
    const fiches = JSON.parse(JSON.stringify(FICHE_COMPLETE)) as Record<string, Record<string, unknown>>;
    const { service } = await buildSelfService(fiches);

    await service.updateOwnProfile('uid-1', { step: 2 } as UpdateOwnProfileDto);
    await service.updateOwnProfile('uid-1', { step: 1 } as UpdateOwnProfileDto);

    expect((fiches.f1.profileSurvey as { step: number }).step).toBe(2);
  });

  it('pose completedAt à la troisième étape, pas avant', async () => {
    const fiches = JSON.parse(JSON.stringify(FICHE_COMPLETE)) as Record<string, Record<string, unknown>>;
    const { service } = await buildSelfService(fiches);

    await service.updateOwnProfile('uid-1', { step: 2 } as UpdateOwnProfileDto);
    expect((fiches.f1.profileSurvey as { completedAt: string | null }).completedAt).toBeNull();

    const resultat = await service.updateOwnProfile('uid-1', { step: 3 } as UpdateOwnProfileDto);
    expect(resultat.completedAt).not.toBeNull();
  });

  it('lève 404 pour un uid sans fiche agriculteur', async () => {
    const { service } = await buildSelfService();
    await expect(
      service.updateOwnProfile('uid-inconnu', { step: 1 } as UpdateOwnProfileDto),
    ).rejects.toThrow(NotFoundException);
  });

  it('n’écrase pas les champs absents du corps', async () => {
    const fiches = JSON.parse(JSON.stringify(FICHE_COMPLETE)) as Record<string, Record<string, unknown>>;
    const { service } = await buildSelfService(fiches);

    await service.updateOwnProfile('uid-1', { step: 3, cultivatedHectares: 2.5 } as UpdateOwnProfileDto);

    expect(fiches.f1.cultivatedHectares).toBe(2.5);
    expect(fiches.f1.farmerCode).toBe('KMY-DBK-0412');
  });
});
```

- [ ] **Step 2: Lancer les tests pour les voir échouer**

Run: `npx jest src/farmers/farmers.service.spec.ts -t "questionnaire de profil"`
Expected: FAIL — `service.updateOwnProfile is not a function`

- [ ] **Step 3: Écrire la méthode**

```typescript
  /**
   * Écrit les réponses du questionnaire de profil, une étape à la fois.
   *
   * **L'écriture est répartie entre deux documents.** `firstName`, `lastName`,
   * `dateOfBirth` et `gender` vivent sur `users/{uid}` ; le reste sur
   * `farmers/{id}`. `update()` fait déjà ce partage pour `notificationSettings`
   * — deux copies d'un nom divergent le jour où l'une des deux est corrigée.
   *
   * **Un non-membre de coopérative n'a PAS de champ `cooperativeMembership`.**
   * Le moteur de score considère membre quiconque porte ce champ, même vide :
   * un objet vide vaudrait 600/1000 au lieu des 200 du non-membre.
   */
  async updateOwnProfile(
    userId: string,
    dto: UpdateOwnProfileDto,
  ): Promise<{ step: number; completedAt: string | null }> {
    const farmer = await this.findByUserId(userId);
    if (!farmer) {
      throw new NotFoundException('Farmer not found');
    }

    const firestore = this.firebaseService.getFirestore();
    const maintenant = new Date().toISOString();

    const champsUser: Record<string, unknown> = {};
    if (dto.firstName !== undefined) champsUser.firstName = dto.firstName;
    if (dto.lastName !== undefined) champsUser.lastName = dto.lastName;
    if (dto.firstName !== undefined || dto.lastName !== undefined) {
      champsUser.displayName = `${dto.firstName ?? ''} ${dto.lastName ?? ''}`.trim();
    }
    if (dto.dateOfBirth !== undefined) champsUser.dateOfBirth = dto.dateOfBirth;
    if (dto.gender !== undefined) champsUser.gender = dto.gender;

    const champsFarmer: Record<string, unknown> = {};
    for (const cle of [
      'educationLevel', 'maritalStatus', 'childrenCount', 'farmingExperience',
      'hasCreditRuralAccount', 'declaredTrainings', 'declaredEquipment',
      'cultivatedHectares', 'primaryCrops', 'declaredLandTenure',
    ] as const) {
      if (dto[cle] !== undefined) champsFarmer[cle] = dto[cle];
    }

    if (dto.cooperative) {
      if (dto.cooperative.isMember) {
        const adhesion: Record<string, unknown> = {};
        if (dto.cooperative.name) adhesion.name = dto.cooperative.name;
        if (dto.cooperative.joinDate) adhesion.joinDate = dto.cooperative.joinDate;
        champsFarmer.cooperativeMembership = adhesion;
      } else {
        champsFarmer.cooperativeMembership = FieldValue.delete();
      }
    }

    if (dto.regionId || dto.prefectureId || dto.sousPrefectureId) {
      const adresse = (farmer.address ?? {}) as Record<string, unknown>;
      champsFarmer.address = {
        ...adresse,
        ...(dto.regionId ? { regionId: dto.regionId } : {}),
        ...(dto.prefectureId ? { prefectureId: dto.prefectureId } : {}),
        ...(dto.sousPrefectureId ? { sousPrefectureId: dto.sousPrefectureId } : {}),
      };
    }

    const precedent = (farmer.profileSurvey ?? {}) as { step?: number; completedAt?: string | null };
    const completedAt =
      dto.step === 3 ? maintenant : (precedent.completedAt ?? null);
    champsFarmer.profileSurvey = {
      step: Math.max(precedent.step ?? 0, dto.step),
      updatedAt: maintenant,
      completedAt,
    };

    if (Object.keys(champsUser).length > 0) {
      await firestore.collection('users').doc(userId).set(champsUser, { merge: true });
    }
    await firestore.collection(this.collection).doc(farmer.id).set(champsFarmer, { merge: true });

    return { step: Math.max(precedent.step ?? 0, dto.step), completedAt };
  }
```

Imports à ajouter en tête du service si absents : `FieldValue` depuis `firebase-admin/firestore`, `UpdateOwnProfileDto` depuis `./dto/update-own-profile.dto`.

- [ ] **Step 4: Lancer les tests pour les voir passer**

Run: `npx jest src/farmers/farmers.service.spec.ts -t "questionnaire de profil"`
Expected: PASS — 7 tests

- [ ] **Step 5: Commit**

```bash
git add src/farmers/farmers.service.ts src/farmers/farmers.service.spec.ts
git commit -m "feat(profil): l'agriculteur ecrit son questionnaire, une etape a la fois"
```

---

### Task 3 : La route, ouverte au seul rôle FARMER

**Files:**
- Modify: `src/farmers/farmers.controller.ts` (juste après `updateOwnNotificationSettings`, donc avant `@Get(':id')`)
- Test: `src/farmers/farmers.controller.spec.ts`

**Interfaces:**
- Consumes: `FarmersService.updateOwnProfile` (Task 2), `UpdateOwnProfileDto` (Task 1)
- Produces: `PATCH /api/v1/farmers/me/profil`

- [ ] **Step 1: Écrire le test qui échoue**

```typescript
// Ajouter dans src/farmers/farmers.controller.spec.ts
  it('n’ouvre le questionnaire de profil qu’au rôle FARMER', () => {
    expect(roles('updateOwnProfile')).toEqual([UserRole.FARMER]);
  });

  it('déclare le questionnaire avant la route à paramètre', () => {
    // `@Get(':id')` avalerait « me » comme un identifiant : le bug est
    // silencieux, la route répond avec la fiche de quelqu'un d'autre.
    expect(chemin('updateOwnProfile')).toBe('me/profil');
    expect(methodes.indexOf('updateOwnProfile')).toBeLessThan(methodes.indexOf('findOne'));
  });
```

- [ ] **Step 2: Lancer le test pour le voir échouer**

Run: `npx jest src/farmers/farmers.controller.spec.ts`
Expected: FAIL — `roles('updateOwnProfile')` vaut `undefined`

- [ ] **Step 3: Écrire la route**

```typescript
  @Patch('me/profil')
  @Roles(UserRole.FARMER)
  @ApiOperation({
    summary: "Questionnaire de profil de l'agriculteur connecté",
    description:
      "Écrit une étape validée du questionnaire. Le corps ne porte que les champs de cette étape ; tout champ hors liste blanche fait répondre 400. L'identité va sur users/{uid}, l'exploitation sur farmers/{id}.",
  })
  @ApiResponse({ status: 200, description: 'Marqueur d’avancement à jour' })
  @ApiResponse({ status: 400, description: 'Champ hors liste blanche ou hors bornes' })
  @ApiResponse({ status: 404, description: 'Aucune fiche agriculteur pour cet uid' })
  async updateOwnProfile(
    @CurrentUser() user: AuthUserDto,
    @Body() dto: UpdateOwnProfileDto,
  ): Promise<{ step: number; completedAt: string | null }> {
    return this.farmersService.updateOwnProfile(user.uid, dto);
  }
```

Vérifier que `main.ts` configure bien `ValidationPipe` avec `whitelist: true` et `forbidNonWhitelisted: true` ; sinon, poser ces options sur la route via `@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))`.

- [ ] **Step 4: Lancer les tests pour les voir passer**

Run: `npx jest src/farmers && npm run build`
Expected: PASS, build sans erreur

- [ ] **Step 5: Commit**

```bash
git add src/farmers/farmers.controller.ts src/farmers/farmers.controller.spec.ts
git commit -m "feat(profil): PATCH /farmers/me/profil, ouvert au seul role FARMER"
```

---

### Task 4 : De quoi préremplir le questionnaire

**Files:**
- Modify: `src/farmers/dto/farmer-self.dto.ts`
- Modify: `src/farmers/farmers.service.ts` (`getSelf`)
- Test: `src/farmers/farmers.service.spec.ts` (bloc `getSelf`)

**Interfaces:**
- Produces: `FarmerSelfDto.profileSurvey`, `FarmerSelfDto.address.{regionId,prefectureId,sousPrefectureId}`, `FarmerSelfDto.questionnaire`

- [ ] **Step 1: Écrire les tests qui échouent**

```typescript
// Dans le describe « FarmersService.getSelf »
  it('rend les identifiants d’échelons, pas seulement leurs noms', async () => {
    // Les listes déroulantes du questionnaire se préremplissent par id.
    const { service } = await buildSelfService();
    const dto = await service.getSelf('uid-1');

    expect(dto.address.regionId).toBe('reg-1');
    expect(dto.address.prefectureId).toBe('pref-1');
    expect(dto.address.sousPrefectureId).toBe('sp-1');
  });

  it('rend l’avancement du questionnaire, nul quand il n’a jamais été ouvert', async () => {
    const { service } = await buildSelfService();
    expect((await service.getSelf('uid-1')).profileSurvey).toEqual({ step: 0, completedAt: null });
  });

  it('rend les réponses déjà données', async () => {
    const fiches = {
      f1: { ...FICHE_COMPLETE.f1, farmingExperience: 10, cultivatedHectares: 2.5, primaryCrops: ['riz'] },
    };
    const { service } = await buildSelfService(fiches);
    const dto = await service.getSelf('uid-1');

    expect(dto.questionnaire.farmingExperience).toBe(10);
    expect(dto.questionnaire.cultivatedHectares).toBe(2.5);
    expect(dto.questionnaire.primaryCrops).toEqual(['riz']);
    expect(dto.questionnaire.cooperative).toEqual({ isMember: true, name: 'Coopérative maraîchère de Tanènè' });
  });
```

- [ ] **Step 2: Lancer les tests pour les voir échouer**

Run: `npx jest src/farmers/farmers.service.spec.ts -t "getSelf"`
Expected: FAIL — `dto.address.regionId` vaut `undefined`

- [ ] **Step 3: Étendre le DTO et `getSelf`**

Dans `farmer-self.dto.ts`, ajouter à `FarmerSelfAddressDto` les trois identifiants (`regionId?`, `prefectureId?`, `sousPrefectureId?`), puis les deux classes :

```typescript
export class FarmerSelfSurveyDto {
  @ApiProperty({ example: 2, description: '0 quand le questionnaire n’a jamais été ouvert.' })
  step: number;

  @ApiProperty({ nullable: true, example: '2026-08-28T09:12:00.000Z' })
  completedAt: string | null;
}

/** Les réponses déjà données, pour préremplir le questionnaire. */
export class FarmerSelfQuestionnaireDto {
  @ApiProperty({ required: false }) educationLevel?: string;
  @ApiProperty({ required: false }) maritalStatus?: string;
  @ApiProperty({ required: false }) childrenCount?: number;
  @ApiProperty({ required: false }) farmingExperience?: number;
  @ApiProperty({ required: false }) cooperative?: { isMember: boolean; name?: string; joinDate?: string };
  @ApiProperty({ required: false }) hasCreditRuralAccount?: boolean;
  @ApiProperty({ required: false }) declaredTrainings?: string;
  @ApiProperty({ required: false }) declaredEquipment?: string;
  @ApiProperty({ required: false }) cultivatedHectares?: number;
  @ApiProperty({ required: false }) primaryCrops?: string[];
  @ApiProperty({ required: false }) declaredLandTenure?: string;
  @ApiProperty({ required: false }) dateOfBirth?: string;
  @ApiProperty({ required: false }) gender?: string;
}
```

et sur `FarmerSelfDto` : `profileSurvey: FarmerSelfSurveyDto;` puis `questionnaire: FarmerSelfQuestionnaireDto;`.

Dans `getSelf`, compléter le retour :

```typescript
      address: {
        detail: address.detail,
        regionId: address.regionId,
        prefectureId: address.prefectureId,
        sousPrefectureId: address.sousPrefectureId,
        districtName: address.districtName,
        sousPrefectureName: address.sousPrefectureName,
        prefectureName: address.prefectureName,
        regionName: address.regionName,
      },
      profileSurvey: {
        step: farmer.profileSurvey?.step ?? 0,
        completedAt: farmer.profileSurvey?.completedAt ?? null,
      },
      questionnaire: {
        educationLevel: farmer.educationLevel,
        maritalStatus: farmer.maritalStatus,
        childrenCount: farmer.childrenCount,
        farmingExperience: farmer.farmingExperience,
        // `cooperativeMembership` présent ⇒ membre : c'est la convention du
        // moteur de score, l'app doit lire la même.
        cooperative: farmer.cooperativeMembership
          ? {
              isMember: true,
              name: farmer.cooperativeMembership.name,
              joinDate: farmer.cooperativeMembership.joinDate,
            }
          : undefined,
        hasCreditRuralAccount: farmer.hasCreditRuralAccount,
        declaredTrainings: farmer.declaredTrainings,
        declaredEquipment: farmer.declaredEquipment,
        cultivatedHectares: farmer.cultivatedHectares,
        primaryCrops: farmer.primaryCrops,
        declaredLandTenure: farmer.declaredLandTenure,
        dateOfBirth: user?.dateOfBirth,
        gender: user?.gender,
      },
```

- [ ] **Step 4: Lancer la suite complète de l'API**

Run: `npx jest && npm run build`
Expected: PASS sur toute la suite

- [ ] **Step 5: Commit**

```bash
git add src/farmers/dto/farmer-self.dto.ts src/farmers/farmers.service.ts src/farmers/farmers.service.spec.ts
git commit -m "feat(profil): GET /farmers/me rend de quoi preremplir le questionnaire"
```

---

### Task 5 : Le contrat côté app et le hook du questionnaire

**Files:**
- Create: `src/features/Profil/profil.types.ts`
- Create: `src/features/Profil/profil.api.ts`
- Create: `src/features/Profil/useQuestionnaireProfil.ts`
- Test: `src/features/Profil/useQuestionnaireProfil.test.ts`

**Interfaces:**
- Consumes: `apiClient` de `@/shared/api/client`, les routes des tâches 3 et 4
- Produces:
  - `ReponsesQuestionnaire` — objet plat des réponses des trois étapes
  - `useQuestionnaireProfil(): { reponses, setReponses, etapeCourante, isLoading, isSending, error, envoyerEtape(step: 1|2|3): Promise<boolean>, termine: boolean }`

- [ ] **Step 1: Écrire les tests qui échouent**

```typescript
// src/features/Profil/useQuestionnaireProfil.test.ts
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiRequestError } from '@/shared/api/client';

import { profilApi } from './profil.api';
import { useQuestionnaireProfil } from './useQuestionnaireProfil';

vi.mock('./profil.api', () => ({
  profilApi: { lireProfil: vi.fn(), envoyerEtape: vi.fn() },
}));

const mocked = vi.mocked(profilApi);

describe('useQuestionnaireProfil', () => {
  beforeEach(() => {
    mocked.lireProfil.mockResolvedValue({
      displayName: 'Mamadou Aliou Barry',
      address: { regionId: 'reg-1', prefectureId: 'pref-1', sousPrefectureId: 'sp-1' },
      profileSurvey: { step: 0, completedAt: null },
      questionnaire: {},
    });
    mocked.envoyerEtape.mockResolvedValue({ step: 1, completedAt: null });
  });

  afterEach(() => vi.clearAllMocks());

  it('préremplit depuis le dossier', async () => {
    mocked.lireProfil.mockResolvedValue({
      displayName: 'Mamadou Aliou Barry',
      address: { regionId: 'reg-1', prefectureId: 'pref-1', sousPrefectureId: 'sp-1' },
      profileSurvey: { step: 0, completedAt: null },
      questionnaire: { farmingExperience: 10, primaryCrops: ['riz'] },
    });

    const { result } = renderHook(() => useQuestionnaireProfil());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.reponses.nomComplet).toBe('Mamadou Aliou Barry');
    expect(result.current.reponses.farmingExperience).toBe(10);
    expect(result.current.reponses.primaryCrops).toEqual(['riz']);
    expect(result.current.reponses.regionId).toBe('reg-1');
  });

  it('reprend à l’étape suivante de celle déjà validée', async () => {
    mocked.lireProfil.mockResolvedValue({
      displayName: 'M. B.',
      address: {},
      profileSurvey: { step: 2, completedAt: null },
      questionnaire: {},
    });

    const { result } = renderHook(() => useQuestionnaireProfil());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.etapeCourante).toBe(3);
  });

  it('coupe le nom complet en prénom et nom à l’envoi', async () => {
    const { result } = renderHook(() => useQuestionnaireProfil());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.setReponses({ nomComplet: 'Aïssatou Camara Diallo' }));
    await act(async () => {
      await result.current.envoyerEtape(1);
    });

    expect(mocked.envoyerEtape).toHaveBeenCalledWith(
      expect.objectContaining({ step: 1, firstName: 'Aïssatou', lastName: 'Camara Diallo' }),
    );
  });

  it('envoie une coopérative absente plutôt qu’un objet vide', async () => {
    const { result } = renderHook(() => useQuestionnaireProfil());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.setReponses({ estMembreCooperative: false }));
    await act(async () => {
      await result.current.envoyerEtape(2);
    });

    expect(mocked.envoyerEtape).toHaveBeenCalledWith(
      expect.objectContaining({ cooperative: { isMember: false } }),
    );
  });

  it('transforme l’année d’adhésion en date', async () => {
    const { result } = renderHook(() => useQuestionnaireProfil());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() =>
      result.current.setReponses({
        estMembreCooperative: true,
        nomCooperative: 'Tanènè',
        anneeAdhesion: 2019,
      }),
    );
    await act(async () => {
      await result.current.envoyerEtape(2);
    });

    expect(mocked.envoyerEtape).toHaveBeenCalledWith(
      expect.objectContaining({
        cooperative: { isMember: true, name: 'Tanènè', joinDate: '2019-01-01' },
      }),
    );
  });

  it('n’avance pas l’étape quand l’envoi échoue', async () => {
    mocked.envoyerEtape.mockRejectedValue(new ApiRequestError('réseau', 500));

    const { result } = renderHook(() => useQuestionnaireProfil());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    let ok = true;
    await act(async () => {
      ok = await result.current.envoyerEtape(1);
    });

    expect(ok).toBe(false);
    expect(result.current.error).toMatch(/réessay/i);
    expect(result.current.isSending).toBe(false);
  });
});
```

- [ ] **Step 2: Lancer les tests pour les voir échouer**

Run: `npx vitest run src/features/Profil/useQuestionnaireProfil.test.ts`
Expected: FAIL — module introuvable

- [ ] **Step 3: Écrire les trois fichiers**

`profil.types.ts` porte `ReponsesQuestionnaire` (champs à noms français côté formulaire : `nomComplet`, `dateNaissance`, `genre`, `niveauEducation`, `situationMatrimoniale`, `nombreEnfants`, `farmingExperience`, `estMembreCooperative`, `nomCooperative`, `anneeAdhesion`, `compteCreditRural`, `formations`, `equipements`, `regionId`, `prefectureId`, `sousPrefectureId`, `hectares`, `primaryCrops`, `foncier`), `ProfilLu` (retour de `GET /farmers/me` réduit à ce que le questionnaire lit) et `MarqueurQuestionnaire`.

`profil.api.ts` :

```typescript
import { apiClient } from '@/shared/api/client';
import type { MarqueurQuestionnaire, ProfilLu } from './profil.types';

export const profilApi = {
  /** Le dossier tel que l'agriculteur peut le voir — sert au préremplissage. */
  async lireProfil(): Promise<ProfilLu> {
    const { data } = await apiClient.get<ProfilLu>('/farmers/me');
    return data;
  },

  /**
   * Écrit une étape validée. Le corps ne porte que les champs de cette étape :
   * perdre douze réponses parce que le réseau tombe à la troisième est le
   * scénario que cette découpe évite.
   */
  async envoyerEtape(corps: Record<string, unknown>): Promise<MarqueurQuestionnaire> {
    const { data } = await apiClient.patch<MarqueurQuestionnaire>('/farmers/me/profil', corps);
    return data;
  },
};
```

`useQuestionnaireProfil.ts` charge le profil au montage, remplit `reponses`, pose `etapeCourante = min(profileSurvey.step + 1, 3)`, et expose `envoyerEtape(step)` qui construit le corps de CETTE étape seulement (mapping français → API), renvoie `true` en cas de succès et `false` en cas d'échec, en posant `error` à « Envoi impossible pour l'instant. Réessayez dans un moment. ». Le découpage du nom : `firstName` = premier mot, `lastName` = le reste.

- [ ] **Step 4: Lancer les tests pour les voir passer**

Run: `npx vitest run src/features/Profil/useQuestionnaireProfil.test.ts`
Expected: PASS — 6 tests

- [ ] **Step 5: Commit**

```bash
git add src/features/Profil/profil.types.ts src/features/Profil/profil.api.ts src/features/Profil/useQuestionnaireProfil.ts src/features/Profil/useQuestionnaireProfil.test.ts
git commit -m "feat(profil): le contrat du questionnaire et son etat"
```

---

### Task 6 : Le contenu et les champs de saisie

**Files:**
- Create: `src/features/Profil/questionnaire.content.ts`
- Create: `src/features/Profil/components/ChampsQuestionnaire.tsx`
- Test: `src/features/Profil/questionnaire.content.test.ts`

**Interfaces:**
- Produces: `TRANCHES_EXPERIENCE`, `NIVEAUX_EDUCATION`, `SITUATIONS_MATRIMONIALES`, `FONCIERS`, `CULTURES_COURANTES`, et les composants `ChampTexte`, `ChampNombre`, `ChoixOuiNon`, `ChoixMultiple`, `TitreSection`

- [ ] **Step 1: Écrire le test qui échoue**

```typescript
// src/features/Profil/questionnaire.content.test.ts
import { describe, expect, it } from 'vitest';

import { TRANCHES_EXPERIENCE } from './questionnaire.content';

describe('TRANCHES_EXPERIENCE', () => {
  it('envoie la borne que le moteur de score teste', () => {
    // `scoreExperience` compare à 15, 10, 5 puis 2. Envoyer le milieu d'une
    // tranche ferait basculer un « 2 à 4 ans » dans le palier supérieur.
    expect(TRANCHES_EXPERIENCE.map((t) => t.valeur)).toEqual([1, 2, 5, 10, 15]);
  });

  it('nomme les tranches en clair', () => {
    expect(TRANCHES_EXPERIENCE[0].libelle).toBe('Moins de 2 ans');
    expect(TRANCHES_EXPERIENCE[4].libelle).toBe('15 ans et plus');
  });
});
```

- [ ] **Step 2: Lancer le test pour le voir échouer**

Run: `npx vitest run src/features/Profil/questionnaire.content.test.ts`
Expected: FAIL — module introuvable

- [ ] **Step 3: Écrire le contenu et les champs**

`questionnaire.content.ts` : les listes, avec en tête un commentaire disant que les valeurs d'expérience et d'éducation sont celles que lit `pillars/social.ts`.

```typescript
export const TRANCHES_EXPERIENCE = [
  { valeur: 1, libelle: 'Moins de 2 ans' },
  { valeur: 2, libelle: '2 à 4 ans' },
  { valeur: 5, libelle: '5 à 9 ans' },
  { valeur: 10, libelle: '10 à 14 ans' },
  { valeur: 15, libelle: '15 ans et plus' },
] as const;

export const NIVEAUX_EDUCATION = [
  { valeur: 'none', libelle: 'Aucune scolarité' },
  { valeur: 'primary', libelle: 'Primaire' },
  { valeur: 'secondary', libelle: 'Collège' },
  { valeur: 'high_school', libelle: 'Lycée' },
  { valeur: 'vocational', libelle: 'Formation professionnelle' },
  { valeur: 'university', libelle: 'Université' },
] as const;

export const FONCIERS = [
  { valeur: 'owned', libelle: 'Elles m’appartiennent' },
  { valeur: 'inherited', libelle: 'Héritage familial' },
  { valeur: 'leased', libelle: 'Je les loue' },
  { valeur: 'communal', libelle: 'Terres communautaires' },
  { valeur: 'other', libelle: 'Autre' },
] as const;

export const CULTURES_COURANTES = ['Riz', 'Maïs', 'Manioc', 'Arachide', 'Fonio', 'Ananas', 'Tomate', 'Piment'] as const;
```

`ChampsQuestionnaire.tsx` : les briques de saisie, habillées comme `ProfileSelect` (radius 18, fond blanc, focus vert), chacune avec `label`, `obligatoire?: boolean` (l'astérisque), `value`, `onChange`. `ChoixOuiNon` rend deux boutons radio côte à côte ; `ChoixMultiple` rend des puces sélectionnables plus un champ d'ajout libre.

- [ ] **Step 4: Lancer le test pour le voir passer**

Run: `npx vitest run src/features/Profil/questionnaire.content.test.ts`
Expected: PASS — 2 tests

- [ ] **Step 5: Commit**

```bash
git add src/features/Profil/questionnaire.content.ts src/features/Profil/questionnaire.content.test.ts src/features/Profil/components/ChampsQuestionnaire.tsx
git commit -m "feat(profil): le contenu du questionnaire et ses champs de saisie"
```

---

### Task 7 : Les trois étapes

**Files:**
- Create: `src/features/Profil/components/EtapeVous.tsx`
- Create: `src/features/Profil/components/EtapeParcours.tsx`
- Create: `src/features/Profil/components/EtapeExploitation.tsx`
- Test: `src/features/Profil/components/etapes.test.tsx`

**Interfaces:**
- Consumes: `ReponsesQuestionnaire` (Task 5), les champs et listes (Task 6), `ProfileSelect` de `@/features/Onboarding/components/ProfileSelect`, `onboardingApi` / `registerApi` pour le référentiel d'adresse
- Produces: trois composants de signature `{ reponses: ReponsesQuestionnaire; setReponses: (p: Partial<ReponsesQuestionnaire>) => void; erreurs: Record<string, string> }`

- [ ] **Step 1: Écrire les tests qui échouent**

```typescript
// src/features/Profil/components/etapes.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { EtapeParcours } from './EtapeParcours';
import { EtapeVous } from './EtapeVous';

const reponses = { nomComplet: 'Mamadou Aliou Barry' } as never;

describe('EtapeVous', () => {
  it('demande le niveau d’éducation — 30 % du pilier social', () => {
    render(<EtapeVous reponses={reponses} setReponses={vi.fn()} erreurs={{}} />);
    expect(screen.getByText(/Niveau d’éducation/)).toBeDefined();
  });

  it('marque d’une astérisque ce qui bloque, pas le reste', () => {
    render(<EtapeVous reponses={reponses} setReponses={vi.fn()} erreurs={{}} />);
    expect(screen.getByText('Situation matrimoniale')).toBeDefined();
    expect(screen.queryByText('Situation matrimoniale *')).toBeNull();
  });

  it('affiche l’erreur d’un champ obligatoire vide', () => {
    render(<EtapeVous reponses={reponses} setReponses={vi.fn()} erreurs={{ genre: 'Choisissez une réponse.' }} />);
    expect(screen.getByText('Choisissez une réponse.')).toBeDefined();
  });
});

describe('EtapeParcours', () => {
  it('ne demande le nom de la coopérative qu’aux membres', async () => {
    const setReponses = vi.fn();
    const { rerender } = render(
      <EtapeParcours reponses={{ estMembreCooperative: false } as never} setReponses={setReponses} erreurs={{}} />,
    );
    expect(screen.queryByText(/Nom de la coopérative/)).toBeNull();

    rerender(
      <EtapeParcours reponses={{ estMembreCooperative: true } as never} setReponses={setReponses} erreurs={{}} />,
    );
    expect(screen.getByText(/Nom de la coopérative/)).toBeDefined();
  });

  it('propose les cinq tranches d’expérience', async () => {
    render(<EtapeParcours reponses={{} as never} setReponses={vi.fn()} erreurs={{}} />);
    await userEvent.click(screen.getByLabelText(/Depuis combien de temps/));
    expect(screen.getByText('15 ans et plus')).toBeDefined();
  });
});
```

- [ ] **Step 2: Lancer les tests pour les voir échouer**

Run: `npx vitest run src/features/Profil/components/etapes.test.tsx`
Expected: FAIL — modules introuvables

- [ ] **Step 3: Écrire les trois étapes**

Chacune est un `Stack` de sections titrées, à l'image de la maquette : « Informations personnelles » / « Situation familiale » pour l'étape 1, « Expériences et parcours » / « Accès au financement » pour l'étape 2, « Zone d'exploitation » / « Vos cultures » pour l'étape 3. `EtapeExploitation` reprend les trois listes liées de `RegisterAddressPage` (mêmes tickets de course pour ignorer les réponses obsolètes) et le champ hectares avec son suffixe « ha ».

- [ ] **Step 4: Lancer les tests pour les voir passer**

Run: `npx vitest run src/features/Profil/components/etapes.test.tsx`
Expected: PASS — 5 tests

- [ ] **Step 5: Commit**

```bash
git add src/features/Profil/components
git commit -m "feat(profil): les trois etapes du questionnaire"
```

---

### Task 8 : L'écran du questionnaire et sa route

**Files:**
- Create: `src/features/Profil/QuestionnaireProfilPage.tsx`
- Modify: `src/shared/routes/index.tsx`
- Modify: `src/shared/routes/routes.test.ts`
- Test: `src/features/Profil/QuestionnaireProfilPage.test.tsx`

**Interfaces:**
- Consumes: `useQuestionnaireProfil` (Task 5), les trois étapes (Task 7)
- Produces: route `/mon-profil/completer`, hors `AppLayout`

- [ ] **Step 1: Écrire les tests qui échouent**

```typescript
// src/features/Profil/QuestionnaireProfilPage.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { profilApi } from './profil.api';
import { QuestionnaireProfilPage } from './QuestionnaireProfilPage';

vi.mock('./profil.api', () => ({
  profilApi: { lireProfil: vi.fn(), envoyerEtape: vi.fn() },
}));

const mocked = vi.mocked(profilApi);

const profil = (step: number) => ({
  displayName: 'Mamadou Aliou Barry',
  address: { regionId: 'reg-1', prefectureId: 'pref-1', sousPrefectureId: 'sp-1' },
  profileSurvey: { step, completedAt: null },
  questionnaire: { dateOfBirth: '1986-04-12', gender: 'male', educationLevel: 'secondary' },
});

const rendre = () =>
  render(
    <MemoryRouter>
      <QuestionnaireProfilPage />
    </MemoryRouter>,
  );

describe('QuestionnaireProfilPage', () => {
  beforeEach(() => {
    mocked.lireProfil.mockResolvedValue(profil(0));
    mocked.envoyerEtape.mockResolvedValue({ step: 1, completedAt: null });
  });

  afterEach(() => vi.clearAllMocks());

  it('bloque le passage à l’étape 2 tant qu’un champ obligatoire manque', async () => {
    mocked.lireProfil.mockResolvedValue({
      ...profil(0),
      questionnaire: {}, // ni genre ni éducation
    });
    rendre();
    await screen.findByText('Informations personnelles');

    await userEvent.click(screen.getByRole('button', { name: /Suivant/ }));

    expect(screen.getByText('Informations personnelles')).toBeDefined();
    expect(mocked.envoyerEtape).not.toHaveBeenCalled();
  });

  it('envoie l’étape avant de passer à la suivante', async () => {
    rendre();
    await screen.findByText('Informations personnelles');

    await userEvent.click(screen.getByRole('button', { name: /Suivant/ }));

    expect(mocked.envoyerEtape).toHaveBeenCalledWith(expect.objectContaining({ step: 1 }));
    expect(await screen.findByText('Expériences et parcours')).toBeDefined();
  });

  it('reste sur l’étape quand l’envoi échoue, et le dit', async () => {
    mocked.envoyerEtape.mockRejectedValue(new Error('réseau'));
    rendre();
    await screen.findByText('Informations personnelles');

    await userEvent.click(screen.getByRole('button', { name: /Suivant/ }));

    expect(await screen.findByText(/Envoi impossible/)).toBeDefined();
    expect(screen.getByText('Informations personnelles')).toBeDefined();
  });

  it('reprend à l’étape 3 quand deux étapes sont déjà validées', async () => {
    mocked.lireProfil.mockResolvedValue(profil(2));
    rendre();

    expect(await screen.findByText('Zone d’exploitation')).toBeDefined();
  });

  it('ferme par « Enregistrer » à la troisième étape', async () => {
    mocked.lireProfil.mockResolvedValue(profil(2));
    mocked.envoyerEtape.mockResolvedValue({ step: 3, completedAt: '2026-08-28T09:12:00.000Z' });
    rendre();
    await screen.findByText('Zone d’exploitation');

    expect(screen.getByRole('button', { name: /Enregistrer/ })).toBeDefined();
  });
});
```

```typescript
// src/shared/routes/routes.test.ts — ajout
  it('garde le questionnaire de profil hors de la coquille AppLayout', () => {
    const racines = router.routes.filter((route) => route.path === '/mon-profil/completer');
    expect(racines).toHaveLength(1);

    const enfants = router.routes.flatMap((route) => route.children ?? []).map((route) => route.path);
    expect(enfants).not.toContain('/mon-profil/completer');
  });
```

- [ ] **Step 2: Lancer les tests pour les voir échouer**

Run: `npx vitest run src/features/Profil src/shared/routes`
Expected: FAIL

- [ ] **Step 3: Écrire l'écran et la route**

L'écran : tête verte avec `BackButton`, titre « Complétez vos informations », la phrase « Ces informations nous permettent de mieux vous accompagner avec des conseils adaptés à votre exploitation. », le rail à trois pastilles (numéro, coche une fois franchie), l'étape courante, puis « Précédent » / « Suivant », « Enregistrer » à la troisième, et la mention « Vos informations sont sécurisées et confidentielles ».

Le cœur, c'est la validation locale AVANT l'envoi — sans elle, on écrirait une étape incomplète et le marqueur avancerait à tort :

```typescript
const OBLIGATOIRES: Record<1 | 2 | 3, (keyof ReponsesQuestionnaire)[]> = {
  1: ['nomComplet', 'dateNaissance', 'genre', 'niveauEducation'],
  2: ['farmingExperience', 'estMembreCooperative', 'compteCreditRural'],
  3: ['regionId', 'prefectureId', 'sousPrefectureId', 'hectares', 'primaryCrops', 'foncier'],
};

const valider = (etape: 1 | 2 | 3): Record<string, string> => {
  const manquants: Record<string, string> = {};
  for (const champ of OBLIGATOIRES[etape]) {
    const valeur = reponses[champ];
    const vide =
      valeur === undefined || valeur === null || valeur === '' ||
      (Array.isArray(valeur) && valeur.length === 0);
    if (vide) manquants[champ] = 'Cette réponse est nécessaire.';
  }
  return manquants;
};

const suivant = async () => {
  const manquants = valider(etapeCourante);
  setErreurs(manquants);
  if (Object.keys(manquants).length > 0) return;

  const envoye = await envoyerEtape(etapeCourante);
  if (!envoye) return; // le hook a posé le message ; l'étape ne bouge pas
  if (etapeCourante === 3) navigate('/');
  else setEtapeCourante((e) => (e + 1) as 1 | 2 | 3);
};
```

La route, avec le commentaire expliquant pourquoi elle vit hors d'`AppLayout` (même raison que `/bonnes-pratiques`).

- [ ] **Step 4: Lancer les tests pour les voir passer**

Run: `npx vitest run src/features/Profil src/shared/routes && npx tsc -b --noEmit`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/features/Profil/QuestionnaireProfilPage.tsx src/features/Profil/QuestionnaireProfilPage.test.tsx src/shared/routes/index.tsx src/shared/routes/routes.test.ts
git commit -m "feat(profil): l'ecran du questionnaire et sa route"
```

---

### Task 9 : L'entrée permanente dans « Mes informations »

**Files:**
- Modify: `src/features/MonEspace/MesInformationsPage.tsx`
- Create: `src/features/Profil/components/EntreeQuestionnaire.tsx`
- Test: `src/features/Profil/components/EntreeQuestionnaire.test.tsx`

**Interfaces:**
- Consumes: `MarqueurQuestionnaire` (Task 5)
- Produces: `EntreeQuestionnaire({ marqueur, onOuvrir })`

- [ ] **Step 1: Écrire les tests qui échouent**

```typescript
  it('invite quand rien n’a été répondu', () => {
    render(<EntreeQuestionnaire marqueur={{ step: 0, completedAt: null }} onOuvrir={vi.fn()} />);
    expect(screen.getByText('Compléter mon profil')).toBeDefined();
  });

  it('dit l’avancement en cours de route', () => {
    render(<EntreeQuestionnaire marqueur={{ step: 2, completedAt: null }} onOuvrir={vi.fn()} />);
    expect(screen.getByText(/2 étapes sur 3/)).toBeDefined();
  });

  it('reste ouvrable une fois complété, pour corriger', async () => {
    const onOuvrir = vi.fn();
    render(
      <EntreeQuestionnaire marqueur={{ step: 3, completedAt: '2026-08-28T09:12:00.000Z' }} onOuvrir={onOuvrir} />,
    );
    expect(screen.getByText('Profil complété')).toBeDefined();
    await userEvent.click(screen.getByRole('button'));
    expect(onOuvrir).toHaveBeenCalledTimes(1);
  });
```

- [ ] **Step 2: Lancer les tests pour les voir échouer**

Run: `npx vitest run src/features/Profil/components/EntreeQuestionnaire.test.tsx`
Expected: FAIL — module introuvable

- [ ] **Step 3: Écrire le composant et le poser dans la page**

Rangée cliquable dans la veine de `CarteBonnesPratiques` : icône, titre, sous-ligne d'avancement, chevron. `MesInformationsPage` lit `profileSurvey` via `useProfilAgriculteur` (déjà branché sur `GET /farmers/me`) et pose l'entrée sous le bloc d'informations.

- [ ] **Step 4: Lancer les tests pour les voir passer**

Run: `npx vitest run src/features/Profil src/features/MonEspace`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/features/Profil/components/EntreeQuestionnaire.tsx src/features/Profil/components/EntreeQuestionnaire.test.tsx src/features/MonEspace/MesInformationsPage.tsx
git commit -m "feat(profil): l'entree permanente vers le questionnaire"
```

---

### Task 10 : La modale et sa règle de déclenchement

**Files:**
- Create: `src/features/Profil/ModaleInvitationProfil.tsx`
- Create: `src/features/Profil/invitationProfil.store.ts`
- Create: `src/features/Profil/useInvitationProfil.ts`
- Modify: `src/shared/components/AppLayout.tsx` (porte `/mon-profil/completer` + montage de la modale)
- Modify: `src/features/Home/useCompteNouveau.ts` (expose `aDesDomaines`)
- Test: `src/features/Profil/useInvitationProfil.test.ts`
- Test: `src/features/Profil/ModaleInvitationProfil.test.tsx`

**Interfaces:**
- Consumes: `useCompteNouveau`, `profilApi.lireProfil` (Task 5)
- Produits: `useInvitationProfil(): { ouverte: boolean, fermer(): void }`

- [ ] **Step 1: Écrire les tests qui échouent**

```typescript
// src/features/Profil/useInvitationProfil.test.ts
import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { profilApi } from './profil.api';
import { useInvitationProfil } from './useInvitationProfil';
import { useInvitationProfilStore } from './invitationProfil.store';

vi.mock('./profil.api', () => ({ profilApi: { lireProfil: vi.fn(), envoyerEtape: vi.fn() } }));
vi.mock('@/features/Home/useCompteNouveau', () => ({
  useCompteNouveau: () => ({ estNouveau: true, aDesDomaines: false, isLoading: false }),
}));

const mocked = vi.mocked(profilApi);

describe('useInvitationProfil', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useInvitationProfilStore.setState({ dejaProposee: false });
    mocked.lireProfil.mockResolvedValue({
      displayName: 'M. B.',
      address: {},
      profileSurvey: { step: 0, completedAt: null },
      questionnaire: {},
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('s’ouvre cinq secondes après l’arrivée, pas avant', async () => {
    const { result } = renderHook(() => useInvitationProfil());

    await vi.advanceTimersByTimeAsync(4_000);
    expect(result.current.ouverte).toBe(false);

    await vi.advanceTimersByTimeAsync(1_500);
    expect(result.current.ouverte).toBe(true);
  });

  it('ne s’ouvre pas quand un domaine est déjà tracé', async () => {
    vi.doMock('@/features/Home/useCompteNouveau', () => ({
      useCompteNouveau: () => ({ estNouveau: false, aDesDomaines: true, isLoading: false }),
    }));
    const { useInvitationProfil: hook } = await import('./useInvitationProfil');

    const { result } = renderHook(() => hook());
    await vi.advanceTimersByTimeAsync(6_000);

    expect(result.current.ouverte).toBe(false);
  });

  it('ne s’ouvre pas quand le questionnaire est terminé', async () => {
    mocked.lireProfil.mockResolvedValue({
      displayName: 'M. B.',
      address: {},
      profileSurvey: { step: 3, completedAt: '2026-08-28T09:12:00.000Z' },
      questionnaire: {},
    });

    const { result } = renderHook(() => useInvitationProfil());
    await vi.advanceTimersByTimeAsync(6_000);

    expect(result.current.ouverte).toBe(false);
  });

  it('ne s’ouvre qu’une fois par session', async () => {
    const premier = renderHook(() => useInvitationProfil());
    await vi.advanceTimersByTimeAsync(6_000);
    expect(premier.result.current.ouverte).toBe(true);
    premier.unmount();

    const second = renderHook(() => useInvitationProfil());
    await vi.advanceTimersByTimeAsync(6_000);

    expect(second.result.current.ouverte).toBe(false);
  });

  it('annule la minuterie au démontage', async () => {
    // Un agriculteur qui ouvre une parcelle dans les cinq secondes ne doit pas
    // se faire interrompre par une modale remontant d'un écran qu'il a quitté.
    const { unmount } = renderHook(() => useInvitationProfil());
    await vi.advanceTimersByTimeAsync(2_000);
    unmount();

    await vi.advanceTimersByTimeAsync(6_000);

    expect(useInvitationProfilStore.getState().dejaProposee).toBe(false);
  });
});
```

```typescript
// src/features/Profil/ModaleInvitationProfil.test.tsx — extrait
  it('porte la phrase validée, sans promesse chiffrée', () => {
    render(<ModaleInvitationProfil ouverte onFermer={vi.fn()} onCompleter={vi.fn()} />);
    expect(
      screen.getByText(/Ces réponses nous aident à mieux vous accompagner, et comptent dans votre AgriScore\./),
    ).toBeDefined();
    expect(screen.queryByText(/améliorez/i)).toBeNull();
  });

  it('offre deux gestes : compléter, ou plus tard', async () => {
    const onCompleter = vi.fn();
    const onFermer = vi.fn();
    render(<ModaleInvitationProfil ouverte onFermer={onFermer} onCompleter={onCompleter} />);

    await userEvent.click(screen.getByRole('button', { name: /Compléter mon profil/ }));
    expect(onCompleter).toHaveBeenCalledTimes(1);

    await userEvent.click(screen.getByRole('button', { name: /Plus tard/ }));
    expect(onFermer).toHaveBeenCalledTimes(1);
  });
```

- [ ] **Step 2: Lancer les tests pour les voir échouer**

Run: `npx vitest run src/features/Profil`
Expected: FAIL — modules introuvables

- [ ] **Step 3: Écrire le store, le hook, la modale, et brancher `AppLayout`**

Le store Zustand ne porte qu'un booléen `dejaProposee` et son `marquerProposee()` — en mémoire, jamais persisté : fermer la modale la tait jusqu'à la prochaine ouverture de l'app, la relancer la repropose.

```typescript
// src/features/Profil/useInvitationProfil.ts
const DELAI_MS = 5_000;

export function useInvitationProfil(): { ouverte: boolean; fermer: () => void } {
  const { aDesDomaines, isLoading } = useCompteNouveau();
  const dejaProposee = useInvitationProfilStore((s) => s.dejaProposee);
  const marquerProposee = useInvitationProfilStore((s) => s.marquerProposee);
  const [ouverte, setOuverte] = useState(false);
  const [termine, setTermine] = useState<boolean | null>(null);

  useEffect(() => {
    let actif = true;
    profilApi
      .lireProfil()
      .then((profil) => {
        if (actif) setTermine(profil.profileSurvey.completedAt !== null);
      })
      // Une lecture qui rate ne doit pas déclencher une invitation à l'aveugle.
      .catch(() => {
        if (actif) setTermine(true);
      });
    return () => {
      actif = false;
    };
  }, []);

  useEffect(() => {
    if (isLoading || aDesDomaines || dejaProposee || termine !== false) return;

    const minuterie = window.setTimeout(() => {
      setOuverte(true);
      marquerProposee();
    }, DELAI_MS);

    // Quitter l'accueil avant la fin du délai annule l'invitation : elle
    // remonterait sinon par-dessus l'écran suivant.
    return () => window.clearTimeout(minuterie);
  }, [isLoading, aDesDomaines, dejaProposee, termine, marquerProposee]);

  return { ouverte, fermer: () => setOuverte(false) };
}
```

`AppLayout` ajoute `/mon-profil/completer` à `PORTES_COMPTE_SANS_DOMAINE` et monte la modale dans les deux branches — l'agriculteur qui a un technicien mais pas encore de domaine voit le tableau de bord, et doit recevoir la même invitation.

- [ ] **Step 4: Lancer toute la suite**

Run: `npx vitest run && npx tsc -b --noEmit && npm run build`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/features/Profil src/shared/components/AppLayout.tsx src/features/Home/useCompteNouveau.ts
git commit -m "feat(profil): la modale d'invitation et sa regle de declenchement"
```

---

## Vérification finale

- [ ] `agripilot-backoffice-api` : `npx jest && npm run build`
- [ ] `kumy-farmer-app` : `npx vitest run && npx tsc -b --noEmit && npm run build && npx eslint src`
- [ ] Parcours manuel : compte sans domaine → modale à 5 s → questionnaire → coupure réseau à l'étape 2 (le message s'affiche, l'étape ne passe pas) → reprise → complétion → la modale ne revient plus, l'entrée de « Mes informations » affiche « Profil complété ».
- [ ] Vérifier dans Firestore qu'un non-membre de coopérative n'a **aucun** champ `cooperativeMembership`.
