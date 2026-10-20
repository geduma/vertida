import { z } from 'zod';

export const PhaseType = z.enum(['bloom', 'pour', 'wait', 'stir', 'manual', 'done']);
export type PhaseType = z.infer<typeof PhaseType>;

export const PhaseSchema = z.object({
  type: PhaseType,
  waterAccumulatedG: z.number().int().nonnegative(),
  durationS: z.number().int().nonnegative(),
  instructionKey: z.string().min(1),
}).refine(p => (p.type === 'done' ? p.durationS === 0 : true), {
  message: 'done must have durationS=0',
});

export const MethodLimitsSchema = z.object({
  cupsMax: z.number().int().min(1).max(10),
  // Floor is 60 g: a single espresso dose (the smallest method cap in methods.json)
  waterMaxG: z.number().int().min(60).max(5000),
  coffeeMaxG: z.number().min(1).max(100).optional(),
  ratioMin: z.number().min(1).max(50).optional(),
  ratioMax: z.number().min(1).max(50).optional(),
});

export const MethodParamsSchema = z.object({
  temperatureC: z.number().min(0).max(100).optional(),
  totalTimeS: z.number().int().min(0).optional(),
});

export const MethodSchema = z.object({
  id: z.string().min(1),
  nameKey: z.string().min(1),
  descriptionKey: z.string().min(1),
  icon: z.string().min(1),
  grindKey: z.string().min(1),
  order: z.number().int(),
  limits: MethodLimitsSchema.optional(),
  parameters: MethodParamsSchema.optional(),
});

export const RecipeSchema = z.object({
  id: z.string().min(1),
  methodId: z.string().min(1),
  category: z.enum(['classic', 'atypical']),
  nameKey: z.string().min(1),
  ratio: z.number().min(1).max(50),
  coffeeDefaultG: z.number().positive().max(500),
  origin: z.string().min(1),
  difficulty: z.string().optional(),
  tags: z.array(z.string()).optional(),
  storyKey: z.string().optional(),
  phases: z.array(PhaseSchema).min(2),
  version: z.number().int().min(1),
}).refine(r => (r.category === 'atypical' ? !!r.storyKey : true), {
  message: 'atypical requires storyKey',
});

export type Recipe = z.infer<typeof RecipeSchema>;
export type AppMethod = z.infer<typeof MethodSchema>;
export type Phase = z.infer<typeof PhaseSchema>;
