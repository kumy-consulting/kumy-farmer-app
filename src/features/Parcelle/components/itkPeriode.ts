import dayjs from 'dayjs';

/**
 * Période d'un stade ITK, telle qu'elle s'affiche sous la frise.
 *
 * L'agriculteur raisonne en dates, pas en jours depuis le semis : « 06 AOÛT »
 * se situe tout de suite, « J+12 » demande un calcul. La frise affichait les
 * seconds.
 *
 * L'année n'apparaît que lorsqu'elle est nécessaire — la porter sur chaque
 * stade d'une campagne qui tient dans l'année allongerait six libellés pour ne
 * rien apprendre.
 */
export function formatPeriodeStade(expectedStart: string, expectedEnd: string): string {
  const debut = dayjs(expectedStart);
  if (!debut.isValid()) return '';

  const fin = dayjs(expectedEnd);
  const anneeCourante = dayjs().year();
  const jour = (d: dayjs.Dayjs, avecAnnee: boolean) =>
    d.locale('fr').format(avecAnnee ? 'DD MMM YYYY' : 'DD MMM').toUpperCase();

  if (!fin.isValid()) {
    return jour(debut, debut.year() !== anneeCourante);
  }

  const memeAnnee = debut.year() === fin.year();
  // Campagne hors de l'année courante : les deux bouts portent leur année.
  if (memeAnnee && debut.year() !== anneeCourante) {
    return `${jour(debut, true)} – ${jour(fin, true)}`;
  }
  // Stade à cheval sur le nouvel an : seule la fin lève l'ambiguïté.
  if (!memeAnnee) {
    return `${jour(debut, debut.year() !== anneeCourante)} – ${jour(fin, true)}`;
  }
  return `${jour(debut, false)} – ${jour(fin, false)}`;
}
