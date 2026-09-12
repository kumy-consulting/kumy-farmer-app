import { describe, expect, it } from 'vitest';

import { initiales } from './initiales';

describe('initiales', () => {
  it('prend le premier et le DERNIER mot', () => {
    // « MA » — les deux premiers mots — ne dirait rien : le nom de famille se
    // porte en dernier.
    expect(initiales('Mamadou Aliou Barry')).toBe('MB');
  });

  it('rend une seule lettre pour un nom d’un seul mot', () => {
    expect(initiales('Aïssatou')).toBe('A');
  });

  it('ne bute ni sur le vide, ni sur les espaces en trop', () => {
    expect(initiales('  Fatoumata   Camara  ')).toBe('FC');
    expect(initiales('   ')).toBe('');
    expect(initiales(undefined)).toBe('');
  });
});
