# CI/CD Firebase Hosting (dev + prod) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Livrer `kumy-farmer-app` automatiquement sur `mobile-dev.kumy.app` (push `main` + PR) et sur `mobile.kumy.app` (tag `v*` uniquement), via Firebase Hosting multi-site.

**Architecture:** Deux fichiers de configuration Hosting (`firebase.dev.json` / `firebase.prod.json`) ciblant deux sites distincts dans les projets Firebase agripilot existants. Un workflow GitHub Actions unique (`deploy.yml`) qui résout l'environnement cible depuis le déclencheur, builde une seule fois, puis déploie via la CLI `firebase-tools`. Un second workflow (`release-please.yml`) appelle `deploy.yml` en `workflow_call` quand une release est créée — ce qui contourne l'impossibilité pour un tag posé par le `GITHUB_TOKEN` de déclencher un workflow.

**Tech Stack:** GitHub Actions, `firebase-tools` (CLI), `googleapis/release-please-action@v4`, Node 22, Vite 7, `vite-plugin-pwa`.

**Spec de référence :** `docs/superpowers/specs/2026-07-21-cicd-firebase-hosting-design.md`

## Global Constraints

- **Un push sur `main` ne livre JAMAIS en production.** Seul un tag `v*` ou une release le fait. C'est la contrainte structurante du chantier.
- Projet dev : `kumy-agripilot-dev` — site Hosting `kumy-farmer-dev` — domaine `mobile-dev.kumy.app`.
- Projet prod : `kumy-agripilot-prod` — site Hosting `kumy-farmer-prod` — domaine `mobile.kumy.app`.
- Rewrite `/api/**` → Cloud Run `agripilot-backoffice-api-dev` (dev) / `agripilot-backoffice-api` (prod), région `europe-west1`.
- **Aucun bloc `firestore`** (`rules` / `indexes`) dans les fichiers `firebase.*.json`. Un déploiement de règles/index depuis ce repo effacerait des index Firestore non trackés.
- `index.html`, `sw.js`, `registerSW.js`, `workbox-*.js` servis en `Cache-Control: no-cache`. Le reste des assets en `max-age=31536000`.
- Node **22** dans la CI (Vite 7 exige `^20.19.0 || >=22.12.0` ; `22` est LTS et évite de dépendre de la résolution exacte de la ligne 20.x).
- Aucun secret `VITE_FIREBASE_*` : l'app n'importe pas le SDK Firebase.
- Langue : commentaires et messages de commit en français, identifiants en anglais.

---

## File Structure

| Fichier | Responsabilité |
|---|---|
| `.firebaserc` | Alias projets `development` / `production` |
| `firebase.dev.json` | Site `kumy-farmer-dev` + rewrite API dev |
| `firebase.prod.json` | Site `kumy-farmer-prod` + rewrite API prod |
| `.github/workflows/deploy.yml` | Résolution d'env, build unique, deploy dev, deploy prod |
| `.github/workflows/release-please.yml` | PR de release + appel de `deploy.yml` en prod |
| `release-please-config.json` | Type de release, sections du changelog |
| `.release-please-manifest.json` | Version courante connue de release-please |
| `package.json` | Scripts `deploy:dev` / `deploy:prod` (parité locale) |
| `README.md` | Section « Déploiement » + runbook des prérequis ops |

**Pas de `firebase.json` par défaut.** `kumy-landing` en a un (copie de sa config dev), mais c'est une duplication à maintenir en phase. Ici, tout passe par `--config` : les scripts npm, la CI, et les commandes manuelles. Un `firebase deploy` tapé sans `--config` échouera avec un message explicite — préférable à un déploiement silencieux vers le mauvais environnement.

---

## Task 1: Configurations Firebase Hosting

**Files:**
- Create: `.firebaserc`
- Create: `firebase.dev.json`
- Create: `firebase.prod.json`
- Modify: `package.json` (bloc `scripts`)

**Interfaces:**
- Consumes: rien (première tâche).
- Produces: les chemins `firebase.dev.json` et `firebase.prod.json`, consommés par la Task 2 dans la commande `npx firebase-tools deploy --config <path>`. Les noms de sites `kumy-farmer-dev` / `kumy-farmer-prod` sont figés ici et repris dans le runbook de la Task 5.

- [ ] **Step 1: Écrire le test de validation des configs**

Ce chantier n'a pas de code applicatif : le « test » est un script Node qui assert la
forme des fichiers de configuration. Créer `scripts/check-hosting-config.mjs` :

