import Dexie, { type Table } from 'dexie';

/**
 * Base offline-first Kumy (IndexedDB via Dexie) — source de vérité locale.
 *
 * Squelette : les tables (caches à TTL + files d'écriture avec `syncStatus`)
 * seront ajoutées feature par feature, en suivant le pattern d'`agripilot-pwa`
 * (`shared/db/database.ts`, migrations versionnées).
 */

/** Métadonnée générique d'un enregistrement synchronisable. */
export interface SyncMeta {
  syncStatus: 'pending' | 'synced' | 'error';
  updatedAt: number;
}

/** Préférences d'auth device-level (numéro mémorisé pour la connexion simplifiée). Ligne unique id='current'. */
export interface AuthPrefRow {
  id: 'current';
  rememberedPhone: string | null;
}

export class KumyDatabase extends Dexie {
  // Exemple à décommenter lors de l'ajout de la première feature :
  // domains!: Table<Domain, string>;

  authPrefs!: Table<AuthPrefRow, string>;

  constructor() {
    super('KumyFarmerDB');
    this.version(1).stores({
      // domains: 'id, farmerId, syncStatus, updatedAt',
    });
    this.version(2).stores({
      authPrefs: 'id',
    });
  }
}

export const db = new KumyDatabase();

/** Ouvre la base au démarrage (idempotent). */
export async function initDatabase(): Promise<void> {
  if (!db.isOpen()) {
    await db.open();
  }
}

// Réexport pour les futures définitions de tables.
export type { Table };
