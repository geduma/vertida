import { act, fireEvent, render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import App from '../src/App';
import es from '../src/i18n/es.json';
import en from '../src/i18n/en.json';
import methods from '../src/data/methods.json';
import recipes from '../src/data/recipes.json';
import discovery from '../src/data/discovery.json';

export const dEs = es as Record<string, string>;
export const dEn = en as Record<string, string>;

/** Resolve copy from the es dictionary — never hardcode product strings in tests. */
export const tEs = (k: string): string => dEs[k] ?? k;

export type MethodRow = (typeof methods.methods)[number];
export type RecipeRow = (typeof recipes.recipes)[number];
export type DiscoveryRow = (typeof discovery.recipes)[number];

export const methodsData = methods.methods;
export const recipesData = recipes.recipes;
export const discoveryData = discovery.recipes;

/** Force the initial UI language (App derives it from navigator.language). */
export function setNavigatorLanguage(lang: 'es' | 'en'): void {
  Object.defineProperty(window.navigator, 'language', {
    value: lang === 'es' ? 'es-CO' : 'en-US',
    configurable: true,
  });
}

/** Deterministic Math.random (returns the first value forever); restored in setup afterEach. */
export function stubRandom(value = 0): ReturnType<typeof vi.spyOn> {
  return vi.spyOn(Math, 'random').mockReturnValue(value);
}

/** Render <App /> on the welcome landing screen (no click). */
export function renderLanding(lang: 'es' | 'en' = 'es') {
  setNavigatorLanguage(lang);
  return render(<App />);
}

/** Render <App /> and pass the welcome landing screen. */
export function renderApp(lang: 'es' | 'en' = 'es') {
  const utils = renderLanding(lang);
  fireEvent.click(screen.getByRole('button', { name: tEs('landing.cta') }));
  return utils;
}

/** Flush pending microtasks (IndexedDB effects, etc.) inside act. */
export async function flush(): Promise<void> {
  await act(async () => {});
}
