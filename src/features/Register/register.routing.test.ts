import { describe, expect, it } from 'vitest';

import { ecranApresVerification, ROUTES_INSCRIPTION } from './register.routing';

describe('ecranApresVerification', () => {
  it('envoie un compte en service vers « déjà inscrit » : il n\'y a rien à créer', () => {
    expect(ecranApresVerification('active')).toBe('/inscription/deja-inscrit');
  });

  it('envoie un compte suspendu vers son écran dédié plutôt que vers la connexion', () => {
    expect(ecranApresVerification('suspended')).toBe('/inscription/suspendu');
  });

  it('envoie un compte préparé par le partenaire vers le profil', () => {
    expect(ecranApresVerification('pending')).toBe('/inscription/profil');
    expect(ecranApresVerification('inactive')).toBe('/inscription/profil');
  });

  it('envoie un numéro sans compte vers le profil', () => {
    expect(ecranApresVerification('absent')).toBe('/inscription/profil');
  });

  it('couvre les cinq statuts et rien d\'autre', () => {
    const statuts = ['active', 'pending', 'inactive', 'suspended', 'absent'] as const;
    const cibles = new Set(statuts.map(ecranApresVerification));
    expect(cibles).toEqual(
      new Set([
        ROUTES_INSCRIPTION.dejaInscrit,
        ROUTES_INSCRIPTION.suspendu,
        ROUTES_INSCRIPTION.profil,
      ]),
    );
  });
});
