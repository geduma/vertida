import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { loadCatalog } from '../src/lib/loadData';
import EquipmentIcon, { SUPPORTED_ICON_IDS } from '../src/components/EquipmentIcon';
import { CONFIG } from '../src/config';
import methods from '../src/data/methods.json';
import recipes from '../src/data/recipes.json';
import discovery from '../src/data/discovery.json';

const catalog = loadCatalog(); // zod-parses every data file — a schema break fails here

describe('catalog shape', () => {
  it('exposes every method of methods.json (in order), at least one classic recipe per method and the discovery recipes', () => {
    expect(catalog.methods.map(m => m.id)).toEqual([...CONFIG.equipment]);
    expect(catalog.methods.map(m => m.id)).toEqual(methods.methods.map(m => m.id));
    expect(catalog.recipes.length).toBeGreaterThanOrEqual(catalog.methods.length);
    expect(catalog.discovery).toHaveLength(discovery.recipes.length);
    expect(catalog.discovery.length).toBeGreaterThan(0);
  });

  it('has unique recipe ids across classics and discovery', () => {
    const all = [...catalog.recipes, ...catalog.discovery].map(r => r.id);
    expect(new Set(all).size).toBe(all.length);
  });

  it('every recipe targets an existing method', () => {
    const ids = new Set(catalog.methods.map(m => m.id));
    for (const r of [...catalog.recipes, ...catalog.discovery]) {
      expect(ids.has(r.methodId), `${r.id} → ${r.methodId}`).toBe(true);
    }
  });

  it('every classic recipe belongs to its method and stays within method limits', () => {
    for (const r of catalog.recipes) {
      const limits = catalog.methods.find(m => m.id === r.methodId)?.limits;
      expect(limits, `${r.id} has method limits`).toBeTruthy();
      if (!limits) continue;
      expect(r.coffeeDefaultG).toBeLessThanOrEqual(limits.coffeeMaxG ?? Infinity);
      expect(r.coffeeDefaultG * r.ratio).toBeLessThanOrEqual(limits.waterMaxG);
      expect(r.ratio).toBeGreaterThanOrEqual(limits.ratioMin ?? 1);
      expect(r.ratio).toBeLessThanOrEqual(limits.ratioMax ?? 50);
    }
  });
});

describe('recipe phases', () => {
  const all = [...recipes.recipes, ...discovery.recipes];

  it('accumulate water monotonically and end with a zero-duration done phase', () => {
    for (const r of all) {
      const phases = r.phases;
      for (let i = 1; i < phases.length; i++) {
        expect(phases[i].waterAccumulatedG, `${r.id} phase ${i}`).toBeGreaterThanOrEqual(phases[i - 1].waterAccumulatedG);
      }
      const last = phases[phases.length - 1];
      expect(last.type, `${r.id} ends done`).toBe('done');
      expect(last.durationS, `${r.id} done has 0s`).toBe(0);
    }
  });

  it('never exceed their method water cap by final accumulation', () => {
    for (const r of all) {
      const limits = methods.methods.find(m => m.id === r.methodId)?.limits;
      const final = Math.max(...r.phases.map(p => p.waterAccumulatedG));
      expect(final, `${r.id} final water ≤ cap`).toBeLessThanOrEqual(limits?.waterMaxG ?? Infinity);
    }
  });
});

describe('methods data', () => {
  it('are ordered 1..n with unique ids', () => {
    const ms = methods.methods;
    expect(ms.map(m => m.order)).toEqual(ms.map((_, i) => i + 1));
    expect(new Set(ms.map(m => m.id)).size).toBe(ms.length);
  });

  it('aeropress is capped at 1 cup (single-dose device)', () => {
    const aero = catalog.methods.find(m => m.id === 'aeropress');
    expect(aero?.limits?.cupsMax).toBe(1);
  });

  it('every method has a supported icon that renders as a drawable SVG', () => {
    const supported = SUPPORTED_ICON_IDS as readonly string[];
    const fallback = renderToStaticMarkup(createElement(EquipmentIcon, { id: '__unknown__' }));
    for (const m of catalog.methods) {
      expect(supported.includes(m.icon), `icon "${m.icon}" of ${m.id} is implemented`).toBe(true);
      const svg = renderToStaticMarkup(createElement(EquipmentIcon, { id: m.icon }));
      expect(svg, `${m.id} icon`).toContain('<svg');
      expect((svg.match(/<(path|circle|rect)/g) ?? []).length, `${m.id} icon shapes`).toBeGreaterThanOrEqual(3);
      // Anything other than the french press (the fallback shape) must be drawn on its own
      if (m.icon !== 'prensa') expect(svg, `${m.id} icon is not the fallback`).not.toBe(fallback);
    }
  });
});
