import { afterEach, describe, expect, it, vi } from 'vitest';

import { stadeEnCours, statutEffectif } from './itkStadeEnCours';
import type { ItkStage } from '../parcelle.types';

afterEach(() => vi.useRealTimers());

const figerAu = (iso: string) => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(iso));
};

const stade = (code: string, statut: ItkStage['status'], debut: string, fin: string): ItkStage => ({
  stageCode: code, stageName: code, order: 1, expectedStart: debut, expectedEnd: fin,
  status: statut, dayStart: 0, dayEnd: 0, description: '', critical: false,
  tasks: { mandatory: [], recommended: [] }, risks: [],
});

/** Le jeu de la capture : un stade en retard, puis celui qui couvre aujourd'hui. */
const REELS = [
  stade('germ', 'delayed', '2026-08-06', '2026-08-16'),
  stade('veg', 'upcoming', '2026-08-16', '2026-09-20'),
  stade('flo', 'upcoming', '2026-09-20', '2026-10-15'),
];

describe('stadeEnCours', () => {
  it("retient le stade dont la fenêtre contient aujourd'hui, même si l'API le dit à venir", () => {
    figerAu('2026-08-22T10:00:00Z');
    expect(stadeEnCours(REELS)).toBe('veg');
  });

  it('inclut les bornes du stade', () => {
    figerAu('2026-09-20T08:00:00Z');
    expect(stadeEnCours(REELS)).toBe('flo');
  });

  it("ne retient pas le stade en retard, qui est derrière nous", () => {
    figerAu('2026-08-22T10:00:00Z');
    expect(stadeEnCours(REELS)).not.toBe('germ');
  });

  it("se rabat sur le statut de l'API quand aucune fenêtre ne couvre le jour", () => {
    figerAu('2027-01-01T10:00:00Z');
    const avecStatut = [stade('a', 'completed', '2026-08-06', '2026-08-16'), stade('b', 'inProgress', '2026-08-16', '2026-09-20')];
    expect(stadeEnCours(avecStatut)).toBe('b');
  });

  it('ne désigne rien plutôt que de désigner au hasard', () => {
    figerAu('2027-01-01T10:00:00Z');
    expect(stadeEnCours(REELS)).toBeUndefined();
    expect(stadeEnCours([])).toBeUndefined();
  });

  it('ignore les dates illisibles sans planter', () => {
    figerAu('2026-08-22T10:00:00Z');
    expect(stadeEnCours([stade('x', 'upcoming', '', ''), REELS[1]])).toBe('veg');
  });
});

describe('statutEffectif', () => {
  it('déclare « en cours » le stade traversé, quoi qu’en dise l’API', () => {
    expect(statutEffectif(REELS[1], 'veg')).toBe('inProgress');
  });

  it('laisse les autres stades à leur statut d’origine', () => {
    expect(statutEffectif(REELS[0], 'veg')).toBe('delayed');
    expect(statutEffectif(REELS[2], 'veg')).toBe('upcoming');
  });

  it('ne change rien quand aucun stade n’est traversé', () => {
    expect(statutEffectif(REELS[1], undefined)).toBe('upcoming');
  });
});
