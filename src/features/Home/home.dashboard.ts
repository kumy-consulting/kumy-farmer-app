import dayjs, { type Dayjs } from 'dayjs';

import type { FarmerAlert } from '@/features/Domaines/domaines.types';
import type { FieldTask } from '@/features/FieldTasks/fieldTasks.types';

import type {
  Accompagnement,
  ElementPrioritaire,
  EtatDomaines,
  EvenementRecent,
  Gravite,
  HomeDashboard,
  Priorite,
  ResumeExploitation,
} from './home.dashboard.types';
import { formatEcheance, formatFenetre, formatSurvenu } from './home.echeance';
import type { FeedItem, Perimetre } from './home.feed.types';
import type { NameIndex } from './home.mappers';
import type { HomeSections } from './home.sections';
import type { HomeRecap } from './useHomeFeed';

/**
 * Construction du tableau de bord de l'accueil, en pur.
 *
 * Tout part des sections déjà calculées et des sources brutes : aucun appel
 * réseau, aucune dépendance à React, donc testable directement. Le jour où
 * l'API servira ce tableau de bord (§23), ce fichier disparaît et les composants
 * ne bougent pas.
 */

/** Au-delà, un événement n'appartient plus à l'actualité de l'exploitation. */
const ACTIVITE_MAX_JOURS = 14;

/**
 * Ce que l'accueil montre avant de replier le reste (§4, règle 4).
 *
 * Trois, et non « tout ce qui est urgent » : avec six consignes en retard, la
 * liste occupait quatre écrans et le bloc suivant devenait inatteignable. Un
 * plafond fixe garde la page à une hauteur constante quel que soit l'état de
 * l'exploitation — et ce qui est replié reste à un geste, jamais à un écran.
 */
const PRIORITES_VISIBLES = 3;

/**
 * Rang d'un élément du fil.
 *
 * La règle centrale des recommandations : **le volume ne fait pas la gravité**
 * (règle 3). Une action en retard est P1, dix actions en retard restent P1 —
 * seule une alerte critique ou une fenêtre agronomique qui se referme font
 * basculer en P0, parce qu'elles ont une conséquence irréversible.
 */
export function prioriteDe(item: FeedItem): Priorite {
  if (item.kind === 'alert') {
    if (item.severity === 'critical') return 'P0';
    if (item.severity === 'warning') return 'P1';
    return 'P2';
  }

  // Une fenêtre de traitement qui se ferme ne se rattrape pas : la manquer coûte
  // la campagne, pas une journée.
  if (item.kind === 'window') return item.urgentNow ? 'P0' : 'P1';

  if (item.overdue || item.urgentNow) return 'P1';
  if (item.status === 'in_progress') return 'P2';
  return 'P3';
}

const RANG: Record<Priorite, number> = { P0: 0, P1: 1, P2: 2, P3: 3 };

/** Une alerte se consulte, une action se fait — et l'utilisateur doit le savoir avant de tapoter. */
const natureDe = (item: FeedItem): 'alerte' | 'action' => (item.kind === 'alert' ? 'alerte' : 'action');

/** L'échéance, dans les mots de ce qu'elle est : limite, fenêtre, ou constat. */
function echeanceDe(item: FeedItem, now: Dayjs): string | undefined {
  if (item.kind === 'alert') return `Signalée ${formatSurvenu(item.at, now).toLowerCase()}`;
  if (item.kind === 'window') return formatFenetre(item.at, now);
  if (item.kind === 'visit') return undefined;
  return formatEcheance(item.at, now);
}

/**
 * Le périmètre, resserré sur ce qui distingue réellement.
 *
 * Un agriculteur qui n'a qu'un domaine le voit nommé sur chaque carte, six fois
 * de suite, sans que ça l'aide à choisir par quoi commencer — pire, beaucoup de
 * domaines portent le nom de leur propriétaire, si bien que l'écran répète le
 * nom de celui qui le lit. Le domaine ne désambiguïse qu'à partir de deux ; en
 * dessous, la parcelle et la culture suffisent à dire où agir.
 *
 * Il reste affiché quand il n'y a pas de parcelle : c'est alors le seul repère.
 */
export function resserrer(perimetre: Perimetre, plusieursDomaines: boolean): Perimetre {
  if (plusieursDomaines || !perimetre.parcelle) return perimetre;
  return { parcelle: perimetre.parcelle, culture: perimetre.culture };
}

function versElement(item: FeedItem, now: Dayjs, plusieursDomaines: boolean): ElementPrioritaire {
  return {
    id: item.id,
    priorite: prioriteDe(item),
    nature: natureDe(item),
    titre: item.title,
    perimetre: resserrer(item.perimetre, plusieursDomaines),
    actionRecommandee: item.advice,
    echeance: echeanceDe(item, now),
    // Une fenêtre encore ouverte n'est pas en retard, même quand elle presse :
    // `urgentNow` y signifie « se referme sous 48 h », pas « dépassée ».
    enRetard: item.kind !== 'alert' && item.kind !== 'window' && Boolean(item.overdue || item.urgentNow),
    enCours: item.status === 'in_progress',
    source: item,
  };
}

