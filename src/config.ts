export const CONFIG = {
  appName: 'Vertida',
  locales: ['es', 'en'] as const,
  defaultLocale: 'es' as const,
  unit: 'g' as const,
  ratioMin: 10,
  ratioMax: 20,
  ratioDefault: 16,
  coffeeMaxG: 500,
  waterMaxG: 5000,
  cupsMax: 10,
  gramsPerCup: 210,
  coffeeDefaultG: 15,
  retentionGramsPerGram: 2,
  // Maker credit (US-3) — external link, never inline a URL in components
  creditUrl: 'https://geduma.com',
  // Public project + feedback (Settings rows) — external links, never inline a URL in components
  repoUrl: 'https://github.com/geduma/vertida',
  issuesUrl: 'https://github.com/geduma/vertida/issues/new',
  // Default selection — must mirror methods.json ids in `order` (see tests/catalog.test.ts)
  equipment: [
    'v60',
    'chemex',
    'aeropress',
    'french-press',
    'kalita-wave',
    'siphon',
    'clever-dripper',
    'espresso',
    'moka',
  ],
} as const;
export type Locale = typeof CONFIG.locales[number];
