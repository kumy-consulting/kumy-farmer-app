/**
 * Les fonds de carte gardés hors réseau.
 *
 * Les deux caches sont déclarés dans `vite.config.ts` (`runtimeCaching`), en
 * `CacheFirst` avec trente jours de rétention. Ce sont eux que l'agriculteur
 * emporte au champ.
 *
 * **Leur poids exact n'est pas mesurable depuis JS.** Les tuiles sont servies
 * par des domaines tiers sans CORS : les réponses sont *opaques*
 * (`cacheableResponse: { statuses: [0, 200] }`), leur `Content-Length` est
 * masqué et `blob()` ne rend rien d'exploitable. D'où deux niveaux :
 *
 * 1. `navigator.storage.estimate()` expose parfois `usageDetails.caches`
 *    (Chromium) — un vrai chiffre, on l'affiche ;
 * 2. sinon `octets` vaut `null`, et l'écran montre le nombre de tuiles, qui
 *    lui est toujours exact.
 *
 * Ce qu'on n'écrit jamais : un « 12 Mo » calculé au doigt mouillé.
 */
const CACHES_DE_TUILES = ['map-tiles-google', 'map-tiles-satellite'] as const;

export interface EtatTuiles {
  tuiles: number;
  /** `null` quand le navigateur ne sait pas dire le poids de ses caches. */
  octets: number | null;
}

/** Le Cache Storage, ou `null` là où le navigateur n'en a pas (jsdom, vieux WebView). */
function cacheStorage(): CacheStorage | null {
  return typeof caches === 'undefined' ? null : caches;
}

async function poidsDesCaches(): Promise<number | null> {
  if (typeof navigator === 'undefined' || !navigator.storage?.estimate) return null;

  try {
    const estimation = (await navigator.storage.estimate()) as StorageEstimate & {
      usageDetails?: { caches?: number };
    };
    const octets = estimation.usageDetails?.caches;
    return typeof octets === 'number' ? octets : null;
  } catch {
    return null;
  }
}

export async function mesurerTuiles(): Promise<EtatTuiles | null> {
  const stockage = cacheStorage();
  if (!stockage) return null;

  let tuiles = 0;
  for (const nom of CACHES_DE_TUILES) {
    if (!(await stockage.has(nom))) continue;
    const cache = await stockage.open(nom);
    tuiles += (await cache.keys()).length;
  }

  return { tuiles, octets: await poidsDesCaches() };
}

export async function viderTuiles(): Promise<void> {
  const stockage = cacheStorage();
  if (!stockage) return;

  // En série, et dans l'ordre déclaré : la suppression est rare, et un ordre
  // stable rend l'opération lisible dans les journaux comme dans les tests.
  for (const nom of CACHES_DE_TUILES) {
    await stockage.delete(nom);
  }
}
