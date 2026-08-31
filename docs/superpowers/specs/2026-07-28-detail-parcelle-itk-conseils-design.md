# Détail parcelle — onglets ITK & Conseils (kumy-farmer-app)

> Statut : design validé (décisions de périmètre tranchées avec l'utilisateur le 2026-07-28).
> Référence visuelle : écran `ParcelDetail` de la PWA ingénieur (`agripilot-pwa`).

## 1. Objectif

Offrir à l'agriculteur un écran de détail de **parcelle** accessible depuis le détail d'un
domaine, calqué sur l'expérience `ParcelDetail` de la PWA ingénieur, avec deux onglets :
**ITK** (plan cultural, lecture seule) et **Conseils** (synthèse santé + risques/recommandations
agronomiques + évolution NDVI).

## 2. Contrainte structurante — rôle FARMER

Le token de l'utilisateur porte le rôle `FARMER`. Les endpoints backend sont gardés par
`@Roles(...)`. Cartographie établie sur `agripilot-backoffice-api` :

**Autorisés FARMER ✅**
- `GET /farms/:farmId/parcels/:parcelId` — méta parcelle (`ParcelResponseDto`)
- `GET /parcels/:parcelId` — méta parcelle (variante non-scopée ferme)
- `GET /parcels/:parcelId/itk-tasks?stage=all` — stades + tâches + `risks[]` (`ParcelItkTasksDto`)
- `POST /parcels/:parcelId/itk-tasks/:taskId/log` — journaliser une tâche (hors périmètre v1)
- `GET /parcels/:parcelId/indicators?months=N` — historique NDVI (`ParcelIndicatorsHistoryResponseDto`)
- `GET /parcels/:parcelId/yield-estimate`, `/climate-context`, `/soil-context`, `/anomaly-clusters` (non utilisés en v1)

**Interdits FARMER ❌ (403)** — donc jamais appelés :
- `GET /parcels/:parcelId/oad-snapshot` (Verdict OAD)
- `GET /parcels/:parcelId/recommendations` (Recos OAD prioritaires)
- `GET /parcels/:parcelId/alerts` (Alertes OAD parcelle)
- `GET /parcels/:parcelId/forecast`, `/fertilizer-window`

Conséquence : l'onglet **Conseils** ne reprend PAS le `AnalysisPanel` OAD de la PWA. On
reconstruit un conseil équivalent à partir de sources autorisées FARMER, principalement les
**risques agronomiques par stade** (`stage.risks[]`) déjà présents dans la réponse `itk-tasks`.

## 3. Décisions de périmètre (validées)

| Sujet | Décision |
|---|---|
| Référence visuelle | PWA ingénieur `ParcelDetail` + style écran domaine du farmer-app |
| Onglets | **Vue d'ensemble + ITK + Conseils** (Vue d'ensemble par défaut) |
| Onglet Vue d'ensemble | Infos générales (culture, variété, semis, récolte prévue, surface) + **estimation de rendement** (`/yield-estimate`, autorisé FARMER) |
| Onglet ITK | **Lecture seule** (pas de journalisation de tâche en v1) |
| Onglet Conseils | **Essentiel** : Synthèse santé + Risques/recommandations (ITK) + Évolution NDVI |
| Backend | **Aucune modification** (endpoints FARMER existants uniquement) |

> Note : l'onglet **Vue d'ensemble** (avec estimation de rendement) a été ajouté après la v1
> initiale à la demande de l'utilisateur (2026-07-29). Il consomme `GET /parcels/:id/yield-estimate`
> (autorisé FARMER, 404 géré gracieusement) et les champs `currentCrop` de la parcelle.

Hors périmètre : journalisation de tâches (POST log + dialogs + sync Dexie), sections
Climat/Sol/Zones-à-inspecter, Verdict/alertes/recos OAD, fenêtre d'épandage.

## 4. Emplacement & navigation

Nouveau dossier feature `src/features/Parcelle/`. Il **réutilise** par import les helpers de
`src/features/Domaines/` (`components/detailVisuals`, `components/cropIcon`) et les composants
partagés (`shared/components/DraggableBottomSheet`, `shared/components/BottomNav`).

- **Route** : `/domaines/:id/parcelles/:parcelId` (imbriquée sous le domaine ; le bouton retour
  ramène à `/domaines/:id`). Déclarée dans `src/shared/routes/index.tsx` sous `AppLayout`.
