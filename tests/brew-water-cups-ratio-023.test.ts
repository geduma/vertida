import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

describe('023 brew water-cups slider + ratio step buttons', () => {
  const src = readFileSync('src/App.tsx', 'utf8');
  const es = readFileSync('src/i18n/es.json', 'utf8');
  const en = readFileSync('src/i18n/en.json', 'utf8');

  it('water input is a cups slider 1..cupsMax, default 1 cup, disabled at 1 cup max', () => {
    expect(src).toContain('type="range"');
    expect(src).toContain('min={1}');
    expect(src).toContain('max={cupsMax}');
    expect(src).toContain('step={1}');
    expect(src).toContain('value={cups}');
    expect(src).toContain('disabled={cupsMax === 1}');
    expect(src).toContain('setCups(1)'); // default 1 cup
  });

  it('water shown as selected cups readout via i18n', () => {
    expect(src).toContain("t('calc.waterCups')");
    expect(src).toContain("t('calc.cupsSelected')");
    expect(es).toContain('calc.waterCups');
    expect(es).toContain('calc.cupsSelected');
    expect(en).toContain('calc.waterCups');
    expect(en).toContain('calc.cupsSelected');
  });

  it('ratio uses + / - buttons clamped to method limits, no text input', () => {
    expect(src).toContain('disabled={ratioMin === ratioMax || ratioN <= ratioMin}');
    expect(src).toContain('disabled={ratioMin === ratioMax || ratioN >= ratioMax}');
    expect(src).toContain('aria-label={t(\'calc.ratioMinus\')}');
    expect(src).toContain('aria-label={t(\'calc.ratioPlus\')}');
    expect(src).toContain('className="ratio-stepper"');
    expect(src).toContain('className="ratio-value"');
    expect(src).toContain('adjustRatio');
    expect(src).not.toContain('type="number" value={waterG}');
    expect(src).not.toContain('type="number" value={ratio}');
    expect(src).toContain('clampN((c === \'\' ? ratioN : c)');
  });

  it('derived water/coffee preserved (cups * recipeWaterBaseG)', () => {
    expect(src).toContain('cups * recipeWaterBaseG'); // water per cup comes from the recipe data, not a global constant
    expect(src).toContain('waterGN');
    expect(src).toContain('scaledG'); // recipe phases scale to the selected cups
  });
});
