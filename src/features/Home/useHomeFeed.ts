import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import dayjs from 'dayjs';

import { domainesApi } from '@/features/Domaines/domaines.api';
import type { FarmerAlert, Parcel } from '@/features/Domaines/domaines.types';
import { fieldTasksApi } from '@/features/FieldTasks/fieldTasks.api';
import type { FieldTask } from '@/features/FieldTasks/fieldTasks.types';
import { parcelleApi } from '@/features/Parcelle/parcelle.api';
import { useAuthStore } from '@/shared/stores/authStore';

import { buildFeed } from './home.feed';
import type { FeedGroup, FeedItemDraft } from './home.feed.types';
import {
  alertsToFeed,
  fieldTasksToFeed,
  isActiveAlert,
  itkToFeed,
  normalizeSeverity,
  visitsToFeed,
  type NameIndex,
  type ParcelItkSource,
} from './home.mappers';

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
  /** false = aucun kit assigné : la puce affiche « météo régionale estimée ». */
  hasKit: boolean;
}

export interface HomeFeedState {
  groups: FeedGroup[];
  totalItems: number;
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
  const [names, setNames] = useState<NameIndex>({ parcels: new Map(), farms: new Map() });
  const [recap, setRecap] = useState<HomeRecap | null>(null);
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
      setNames({ parcels: new Map(), farms: farmNames });
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
      }
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
      for (const { parcels } of parcelsByFarm) {
        for (const parcel of parcels) parcelNames.set(parcel.id, parcel.name);
      }
      setNames({ parcels: parcelNames, farms: farmNames });

      // Domaines dont le kit mesure des conditions défavorables ici et maintenant.
      const kits = farms.map((farm, index) => {
        const result = stations[index];
        return { farm, station: result.status === 'fulfilled' ? result.value.station : null };
      });

      const unfavourableFarmIds = new Set<string>();
      for (const { farm, station } of kits) {
        // Un kit hors ligne ne mesure plus rien « en ce moment » : sa dernière lecture
        // ne doit pas continuer à peindre les fenêtres du domaine en défavorables.
        if (station?.online !== true) continue;
        const measures = station.measures;
        if ((measures?.rain ?? 0) > 0 || (measures?.wind ?? 0) > WIND_LIMIT_KMH) {
          unfavourableFarmIds.add(farm.id);
        }
      }

      // La puce d'en-tête montre le premier domaine réellement équipé ; à défaut,
      // le premier domaine, annoncé comme météo régionale estimée.
      const equipped = kits.find((kit) => kit.station !== null);
      if (equipped?.station) {
        setWeather({
          farmId: equipped.farm.id,
          farmName: equipped.farm.name,
          tempC: equipped.station.measures?.temperature ?? null,
          online: equipped.station.online ?? false,
          observedAt: equipped.station.lastSeenAt ?? null,
          hasKit: true,
        });
      } else if (farms[0]) {
        setWeather({
          farmId: farms[0].id,
          farmName: farms[0].name,
          tempC: null,
          online: false,
          observedAt: null,
          hasKit: false,
        });
      }

      // Vague 3 — plans ITK des parcelles réellement en campagne.
      const itkParcels = parcelsByFarm.flatMap(({ farmId: id, parcels }) =>
        parcels.filter(isItkActive).map((parcel) => ({ farmId: id, parcel })),
      );
      const itkResults = await Promise.allSettled(
        itkParcels.map(({ parcel }) => parcelleApi.itkTasks(parcel.id)),
      );
      if (!active) return;

      const sources: ParcelItkSource[] = itkResults.flatMap((result, index) =>
        result.status === 'fulfilled'
          ? [{ itk: result.value, parcelName: itkParcels[index].parcel.name, farmId: itkParcels[index].farmId }]
          : [],
      );
      setItkDrafts(itkToFeed(sources, { now: dayjs(), unfavourableFarmIds }));
      setIsEnriching(false);
    })();

    return () => {
      active = false;
    };
  }, [farmerId, reloadKey]);

  const groups = useMemo(() => {
    const now = dayjs();
    return buildFeed(
      [
        ...fieldTasksToFeed(tasks, names, now),
        ...alertsToFeed(alerts),
        ...visitsToFeed(tasks, names, now),
        ...itkDrafts,
      ],
      now,
    );
  }, [tasks, alerts, itkDrafts, names]);

  const totalItems = useMemo(() => groups.reduce((count, group) => count + group.items.length, 0), [groups]);

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
    groups,
    totalItems,
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
