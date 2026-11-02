# Spec — Brancher « Mon espace » sur les vraies données

**Date :** 2026-08-24
**Statut :** Design validé
**Dépôts :** `kumy-farmer-app` (écrans) **et** `agripilot-backoffice-api` (endpoints)

## Contexte

L'onglet « Mon espace » est une maquette intégrale : `MonEspacePage`,
`MesInformationsPage`, `MonCreditPage` et `MonScorePage` lisent toutes des
constantes de `monEspace.demo.ts`. Quel que soit l'agriculteur connecté, la carte
d'en-tête affiche « Mamadou Aliou Barry », le code « KMY-DBK-0412 » et la
« Coopérative maraîchère de Tanènè ».

Le badge « Maquette — données fictives » qui avertissait de cet état a été retiré
de l'écran le 2026-08-24. Rien ne signale donc plus à l'agriculteur que ce nom
n'est pas le sien : c'est ce que ce chantier corrige.

### Périmètre

| Zone | Décision |
|---|---|
| Carte d'agriculteur (`CarteAgriculteur`) | **Branchée** |
| Fiche « Mes informations » (`BlocInformations`) | **Branchée** |
| Réglages — alertes (`BlocReglages`) | **Branchée**, nouvelle route d'écriture |
| Réglages — cartes enregistrées | **Branchée**, 100 % client |
| Bloc « Financement et marché » (`BlocOutils`) | **Hors périmètre** — reste en maquette, avec ses étiquettes « Bientôt » |
| `MonCreditPage`, `MonScorePage` | **Hors périmètre** — restent sur `monEspace.demo` |

## Ce qui bloque aujourd'hui

Aucune route lisible par le rôle `FARMER` ne renvoie à l'agriculteur son propre
profil.

| Route | Contenu | Ouverte au FARMER ? |
|---|---|---|
| `GET /farmers/:id` (résolue par **uid**) | `farmerCode`, `address` + noms des échelons, `cooperativeMembership`, `primaryCrops`, `farms[].area`, `phone`, `alternatePhone`, `notificationSettings` | ❌ `SUPER_ADMIN`, `PARTNER_ADMIN`, `PARTNER_MANAGER`, `ENGINEER` |
| `GET /scoring/farmers/:farmerId/profile` | à peu près le même contenu | ✅ **mais** `:farmerId` est l'id du document `farmers/{id}`, créé par `.add()` donc auto-généré. L'app ne connaît que l'uid, et ne peut pas le traduire |
| `GET /farmers/:id/dashboard` | stats agrégées (surfaces, NDVI, alertes) | ✅ — aucune donnée d'identité |

`notificationSettings` mérite une précision : le champ ne vit **pas** sur le
document `farmers`, mais sur `users/{uid}`. `farmers.service.update()` le
détourne explicitement vers le doc user, et `enrichWithUserInfo()` le recolle
dans la réponse. La route d'écriture visera donc `users/{uid}`.

## Côté API — deux routes

```
GET   /api/v1/farmers/me                       → FarmerSelfDto
PATCH /api/v1/farmers/me/notification-settings → { sms: boolean }
```

**Pas de `:id` dans l'URL.** L'agriculteur est résolu depuis l'uid du jeton
(`@CurrentUser()` → `findByUserId`). Il n'y a donc aucun contrôle « est-ce bien
moi » à écrire — donc aucun à oublier. Les deux routes portent
`@Roles(UserRole.FARMER)` et rien d'autre.

**Piège d'ordre de déclaration :** `@Get('me')` doit précéder `@Get(':id')` dans
`FarmersController`, sinon Nest fait correspondre `:id = "me"` et la route neuve
est morte à l'arrivée. Idem pour le `@Patch`. Un test couvre ce point.

### `FarmerSelfDto` — une réponse restreinte, pas `FarmerResponseDto`

`FarmerResponseDto` transporte `nationalId`, `dateOfBirth`, `gender`,
`educationLevel`, `mobileMoneyAccounts`, `partnerId`, `engineerIds`,
`subscription`. Le commentaire de `ProfilAgriculteur` pose déjà la doctrine : ces
champs ne redescendent pas sur un téléphone, qui peut changer de mains. Les
retirer du **DTO** et pas seulement de l'affichage est le seul moyen qu'ils ne
réapparaissent ni dans un log, ni dans un cache HTTP.

```ts
export class FarmerSelfDto {
  farmerCode: string;
  displayName: string;
  phone: string;
  alternatePhone?: string;
  address: {
    detail?: string;
    districtName?: string;
    sousPrefectureName?: string;
    prefectureName?: string;
    regionName?: string;
  };
  cooperativeName?: string;
  /** Seul réglage que l'app pilote ; absent côté user ⇒ `true`. */
  notificationSettings: { sms: boolean };
}
```

Le service construit ce DTO à partir de `findByUserId(uid)`, qui enrichit déjà
avec les noms d'échelons (`enrichWithAddressNames`) et les infos user
(`enrichWithUserInfo`). Aucune requête Firestore supplémentaire.

`404` si aucun farmer ne porte cet uid — cas réel : un compte créé mais pas
encore rattaché.

### Écriture des alertes

`PATCH /farmers/me/notification-settings`, corps `{ sms: boolean }`.

Le service **lit puis fusionne** `users/{uid}.notificationSettings` avant
d'écrire : un objet partiel écraserait `email`, `push` et
`alertSeverityThreshold`. Quand le champ est absent, il est matérialisé à
`{ email: false, sms: <valeur>, push: false, alertSeverityThreshold: 'warning' }`
— `warning` est la valeur médiane de `AlertSeverityThreshold`.

