import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

describe('012 desktop + island + home + cups default', () => {
  const src = readFileSync('src/App.tsx', 'utf8');
  const css = readFileSync('src/theme/app.css', 'utf8');

  it('nav lives inside .app grid (desktop sidebar) and refreshes with lang', () => {
    const appOpen = src.indexOf('<div className="app">');
    const navOpen = src.indexOf('<nav key={lang}');
    expect(navOpen).toBeGreaterThan(appOpen);
    expect(navOpen).toBeLessThan(src.indexOf("{tab === 'home'"));
    expect(css).toContain('.brand-bar{grid-column:1/-1;grid-row:1}');
    expect(css).toContain('grid-row:2');
  });

  it('surprise CTA is blind (no recipe name)', () => {
    expect(src).toContain("{t('home.discoverCta')}</button>");
    expect(src).not.toContain('home.surprise');
  });

  it('pill is opaque glass, single layer, no scrim', () => {
    expect(css).toContain('color-mix(in srgb, var(--tabbar) 82%, transparent)');
    expect(css).toContain('blur(24px)');
    expect(src).not.toContain('tabbar-scrim');
  });

  it('home shows only selected methods without toggling', () => {
    expect(src).toContain('cat.methods.filter(m => equipmentIds.includes(m.id))');
    expect(src).not.toContain('toggleEquipment(m.id)');
    expect(src).toContain("onClick={() => setTab('recipes')}");
  });

  it('dose is water-only with per-cup hint (013)', () => {
    expect(src).not.toContain('waterMode');
    expect(src).not.toContain('calc.byCups');
    expect(src).toContain('data-testid="coffee-from-water"');
    expect(src).toContain('calc.cupEq');
  });

  it('tighter spacing (less empty scroll)', () => {
    expect(css).toContain('.app>section{display:flex;flex-direction:column;gap:16px;');
    expect(css).toContain('gap:16px}');
  });
});