- **Entrée** : dans `DomaineDetailPage`, câbler `onClick` de `<ParcelCard>` (aujourd'hui absent)
  → `navigate(`/domaines/${farmId}/parcelles/${parcel.parcelId}`)`.

## 5. Types (`src/features/Parcelle/parcelle.types.ts`)

Miroir TypeScript des DTO backend consommés (dates en `string` ISO). Types clés :

```ts
// Réponse GET /parcels/:id/itk-tasks?stage=all
interface ItkParcelTasks {
  parcelId: string;
  hasActiveCampaign: boolean;
  cropType?: string;
  variety?: string;
  plantingDate?: string;
  daysAfterSowing: number;
  currentStage: { stageCode: string; stageName: string; order: number } | null;
  stages: ItkStage[];
  itkValidationStatus: 'web_provisional' | 'irag_validated';
}
interface ItkStage {
  stageCode: string; stageName: string; order: number;
  expectedStart: string; expectedEnd: string;
  status: 'upcoming' | 'inProgress' | 'completed' | 'skipped' | 'delayed';
  dayStart: number; dayEnd: number;
  description: string;
  critical: boolean;
  tasks: { mandatory: ItkTask[]; recommended: ItkTask[] };
  risks: StageRisk[];
}
interface ItkTask {
  taskId: string;
  type: string;
  title: string;
  description: string;
  timing: string;                 // ex. "J+15 à J+20"
  windowStart: string | null; windowEnd: string | null;
  state: 'completed' | 'pending' | 'upcoming' | 'overdue' | 'manual';
  inputs: { product: string; dosePerHa: number; unit: string; optional?: boolean }[];
}
interface StageRisk {
  type: 'hydric' | 'parasitic' | 'nutritional' | 'climatic' | 'disease' | string;
  name: string; scientificName?: string;
  trigger: string;                // « Pourquoi »
  severity: 'low' | 'medium' | 'high' | string;
  recommendation: string;         // « Que faire »
}

// Réponse GET /parcels/:id/indicators
interface IndicatorPoint { date: string; ndvi?: number | null; /* evi, ndwi... optionnels */ }
```

Le type `Parcel` existant (`Domaines/domaines.types.ts`) est réutilisé pour la méta parcelle.

## 6. API (`src/features/Parcelle/parcelle.api.ts`)

Un fichier `*.api.ts` par feature (convention Kumy), consommant `@/shared/api/client`.

```ts
parcelleApi = {
  parcel(farmId, parcelId): Promise<Parcel>            // GET /farms/:farmId/parcels/:parcelId
  itkTasks(parcelId): Promise<ItkParcelTasks>          // GET /parcels/:id/itk-tasks?stage=all
  indicators(parcelId, months=6): Promise<IndicatorPoint[]>  // GET /parcels/:id/indicators?months
}
```

## 7. Hook (`useParcelDetail(farmId, parcelId)`)

Même patron que `useDomaineDetail` : `Promise.allSettled`, dégradation gracieuse, `reload`.

- Appels : `parcel(farmId, parcelId)`, `itkTasks(parcelId)`, `indicators(parcelId, 6)`.
- Si `parcel` échoue **et** `itkTasks` échoue → erreur « Parcelle introuvable ».
- Expose un `ParcelDetail` prêt à afficher :
  - en-tête (nom parcelle, fil d'Ariane domaine), polygone (coords parcelle), `tileUrl`/`tileBounds` NDVI (depuis `lastIndicators`)
  - KPI : `ndvi`, `area`, stade courant (nom + `J+DAS`), âge (`daysAfterSowing`)
  - `itk` : `ItkParcelTasks | null`
  - `indicators` : `IndicatorPoint[]`
  - `synthese` : verdict client-side (statut NDVI + pire sévérité risques stade courant) via `healthVerdict`.

## 8. Coquille de l'écran (`ParcelDetailPage.tsx`)

Calquée sur `DomaineDetailPage` :

- `FullScreen` (fond dégradé) + **carte héro** `ParcelMapHero` (satellite + polygone parcelle +
  overlay NDVI `ImageOverlay` si `tileUrl`). Factorisée depuis `DomaineDetailMap`.
- `HeaderOverlay` (retour → `/domaines/:id`, fil d'Ariane domaine, nom parcelle, scrim dégradé).
- `DraggableBottomSheet` (snaps `[120, '45vh', '85vh']`) contenant :
  1. **Bande KPI** `ParcelKpiRow` : NDVI (valeur+libellé couleur) · Surface (ha) · Stade actuel · Âge (J+DAS).
  2. **Barre d'onglets** pilule (même style que `DomaineDetailPage`) : `['ITK', 'Conseils']`.
  3. **Contenu** de l'onglet actif (animation `tabIn`).
- États chargement / erreur / retry : repris de `DomaineDetailPage` (`FullScreen` + `HeaderOverlay` squelette).

## 9. Onglet ITK (lecture seule) — `components/ItkTab/`

- `ItkStageTimeline` : frise horizontale des `stages`, statut coloré
  (`upcoming`/`inProgress`/`completed`/`skipped`/`delayed`), stade courant mis en avant, scroll
  horizontal, tap = sélection (état local `selectedStageCode`, défaut = `currentStage`).
- `ItkStageDetail` : détail du stade sélectionné → nom, plage `J+dayStart → J+dayEnd`, dates
  attendues, description, puis **liste des tâches** groupées *Obligatoires / Recommandées*.
  - `ItkTaskRow` : titre, `timing`, badge d'état (`TaskStateBadge`-like), intrants (`product ·
    dosePerHa unit`) si présents. **Aucune action** (pas de bouton « fait »).
- Vide : `hasActiveCampaign === false` → carte « Plan ITK en préparation » (icône + message),
  inspirée de `ItkPreparingEmptyState`.

## 10. Onglet Conseils (Essentiel) — `components/ConseilsTab/`

- **§ Synthèse santé** (`HealthSynthesis`) : carte verdict côté client — niveau + message court +
  fraîcheur (date NDVI). Dérivé de `ndviStatus`/`ndvi` + pire sévérité des `risks` du stade
  courant, via `healthVerdict`/`ndviLabel`/`ndviColor` (`Domaines/detailVisuals`).
- **§ Risques & recommandations** (`RiskAdviceList`) : cartes issues de `stage.risks[]` du stade
  courant **et des stades à venir** (`order >= currentStage.order`). Chaque carte : puce sévérité
  (low/medium/high → couleurs `ALERT_SEV`), nom du risque (+ `scientificName` en incise),
  **« Pourquoi »** = `trigger`, **« Que faire »** = `recommendation`, badge du stade concerné.
  Vide → « Aucun risque signalé à ce stade ».
- **§ Évolution végétation** (`NdviTrend`) : mini-courbe NDVI **SVG inline légère** depuis
  `indicators` (6 mois), axe temps implicite, point courant marqué. Pas de dépendance graphique
  lourde ; version très allégée du `NdviCurveBlock` PWA. Vide → « Pas encore de mesure NDVI ».

## 11. Réutilisation

- `shared/components/DraggableBottomSheet`, `shared/components/BottomNav` (`NAV_HEIGHT`).
- `Domaines/components/detailVisuals` (`ndviColor`, `ndviLabel`, `healthVerdict`, `ALERT_SEV`,
  `severityIcon`, `formatAge`), `Domaines/components/cropIcon` (`getCropIcon`).
- Logique Leaflet + overlay NDVI factorisée depuis `Domaines/components/DomaineDetailMap`.

## 12. Tests (`ParcelDetailPage.test.tsx`)

Vitest + Testing Library, `parcelle.api` mocké (patron des 67 tests existants) :
1. rend le nom de la parcelle et les 2 onglets ;
2. onglet ITK : rend le stade courant et une tâche ;
3. onglet Conseils : rend une carte risque (`trigger` + `recommendation`) et un libellé NDVI ;
4. état vide ITK (`hasActiveCampaign=false`) → « Plan ITK en préparation » ;
5. erreur → écran retry.

## 13. Portée des fichiers (récapitulatif)

```
src/features/Parcelle/
  ParcelDetailPage.tsx
  ParcelDetailPage.test.tsx
  parcelle.api.ts
  parcelle.types.ts
  useParcelDetail.ts
  components/
    ParcelMapHero.tsx
    ParcelKpiRow.tsx
    ItkTab/ ItkStageTimeline.tsx · ItkStageDetail.tsx · ItkTaskRow.tsx
    ConseilsTab/ HealthSynthesis.tsx · RiskAdviceList.tsx · NdviTrend.tsx
```
Modifs annexes : `src/shared/routes/index.tsx` (route), `DomaineDetailPage.tsx` (onClick ParcelCard).

## 14. Critères d'acceptation

- Depuis le détail d'un domaine, taper une parcelle ouvre `/domaines/:id/parcelles/:parcelId`.
- La carte héro montre le polygone de la parcelle + NDVI si disponible.
- Onglet ITK : frise des stades navigable + détail stade + tâches (lecture seule).
- Onglet Conseils : synthèse santé, cartes risques/recommandations, courbe NDVI.
- Aucun appel aux endpoints interdits FARMER ; aucun 403 en console ; dégradation gracieuse.
- `npm run lint` propre, `tsc` propre, tests verts, build de prod OK.
