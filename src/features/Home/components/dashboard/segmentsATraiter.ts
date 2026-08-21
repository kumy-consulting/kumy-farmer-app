import type { ElementPrioritaire } from '../../home.dashboard.types';

/** Les découpes que l'agriculteur cherche vraiment dans sa liste. */
export type SegmentATraiter = 'tout' | 'retard' | 'cours' | 'alertes';

export const LIBELLE: Record<SegmentATraiter, string> = {
  tout: 'Tout',
  retard: 'En retard',
  cours: 'En cours',
  alertes: 'Alertes',
};

/**
 * Le retard reprend le rouge des alertes critiques, comme dans l'ancien bloc
 * Tâches : une consigne dépassée et une alerte grave demandent la même chose —
 * agir maintenant. Une seule échelle de gravité à apprendre sur l'écran.
 */
export const TON: Record<SegmentATraiter, { texte: string }> = {
  tout: { texte: '#2F3130' },
  retard: { texte: '#BA1A1A' },
  cours: { texte: '#016557' },
  alertes: { texte: '#8C5000' },
};

/** L'ordre dit la priorité de lecture : ce qui presse, ce qui avance, ce qui alerte. */
export const ORDRE: SegmentATraiter[] = ['tout', 'retard', 'cours', 'alertes'];

export const appartientAu = (element: ElementPrioritaire, segment: SegmentATraiter): boolean => {
  if (segment === 'tout') return true;
  if (segment === 'retard') return element.enRetard;
  if (segment === 'cours') return element.enCours;
  return element.nature === 'alerte';
};

export const compterSegments = (elements: ElementPrioritaire[]): Record<SegmentATraiter, number> => ({
  tout: elements.length,
  retard: elements.filter((e) => appartientAu(e, 'retard')).length,
  cours: elements.filter((e) => appartientAu(e, 'cours')).length,
  alertes: elements.filter((e) => appartientAu(e, 'alertes')).length,
});
