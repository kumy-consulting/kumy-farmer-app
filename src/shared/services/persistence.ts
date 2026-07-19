/**
 * Demande à l'OS de rendre le stockage (IndexedDB) persistant, pour protéger les
 * files d'écriture offline non synchronisées contre l'éviction — critique pour
 * l'usage terrain (réseau intermittent). Best-effort : ne jette jamais.
 */
export async function requestPersistentStorage(): Promise<boolean> {
  if (typeof navigator === 'undefined' || !navigator.storage?.persist) {
    return false;
  }
  try {
    if (await navigator.storage.persisted?.()) {
      return true;
    }
    return await navigator.storage.persist();
  } catch {
    return false;
  }
}
