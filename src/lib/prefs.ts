export type ThemeMode = 'light' | 'dark' | 'auto';

export const PREF_KEYS = {
  lang: 'vertida-lang',
  themeMode: 'vertida-theme-mode',
  theme: 'vertida-theme',
  advanced: 'vertida-advanced',
  muted: 'vertida-muted',
} as const;

/** localStorage can throw (quota, private mode, disabled storage): never let it break the app. */
export function readPref(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writePref(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // In-memory only: the app keeps working without persistence.
  }
}

export function readLang(fallback: 'es' | 'en'): 'es' | 'en' {
  const value = readPref(PREF_KEYS.lang);
  return value === 'es' || value === 'en' ? value : fallback;
}

export function readThemeMode(): ThemeMode {
  const mode = readPref(PREF_KEYS.themeMode);
  if (mode === 'light' || mode === 'dark' || mode === 'auto') return mode;
  const legacy = readPref(PREF_KEYS.theme);
  return legacy === 'light' || legacy === 'dark' ? legacy : 'auto';
}

export function readFlag(key: string): boolean {
  return readPref(key) === '1';
}

export function writeFlag(key: string, value: boolean): void {
  writePref(key, value ? '1' : '0');
}
