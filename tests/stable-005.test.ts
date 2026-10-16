import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import es from '../src/i18n/es.json';
import en from '../src/i18n/en.json';

const dEs = es as Record<string, string>;
const dEn = en as Record<string, string>;

describe('005 stable settings + footer modals', () => {
  it('exposes new ES/EN keys', () => {
    for (const k of ['settings.equipmentSave', 'settings.themeCurrent']) {
      expect(dEs[k], `es ${k}`).toBeTruthy();
      expect(dEn[k], `en ${k}`).toBeTruthy();
    }
  });

  it('EquipmentModal without top X, with Save in footer that closes', async () => {
    const src = readFileSync('src/components/EquipmentModal.tsx', 'utf8');
    expect(src).not.toContain('modal-close');
    expect(src).not.toContain('equipmentClose');
    expect(src).toContain('modal-foot');
    expect(src).toContain('equipmentSave');
    expect(src).toContain('onClose');
    const mod = await import('../src/components/EquipmentModal');
    expect(typeof mod.default).toBe('function');
  });

  it('RecipeCreateModal only Cancel+Save on one line, no X', async () => {
    const src = readFileSync('src/components/RecipeCreateModal.tsx', 'utf8');
    expect(src).not.toContain('modal-close');
    expect(src).toContain('modal-foot');
    expect(src).toContain("recipes.cancel");
    expect(src).toContain("recipes.save");
    const mod = await import('../src/components/RecipeCreateModal');
    expect(typeof mod.default).toBe('function');
  });

  it('App theme with fixed sub-label below, no suffix inside the button', () => {
    const src = readFileSync('src/App.tsx', 'utf8');
    expect(src).toContain('theme-ctl');
    expect(src).toContain('theme-current');
    expect(src).toContain('themeCurrent');
    // no dynamic suffix inside the button that changes its width
    expect(src).not.toMatch(/Auto.*·.*resolvedTheme.*button|m === 'auto' \?[^:]*·/s);
  });

  it('CSS: fixed 2-col recipes (3-col desktop), sticky header, fixed ES/EN widths', () => {
    const css = readFileSync('src/theme/app.css', 'utf8');
    expect(css).toContain('repeat(2,minmax(0,1fr))');
    expect(css).toContain('.recipes-grid');
    expect(css).toContain('.recipes-list{display:grid');
    // 011: 3-col allowed only in the desktop (1024px) block
    const base = css.split('@media(min-width:1024px)')[0];
    expect(base).not.toContain('repeat(3,minmax');
    expect(css).toContain('.modal-head{position:sticky');
    expect(css).toContain('.modal-foot');
    expect(css).toContain('.theme-current');
    expect(css).toContain('.theme-ctl .segmented');
    expect(css).toContain('background-position:right 12px center');
    expect(css).toContain('white-space:nowrap');
  });
});
