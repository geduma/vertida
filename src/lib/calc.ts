import { CONFIG } from '../config';

export function calcWater(coffeeG: number, ratioN: number): number {
  return Math.round(coffeeG * ratioN);
}
export function calcCoffee(waterG: number, ratioN: number): number {
  return Math.round((waterG / ratioN) * 10) / 10;
}
type CupLimits = { waterMaxG: number; cupsMax: number };

/**
 * Grams of "1 cup" for a method: the method limits are the source of truth
 * (waterMaxG ÷ cupsMax — e.g. 420 ÷ 2 = 210 g on v60), falling back to the
 * global CONFIG when the method carries no limits.
 */
export function methodCupG(limits?: CupLimits): number {
  return limits ? limits.waterMaxG / limits.cupsMax : CONFIG.gramsPerCup;
}
/**
 * Cup size used by the brew slider: the method cup, capped at the recipe's own
 * reference water so a single-dose recipe (espresso 36 g) keeps its dose while
 * multi-cup recipes scale by the method cup (v60: 210 g, never clamped).
 */
export function cupSizeG(recipeBaseG: number, limits?: CupLimits): number {
  return Math.min(recipeBaseG, methodCupG(limits));
}
export function cupsToWater(cups: number, perCup: number = CONFIG.gramsPerCup): number {
  return cups * perCup;
}
export function waterToCups(waterG: number, perCup: number = CONFIG.gramsPerCup): number {
  return Math.round((waterG / perCup) * 10) / 10;
}
/**
 * True when the ratio falls outside the given band. The brew screen passes the
 * active method limits, so the copy ("fuera del rango de este método") stays truthful
 * for methods whose band is unlike the generic 1:10–1:20 (espresso, moka).
 */
export function isRatioWarn(ratioN: number, min: number = CONFIG.ratioMin, max: number = CONFIG.ratioMax): boolean {
  return ratioN < min || ratioN > max;
}
/** Bounds are injectable so callers can validate against the active method limits. */
export function validateCoffee(v: number, max: number = CONFIG.coffeeMaxG): string | null {
  if (!Number.isFinite(v) || v < 1 || v > max) return 'error.coffee-range';
  return null;
}
export function validateWater(v: number, max: number = CONFIG.waterMaxG): string | null {
  if (!Number.isFinite(v) || v < 1 || v > max || !Number.isInteger(v)) return 'error.water-range';
  return null;
}