Réponse : `{ sms: boolean }`, l'état après écriture.

## Côté app — la chaîne

| Fichier | Rôle |
|---|---|
| `features/MonEspace/monEspace.api.ts` | les deux appels, calqué sur `Home/compte.api.ts` |
| `features/MonEspace/monEspace.mapper.ts` | `FarmerSelfDto` → `ProfilAgriculteur`, pur et testé en premier |
| `features/MonEspace/useProfilAgriculteur.ts` | `{ profil, isLoading, erreur }`, sur le modèle de `useCompteNouveau` |

### Correspondance des champs

| `ProfilAgriculteur` | Source |
|---|---|
| `nomComplet` | `displayName` |
| `code` | `farmerCode` |
| `telephone`, `telephoneSecondaire` | `phone`, `alternatePhone` |
| `adresse` | `address.detail` |
| `village` | `address.districtName` |
| `sousPrefecture`, `prefecture`, `region` | les `*Name` correspondants |
| `cooperative` | `cooperativeName` |
| `niveauAcces` | `authStore.user.accessTier` — **pas** l'API : la donnée est déjà là à la connexion |

`culturesPrincipales`, `surfaceTotale` et `irrigation` sortent du type : aucun
composant ne les affiche aujourd'hui — ni la carte, ni la fiche. Un champ qu'on
transporte « au cas où » est un champ qui finit par fuiter. Ils reviendront le
jour où un écran les demande, avec leur source. `monEspace.demo.ts` perd les
trois en même temps.

La règle qui gouverne `FarmerSelfDto` : **le DTO ne porte que ce que l'écran
rend**, pas ce que le modèle métier connaît.

Les échelons vides ne s'affichent pas : `BlocInformations` filtre déjà `adresse`
quand elle manque, la même règle s'étend à village / sous-préfecture /
préfecture / région. Une ligne « Village » sans valeur est pire qu'une ligne
absente.

### États

**Chargement** — squelette gris à la place du nom, du code et de la
coopérative ; la carte garde sa hauteur, rien ne saute quand la réponse arrive.

**Échec ou hors ligne** — repli sur ce que `authStore` sait déjà : nom réel et
initiales réelles, code et coopérative masqués. Jamais un placeholder, jamais le
nom d'un autre. Pas de bandeau d'erreur sur la carte : l'agriculteur ne peut rien
y faire, et son nom est là.

**404 (compte non rattaché)** — même repli. Le cas est légitime, pas une panne.

**Pas de persistance Dexie en v1.** La fiche complète exige le réseau. Rendre
« Mes informations » consultable au champ est un ajout séparé, à décider une
fois le branchement en place.

## Réglages

### Alertes sur mes parcelles

État initial : `notificationSettings.sms` du profil. La bascule est **désactivée**
tant que le profil charge — une bascule qu'on peut actionner avant de connaître
son état ment sur ce qu'elle fait.

Écriture optimiste : la bascule bouge tout de suite, le `PATCH` part, et **elle
revient en arrière si l'appel échoue**, avec un message court. Sans ce retour en
arrière, l'agriculteur croit avoir coupé ses SMS alors qu'ils continuent.

### Cartes enregistrées

Les deux caches déclarés dans `vite.config.ts` — `map-tiles-google` et
`map-tiles-satellite` — sont la matière réelle. « Vider » les supprime
(`caches.delete`), et le compteur se recalcule.

Mesurer leur poids exact est impossible : les tuiles sont des réponses *opaques*
(`statuses: [0, 200]`), dont ni `Content-Length` ni `blob().size` ne sont
lisibles depuis JS. Donc :

1. `navigator.storage.estimate()` expose parfois `usageDetails.caches` (Chromium) :
   quand c'est le cas, on affiche ce chiffre en Mo.
2. Sinon, on affiche le **nombre de tuiles** (`cache.keys().length`), toujours
   exact.

Ce qu'on n'écrit pas : un « 12 Mo » calculé au doigt mouillé.

Sur un navigateur sans Cache Storage, la ligne disparaît plutôt que d'afficher
zéro.

## Tests

| Cible | Nature |
|---|---|
| `monEspace.mapper.ts` | unitaire pur, en TDD — champs présents, champs absents, échelons vides, **aucun champ personnel ne traverse** |
| `useProfilAgriculteur` | `renderHook`, sur le modèle de `useCompteNouveau.test.ts` — succès, échec, 404, absence d'uid |
| Cache de tuiles | unitaire avec un faux `caches` — comptage, suppression, absence d'API |
| `FarmersController` | spec Jest — `me` n'est pas capturé par `:id`, `FARMER` autorisé, autres rôles refusés |
| `notification-settings` | spec Jest — fusion sans écrasement des autres clés, matérialisation quand le champ est absent |

## Ordre de déploiement

L'API d'abord, l'app ensuite : un front qui appelle une route absente affiche le
repli (nom seul), ce qui est dégradé mais correct. L'inverse — une route ouverte
sans consommateur — est sans effet.

## Ce que ce chantier ne fait pas

- Le crédit, le score et la place de marché restent en maquette derrière leurs
  étiquettes « Bientôt ». Les brancher suppose que le scoring tourne réellement
  pour les agriculteurs de production, ce qui n'est pas acquis.
- La fiche reste en lecture seule. Le bandeau qui le dit déjà — « Votre
  technicien est le seul à pouvoir la modifier » — reste vrai.
- Aucune donnée de profil n'est mise en cache hors ligne.
