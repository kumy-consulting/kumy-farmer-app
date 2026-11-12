# Livrer Kumy sur le Play Store (Android) — Plan de mise en production

> **Suivi :** ce document se coche au fur et à mesure (`- [ ]` → `- [x]`). Il est la
> source de vérité de la livraison ; toute décision prise en cours de route
> (numéro de version, identifiants, dates) s'écrit ici, pas dans un fil de discussion.

**Goal:** Publier `com.kumy.farmer` sur le Google Play Store, depuis un build reproductible jusqu'au déploiement progressif en production, sans jamais perdre la clé de signature ni expédier l'app contre l'API de développement.

**Architecture:** Le bundle Vite (`dist/`) est embarqué par Capacitor dans une coquille Android versionnée (`android/`). Le livrable Play est un **AAB** (`bundleRelease`), signé par une clé d'upload locale, la signature finale étant déléguée à **Play App Signing**. Le premier dépôt est manuel ; l'automatisation CI ne vient qu'ensuite, Play l'exigeant.

**Spec de référence:** `docs/superpowers/specs/2026-08-22-capacitor-android-natif-design.md`

---

## ▶ REPRISE — lire ceci en premier

*Dernière mise à jour : **2026-11-02**. **D-U-N-S obtenu** — le blocage de sept semaines est levé.*

> **Le blocage est levé.** D&B a validé l'entité et attribué le numéro D-U-N-S, en
> réponse au dossier `34960909` ouvert le 26/10. Sept semaines après la demande initiale
> du 07/09 — six jours après la relance.
>
> **Numéro et raison sociale exacte : `docs/app-registration/duns-obtenu.md`**, hors
> dépôt. Les deux chaînes se saisissent **au caractère près** chez Apple comme chez
> Google : un écart de casse, de tiret ou d'espace fait échouer la vérification.
>
> **24 à 48 h de propagation** avant que le numéro soit accepté par l'enrôlement Apple ;
> D&B le dit explicitement. Rien à faire d'ici là.
>
> **Ce qui tombe avec le blocage — ne rien envoyer :**
>
> | Démarche | État |
> |---|---|
> | Recours exemption Google (`recours-google-duns.md`) | **sans objet** |
> | Échéance D&B du 13/11 | **sans objet** |
> | Point de contrôle Apple du 30/10 | **sans objet** |
> | Filet D-U-N-S Netpulse SAS | **sans objet** |
>
> **Reprise immédiate :** §2.2 — créer le compte développeur Play (25 $, paiement
> unique) avec le nom légal exact, puis §5 (fiche Store) et §6 (déploiement progressif).
> Compter **2 à 3 jours ouvrés** de vérification Google côté organisation. Tout le
> technique est prêt, AAB signé compris.
>
> **Ce qui a débloqué, pour mémoire :** personne ne vérifiait. Apple annonce 5 jours
> ouvrés et demande expressément d'écrire à D&B au-delà de deux semaines ; aucune date
> de contrôle n'avait été posée, et la demande a dormi. Le questionnaire que D&B SAME a
> renvoyé le 27/10 était le modèle vierge de septembre — la réponse de septembre n'avait
> jamais été traitée. La leçon tient en une ligne : **toute attente d'un tiers porte une
> date de vérification écrite dans ce plan.**

### Où en est-on

| Phase | État | Bloqué par |
|---|---|---|
| 0 — Bloquants techniques | ✅ **terminée** | — |
| 1 — Versioning | ✅ **terminée** | — |
| 2 — Compte développeur Play | ⏳ **débloquée** | D-U-N-S obtenu — propagation 24–48 h, puis création du compte |
| 3 — Keystore et signature | ✅ **terminée** | — |
| 4 — Build AAB | ⏳ **AAB signé produit** | Test `bundletool` sur device |
| 5 — Fiche Store | ⬜ | Phase 2 |
| 6 — Déploiement progressif | ⬜ | Phases 2, 4, 5 |
| 7 — CI | ⬜ | Premier dépôt manuel |

**Plus rien ne bloque côté technique.** Tout ce qui pouvait avancer sans le compte
développeur est fait. Le livrable publiable existe déjà :

```
android/app/build/outputs/bundle/release/app-release.aab   3,4 Mo, signé
```

Ce qui reste dépend soit d'une réponse extérieure (D&B, Google), soit d'un
appareil physique.

### Travail livré — branche `chore/migration-capacitor-8`

| Commit | Objet |
|---|---|
| `340921f` | Migration Capacitor 7.6 → 8.5.0, targetSdk 36 |
| `1786b37` | Contraste de la barre de statut sur Android 16 |
| `9380742` | Précision du commentaire de la garde |
| `e7843a0` | Étape 0.1 cochée, phase 0.3 close |
| `e176c40` · `31b987d` · `f031549` · `3015249` | Phase 2 — exigences, décisions, D&B |
| `9d193e0` | URL d'API prod + garde-fou `check:native-env` |
| `12b5ea0` | Version 1.0.0, `versionCode` dérivé du semver |
| `093bf12` | Bloc de reprise en tête du plan |
| `8ceb9de` | Signature de release, R8, garde-fou de livrable non signé |
| `5fed0d0` | Clé d'upload générée, AAB signé vérifié |

Branche **non fusionnée**, partie de `feature/farmer-invitation`.

### Prochaines actions

**[Thierno] — par ordre d'urgence**

1. **Sécuriser `apps@kumy.app` — avant l'inscription développeur.** L'accès a été
   reconquis le 12/11 par récupération : le compte existait depuis le 07/09, mais ni
   mot de passe ni codes de secours n'étaient conservés. Au gestionnaire de secrets :
   mot de passe, **nouveaux** codes de secours, date de naissance déclarée, accès OVH
   de la boîte. Puis une adresse de secours qui soit **une adresse de rôle**, pas une
   boîte personnelle. Ce compte détiendra l'app à vie et ne se transfère jamais.
2. **Créer le compte développeur Play** — le numéro D-U-N-S est propagé depuis le
   **04/11** — `play.google.com/console/signup`, connecté en `apps@kumy.app`, type
   **Organisation**, 25 $ une fois. Saisir le nom légal et le D-U-N-S **au caractère
   près** tels que D&B les a écrits : `docs/app-registration/duns-obtenu.md`. Puis
   2 à 3 jours ouvrés de vérification d'organisation.
3. **Sauvegarder la clé d'upload hors de cette machine**, chiffrée. Dix minutes, et
   c'est la seule perte irréversible du projet : aujourd'hui, un disque perdu impose un
   cycle de réinitialisation avec Google. Le mot de passe est déjà au gestionnaire de
   secrets ; le `.jks` lui-même ne l'est pas encore.
4. **Ajouter le nom légal et le RCCM en pied de page de `kumy.app`.** Google confronte
   le site à l'entité pendant la vérification d'organisation — ce n'est plus une
   précaution, c'est la pièce que le vérificateur va chercher.
5. **Lancer l'enrôlement Apple en parallèle** — le même numéro vaut pour
   `developer.apple.com/enroll` (99 $/an). Hors du chemin Android, mais l'enrôlement a
   sa propre file de vérification : autant qu'elle tourne pendant celle de Google.
6. **Valider l'edge-to-edge** sur un téléphone Android 16 à WebView ≥ 140.
   APK : `android/app/build/outputs/apk/debug/app-debug.apk` (1.0.0, API **prod**).
   Attendu : l'en-tête vert de l'accueil remonte **sous** la barre de statut, heure et
   batterie en blanc dessus. Une bande claire intercalée = régression à traiter.

**[Assistant] — faisable sans rien attendre**

- Finir la phase 4 : installer `bundletool` (absent du poste) pour éprouver l'APK exact
  que Play générera à partir de l'AAB. `assembleRelease` est déjà vérifié, mais il ne
  teste pas le découpage par densité et ABI.
