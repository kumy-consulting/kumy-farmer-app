# Spec — Conversion native Android (Capacitor)

**Date :** 2026-08-22
**Statut :** Design validé
**Repo :** `kumy-farmer-app` (front uniquement)
**Approche retenue :** B — durcissement natif préventif

## Contexte

L'app est un PWA React/Vite déployé sur Firebase Hosting. Le socle Capacitor a été
posé à l'initialisation du dépôt (commit `d9b97c4`) mais jamais mené à terme : la
configuration existe, les plugins sont installés, et **aucun projet natif n'a jamais
été généré**.

État réel constaté avant ce chantier :

| Élément | État |
|---|---|
| `capacitor.config.ts` | Complet (`com.kumy.farmer`, `webDir: dist`, `androidScheme: https`) |
| `src/shared/api/client.ts` | Déjà *platform-aware* : `Bearer` en natif, cookie en web, URL API absolue en natif |
| `src/shared/services/nativeAuth.ts` | Jetons persistés via `@capacitor/preferences` |
| `main.tsx` | Désenregistre le service worker en natif |
| Dossiers `android/` / `ios/` | **Absents**, et ignorés par git |
| Plugins réellement importés | `@capacitor/core`, `@capacitor/preferences` — **2 sur 10** |

Contrainte machine : Android est prêt (SDK, JDK 21, Android Studio, émulateurs).
**iOS ne l'est pas** — pas de Xcode, pas de CocoaPods. iOS est donc hors périmètre.

## Décisions validées

| Sujet | Décision |
|---|---|
| Périmètre | **Android d'abord**, app qui tourne sur émulateur/appareil. iOS reporté |
| Approche | **B — durcissement préventif** : traiter les risques WebView connus d'avance |
| Tuiles carto hors-ligne | **Hors périmètre**, documenté comme régression assumée |
| `android/` en git | **Versionné** — on personnalise manifeste, icônes et gradle |
| Plugins inutilisés | **Désinstallés** : `camera`, `filesystem`, `geolocation`, `push-notifications` |
| Routeur | `createHashRouter` **en natif seulement** — les URLs du PWA web ne changent pas |
| Point d'entrée natif | Module unique `nativeShell.ts` ; aucun composant n'importe de plugin |

## Régression assumée : les tuiles carto hors-ligne

En natif il n'y a plus de service worker, donc le `runtimeCaching` Workbox des tuiles
satellite (30 jours, `CacheFirst`) ne s'applique plus. Les trois écrans carto
(`DomaineDetailMap`, `DomainMiniMap`, `ParcelMapHero`) afficheront une carte vide hors
connexion.

C'est une perte réelle pour l'usage terrain, explicitement mise hors périmètre de ce
lot. Le chantier suivant devra intercepter les requêtes de tuiles Leaflet et les
persister (`@capacitor/filesystem` ou Cache Storage du WebView), avec une politique
d'invalidation et de quota.

## Architecture

Principe directeur : **tout le durcissement natif vit dans `src/`, derrière un point
d'entrée unique.** Le projet Android n'est qu'une coquille qui charge `dist/`.

### Contrat de `src/shared/services/nativeShell.ts`

Seul module autorisé à importer `@capacitor/status-bar`, `@capacitor/keyboard` et
`@capacitor/app`.

```
initNativeShell(): Promise<void>    // une fois, depuis main.tsx
hideNativeSplash(): Promise<void>   // depuis App.tsx quand `ready` passe à true
```

Les deux sortent immédiatement si `Capacitor.isNativePlatform()` est faux. C'est ce qui
garantit que les tests existants restent verts **sans mock** : sous jsdom, ces fonctions
ne font rien.

`initNativeShell` fait trois choses, et rien d'autre :

