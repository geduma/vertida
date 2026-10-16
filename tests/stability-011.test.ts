import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

describe('011 brew back + limits + island + home + favorites', () => {
  const src = readFileSync('src/App.tsx', 'utf8');
  const css = readFileSync('src/theme/app.css', 'utf8');

  it('back-link aesthetic in brew summary + preview', () => {
    expect(css).toContain('.back-link{');
    expect(src).toContain('className="back-link"');
  });

  it('single-value limits disable the input (013 water-only)', () => {
    expect(src).toContain('disabled={waterMaxG === 1}');
    expect(src).toContain('disabled={ratioMin === ratioMax}');
  });

  it('dose inputs share one uniform grid', () => {
    expect(css).toContain('.dosis-grid{display:grid;');
    expect(src).toContain('className="dosis-grid"');
  });

  it('island always mounted, hidden by class; no scrim (HIG single layer)', () => {
    expect(src).not.toContain('tabbar-scrim');
    expect(src).toContain('is-hidden');
    expect(css).not.toContain('.tabbar-scrim{position:fixed');
  });

  it('timer resets on recipe change and running view is guarded', () => {
    const timer = readFileSync('src/lib/useTimer.ts', 'utf8');
    expect(timer).toContain('resetKey');
    expect(src).toContain('useTimer(recipe.fases, muted, recipeId)');
    expect(src).toContain('recipe.fases[timer.idx] ?? recipe.fases[0]');
  });

  it('modals use stable close callbacks (no focus steal per render)', () => {
    for (const f of ['src/components/EquipmentModal.tsx', 'src/components/RecipeCreateModal.tsx']) {
      const s = readFileSync(f, 'utf8');
      expect(s).toContain('onCloseRef');
      expect(s).not.toMatch(/\[open,\s*onClose,/);
    }
  });

  it('home method cards show selected equipment without toggling (012 vitrine)', () => {
    expect(src).toContain('toggleEquipment');
    expect(src).toContain('cat.methods.filter(m => equipmentIds.includes(m.id))');
    expect(src).not.toContain('toggleEquipment(m.id)');
  });

  it('favorites: lib + heart + filter', () => {
    const fav = readFileSync('src/lib/favorites.ts', 'utf8');
    expect(fav).toContain('vertida-favorites');
    expect(fav).toContain('toggleFavorite');
    expect(src).toContain('className="fav-btn"');
    expect(src).toContain('aria-pressed={favIds.includes(r.id)}');
    expect(src).toContain('recipes.favorites');
    expect(src).toContain('favOnly');
  });

  it('suggested prioritizes favorites with stable random pick', () => {
    expect(src).toContain('favPool');
    expect(src).toContain('suggestedRoll');
    expect(src).toContain('homePool');
  });

  it('aeropress limited to 1 cup in base JSON with schema', () => {
    const methods = JSON.parse(readFileSync('src/data/methods.json', 'utf8'));
    const aero = methods.find((m: { id: string }) => m.id === 'aeropress');
    expect(aero.limites.tazasMax).toBe(1);
    const schemas = readFileSync('src/lib/schemas.ts', 'utf8');
    expect(schemas).toContain('MethodLimitsSchema');
  });

  it('recipes list is 2-col grid', () => {
    expect(css).toContain('.recipes-list{display:grid;');
    expect(css).toContain('grid-template-columns:repeat(2,minmax(0,1fr))');
  });
});