- Préparer la phase 7 (job CI de release) — le câblage `KUMY_KEYSTORE_*` est déjà en
  place côté Gradle, mais Play exige un premier dépôt manuel avant d'ouvrir son API.

### Faits de référence — à ne pas re-chercher

| | |
|---|---|
| Entité | **KUMY HOLDING - SAS** (sigle « KUMY - SAS ») |
| RCCM | Tribunal de Commerce de Conakry, immatriculée le 21/08/2025 — *numéro dans `docs/app-registration/` (hors dépôt)* |
| Adresse | siège à Conakry — *adresse légale exacte dans `docs/app-registration/`, à confirmer identique aux statuts* |
| Compte propriétaire | **`apps@kumy.app`** — compte Google créé le 07/09/2026, accès **reconquis le 12/11/2026** après récupération. Détient l'app à vie, **non modifiable** après création du compte développeur |
| Contact public | contact@kumy.app · téléphone du siège — *voir `docs/app-registration/`* |
| Site déclaré | **kumy.app** (Firebase Hosting) — site de la société. `kumy.consulting` (Vercel) porte l'activité conseil et ne sert pas ici |
| API **prod** | `https://agripilot-backoffice-api-ezmnjvheka-ew.a.run.app/api/v1` |
| API **dev** | `https://agripilot-backoffice-api-dev-rlsznfc4qq-ew.a.run.app/api/v1` |
| `applicationId` | `com.kumy.farmer` · version `1.0.0` / `versionCode 10000` |
| Nom public sur Play | **« KUMY HOLDING - SAS »**, pas « KUMY » |
| Clé d'upload | `~/.secrets/kumy/kumy-farmer-upload.jks`, alias **`kumy-upload`** |
| Empreinte SHA-256 | `03:67:18:49:3F:49:FB:C7:B2:16:FA:EF:B8:74:CF:69:F4:33:C5:71:4B:3C:14:35:F8:4C:5C:22:3E:75:D3:92` |
| Empreinte SHA-1 | `F1:40:BE:52:FC:A9:3B:A2:CB:24:63:03:83:14:E5:97:C2:C8:92:92` |
| Certificat | SHA384withRSA, RSA 4096 bits, valide jusqu'au 17/01/2054 |

### Pièges déjà payés — ne pas les re-découvrir

- **Play exige l'API 36** depuis le 31/08/2026 pour une nouvelle app. Seul Capacitor 8
  l'apporte ; Capacitor 7 plafonne à 35.
- **Capacitor 8 arbitre l'edge-to-edge sur la version du WebView, pas sur l'OS** —
  seuil **140**. En dessous, il rembourre lui-même et annonce des insets nuls. D'où une
  garde qui *mesure* l'inset au lieu de lire une version d'OS.
- **`android:statusBarColor` est inerte sur API 35+** : la barre n'est plus verte sur
  Android 16. Ne pas le supprimer pour autant, il sert encore tout le parc API 24→34.
- **Le repli en dur vers l'API de dev** a été supprimé de `client.ts`. La PWA sœur
  (`agripilot-pwa/src/shared/services/api.ts:69`) porte **toujours** le même — à
  corriger là-bas un jour.
- **D&B ne couvre peut-être pas la Guinée**, et son service est **payant** hors
  États-Unis. Le recours Google est un plan A réaliste, pas un plan B.
- **Un `versionCode` déposé est brûlé à vie**, même si l'AAB est retiré.
- **Le mot de passe d'un keystore ne se retrouve pas.** La première clé a dû être jetée
  pour cette raison. Le générer et l'enregistrer **avant** de le coller dans `keytool`,
  jamais le taper de mémoire. PKCS12 impose de toute façon un mot de passe unique pour
  le magasin et la clé.
- **`keytool` refuse les mots de passe non-ASCII**, et `.properties` traite `\` comme
  un échappement : s'en tenir à l'ASCII sans `\ $ ` " '`.
- **Le propriétaire d'un compte Play Console ne se change JAMAIS.** D'où `apps@kumy.app`
  plutôt qu'une gmail nominative. Le travail quotidien passe par un compte admin ajouté
  ensuite — celui qui détient n'est pas celui qui travaille.
- **GCP et Firebase ne sont PAS logés à la même enseigne** : leurs projets se
  transfèrent et se partagent. Tout est aujourd'hui sur `kumy.teb@gmail.com` ; y ajouter
  `apps@kumy.app` comme Owner supprimerait ce point unique de défaillance, sans urgence.
- **Le support Google est injoignable depuis les URL évidentes** sans compte développeur :
  `console/signup` comme `help-and-support` renvoient à la création de compte. Seul
  `.../contact/general_contact` fonctionne.
- L'émulateur `google_apis` API 36 fige un **WebView 133** : il ne peut pas exercer
  l'edge-to-edge réel. L'image `android-36.1` ne démarre pas sur ce poste.
- Les invites interactives (mot de passe `keytool`) **ne fonctionnent pas** derrière le
  préfixe `!` de Claude Code : la saisie arrive vide. Passer par un vrai terminal.

### Environnement local à recréer sur un autre poste

Trois éléments, tous hors du dépôt :

