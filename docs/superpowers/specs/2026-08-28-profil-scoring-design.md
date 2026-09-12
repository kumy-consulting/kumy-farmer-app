# Spec — Inviter l'agriculteur à compléter son profil

**Date :** 2026-08-28
**Statut :** Design validé
**Dépôts :** `kumy-farmer-app` (modale, questionnaire) **et** `agripilot-backoffice-api` (route d'écriture)

## Contexte

Un agriculteur qui s'inscrit seul arrive avec le strict minimum : nom, prénom,
date de naissance, trois échelons d'adresse et un code confidentiel. Tant
qu'aucun technicien n'a tracé ses parcelles, l'app lui montre l'écran d'attente —
et son dossier reste aussi vide que le jour de son inscription.

Ce chantier lui propose, cinq secondes après son arrivée sur l'accueil, de
répondre à une douzaine de questions. Elles servent deux choses : l'accompagner
(le technicien sait qui il visite avant de partir) et alimenter son AgriScore.

## Ce que le moteur de score lit vraiment

Vérifié dans `agripilot-data-ingestion/functions/src/scoring/pillars/`. C'est ce
qui décide du contenu du questionnaire, et de ce qu'on a le droit de promettre.

| Pilier | Poids phase 1 | Ce que le moteur lit | Le questionnaire peut-il le nourrir ? |
|---|---|---|---|
| Agronomique | 0.30 | NDVI Sentinel-2 des parcelles | Non — exige un domaine tracé |
| Risque climatique | 0.25 | Capteurs IoT, NASA FIRMS | Non — exige un kit ou une position |
| Financier | 0.15 | `credit_history/{farmerId}` | Non — 500 neutre sans historique |
| Comportemental | 0.15 | `consultations.type == "training"` | Non — compte les formations **suivies via la plateforme**, pas les déclarées |
| **Social** | **0.10** | `farmers.cooperativeMembership` (0.40), `farmers.farmingExperience` (0.30), `farmers.educationLevel` (0.30) | **Oui, en entier** |
| Marché | 0.05 | `farms[].crops`, `farms[].landTenure`, distance marché | Non — `market.ts` lit les **fermes**, pas le dossier agriculteur |

Un seul pilier bouge donc à l'envoi du questionnaire : le Social, et ses trois
composantes sont couvertes. Le reste se prépare pour le jour du traçage.

Deux conséquences, tenues dans toute la copie de l'écran :

- On ne promet pas « améliorez votre score ». La phrase retenue est : **« Ces
  réponses nous aident à mieux vous accompagner, et comptent dans votre
  AgriScore. »** Sans chiffre, sans promesse de note.
- `educationLevel` pèse 30 % du pilier Social et **ne figurait pas dans la
  maquette**. Il est ajouté. Idem pour le statut foncier, 30 % du pilier Marché,
  qui ne comptera qu'une fois le moteur modifié (voir « Suites à donner »).

## Ce qui bloque aujourd'hui

**Aucune route ne permet à un agriculteur de modifier son propre dossier.**

| Route | Écrit quoi | Ouverte au FARMER ? |
|---|---|---|
| `PUT /farmers/:id` | tout le dossier, partenaire et abonnement compris | ❌ `SUPER_ADMIN`, `PARTNER_ADMIN`, `PARTNER_MANAGER` |
| `PATCH /farmers/me/notification-settings` | le seul booléen SMS | ✅ |

Ouvrir `PUT /farmers/:id` au FARMER est exclu : il porte `partnerId`,
`assignedEngineerId`, `subscription`, `tags`. Un téléphone volé pourrait
réaffecter son porteur à un autre partenaire.

`GET /farmers/me` (`FarmerSelfDto`) ne renvoie pas non plus de quoi préremplir le
formulaire : l'adresse n'y porte que des **noms** d'échelons, quand les listes
déroulantes ont besoin des **identifiants**.

## Périmètre

| Zone | Décision |
|---|---|
| Modale d'invitation + règle de déclenchement | **Dans le périmètre** |
| Questionnaire en 3 étapes, route plein écran | **Dans le périmètre** |
| Entrée permanente dans « Mes informations » | **Dans le périmètre** |
| `PATCH /farmers/me/profil` + extension de `FarmerSelfDto` | **Dans le périmètre** |
| Modification du moteur (`market.ts`) pour lire le foncier déclaré | **Hors périmètre** — lot séparé, voir « Suites à donner » |
| File d'attente hors ligne des réponses | **Hors périmètre** — v1 exige le réseau au moment de l'envoi |
| Branchement de `MonScorePage` sur le vrai score | **Hors périmètre** — reste sur `monEspace.demo` |

## Déclenchement

La règle vit dans `AppLayout` : c'est le seul point commun aux deux branches de
l'app — l'écran d'attente et l'app complète. Un agriculteur peut avoir un
technicien assigné sans domaine tracé ; il voit alors le tableau de bord, et doit
recevoir la même invitation.

Cinq conditions cumulées :

1. session authentifiée ;
2. `hasFarms === false` (`GET /farmers/:id/account-state`) ;
3. `profileSurvey.completedAt` absent ;
4. l'invitation n'a pas déjà été proposée **dans cette session** ;
5. cinq secondes se sont écoulées depuis l'arrivée sur l'accueil.

La minuterie est armée au montage et **annulée au démontage** : un agriculteur
qui ouvre une parcelle dans les cinq secondes ne se fait pas interrompre par une
modale qui remonte d'un écran qu'il a quitté.

Le drapeau « déjà proposée » vit en mémoire (petit store Zustand, à l'image de
`authStore`), pas en stockage persistant. Conséquence voulue : fermer la modale
la tait jusqu'à la prochaine ouverture de l'app ; relancer l'app la repropose,
tant que le questionnaire n'est pas terminé et qu'aucun domaine n'existe.

`useCompteNouveau` expose aujourd'hui `estNouveau = !hasFarms && !hasEngineer`.
Il exposera aussi `aDesDomaines`, dont la modale a besoin seule.

## Le questionnaire

Trois étapes, le rail de progression de la maquette, reprise là où l'agriculteur
s'est arrêté. Les champs marqués \* bloquent le passage à l'étape suivante.

### Étape 1 — Vous

| Question | Champ écrit | Forme | Effet |
|---|---|---|---|
| Nom complet \* | `firstName`, `lastName` | texte, prérempli | Dossier |
| Date de naissance \* | `dateOfBirth` | date, préremplie | Dossier |
| Genre \* | `gender` | deux choix | Dossier |
| Niveau d'éducation \* | `educationLevel` | liste : aucun, primaire, collège, lycée, professionnel, université | **Social 0.30** |
| Situation matrimoniale | `maritalStatus` | liste, facultatif | Accompagnement |
| Nombre d'enfants | `childrenCount` | nombre, facultatif | Accompagnement |

### Étape 2 — Votre parcours

| Question | Champ écrit | Forme | Effet |
|---|---|---|---|
| Depuis combien de temps cultivez-vous ? \* | `farmingExperience` | cinq tranches | **Social 0.30** |
| Êtes-vous membre d'une coopérative ? \* | `cooperative` | oui/non + nom + année d'adhésion | **Social 0.40** |
| Avez-vous un compte au Crédit Rural ? \* | `hasCreditRuralAccount` | oui/non | Prépare le financier |
| Formations suivies | `declaredTrainings` | texte libre, facultatif | Accompagnement |
| Équipements agricoles | `declaredEquipment` | texte libre, facultatif | Accompagnement |

Les tranches d'expérience épousent les paliers du moteur plutôt que de demander
un nombre libre qu'on arrondirait ensuite. La valeur envoyée est la borne basse
de la tranche, celle que `scoreExperience` teste :

| Tranche affichée | `farmingExperience` envoyé | Score social obtenu |
|---|---|---|
| Moins de 2 ans | 1 | 300 |
| 2 à 4 ans | 2 | 500 |
| 5 à 9 ans | 5 | 700 |
| 10 à 14 ans | 10 | 850 |
| 15 ans et plus | 15 | 1000 |

L'ancienneté en coopérative suit la même logique : le moteur compare l'ancienneté
à 1 an et 3 ans, l'écran demande donc l'année d'adhésion.

### Étape 3 — Votre exploitation

| Question | Champ écrit | Forme | Effet |
|---|---|---|---|
| Région, préfecture, sous-préfecture \* | `address` | trois listes liées | Dossier |
| Hectares exploités (environ) \* | `cultivatedHectares` | nombre | Prépare |
| Vos cultures \* | `primaryCrops` | choix multiples + ajout libre | Prépare le marché |
| Vos terres vous appartiennent-elles ? \* | `declaredLandTenure` | propriété, héritage, location, communautaire, autre | Prépare le marché |

Les trois listes d'adresse réutilisent le référentiel déjà appelé à l'inscription
(`/regions`, `/prefectures?regionId=`, `/sous-prefectures?prefectureId=`).

## Contrat d'API

### `PATCH /farmers/me/profil`

`@Roles(UserRole.FARMER)`, résolu depuis l'uid du jeton — aucun identifiant dans
l'URL, donc rien à usurper. Déclaré **avant** `@Get(':id')`, comme les autres
routes `me`.

```jsonc
{
  "step": 2,                       // 1 | 2 | 3 — l'étape validée
  "farmingExperience": 5,
  "cooperative": { "isMember": true, "name": "Coopérative de Tanènè", "joinDate": "2019-01-01" },
  "hasCreditRuralAccount": false
}
```

Le corps ne porte que les champs de l'étape envoyée. Un DTO en liste blanche
(`whitelist` + `forbidNonWhitelisted`) rejette tout le reste : `partnerId`,
`assignedEngineerId`, `subscription`, `tags` n'ont aucun chemin vers ce dossier.

Bornes de validation : `cultivatedHectares` entre 0 et 10 000, `childrenCount`
entre 0 et 30, `primaryCrops` au plus 15 entrées de 40 caractères,
`declaredTrainings` et `declaredEquipment` au plus 500 caractères. Les énumérés
sont validés (`educationLevel`, `gender`, `declaredLandTenure`, `maritalStatus`).

**Une écriture par étape validée**, pas une seule à la fin. Sur un réseau
guinéen, perdre douze réponses parce que la connexion tombe à l'étape 3 est le
scénario à éviter. Le serveur fusionne (`set` avec `merge`) et met à jour le
marqueur :

```jsonc
"profileSurvey": { "step": 2, "updatedAt": "…", "completedAt": null }
```

`step` ne régresse jamais (`max(actuel, reçu)`), et `completedAt` se pose à
l'envoi de l'étape 3. Le déduire de la présence des champs serait faux : « pas de
coopérative » est une réponse valide qui laisse `cooperative.name`
vide.

Réponses : **200** avec le marqueur à jour, **400** sur un champ hors liste ou
hors bornes, **404** si l'uid n'a pas de fiche agriculteur.

**La route écrit dans deux documents.** `firstName`, `lastName`, `dateOfBirth` et
`gender` vivent sur `users/{uid}` — pas sur `farmers`. `FarmersService.update()`
détourne déjà `notificationSettings` de la même façon, et `enrichWithUserInfo()`
recolle les deux à la lecture. La route suit ce partage plutôt que de dupliquer
l'identité dans le dossier agriculteur : deux copies d'un nom divergent le jour
où l'une des deux est corrigée.

### Extension de `FarmerSelfDto`

`GET /farmers/me` gagne `profileSurvey`, les identifiants d'échelons dans
`address`, et les champs du questionnaire nécessaires au préremplissage.
`FarmerSelfDto` porte une règle — « ce type ne porte que ce que l'écran rend » —
et l'écran rend désormais ces champs ; la règle tient. Restent exclus
`nationalId`, `partnerId`, `engineerIds`, `subscription`, `mobileMoneyAccounts`.

### Champs ajoutés au document `farmers`

`maritalStatus`, `childrenCount`, `hasCreditRuralAccount`, `declaredTrainings`,
`declaredEquipment`, `cultivatedHectares`, `declaredLandTenure`, `profileSurvey`.
Les autres existent déjà et sont déjà lus par le moteur ou le backoffice.

Le préfixe `declared` n'est pas décoratif : il dit que la valeur vient de
l'agriculteur, non d'un constat de terrain. Le jour où un technicien trace la
parcelle, `farms.landTenure` fait foi, et la déclaration reste une trace de ce
que l'agriculteur croyait — les deux ne doivent pas se confondre dans un dossier
de crédit.

## Écrans

**La modale.** Première de l'app, donc premier `Dialog` : un titre, la phrase
validée, deux gestes — « Compléter mon profil » et « Plus tard ». Fermable au
scrim et à Échap, focus piégé, `prefers-reduced-motion` respecté. Elle ne dit ni
« obligatoire », ni le nombre de questions restantes : c'est une invitation.

**La route `/mon-profil/completer`**, plein écran, hors `AppLayout` — même
raison que `/bonnes-pratiques` : la coquille court-circuite l'`Outlet` pour un
compte sans domaine, et c'est précisément à ces comptes que le questionnaire
s'adresse. Le rail à trois étapes de la maquette, « Précédent » / « Suivant »,
« Enregistrer » à la dernière étape, et la mention « Vos informations sont
sécurisées et confidentielles » en pied.

**L'entrée permanente vit dans « Mes informations »**, pas dans le sommaire de
« Mon espace ». Raison : `MonEspacePage` est un enfant d'`AppLayout`, donc
inatteignable pour un compte sans domaine — exactement le compte visé. « Mes
informations » figure, elle, dans la liste des portes ouvertes à ces comptes, et
l'écran d'attente y mène déjà par son jeton de profil. Un agriculteur établi y
accède par le même chemin, depuis « Mon espace ».

L'entrée affiche l'avancement (« Profil complété à 2/3 ») et ouvre la même route.
Elle reste après complétion, pour corriger.

**À la fin** : un écran de confirmation sobre, puis retour à l'accueil.

## Cas limites

| Situation | Comportement |
|---|---|
| Envoi d'étape en échec (réseau) | Message sous le bouton, réponses gardées en l'état, étape non marquée ; le bouton redevient actif |
| Hors ligne à l'ouverture du questionnaire | Le formulaire s'ouvre, l'échec ne survient qu'à l'envoi — v1 sans file d'attente |
| Agriculteur qui reprend | Le formulaire s'ouvre à `profileSurvey.step + 1`, les étapes passées sont préremplies |
| Un domaine est tracé entre-temps | La modale ne se propose plus ; l'entrée de « Mes informations » reste |
| Fiche agriculteur absente (404) | La modale ne se propose pas — rien à compléter |
| Compte déjà complet | Aucune invitation, l'entrée affiche « Profil complété » |

## Tests

**API.** Le scope du PATCH (un champ hors liste est rejeté ; `partnerId` en
particulier), l'écriture partielle qui n'efface pas les champs absents, le
marqueur qui ne régresse pas, `completedAt` posé à l'étape 3 et pas avant, le 404
sans fiche, et les bornes de validation.

**App.** La règle de déclenchement dans ses cinq conditions, y compris la
minuterie annulée au démontage et le drapeau de session ; la validation par
étape ; la reprise à la bonne étape ; le préremplissage ; l'échec d'envoi qui ne
fait pas avancer l'étape ; le rendu des trois étapes ; l'entrée de « Mes informations »
dans ses trois états (jamais commencé, en cours, complété).

## Suites à donner

**Faire compter le foncier et les cultures déclarés.** `market.ts` lit
aujourd'hui les fermes ; un agriculteur sans domaine y reste aux valeurs par
défaut (400 pour le foncier, 300 pour la diversification). Le lot consiste à
retomber sur `declaredLandTenure` et `primaryCrops` du dossier quand
`farms.length === 0`, avec une `dataCompleteness` qui dit que la source est
déclarative. Décidé hors de cette spec : on livre d'abord la collecte, et on
tranchera au vu des réponses reçues.

**Compte Crédit Rural.** `hasCreditRuralAccount` est collecté mais n'entre dans
aucune formule. Il servira au rapprochement avec le référentiel CRD, déjà
raccordé côté API (`credit-rural`).
