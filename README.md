# Kumy — application agriculteur

Application mobile des agriculteurs Kumy (Capacitor + React), membre de la suite
**AgriPilot**. Même socle technique que `agripilot-pwa` (l'app encadreur), avec une
UX propre à l'agriculteur.

## Stack

- **React 19** + **Vite 7** + **TypeScript** (strict)
- **MUI 7** (thème M3, palette verte Kumy `#018675`)
- **Capacitor 7** (coquille native Android + iOS)
- **Dexie** (IndexedDB, offline-first) · **Zustand** (état global) · **Leaflet** (cartes)
- **Firebase** (Firestore / Auth — backend partagé)

## Commandes

```bash
npm install          # Installe les dépendances (initialise husky)
npm run dev          # Serveur Vite
npm run build        # tsc -b + build de production → dist/
npm run preview      # Aperçu du build
npm run lint         # ESLint
npm run lint:fix     # ESLint + autofix (imports, unused)
npm run format       # Prettier --write
npm run format:check # Prettier --check
```

## Application native (Capacitor)

`android/` **est versionné** : on y personnalise le manifeste, le thème et les
icônes. Il n'y a donc rien à générer, seulement à synchroniser.

```bash
npm run cap:sync                      # build web + copie vers android/
cd android && ./gradlew assembleDebug # APK : app/build/outputs/apk/debug/
```

`ios/` n'est pas généré : hors périmètre tant qu'aucune machine du projet n'a
Xcode. Voir `docs/superpowers/specs/2026-08-22-capacitor-android-natif-design.md`.

### ⚠️ L'URL de l'API est figée au build

Vite inline les variables `VITE_*` **au moment du build**, et `.env` est
gitignoré. Sans `.env` local, l'APK retombe silencieusement sur l'URL Cloud Run
**dev** codée en dur dans `src/shared/api/client.ts`. Renseigne
`VITE_API_URL_NATIVE` avant tout build destiné à la production.

### Icônes et splash

Deux visuels, pas un seul :

| Contexte | Source | Pourquoi |
|---|---|---|
| Carré — favicon, icône PWA, icône Android, médaillon d'accueil | `public/logo-mark.svg` (la pousse seule) | Le verrou complet est large (340×250) : réduit au carré puis rogné par le masque adaptatif, le mot « kumy » devient illisible |
| Large — splash, loader d'`index.html` | `public/logo-kumy.svg` (verrou complet) | La place existe, et la marque s'identifie |

`public/logo-mark.svg` est **extrait** de `logo-kumy.svg` : même tracé, même vert.
Après modification du logo, régénérer les deux familles :

```bash
npm run assets:native   # écrit assets/*, public/icon-*, puis génère android/
```

Le script `scripts/build-native-assets.mjs` explique chaque taille et chaque marge.

### L'écran d'attente

`index.html` porte un écran d'attente complet (`#kumy-splash`). Ses formes
reprennent le vocabulaire que l'agriculteur retrouve sur ses cartes, et chacune
dit quelque chose :

| Forme | Sens | Mouvement |
|---|---|---|
| Couronne de 80 points | le **rayon de couverture** de la station | aucun |
| Marqueur teal (`primary/50`) | un **relevé** | orbite en 9 s |
| Marqueur ambre (`warning/50`) | une **vigilance** | orbite en 13,5 s |

Il n'y a donc pas de « trois points » de chargement : les marqueurs tiennent ce
rôle. Leurs couleurs sont les tokens que le tableau de bord emploie déjà, et
leurs périodes diffèrent à dessein — ils dérivent, se croisent et se séparent,
jamais en formation figée.

À l'ouverture, une cascade : la couronne éclôt, les marqueurs paraissent, puis
le logo et le texte montent. Sous `prefers-reduced-motion`, tout est figé et les
marqueurs sont posés à 64° et 197° pour ne pas se superposer.

**Pourquoi `pathLength="4800"` sur les cercles.** Sans lui la trame ne se referme
pas : les moteurs approchent le cercle par des courbes de Bézier, et
`getTotalLength()` renvoie 589,665 là où 2·π·94 vaut 590,619 — assez pour tronquer
le dernier tiret, toujours au même endroit. L'attribut renormalise la longueur du
tracé : 48 tirets de période 100 tombent alors juste, quel que soit le moteur.

Le cercle ne tourne pas, et ce n'est pas un oubli : avec 48 tirets identiques la
figure se superpose à elle-même tous les 7,5°, une rotation y serait invisible.

`scripts/build-native-assets.mjs` calcule ses tirets au lieu d'utiliser
`pathLength` — vérifié, librsvg ignore cet attribut et rendait le cercle plein.

Il est déclaré **hors de `#root`**, et ce n'est pas un détail : React efface le
contenu de `#root` à son premier rendu et `App` ne rend rien tant que la session
n'est pas initialisée. Un loader placé dedans laisserait un écran vide pendant
toute l'authentification — exactement ce qu'il doit couvrir.

Enchaînement : splash système (icône sur crème) → `hideNativeSplash()` dès la
première image peinte → `#kumy-splash` jusqu'à session prête → app.
`dismissBootSplash()` le retire du DOM après le fondu, sinon il intercepterait
les gestes.

### L'écran de démarrage Android 12+ n'utilise pas `splash.png`

L'API SplashScreen dessine l'**icône de l'app** sur `windowSplashScreenBackground` ;
le `android:background` que génère Capacitor y est inerte, ce qui laissait un fond
gris. Les valeurs de marque sont donc dans `values/styles.xml`
(`AppTheme.NoActionBarLaunch`). Les `drawable-*/splash.png` restent produits pour
les versions antérieures à Android 12.

### Ce qui vit où

- **`src/shared/services/nativeShell.ts`** — seul module autorisé à parler aux
  plugins de coquille (clavier, splash, bouton retour). No-op sur web.
- **La barre de statut ne s'y pilote PAS.** Sa couleur est déclarée dans
  `android/app/src/main/res/values/styles.xml` : `BridgeActivity` réapplique le
  thème en fin d'animation de démarrage et écraserait tout appel venu du JS.
- **Le thème désactive l'edge-to-edge** imposé par Android 15
  (`windowOptOutEdgeToEdgeEnforcement`). À reprendre au passage SDK 36, où
  l'attribut est déprécié : il faudra alors gérer `env(safe-area-inset-*)`.

### Régression connue : cartes hors-ligne

En natif il n'y a pas de service worker, donc le cache Workbox des tuiles
satellite (30 jours) ne s'applique plus. Les écrans carto se dégradent hors
connexion. Chantier à part, explicitement hors périmètre de la conversion.

## Qualité de code

- **ESLint 9** (flat config) : lint + autofix (import/order, unused-imports).
- **Prettier** : formatage (single quote, printWidth 120, trailing all, LF).
- **Format on save** activé via `.vscode/settings.json` (extension `esbenp.prettier-vscode`
  + `source.fixAll.eslint`). Installe l'extension Prettier de VS Code.
- **Husky** : `pre-commit` lance le lint, `commit-msg` valide les commits conventionnels.

## Architecture des dossiers

```
src/
├─ features/       # une feature = un dossier (composants + hooks + stores + services)
├─ shared/         # transverse : components, db, hooks, layouts, pages, routes,
│                  #   services, stores, types, utils
├─ theme/          # design tokens M3 (colors.ts) + thème MUI (theme.ts)
├─ config/         # configuration (firebase, etc.)
├─ components/     # composants racine légers
└─ hooks/          # hooks racine
```

Alias d'import : `@/*` → `src/*` (+ `@/features`, `@/shared`, `@/theme`, `@/assets`).

## Convention API — un `.api` par feature

Contrairement à `agripilot-pwa` (qui entasse ~30 objets `xxxApi` dans un unique
`shared/services/api.ts` de 1000 lignes), Kumy **sépare le transport du métier** :

- **Transport (partagé, unique)** : `src/shared/api/client.ts` — l'instance axios,
  les intercepteurs (Bearer natif, refresh 401) et `ApiRequestError`. C'est le SEUL
  fichier API transverse.
- **Endpoints (par feature)** : chaque feature possède son propre fichier
  **`<feature>.api.ts`**, co-localisé, qui importe `apiClient` du client partagé.
  Exemple de référence : `src/features/Auth/auth.api.ts` (+ `auth.types.ts`).

```
src/
├─ shared/api/client.ts          # transport (client + intercepteurs) — partagé
└─ features/
   └─ Auth/
      ├─ auth.api.ts             # endpoints de la feature Auth
      └─ auth.types.ts           # DTO de la feature
```

Règle : **on ne crée jamais d'agrégat global d'endpoints**. Une nouvelle feature =
un nouveau `<feature>.api.ts` qui consomme `@/shared/api/client`.

## Déploiement

| Env | Domaine | Projet Firebase | Site Hosting | Déclencheur |
|---|---|---|---|---|
| dev | https://mobile-dev.kumy.app | `kumy-agripilot-dev` | `kumy-farmer-dev` | push sur `main`, ou PR vers `main` |
| prod | https://mobile.kumy.app | `kumy-agripilot-prod` | `kumy-farmer-prod` | tag `v*` uniquement |

**Un push sur `main` ne livre jamais en production.** La prod part soit du merge de la
PR « chore: release X.Y.Z » ouverte par release-please, soit d'un tag `v*` poussé à la
main, soit d'un `workflow_dispatch` manuel en secours.

Les PR déploient sur le **canal `live` du site dev** : `mobile-dev.kumy.app` reflète la
dernière chose poussée, pas nécessairement `main`. Un push sur `main` après le merge
restaure l'état de `main`.

⚠️ Une PR issue d'un *fork* n'a pas accès aux secrets : son job de déploiement échouera.
C'est assumé — le correctif usuel (`pull_request_target`) exécuterait du code non revu
avec accès aux secrets.

### Déployer à la main

```bash
npm run deploy:dev    # -> mobile-dev.kumy.app
npm run deploy:prod   # -> mobile.kumy.app
```

Ces commandes exigent d'être authentifié en local (`firebase login`) avec les droits sur
les **deux** projets Firebase (`kumy-agripilot-dev` et `kumy-agripilot-prod`) —
contrairement à la CI, qui s'authentifie via un compte de service (`FIREBASE_SERVICE_ACCOUNT_DEV`
/ `FIREBASE_SERVICE_ACCOUNT_PROD`) et n'a pas besoin de session utilisateur.

