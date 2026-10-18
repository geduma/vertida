import { openDB, type IDBPDatabase } from 'idb';

const DB = 'vertida';
const V = 1;
let dbp: Promise<IDBPDatabase> | null = null;

export function db() {
  if (!dbp) {
    dbp = openDB(DB, V, {
      upgrade(d) {
        d.createObjectStore('recipes', { keyPath: 'id' });
        d.createObjectStore('equipment', { keyPath: 'id' });
        d.createObjectStore('settings', { keyPath: 'key' });
      },
    });
  }
  return dbp;
}

export async function persistStorage(): Promise<boolean> {
  try {
    // @ts-ignore - persist may not exist
    if (navigator.storage?.persist) return await navigator.storage.persist();
    return false;
  } catch { return false; }
}
