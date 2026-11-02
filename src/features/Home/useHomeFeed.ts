import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import dayjs from 'dayjs';

import { prettyCrop } from '@/features/Domaines/components/domainesVisuals';
import { domainesApi } from '@/features/Domaines/domaines.api';
import type { FarmerAlert, FarmerVisit, Parcel } from '@/features/Domaines/domaines.types';
import { fieldTasksApi } from '@/features/FieldTasks/fieldTasks.api';
import type { FieldTask } from '@/features/FieldTasks/fieldTasks.types';
import { parcelleApi } from '@/features/Parcelle/parcelle.api';
import { useAuthStore } from '@/shared/stores/authStore';

import { buildDashboard } from './home.dashboard';
import type { HomeDashboard } from './home.dashboard.types';
import { demoAlerts, demoItkDrafts, demoNames, demoRecap, demoTasks, demoWeather, isDemoMode } from './home.demo';
import type { FeedItemDraft } from './home.feed.types';
import {
  alertsToFeed,
  fieldTasksToFeed,
  isActiveAlert,
  itkToFeed,
  normalizeSeverity,
  visitsToFeed,
  type NameIndex,
  type ParcelItkSource,
  type UnfavourableSource,
} from './home.mappers';
import { buildSections, type HomeSections } from './home.sections';

export interface HomeRecap {
  domains: number;
  parcels: number;
  areaHa: number;
  health: 'good' | 'attention' | 'critical';
}

export interface HomeWeather {
  farmId: string;
  farmName: string;
  tempC: number | null;
  online: boolean;
  observedAt: string | null;
  /** false = aucun kit assigné sur ce domaine. */
  hasKit: boolean;
  /**
   * Renseigné uniquement sans kit : le contexte climatique satellite d'une
   * parcelle du domaine. Ce n'est jamais une mesure « en ce moment » — `avgTempC`
   * est une moyenne sur sept jours — et la puce doit l'annoncer comme telle.
   */
  climate: { avgTempC: number | null; asOfDate: string | null } | null;
  /**
   * Ce que le kit mesure en plus de la température. Chaque valeur est
   * indépendamment absente : une station peut n'avoir ni pluviomètre ni
   * anémomètre, et une case vide vaut mieux qu'un zéro inventé.
   */
  mesures: { humidite: number | null; vent: number | null; pluie24h: number | null };
}

export interface HomeFeedState {
  sections: HomeSections;
  /** Le tableau de bord de l'accueil, dérivé des sections et des sources brutes. */
  dashboard: HomeDashboard;
  recap: HomeRecap | null;
  weather: HomeWeather | null;
  isLoading: boolean;
  isEnriching: boolean;
  error: string | null;
  actionError: string | null;
  reload: () => void;
  runTaskAction: (id: string, action: 'start' | 'complete') => Promise<void>;
  dismissActionError: () => void;
}

/** Vent au-delà duquel un traitement n'a pas de sens (dérive de pulvérisation). */
const WIND_LIMIT_KMH = 20;

/**
 * Parcelle sous suivi ITK — sinon `itk-tasks` renvoie 400/404. On filtre en
 * amont pour ne pas inonder l'accueil d'appels inutiles.
 */
const isItkActive = (parcel: Parcel): boolean =>
  Boolean(parcel.currentCrop?.itkRef) ||
  Boolean(parcel.currentStageCode) ||
  parcel.itkMaterializationStatus?.status === 'success';

/**
 * Même liste normalisée et filtrée que `alertsToFeed` — le bandeau récap ne doit
 * jamais contredire le fil (une alerte `high` active est rouge dans le fil, elle
 * doit aussi compter comme critique ici ; une alerte résolue ne doit compter nulle part).
 */
function healthOf(alerts: FarmerAlert[]): HomeRecap['health'] {
  const severities = alerts.filter(isActiveAlert).map((alert) => normalizeSeverity(alert.severity));
  if (severities.includes('critical')) return 'critical';
  if (severities.includes('warning')) return 'attention';
  return 'good';
}

/**
 * Source du fil d'exploitation de l'accueil.
 *
 * Trois vagues, avec rendu progressif : la vague 1 (consignes, alertes, totaux,
 * domaines) suffit à afficher un fil utile, les vagues 2 et 3 l'enrichissent en
 * place. Chaque source échoue seule — une cascade ITK en erreur retire les
 * tâches ITK, elle ne vide pas l'écran.
 */
