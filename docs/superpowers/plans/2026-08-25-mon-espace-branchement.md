# Branchement de « Mon espace » — Plan d'implémentation

> **Pour les agents :** SOUS-COMPÉTENCE REQUISE — `superpowers:executing-plans` ou
> `superpowers:subagent-driven-development`. Les étapes utilisent des cases à cocher.

**Goal :** la carte d'agriculteur, la fiche « Mes informations » et les deux réglages
affichent les données réelles de l'agriculteur connecté ; le bloc « Financement et
marché » reste en maquette.

**Architecture :** deux routes neuves résolues depuis l'uid du jeton (`/farmers/me`,
`/farmers/me/notification-settings`) renvoyant un DTO restreint ; côté app, un module
`*.api.ts`, un mapper pur, un hook, et un service de cache de tuiles.

**Tech Stack :** NestJS 11 + Firebase Admin (API) · React 19 + Vite + Vitest + Zustand (app)

**Spec :** `docs/superpowers/specs/2026-08-24-mon-espace-branchement-design.md`

## Contraintes globales

- Français pour la documentation et les messages de commit, anglais pour le code.
- TypeScript strict dans les deux dépôts.
- `@Get('me')` et `@Patch('me/...')` **avant** `@Get(':id')` dans `FarmersController`.
- `FarmerSelfDto` ne porte que ce que l'écran rend — jamais `nationalId`,
  `dateOfBirth`, `gender`, `educationLevel`, `mobileMoneyAccounts`, `partnerId`,
  `engineerIds`, `subscription`.
- L'API se déploie avant l'app.
- Dépôt API : `/Users/thierno/Documents/Projects/kumy/agripilot-backoffice-api`,
  branche `feat/firebase-client-auth`.
- Dépôt app : `/Users/thierno/Documents/Projects/kumy/kumy-farmer-app`,
  branche `feature/farmer-invitation`.

---

## Dépôt API

### Task 1 : `FarmerSelfDto` et `FarmersService.getSelf()`

**Files:**
- Create: `src/farmers/dto/farmer-self.dto.ts`
- Modify: `src/farmers/dto/index.ts`, `src/farmers/farmers.service.ts`
- Test: `src/farmers/farmers.service.spec.ts`

**Interfaces:**
- Produces: `FarmerSelfDto`, `FarmersService.getSelf(userId: string): Promise<FarmerSelfDto>`

- [ ] **Step 1 : le DTO**

```ts
export class FarmerSelfAddressDto {
  detail?: string;
  districtName?: string;
  sousPrefectureName?: string;
  prefectureName?: string;
  regionName?: string;
}

export class FarmerSelfNotificationsDto {
  sms: boolean;
}

export class FarmerSelfDto {
  farmerCode: string;
  displayName: string;
  phone: string;
  alternatePhone?: string;
  address: FarmerSelfAddressDto;
  cooperativeName?: string;
  notificationSettings: FarmerSelfNotificationsDto;
}
```

- [ ] **Step 2 : le test qui échoue**

```ts
it('getSelf ne renvoie que les champs affichés par l’app', async () => {
  const dto = await service.getSelf('farmer1');
  expect(dto.farmerCode).toBe('KMY-DBK-0412');
  expect(dto.address.districtName).toBe('Kaporo');
  expect(dto).not.toHaveProperty('nationalId');
  expect(dto).not.toHaveProperty('dateOfBirth');
});

it('getSelf considère les SMS actifs quand le réglage est absent', async () => {
  const dto = await service.getSelf('farmer-sans-reglages');
  expect(dto.notificationSettings.sms).toBe(true);
});

it('getSelf lève 404 pour un uid sans fiche agriculteur', async () => {
  await expect(service.getSelf('inconnu')).rejects.toThrow(NotFoundException);
});
```

- [ ] **Step 3 : lancer, vérifier l'échec** — `npm test -- farmers.service`

- [ ] **Step 4 : l'implémentation**

