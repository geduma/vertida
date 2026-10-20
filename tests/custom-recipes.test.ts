import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  buildDefaultPhases,
  createCustomRecipe,
  loadCustomRecipes,
  recipeDisplayName,
  saveCustomRecipes,
} from '../src/lib/customRecipes';
import { RecipeSchema } from '../src/lib/schemas';

const KEY = 'vertida-custom-recipes';

describe('buildDefaultPhases', () => {
  it('generates 5 valid phases ending in done with duration 0', () => {
    const phases = buildDefaultPhases(15, 16);
    expect(phases).toHaveLength(5);
    expect(phases[4]).toMatchObject({ type: 'done', durationS: 0, waterAccumulatedG: 240 });
  });

  it('scales water targets: bloom = 2×coffee, first pour = 60% of total', () => {
    const phases = buildDefaultPhases(15, 16);
    expect(phases[0].waterAccumulatedG).toBe(30); // 15 × 2
    expect(phases[1].waterAccumulatedG).toBe(144); // 240 × 0.6
    expect(phases[2].waterAccumulatedG).toBe(240); // 15 × 16
  });

  it('keeps accumulated water non-decreasing across phases', () => {
    const phases = buildDefaultPhases(30, 16);
    for (let i = 1; i < phases.length; i++) {
      expect(phases[i].waterAccumulatedG).toBeGreaterThanOrEqual(phases[i - 1].waterAccumulatedG);
    }
  });

  it('produces phases that satisfy the zod contract inside a full recipe', () => {
    const recipe = createCustomRecipe({ name: 'Phases check', methodId: 'v60', ratio: 16, coffeeDefaultG: 15 });
    const stripped = { ...recipe, custom: undefined, name: undefined, notes: undefined };
    expect(() => RecipeSchema.parse(stripped)).not.toThrow();
  });
});

describe('createCustomRecipe', () => {
  it('builds a valid recipe with trimmed display name', () => {
    const r = createCustomRecipe({ name: '  Café de la abuela  ', methodId: 'v60', ratio: 16, coffeeDefaultG: 15 });
    expect(r.custom).toBe(true);
    expect(r.name).toBe('Café de la abuela');
    expect(r.origin).toBe('custom');
    expect(r.version).toBe(1);
    expect(r.notes).toBeUndefined();
  });

  it('slugifies accents and symbols into the id', () => {
    const r = createCustomRecipe({ name: 'Café Ñ & Tostado!', methodId: 'v60', ratio: 16, coffeeDefaultG: 15 });
    expect(r.id.startsWith('custom-cafe-n-tostado-')).toBe(true);
  });

  it('falls back to "homemade" when the name has no alphanumerics', () => {
    const r = createCustomRecipe({ name: '!!!', methodId: 'v60', ratio: 16, coffeeDefaultG: 15 });
    expect(r.id.startsWith('custom-homemade-')).toBe(true);
  });

  it('keeps notes when provided and drops blank notes', () => {
    expect(createCustomRecipe({ name: 'A', methodId: 'v60', ratio: 16, coffeeDefaultG: 15, notes: ' con canela ' }).notes).toBe('con canela');
    expect(createCustomRecipe({ name: 'A', methodId: 'v60', ratio: 16, coffeeDefaultG: 15, notes: '   ' }).notes).toBeUndefined();
  });

  it('rejects invalid ranges through the schema', () => {
    expect(() => createCustomRecipe({ name: 'x', methodId: 'v60', ratio: 0, coffeeDefaultG: 15 })).toThrow();
    expect(() => createCustomRecipe({ name: 'x', methodId: 'v60', ratio: 51, coffeeDefaultG: 15 })).toThrow();
    expect(() => createCustomRecipe({ name: 'x', methodId: 'v60', ratio: 16, coffeeDefaultG: 0 })).toThrow();
    expect(() => createCustomRecipe({ name: 'x', methodId: 'v60', ratio: 16, coffeeDefaultG: 501 })).toThrow();
  });
});

describe('custom recipe persistence', () => {
  beforeEach(() => localStorage.clear());

  it('round-trips a recipe through localStorage', () => {
    const a = createCustomRecipe({ name: 'Homemade 1', methodId: 'v60', ratio: 15, coffeeDefaultG: 18, notes: 'note' });
    saveCustomRecipes([a]);
    const loaded = loadCustomRecipes();
    expect(loaded).toHaveLength(1);
    expect(loaded[0]).toMatchObject({ id: a.id, name: 'Homemade 1', notes: 'note', custom: true });
  });

  it('purges corrupt entries and keeps valid ones', () => {
    const a = createCustomRecipe({ name: 'Valid', methodId: 'v60', ratio: 15, coffeeDefaultG: 18 });
    const withoutName: Record<string, unknown> = { ...a };
    delete withoutName.name; // truly missing display name
    localStorage.setItem(KEY, JSON.stringify([
      { id: 'bad', methodId: 'v60' },            // fails schema
      { ...a },                                   // valid
      { ...a, id: 'no-name', name: '' },          // empty display name
      { ...withoutName, id: 'no-name-2' },        // missing name field
    ]));
    const loaded = loadCustomRecipes();
    expect(loaded).toHaveLength(1);
    expect(loaded[0].id).toBe(a.id);
  });

  it('returns [] for broken JSON or non-array payloads', () => {
    localStorage.setItem(KEY, '{no-json');
    expect(loadCustomRecipes()).toEqual([]);
    localStorage.setItem(KEY, '{"a":1}');
    expect(loadCustomRecipes()).toEqual([]);
  });

  it('survives a throwing localStorage without white-screening', () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('quota'); });
    expect(() => saveCustomRecipes([])).not.toThrow();
    spy.mockRestore();
    expect(loadCustomRecipes()).toEqual([]);
  });
});

describe('recipeDisplayName', () => {
  it('uses the literal name for custom recipes in any language', () => {
    const c = createCustomRecipe({ name: 'Mi invención ñ', methodId: 'chemex', ratio: 16, coffeeDefaultG: 15 });
    expect(recipeDisplayName(c, (k) => k)).toBe('Mi invención ñ');
    expect(recipeDisplayName(c, (k) => `EN:${k}`)).toBe('Mi invención ñ');
  });

  it('resolves official recipes through their i18n key', () => {
    const official = { id: 'v60-clasica', nameKey: 'recipe.v60-clasica.name' } as never;
    expect(recipeDisplayName(official, (k) => `T:${k}`)).toBe('T:recipe.v60-clasica.name');
  });
});
