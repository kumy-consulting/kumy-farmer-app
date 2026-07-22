import { describe, expect, it } from 'vitest';

import { extractInvitationCode } from './invitationCode.util';

describe('extractInvitationCode', () => {
  it('accepte un code nu', () => {
    expect(extractInvitationCode('a3f9c1d20b7e')).toBe('a3f9c1d20b7e');
  });

  it('normalise la casse et les espaces', () => {
    expect(extractInvitationCode('  A3F9C1D20B7E ')).toBe('a3f9c1d20b7e');
  });

  it('extrait le code d une URL d activation', () => {
    expect(extractInvitationCode('https://agripilot.kumy.app/activate?token=a3f9c1d20b7e')).toBe(
      'a3f9c1d20b7e',
    );
  });

  it('extrait le code d un SMS colle en entier', () => {
    const sms =
      'Bonjour Mamadou, votre code Kumy : a3f9c1d20b7e. Ou activez ici : https://agripilot.kumy.app/activate?token=a3f9c1d20b7e';
    expect(extractInvitationCode(sms)).toBe('a3f9c1d20b7e');
  });

  it('renvoie une chaine vide sur une entree vide', () => {
    expect(extractInvitationCode('   ')).toBe('');
  });
});