- `.env.production` — voir `.env.example`, section PRODUCTION.
- `keystore.properties` — voir `keystore.properties.example`. Sans lui,
  `bundleRelease` échoue explicitement (c'est voulu) ; les builds de debug marchent.
- La clé `kumy-farmer-upload.jks` elle-même, depuis la sauvegarde chiffrée.

Optionnel : AVD `kumy_api36` — `system-images;android-36-ext19;google_apis;arm64-v8a`.

---

## Global Constraints

- **Le keystore est irremplaçable.** Perdre la clé d'upload avec Play App Signing = incident récupérable. Perdre la clé de signature **sans** Play App Signing = ne plus jamais pouvoir mettre à jour `com.kumy.farmer`. Cette contrainte gouverne la Phase 3.
- **Aucun secret dans le dépôt.** `.jks`, mots de passe, `keystore.properties`, `.env.production` : tous gitignorés, tous dans le gestionnaire de secrets.
- **Le hors-ligne est le cœur du produit.** Usage terrain en Guinée, réseau dégradé. Toute vérification de build inclut un démarrage avion.
- **`versionCode` strictement monotone.** Play refuse définitivement un `versionCode` déjà déposé, même pour un AAB retiré.
- **Langue.** Documentation et commits en français, identifiants de code en anglais.
- **Commits conventionnels**, hooks Husky actifs (ESLint au pre-commit).

## État des lieux — relevé du 2026-08-31, tenu à jour

| Élément | État constaté |
|---|---|
| `android/` versionné, `appId com.kumy.farmer` | ✅ en place |
| Capacitor **8.5.0**, 6 plugins en v8 | ✅ migré le 31/08/2026 (branche `chore/migration-capacitor-8`) |
| Assets natifs (`npm run assets:native`) | ✅ script existant |
| JDK 21, SDK Android, build-tools 34→37 | ✅ poste équipé |
| release-please + CI Firebase Hosting | ✅ en place |
| Keystore de signature | ✅ `~/.secrets/kumy/kumy-farmer-upload.jks`, alias `kumy-upload` |
| `signingConfig release` dans `app/build.gradle` | ✅ en place, R8 activé, éprouvé sur clé jetable |
| URL API en natif (prod) | ✅ `.env.production` + `check:native-env` garde le build |
| `versionCode` / `versionName` | ✅ `10000` / `1.0.0`, dérivés de `package.json` |
| `targetSdk` | ✅ `36` — conforme à l'exigence Play du 31/08/2026 (`minSdk 24`) |
| Fixtures `*.demo.ts` | ✅ gardées par `import.meta.env.DEV`, éliminées au build prod |
| Android Studio | ✅ 2026.1, au-delà du minimum Capacitor 8 |
| Taille du bundle web | ✅ 2,6 Mo (`dist/`), dont 1,3 Mo de JS |

---

## Phase 0 — Bloquants techniques

*Rien d'autre ne doit démarrer tant que 0.1 et 0.2 ne sont pas tranchés : ce sont les deux seules façons de produire un AAB qui se fait refuser à l'upload, ou pire, qui s'installe et parle à la mauvaise API.*

### 0.1 — Niveau d'API cible ⇒ migration Capacitor 8

> **FAITE le 31/08/2026** — branche `chore/migration-capacitor-8`, commits `340921f`, `1786b37`, `9380742`.
> Capacitor **8.5.0**, APK vérifié à `minSdk 24 / targetSdk 36 / compileSdk 36`.
> Seule réserve : la validation edge-to-edge sur device physique reste ouverte (trois cases en fin de section).

**VÉRIFIÉ le 2026-08-31 auprès de la doc Play officielle.** L'exigence est entrée en vigueur **aujourd'hui même** :

| | Exigence depuis le 31/08/2026 |
|---|---|
| **Nouvelle application** et mises à jour | **API 36** (Android 16) minimum |
| Application existante (pour rester visible des nouveaux utilisateurs) | API 35 minimum |

Le projet est en `targetSdkVersion 35` : **insuffisant pour une première publication**. Un AAB au `targetSdk` périmé est rejeté à l'upload, pas au review.

> **Report possible.** Une extension jusqu'au **1er novembre 2026** peut être demandée via un formulaire de la Play Console. À n'utiliser qu'en dernier recours : elle ne s'applique de toute façon pas proprement à une app qui n'existe pas encore en console.

**La conséquence structurante :** le `targetSdk` est arrimé à la version majeure de Capacitor, qui sort une majeure par an précisément pour suivre les exigences Play. Capacitor 7 (le projet est en **7.6**) plafonne à l'API 35 ; **c'est Capacitor 8 qui apporte l'API 36**. Bricoler AGP et `variables.gradle` à la main dans un projet Capacitor 7 revient à se placer hors des configurations testées par l'équipe Capacitor, pour un gain nul par rapport à la migration.

**Décision : migrer en Capacitor 8**, en suivant le guide officiel `capacitorjs.com/docs/updating/8-0`.

Prérequis Capacitor 8, confrontés au poste :

| Prérequis | Exigé | Constaté | |
|---|---|---|---|
| Node.js | ≥ 22 | 24.18.0 (`.nvmrc` = 24) | ✅ |
| JDK | 21 | 21.0.10 | ✅ |
| Android Studio | Otter 2025.2.1+ | à vérifier | ⚠️ |
| Plateforme SDK `android-36` | requise | installée le 31/08/2026 | ✅ |

- [x] `sdkmanager "platforms;android-36"` — la plateforme 36 exacte manque (36.1 ≠ 36)
- [x] Vérifier / mettre à jour Android Studio vers Otter 2025.2.1 ou plus récent — **2026.1** installé (`AI-261.23567.138`), au-delà du minimum
- [x] Monter les dépendances Capacitor en `^8` : `@capacitor/core`, `@capacitor/cli`, `@capacitor/android`, et les six plugins (`app`, `keyboard`, `network`, `preferences`, `splash-screen`, `status-bar`)
- [x] `android/build.gradle` : AGP `8.7.2` → **`8.13.0`**
- [x] `android/build.gradle` : `com.google.gms:google-services` `4.4.2` → **`4.4.4`**
- [x] `android/gradle/wrapper/gradle-wrapper.properties` : Gradle `8.11.1` → **`8.14.3`**
- [x] Kotlin → **`2.2.20`** *(porté par AGP 8.13 / le template Capacitor 8 ; aucune déclaration Kotlin explicite dans ce projet, qui est en Java)*
- [x] `android/variables.gradle` : `compileSdkVersion` et `targetSdkVersion` → **`36`**
- [x] `android/variables.gradle` : `minSdkVersion` `23` → **`24`** *(voir l'arbitrage ci-dessous)*
- [x] `android/app/build.gradle` : passer la syntaxe dépréciée sans `=` au format avec (`namespace = "com.kumy.farmer"`, etc.)
- [x] `android/app/src/main/AndroidManifest.xml` : ajouter **`density`** à `android:configChanges` de `MainActivity` — sans quoi le WebView se recharge lors des redimensionnements
- [x] `npx cap sync android`
- [x] `cd android && ./gradlew assembleDebug` — vérifier que la chaîne compile avant d'aller plus loin

**Arbitrage `minSdk 23 → 24`.** Capacitor 8 impose l'API 24. On perd Android 6.0 Marshmallow (2015) et on conserve Android 7.0+. Sur le parc visé en Guinée, la part résiduelle d'Android 6 est marginale, mais elle n'est pas nulle sur les appareils très bas de gamme — c'est le seul point de la migration qui retire des utilisateurs potentiels. Contrainte imposée par Capacitor 8, donc non négociable si l'on veut l'API 36.

- [x] Acter la perte d'Android 6.0 : **acceptée le 31/08/2026**. Non négociable — Capacitor 8 impose `minSdk 24`, et Capacitor 8 est la seule voie vers l'API 36 qu'exige Play. Le choix réel n'était donc pas « Android 6 ou non » mais « publier ou non »

**Edge-to-edge — mesuré sur émulateur Android 16 (API 36), pas supposé.**

Capacitor 8 introduit un plugin de cœur `SystemBars` qui décide seul du régime,
selon la version du WebView (`SystemBars.java`) :

| WebView du device | Régime | `env(safe-area-inset-top)` | Qui peint sous la barre |
|---|---|---|---|
| **≥ 140** + `viewport-fit=cover` | edge-to-edge réel, insets transmis au web | hauteur réelle (~52 px) | le contenu web (en-tête vert) |
| **< 140** | Capacitor rembourre la vue parente | `0` | la vue native, pas le web |

L'app satisfait déjà la condition `viewport-fit=cover` (`index.html`) et emploie
`env(safe-area-inset-*)` sur tous ses en-têtes et pieds d'écran : les deux
régimes sont donc correctement gérés côté mise en page, sans retouche.

Ce qui change vraiment : `android:statusBarColor` étant inerte sur API 35+, la
**barre n'est plus verte** sur Android 16. Le contraste des icônes système
devient donc fonction de l'écran affiché, alors qu'il était global.

D'où `useFondBarreStatut` : seuls les cinq écrans à haut sombre (accueil,
bienvenue, bonnes pratiques, détail domaine, détail parcelle) déclarent
`'sombre'` ; le fond clair est l'état de repos, posé par `initNativeShell`. La
garde `insetHautPx() > 0` est le point clé — elle fait taire tout le mécanisme
sur le parc où la barre reste un bandeau vert opaque (API 24→34, Android 15 via
l'opt-out, et WebView < 140), où accorder les icônes à un écran clair les
rendrait sombres sur du vert foncé.

- [x] Émulateur API 36 monté (`kumy_api36`, `system-images;android-36-ext19`)
- [x] Barre transparente confirmée sur Android 16 : le vert de `statusBarColor` est bien ignoré
- [x] Écran clair → `mLastAppearance=LIGHT_STATUS_BARS` (icônes sombres), lisible
- [x] Écran sombre → `LIGHT_STATUS_BARS` absent (icônes claires) — vérifié garde neutralisée, l'émulateur ayant un WebView 133
- [x] Ordre des appels vérifié : la déclaration d'un écran l'emporte sur l'état de repos de `initNativeShell`
- [x] Splash : fond crème, icônes sombres, conforme
- [x] Contenu jamais masqué par la barre dans les deux régimes
- [ ] **Rejouer sur un device physique à WebView ≥ 140** — seul cas où le web peint réellement sous la barre. Voie émulateur épuisée : l'image `android-36-ext19` fige un WebView 133, et l'image `android-36.1` (WebView plus récent) ne démarre pas sur ce poste — restée `offline` sur deux tentatives, `Failed to restore previous context: 12297`. Un téléphone récent tranche la question en une minute.
- [ ] Vérifier le rendu de l'en-tête vert de l'accueil sous la barre en edge-to-edge réel
- [ ] Vérifier le clavier sur les écrans de saisie (le plugin corrige l'inset bas quand l'IME est visible)

**Sources :** [Play — Target API level requirements](https://developer.android.com/google/play/requirements/target-sdk) · [Capacitor — Updating to 8.0](https://capacitorjs.com/docs/updating/8-0) · [Capacitor — Setting Android Target SDK](https://capacitorjs.com/docs/android/setting-target-sdk) · [AGP 8.13.0](https://developer.android.com/build/releases/agp-8-13-0-release-notes)

### 0.2 — URL de l'API en production

`src/shared/api/client.ts:21` porte un fallback **en dur** vers `https://agripilot-backoffice-api-dev-...run.app/api/v1`, et `.env.example` ne renseigne `VITE_API_URL_NATIVE` que vers le DEV. Le `.env.production` fabriqué par la CI (`.github/workflows/deploy.yml`) n'écrit que `VITE_API_URL`, qui ne concerne **que** le web. Un `npm run build` suivi de `cap sync` aujourd'hui produit donc une app native branchée sur l'API de développement — sans le moindre signal d'erreur.

- [x] Récupérer l'URL Cloud Run **production** de `agripilot-backoffice-api` — `https://agripilot-backoffice-api-ezmnjvheka-ew.a.run.app/api/v1`, relevée dans le `.env.production` de la PWA sœur et cohérente avec le `serviceId` de `firebase.prod.json`
- [x] Créer un `.env.production` local (gitignoré par `.env.*`) avec `VITE_API_URL_NATIVE=<url prod>/api/v1`
- [x] Remplacer le fallback `NATIVE_API_FALLBACK` par un échec explicite quand la variable manque en natif — fait, **plus aucune URL de repli** dans `client.ts`. Doublé d'un garde-fou en amont, `scripts/check-native-env.mjs`, câblé sur `cap:sync` : il refuse le build si la variable manque, n'est pas absolue, ou pointe sur le service `-dev`
- [x] Documenter la variable dans `.env.example` (les deux URL, dev et prod, avec la mention de laquelle sert à quoi)
- [x] Après build : vérifier dans `dist/assets/*.js` que l'URL prod est bien celle inlinée — **vérifié**, le bundle natif ne contient plus que l'URL prod, et le bundle web aucune URL absolue

### 0.3 — Vérifications de propreté du bundle

- [x] Fixtures de démonstration éliminées du build prod — vérifié, toutes gardées par `import.meta.env.DEV`
- [x] `npm run lint` au vert — vérifié le 31/08/2026
- [x] `npm run test` au vert — **408 tests**, 60 fichiers, le 31/08/2026
- [x] Aucun `console.log` de debug résiduel dans les chemins critiques (auth, sync) — vérifié sur `shared/services`, `shared/api`, `features/Auth`
- [x] Vérifier la taille de `dist/` — **2,6 Mo** dont 1,3 Mo de JS. Correct pour le parc visé ; le chunk `index` à 814 Ko (255 Ko gzip) reste le candidat naturel à un découpage si le premier lancement déçoit sur le terrain

---

## Phase 1 — Versioning

> **FAITE le 01/09/2026** — commit à venir sur `chore/migration-capacitor-8`.
> `versionName 1.0.0` / `versionCode 10000`, vérifiés sur l'APK.

- [x] Brancher `versionName` sur `package.json` — source de vérité unique, que release-please fait avancer
- [x] Stratégie de `versionCode` retenue : **dérivée du semver**, `major*10000 + minor*100 + patch`. Reproductible et lisible (`1.0.0` → `10000`), là où un compteur de CI dépend de l'historique des runs
- [x] Garde-fou : la construction **échoue** si mineur ou correctif atteint 100, borne au-delà de laquelle le calcul cesserait d'être croissant. Play refusant définitivement un `versionCode` déjà déposé, mieux vaut échouer au build que produire un livrable incorrigible
- [x] Suffixe de pré-version toléré : `1.2.3-rc.1` → `versionCode 10203`, `versionName` conservant le suffixe
- [x] `versionCode` surchargeable pour un dépôt exceptionnel : `./gradlew bundleRelease -PversionCode=10001`
- [x] **Version du premier dépôt Play : `1.0.0`** — le numéro est public sur la fiche, et publier *est* l'engagement que `1.0.0` signifie
- [x] `.release-please-manifest.json` et `package-lock.json` alignés sur `1.0.0`
- [x] Réglages `bump-minor-pre-major` / `bump-patch-for-minor-pre-major` **retirés** de `release-please-config.json` : conçus pour un projet avant sa première version publique, ils écrasaient les ruptures en bump mineur. Une fois l'app entre les mains d'agriculteurs, une rupture doit bumper le majeur
- [x] Vérifier sur l'APK : `versionCode='10000' versionName='1.0.0'`

---

## Phase 2 — Compte développeur Play

> **Vérifié le 31/08/2026 auprès du support Google Play.** Ma première estimation
> (« plusieurs jours ») était fausse pour un compte organisation : le numéro
> **D-U-N-S** exigé peut prendre **jusqu'à 30 jours**. C'est de loin le poste le
> plus long de toute la livraison — plus long que tout le travail technique
> restant réuni.

### 2.0 — Deux décisions à prendre avant de cliquer quoi que ce soit

**Décision A — Type de compte.** Ce n'est pas un détail administratif : les deux
voies ont des délais et des obligations entièrement différentes.

| | **Organisation** (KUMY) | **Personnel** |
|---|---|---|
| Numéro D-U-N-S | **Obligatoire** — jusqu'à 30 j | Non |
| Test avant production | Aucun | **12 testeurs, 14 j continus** |
| Affiché publiquement | Nom légal, adresse légale, e-mail, téléphone de l'entité | Nom et coordonnées de la personne |
| Crédibilité pour banques et partenaires | Forte | Faible |

Les deux voies aboutissent en gros dans la même fenêtre de 2 à 4 semaines : l'une
attend un identifiant, l'autre attend des testeurs. Mais elles n'exigent pas la
même chose de toi, et une seule des deux affiche « KUMY » sur la fiche.

L'obligation des 12 testeurs ne vise que les comptes **personnels** créés après
le 13/11/2023 ; un compte organisation en est dispensé. À noter tout de même :
la Phase 6 prévoit de toute façon un test fermé avec de vrais agriculteurs, donc
cette contrainte recoupe partiellement du travail déjà prévu.

- [x] Type de compte retenu : **Organisation — KUMY** *(décidé le 31/08/2026)*

**Décision B — Quelle entité.** Le compte engage une personne morale précise :
son nom légal et son adresse seront **publics** sur la fiche Play, et c'est son
compte bancaire qui sera vérifié. NEEMA Agrobusiness (Guinée) et Netpulse SAS
(France) ne mènent pas au même « pays d'exploitation », ni aux mêmes délais
D-U-N-S, ni au même compte bancaire à faire valider.

- [x] Entité juridique porteuse : **KUMY HOLDING - SAS** (sigle « KUMY - SAS »), immatriculée au Tribunal de Commerce de Conakry le **21/08/2025**
- [x] Adresse déclarée : siège à Conakry — *à confirmer identique au siège social des statuts*
- [x] Contact public : **contact@kumy.app** — **kumy.app** (et non `kumy.consulting`, corrigé le 07/09)

> **Numéro RCCM, adresse légale exacte et téléphones** : dans `docs/app-registration/`,
> hors dépôt (ce dépôt est public). Ce plan n'en porte que ce qui est nécessaire à la
> conduite de la livraison.
- [x] Pays d'exploitation déclaré : **Guinée**

### 2.1 — Obtenir le D-U-N-S — ✅ *obtenu le 02/11/2026, par la voie Apple*

> **Résolu.** Le numéro a été attribué le **02/11/2026**, gratuitement, par la file D&B
> dédiée à Apple (`support.dnb.com/?CUST=APPLEDEV`) — dossier `34960909`. Numéro et
> raison sociale exacte dans `docs/app-registration/duns-obtenu.md`, hors dépôt.
>
> Les deux réserves ci-dessous sont levées, et **elles étaient fausses toutes les
> deux** : la Guinée est bien servie — l'absence du pays dans `choose-your-country.html`
> ne concernait que les bureaux régionaux — et la voie Apple est bien gratuite pour
> elle. Ce qui a coûté sept semaines n'est donc ni le pays ni le tarif : c'est une
> demande tombée dans une file sans suivi, et l'absence de date de vérification de
> notre côté. Le reste de cette section est conservé tel qu'il a été écrit, pour que
> le raisonnement reste lisible.


Le compte étant Organisation, le D-U-N-S est obligatoire. C'est le poste le plus
long de toute la livraison : tout le reste attend derrière lui, y compris les
25 $, qui peuvent être payés bien plus tard.

> **Deux corrections à l'estimation initiale, une fois la Guinée connue.**
>
> **Ce n'est ni gratuit ni rapide pour une entité africaine.** Le formulaire
> libre-service gratuit de `dnb.com` vise les entreprises **américaines**. Une
> entité guinéenne relève de **D&B SAME** (South Asia, Middle East & Africa),
> dont le service D-U-N-S est **payant**, par paliers : standard jusqu'à
> **30 jours ouvrés** — soit près de six semaines — ou accéléré à **8 jours
> ouvrés** moyennant supplément.
>
> **La couverture de la Guinée n'est pas acquise.** D&B SAME met en avant le
> Nigeria, la Tanzanie, le Ghana et le Bangladesh ; la Guinée ne figure pas dans
> cette liste. Le recours « limitations régionales » prévu par Google cesse donc
> d'être une réserve théorique pour devenir un scénario probable.

Conséquence sur la conduite : ne pas attendre la réponse de D&B pour préparer le
dossier de recours. **Trois pistes avancent en parallèle, la plus rapide gagne.**

**a₀. La voie Apple — gratuite, et probablement la plus courte.** *(découverte le 07/09)*

Apple exige elle aussi un D-U-N-S pour ses comptes organisation, et fournit son
propre outil de recherche et de demande. Le numéro délivré est le **même
identifiant standard** : obtenu via Apple, il vaut pour Google Play.

| | D&B SAME (voie directe) | Via Apple |
|---|---|---|
| Coût | payant | **gratuit** dans la plupart des juridictions |
| Délai | 30 jours ouvrés | quelques jours + 2 jours ouvrés côté Apple |
| Couverture | Guinée non listée | enrôlement ouvert à 220+ pays |

Il faut seulement un **Apple ID gratuit** — aucun paiement, aucun engagement dans
le programme à 99 $/an.

- [x] Créer l'Apple ID sur `apps@kumy.app` — fait le 07/09/2026
- [x] Rechercher KUMY HOLDING - SAS sur <https://developer.apple.com/enroll/duns-lookup/>
- [x] Si absente : soumettre les informations à D&B via Apple (gratuit) — fait le 07/09/2026
- [x] ~~⏳ EN ATTENTE DU RETOUR APPLE~~ — sept semaines de silence, la relance du 14/09 n'ayant jamais été posée comme tâche. Débloqué par le dossier D&B `34960909` du 26/10
- [x] **Numéro obtenu le 02/11/2026** — valeur et raison sociale exacte dans `docs/app-registration/duns-obtenu.md` (hors dépôt)

*Réserve : l'outil est derrière une authentification, son comportement pour la
Guinée n'a pas pu être vérifié. « Gratuit dans la plupart des juridictions » ne
vaut pas garantie. D'où le maintien des deux autres pistes.*

**a. Chercher chez D&B — il en existe peut-être déjà un.**

Beaucoup d'entités en possèdent un sans le savoir (ouverture de compte bancaire,
appel d'offres, partenariat international l'ont parfois déclenché). Chercher coûte
cinq minutes et peut faire gagner un mois.

- [x] Rechercher KUMY HOLDING - SAS sur <https://service.dnb.com/> — fait le 26/10 : *No Match*, comme attendu
- [x] **Confirmer la couverture de la Guinée** auprès de D&B SAME — demande envoyée le **31/08/2026**, relance si sans réponse au **07/09/2026**
- [x] Demander le tarif et le délai réels pour la Guinée : **sans objet** — la voie Apple l'a délivré gratuitement
- [ ] Attention aux **doublons** : une entité peut porter plusieurs D-U-N-S (sièges, filiales). Retenir celui dont le nom et l'adresse correspondent exactement à ceux que portera le compte développeur
- [x] D-U-N-S trouvé : aucun préexistant — celui du 02/11 est le premier et le seul porté par l'entité

**b. Sinon, le demander.** — ~~voie payante~~, **sans objet**

La voie Apple a délivré le numéro gratuitement ; le service payant de D&B SAME n'a
jamais eu à être commandé. À noter pour une prochaine entité africaine : le fil SAME a
répondu en un jour une fois le dossier Apple ouvert, après deux mois de silence — c'est
l'ouverture du dossier dans la file `CUST=APPLEDEV` qui a réveillé les deux canaux.

- [x] Demande via **D&B SAME** — **sans objet**, numéro obtenu gratuitement par la voie Apple
- [x] Arbitrer standard vs accéléré — **sans objet**
- [x] Date de demande : 07/09/2026 (voie Apple) / **date d'obtention : 02/11/2026**

**c. La correspondance exacte, qui est le vrai piège.**

Le nom légal et l'adresse enregistrés chez D&B doivent correspondre à ceux du
**profil Google Payments**. En cas d'écart, Google envoie un e-mail et affiche
« Your organization name or address is no longer verified » — et le cycle
recommence. Une abréviation, un accent, un numéro de rue formaté autrement
suffisent.

- [ ] Relire côte à côte la fiche D&B et les statuts de KUMY, au caractère près
- [ ] Vérifier que l'adresse D&B est bien l'adresse **légale**, pas une adresse opérationnelle

**d. Porte de sortie si D&B ne couvre pas le pays.**

Google prévoit explicitement le cas : *« si vous ne pouvez pas obtenir de D-U-N-S
en raison de limitations régionales, vous pouvez solliciter notre équipe support
pour une méthode de vérification alternative »*. À garder en réserve si l'entité
est guinéenne et que D&B s'avère sans couverture locale — les demandes
incomplètes étant écartées, il faudra un dossier documenté (statuts, registre du
commerce, justificatif d'adresse).

**Le formulaire, et lui seul.** `play.google.com/console/signup` et
`console/developers/help-and-support` renvoient tous deux vers la création de
compte : ils sont sans issue tant qu'aucun compte développeur n'existe. La voie
prévue pour ce cas est le formulaire de contact général :

```
support.google.com/googleplay/android-developer/contact/general_contact
```

**Ordre imposé par Google :** contacter le support **AVANT** de créer le compte
développeur. Lancer la vérification d'organisation sans D-U-N-S expose à un compte
bloqué plutôt qu'à un dossier instruit.

- [ ] **Monter le dossier de recours dès maintenant**, sans attendre un refus : statuts de KUMY, extrait du registre du commerce guinéen, justificatif d'adresse légale, preuve de contrôle du domaine `kumy.app`. Les demandes incomplètes sont écartées d'office
- [ ] Ouvrir le dossier via le formulaire ci-dessus, connecté avec `apps@kumy.app`
- [ ] Ne **rien** attacher au premier envoi — laisser Google réclamer les pièces
- [ ] Date d'envoi : `________` / numéro de ticket : `________________`
- [ ] Issue : `________________`

**e. Solution de repli à garder en tête.**

Si la Guinée s'avère hors couverture D&B **et** que le recours Google traîne, une
autre entité du groupe — française — porterait le compte sans aucune de ces
frictions : couverture D&B complète, vérification bancaire simple. Le coût n'est
pas technique mais réputationnel : c'est ce nom légal, et non « KUMY Guinée »,
qui s'afficherait publiquement sur la fiche Play. À n'envisager que si les deux
premières pistes échouent, et à trancher en connaissance de cause.

- [ ] Repli envisagé ? `________________`

### 2.2 — Créer le compte

- [x] Compte Google **dédié** créé : `apps@kumy.app` (07/09/2026), nom affiché « Kumy »,
      2FA activée avec codes de secours. **Accès reconquis le 12/11/2026** par récupération :
      ni le mot de passe ni les codes n'avaient été conservés, et plus personne ne savait
      s'y connecter.
- [ ] **Consigner les accès au gestionnaire de secrets — avant toute autre étape.**
      Mot de passe, **nouveaux** codes de secours (les anciens sont d'état inconnu),
      date de naissance déclarée, identifiants de la boîte OVH `apps@kumy.app`.
- [ ] **Poser une adresse de secours qui soit elle aussi une adresse de rôle**, et non
      une boîte personnelle — sinon la récupération du compte qui détient l'app à vie
      dépend d'un individu, ce que le choix d'une adresse de rôle visait à supprimer.
- [ ] Finir l'inscription sur `play.google.com/console/signup` — **seulement une fois le D-U-N-S obtenu ou le recours accepté**
- [ ] Type d'entreprise : « Entreprise »
- [ ] Ajouter ensuite `kumy.teb@gmail.com` comme **administrateur**, pour que le travail courant ne passe pas par le compte propriétaire
- [ ] Accepter le Google Play Developer Distribution Agreement
- [ ] Payer les **25 $** (paiement unique, à vie). Carte MasterCard, Visa, American Express ou Discover — les cartes **prépayées sont refusées**
- [ ] Choisir le type de compte décidé en 2.0

### 2.3 — Vérifications

Trois vérifications distinctes, à ne pas confondre : identité, entité, et moyen
de paiement. Chacune a son propre cycle.

- [ ] **Identité** — pièce d'identité officielle en cours de validité, au nom légal exact
- [ ] **Entité** (organisation) — nom, adresse, D-U-N-S, téléphone, **site web**, contact
- [ ] **Paiement / bancaire** — soit un « deposit challenge » (petit versement à confirmer), soit l'envoi de documents bancaires officiels. Compter **jusqu'à 5 jours**
- [ ] Accepter que soient rendus publics : nom légal, adresse légale, e-mail et téléphone du développeur
- [ ] **Acter que la fiche Play affichera « KUMY HOLDING - SAS »**, et non « KUMY » — c'est le nom légal qui s'affiche, et il ne se change pas librement ensuite

> **Piège récurrent :** l'adresse et le téléphone publiés doivent rester
> joignables. Ce sont des coordonnées de contact réelles, pas un formulaire —
> et elles seront visibles de tous sur la fiche Play.

### 2.4 — Accès aux appareils

- [ ] Installer l'app **Play Console** sur un téléphone Android et s'y connecter — la vérification d'accès à un appareil Android est exigée des nouveaux comptes

### 2.5 — Suivi

- [ ] Date de soumission du compte : `________`
- [ ] Date de validation : `________`
- [ ] Blocages rencontrés : `________________`

---

## Phase 3 — Keystore et signature

*Aucun keystore n'existe aujourd'hui (ni dans le dépôt, ni dans `~/.android`).*

### 3.1 — Générer la clé d'upload

> **FAITE le 01/09/2026.** Première génération jetée : son mot de passe s'est avéré
> irrécupérable. Sans conséquence — la clé n'avait jamais servi et rien n'était
> publié. La leçon a été appliquée à la seconde : le mot de passe est **généré et
> enregistré dans le gestionnaire de secrets AVANT** d'être collé dans `keytool`,
> jamais tapé de mémoire.

- [x] Générer hors du dépôt — **fait le 01/09/2026**, clé rangée dans `~/.secrets/kumy/kumy-farmer-upload.jks` (permissions `600`, dossier `700`)
- [x] Renseigner CN / O / L / C en cohérence avec l'entité — `CN=KUMY HOLDING - SAS, OU=KUMY, O=KUMY HOLDING - SAS, L=Conakry, ST=Conakry, C=GN`
- [x] Consigner l'alias exact et l'empreinte SHA-256 :
  - alias : **`kumy-upload`**
  - SHA-256 : `03:67:18:49:3F:49:FB:C7:B2:16:FA:EF:B8:74:CF:69:F4:33:C5:71:4B:3C:14:35:F8:4C:5C:22:3E:75:D3:92`
  - SHA-1 : `F1:40:BE:52:FC:A9:3B:A2:CB:24:63:03:83:14:E5:97:C2:C8:92:92`
  - Algorithme : SHA384withRSA, RSA 4096 bits · valide jusqu'au **17/01/2054**

### 3.2 — Mettre la clé à l'abri

- [x] Ajouter `*.jks` et `*.keystore` à `.gitignore`
- [x] Ajouter `keystore.properties` à `.gitignore` — avec `!keystore.properties.example`, seul fichier de cette famille qui se commit
- [x] Déposer le `.jks` + le mot de passe dans le gestionnaire de secrets — mot de passe **unique** (keystore et clé identiques, comme l'impose PKCS12), enregistré AVANT la génération de la clé
- [ ] Faire une copie froide chiffrée, hors ligne, hors du poste de travail
- [x] Vérifier qu'aucun secret n'a fuité — **vérifié** : clé jamais suivie ni commitée, `keystore.properties` ignoré, aucun `.jks` dans l'arbre de travail

### 3.3 — Configurer la signature Gradle

> **FAITE le 01/09/2026.** Chaîne complète éprouvée bout en bout avec un keystore
> **jetable**, généré puis détruit : `bundleRelease` produit un AAB signé (3,4 Mo,
> contre 6,5 Mo pour l'APK debug), et l'APK release minifié démarre sur
> émulateur. La clé de production, elle, reste à générer par un humain.

- [x] Modèle `keystore.properties.example` créé à la racine. **Le fichier réel reste à créer par toi**, après génération de la clé (3.1)
- [x] `signingConfigs.release` lit `keystore.properties`, ou les variables `KUMY_KEYSTORE_*` qui ont la priorité (prêt pour la phase 7). Aucune valeur en dur
- [x] Rattacher `signingConfig signingConfigs.release` au `buildTypes.release`
- [x] Échec net si la signature manque : `assembleRelease` et `bundleRelease` s'arrêtent avec la marche à suivre, tandis que les tâches de debug restent utilisables sans aucune clé. Un champ **vide** est refusé au même titre qu'un fichier absent, et un keystore introuvable aussi
- [x] `minifyEnabled true` et `shrinkResources true` activés
- [x] Vérifié : Capacitor déclare `consumerProguardFiles`, donc ses règles s'appliquent d'office (plugins et méthodes annotées préservés), et `proguard-android.txt` garde les méthodes `@JavascriptInterface`. **Éprouvé à l'exécution** — APK release minifié installé sur émulateur Android 16, `Capacitor: Starting BridgeActivity`, écran rendu, aucune exception

### 3.4 — Play App Signing

- [ ] Activer **Play App Signing** lors de la création de l'application en console (mode par défaut)
- [ ] Comprendre et acter la conséquence : le `.jks` local n'est qu'une **clé d'upload**, révocable si compromise ; Google détient la clé de signature finale
- [ ] Noter l'empreinte SHA-256 de la clé de **signature** fournie par Play (distincte de celle d'upload) — nécessaire à toute intégration tierce ultérieure (Firebase, App Links, API Google)

---

## Phase 4 — Build de l'AAB

- [ ] `npm run build`
- [x] `npx cap sync android`
- [ ] `cd android && ./gradlew bundleRelease`
- [ ] Récupérer `android/app/build/outputs/bundle/release/app-release.aab`
- [ ] Vérifier la signature : `jarsigner -verify -verbose -certs app-release.aab`

### 4.1 — Tester l'APK que Play générera réellement

*Un APK debug ne prouve rien du livrable : ni la signature release, ni R8, ni le découpage par densité/ABI.*

- [ ] Générer et installer :
  ```bash
  bundletool build-apks --bundle=app-release.aab --output=kumy.apks \
    --ks=kumy-farmer-upload.jks --ks-key-alias=kumy-upload --mode=universal
  bundletool install-apks --apks=kumy.apks
  ```
- [ ] **Démarrage hors-ligne** (mode avion, app fraîchement installée puis relancée) — cœur de l'usage terrain
- [ ] Splash screen : affichage puis masquage effectif à l'initialisation de session
- [ ] Barre de statut et zones sûres (cf. 0.1)
- [ ] Authentification téléphone + PIN **contre l'API prod**
- [ ] Persistance Dexie / IndexedDB après redémarrage de l'app
- [ ] Cartographie Leaflet : tuiles, cache, tracé de parcelle
- [ ] Synchronisation à la reconnexion réseau
- [ ] Retour arrière matériel Android sur les écrans clés (plugin `@capacitor/app`)
- [ ] Test sur au moins un appareil bas de gamme représentatif du parc visé

---

## Phase 5 — Fiche Play Store

### 5.1 — Confidentialité *(cause n°1 de rejet)*

L'app collecte numéro de téléphone, localisation de parcelles et données d'exploitation. La déclaration doit être précise, et surtout **cohérente entre les deux documents ci-dessous** — c'est l'incohérence, plus que la collecte elle-même, qui déclenche les rejets.

- [ ] Rédiger la politique de confidentialité (numéro de téléphone, géolocalisation des parcelles, données agronomiques, finalité, conservation, droits)
- [ ] L'héberger à une URL publique stable (le Firebase Hosting du projet convient)
- [ ] Renseigner l'URL en console
- [ ] Remplir le **formulaire Data safety** en cohérence exacte avec cette politique
- [ ] Relire les deux côte à côte, ligne à ligne

### 5.2 — Éléments graphiques et textuels

- [ ] Icône 512×512 PNG
- [ ] Feature graphic 1024×500
- [ ] ≥ 2 captures d'écran téléphone (viser 4 à 8, en français)
- [ ] Description courte (80 caractères max)
- [ ] Description longue (4000 caractères max)
- [ ] Catégorie et tags
- [ ] Coordonnées de contact développeur

### 5.3 — Déclarations réglementaires

- [ ] Questionnaire de classification du contenu
- [ ] Public cible et tranche d'âge (attention : viser les mineurs déclenche des exigences supplémentaires)
- [ ] Déclaration publicités : non
- [ ] Déclaration achats intégrés : à confirmer selon le modèle économique — `________________`
- [ ] Pays de distribution (Guinée au minimum ; décider de l'ouverture au-delà)
- [ ] Déclaration d'application financière si le volet crédit / AgriScore le déclenche — **à vérifier**, cette catégorie impose des justificatifs lourds

---

## Phase 6 — Déploiement progressif

- [ ] Créer l'application en console (nom, langue par défaut : français, gratuite)
- [ ] **Internal testing** : déposer l'AAB, ajouter jusqu'à 100 testeurs — disponible en quelques minutes
- [ ] Valider le parcours complet depuis le Store (installation réelle, pas sideload)
- [ ] **Closed testing** : élargir à de vrais agriculteurs en Guinée — c'est là que se valident réseau dégradé, hors-ligne et appareils bas de gamme
- [ ] Collecter les retours, corriger, redéposer (`versionCode` incrémenté)
- [ ] Soumettre en **Production** — noter que le premier review d'une app neuve est plus long que les suivants
- [ ] Rollout **10 %** — surveiller crashs (Android vitals) et retours pendant 48 h
- [ ] Rollout **50 %** — même surveillance
- [ ] Rollout **100 %**
- [ ] Date de publication : `________________`

---

## Phase 7 — Industrialisation CI

*Volontairement après le premier dépôt manuel : Play exige un premier AAB déposé à la main avant d'ouvrir l'API de publication.*

- [ ] Créer un compte de service Google Play API et lui accorder les droits de publication
- [ ] Stocker le keystore en secret GitHub (base64) + les mots de passe en secrets
- [ ] Ajouter un job `android-release` à `.github/workflows/deploy.yml`, déclenché sur tag `v*` (le workflow résout déjà `production` sur ces tags)
- [ ] Reconstituer le keystore et `keystore.properties` au runtime, dans un chemin éphémère
- [ ] Injecter `VITE_API_URL_NATIVE` prod dans le `.env.production` du job (l'étape actuelle n'écrit que `VITE_API_URL`)
- [ ] Étendre `scripts/check-workflows.mjs` à ce nouveau job, dans l'esprit des garde-fous existants
- [ ] Publier via `r0adkll/upload-google-play` sur la piste `internal` par défaut — la promotion vers production reste un geste humain
- [ ] Vérifier qu'aucun secret ne fuit dans les logs du run

---

## Chemin critique

```
Phase 2 (compte dev. — D-U-N-S jusqu'a 30 JOURS) ────────────────┐
                                                                 ├──► Phase 6
Phase 0.1 (migration Capacitor 8) ──► Phase 3 (keystore) ──► Phase 4 ──┘
Phase 0.2 (API prod)        ──┘
```

Les deux vrais risques ne sont ni la signature ni la console : ce sont **0.1** (la migration Capacitor 8 impose l'edge-to-edge, qui peut casser l'affichage, et retire Android 6.0) et **0.2** (une app livrée contre l'API de dev est un incident parfaitement silencieux).

## Journal de livraison

| Date | Phase | Décision / observation |
|---|---|---|
| 2026-11-12 | 2.2 | **Le compte propriétaire existait, mais personne ne savait s'y connecter.** Le plan le donnait créé le 07/09 ; cette ligne était exacte, et Google l'a confirmé en refusant l'adresse comme « déjà utilisée ». Ce qui manquait n'était pas le compte : c'étaient ses accès. Mot de passe oublié, codes de secours à huit chiffres introuvables, rien au gestionnaire de secrets. Accès reconquis le jour même par récupération. **Le risque réel était là et n'était pas suivi :** ce compte détiendra l'application à vie, sa propriété ne se transfère jamais, et il est resté dix semaines sans que ses identifiants existent nulle part — même classe de risque que le `.jks` présent sur une seule machine. D'où deux étapes ajoutées en 2.2, avant l'inscription développeur. *À noter aussi, sur la conduite : la case a été décochée le matin même sur une simple déclaration de mémoire, sans vérification, puis rétablie. Une case se change sur un fait constaté — dans les deux sens.* |
| 2026-11-02 | 2.1 | **D-U-N-S attribué — sept semaines de blocage levées.** D&B a validé l'entité et délivré le numéro en réponse au dossier `34960909` ouvert le 26/10 : **six jours** de la relance à l'attribution, contre sept semaines de silence avant elle. Numéro et raison sociale exacte dans `docs/app-registration/duns-obtenu.md`, hors dépôt — les deux chaînes se saisissent au caractère près chez Apple comme chez Google. **24 à 48 h de propagation** avant que l'enrôlement Apple les accepte. Tombent du même coup, sans rien envoyer : le recours exemption Google, l'échéance D&B du 13/11, le point de contrôle Apple du 30/10 et le filet Netpulse. Les deux réserves qui ont orienté deux mois de conduite étaient **fausses** : la Guinée est servie, et la voie Apple y est gratuite. Cause racine réelle, écrite pour ne pas la rejouer : **aucune date de vérification n'avait été posée** sur une attente de tiers, alors qu'Apple annonce 5 jours ouvrés et demande expressément d'écrire à D&B au-delà de deux semaines. Le questionnaire que D&B SAME a renvoyé le 27/10 était le modèle vierge de septembre — la réponse de septembre n'avait jamais été traitée. |
| 2026-10-26 | 2.1 | **Blocage relancé sur trois canaux après sept semaines de silence.** La demande du 07/09 n'a jamais produit de numéro, alors qu'Apple annonce 5 jours ouvrés et demande expressément d'écrire à D&B au-delà de deux semaines — on attendait sans savoir qu'on y était autorisé. Dossier D&B **`34960909`** ouvert avec extrait RCCM joint (7–14 j. ouvrés, échéance **13/11**) ; rappel téléphonique Apple obtenu le jour même, l'agent **contacte D&B directement** ; fil SAME à rattacher. Deux faits acquis : **aucune fiche D&B préexistante** pour KUMY, et la **Guinée est bien servie** par le formulaire D&B — l'absence du pays dans `choose-your-country.html` ne visait que les bureaux régionaux. Conséquence : le recours Google ne peut plus plaider l'impossibilité, seulement le silence, et Google écrit qu'il n'accommode pas les comptes qui « échouent à fournir » un numéro. D'où la règle : **rien avant le 13/11**. Filet identifié : chercher un D-U-N-S déjà attribué à **Netpulse SAS** (France), couverture D&B native. |
| 2026-09-07 | 2 | **Procédure suspendue en attente du retour Apple.** Demande de D-U-N-S soumise via l'outil Apple, seule voie gratuite pour une entité guinéenne. Relance calée au 14/09. Rien d'autre ne peut avancer : le compte développeur exige ce numéro, et tout le reste dépend du compte. Côté technique, tout est prêt — AAB signé compris. |
| 2026-09-07 | 2 | **Piste Apple ouverte, et compte propriétaire créé.** Apple exige aussi un D-U-N-S et fournit un outil de demande **gratuit** délivrant le même identifiant standard — voie plus courte que D&B SAME, qui est payant et ne liste pas la Guinée. En parallèle, `apps@kumy.app` créé comme compte Google propriétaire : la propriété d'un compte Play Console ne se change jamais, et une gmail nominative en aurait fait un point unique de défaillance. Domaine retenu : `kumy.app`, qui porte le site de la société, et non `kumy.consulting`. Le support Google s'atteint par `.../contact/general_contact` — les URL évidentes bouclent sur la création de compte. |
| 2026-09-01 | 3 | **Phase 3 terminée. AAB signé produit avec la vraie clé d'upload** — `CN=KUMY HOLDING - SAS`, SHA384withRSA 4096 bits, valide jusqu'en 2054, 3,4 Mo. Empreintes consignées. La première clé générée a dû être jetée, son mot de passe étant irrécupérable : sans coût à ce stade, mais la même erreur après publication aurait impliqué une réinitialisation avec Google. |
| 2026-09-01 | 3 | **Outillage de signature en place.** `signingConfigs.release` lit `keystore.properties` ou les variables d'environnement, et `assembleRelease`/`bundleRelease` échouent explicitement sans elle — un AAB non signé serait sinon refusé par Play après coup, sans motif clair. R8 et `shrinkResources` activés : Capacitor déclarant `consumerProguardFiles`, ses plugins survivent, **vérifié à l'exécution** sur émulateur avec un keystore jetable détruit ensuite. Ne reste que la génération de la vraie clé. |
| 2026-09-01 | 1 | **Phase 1 close.** Première publication en `1.0.0` plutôt que `0.1.0` : le numéro est public sur la fiche Play. `versionCode` dérivé du semver, avec échec de build au-delà de la borne des 100 et surcharge possible par `-PversionCode`. Réglages pre-major de release-please retirés, devenus faux dès la publication. |
| 2026-08-31 | 0.2 | **Phase 0.2 close.** URL prod relevée sur la PWA sœur. Le repli en dur vers l'API de dev est supprimé de `client.ts` — il existait aussi dans la PWA, le risque n'était donc pas propre à cette app. Remplacé par un garde-fou de build (`check:native-env`) éprouvé sur quatre cas d'échec, plus un `throw` en dernier filet. **Phase 0 entièrement terminée.** |
| 2026-08-31 | 2.1 | **Demande de couverture envoyée à D&B SAME.** Entité identifiée au RCCM : KUMY HOLDING - SAS, immatriculée le 21/08/2025. Société d'un an : une fiche D&B préexistante est très improbable. Relance prévue au 07/09. En parallèle, montage du dossier de recours Google. |
| 2026-08-31 | 2 | **Entité : KUMY, Guinée.** Deux corrections en découlent : le D-U-N-S n'est **pas gratuit** pour une entité africaine (D&B SAME, payant, ≈ 30 jours *ouvrés* ou 8 en accéléré), et la **couverture de la Guinée n'est pas acquise** — elle ne figure pas parmi les pays mis en avant par D&B SAME. Le recours « limitations régionales » de Google devient un scénario probable, à préparer en parallèle plutôt qu'après refus. |
| 2026-08-31 | 2 | **Décision A tranchée : compte Organisation (KUMY).** Le D-U-N-S devient donc obligatoire et constitue le chemin critique. Étape 2.1 détaillée : chercher un D-U-N-S existant avant d'en demander un, correspondance exacte avec le profil Google Payments, et recours support documenté en cas de limitation régionale D&B. |
| 2026-08-31 | 2 | Exigences du compte développeur vérifiées. **Correction : un compte organisation exige un D-U-N-S, jusqu'à 30 jours** — et non « plusieurs jours » comme estimé d'abord. Un compte personnel s'en dispense mais impose 12 testeurs sur 14 jours continus. Deux décisions préalables ajoutées : type de compte et entité juridique porteuse. |
| 2026-08-31 | 0.1 / 0.3 | **Étape 0.1 cochée.** Reste ouvert : la validation edge-to-edge sur device physique, et l'arbitrage Android 6.0 acté (imposé par Capacitor 8). Phase 0.3 close également : lint, 408 tests, aucun `console.log` résiduel, bundle à 2,6 Mo. |
| 2026-08-31 | 0.1 | Edge-to-edge instruit sur émulateur API 36. Capacitor 8 arbitre selon la version du WebView (seuil 140) ; l'app gère déjà les deux régimes. Reste que la barre n'est plus verte sur Android 16 → `useFondBarreStatut` pilote le contraste des icônes écran par écran, avec une garde qui l'annule là où la barre reste opaque. |
| 2026-08-31 | 0.1 | **Migration Capacitor 8.5.0 faite et vérifiée** : APK debug construit, `aapt2 dump badging` confirme `minSdk 24` / `targetSdk 36` / `compileSdk 36`, `configChanges=0x1ff4` (bit `density` présent). Lint + 404 tests au vert. Reste : validation edge-to-edge sur device (contraste des icônes système). |
| 2026-08-31 | 0.1 | Exigence Play vérifiée : **API 36 obligatoire depuis ce jour** pour une nouvelle app. Capacitor 7 plafonnant à l'API 35, la phase 0.1 devient une **migration Capacitor 7.6 → 8** (AGP 8.13.0, Gradle 8.14.3, Kotlin 2.2.20, minSdk 24). |
| 2026-08-31 | — | Rédaction du plan, état des lieux constaté |