### Prérequis d'infrastructure (une seule fois)

1. Créer les sites Hosting :
   ```bash
   firebase hosting:sites:create kumy-farmer-dev  --project kumy-agripilot-dev
   firebase hosting:sites:create kumy-farmer-prod --project kumy-agripilot-prod
   ```
2. Rattacher les domaines custom `mobile-dev.kumy.app` et `mobile.kumy.app` aux sites
   correspondants (console Firebase → Hosting → Ajouter un domaine personnalisé), puis
   poser les enregistrements DNS chez le registrar de `kumy.app`.
3. Créer les GitHub Environments `development` et `production`
   (`Settings → Environments`). Une règle de protection sur `production` ajoute une
   approbation manuelle avant chaque livraison.
   ⚠️ **Restreindre les branches de déploiement** de l'environnement `production`
   (`Settings → Environments → production → Deployment branches and tags`) aux tags
   `v*` et à `main`. Sans cette restriction, un `workflow_dispatch` lancé depuis
   n'importe quelle branche avec `environment: production` publierait ce code sur
   `mobile.kumy.app` — la logique du workflow (`resolve` + les `if:` de `deploy-prod`)
   ne protège que le chemin normal, pas un déclenchement manuel malveillant ou
   maladroit. Cette restriction fait appliquer la contrainte structurante par la
   plateforme GitHub elle-même, pas seulement par la logique du workflow.
