import dayjs from 'dayjs';
import { describe, expect, it } from 'vitest';

import { formatEcheance, formatFenetre, formatJour, formatSurvenu } from './home.echeance';

const now = dayjs('2026-08-20T10:00:00');

describe('formatEcheance', () => {
  it('date le retard au lieu de compter les jours', () => {
    expect(formatEcheance('2026-06-12T00:00:00', now)).toBe('En retard depuis le 12 juin');
  });

  it('nomme aujourd’hui et demain plutôt que de les dater', () => {
    expect(formatEcheance('2026-08-20T00:00:00', now)).toBe('À réaliser aujourd’hui');
    expect(formatEcheance('2026-08-21T00:00:00', now)).toBe('À réaliser demain');
  });

  it('donne la date limite au-delà de demain', () => {
    expect(formatEcheance('2026-09-02T00:00:00', now)).toBe('À réaliser avant le 2 septembre');
  });
});

describe('formatSurvenu', () => {
  it('reste relatif dans les dernières heures', () => {
    expect(formatSurvenu('2026-08-20T08:00:00', now)).toBe('Il y a 2 h');
  });

  it('nomme hier, puis date', () => {
    expect(formatSurvenu('2026-08-19T09:00:00', now)).toBe('Hier');
    expect(formatSurvenu('2026-08-02T09:00:00', now)).toBe('Le 2 août');
  });
});

describe('formatJour', () => {
  it('ajoute l’année dès qu’on en change', () => {
    expect(formatJour('2026-06-12T00:00:00', now)).toBe('12 juin');
    expect(formatJour('2025-06-12T00:00:00', now)).toBe('12 juin 2025');
  });
});

describe('formatFenetre', () => {
  it('annonce le dernier jour puis la fermeture', () => {
    expect(formatFenetre('2026-08-20T18:00:00', now)).toBe('Dernier jour : aujourd’hui');
    expect(formatFenetre('2026-08-25T18:00:00', now)).toBe('Jusqu’au 25 août');
    expect(formatFenetre('2026-08-14T18:00:00', now)).toBe('Fenêtre fermée le 14 août');
  });
});