/**
 * Accord en nombre. Les deux formes sont toujours données : le pluriel d'un
 * groupe nominal ne s'obtient pas en ajoutant un « s » à la fin — « action en
 * retard » deviendrait « action en retards ».
 */
const compte = (n: number, singulier: string, pluriel: string): string => `${n} ${n > 1 ? pluriel : singulier}`;

/**
 * Pourquoi le statut est celui-ci (§4).
 *
 * Un statut nu — « Attention requise » — laisse l'utilisateur chercher la cause
 * dans le reste de la page. La phrase nomme ce qui pèse, dans l'ordre de
 * gravité, et s'arrête à deux motifs : au-delà elle cesse d'être lisible d'un
 * coup d'œil, ce qui est tout ce qu'on lui demande.
 */
export function expliquer(elements: ElementPrioritaire[]): string {
  const alertes = elements.filter((e) => e.nature === 'alerte' && RANG[e.priorite] <= 1).length;
  const fenetres = elements.filter((e) => e.source.kind === 'window' && e.priorite === 'P0').length;
  const retards = elements.filter((e) => e.nature === 'action' && e.priorite === 'P1').length;
  const aFaire = elements.filter((e) => e.nature === 'action' && e.priorite === 'P2').length;

  const motifs: string[] = [];
  if (fenetres > 0) {
    motifs.push(compte(fenetres, 'fenêtre de traitement se referme', 'fenêtres de traitement se referment'));
  }
  if (alertes > 0) motifs.push(compte(alertes, 'alerte active', 'alertes actives'));
  if (retards > 0) motifs.push(compte(retards, 'action en retard', 'actions en retard'));
  if (motifs.length === 0 && aFaire > 0) motifs.push(compte(aFaire, 'action à réaliser', 'actions à réaliser'));

  if (motifs.length === 0) return 'Rien ne demande votre attention aujourd’hui.';
  const retenus = motifs.slice(0, 2);
  return `${retenus.join(' et ').replace(/^./, (c) => c.toUpperCase())}.`;
}

/** La gravité découle du pire élément présent, jamais du nombre d'éléments. */
export function graviteDe(elements: ElementPrioritaire[]): Gravite {
  if (elements.some((e) => e.priorite === 'P0')) return 'critique';
  if (elements.some((e) => e.priorite === 'P1')) return 'attention';
  if (elements.some((e) => e.priorite === 'P2')) return 'surveiller';
  return 'normal';
}

/**
 * État de chaque domaine, pour permettre de passer de « mon exploitation
 * demande une attention » à « lequel de mes domaines » (§7).
 *
 * Un domaine est critique s'il porte une alerte critique, à surveiller s'il
 * porte une autre alerte active ou une consigne en retard.
 */
export function etatDomaines(
  farms: Map<string, string>,
  alerts: FarmerAlert[],
  tasks: FieldTask[],
  surfaceHa: number,
): EtatDomaines {
  const critiques = new Set<string>();
  const surveiller = new Set<string>();

  for (const alert of alerts) {
    if (alert.status !== 'active') continue;
    if (alert.severity === 'critical') critiques.add(alert.farmId);
    else surveiller.add(alert.farmId);
  }
  for (const task of tasks) {
    if (task.overdue && task.status !== 'done') surveiller.add(task.farmId);
  }

  const total = farms.size;
  const nbCritiques = [...critiques].filter((id) => farms.has(id)).length;
  const nbSurveiller = [...surveiller].filter((id) => farms.has(id) && !critiques.has(id)).length;

  return {
    total,
    surfaceHa,
    critiques: nbCritiques,
    aSurveiller: nbSurveiller,
    normaux: Math.max(0, total - nbCritiques - nbSurveiller),
  };
}

/**
 * L'actualité de l'exploitation, reconstituée de ce que l'API expose.
 *
 * Aucun endpoint d'événements n'existe : on relit les consignes closes et les
 * alertes créées. C'est moins riche qu'un journal, mais c'est vrai — et le bloc
 * reste secondaire (§10), il ne doit pas prendre la place des priorités.
 */