```js
// Vérifie la forme des configurations Firebase Hosting.
// Exécuté manuellement et par la CI (job build).
import { readFileSync } from 'node:fs';

const read = (p) => JSON.parse(readFileSync(new URL(`../${p}`, import.meta.url), 'utf-8'));

const failures = [];
const check = (cond, msg) => {
  if (!cond) failures.push(msg);
};

const CASES = [
  { file: 'firebase.dev.json', site: 'kumy-farmer-dev', service: 'agripilot-backoffice-api-dev' },
  { file: 'firebase.prod.json', site: 'kumy-farmer-prod', service: 'agripilot-backoffice-api' },
];

for (const { file, site, service } of CASES) {
  const cfg = read(file);
  const h = cfg.hosting;
  check(!!h, `${file}: bloc "hosting" manquant`);
  check(h?.site === site, `${file}: hosting.site attendu "${site}", reçu "${h?.site}"`);
  check(h?.public === 'dist', `${file}: hosting.public doit valoir "dist"`);
  check(!cfg.firestore, `${file}: bloc "firestore" interdit (risque de clobber des index)`);

  const rewrites = h?.rewrites ?? [];
  const api = rewrites.find((r) => r.source === '/api/**');
  check(!!api, `${file}: rewrite "/api/**" manquant`);
  check(api?.run?.serviceId === service, `${file}: serviceId attendu "${service}", reçu "${api?.run?.serviceId}"`);
  check(api?.run?.region === 'europe-west1', `${file}: région attendue "europe-west1"`);
  check(
    rewrites.indexOf(api) < rewrites.findIndex((r) => r.source === '**'),
    `${file}: le rewrite "/api/**" doit précéder le catch-all "**"`,
  );
  check(
    rewrites.some((r) => r.source === '**' && r.destination === '/index.html'),
    `${file}: rewrite SPA "**" -> /index.html manquant`,
  );

  // Le bloc générique d'assets (**/*.@(...|js|...)) DOIT rester en cache long,
  // sinon l'app perd le bénéfice du cache pour ses assets statiques.
  const headers = h?.headers ?? [];
  const genericAssetsIndex = headers.findIndex((entry) => entry.source === '**/*.@(jpg|jpeg|gif|png|svg|webp|js|css|woff|woff2|ttf|eot)');
  const genericAssets = headers[genericAssetsIndex];
  check(
    genericAssets?.headers?.some((x) => x.key === 'Cache-Control' && x.value === 'max-age=31536000'),
    `${file}: header max-age=31536000 manquant pour le bloc générique d'assets`,
  );

  // Le service worker DOIT être servi en no-cache, sinon l'app se fige chez l'utilisateur.
  const noCacheIndex = (source) =>
    headers.findIndex(
      (entry) =>
        entry.source === source &&
        entry.headers.some((x) => x.key === 'Cache-Control' && x.value === 'no-cache'),
    );
  for (const source of ['/index.html', '/sw.js', '/registerSW.js', '/workbox-*.js']) {
    const idx = noCacheIndex(source);
    check(idx !== -1, `${file}: header no-cache manquant pour "${source}"`);

    // sw.js / registerSW.js / workbox-*.js sont aussi des ".js" : ils matchent le bloc
    // générique d'assets ci-dessus (max-age=31536000). Firebase Hosting applique les
    // headers de TOUS les blocs qui matchent, dans l'ORDRE du tableau — si le bloc
    // générique arrivait après l'override no-cache, ce dernier serait écrasé et le
    // service worker se retrouverait servi en cache long (l'app se figerait chez
    // l'utilisateur, exactement le bug que cet override est censé empêcher).
    if (idx !== -1 && source !== '/index.html' && genericAssetsIndex !== -1) {
      check(
        genericAssetsIndex < idx,
        `${file}: le bloc générique d'assets doit précéder l'override no-cache de "${source}" ` +
          `(sinon max-age=31536000 écrase le no-cache et le service worker reste en cache long)`,
      );
    }
  }
}

const rc = read('.firebaserc');
check(rc.projects?.development === 'kumy-agripilot-dev', '.firebaserc: alias development incorrect');
check(rc.projects?.production === 'kumy-agripilot-prod', '.firebaserc: alias production incorrect');

