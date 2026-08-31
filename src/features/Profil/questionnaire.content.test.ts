import { describe, expect, it } from 'vitest';

import { TRANCHES_EXPERIENCE } from './questionnaire.content';

describe('TRANCHES_EXPERIENCE', () => {
  it('envoie la borne que le moteur de score teste', () => {
    // `scoreExperience` compare à 15, 10, 5 puis 2. Envoyer le milieu d'une
    // tranche ferait basculer un « 2 à 4 ans » dans le palier supérieur.
    expect(TRANCHES_EXPERIENCE.map((t) => t.valeur)).toEqual([1, 2, 5, 10, 15]);
  });

  it('nomme les tranches en clair', () => {
    expect(TRANCHES_EXPERIENCE[0].libelle).toBe('Moins de 2 ans');
    expect(TRANCHES_EXPERIENCE[4].libelle).toBe('15 ans et plus');
  });
});
