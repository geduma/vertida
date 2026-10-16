import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

describe('006 centering + cards + discover', () => {
  it('theme centered in CSS', () => {
    const css = readFileSync('src/theme/app.css', 'utf8');
    expect(css).toContain('.theme-ctl{display:flex;flex-direction:column;align-items:center');
    expect(css).toContain('.theme-ctl .segmented{width:100%;max-width:320px;margin:0 auto}');
  });

  it('recipes without invasive CTA, card with role=button and keyboard', () => {
    const src = readFileSync('src/App.tsx', 'utf8');
    const recipesBlock = src.slice(src.indexOf("{tab === 'recipes'"), src.indexOf("{tab === 'discover'"));
    expect(recipesBlock).toContain('role="button"');
    expect(recipesBlock).toContain('onKeyDown');
    expect(recipesBlock).toContain('stopPropagation');
    // Only the header CTA remains; cards no longer have an invasive CTA
    expect(recipesBlock.match(/cta cta-compact/g)?.length ?? 0).toBe(1);
    expect(recipesBlock).toContain('card-delete');
  });

  it('discover is a modal from home, not a tab or list (011/013)', () => {
    const src = readFileSync('src/App.tsx', 'utf8');
    const modal = readFileSync('src/components/DiscoveryModal.tsx', 'utf8');
    // No discover tab in the island, no discover list view
    expect(src).not.toContain("{tab === 'discover'");
    expect(src).not.toMatch(/id:\s*'discover'/);
    // Home CTA opens DiscoveryModal with close/another/prepare
    expect(src).toContain('DiscoveryModal');
    expect(src).toContain('discoveryOpen');
    expect(modal).toContain('discover.another');
    expect(src).toContain('discover.empty');
  });
});