if (failures.length) {
  console.error('Configuration Hosting invalide :');
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}
console.log('Configuration Hosting valide.');
```

- [ ] **Step 2: Lancer le test pour vérifier qu'il échoue**

Run: `cd /Users/thierno/Documents/Projects/kumy/kumy-farmer-app && node scripts/check-hosting-config.mjs`

Expected: FAIL — `Error: ENOENT: no such file or directory, open '.../firebase.dev.json'`
(les fichiers de config n'existent pas encore).

- [ ] **Step 3: Créer `.firebaserc`**

```json
{
  "projects": {
    "default": "kumy-agripilot-dev",
    "development": "kumy-agripilot-dev",
    "production": "kumy-agripilot-prod"
  }
}
```

- [ ] **Step 4: Créer `firebase.dev.json`**

```json
{
  "hosting": {
    "site": "kumy-farmer-dev",
    "public": "dist",
    "ignore": ["firebase.json", "firebase.*.json", "**/.*", "**/node_modules/**"],
    "rewrites": [
      {
        "source": "/api/**",
        "run": {
          "serviceId": "agripilot-backoffice-api-dev",
          "region": "europe-west1"
        }
      },
      {
        "source": "**",
        "destination": "/index.html"
      }
    ],
    "headers": [
      {
        "source": "**/*.@(jpg|jpeg|gif|png|svg|webp|js|css|woff|woff2|ttf|eot)",
        "headers": [{ "key": "Cache-Control", "value": "max-age=31536000" }]
      },
      {
        "source": "/index.html",
        "headers": [{ "key": "Cache-Control", "value": "no-cache" }]
      },
      {
        "source": "/sw.js",
        "headers": [{ "key": "Cache-Control", "value": "no-cache" }]
      },
      {
        "source": "/registerSW.js",
        "headers": [{ "key": "Cache-Control", "value": "no-cache" }]
      },
      {
        "source": "/workbox-*.js",
        "headers": [{ "key": "Cache-Control", "value": "no-cache" }]
      }
    ]
  }
}
```

- [ ] **Step 5: Créer `firebase.prod.json`**

Identique à `firebase.dev.json`, avec deux valeurs changées : `hosting.site` et le
`serviceId` du rewrite API.

```json
{
  "hosting": {
    "site": "kumy-farmer-prod",
    "public": "dist",
    "ignore": ["firebase.json", "firebase.*.json", "**/.*", "**/node_modules/**"],
    "rewrites": [
      {
        "source": "/api/**",
        "run": {
          "serviceId": "agripilot-backoffice-api",
          "region": "europe-west1"
        }
      },
      {
        "source": "**",
        "destination": "/index.html"
      }
    ],
    "headers": [
      {
        "source": "**/*.@(jpg|jpeg|gif|png|svg|webp|js|css|woff|woff2|ttf|eot)",
        "headers": [{ "key": "Cache-Control", "value": "max-age=31536000" }]
      },
      {
        "source": "/index.html",
        "headers": [{ "key": "Cache-Control", "value": "no-cache" }]
      },
      {
        "source": "/sw.js",
        "headers": [{ "key": "Cache-Control", "value": "no-cache" }]
      },
      {
        "source": "/registerSW.js",
        "headers": [{ "key": "Cache-Control", "value": "no-cache" }]
      },
      {
        "source": "/workbox-*.js",
        "headers": [{ "key": "Cache-Control", "value": "no-cache" }]
      }
    ]
  }
}
```

- [ ] **Step 6: Ajouter les scripts npm**

Dans `package.json`, insérer ces deux entrées dans `scripts`, juste après `"preview"` :

```json
    "check:hosting": "node scripts/check-hosting-config.mjs",
    "deploy:dev": "npm run build && npx firebase-tools deploy --only hosting --config firebase.dev.json --project development",
    "deploy:prod": "npm run build && npx firebase-tools deploy --only hosting --config firebase.prod.json --project production",
```

- [ ] **Step 7: Lancer le test pour vérifier qu'il passe**

Run: `cd /Users/thierno/Documents/Projects/kumy/kumy-farmer-app && npm run check:hosting`

Expected: PASS — `Configuration Hosting valide.`

- [ ] **Step 8: Vérifier que le build produit bien `dist/` avec un service worker**

Run: `cd /Users/thierno/Documents/Projects/kumy/kumy-farmer-app && npm run build && ls dist/sw.js dist/index.html`

Expected: le build se termine sans erreur, `dist/sw.js` et `dist/index.html` existent.
Si `dist/sw.js` est absent, les headers `no-cache` posés à l'étape 4 ne servent à rien —
vérifier la configuration `VitePWA` dans `vite.config.ts` avant de poursuivre.

- [ ] **Step 9: Commit**

```bash
cd /Users/thierno/Documents/Projects/kumy/kumy-farmer-app
git add .firebaserc firebase.dev.json firebase.prod.json scripts/check-hosting-config.mjs package.json
git commit -m "feat(cicd): configurations Firebase Hosting dev et prod