```ts
async getSelf(userId: string): Promise<FarmerSelfDto> {
  const farmer = await this.findByUserId(userId);
  if (!farmer) throw new NotFoundException('Farmer not found');
  return {
    farmerCode: farmer.farmerCode,
    displayName:
      farmer.displayName?.trim() ||
      `${farmer.firstName ?? ''} ${farmer.lastName ?? ''}`.trim(),
    phone: farmer.phone ?? '',
    alternatePhone: farmer.alternatePhone,
    address: {
      detail: farmer.address?.detail,
      districtName: farmer.address?.districtName,
      sousPrefectureName: farmer.address?.sousPrefectureName,
      prefectureName: farmer.address?.prefectureName,
      regionName: farmer.address?.regionName,
    },
    cooperativeName: farmer.cooperativeMembership?.name,
    // Absent ⇒ actif : le serveur envoie les SMS tant que rien ne l'en empêche,
    // la bascule doit dire la vérité du serveur, pas un défaut d'affichage.
    notificationSettings: { sms: farmer.notificationSettings?.sms !== false },
  };
}
```

`findByUserId` enrichit déjà avec les noms d'échelons et les infos user : aucune
requête Firestore supplémentaire.

- [ ] **Step 5 : lancer, vérifier le passage, commiter**

```bash
git add src/farmers/dto/farmer-self.dto.ts src/farmers/dto/index.ts \
        src/farmers/farmers.service.ts src/farmers/farmers.service.spec.ts
git commit -m "feat(farmers): FarmerSelfDto, la vue restreinte qu'un agriculteur a de lui-meme"
```

---

### Task 2 : `GET /farmers/me`

**Files:**
- Modify: `src/farmers/farmers.controller.ts`
- Test: `src/farmers/farmers.controller.spec.ts` (créer)

**Interfaces:**
- Consumes: `FarmersService.getSelf`
- Produces: route `GET /api/v1/farmers/me`

- [ ] **Step 1 : le test qui échoue**

```ts
it('« me » n’est pas capturé par la route :id', () => {
  const path = Reflect.getMetadata('path', FarmersController.prototype.getSelf);
  expect(path).toBe('me');
  const methods = Object.getOwnPropertyNames(FarmersController.prototype);
  expect(methods.indexOf('getSelf')).toBeLessThan(methods.indexOf('findOne'));
});

it('la route est ouverte au seul rôle FARMER', () => {
  const roles = Reflect.getMetadata('roles', FarmersController.prototype.getSelf);
  expect(roles).toEqual([UserRole.FARMER]);
});
```

- [ ] **Step 2 : lancer, vérifier l'échec** — `npm test -- farmers.controller`

- [ ] **Step 3 : la route, déclarée AVANT `@Get(':id')`**

```ts
@Get('me')
@Roles(UserRole.FARMER)
@ApiOperation({
  summary: 'Profil de l’agriculteur connecté',
  description:
    'Résolu depuis l’uid du jeton : aucun :id dans l’URL, donc rien à usurper. ' +
    'Réponse restreinte à ce que l’app affiche.',
})
@ApiResponse({ status: 200, type: FarmerSelfDto })
@ApiResponse({ status: 404, description: 'Aucune fiche agriculteur pour cet uid' })
async getSelf(@CurrentUser() user: AuthUserDto): Promise<FarmerSelfDto> {
  return this.farmersService.getSelf(user.uid);
}
```

- [ ] **Step 4 : lancer, vérifier le passage, commiter**

```bash
git add src/farmers/farmers.controller.ts src/farmers/farmers.controller.spec.ts
git commit -m "feat(farmers): expose GET /farmers/me, resolu depuis l'uid du jeton"
```

---

### Task 3 : `PATCH /farmers/me/notification-settings`

**Files:**
- Create: `src/farmers/dto/update-notification-settings.dto.ts`
- Modify: `src/farmers/farmers.service.ts`, `src/farmers/farmers.controller.ts`
- Test: `src/farmers/farmers.service.spec.ts`, `src/farmers/farmers.controller.spec.ts`

**Interfaces:**
- Produces: `FarmersService.updateOwnNotificationSettings(userId: string, sms: boolean): Promise<{ sms: boolean }>`

- [ ] **Step 1 : le DTO**

```ts
export class UpdateNotificationSettingsDto {
  @ApiProperty({ example: false, description: 'Recevoir les alertes par SMS' })
  @IsBoolean()
  sms: boolean;
}
```

- [ ] **Step 2 : les tests qui échouent**

```ts
it('n’écrase pas les autres réglages de notification', async () => {
  await service.updateOwnNotificationSettings('farmer1', false);
  expect(users.farmer1.notificationSettings).toEqual({
    email: true,
    sms: false,
    push: true,
    alertSeverityThreshold: 'critical',
  });
});

it('matérialise le réglage quand il n’existe pas encore', async () => {
  await service.updateOwnNotificationSettings('farmer-sans-reglages', false);
  expect(users['farmer-sans-reglages'].notificationSettings).toEqual({
    email: false,
    sms: false,
    push: false,
    alertSeverityThreshold: 'warning',
  });
});
```

