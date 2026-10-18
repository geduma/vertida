import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

describe('017 desktop redesign (fluid, friendly, functional)', () => {
  const css = readFileSync('src/theme/app.css', 'utf8');
  const src = readFileSync('src/App.tsx', 'utf8');

  it('desktop sidebar stays in grid col 1 sticky, content col 2', () => {
    expect(css).toContain('grid-column:1');
    expect(css).toContain('grid-template-columns:minmax(260px, 340px) minmax(0, 1fr)');
    expect(css).toContain('.app>section{grid-column:2');
  });

  it('desktop recipe grid is fluid auto-fit (2-col at 1024px, more columns wider)', () => {
    expect(css).toContain('.recipes-list{grid-template-columns:repeat(auto-fit, minmax(240px, 1fr))}');
  });

  it('brew timer centered max-width 560px on desktop', () => {
    expect(css).toContain('.timer-col{max-width:560px;margin:0 auto;width:100%}');
    expect(css).toContain('.mega{font-size:clamp(48px, 8vw, 72px)}');
  });

  it('desktop modals max-width 520px centered, footer Save/Cancel one line (no X)', () => {
    expect(css).toContain('.modal{max-width:520px}');
    expect(css).toContain('.modal-foot{justify-content:flex-end}');
    expect(css).not.toContain('modal-close');
  });

  it('desktop cards have hover affordance and comfortable sizing', () => {
    expect(css).toContain('.recipe-card:hover');
    expect(css).toContain('.method-card:hover');
    expect(css).toContain('min-height:140px');   // .recipe-card desktop
    expect(css).toContain('min-height:100px');   // .method-card desktop
  });

  it('mobile (<1024px) Liquid Glass pill tabbar unchanged', () => {
    expect(css).toContain('position:fixed;left:12px;right:12px;bottom:');
    expect(css).toContain('border-radius:999px');
    expect(css).toContain('backdrop-filter:blur(24px)');
  });

  it('prefers-reduced-motion block still zeros all motion globally', () => {
    expect(css).toContain('@media(prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important;scroll-behavior:auto!important}}');
  });

  it('no hardcoded desktop UI strings; copy via i18n', () => {
    expect(src).not.toContain('Inicio');
    expect(src).not.toContain('Recetas');
    expect(src).not.toContain('Ajustes');
  });
});
