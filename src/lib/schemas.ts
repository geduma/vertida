import { z } from 'zod';

export const PhaseType = z.enum(['bloom', 'vertido', 'espera', 'agitar', 'manual', 'fin']);
export type PhaseType = z.infer<typeof PhaseType>;

export const PhaseSchema = z.object({
  tipo: PhaseType,
  aguaAcumuladaG: z.number().int().nonnegative(),
  duracionS: z.number().int().nonnegative(),
  instruccionKey: z.string().min(1),
}).refine(p => (p.tipo === 'fin' ? p.duracionS === 0 : true), {
  message: 'fin must have duracionS=0',
});

export const MethodLimitsSchema = z.object({
  tazasMax: z.number().int().min(1).max(10),
  aguaMaxG: z.number().int().min(100).max(5000),
  cafeMaxG: z.number().min(1).max(100).optional(),
  ratioMin: z.number().min(1).max(50).optional(),
  ratioMax: z.number().min(1).max(50).optional(),
});

export const MethodSchema = z.object({
  id: z.string().min(1),
  nombreKey: z.string().min(1),
  descripcionKey: z.string().min(1),
  icono: z.string().min(1),
  moliendaKey: z.string().min(1),
  orden: z.number().int(),
  limites: MethodLimitsSchema.optional(),
});

export const RecipeSchema = z.object({
  id: z.string().min(1),
  methodId: z.string().min(1),
  categoria: z.enum(['clasica', 'atipica']),
  nombreKey: z.string().min(1),
  ratio: z.number().min(1).max(50),
  cafeDefaultG: z.number().positive().max(500),
  origen: z.string().min(1),
  dificultad: z.string().optional(),
  tags: z.array(z.string()).optional(),
  historiaKey: z.string().optional(),
  fases: z.array(PhaseSchema).min(2),
  version: z.number().int().min(1),
}).refine(r => (r.categoria === 'atipica' ? !!r.historiaKey : true), {
  message: 'atipica requires historiaKey',
});

export const ManifestSchema = z.object({
  version: z.number().int().min(1),
  methods: z.array(z.string().min(1)),
  recipes: z.array(z.string().min(1)),
  discovery: z.array(z.string().min(1)),
});

export type Recipe = z.infer<typeof RecipeSchema>;
export type AppMethod = z.infer<typeof MethodSchema>;
export type Phase = z.infer<typeof PhaseSchema>;