- [ ] **Step 3 : lancer, vérifier l'échec**

- [ ] **Step 4 : l'implémentation — lire, fusionner, écrire**

```ts
async updateOwnNotificationSettings(
  userId: string,
  sms: boolean,
): Promise<{ sms: boolean }> {
  const firestore = this.firebaseService.getFirestore();
  const userRef = firestore.collection('users').doc(userId);
  const snapshot = await userRef.get();
  if (!snapshot.exists) throw new NotFoundException('User not found');

  // Lire avant d'écrire : un objet partiel effacerait email, push et le seuil.
  const current = (snapshot.data()?.notificationSettings ?? {}) as Partial<NotificationSettings>;
  const merged = {
    email: current.email ?? false,
    sms,
    push: current.push ?? false,
    alertSeverityThreshold:
      current.alertSeverityThreshold ?? AlertSeverityThreshold.WARNING,
  };
  await userRef.update({
    notificationSettings: merged,
    updatedAt: new Date().toISOString(),
  });
  return { sms };
}
```

- [ ] **Step 5 : la route, elle aussi AVANT `@Get(':id')`**

```ts
@Patch('me/notification-settings')
@Roles(UserRole.FARMER)
@ApiOperation({ summary: 'Régler ses propres notifications' })
@ApiResponse({ status: 200, type: FarmerSelfNotificationsDto })
async updateOwnNotificationSettings(
  @CurrentUser() user: AuthUserDto,
  @Body() dto: UpdateNotificationSettingsDto,
): Promise<FarmerSelfNotificationsDto> {
  return this.farmersService.updateOwnNotificationSettings(user.uid, dto.sms);
}
```

`Patch` doit être ajouté aux imports `@nestjs/common` du contrôleur.

- [ ] **Step 6 : `npm run lint && npm test`, puis commiter**

```bash
git commit -am "feat(farmers): PATCH /farmers/me/notification-settings, fusion sans ecrasement"
```

---

## Dépôt app

### Task 4 : appels, types et mapper

**Files:**
- Create: `src/features/MonEspace/monEspace.api.ts`, `src/features/MonEspace/monEspace.mapper.ts`
- Modify: `src/features/MonEspace/monEspace.types.ts`, `src/features/MonEspace/monEspace.demo.ts`
- Test: `src/features/MonEspace/monEspace.mapper.test.ts`

**Interfaces:**
- Produces: `monEspaceApi.profil()`, `monEspaceApi.majAlertesSms(sms)`, `versProfil(dto, accessTier)`

- [ ] **Step 1 : retirer du type les trois champs que rien n'affiche**

`culturesPrincipales`, `surfaceTotale`, `irrigation` sortent de `ProfilAgriculteur`
et de `monEspace.demo.ts`.

- [ ] **Step 2 : le test du mapper**

```ts
describe('versProfil', () => {
  it('reprend le nom, le code, le contact et la coopérative', () => { /* … */ });
  it('laisse vides les échelons que l’API ne renvoie pas', () => { /* … */ });
  it('tient le niveau d’accès de la session, pas de l’API', () => { /* … */ });
});
```

- [ ] **Step 3 : lancer, vérifier l'échec** — `npx vitest run monEspace.mapper`

- [ ] **Step 4 : l'implémentation**

```ts
export function versProfil(
  dto: FarmerSelfDto,
  accessTier?: 'full' | 'simulation',
): ProfilAgriculteur {
  return {
    nomComplet: dto.displayName,
    code: dto.farmerCode,
    telephone: dto.phone,
    telephoneSecondaire: dto.alternatePhone,
    adresse: dto.address.detail,
    village: dto.address.districtName ?? '',
    sousPrefecture: dto.address.sousPrefectureName ?? '',
    prefecture: dto.address.prefectureName ?? '',
    region: dto.address.regionName ?? '',
    cooperative: dto.cooperativeName ?? '',
    niveauAcces: accessTier === 'simulation' ? 'simulation' : 'full',
  };
}
```

- [ ] **Step 5 : `monEspace.api.ts`**

