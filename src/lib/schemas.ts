import * as z from 'zod/mini';

export const PhaseType = z.enum(['bloom', 'pour', 'wait', 'stir', 'manual', 'done']);
export type PhaseType = z.infer<typeof PhaseType>;

export const PhaseSchema = z.object({
  type: PhaseType,
  waterAccumulatedG: z.int().check(z.nonnegative()),
  durationS: z.int().check(z.nonnegative()),
  instructionKey: z.string().check(z.minLength(1)),
}).check(z.refine((p: { type: string; durationS: number }) => (p.type === 'done' ? p.durationS === 0 : true), {
  message: 'done must have durationS=0',
}));

export const MethodLimitsSchema = z.object({
  cupsMax: z.int().check(z.minimum(1), z.maximum(10)),
  // Floor is 60 g: a single espresso dose (the smallest method cap in methods.json)
  waterMaxG: z.int().check(z.minimum(60), z.maximum(5000)),
  coffeeMaxG: z.optional(z.number().check(z.minimum(1), z.maximum(100))),
  ratioMin: z.optional(z.number().check(z.minimum(1), z.maximum(50))),
  ratioMax: z.optional(z.number().check(z.minimum(1), z.maximum(50))),
});

export const MethodParamsSchema = z.object({
  temperatureC: z.optional(z.number().check(z.minimum(0), z.maximum(100))),
  totalTimeS: z.optional(z.int().check(z.nonnegative())),
});

export const MethodSchema = z.object({
  id: z.string().check(z.minLength(1)),
  nameKey: z.string().check(z.minLength(1)),
  descriptionKey: z.string().check(z.minLength(1)),
  icon: z.string().check(z.minLength(1)),
  grindKey: z.string().check(z.minLength(1)),
  order: z.int(),
  limits: z.optional(MethodLimitsSchema),
  parameters: z.optional(MethodParamsSchema),
});

export const RecipeSchema = z.object({
  id: z.string().check(z.minLength(1)),
  methodId: z.string().check(z.minLength(1)),
  category: z.enum(['classic', 'atypical']),
  nameKey: z.string().check(z.minLength(1)),
  ratio: z.number().check(z.minimum(1), z.maximum(50)),
  coffeeDefaultG: z.number().check(z.positive(), z.maximum(500)),
  origin: z.string().check(z.minLength(1)),
  difficulty: z.optional(z.string()),
  tags: z.optional(z.array(z.string())),
  storyKey: z.optional(z.string()),
  phases: z.array(PhaseSchema).check(z.minLength(2)),
  version: z.int().check(z.minimum(1)),
}).check(z.refine((r: { category: 'classic' | 'atypical'; storyKey?: string }) => (r.category === 'atypical' ? !!r.storyKey : true), {
  message: 'atypical requires storyKey',
}));

export type Recipe = z.infer<typeof RecipeSchema>;
export type AppMethod = z.infer<typeof MethodSchema>;
export type Phase = z.infer<typeof PhaseSchema>;
