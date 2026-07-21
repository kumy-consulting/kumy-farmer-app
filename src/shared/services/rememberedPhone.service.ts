import { db } from '@/shared/db/database';

/**
 * Numéro de téléphone mémorisé (device-level) pour la connexion simplifiée
 * (PhoneEntry → PIN direct sans ressaisir le numéro). Persisté en IndexedDB
 * via Dexie (`authPrefs`, ligne unique id='current') — survit au rechargement.
 */

const ROW_ID = 'current' as const;

export async function getRememberedPhone(): Promise<string | null> {
  const row = await db.authPrefs.get(ROW_ID);
  return row?.rememberedPhone ?? null;
}

export async function setRememberedPhone(phone: string): Promise<void> {
  await db.authPrefs.put({ id: ROW_ID, rememberedPhone: phone });
}

export async function clearRememberedPhone(): Promise<void> {
  await db.authPrefs.put({ id: ROW_ID, rememberedPhone: null });
}
