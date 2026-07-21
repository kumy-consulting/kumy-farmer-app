# CI/CD Firebase Hosting — kumy-farmer-app (dev + prod)

*Date : 2026-07-21 — Statut : validé, prêt pour plan d'implémentation*

## Objectif

Livrer la PWA `kumy-farmer-app` en continu sur deux environnements, en s'inspirant
d'`agripilot-pwa` sans en recopier les défauts :

- **dev** — `https://mobile-dev.kumy.app`
- **prod** — `https://mobile.kumy.app`

Contrainte structurante : **un push sur `main` ne livre jamais en production.** Seule
une release (tag `v*`) le fait.

## Contexte

`kumy-farmer-app` est un scaffold récent (React 19 + Vite 7 + Capacitor 7, commit
`d9b97c4`). Au moment de la rédaction il n'a **ni `.github/`, ni `firebase.json`, ni
`.firebaserc`**.

Deux faits changent la donne par rapport à `agripilot-pwa` :

1. **L'app n'importe pas le SDK Firebase.** `src/shared/api/client.ts` ne lit que
   `VITE_API_URL` (web, valeur `/api/v1`) et `VITE_API_URL_NATIVE` (WebView Capacitor).
   Les 7 secrets `*_FIREBASE_API_KEY / AUTH_DOMAIN / …` de la PWA sont donc **sans objet**.
2. **`kumy.app` est déjà pris** par `kumy-landing` (`i18n/config.ts: SITE_URL`), qui
   occupe les sites Hosting `kumy-landing-dev` / `kumy-landing-prod` dans les mêmes
   projets Firebase. D'où le choix de sous-domaines dédiés.

## 1. Cibles d'hébergement

| Env | Projet Firebase | Site Hosting | Domaine | Rewrite `/api/**` → Cloud Run |
|---|---|---|---|---|
| dev | `kumy-agripilot-dev` | `kumy-farmer-dev` | `mobile-dev.kumy.app` | `agripilot-backoffice-api-dev` (europe-west1) |
| prod | `kumy-agripilot-prod` | `kumy-farmer-prod` | `mobile.kumy.app` | `agripilot-backoffice-api` (europe-west1) |

Hébergement **multi-site**, exactement le pattern déjà en place pour `kumy-landing`.
Réutiliser les projets existants garantit que le rewrite `/api/**` pointe vers l'API
Cloud Run sans configuration supplémentaire.

Le rewrite `/api/**` n'est pas optionnel : sur le web, `client.ts` émet des requêtes
relatives vers `/api/v1`. Sans lui, l'app ne joint aucun backend.

## 2. Fichiers ajoutés au repo

```
.firebaserc                          default / development / production
firebase.dev.json                    site: kumy-farmer-dev
firebase.prod.json                   site: kumy-farmer-prod
.github/workflows/deploy.yml
.github/workflows/release-please.yml
release-please-config.json
.release-please-manifest.json
package.json                         + scripts deploy:dev / deploy:prod
```

### 2.1 `firebase.<env>.json`

Contenu par environnement :

