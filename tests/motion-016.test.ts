import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

describe('016 mobile + desktop design, animations & fluidity', () => {
  const src = readFileSync('src/App.tsx', 'utf8');
  const css = readFileSync('src/theme/app.css', 'utf8');

  it('defines motion tokens in :root', () => {
    expect(css).toContain('--motion-fast:150ms');
    expect(css).toContain('--motion-normal:300ms');
    expect(css).toContain('--motion-slow:500ms');
    expect(css).toContain('--ease:cubic-bezier(0.2,0,0,1)');
  });

  it('defines motion keyframes (fadeIn, fadeOut, slideUp, phasePulse, btnPress)', () => {
    expect(css).toContain('@keyframes fadeIn');
    expect(css).toContain('@keyframes fadeOut');
    expect(css).toContain('@keyframes slideUp');
    expect(css).toContain('@keyframes phasePulse');
    expect(css).toContain('@keyframes btnPress');
  });

  it('defines motion utility classes (screen-enter, screen-exit, reveal, dot-flash, btn-pressed)', () => {
    expect(css).toContain('.screen-enter');
    expect(css).toContain('.screen-exit');
    expect(css).toContain('.reveal');
    expect(css).toContain('.dot-flash');
    expect(css).toContain('.btn-pressed');
  });

  it('ring sweeps smoothly via --p transition', () => {
    expect(css).toContain('transition:--p var(--motion-normal) var(--ease)');
  });

  it('prefers-reduced-motion zeros out animation and transition', () => {
    expect(css).toContain('@media(prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important;scroll-behavior:auto!important}}');
  });

  it('brew screens use screen-enter motion class', () => {
    expect(src).toContain('className="brew-screen screen-enter"');
    expect(src).toContain('className="surface screen-enter"');
    expect(src).toContain('className="surface timer-col screen-enter"');
  });

  it('phase dot flashes on phase change via dot-flash', () => {
    expect(src).toContain("className={i === timer.idx && phaseFlash ? 'dot-flash' : ''}");
    expect(src).toContain('phaseFlash');
  });

  it('home method cards render visible on mount (no reveal animation)', () => {
    expect(src).toContain('className="method-card"');
    expect(src).not.toContain('className="method-card reveal"');
  });

  it('recipe cards render visible on mount (no reveal animation)', () => {
    expect(src).toContain('className="recipe-card"');
    expect(src).not.toContain('className="recipe-card reveal"');
  });

  it('desktop keeps recipes in grid and tabbar sidebar', () => {
    expect(css).toContain('.recipes-list{grid-template-columns:repeat(auto-fit, minmax(240px, 1fr))}');
    expect(css).toContain('grid-column:1');
  });
});
