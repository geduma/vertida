import { describe, expect, it, beforeEach } from 'vitest';
import es from '../src/i18n/es.json';
import en from '../src/i18n/en.json';
import { buildDefaultPhases, createCustomRecipe, loadCustomRecipes, recipeDisplayName, saveCustomRecipes } from '../src/lib/customRecipes';
import { RecipeSchema } from '../src/lib/schemas';

const dEs = es as Record<string, string>;
const dEn = en as Record<string, string>;

// localStorage stub for node env (vitest without happy-dom)
if (typeof (globalThis as Record<string, unknown>).localStorage === 'undefined') {
  const store = new Map<string, string>();
  (globalThis as Record<string, unknown>).localStorage = {
    getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
    setItem: (k: string, v: string) => { store.set(k, String(v)); },
    removeItem: (k: string) => { store.delete(k); },
    clear: () => { store.clear(); },
  };
}

describe('004 settings + recipes polish', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('exposes new ES/EN i18n keys without gaps', () => {
    for (const k of [
      'settings.themeDesc',
      'recipes.new',
      'recipes.create',
      'recipes.createHint',
      'recipes.save',
      'recipes.cancel',
      'recipes.fieldName',
      'recipes.fieldNotes',
      'recipes.customBadge',
      'recipes.delete',
      'error.required',
      'error.ratio-range',
    ]) {
      expect(dEs[k], `es ${k}`).toBeTruthy();
      expect(dEn[k], `en ${k}`).toBeTruthy();
    }
  });

  it('buildDefaultPhases generates 5 valid scaled phases', () => {
    const fases = buildDefaultPhases(15, 16);
    expect(fases).toHaveLength(5);
    expect(fases[fases.length - 1]).toMatchObject({ type: 'done', durationS: 0 });
    expect(fases[0].waterAccumulatedG).toBe(30); // 15*2 bloom
    expect(fases[2].waterAccumulatedG).toBe(240); // 15*16 total
    // validate against schema via full recipe
    const r = createCustomRecipe({ name: 'My V60', methodId: 'v60', ratio: 16, coffeeDefaultG: 15 });
    expect(() => RecipeSchema.parse({ ...r, custom: undefined, name: undefined, notes: undefined })).not.toThrow();
  });

  it('createCustomRecipe validates ranges (throws on invalid)', () => {
    expect(() => createCustomRecipe({ name: 'x', methodId: 'v60', ratio: 0, coffeeDefaultG: 15 })).toThrow();
    expect(() => createCustomRecipe({ name: 'x', methodId: 'v60', ratio: 16, coffeeDefaultG: 0 })).toThrow();
    expect(() => createCustomRecipe({ name: 'x', methodId: 'v60', ratio: 16, coffeeDefaultG: 501 })).toThrow();
  });

  it('persistence round-trip + corrupt purge without white screen', () => {
    const a = createCustomRecipe({ name: 'Homemade 1', methodId: 'v60', ratio: 15, coffeeDefaultG: 18, notes: 'note' });
    saveCustomRecipes([a]);
    expect(loadCustomRecipes()).toHaveLength(1);
    expect(loadCustomRecipes()[0].name).toBe('Homemade 1');
    // corrupt
    localStorage.setItem('vertida-custom-recipes', JSON.stringify([{ id: 'bad', methodId: 'v60' }, { ...a }]));
    const loaded = loadCustomRecipes();
    expect(loaded).toHaveLength(1);
    expect(loaded[0].id).toBe(a.id);
    // broken JSON
    localStorage.setItem('vertida-custom-recipes', '{no-json');
    expect(loadCustomRecipes()).toEqual([]);
  });

  it('recipeDisplayName uses custom literal in both languages', () => {
    const c = createCustomRecipe({ name: 'My invention ñ', methodId: 'chemex', ratio: 16, coffeeDefaultG: 15 });
    const t = (k: string) => k;
    expect(recipeDisplayName(c, t)).toBe('My invention ñ');
    expect(recipeDisplayName({ id: 'v60-clasica', nameKey: 'recipe.v60-clasica.name' } as never, (k: string) => `T:${k}`)).toBe('T:recipe.v60-clasica.name');
  });

  it('RecipeCreateModal exposes dialog contract', async () => {
    const mod = await import('../src/components/RecipeCreateModal');
    expect(typeof mod.default).toBe('function');
  });
});
