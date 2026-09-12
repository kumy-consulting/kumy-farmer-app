# Spec — Page Accueil : tableau de bord agriculteur

**Date :** 2026-07-23
**Statut :** Design validé
**Repo :** `kumy-farmer-app` (front uniquement)

## Contexte

La page Accueil (`/`, `features/Home/HomePage.tsx`) est aujourd'hui un placeholder. On la transforme en **tableau de bord** montrant à l'agriculteur, en un coup d'œil : la météo du jour, les **alertes sur ses domaines**, ses **activités planifiées** et une **vue d'ensemble** de ses domaines.

Aucun endpoint agriculteur n'existe encore (Dexie ne contient que `authPrefs`). Le tableau de bord est donc **design-first** : données maquettées réalistes (contexte Guinée) derrière des interfaces TS propres, exposées par un hook `useDashboard`. Brancher la vraie API plus tard = modifier l'intérieur du hook, sans toucher aux composants.

## Décisions validées

| Sujet | Décision |
|---|---|
| Données | Mock typé, prêt à brancher (hook `useDashboard`) |
| Sections | Alertes domaines · Activités planifiées · Météo du jour · Vue d'ensemble |
| Haut d'écran | Hero **salutation + météo** |
| Parti pris | Fil priorisé aéré : gros pictos, sévérités colorées, texte court FR |

## Architecture

```
features/Home/
  dashboard.types.ts     — contrat data (interfaces)
  dashboard.mock.ts      — données maquettées réalistes
  useDashboard.ts        — hook { data, isLoading } (mock + court délai simulé)
  formatRelative.ts      — « il y a 2 h », « dans 3 j » (dayjs FR)
  components/
    DashboardHeader.tsx  — hero salutation + météo (prénom via authStore)
    ForecastStrip.tsx    — prévisions 5 jours (scroll horizontal)
    DomainsOverview.tsx  — 4 tuiles stats
    AlertsSection.tsx / AlertCard.tsx
    ActivitiesSection.tsx / ActivityItem.tsx
    DashboardSkeleton.tsx — squelettes de chargement
  HomePage.tsx           — composition (scroll, safe-area, espace dock)
```

Prénom : dérivé de `useAuthStore().user?.displayName` (premier mot), repli mock si absent.

## Modèle de données (`dashboard.types.ts`)

```ts
export type AlertSeverity = 'critical' | 'warning' | 'info';
export type AlertType = 'drought' | 'frost' | 'disease' | 'sensor_offline' | 'soil_moisture' | 'rain';
export type ActivityType = 'irrigation' | 'treatment' | 'sowing' | 'harvest' | 'inspection';
export type ActivityStatus = 'todo' | 'in_progress' | 'done';
export type WeatherCondition = 'sunny' | 'cloudy' | 'rain' | 'storm';
export type DomainsHealth = 'good' | 'attention' | 'critical';

export interface WeatherNow { tempC: number; condition: WeatherCondition; rainProbability: number; windKmh: number; location: string; }
export interface ForecastDay { label: string; condition: WeatherCondition; tempC: number; rainProbability: number; }
export interface DomainAlert { id: string; domainName: string; severity: AlertSeverity; type: AlertType; message: string; createdAt: string; /* ISO */ }
export interface PlannedActivity { id: string; title: string; domainName: string; type: ActivityType; scheduledAt: string; /* ISO */ status: ActivityStatus; }
export interface DomainsOverview { domains: number; parcels: number; areaHa: number; health: DomainsHealth; }

export interface FarmerDashboard {
  weather: WeatherNow;
  forecast: ForecastDay[];
  alerts: DomainAlert[];
  activities: PlannedActivity[];
  overview: DomainsOverview;
}
```

`useDashboard(): { data: FarmerDashboard | null; isLoading: boolean }` — `isLoading` vrai ~450 ms (skeletons) puis expose le mock.

## Composition de l'écran (haut → bas)

1. **Hero** (`DashboardHeader`) — panneau teal dégradé, coins bas arrondis, halos + filigrane pousse, safe-area haut. « Bonjour, {Prénom} 👋 » + date FR. Météo : grande temp, picto condition, « Ensoleillé · pluie 10% · vent 12 km/h », lieu.
2. **Prévisions** (`ForecastStrip`) — carte en léger chevauchement sous le hero, scroll horizontal : jour · picto · temp · %pluie.
3. **Vue d'ensemble** (`DomainsOverview`) — 4 tuiles : Domaines · Parcelles · Surface (ha) · Santé (pastille good/attention/critical).
4. **Alertes** (`AlertsSection`) — titre + compteur. `AlertCard` : liseré sévérité (critical=error, warning=warning, info=teal), picto par type, domaine, message court, temps relatif, chevron. État vide amical.
5. **Activités** (`ActivitiesSection`) — titre « Aujourd'hui / À venir » + « Voir tout ». `ActivityItem` : puce heure/date, picto par type, titre, domaine, pastille statut. État vide amical.
6. Espace bas pour le dock (déjà géré par `AppLayout`).

## Couleurs

Sévérité/statut mappés sur les tokens `theme/colors` : critical → `error[40/50]`, warning → `warning[50]`, info/teal → `primary[50]`, santé good → primary, attention → warning, critical → error. Statut activité : todo (neutre), in_progress (teal), done (vert atténué).

## États & interactions

- **Chargement** : `DashboardSkeleton` (blocs pulsés) le temps d'`isLoading`.
- **Vide** : message + picto par section (aucune alerte / aucune activité).
- **Erreur** : non applicable au mock (le hook ne rejette pas) ; prévu si branchement API ultérieur.
- Cartes tappables → `navigate('/domaines')` en attendant les écrans détail ; liens « Voir tout » → `/domaines`.
- **Entrées en cascade** (fade-up échelonné), `prefers-reduced-motion`-safe.

## Tests (Vitest + Testing Library)

- `useDashboard` : expose le mock après chargement ; `isLoading` transite.
- `formatRelative` : « il y a 2 h », « dans 3 j », « à l'instant ».
- `AlertCard` : rend domaine/message, applique la couleur de sévérité (via role/testid).
- `HomePage` : après chargement, affiche la salutation, ≥1 alerte, ≥1 activité, les tuiles.
- État vide : alertes/activités vides → messages vides rendus.

## Hors périmètre (YAGNI)

Vraie API / temps réel, détail d'alerte & d'activité, création/édition d'activité, pull-to-refresh, notifications push, filtres. Interfaces prêtes pour un branchement ultérieur.