export function useHomeFeed(): HomeFeedState {
  const farmerId = useAuthStore((s) => s.user?.uid);

  const [tasks, setTasks] = useState<FieldTask[]>([]);
  const [alerts, setAlerts] = useState<FarmerAlert[]>([]);
  const [itkDrafts, setItkDrafts] = useState<FeedItemDraft[]>([]);
  const [names, setNames] = useState<NameIndex>({ parcels: new Map(), farms: new Map(), crops: new Map() });
  const [recap, setRecap] = useState<HomeRecap | null>(null);
  // Instant du dernier chargement réussi : l'accueil doit pouvoir dire de quand
  // datent ses chiffres, sur des réseaux qui coupent (§19).
  const [chargeA, setChargeA] = useState<string | null>(null);
  // Prochaine visite : elle vient désormais de `/farmers/:id/visits`. Elle ne
  // pouvait pas être reconstituée depuis les consignes — une visite à venir n'en
  // a encore produit aucune.
  const [prochaineVisite, setProchaineVisite] = useState<HomeDashboard['accompagnement']['prochaineVisite']>(null);
  // Visites déjà faites, du même endpoint. Le fil les reconstituait depuis les
  // consignes portant un `visitId` : un passage sans consigne n'existait alors
  // nulle part, et l'accompagnement affichait « Aucune enregistrée » à un
  // agriculteur qui avait bien reçu son technicien.
  const [visitesFaites, setVisitesFaites] = useState<FarmerVisit[]>([]);
  const [weather, setWeather] = useState<HomeWeather | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEnriching, setIsEnriching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  // Miroir synchrone de `tasks`, lu par `runTaskAction` pour le retour arrière :
  // capturer l'instantané précédent depuis un `setState(fn)` n'est pas fiable
  // (React peut ne pas encore avoir exécuté l'updater au moment du `catch`).
  const tasksRef = useRef(tasks);
  tasksRef.current = tasks;

  const reload = useCallback(() => setReloadKey((key) => key + 1), []);

  useEffect(() => {
    // Mode démo (`?demo=1`, dev uniquement) : on remplace le réseau, pas la
    // logique — mappers, sections et actions optimistes tournent normalement.
    if (isDemoMode()) {
      setTasks(demoTasks);
      setAlerts(demoAlerts);
      setItkDrafts(demoItkDrafts);
      setNames(demoNames);
      setRecap(demoRecap);
      setWeather(demoWeather);
      setChargeA(dayjs().toISOString());
      setIsLoading(false);
      setIsEnriching(false);
      return;
    }

    if (!farmerId) {
      setIsLoading(false);
      setIsEnriching(false);
      setError('Session introuvable');
      return;
    }

    let active = true;
    setIsLoading(true);
    setIsEnriching(true);
    setError(null);

    void (async () => {
      // Vague 1 — le fil devient utilisable dès ici.
      const [tasksRes, alertsRes, summaryRes, farmsRes] = await Promise.allSettled([
        fieldTasksApi.list(farmerId),
        domainesApi.alerts(farmerId),
        domainesApi.summary(farmerId),
        domainesApi.farms(farmerId),
      ]);
      if (!active) return;

      const loadedTasks = tasksRes.status === 'fulfilled' ? tasksRes.value : [];
      const loadedAlerts = alertsRes.status === 'fulfilled' ? alertsRes.value : [];
      const farms = farmsRes.status === 'fulfilled' ? farmsRes.value : [];
      const summary = summaryRes.status === 'fulfilled' ? summaryRes.value : null;

      const farmNames = new Map(farms.map((farm) => [farm.id, farm.name]));
      setTasks(loadedTasks);
      setAlerts(loadedAlerts);
      setNames({ parcels: new Map(), farms: farmNames, crops: new Map() });
      setRecap(
        summary
          ? {
              domains: summary.totalFarms,
              parcels: summary.totalParcels,
              areaHa: summary.totalArea,
              health: healthOf(loadedAlerts),
            }
          : null,
      );
      if (tasksRes.status === 'rejected' && alertsRes.status === 'rejected' && farmsRes.status === 'rejected') {
        setError('Impossible de charger votre exploitation');
      } else {
        setChargeA(dayjs().toISOString());
      }

      // Hors du `allSettled` principal : l'accompagnement n'est pas du chemin
      // critique, son échec ne doit ni retarder le fil ni le vider.
      domainesApi
        .visits(farmerId)
        .then(({ next, recent }) => {
          if (!active) return;
          setVisitesFaites(recent ?? []);
          if (!next?.scheduledFor) return;
          setProchaineVisite({
            date: next.scheduledFor,
            // Pas de nom d'emprunt : « Votre technicien » se lisait comme un
            // patronyme une fois remonté en tête de la carte d'accompagnement.
            technicien: next.technicianName ?? null,
            domaine: next.farmName ?? undefined,
            objectif: next.note ?? undefined,
          });
        })
        .catch(() => {
          // Visites indisponibles : la prochaine reste inconnue, et l'accueil le
          // dit déjà — « Pas encore fixée ».
        });
      setIsLoading(false);

      // Vague 2 — noms de parcelles et météo du kit.
      const [parcelsPerFarm, stations] = await Promise.all([
        Promise.allSettled(farms.map((farm) => domainesApi.parcels(farm.id))),
        Promise.allSettled(farms.map((farm) => domainesApi.liveStation(farm.id))),
      ]);
      if (!active) return;

      const parcelsByFarm = farms.map((farm, index) => ({
        farmId: farm.id,
        parcels: parcelsPerFarm[index].status === 'fulfilled' ? parcelsPerFarm[index].value : [],
      }));

      const parcelNames = new Map<string, string>();
      const parcelCrops = new Map<string, string>();
      for (const { parcels } of parcelsByFarm) {
        for (const parcel of parcels) {
          parcelNames.set(parcel.id, parcel.name);
          // La culture complète le périmètre d'une carte : « Domaine · Parcelle ·
          // Ananas » dit où agir, « Ananas Nord » seul laisse chercher.
          const crop = parcel.currentCrop?.cropType;
          // `prettyCrop` conserve les underscores pour rester aligné sur la PWA
          // ingénieur ; sur l'écran d'un agriculteur, « Ananas_baronne » est une clé
          // de base de données, pas un nom de culture.
          if (crop) parcelCrops.set(parcel.id, prettyCrop(crop).replace(/_/g, ' '));
        }
      }
      setNames({ parcels: parcelNames, farms: farmNames, crops: parcelCrops });

      // Domaines dont le kit mesure des conditions défavorables ici et maintenant.
      const kits = farms.map((farm, index) => {
        const result = stations[index];
        return { farm, station: result.status === 'fulfilled' ? result.value.station : null };
      });

      const unfavourable = new Map<string, UnfavourableSource>();
      for (const { farm, station } of kits) {
        // Un kit hors ligne ne mesure plus rien « en ce moment » : sa dernière lecture
        // ne doit pas continuer à peindre les fenêtres du domaine en défavorables.
        if (station?.online !== true) continue;
        // `rainRate` (mm/h) et non `rainfall` : ce dernier est le compteur
        // cumulatif brut de la station, quasi toujours > 0 — s'en servir aurait
        // marqué tout domaine équipé comme défavorable en permanence.
        const live = station.live;
        if ((live.rainRate?.value ?? 0) > 0 || (live.windSpeed?.value ?? 0) > WIND_LIMIT_KMH) {
          unfavourable.set(farm.id, 'kit');
        }
      }

      // La puce d'en-tête montre le premier domaine réellement équipé ; à défaut,
      // le premier domaine, dont la météo viendra du contexte climatique.
      const equipped = kits.find((kit) => kit.station !== null);
      const chipFarm = equipped?.farm ?? farms[0] ?? null;
      if (equipped?.station) {
        setWeather({
          farmId: equipped.farm.id,
          farmName: equipped.farm.name,
          tempC: equipped.station.live.temperature?.value ?? null,
          online: equipped.station.online,
          observedAt: equipped.station.lastSeen,
          hasKit: true,
          climate: null,
          mesures: {
            humidite: equipped.station.live.humidity?.value ?? null,
            vent: equipped.station.live.windSpeed?.value ?? null,
            pluie24h: equipped.station.live.rainfall24h?.valueMm ?? null,
          },
        });
      } else if (chipFarm) {
        setWeather({
          farmId: chipFarm.id,
          farmName: chipFarm.name,
          tempC: null,
          online: false,
          observedAt: null,
          hasKit: false,
          climate: null,
          mesures: { humidite: null, vent: null, pluie24h: null },
        });
      }

      // Parcelles réellement sous suivi ITK : elles seules produisent des
      // fenêtres de traitement, donc elles seules justifient un appel climat.
      const itkParcels = parcelsByFarm.flatMap(({ farmId: id, parcels }) =>
        parcels.filter(isItkActive).map((parcel) => ({ farmId: id, parcel })),
      );

      // `climate-context` est la seule source météo ouverte au FARMER qui
      // fonctionne sans station : elle retombe sur CHIRPS + NASA POWER. Un appel
      // par domaine, jamais par parcelle — le contexte est climatique, il vaut
      // pour tout le domaine. On n'interroge que les domaines qu'aucun kit en
      // ligne ne couvre : ailleurs, la mesure du kit fait autorité et l'appel
      // serait gaspillé. Sans lui, un domaine non équipé n'aurait jamais
      // d'avertissement sur ses fenêtres de traitement.
      const climateTargets = new Map<string, string>();
      for (const { farmId: id, parcel } of itkParcels) {
        if (unfavourable.get(id) === 'kit') continue;
        if (kits.some((kit) => kit.farm.id === id && kit.station?.online === true)) continue;
        if (!climateTargets.has(id)) climateTargets.set(id, parcel.id);
      }
      // Le domaine de la puce mérite son chiffre même sans parcelle sous ITK.
      if (!equipped && chipFarm && !climateTargets.has(chipFarm.id)) {
        const anyParcel = parcelsByFarm.find((entry) => entry.farmId === chipFarm.id)?.parcels[0];
        if (anyParcel) climateTargets.set(chipFarm.id, anyParcel.id);
      }

      const targets = [...climateTargets];
      const climates = await Promise.allSettled(targets.map(([, parcelId]) => parcelleApi.climateContext(parcelId)));
      if (!active) return;

      targets.forEach(([id], index) => {
        const result = climates[index];
        if (result.status !== 'fulfilled') return;
        const context = result.value;

        // `treatmentWindowOpen` vaut pour la journée (vent + humidité + pluie
        // dans les seuils), là où le kit parle de l'instant. La note distingue
        // les deux plutôt que de créditer le kit d'une estimation.
        if (!context.wind.treatmentWindowOpen) unfavourable.set(id, 'satellite');

        if (!equipped && chipFarm && id === chipFarm.id) {
          setWeather((current) =>
            current && current.farmId === id
              ? { ...current, climate: { avgTempC: context.temperature.avg7dC, asOfDate: context.asOfDate } }
              : current,
          );
        }
      });

      // Vague 3 — plans ITK des parcelles réellement en campagne.
      const itkResults = await Promise.allSettled(itkParcels.map(({ parcel }) => parcelleApi.itkTasks(parcel.id)));
      if (!active) return;

      const sources: ParcelItkSource[] = itkResults.flatMap((result, index) =>
        result.status === 'fulfilled'
          ? [
              {
                itk: result.value,
                parcelName: itkParcels[index].parcel.name,
                farmId: itkParcels[index].farmId,
                farmName: farmNames.get(itkParcels[index].farmId),
                culture: parcelCrops.get(itkParcels[index].parcel.id),
              },
            ]
          : [],
      );
      setItkDrafts(itkToFeed(sources, { now: dayjs(), unfavourable }));
      setIsEnriching(false);
    })();

    return () => {
      active = false;
    };
  }, [farmerId, reloadKey]);

  const sections = useMemo(() => {
    const now = dayjs();
    return buildSections(
      [
        ...fieldTasksToFeed(tasks, names, now),
        ...alertsToFeed(alerts, names),
        ...visitsToFeed(tasks, names, now, visitesFaites),
        ...itkDrafts,
      ],
      now,
    );
  }, [tasks, alerts, itkDrafts, names, visitesFaites]);

  const dashboard = useMemo(
    () => buildDashboard({ sections, recap, names, alerts, tasks, chargeA, prochaineVisite }),
    [sections, recap, names, alerts, tasks, chargeA, prochaineVisite],
  );

  /**
   * Transition optimiste d'une consigne : l'UI avance tout de suite, l'appel
   * confirme, l'échec ramène l'état précédent avec un message court.
   */
  const runTaskAction = useCallback(async (id: string, action: 'start' | 'complete') => {
    const taskId = id.replace(/^task:/, '');
    const nextStatus = action === 'start' ? 'in_progress' : 'done';
    setActionError(null);

    const previous = tasksRef.current;
    setTasks((current) =>
      current.map((task) =>
        task.id === taskId
          ? {
              ...task,
              status: nextStatus,
              overdue: false,
              daysOverdue: 0,
              completedAt: action === 'complete' ? dayjs().toISOString() : task.completedAt,
            }
          : task,
      ),
    );

    // En démo, la mise à jour optimiste EST le résultat : aucun serveur à appeler.
    if (isDemoMode()) return;

    try {
      const updated = await fieldTasksApi.transition(taskId, action);
      // Le serveur fait autorité, mais s'il ne renvoie pas `completedAt` (cas
      // vu en pratique sur des réponses allégées), on garde la date optimiste
      // pour ne pas faire disparaître la consigne du fil du jour.
      setTasks((current) =>
        current.map((task) =>
          task.id === taskId ? { ...updated, completedAt: updated.completedAt ?? task.completedAt } : task,
        ),
      );
    } catch {
      setTasks(previous);
      setActionError('Action non enregistrée, réessayez');
    }
  }, []);

  /** Ferme le bandeau d'échec d'action — au clic ou à l'expiration du minuteur. */
  const dismissActionError = useCallback(() => setActionError(null), []);

  return {
    sections,
    dashboard,
    recap,
    weather,
    isLoading,
    isEnriching,
    error,
    actionError,
    reload,
    runTaskAction,
    dismissActionError,
  };
}
