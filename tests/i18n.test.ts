import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import es from '../src/i18n/es.json';
import en from '../src/i18n/en.json';
import methods from '../src/data/methods.json';
import recipes from '../src/data/recipes.json';
import discovery from '../src/data/discovery.json';

const dEs = es as Record<string, string>;
const dEn = en as Record<string, string>;
const PH = /\{[A-Za-z_]+\}/g;

function placeholders(v: string): string[] {
  return [...v.matchAll(PH)].map(m => m[0]).sort();
}

describe('dictionary parity', () => {
  it('es and en define exactly the same keys', () => {
    const esKeys = Object.keys(dEs).sort();
    const enKeys = Object.keys(dEn).sort();
    expect(enKeys).toEqual(esKeys);
  });

  it('has no empty values in either language', () => {
    for (const k of Object.keys(dEs)) {
      expect(dEs[k].trim(), `es ${k}`).not.toBe('');
      expect(dEn[k].trim(), `en ${k}`).not.toBe('');
    }
  });

  it('uses the same interpolation placeholders in both languages', () => {
    for (const k of Object.keys(dEs)) {
      expect(placeholders(dEn[k]), `placeholders of ${k}`).toEqual(placeholders(dEs[k]));
    }
  });
});

describe('settings copy stability', () => {
  // The Settings rows reserve fixed heights, so both languages must stay in the
  // same ballpark or one of them gets truncated. Keep these pairs close.
  const keys = [
    'settings.advanced',
    'settings.advancedDesc',
    'settings.equipmentChoose',
    'settings.equipmentSummary',
    'settings.feedback',
    'settings.feedbackCta',
    'settings.feedbackDesc',
    'settings.githubDesc',
    'settings.language',
    'settings.localOnly',
    'settings.theme',
    'settings.themeDesc',
    'settings.update',
    'settings.updateCta',
    'settings.updateDesc',
    'settings.updateFailed',
    'settings.updateUnavailable',
    'settings.version',
  ];

  it('keeps ES/EN copy within 8 characters so fixed rows never truncate one language', () => {
    for (const k of keys) {
      expect(Math.abs(dEs[k].length - dEn[k].length), k).toBeLessThanOrEqual(8);
    }
  });
});

/** Classics and discovery in one shape — only discovery rows carry `storyKey`. */
type DataRecipe = { nameKey: string; storyKey?: string; tags?: string[]; phases: { instructionKey: string }[] };
const dataRecipes = (): DataRecipe[] => [...recipes.recipes, ...discovery.recipes] as DataRecipe[];

describe('data ↔ i18n contract', () => {
  const dataKeys = new Set<string>();
  for (const m of methods.methods) {
    dataKeys.add(m.nameKey);
    dataKeys.add(m.descriptionKey);
    dataKeys.add(m.grindKey);
  }
  for (const r of dataRecipes()) {
    dataKeys.add(r.nameKey);
    if (r.storyKey) dataKeys.add(r.storyKey);
    for (const tag of r.tags ?? []) dataKeys.add(`tag.${tag}`);
    for (const p of r.phases) dataKeys.add(p.instructionKey);
  }

  it('every name/description/grind/tag/instruction/story key referenced by data exists in both languages', () => {
    for (const k of dataKeys) {
      expect(dEs[k], `es ${k}`).toBeTruthy();
      expect(dEn[k], `en ${k}`).toBeTruthy();
    }
  });
});

describe('t() literal coverage', () => {
  function srcFiles(dir: string, out: string[] = []): string[] {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, entry.name);
      if (entry.isDirectory()) srcFiles(p, out);
      else if (/\.(ts|tsx)$/.test(entry.name)) out.push(p);
    }
    return out;
  }

  it('every static key passed to t() exists in the dictionaries', () => {
    // Word boundary avoids matching request('screen') etc.
    const T_CALL = /(?<![A-Za-z0-9_$])t\('([^']+)'\)/g;
    const missing: string[] = [];
    for (const file of srcFiles('src')) {
      const content = readFileSync(file, 'utf8');
      for (const [, key] of content.matchAll(T_CALL)) {
        if (!(key in dEs)) missing.push(`${file}: ${key}`);
      }
    }
    expect(missing).toEqual([]);
  });
});
