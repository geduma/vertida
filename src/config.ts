export const CONFIG = {
  appName: 'Vertida',
  apiBaseUrl: 'https://api.geduma.com',
  // appId format app_<hex12>. Placeholder until Geduma Auth onboarding
  appId: 'app_000000000000',
  redirectUrl: 'https://vertida.geduma.com/auth/callback',
  sessionMaxDays: 30,
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
  equipment: ['v60', 'chemex', 'aeropress', 'prensa-francesa'],
} as const;
export type Locale = typeof CONFIG.locales[number];
