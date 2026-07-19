import { describe, expect, it } from 'vitest';

import { formatE164ForDisplay, isValidGuineaNumber, toE164, unformat } from './phone.util';

describe('phone.util', () => {
  it('valide 9 chiffres', () => {
    expect(isValidGuineaNumber('622201362')).toBe(true);
    expect(isValidGuineaNumber('62220')).toBe(false);
  });
  it('assemble E.164', () => {
    expect(toE164('622201362')).toBe('+224622201362');
    expect(toE164('622 20 13 62')).toBe('+224622201362');
  });
  it('affiche E.164 lisible', () => {
    expect(formatE164ForDisplay('+224622201362')).toBe('+224 622 20 13 62');
  });
  it('unformat garde les chiffres', () => {
    expect(unformat('622 20 13 62')).toBe('622201362');
  });
});
