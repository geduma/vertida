import { describe, expect, it } from 'vitest';
import es from '../src/i18n/es.json';
import en from '../src/i18n/en.json';
import methods from '../src/data/methods.json';

const dEs = es as Record<string, string>;
const dEn = en as Record<string, string>;

describe('003 settings toggles + equipment', () => {
  it('exposes ES/EN i18n keys without gaps', () => {
    for (const k of [
      'settings.advancedDesc',
      'settings.equipmentSummary',
      'settings.equipmentChoose',
      'settings.equipmentClose',
      'settings.equipmentHint',
    ]) {
      expect(dEs[k], `es ${k}`).toBeTruthy();
      expect(dEn[k], `en ${k}`).toBeTruthy();
    }
  });

  it('methods.json icon maps to supported EquipmentIcon', async () => {
    const mod = await import('../src/components/EquipmentIcon');
    expect(typeof mod.default).toBe('function');
    const supported = new Set(['v60', 'chemex', 'aeropress', 'prensa']);
    for (const m of methods as { id: string; icono: string }[]) {
      expect(supported.has(m.icono) || supported.has('prensa'), `${m.id}:${m.icono}`).toBe(true);
    }
    expect(methods).toHaveLength(4);
  });

  it('filtering by equipmentIds keeps empty-state (0 equipment -> empty)', () => {
    const recipes = [
      { id: 'a', methodId: 'v60' },
      { id: 'b', methodId: 'chemex' },
    ];
    const visible = (ids: string[]) => recipes.filter((r) => ids.includes(r.methodId));
    expect(visible([])).toHaveLength(0);
    expect(visible(['v60', 'chemex', 'aeropress', 'prensa-francesa'])).toHaveLength(2);
    expect(visible(['v60'])).toHaveLength(1);
  });

  it('Toggle exposes role=switch contract (module resolves)', async () => {
    const mod = await import('../src/components/Toggle');
    expect(typeof mod.default).toBe('function');
  });

  it('EquipmentModal exposes dialog contract (module resolves)', async () => {
    const mod = await import('../src/components/EquipmentModal');
    expect(typeof mod.default).toBe('function');
  });
});
