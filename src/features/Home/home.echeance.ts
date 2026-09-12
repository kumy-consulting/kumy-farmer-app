import dayjs, { type Dayjs } from 'dayjs';

/**
 * Échéances et dates d'événement, en clair.
 *
 * Le relatif seul — « il y a 81 j » — ne dit rien d'exploitable : l'agriculteur
 * ne sait pas de quelle date on parle, ne peut pas la rapprocher de son carnet
 * ni d'une visite, et 81 jours ne se convertissent pas de tête. Une échéance est
 * un jour ; elle s'annonce comme un jour.
 *
 * Le relatif garde sa place là où il est réellement plus parlant : les dernières
 * heures, où « il y a 2 h » situe mieux qu'une date.
 */

const JOUR = 'D MMMM';
const JOUR_ANNEE = 'D MMMM YYYY';

/** « 12 juin », ou « 12 juin 2025 » dès qu'on change d'année. */
export function formatJour(iso: string, now: Dayjs = dayjs()): string {
  const date = dayjs(iso);
  return date.format(date.year() === now.year() ? JOUR : JOUR_ANNEE);
}

/**
 * Échéance d'une action : ce qu'il reste à faire, et pour quand.
 *
 * « Aujourd'hui » et « demain » l'emportent sur la date — ce sont les deux seuls
 * moments où le jour de la semaine ne demande aucun calcul.
 */
export function formatEcheance(iso: string, now: Dayjs = dayjs()): string {
  const date = dayjs(iso);
  const jours = date.startOf('day').diff(now.startOf('day'), 'day');

  if (jours < 0) return `En retard depuis le ${formatJour(iso, now)}`;
  if (jours === 0) return 'À réaliser aujourd’hui';
  if (jours === 1) return 'À réaliser demain';
  return `À réaliser avant le ${formatJour(iso, now)}`;
}

/**
 * Date d'un événement déjà survenu — alerte signalée, visite faite.
 *
 * Sous 24 h le relatif est plus juste : « il y a 2 h » dit que c'est en cours de
 * journée, là où « 20 août » laisserait croire à quelque chose de rangé.
 */
export function formatSurvenu(iso: string, now: Dayjs = dayjs()): string {
  const date = dayjs(iso);
  const heures = now.diff(date, 'hour');

  if (heures < 1) return 'À l’instant';
  if (heures < 24) return `Il y a ${heures} h`;
  if (date.startOf('day').diff(now.startOf('day'), 'day') === -1) return 'Hier';
  return `Le ${formatJour(iso, now)}`;
}

/** « Jusqu'au 20 août » — bornes d'une fenêtre agronomique. */
export function formatFenetre(iso: string, now: Dayjs = dayjs()): string {
  const date = dayjs(iso);
  const jours = date.startOf('day').diff(now.startOf('day'), 'day');

  if (jours < 0) return `Fenêtre fermée le ${formatJour(iso, now)}`;
  if (jours === 0) return 'Dernier jour : aujourd’hui';
  if (jours === 1) return 'Dernier jour : demain';
  return `Jusqu’au ${formatJour(iso, now)}`;
}
