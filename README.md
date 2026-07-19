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

Les dossiers natifs ne sont PAS générés à l'init. Pour builder natif :

```bash
npm run cap:add:android   # nécessite Android SDK
npm run cap:add:ios       # nécessite macOS + Xcode + CocoaPods
npm run cap:sync          # build web + sync vers les plateformes ajoutées
```

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