Deux sites dedies (kumy-farmer-dev / kumy-farmer-prod) dans les projets
agripilot existants, rewrite /api/** vers l API Cloud Run de chaque env.
Aucun bloc firestore : ce repo ne doit jamais deployer de regles ni d index.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 2: Workflow `deploy.yml`

**Files:**
- Create: `.github/workflows/deploy.yml`
- Create: `scripts/check-workflows.mjs`

**Interfaces:**
- Consumes: `firebase.dev.json` / `firebase.prod.json` (Task 1), `npm run check:hosting` (Task 1).
- Produces: un workflow réutilisable, appelable via `uses: ./.github/workflows/deploy.yml` avec l'entrée **`environment`** (string, requise, valeurs `development` | `production`) et `secrets: inherit`. La Task 3 dépend exactement de ce nom d'entrée.

- [ ] **Step 1: Écrire le test de validation des workflows**

Créer `scripts/check-workflows.mjs`. Il parse le YAML avec le paquet `yaml` (déjà
présent en transitif, mais on l'ajoute explicitement à l'étape 3) et vérifie les
invariants qui protègent la contrainte structurante du chantier.

```js
// Vérifie les invariants des workflows GitHub Actions.
// L'invariant critique : aucun push sur main ne doit pouvoir livrer en production.
import { readFileSync } from 'node:fs';
import { parse } from 'yaml';

const read = (p) => parse(readFileSync(new URL(`../${p}`, import.meta.url), 'utf-8'));

const failures = [];
const check = (cond, msg) => {
  if (!cond) failures.push(msg);
};

const deploy = read('.github/workflows/deploy.yml');
// « on » est interprété comme le booléen true par YAML 1.1 ; le paquet `yaml`
// suit YAML 1.2 et renvoie bien la clé "on". On accepte les deux par prudence.
const on = deploy.on ?? deploy[true];

check(!!on.workflow_call, 'deploy.yml: doit exposer workflow_call (appelé par release-please)');
check(
  on.workflow_call?.inputs?.environment?.required === true,
  'deploy.yml: workflow_call doit exiger une entrée "environment"',
);
check(!!on.workflow_dispatch, 'deploy.yml: workflow_dispatch manquant (secours manuel)');
check(on.push?.branches?.includes('main'), 'deploy.yml: doit se déclencher sur push main');
check(on.push?.tags?.includes('v*'), 'deploy.yml: doit se déclencher sur tag v*');
check(on.pull_request?.branches?.includes('main'), 'deploy.yml: doit se déclencher sur PR vers main');

const jobs = deploy.jobs ?? {};
for (const name of ['resolve', 'build', 'deploy-dev', 'deploy-prod']) {
  check(!!jobs[name], `deploy.yml: job "${name}" manquant`);
}

// Invariant structurant : deploy-prod ne se déclenche que si l'env résolu est
// "production". La résolution (job resolve) ne renvoie "production" que sur tag
// ou appel explicite — jamais sur un push de branche.
const prodIf = String(jobs['deploy-prod']?.if ?? '');
check(
  prodIf.includes("== 'production'"),
  'deploy.yml: deploy-prod doit être gardé par une condition sur l environnement résolu',
);
check(
  jobs['deploy-prod']?.environment === 'production',
  'deploy.yml: deploy-prod doit déclarer environment: production',
);
check(
  jobs['deploy-dev']?.environment === 'development',
  'deploy.yml: deploy-dev doit déclarer environment: development',
);
check(
  jobs['deploy-dev']?.concurrency?.['cancel-in-progress'] === true,
  'deploy.yml: deploy-dev doit annuler les runs concurrents (le canal live est écrasé)',
);
check(
  jobs['deploy-prod']?.concurrency?.['cancel-in-progress'] === false,
  'deploy.yml: deploy-prod ne doit JAMAIS annuler un déploiement prod en cours',
);

if (failures.length) {
  console.error('Workflows invalides :');
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}
console.log('Workflows valides.');
```

- [ ] **Step 2: Lancer le test pour vérifier qu'il échoue**

Run: `cd /Users/thierno/Documents/Projects/kumy/kumy-farmer-app && node scripts/check-workflows.mjs`

Expected: FAIL — `Cannot find package 'yaml'` ou `ENOENT ... .github/workflows/deploy.yml`.

- [ ] **Step 3: Installer la dépendance de test et enregistrer le script**

Run: `cd /Users/thierno/Documents/Projects/kumy/kumy-farmer-app && npm install --save-dev yaml`

Puis dans `package.json`, ajouter juste après `"check:hosting"` :

```json
    "check:workflows": "node scripts/check-workflows.mjs",
```

- [ ] **Step 4: Créer `.github/workflows/deploy.yml`**

```yaml
name: Build & Deploy

# Contrainte structurante : un push sur `main` ne livre JAMAIS en production.
# Seul un tag v* (pousse a la main) ou un appel workflow_call depuis
# release-please.yml (au moment d une release) declenche la prod.

on:
  push:
    branches:
      - main
    tags:
      - "v*"
  pull_request:
    branches:
      - main
  workflow_dispatch:
    inputs:
      environment:
        description: "Environnement cible"
        type: choice
        options:
          - development
          - production
        default: development
  workflow_call:
    inputs:
      environment:
        description: "Environnement cible"
        type: string
        required: true

env:
  NODE_VERSION: "22"

jobs:
  resolve:
    name: Résoudre l'environnement
    runs-on: ubuntu-latest
    outputs:
      environment: ${{ steps.resolve.outputs.environment }}
    steps:
      - name: Déterminer l'environnement cible
        id: resolve
        env:
          # Vide pour push / pull_request ; renseigne pour workflow_call et
          # workflow_dispatch.
          REQUESTED: ${{ inputs.environment }}
        run: |
          if [ -n "$REQUESTED" ]; then
            TARGET="$REQUESTED"
          elif [[ "$GITHUB_REF" == refs/tags/v* ]]; then
            TARGET="production"
          else
            TARGET="development"
          fi
          echo "environment=$TARGET" >> "$GITHUB_OUTPUT"
          echo "Environnement cible : $TARGET"

  build:
    name: Build
    needs: resolve
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Vérifier les configurations Hosting
        run: npm run check:hosting

      - name: Vérifier les workflows
        run: npm run check:workflows

      - name: Lint
        run: npm run lint

      - name: Tests
        run: npm run test

      # L app n importe pas le SDK Firebase : seule l URL d API est necessaire,
      # et elle est relative (rewrite /api/** cote Hosting).
      - name: Créer le fichier .env.production
        run: |
          echo "VITE_API_URL=/api/v1" > .env.production
          echo "VITE_APP_ENV=${{ needs.resolve.outputs.environment }}" >> .env.production
          cat .env.production

      - name: Build
        run: npm run build

      - name: Upload build artifact
        uses: actions/upload-artifact@v4
        with:
          name: dist
          path: dist/
          retention-days: 1

  deploy-dev:
    name: Deploy to Firebase (Dev)
    needs: [resolve, build]
    if: needs.resolve.outputs.environment == 'development'
    runs-on: ubuntu-latest
    environment: development
    # Les PR ecrasent le canal live du site dev : le run le plus recent gagne.
    concurrency:
      group: kumy-farmer-deploy-dev
      cancel-in-progress: true
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Download build artifact
        uses: actions/download-artifact@v4
        with:
          name: dist
          path: dist/

      - name: Authenticate with Firebase
        run: |
          echo '${{ secrets.FIREBASE_SERVICE_ACCOUNT_DEV }}' > /tmp/sa.json
          echo "GOOGLE_APPLICATION_CREDENTIALS=/tmp/sa.json" >> $GITHUB_ENV

      - name: Deploy to Firebase Hosting (Dev)
        run: |
          npx firebase-tools@latest deploy \
            --only hosting \
            --config firebase.dev.json \
            --project ${{ secrets.DEV_FIREBASE_PROJECT_ID }} \
            --non-interactive

  deploy-prod:
    name: Deploy to Firebase (Production)
    needs: [resolve, build]
    if: needs.resolve.outputs.environment == 'production'
    runs-on: ubuntu-latest
    environment: production
    # Un deploiement prod en cours ne doit jamais etre annule a mi-chemin.
    concurrency:
      group: kumy-farmer-deploy-prod
      cancel-in-progress: false
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Download build artifact
        uses: actions/download-artifact@v4
        with:
          name: dist
          path: dist/

      - name: Authenticate with Firebase
        run: |
          echo '${{ secrets.FIREBASE_SERVICE_ACCOUNT_PROD }}' > /tmp/sa.json
          echo "GOOGLE_APPLICATION_CREDENTIALS=/tmp/sa.json" >> $GITHUB_ENV

      - name: Deploy to Firebase Hosting (Production)
        run: |
          npx firebase-tools@latest deploy \
            --only hosting \
            --config firebase.prod.json \
            --project ${{ secrets.PROD_FIREBASE_PROJECT_ID }} \
            --non-interactive
```

- [ ] **Step 5: Lancer le test pour vérifier qu'il passe**

Run: `cd /Users/thierno/Documents/Projects/kumy/kumy-farmer-app && npm run check:workflows`

Expected: PASS — `Workflows valides.`

- [ ] **Step 6: Vérifier la chaîne complète telle que la CI l'exécutera**

Run: `cd /Users/thierno/Documents/Projects/kumy/kumy-farmer-app && npm run check:hosting && npm run check:workflows && npm run lint && npm run test && npm run build`

Expected: les cinq commandes passent successivement, sans erreur.

- [ ] **Step 7: Commit**

```bash
cd /Users/thierno/Documents/Projects/kumy/kumy-farmer-app
git add .github/workflows/deploy.yml scripts/check-workflows.mjs package.json package-lock.json
git commit -m "feat(cicd): workflow de build et de deploiement Firebase Hosting

Resolution de l environnement depuis le declencheur : push main et PR
livrent en dev, seul un tag v* ou un workflow_call livre en prod.
Build unique reutilise par les deux jobs de deploiement.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 3: release-please → déclenchement de la production

**Files:**
- Create: `release-please-config.json`
- Create: `.release-please-manifest.json`
- Create: `.github/workflows/release-please.yml`
- Modify: `scripts/check-workflows.mjs` (ajout des assertions release-please)

**Interfaces:**
- Consumes: `.github/workflows/deploy.yml` et son entrée `environment` (Task 2).
- Produces: rien qu'une tâche ultérieure ne consomme.

- [ ] **Step 1: Écrire les assertions release-please**

Dans `scripts/check-workflows.mjs`, insérer ce bloc **avant** le `if (failures.length)`
final :

```js
const rp = read('.github/workflows/release-please.yml');
const rpOn = rp.on ?? rp[true];
check(rpOn.push?.branches?.includes('main'), 'release-please.yml: doit se déclencher sur push main');

const rpJobs = rp.jobs ?? {};
check(!!rpJobs['release-please'], 'release-please.yml: job "release-please" manquant');
check(!!rpJobs['deploy-prod'], 'release-please.yml: job "deploy-prod" manquant');
check(
  rpJobs['deploy-prod']?.uses === './.github/workflows/deploy.yml',
  'release-please.yml: deploy-prod doit appeler ./.github/workflows/deploy.yml',
);
check(
  rpJobs['deploy-prod']?.with?.environment === 'production',
  'release-please.yml: deploy-prod doit passer environment: production',
);
check(
  rpJobs['deploy-prod']?.secrets === 'inherit',
  'release-please.yml: deploy-prod doit hériter des secrets',
);
// Sans cette garde, chaque push sur main livrerait en production.
check(
  String(rpJobs['deploy-prod']?.if ?? '').includes('release_created'),
  'release-please.yml: deploy-prod doit être gardé par release_created',
);

const manifest = read('.release-please-manifest.json');
check(typeof manifest['.'] === 'string', '.release-please-manifest.json: clé "." manquante');

const rpCfg = read('release-please-config.json');
check(
  rpCfg.packages?.['.']?.['release-type'] === 'node',
  'release-please-config.json: release-type doit valoir "node"',
);
```

- [ ] **Step 2: Lancer le test pour vérifier qu'il échoue**

Run: `cd /Users/thierno/Documents/Projects/kumy/kumy-farmer-app && npm run check:workflows`

Expected: FAIL — `ENOENT: ... .github/workflows/release-please.yml`.

- [ ] **Step 3: Créer `release-please-config.json`**

```json
{
  "$schema": "https://raw.githubusercontent.com/googleapis/release-please/main/schemas/config.json",
  "packages": {
    ".": {
      "release-type": "node",
      "package-name": "kumy-farmer-app",
      "changelog-path": "CHANGELOG.md",
      "bump-minor-pre-major": false,
      "bump-patch-for-minor-pre-major": false,
      "draft": false,
      "prerelease": false
    }
  },
  "include-component-in-tag": false,
  "changelog-sections": [
    { "type": "feat", "section": "Ajouté" },
    { "type": "fix", "section": "Corrigé" },
    { "type": "perf", "section": "Performances" },
    { "type": "refactor", "section": "Refactorisation" },
    { "type": "revert", "section": "Annulé" },
    { "type": "docs", "section": "Documentation", "hidden": true },
    { "type": "style", "section": "Style", "hidden": true },
    { "type": "chore", "section": "Divers", "hidden": true },
    { "type": "test", "section": "Tests", "hidden": true },
    { "type": "build", "section": "Build", "hidden": true },
    { "type": "ci", "section": "CI", "hidden": true }
  ]
}
```

- [ ] **Step 4: Créer `.release-please-manifest.json`**

La valeur doit correspondre à la version courante de `package.json` (`0.1.0`).

```json
{
  ".": "0.1.0"
}
```

- [ ] **Step 5: Créer `.github/workflows/release-please.yml`**

```yaml
name: Release Please

# Ouvre / maintient une PR « chore: release X.Y.Z » a partir des conventional
# commits pousses sur main. Au merge de cette PR : bump de package.json, mise a
# jour du CHANGELOG.md, creation du tag vX.Y.Z + GitHub Release.
#
# Un tag cree par l action avec le GITHUB_TOKEN par defaut ne redeclenche AUCUN
# workflow (garde-fou anti-boucle de GitHub). On n attend donc pas que le tag
# reveille deploy.yml : on appelle deploy.yml directement en workflow_call,
# conditionne a release_created. Aucun PAT n est necessaire.

on:
  push:
    branches:
      - main

permissions:
  contents: write
  pull-requests: write

jobs:
  release-please:
    name: Release Please
    runs-on: ubuntu-latest
    outputs:
      release_created: ${{ steps.release.outputs.release_created }}
      tag_name: ${{ steps.release.outputs.tag_name }}
    steps:
      - uses: googleapis/release-please-action@v4
        id: release
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          config-file: release-please-config.json
          manifest-file: .release-please-manifest.json

  deploy-prod:
    name: Deploy to Production
    needs: release-please
    # Sans cette garde, chaque push sur main livrerait en production.
    if: needs.release-please.outputs.release_created == 'true'
    uses: ./.github/workflows/deploy.yml
    with:
      environment: production
    secrets: inherit
```

- [ ] **Step 6: Lancer le test pour vérifier qu'il passe**

Run: `cd /Users/thierno/Documents/Projects/kumy/kumy-farmer-app && npm run check:workflows`

Expected: PASS — `Workflows valides.`

- [ ] **Step 7: Vérifier la cohérence version manifest ↔ package.json**

Run: `cd /Users/thierno/Documents/Projects/kumy/kumy-farmer-app && node -e "const p=require('./package.json').version,m=require('./.release-please-manifest.json')['.'];if(p!==m){console.error('Desynchronise: package.json='+p+' manifest='+m);process.exit(1)}console.log('Versions alignees: '+p)"`

Expected: PASS — `Versions alignees: 0.1.0`

- [ ] **Step 8: Commit**

```bash
cd /Users/thierno/Documents/Projects/kumy/kumy-farmer-app
git add release-please-config.json .release-please-manifest.json .github/workflows/release-please.yml scripts/check-workflows.mjs
git commit -m "feat(cicd): release-please declenche le deploiement de production

Le tag pose par le GITHUB_TOKEN ne reveille aucun workflow : release-please
appelle donc deploy.yml en workflow_call, conditionne a release_created.
Aucun PAT necessaire.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 4: Documentation du déploiement

**Files:**
- Modify: `README.md`

**Interfaces:**
- Consumes: tous les artefacts des Tasks 1 à 3.
- Produces: le runbook exécuté manuellement en Task 5.

- [ ] **Step 1: Ajouter la section « Déploiement » au README**

Ajouter en fin de `README.md` :

````markdown
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

### Prérequis d'infrastructure (une seule fois)

1. Créer les sites Hosting :
   ```bash
   firebase hosting:sites:create kumy-farmer-dev  --project kumy-agripilot-dev
   firebase hosting:sites:create kumy-farmer-prod --project kumy-agripilot-prod
   ```
2. Rattacher les domaines custom `mobile-dev.kumy.app` et `mobile.kumy.app` aux sites
   correspondants (console Firebase → Hosting → Ajouter un domaine personnalisé), puis
   poser les enregistrements DNS chez le registrar de `kumy.app`.
3. Créer les secrets GitHub du repo (`Settings → Secrets and variables → Actions`) :
   | Secret | Valeur |
   |---|---|
   | `FIREBASE_SERVICE_ACCOUNT_DEV` | contenu JSON de `dev-sa.json` |
   | `FIREBASE_SERVICE_ACCOUNT_PROD` | contenu JSON de `prod-sa.json` |
   | `DEV_FIREBASE_PROJECT_ID` | `kumy-agripilot-dev` |
   | `PROD_FIREBASE_PROJECT_ID` | `kumy-agripilot-prod` |
4. Créer les GitHub Environments `development` et `production`
   (`Settings → Environments`). Une règle de protection sur `production` ajoute une
   approbation manuelle avant chaque livraison.

### Ce qui n'est pas couvert

Le build et la signature des applications Android / iOS ne sont pas dans la CI : les
projets natifs ne sont pas encore générés (`cap add android` / `cap add ios`).
````

- [ ] **Step 2: Vérifier que le README ne contient pas de domaine périmé**

Run: `cd /Users/thierno/Documents/Projects/kumy/kumy-farmer-app && grep -n "kumy.app" README.md`

Expected: seules les occurrences `mobile-dev.kumy.app` et `mobile.kumy.app` (et le
registrar `kumy.app` au point 2) apparaissent. Aucune mention de `kumy-dev.app` ni de
`app.kumy.app`.

- [ ] **Step 3: Commit**

```bash
cd /Users/thierno/Documents/Projects/kumy/kumy-farmer-app
git add README.md
git commit -m "docs(cicd): documente les environnements et le runbook de deploiement

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 5: Activation — prérequis ops et premier déploiement vert

Cette tâche contient les gestes **manuels** que le repo ne peut pas automatiser. Elle
est exécutée par Thierno, avec les identifiants GCP/GitHub. Un agent ne peut pas la
réaliser seul : il doit s'arrêter ici et rendre la main.

**Files:** aucun (opérations d'infrastructure).

**Interfaces:**
- Consumes: le runbook du README (Task 4).
- Produces: deux sites Hosting vivants, quatre secrets GitHub, deux environments.

- [ ] **Step 1: Créer les deux sites Hosting**

```bash
firebase hosting:sites:create kumy-farmer-dev  --project kumy-agripilot-dev
firebase hosting:sites:create kumy-farmer-prod --project kumy-agripilot-prod
```

Expected: `Site kumy-farmer-dev has been created in project kumy-agripilot-dev.`
(idem pour prod). Si le nom est déjà pris globalement, choisir un suffixe et **répercuter
la valeur dans `firebase.dev.json` / `firebase.prod.json` et dans `scripts/check-hosting-config.mjs`**.

- [ ] **Step 2: Vérifier que les sites existent**

```bash
firebase hosting:sites:list --project kumy-agripilot-dev
firebase hosting:sites:list --project kumy-agripilot-prod
```

Expected: `kumy-farmer-dev` apparaît dans la première liste, `kumy-farmer-prod` dans la
seconde.

- [ ] **Step 3: Créer les secrets GitHub**

```bash
cd /Users/thierno/Documents/Projects/kumy/kumy-farmer-app
gh secret set FIREBASE_SERVICE_ACCOUNT_DEV  < ../dev-sa.json
gh secret set FIREBASE_SERVICE_ACCOUNT_PROD < ../prod-sa.json
gh secret set DEV_FIREBASE_PROJECT_ID  --body "kumy-agripilot-dev"
gh secret set PROD_FIREBASE_PROJECT_ID --body "kumy-agripilot-prod"
gh secret list
```

Expected: les quatre secrets apparaissent dans `gh secret list`.

- [ ] **Step 4: Créer les GitHub Environments**

Dans `Settings → Environments`, créer `development` et `production`. Sans eux, les jobs
qui déclarent `environment:` échouent au démarrage.

- [ ] **Step 5: Pousser la branche et ouvrir la PR**

```bash
cd /Users/thierno/Documents/Projects/kumy/kumy-farmer-app
git push -u origin feature/cicd-firebase-hosting
gh pr create --base main --title "feat(cicd): livraison continue Firebase Hosting dev et prod" --body "Voir docs/superpowers/specs/2026-07-21-cicd-firebase-hosting-design.md"
```

Expected: la PR déclenche `Build & Deploy`, les jobs `resolve` → `build` → `deploy-dev`
passent au vert. **Aucun job `deploy-prod` ne doit apparaître.**

- [ ] **Step 6: Vérifier le déploiement dev**

```bash
curl -sI https://kumy-farmer-dev.web.app/ | head -1
curl -sI https://kumy-farmer-dev.web.app/sw.js | grep -i cache-control
```

Expected: `HTTP/2 200` et `cache-control: no-cache` sur `sw.js`.
(Utiliser l'URL `.web.app` tant que le domaine custom n'est pas propagé.)

- [ ] **Step 7: Rattacher les domaines custom**

Console Firebase → Hosting → site `kumy-farmer-dev` → « Ajouter un domaine
personnalisé » → `mobile-dev.kumy.app` ; idem `mobile.kumy.app` sur `kumy-farmer-prod`.
Poser les enregistrements DNS demandés chez le registrar de `kumy.app`.

Expected (après propagation) : `curl -sI https://mobile-dev.kumy.app/ | head -1` renvoie `HTTP/2 200`.

- [ ] **Step 8: Merger la PR et vérifier que la prod n'a PAS été livrée**

Après le merge sur `main` :

```bash
gh run list --limit 5
```

Expected: un run `Build & Deploy` (dev) et un run `Release Please`. **Aucun déploiement
de production.** C'est le critère de succès n°2 de la spec — s'il échoue, tout le
chantier est à revoir avant d'aller plus loin.

- [ ] **Step 9: Première release en production**

Merger la PR « chore: release 0.2.0 » ouverte par release-please.

Expected: le workflow `Release Please` enchaîne sur le job `Deploy to Production`, le tag
`v0.2.0` est créé, et :

```bash
curl -sI https://kumy-farmer-prod.web.app/ | head -1
curl -s https://mobile.kumy.app/api/v1/health -o /dev/null -w "%{http_code}\n"
```

Expected: `HTTP/2 200` sur le site, et un code HTTP non-404 sur `/api/v1/health`
(preuve que le rewrite Cloud Run fonctionne ; adapter le chemin si l'API n'expose pas
`/health`).

---

## Notes d'exécution

- Les Tasks 1 à 4 sont réalisables intégralement en local, sans identifiants GCP.
- La Task 5 exige les identifiants et l'accès à la console Firebase : un agent doit
  s'arrêter à la fin de la Task 4 et rendre la main.
- Les scripts `scripts/check-hosting-config.mjs` et `scripts/check-workflows.mjs` sont
  exécutés par le job `build` : ils protègent durablement les invariants du chantier
  (pas de bloc `firestore`, `sw.js` en `no-cache`, prod inatteignable depuis un push
  sur `main`).