```ts
export const monEspaceApi = {
  async profil(): Promise<FarmerSelfDto> {
    const { data } = await apiClient.get<FarmerSelfDto>('/farmers/me');
    return data;
  },
  async majAlertesSms(sms: boolean): Promise<{ sms: boolean }> {
    const { data } = await apiClient.patch<{ sms: boolean }>(
      '/farmers/me/notification-settings',
      { sms },
    );
    return data;
  },
};
```

- [ ] **Step 6 : `npx vitest run && npx tsc --noEmit && npx eslint src`, commiter**

---

### Task 5 : le hook et les deux écrans

**Files:**
- Create: `src/features/MonEspace/useProfilAgriculteur.ts`
- Modify: `src/features/MonEspace/MonEspacePage.tsx`, `MesInformationsPage.tsx`,
  `components/CarteAgriculteur.tsx`, `components/BlocInformations.tsx`
- Test: `src/features/MonEspace/useProfilAgriculteur.test.ts`

**Interfaces:**
- Consumes: `monEspaceApi.profil`, `versProfil`
- Produces: `useProfilAgriculteur(): { profil: ProfilAgriculteur | null; isLoading: boolean; alertesSms: boolean | null }`

- [ ] **Step 1 : les tests du hook**

```ts
it('rend le profil de l’agriculteur connecté', async () => { /* … */ });
it('se replie sur la session quand l’appel échoue', async () => {
  vi.spyOn(monEspaceApi, 'profil').mockRejectedValue(new Error('offline'));
  const { result } = renderHook(() => useProfilAgriculteur());
  await waitFor(() => expect(result.current.isLoading).toBe(false));
  expect(result.current.profil?.nomComplet).toBe('Awa Diallo');
  expect(result.current.profil?.code).toBe('');
});
it('se replie de la même façon sur un 404', async () => { /* … */ });
```

- [ ] **Step 2 : lancer, vérifier l'échec**

- [ ] **Step 3 : le hook** — même forme que `useCompteNouveau` : `uid` absent ⇒ pas
  d'appel ; échec ⇒ profil de repli construit depuis `authStore.user`
  (`nomComplet: displayName`, `telephone: phone`, tout le reste vide).

- [ ] **Step 4 : brancher `MonEspacePage`** — `demoProfil` disparaît de l'import,
  `CarteAgriculteur` reçoit `profil` et un nouveau `isLoading` (squelette gris sur
  le code, le nom et la coopérative, hauteur de carte inchangée).

- [ ] **Step 5 : brancher `MesInformationsPage`** et filtrer dans `BlocInformations`
  les échelons dont la valeur est vide, comme `adresse` l'est déjà.

- [ ] **Step 6 : suite complète, puis commiter**

---

### Task 6 : les deux réglages

**Files:**
- Create: `src/shared/services/tuilesCache.ts`
- Modify: `src/features/MonEspace/components/BlocReglages.tsx`, `MonEspacePage.tsx`
- Test: `src/shared/services/tuilesCache.test.ts`

**Interfaces:**
- Produces: `mesurerTuiles(): Promise<{ octets: number | null; tuiles: number } | null>`,
  `viderTuiles(): Promise<void>`

- [ ] **Step 1 : les tests du cache** — faux `caches` global : comptage sur les deux
  caches, suppression des deux, `null` quand `caches` n'existe pas, `octets: null`
  quand `navigator.storage.estimate` ne donne pas `usageDetails.caches`.

- [ ] **Step 2 : lancer, vérifier l'échec**

- [ ] **Step 3 : le service** — `CACHES = ['map-tiles-google', 'map-tiles-satellite']`,
  comptage via `cache.keys()`, poids via `navigator.storage.estimate()`.

- [ ] **Step 4 : la ligne « Cartes enregistrées »** — « 12 Mo pour vos parcelles hors
  réseau » devient la mesure réelle, ou le nombre de tuiles quand le poids n'est pas
  lisible ; la ligne disparaît si `caches` est absent. « Vider » appelle
  `viderTuiles()` puis recalcule.

- [ ] **Step 5 : la bascule des alertes** — état initial `alertesSms` du hook,
  désactivée pendant le chargement, écriture optimiste, **retour en arrière et message
  court si le `PATCH` échoue**.

- [ ] **Step 6 : suite complète + `tsc` + `eslint`, puis commiter**

---

## Vérification finale

```bash
# app
npx tsc --noEmit && npx eslint src && npx vitest run
# api
npm run lint && npm test
```

Le bloc « Financement et marché » doit être **inchangé** : `git diff` ne doit toucher
`BlocOutils.tsx` sous aucun prétexte.
