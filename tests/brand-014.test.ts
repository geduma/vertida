import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

describe('014 logo redesign + brand in app', () => {
  const logo = readFileSync('public/logo.svg', 'utf8');
  const icon = readFileSync('public/icon.svg', 'utf8');
  const favicon = readFileSync('public/favicon.svg', 'utf8');
  const pinned = readFileSync('public/safari-pinned-tab.svg', 'utf8');
  const src = readFileSync('src/App.tsx', 'utf8');
  const css = readFileSync('src/theme/app.css', 'utf8');
  const brand = readFileSync('src/components/Brand.tsx', 'utf8');
  const html = readFileSync('index.html', 'utf8');
  const browser = readFileSync('public/browserconfig.xml', 'utf8');

  const BANNED = ['#3B2316', '#25120A', '#C46A1F', '#DE8A38', '#E08A3C', '#A85A24', '#B85E1D', '#FFFEFB', '#FFF8F0'];

  it('SVG marks use the black-premium tile with cream glyph', () => {
    for (const svg of [logo, favicon]) {
      expect(svg).toContain('#141414');
      expect(svg).toContain('#F5F0E8');
      for (const c of BANNED) expect(svg).not.toContain(c);
    }
    expect(icon).toContain('#2A2A2A');
    expect(icon).toContain('#0B0B0B');
    expect(icon).toContain('#F5F0E8');
    for (const c of BANNED) expect(icon).not.toContain(c);
    expect(pinned).toContain('M132 145');
  });

  it('mark is centered and abstract (bar + V + drop, no realism)', () => {
    for (const svg of [logo, icon, favicon]) {
      expect(svg).toContain('y="73"');
      expect(svg).toContain('M132 145 L220 301 L292 301 L380 145');
      expect(svg).not.toContain('<ellipse');
      expect(svg).not.toContain('<text');
    }
  });

  it('logo is mark-only with no visible text or wordmark', () => {
    expect(logo).not.toContain('vertida.');
    expect(logo).not.toContain('RECETAS Y TEMPORIZADOR');
    expect(brand).not.toContain('brand-word');
    expect(brand).not.toContain('vertida');
  });

  it('favicon is flat and small-size optimized (no gradients)', () => {
    expect(favicon).not.toContain('Gradient');
    expect(favicon).not.toContain('url(#');
    expect(icon).toContain('linearGradient');
  });

  it('brand mark is mounted in the app and hidden while running', () => {
    expect(src).toContain("import Brand from './components/Brand'");
    expect(src).toContain('<Brand compact={');
    expect(brand).toContain('brand-bar');
    expect(brand).toContain('brand-mark');
    expect(css).toContain('.brand-bar{');
    expect(css).toContain('.brand-mark{');
  });

  it('all platform references use the near-black tile color', () => {
    expect(html).toContain('color="#141414"');
    expect(html).toContain('content="#141414"');
    expect(browser).toContain('#141414');
  });
});