- **StatusBar** — style clair sur `#018675`, `setOverlaysWebView(false)`.
- **Keyboard** — `resize: Native`. Les écrans de saisie (téléphone, PIN, code
  d'invitation, profil) sont tous hors `AppLayout`, donc sans barre de navigation
  basse : redimensionner le WebView entier est sûr.
- **Bouton retour Android** — `canGoBack ? history.back() : App.exitApp()`. Capacitor
  fournit `canGoBack` dans l'événement, ce qui évite au shell de connaître les routes.

### Splash

`capacitor.config.ts` passe à `autoHide: false`. Sans cela, le splash natif se masque
après 600 ms et découvre le loader `#kumy-preboot` de `index.html` pendant que l'auth
s'initialise — deux écrans d'attente à la suite. Le masquage explicite après
`authStore.initialize()` ne laisse qu'une seule transition.

### Flux au démarrage

```
main.tsx
  ├─ initNativeShell()      → no-op web / StatusBar + Keyboard + backButton en natif
  ├─ initDatabase()         → Dexie (inchangé)
  └─ render(<App/>)
        └─ App.tsx : authStore.initialize()
              └─ finally → setReady(true) → hideNativeSplash()
                    └─ RouterProvider (hash en natif, browser en web)
```

### Réseau

`src/shared/hooks/useIsOnline.ts` remplace le hook local de `HomePage` :
`Network.getStatus()` + `networkStatusChange` en natif, `navigator.onLine` +
événements `online`/`offline` en web.

Motif : sur Android, `navigator.onLine` reste souvent à `true` sur un réseau connecté
mais sans route — exactement le cas d'un village avec du signal et pas de data.

## Risques identifiés

### CORS depuis `https://localhost` — risque de rupture principal

En natif l'app est servie depuis `https://localhost` et appelle Cloud Run : c'est du
cross-origin. `apiClient` positionne `withCredentials: true` inconditionnellement, ce
qui impose à l'API de renvoyer `Access-Control-Allow-Credentials` avec une origine
explicitement autorisée — sinon **tous les appels natifs échouent, connexion comprise**.

Or en natif l'authentification passe par le `Bearer` déjà en place, pas par un cookie.
`withCredentials` n'y sert à rien. **Correctif retenu : `withCredentials: !isNative`**
dans `client.ts` — relâche la contrainte CORS en natif sans toucher au web.

Si l'API ne renvoie toujours pas `Access-Control-Allow-Origin` pour `https://localhost`,
le correctif est dans `agripilot-backoffice-api`, **hors de ce dépôt** : il sera signalé
au point de contrôle du lot 3, pas appliqué unilatéralement.

### `VITE_API_URL_NATIVE` inliné au build

Vite inline les variables `VITE_*` **au moment du build**, et `.env` est gitignoré. Sans
`.env` local, l'APK retombe silencieusement sur l'URL Cloud Run **dev** codée en dur
dans `client.ts`. Acceptable pour ce lot, à documenter dans le README pour éviter qu'un
APK de production soit construit par erreur.

### Polices distantes au démarrage

`index.html` charge Ubuntu depuis Google Fonts. En natif, au premier lancement sans
réseau, toute la typographie retombe sur la police système. Corrigé par
`@fontsource/ubuntu` importé localement.

## Lots

L'ordre compte : les lots 1 et 2 sont réversibles et couverts par des tests
automatiques ; le lot 3 crée un artefact lourd et versionné. On ne génère `android/`
qu'une fois le code web durci, pour ne pas resynchroniser en boucle.

### Lot 1 — Assainissement des dépendances

- Désinstaller `@capacitor/camera`, `@capacitor/filesystem`, `@capacitor/geolocation`,
  `@capacitor/push-notifications`.
- Installer `@capacitor/keyboard` et `@fontsource/ubuntu`.
- Retirer `android` du `.gitignore` ; `ios` reste ignoré.

### Lot 2 — Durcissement web

- `src/shared/services/nativeShell.ts` *(nouveau)* — contrat ci-dessus.
- `src/shared/routes/index.tsx` — bascule hash/browser selon la plateforme.
- `src/shared/hooks/useIsOnline.ts` *(nouveau)* — `HomePage` le consomme.
- `src/shared/api/client.ts` — `withCredentials: !isNative`.
- `src/index.css` — `overscroll-behavior: none`, `touch-action: manipulation`,
  `-webkit-tap-highlight-color: transparent`, sélection de texte maîtrisée.
- `index.html` + `main.tsx` — police locale, suppression des `<link>` Google Fonts.
- `capacitor.config.ts` — `autoHide: false`.

### Lot 3 — Génération de la coquille Android

- `cap add android`, `cap sync`.
- Icônes et splash générés depuis `public/logo-kumy.svg` via `@capacitor/assets`.
- Build Gradle debug, lancement émulateur.
- **Point de contrôle :** l'app démarre et atteint l'écran de connexion, et un appel
  API réel aboutit (valide le CORS).

### Lot 4 — Vérification sur appareil

Parcours complet : welcome → téléphone → PIN → accueil → domaines → carte → mon espace.
Puis bouton retour, rotation, clavier, safe-areas, reprise après mise en arrière-plan.
Correction de ce que l'exécution révèle.

## Stratégie de test

**Ce qui est couvert automatiquement (Vitest, jsdom) :**

- Les 157 tests existants doivent rester verts **sans ajout de mock Capacitor**. C'est
  l'assertion qui valide le contrat « no-op sur web » du `nativeShell`.
- `useIsOnline` : nouveau test — état initial, transition en ligne → hors-ligne, purge
  des écouteurs au démontage. Chemin web uniquement, le chemin natif étant inatteignable
  sous jsdom.
- `nativeShell` : nouveau test — vérifie qu'en environnement non natif les deux
  fonctions se résolvent sans toucher à aucun plugin.

**Ce qui ne peut pas l'être et sera vérifié à la main sur émulateur :**

Bouton retour, clavier, safe-areas, splash, barre de statut, icône de lanceur, CORS
réel. Ces points relèvent du lot 4 et seront consignés dans le compte rendu final,
pas déclarés verts sur la foi d'un build qui compile.

**Portes de qualité :** `npx tsc -b`, `npm run lint`, `npm test` verts avant chaque
commit, comme sur le reste du dépôt.