export function activiteRecente(
  tasks: FieldTask[],
  alerts: FarmerAlert[],
  derniereVisite: FeedItem | null,
  farms: Map<string, string>,
  now: Dayjs,
  /**
   * Identifiants déjà présents dans « À traiter ». Une alerte encore ouverte y
   * figure comme priorité : la répéter deux blocs plus bas au titre de
   * l'actualité fait lire deux fois la même chose, et gonfle un bloc qui doit
   * rester secondaire. L'activité ne garde donc que ce qui est retombé.
   */
  dejaListes: Set<string> = new Set(),
): EvenementRecent[] {
  const recent = (iso: string): boolean => now.diff(dayjs(iso), 'day') <= ACTIVITE_MAX_JOURS;
  const plusieursDomaines = farms.size > 1;
  const brut: EvenementRecent[] = [];

  for (const task of tasks) {
    if (task.status !== 'done' || !task.completedAt || !recent(task.completedAt)) continue;
    brut.push({
      id: `fait:${task.id}`,
      nature: 'fait',
      titre: task.title,
      quand: formatSurvenu(task.completedAt, now),
      at: task.completedAt,
      occurrences: 1,
      perimetre: resserrer({ domaine: farms.get(task.farmId) }, plusieursDomaines),
      target: task.parcelId ? `/domaines/${task.farmId}/parcelles/${task.parcelId}` : `/domaines/${task.farmId}`,
    });
  }

  for (const alert of alerts) {
    if (!recent(alert.createdAt) || dejaListes.has(`alert:${alert.id}`)) continue;
    brut.push({
      id: `signal:${alert.id}`,
      nature: 'signal',
      titre: alert.title || alert.message,
      quand: formatSurvenu(alert.createdAt, now),
      at: alert.createdAt,
      occurrences: 1,
      perimetre: resserrer(
        { domaine: alert.farmName, parcelle: alert.parcelName },
        plusieursDomaines,
      ),
      target: alert.parcelId ? `/domaines/${alert.farmId}/parcelles/${alert.parcelId}` : `/domaines/${alert.farmId}`,
    });
  }

  if (derniereVisite && recent(derniereVisite.at)) {
    brut.push({
      id: `passage:${derniereVisite.id}`,
      nature: 'passage',
      titre: derniereVisite.title,
      quand: formatSurvenu(derniereVisite.at, now),
      at: derniereVisite.at,
      occurrences: 1,
      perimetre: resserrer(derniereVisite.perimetre, plusieursDomaines),
      target: derniereVisite.target,
    });
  }

  // Regroupement par nature + intitulé + lieu : une alerte saisonnière remontée
  // chaque jour est un seul fait qui dure, pas quatre nouvelles. On garde la
  // date la plus récente et on compte les répétitions.
  const groupes = new Map<string, EvenementRecent>();
  for (const evenement of brut.sort((a, b) => b.at.localeCompare(a.at))) {
    const cle = `${evenement.nature}|${evenement.titre}|${evenement.perimetre.parcelle ?? ''}`;
    const existant = groupes.get(cle);
    if (existant) existant.occurrences += 1;
    else groupes.set(cle, { ...evenement });
  }

  return [...groupes.values()].slice(0, 4);
}

export interface DashboardInput {
  sections: HomeSections;
  recap: HomeRecap | null;
  /** Domaines, parcelles et cultures chargés — la source qui fait foi. */
  names: NameIndex;
  alerts: FarmerAlert[];
  tasks: FieldTask[];
  /** Instant du dernier chargement réussi (ISO), pour la fraîcheur affichée. */
  chargeA: string | null;
  /** Prochaine visite planifiée, quand `/farmers/:id/visits` a répondu. */
  prochaineVisite?: Accompagnement['prochaineVisite'];
  now?: Dayjs;
}

export function buildDashboard(input: DashboardInput): HomeDashboard {
  const now = input.now ?? dayjs();
  const { sections, recap, names, alerts, tasks } = input;
  const farms = names.farms;
  const plusieursDomaines = farms.size > 1;

  // Alertes et actions dans le même sac : la question de l'utilisateur est
  // « qu'est-ce qui demande mon attention », pas « de quelle table ça vient ».
  const elements = [
    ...sections.alerts.fresh,
    ...sections.tasks.bySegment.overdue,
    ...sections.tasks.bySegment.inProgress,
    ...sections.tasks.bySegment.planned,
  ]
    .map((item) => versElement(item, now, plusieursDomaines))
    .sort((a, b) => RANG[a.priorite] - RANG[b.priorite] || a.source.score - b.source.score);

  const gravite = graviteDe(elements);
  const pointsAttention = elements.filter((e) => RANG[e.priorite] <= 1).length;

  const resume: ResumeExploitation = {
    gravite,
    explication: expliquer(elements),
    domaines: farms.size || (recap?.domains ?? 0),
    // Les parcelles chargées font foi : `/dashboard` renvoie parfois 0 par bug
    // d'agrégation, et « 0 parcelle » sur l'écran d'accueil se lit comme une
    // exploitation vide plutôt que comme un compteur en panne.
    parcelles: names.parcels.size || (recap?.parcels ?? 0),
    surfaceHa: recap?.areaHa ?? 0,
    pointsAttention,
    chargeA: input.chargeA,
  };

  const derniereVisite = sections.visits.last;

  return {
    resume,
    elements,
    seuilVisible: PRIORITES_VISIBLES,
    domaines: etatDomaines(farms, alerts, tasks, resume.surfaceHa),
    accompagnement: {
      // Le nom vient d'abord du dernier passage réel, puis de la visite
      // annoncée. `visit.author` n'est pas retenu : il retombe sur « votre
      // technicien » quand la consigne ne nomme personne, et un rôle affiché en
      // tête de carte se lit comme un patronyme.
      technicien: derniereVisite?.author ?? input.prochaineVisite?.technicien ?? null,
      derniereVisite,
      prochaineVisite: input.prochaineVisite ?? null,
    } satisfies Accompagnement,
    activite: activiteRecente(
      tasks,
      alerts,
      derniereVisite,
      farms,
      now,
      new Set(elements.map((element) => element.source.id)),
    ),
  };
}