4. Créer les secrets **au niveau de chaque environment** (`Settings → Environments →
   <env> → Environment secrets`), et non au niveau du repo :

   | Environment | Secret | Valeur |
   |---|---|---|
   | `development` | `FIREBASE_SERVICE_ACCOUNT_DEV` | contenu JSON de `dev-sa.json` |
   | `development` | `DEV_FIREBASE_PROJECT_ID` | `kumy-agripilot-dev` |
   | `production` | `FIREBASE_SERVICE_ACCOUNT_PROD` | contenu JSON de `prod-sa.json` |
   | `production` | `PROD_FIREBASE_PROJECT_ID` | `kumy-agripilot-prod` |

   Le scoping par environment n'est pas cosmétique : un secret d'environment n'est
   résolu que pour un job qui déclare cet `environment:`. Les identifiants de
   production sont donc inaccessibles à `deploy-dev` **par construction** — si
   quelqu'un repointait un jour ce job sur la configuration prod, il n'obtiendrait
   aucun identifiant et le déploiement échouerait, au lieu de publier sur
   `mobile.kumy.app`. C'est le même principe que la restriction de branches
   ci-dessus : faire porter l'invariant par la plateforme plutôt que par la seule
   logique du workflow.

   Les deux comptes de service (`github-hosting-deployer@<projet>`) portent
   `roles/firebasehosting.admin` et `roles/run.viewer` — de quoi déployer le hosting
   et résoudre le rewrite Cloud Run, et rien d'autre. Aucun droit Firestore : un bloc
   `firestore` ajouté par erreur dans une configuration Hosting ferait échouer le
   déploiement au lieu d'effacer des index en production.
5. Activer **« Allow GitHub Actions to create and approve pull requests »**
   (`Settings → Actions → General → Workflow permissions`). Sans ce réglage,
   `release-please` ne peut pas ouvrir sa PR de release malgré la déclaration
   `permissions: pull-requests: write` du workflow — conséquence : aucune release
   n'existe jamais, donc la production n'est jamais livrée, avec pour seul symptôme
   un job rouge dans un workflow que personne ne regarde.

### Ce qui n'est pas couvert

Le build et la signature des applications Android / iOS ne sont pas dans la CI : les
projets natifs ne sont pas encore générés (`npm run cap:add:android` / `npm run cap:add:ios`).
