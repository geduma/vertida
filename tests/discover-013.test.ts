import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

describe('013 discover modal + grouped recipes + water-only dose + timer', () => {
  const src = readFileSync('src/App.tsx', 'utf8');
  const css = readFileSync('src/theme/app.css', 'utf8');
  const modal = readFileSync('src/components/DiscoveryModal.tsx', 'utf8');

  it('discovery modal with close/another/prepare and stable close', () => {
    expect(modal).toContain('onCloseRef');
    expect(modal).toContain("discover.close");
    expect(modal).toContain("discover.another");
    expect(modal).toContain('cta cta-compact');
    expect(src).toContain('pickSurprise');
    expect(src).toContain('setDiscoveryOpen(true)');
  });

  it('recipes render complete and grouped by method order', () => {
    expect(src).toContain('method-group');
    expect(src).toContain('method-group-head');
    expect(src).toContain('a.orden - b.orden');
    expect(src).toContain('setFavOnly(false)');
    expect(css).toContain('.method-group{');
  });

  it('badge reserves room for the heart', () => {
    expect(css).toContain('.recipe-badge{');
    expect(css).toContain('padding-right:48px');
  });

  it('dose has no base selector and shows per-cup equivalence', () => {
    expect(src).not.toContain('calc.base');
    expect(src).toContain('calc.cupEq');
    expect(src).toContain('className="dosis-grid"');
  });

  it('timer has dots, 2x2 actions grid and cancel/back', () => {
    expect(src).toContain('phase-dots');
    expect(src).toContain('timer-actions');
    expect(src).toContain('timer.cancel');
    expect(src).toContain('className="back-link"');
    expect(css).toContain('.timer-actions{display:grid;');
    expect(css).toContain('.phase-dots{');
  });
});