- `hosting.site` — `kumy-farmer-dev` / `kumy-farmer-prod`
- `hosting.public` — `dist`
- `rewrites` — `/api/**` → Cloud Run (serviceId selon l'env), puis `**` → `/index.html` (SPA)
- `headers` — assets (`js|css|woff|woff2|ttf|eot|jpg|jpeg|gif|png|svg|webp`)
  en `max-age=31536000` ; `index.html`, `sw.js`, `registerSW.js`, `workbox-*.js`
  en `no-cache`.

Le `no-cache` sur le service worker n'est pas cosmétique : `vite-plugin-pwa` est
configuré en `registerType: 'prompt'`, un SW mis en cache fige l'application chez
l'utilisateur.

**Écart délibéré vs `agripilot-pwa`** : aucun bloc `firestore` (`rules` / `indexes`).
La PWA embarque ces clés, ce qui a déjà provoqué l'effacement d'index Firestore non
trackés lors d'un déploiement. `kumy-farmer-app` ne possède pas ces fichiers et ne
doit jamais déployer de règles.

### 2.2 `.firebaserc`

```json
{ "projects": { "default": "kumy-agripilot-dev",
                "development": "kumy-agripilot-dev",
                "production": "kumy-agripilot-prod" } }
```

### 2.3 Scripts npm (parité locale, non utilisés par la CI)

- `deploy:dev` — `npm run build && firebase use development && firebase deploy --only hosting --config firebase.dev.json`
- `deploy:prod` — idem avec `production` / `firebase.prod.json`

## 3. `deploy.yml`

### Déclencheurs

| Événement | Livraison |
|---|---|
| `push` sur `main` | **dev** (canal `live`) |
| `pull_request` vers `main` | **dev** (canal `live`) |
| `push` tag `v*` | **prod** |
| `workflow_call` (depuis release-please) | **prod** |
| `workflow_dispatch` | dev ou prod selon l'entrée `environment` |

### Job `build` (toujours exécuté)

1. `actions/checkout@v4`
2. `actions/setup-node@v4` — Node 20, `cache: npm`
3. `npm ci`
4. `npm run lint`
5. `npm run test` — vitest est déjà configuré (`vitest.config.ts`, `vitest.setup.ts`)
6. Écriture d'un `.env.production` minimal : `VITE_API_URL=/api/v1` et `VITE_APP_ENV=<env>`,
   où `<env>` vaut `production` si le déclencheur est un tag `v*` ou un `workflow_call`,
   et `development` sinon (push `main`, PR)
7. `npm run build` — `GITHUB_SHA` alimente `__BUILD_SHA__`, déjà câblé dans `vite.config.ts`
8. `actions/upload-artifact@v4` — `dist/`, rétention 1 jour

`VITE_API_URL_NATIVE` n'est pas injecté : il ne concerne que les builds Capacitor,
hors périmètre CI (voir §6).

### Jobs `deploy-dev` / `deploy-prod`

Les deux téléchargent l'artifact `dist` et **ne rebuildent pas**. Déploiement :

```bash
echo "$SA_JSON" > /tmp/sa.json
export GOOGLE_APPLICATION_CREDENTIALS=/tmp/sa.json
npx firebase-tools@latest deploy --only hosting \
  --config firebase.<env>.json --project <projectId> --non-interactive
```

Une seule mécanique pour les deux environnements. `agripilot-pwa` utilise
`FirebaseExtended/action-hosting-deploy` en dev et la CLI en prod ; l'action gère mal
`--config` en multi-site, et deux mécaniques pour un même geste sont une source de
dérive.

`deploy-dev` porte `environment: development`, `deploy-prod` porte
`environment: production` (permet une approbation manuelle côté GitHub si souhaité).

### Concurrence

Les PR déploient sur le **canal `live` du site dev** — écrasement assumé, décision
explicite. Conséquence : deux runs simultanés ne doivent pas se croiser — le plus
récent gagne, l'ancien est annulé avant d'avoir déployé.

```yaml
concurrency:
  group: kumy-farmer-deploy-dev
  cancel-in-progress: true
```

`mobile-dev.kumy.app` reflète donc *la dernière chose poussée*, pas nécessairement
`main`. Un push sur `main` après le merge d'une PR restaure l'état de `main`.

### Limite connue

Une PR issue d'un **fork** n'a pas accès aux secrets : son job de déploiement échouera.
Repo privé mono-contributeur ⇒ non bloquant. Le correctif usuel (`pull_request_target`)
est **écarté** : il exécuterait du code non revu avec accès aux secrets.

## 4. release-please → production

### Le piège

Un tag créé par l'action release-please avec le `GITHUB_TOKEN` par défaut **ne
redéclenche aucun workflow** (limitation GitHub anti-boucle). `agripilot-pwa` le
contourne en faisant partir sa prod du push sur `main` — solution incompatible avec
notre contrainte.

### La solution retenue

`deploy.yml` expose son job prod via `on: workflow_call`. `release-please.yml`
l'invoque directement lorsque la sortie `release_created` vaut `true` :

```yaml
jobs:
  release-please:
    outputs:
      release_created: ${{ steps.rp.outputs.release_created }}
    steps:
      - id: rp
        uses: googleapis/release-please-action@v4
  deploy-prod:
    needs: release-please
    if: needs.release-please.outputs.release_created == 'true'
    uses: ./.github/workflows/deploy.yml
    secrets: inherit
```

Aucun PAT nécessaire. Le trigger `push: tags: v*` est conservé en complément : un tag
poussé manuellement depuis un poste développeur déclenche bien les workflows.
`workflow_dispatch` sert de secours.

`release-please-config.json` : `release-type: node`, `packages: {".": {}}`. Le repo
utilise déjà `@commitlint/config-conventional`, le prérequis en conventional commits
est donc satisfait.

## 5. Prérequis ops (manuels, hors code)

1. **Créer les sites Hosting**
   - `firebase hosting:sites:create kumy-farmer-dev --project kumy-agripilot-dev`
   - `firebase hosting:sites:create kumy-farmer-prod --project kumy-agripilot-prod`
2. **Domaines custom** — rattacher `mobile-dev.kumy.app` et `mobile.kumy.app` aux
   sites correspondants dans la console Firebase, puis poser les enregistrements DNS
   chez le registrar de `kumy.app`.
3. **Secrets GitHub** sur `kumy-consulting/kumy-farmer-app` :
   - `FIREBASE_SERVICE_ACCOUNT_DEV` — contenu de `dev-sa.json` (`github-hosting-deployer`)
   - `FIREBASE_SERVICE_ACCOUNT_PROD` — contenu de `prod-sa.json`
   - `DEV_FIREBASE_PROJECT_ID` = `kumy-agripilot-dev`, `PROD_FIREBASE_PROJECT_ID` = `kumy-agripilot-prod`
     (non secrets à proprement parler, mais alignés sur la convention `agripilot-pwa`)
4. **GitHub Environments** `development` et `production` (règles de protection sur prod
   à la discrétion).

Ces quatre points sont bloquants pour un premier déploiement vert et ne peuvent pas
être automatisés depuis le repo.

## 6. Hors périmètre (YAGNI)

- **Build / signature Android & iOS.** Les projets natifs ne sont pas générés
  (`cap add android` / `cap add ios` restent à faire). Aucun job Capacitor tant que
  `android/` et `ios/` n'existent pas.
- **Canaux de preview éphémères par PR.** Écartés au profit de l'écrasement du canal
  `live` dev (décision explicite).
- **Déploiement de règles / index Firestore.** Voir §2.1.
- **Injection de secrets Firebase Web.** L'app n'utilise pas le SDK ; à rajouter le
  jour où elle l'utilisera.

## 7. Critères de succès

1. Une PR vers `main` produit un build vert (lint + tests) et une URL `mobile-dev.kumy.app` à jour.
2. Un merge sur `main` redéploie le dev et **ne touche pas la prod**.
3. Le merge de la PR « chore: release X.Y.Z » crée le tag `vX.Y.Z` **et** déploie `mobile.kumy.app`.
4. `mobile.kumy.app/api/v1/...` atteint l'API Cloud Run de production.
5. Une nouvelle version est proposée à l'utilisateur (prompt SW) sans vider le cache navigateur.
