import dayjs, { type Dayjs } from 'dayjs';

import type { FieldTask } from '@/features/FieldTasks/fieldTasks.types';

import type { CarnetConsigne, CarnetInspection, CarnetObservation, CarnetVisite } from './carnet.types';
import type { ItkParcelTasks, ItkTask } from './parcelle.types';

/**
 * Un passage = une personne, un jour.
 *
 * Les deux sources ne partagent aucun identifiant de visite : les consignes
 * portent un `visitId`, les journaux de tâches ITK n'en ont pas. Plutôt que de
 * bricoler une corrélation fragile, on regroupe sur ce que les deux ont
 * réellement en commun — la date et l'auteur. C'est aussi la façon dont un
 * passage existe pour l'agriculteur : le jour où le technicien est venu.
 */
const cle = (date: string, auteur: string): string => `${dayjs(date).format('YYYY-MM-DD')}|${auteur}`;

/** Ce qui n'est pas l'agriculteur est un technicien : c'est son carnet, pas le sien. */
const parTechnicien = (role: string): boolean => role !== 'farmer';

const ANONYME = 'Votre technicien';

/** Échéance dite dans le vocabulaire de l'accueil, pour ne pas en inventer un second. */
const echeanceDe = (tache: FieldTask, now: Dayjs): { texte: string; enRetard: boolean } => {
  if (tache.status === 'done') {
    const fait = tache.completedAt ?? tache.updatedAt;
    return { texte: `Fait le ${dayjs(fait).format('D MMMM')}`, enRetard: false };
  }
  if (tache.overdue) {
    const jours = tache.daysOverdue || Math.max(1, now.diff(dayjs(tache.dueDate), 'day'));
    return { texte: `En retard de ${jours} j`, enRetard: true };
  }
  return { texte: `À faire avant le ${dayjs(tache.dueDate).format('D MMMM')}`, enRetard: false };
};

const observationDe = (tache: ItkTask): CarnetObservation | null => {
  const log = tache.completedLog;
  if (!log || !parTechnicien(log.completedBy.role)) return null;

  const photos = (log.photoUrls ?? []).map((url) => ({ url, legende: `Photo prise pour « ${tache.title} »` }));
  // Une clôture sans note ni photo n'est pas une observation : c'est juste une
  // case cochée, déjà visible dans le calendrier ITK.
  if (!log.notes && photos.length === 0) return null;

  return { id: log.logId, aPropos: tache.title, texte: log.notes, photos };
};

/**
 * Une observation libre devient une entrée du carnet dès qu'elle porte quelque
 * chose à voir : une note, des photos, ou une pression d'adventices. La
 * pression compte — c'est un constat du technicien, pas une case cochée.
 */
const observationLibreDe = (obs: CarnetInspection): CarnetObservation | null => {
  const photos = (obs.photoUrls ?? []).map((url) => ({
    url,
    legende: 'Photo prise lors du passage',
  }));
  if (!obs.notes && photos.length === 0 && !obs.weedPressure) return null;

  return { id: obs.id, texte: obs.notes, photos, pression: obs.weedPressure };
};

/**
 * Construit le carnet d'une parcelle à partir des deux seules sources lisibles
 * par un agriculteur : les journaux de tâches ITK (observations et photos) et
 * les consignes rattachées à une visite.
 *
 * Les passages sont rendus du plus récent au plus ancien — on ouvre un carnet
 * pour voir la dernière page.
 */
export function buildCarnet(
  itk: ItkParcelTasks | null,
  taches: FieldTask[],
  now: Dayjs = dayjs(),
  observations: CarnetInspection[] = [],
): CarnetVisite[] {
  const visites = new Map<string, CarnetVisite>();

  const obtenir = (date: string, auteur: string): CarnetVisite => {
    const k = cle(date, auteur);
    const existante = visites.get(k);
    if (existante) return existante;
    const creee: CarnetVisite = { id: k, date, auteur, observations: [], consignes: [] };
    visites.set(k, creee);
    return creee;
  };

  for (const stade of itk?.stages ?? []) {
    for (const tache of [...stade.tasks.mandatory, ...stade.tasks.recommended]) {
      const observation = observationDe(tache);
      if (!observation || !tache.completedLog) continue;
      const log = tache.completedLog;
      obtenir(log.completedAt, log.completedBy.displayName ?? ANONYME).observations.push(observation);
    }
  }

  for (const tache of taches) {
    // Pas de filtre sur `visitId` : l'app technicien ne le renseigne que si une
    // visite est ouverte au moment de la saisie, alors qu'une consigne écrite
    // hors visite reste une consigne donnée sur cette parcelle. Et seul un
    // superviseur peut en créer — il n'y a donc rien à écarter ici. Le
    // regroupement se fait de toute façon sur la date et l'auteur.
    const { texte, enRetard } = echeanceDe(tache, now);
    const consigne: CarnetConsigne = {
      id: tache.id,
      titre: tache.title,
      echeance: texte,
      faite: tache.status === 'done',
      enRetard,
    };
    obtenir(tache.createdAt, tache.createdByName ?? ANONYME).consignes.push(consigne);
  }

  for (const obs of observations) {
    const observation = observationLibreDe(obs);
    if (!observation) continue;
    obtenir(obs.inspectionDate, obs.inspectorName ?? ANONYME).observations.push(observation);
  }

  return [...visites.values()].sort((a, b) => b.date.localeCompare(a.date));
}
