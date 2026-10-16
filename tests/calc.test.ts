import { describe, it, expect } from 'vitest';
import { calcWater, calcCoffee, cupsToWater, isRatioWarn } from '../src/lib/calc';

describe('AC-01 ratio 1:16 15g -> 240g', () => {
  it('water', () => expect(calcWater(15, 16)).toBe(240));
});
describe('AC-03 warn without block', () => {
  it('1:25 warn', () => expect(isRatioWarn(25)).toBe(true));
  it('1:16 ok', () => expect(isRatioWarn(16)).toBe(false));
  it('still computes with warn', () => expect(calcWater(15, 25)).toBe(375));
});
describe('cups 210g', () => {
  it('2 cups = 420g', () => expect(cupsToWater(2)).toBe(420));
  it('coffee from cups', () => expect(calcCoffee(420, 16)).toBeCloseTo(26.3, 1));
});
