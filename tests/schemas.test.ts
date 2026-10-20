import { describe, expect, it } from 'vitest';
import {
  MethodLimitsSchema,
  MethodSchema,
  PhaseSchema,
  RecipeSchema,
  type Phase,
} from '../src/lib/schemas';

const basePhase: Phase = { type: 'pour', waterAccumulatedG: 100, durationS: 30, instructionKey: 'phase.pour' };

describe('PhaseSchema', () => {
  it('accepts a valid phase', () => {
    expect(PhaseSchema.parse(basePhase)).toEqual(basePhase);
  });

  it('rejects unknown phase types', () => {
    expect(PhaseSchema.safeParse({ ...basePhase, type: 'flip' }).success).toBe(false);
  });

  it('rejects negative or fractional water/duration', () => {
    expect(PhaseSchema.safeParse({ ...basePhase, waterAccumulatedG: -1 }).success).toBe(false);
    expect(PhaseSchema.safeParse({ ...basePhase, durationS: 1.5 }).success).toBe(false);
  });

  it('rejects a missing instruction key', () => {
    expect(PhaseSchema.safeParse({ ...basePhase, instructionKey: '' }).success).toBe(false);
  });

  it('requires done phases to have durationS = 0', () => {
    const done = { ...basePhase, type: 'done', durationS: 0 };
    expect(PhaseSchema.safeParse(done).success).toBe(true);
    expect(PhaseSchema.safeParse({ ...done, durationS: 5 }).success).toBe(false);
  });
});

describe('MethodLimitsSchema', () => {
  it('accepts the app limits envelope', () => {
    expect(MethodLimitsSchema.safeParse({ cupsMax: 4, waterMaxG: 1000, coffeeMaxG: 60, ratioMin: 14, ratioMax: 18 }).success).toBe(true);
  });

  it('rejects cups outside 1..10 and water outside 60..5000', () => {
    expect(MethodLimitsSchema.safeParse({ cupsMax: 0, waterMaxG: 1000 }).success).toBe(false);
    expect(MethodLimitsSchema.safeParse({ cupsMax: 11, waterMaxG: 1000 }).success).toBe(false);
    expect(MethodLimitsSchema.safeParse({ cupsMax: 4, waterMaxG: 50 }).success).toBe(false);
    expect(MethodLimitsSchema.safeParse({ cupsMax: 4, waterMaxG: 6000 }).success).toBe(false);
  });

  it('accepts a single espresso dose cap (the smallest method in methods.json)', () => {
    expect(MethodLimitsSchema.safeParse({ cupsMax: 1, waterMaxG: 60 }).success).toBe(true);
    expect(MethodLimitsSchema.safeParse({ cupsMax: 1, waterMaxG: 59 }).success).toBe(false);
  });

  it('keeps ratio bounds optional', () => {
    expect(MethodLimitsSchema.safeParse({ cupsMax: 1, waterMaxG: 250 }).success).toBe(true);
    expect(MethodLimitsSchema.safeParse({ cupsMax: 1, waterMaxG: 250, ratioMin: 99 }).success).toBe(false);
  });
});

describe('MethodSchema', () => {
  const method = {
    id: 'v60', nameKey: 'method.v60.name', descriptionKey: 'method.v60.desc',
    icon: 'v60', grindKey: 'grind.media', order: 1,
    limits: { cupsMax: 4, waterMaxG: 1000, coffeeMaxG: 60 },
  };

  it('accepts a complete method', () => {
    expect(MethodSchema.safeParse(method).success).toBe(true);
  });

  it('rejects missing identity fields', () => {
    expect(MethodSchema.safeParse({ ...method, id: '' }).success).toBe(false);
    expect(MethodSchema.safeParse({ ...method, icon: '' }).success).toBe(false);
    expect(MethodSchema.safeParse({ ...method, grindKey: '' }).success).toBe(false);
  });
});

describe('RecipeSchema', () => {
  const phases: Phase[] = [
    { type: 'bloom', waterAccumulatedG: 30, durationS: 30, instructionKey: 'phase.bloom' },
    { type: 'done', waterAccumulatedG: 240, durationS: 0, instructionKey: 'phase.done' },
  ];
  const recipe = {
    id: 'test-recipe', methodId: 'v60', category: 'classic', nameKey: 'recipe.test.name',
    ratio: 16, coffeeDefaultG: 15, origin: 'test', phases, version: 1,
  };

  it('accepts a minimal valid classic recipe', () => {
    expect(RecipeSchema.safeParse(recipe).success).toBe(true);
  });

  it('requires at least 2 phases', () => {
    expect(RecipeSchema.safeParse({ ...recipe, phases: phases.slice(0, 1) }).success).toBe(false);
  });

  it('rejects ratio and dose outside bounds', () => {
    expect(RecipeSchema.safeParse({ ...recipe, ratio: 0.5 }).success).toBe(false);
    expect(RecipeSchema.safeParse({ ...recipe, ratio: 51 }).success).toBe(false);
    expect(RecipeSchema.safeParse({ ...recipe, coffeeDefaultG: 0 }).success).toBe(false);
    expect(RecipeSchema.safeParse({ ...recipe, coffeeDefaultG: 501 }).success).toBe(false);
  });

  it('requires storyKey for atypical recipes only', () => {
    expect(RecipeSchema.safeParse({ ...recipe, category: 'atypical' }).success).toBe(false);
    expect(RecipeSchema.safeParse({ ...recipe, category: 'atypical', storyKey: 'recipe.x.story' }).success).toBe(true);
    expect(RecipeSchema.safeParse(recipe).success).toBe(true);
  });

  it('rejects unknown categories and versions below 1', () => {
    expect(RecipeSchema.safeParse({ ...recipe, category: 'weird' }).success).toBe(false);
    expect(RecipeSchema.safeParse({ ...recipe, version: 0 }).success).toBe(false);
  });
});
