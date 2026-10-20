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
  // Default selection — must mirror methods.json ids in `order` (see tests/catalog.test.ts)
  equipment: [
    'v60',
    'chemex',
    'aeropress',
    'prensa-francesa',
    'kalita-wave',
    'siphon',
    'clever-dripper',
    'espresso',
    'moka',
  ],
} as const;
export type Locale = typeof CONFIG.locales[number];
