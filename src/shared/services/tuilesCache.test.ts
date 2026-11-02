import { afterEach, describe, expect, it, vi } from 'vitest';

import { mesurerTuiles, viderTuiles } from './tuilesCache';

function poserCaches(contenu: Record<string, number>) {
  const supprimes: string[] = [];
  const faux = {
    has: (nom: string) => Promise.resolve(contenu[nom] != null),
    open: (nom: string) =>
      Promise.resolve({
        keys: () => Promise.resolve(Array.from({ length: contenu[nom] ?? 0 }, (_, i) => i)),
      }),
    delete: (nom: string) => {
      supprimes.push(nom);
      delete contenu[nom];
      return Promise.resolve(true);
    },
  };
  vi.stubGlobal('caches', faux);
  return supprimes;
}

function poserEstimation(usageDetails?: Record<string, number>) {
  vi.stubGlobal('navigator', {
    storage: { estimate: () => Promise.resolve({ usage: 42, usageDetails }) },
  });
}

describe('mesurerTuiles', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('compte les tuiles des deux caches de fond de carte', async () => {
    poserCaches({ 'map-tiles-google': 812, 'map-tiles-satellite': 436 });
    poserEstimation({ caches: 12_582_912 });

    expect(await mesurerTuiles()).toEqual({ tuiles: 1248, octets: 12_582_912 });
  });

  it('ignore un cache qui n’a jamais servi', async () => {
    poserCaches({ 'map-tiles-google': 5 });
    poserEstimation({ caches: 1024 });

    expect((await mesurerTuiles())?.tuiles).toBe(5);
  });

  it('rend un poids inconnu plutôt qu’un chiffre inventé', async () => {
    poserCaches({ 'map-tiles-google': 5 });
    poserEstimation(undefined);

    expect(await mesurerTuiles()).toEqual({ tuiles: 5, octets: null });
  });

  it('rend null là où le navigateur n’a pas de Cache Storage', async () => {
    vi.stubGlobal('caches', undefined);
    expect(await mesurerTuiles()).toBeNull();
  });
});

describe('viderTuiles', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('supprime les deux caches, et eux seuls', async () => {
    const supprimes = poserCaches({
      'map-tiles-google': 812,
      'map-tiles-satellite': 436,
      'autre-cache': 3,
    });

    await viderTuiles();

    expect(supprimes).toEqual(['map-tiles-google', 'map-tiles-satellite']);
  });

  it('ne casse pas sans Cache Storage', async () => {
    vi.stubGlobal('caches', undefined);
    await expect(viderTuiles()).resolves.toBeUndefined();
  });
});
