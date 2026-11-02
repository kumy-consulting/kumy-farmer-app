import dayjs from 'dayjs';
import { describe, expect, it } from 'vitest';

import { formatRelative } from './formatRelative';

const now = dayjs('2026-07-23T12:00:00');

describe('formatRelative', () => {
  it('affiche « à l’instant » à moins d’une minute', () => {
    expect(formatRelative(now.subtract(30, 'second').toISOString(), now)).toBe("à l'instant");
  });

  it('affiche les minutes passées', () => {
    expect(formatRelative(now.subtract(20, 'minute').toISOString(), now)).toBe('il y a 20 min');
  });

  it('affiche les heures passées', () => {
    expect(formatRelative(now.subtract(2, 'hour').toISOString(), now)).toBe('il y a 2 h');
  });

  it('affiche les jours passés', () => {
    expect(formatRelative(now.subtract(1, 'day').toISOString(), now)).toBe('il y a 1 j');
  });

  it('affiche le futur avec « dans »', () => {
    expect(formatRelative(now.add(3, 'day').toISOString(), now)).toBe('dans 3 j');
    expect(formatRelative(now.add(45, 'minute').toISOString(), now)).toBe('dans 45 min');
  });
});
