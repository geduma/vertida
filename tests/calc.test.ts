import { describe, expect, it } from 'vitest';
import {
  calcCoffee,
  calcWater,
  cupSizeG,
  cupsToWater,
  isRatioWarn,
  methodCupG,
  validateCoffee,
  validateWater,
  waterToCups,
} from '../src/lib/calc';
import { CONFIG } from '../src/config';

describe('calcWater', () => {
  it('computes water from coffee dose and ratio', () => {
    expect(calcWater(15, 16)).toBe(240);
    expect(calcWater(30, 16)).toBe(480);
  });

  it('rounds to whole grams', () => {
    expect(calcWater(17, 13)).toBe(221); // 221 exact
    expect(calcWater(15.5, 13)).toBe(202); // 201.5 rounds to 202
  });
});

describe('calcCoffee', () => {
  it('derives the dose from water and ratio', () => {
    expect(calcCoffee(240, 16)).toBe(15);
    expect(calcCoffee(220, 13)).toBeCloseTo(16.9, 1);
  });

  it('rounds to one decimal', () => {
    expect(calcCoffee(420, 16)).toBe(26.3); // 26.25 → 26.3
    expect(calcCoffee(720, 16)).toBe(45);
  });
});

describe('cups conversion', () => {
  it('cupsToWater uses CONFIG.gramsPerCup (210 g) by default and an explicit per-cup otherwise', () => {
    expect(CONFIG.gramsPerCup).toBe(210);
    expect(cupsToWater(1)).toBe(210);
    expect(cupsToWater(2)).toBe(420);
    expect(cupsToWater(2, 60)).toBe(120); // explicit per-cup (espresso: 60 g per cup)
  });

  it('waterToCups rounds to one decimal', () => {
    expect(waterToCups(420)).toBe(2);
    expect(waterToCups(500)).toBe(2.4);
    expect(waterToCups(60, 60)).toBe(1);
  });
});

describe('cup size (method limits are the source of truth)', () => {
  const v60 = { waterMaxG: 420, cupsMax: 2 };      // 1 cup = 210 g
  const espresso = { waterMaxG: 60, cupsMax: 1 };  // 1 cup = 60 g

  it('methodCupG derives the cup from waterMaxG ÷ cupsMax', () => {
    expect(methodCupG(v60)).toBe(210);
    expect(methodCupG({ waterMaxG: 840, cupsMax: 4 })).toBe(210);
    expect(methodCupG(espresso)).toBe(60);
  });

  it('methodCupG falls back to CONFIG.gramsPerCup without limits', () => {
    expect(methodCupG()).toBe(CONFIG.gramsPerCup);
  });

  it('cupSizeG caps the method cup at the recipe reference water', () => {
    // v60-clasica (240 g base) is scaled down to the method cup → 2 cups = 420 g, never clamped
    expect(cupSizeG(240, v60)).toBe(210);
    // espresso-clasica (36 g base) keeps its dose: below the method cup
    expect(cupSizeG(36, espresso)).toBe(36);
    // aeropress recipe base 208 g stays under the 210 g method cup
    expect(cupSizeG(208, { waterMaxG: 210, cupsMax: 1 })).toBe(208);
  });

  it('cupSizeG falls back to the global cup without limits', () => {
    expect(cupSizeG(300)).toBe(210);
  });
});

describe('isRatioWarn', () => {
  it('warns outside CONFIG range [10, 20]', () => {
    expect(isRatioWarn(9.9)).toBe(true);
    expect(isRatioWarn(20.1)).toBe(true);
  });

  it('accepts boundaries and typical ratios', () => {
    expect(isRatioWarn(CONFIG.ratioMin)).toBe(false);
    expect(isRatioWarn(CONFIG.ratioMax)).toBe(false);
    expect(isRatioWarn(16)).toBe(false);
  });

  it('compares against an explicit band when one is given (method limits)', () => {
    // espresso band 1.5–2.5: in band is fine, and the generic 10–20 band no longer applies
    expect(isRatioWarn(2, 1.5, 2.5)).toBe(false);
    expect(isRatioWarn(3, 1.5, 2.5)).toBe(true);
    expect(isRatioWarn(1.4, 1.5, 2.5)).toBe(true);
    // moka band 6–8
    expect(isRatioWarn(7, 6, 8)).toBe(false);
    expect(isRatioWarn(2, 6, 8)).toBe(true);
  });

  it('warns but still allows the calculation upstream', () => {
    expect(isRatioWarn(25)).toBe(true);
    expect(calcWater(15, 25)).toBe(375);
  });
});

describe('validateCoffee', () => {
  it('accepts doses inside [1, coffeeMaxG]', () => {
    expect(validateCoffee(1)).toBeNull();
    expect(validateCoffee(15)).toBeNull();
    expect(validateCoffee(CONFIG.coffeeMaxG)).toBeNull();
  });

  it('rejects out-of-range and non-finite values', () => {
    expect(validateCoffee(0)).toBe('error.coffee-range');
    expect(validateCoffee(501)).toBe('error.coffee-range');
    expect(validateCoffee(NaN)).toBe('error.coffee-range');
    expect(validateCoffee(Infinity)).toBe('error.coffee-range');
  });

  it('validates against an explicit bound when one is given (method limits)', () => {
    expect(validateCoffee(22, 22)).toBeNull(); // espresso coffeeMaxG
    expect(validateCoffee(23, 22)).toBe('error.coffee-range');
    expect(validateCoffee(30, 30)).toBeNull(); // v60 coffeeMaxG
    expect(validateCoffee(31, 30)).toBe('error.coffee-range');
  });
});

describe('validateWater', () => {
  it('accepts whole grams inside [1, waterMaxG]', () => {
    expect(validateWater(1)).toBeNull();
    expect(validateWater(240)).toBeNull();
    expect(validateWater(CONFIG.waterMaxG)).toBeNull();
  });

  it('rejects fractional, out-of-range and non-finite values', () => {
    expect(validateWater(240.5)).toBe('error.water-range');
    expect(validateWater(0)).toBe('error.water-range');
    expect(validateWater(5001)).toBe('error.water-range');
    expect(validateWater(NaN)).toBe('error.water-range');
  });
});
