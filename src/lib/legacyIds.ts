/**
 * Data-contract v2 moved method ids to English. Values stored by older builds
 * (equipment selection in IndexedDB, custom recipes in localStorage) still use
 * the old ids, so map them on read instead of dropping the user's choice.
 */
const LEGACY_METHOD_IDS: Record<string, string> = {
  'prensa-francesa': 'french-press',
};

export function mapLegacyMethodId(id: string): string {
  return LEGACY_METHOD_IDS[id] ?? id;
}
