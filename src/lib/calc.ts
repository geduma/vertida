import { CONFIG } from '../config';

export function calcWater(coffeeG: number, ratioN: number): number {
  return Math.round(coffeeG * ratioN);
}
export function calcCoffee(waterG: number, ratioN: number): number {
  return Math.round((waterG / ratioN) * 10) / 10;
}
export function cupsToWater(cups: number): number {
  return cups * CONFIG.gramsPerCup;
}
export function waterToCups(waterG: number): number {
  return Math.round((waterG / CONFIG.gramsPerCup) * 10) / 10;
}
export function isRatioWarn(ratioN: number): boolean {
  return ratioN < CONFIG.ratioMin || ratioN > CONFIG.ratioMax;
}
export function validateCoffee(v: number): string | null {
  if (!Number.isFinite(v) || v < 1 || v > CONFIG.coffeeMaxG) return 'error.coffee-range';
  return null;
}
export function validateWater(v: number): string | null {
  if (!Number.isFinite(v) || v < 1 || v > CONFIG.waterMaxG || !Number.isInteger(v)) return 'error.water-range';
  return null;
}
