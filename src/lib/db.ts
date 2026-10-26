import { openDB, type IDBPDatabase } from 'idb';

const DB = 'vertida';
// v2 drops the unused `recipes` store: homemade recipes live in localStorage.
const V = 2;
let dbp: Promise<IDBPDatabase> | null = null;

const STORES: Array<[name: string, keyPath: string]> = [
  ['equipment', 'id'],
  ['settings', 'key'],
];

/** Lazily open the local database. Always returns a promise so callers can `.catch`. */
export function db(): Promise<IDBPDatabase> {
  if (!dbp) {
    try {
      dbp = openDB(DB, V, {
        upgrade(d) {
          // Databases created by v1 still carry the reserved store; remove it once.
          if (d.objectStoreNames.contains('recipes')) d.deleteObjectStore('recipes');
          for (const [name, keyPath] of STORES) {
            if (!d.objectStoreNames.contains(name)) d.createObjectStore(name, { keyPath });
          }
        },
      }).catch((err) => {
        dbp = null; // allow a later retry (blocked upgrade, transient failure)
        throw err;
      });
    } catch (err) {
      // IndexedDB can be unavailable (private windows, embedded webviews, sandboxed iframes).
      return Promise.reject(err);
    }
  }
  return dbp;
}

/**
 * Read the saved equipment selection.
 * Returns `null` when nothing was ever saved so callers can keep their defaults
 * (an empty array is a deliberate "nothing selected" state).
 */
export async function loadEquipmentIds(): Promise<string[] | null> {
  const d = await db();
  const row = (await d.get('settings', 'equipment')) as { key: string; value?: unknown } | undefined;
  if (row && Array.isArray(row.value)) {
    return row.value.filter((id): id is string => typeof id === 'string');
  }
  // Fallback for selections written by builds that only used the `equipment` store.
  const rows = (await d.getAll('equipment')) as Array<{ id?: unknown }>;
  if (!rows.length) return null;
  return rows.map(r => r?.id).filter((id): id is string => typeof id === 'string');
}

/** Persist the full selection atomically (empty selections included). */
export async function saveEquipmentIds(ids: string[]): Promise<void> {
  const d = await db();
  const tx = d.transaction(['equipment', 'settings'], 'readwrite');
  const equipment = tx.objectStore('equipment');
  void equipment.clear();
  for (const id of ids) void equipment.put({ id });
  void tx.objectStore('settings').put({ key: 'equipment', value: ids });
  await tx.done;
}

export async function persistStorage(): Promise<boolean> {
  try {
    // @ts-ignore - persist may not exist
    if (navigator.storage?.persist) return await navigator.storage.persist();
    return false;
  } catch { return false; }
}
