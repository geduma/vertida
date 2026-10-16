import { RecipeSchema, type Recipe } from './schemas';

const KEY = 'vertida-custom-recipes';

export type CustomRecipe = Recipe & { custom: true; name: string; notes?: string };

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40) || 'homemade';
}

export function buildDefaultPhases(coffeeG: number, ratio: number) {
  const total = Math.round(coffeeG * ratio);
  const bloom = Math.round(coffeeG * 2);
  const pour1 = Math.round(total * 0.6);
  return [
    { tipo: 'bloom' as const, aguaAcumuladaG: bloom, duracionS: 30, instruccionKey: 'phase.bloom' },
    { tipo: 'vertido' as const, aguaAcumuladaG: pour1, duracionS: 60, instruccionKey: 'phase.pour' },
    { tipo: 'vertido' as const, aguaAcumuladaG: total, duracionS: 60, instruccionKey: 'phase.pour' },
    { tipo: 'espera' as const, aguaAcumuladaG: total, duracionS: 30, instruccionKey: 'phase.drain' },
    { tipo: 'fin' as const, aguaAcumuladaG: total, duracionS: 0, instruccionKey: 'phase.done' },
  ];
}

export function createCustomRecipe(input: {
  name: string;
  methodId: string;
  ratio: number;
  coffeeDefaultG: number;
  notes?: string;
}): CustomRecipe {
  const id = `custom-${slugify(input.name)}-${Date.now().toString(36)}`;
  const raw = {
    id,
    methodId: input.methodId,
    categoria: 'clasica' as const,
    nombreKey: `custom.${id}.name`,
    ratio: input.ratio,
    cafeDefaultG: input.coffeeDefaultG,
    origen: 'custom',
    dificultad: 'homemade',
    tags: ['homemade'],
    fases: buildDefaultPhases(input.coffeeDefaultG, input.ratio),
    version: 1,
  };
  const parsed = RecipeSchema.parse(raw);
  return { ...parsed, custom: true, name: input.name.trim(), notes: input.notes?.trim() || undefined };
}

export function loadCustomRecipes(): CustomRecipe[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as unknown[];
    if (!Array.isArray(arr)) return [];
    const out: CustomRecipe[] = [];
    for (const item of arr) {
      const r = item as Record<string, unknown>;
      // Re-validate base recipe shape; purge corrupt
      const base = RecipeSchema.safeParse({
        id: r.id, methodId: r.methodId, categoria: r.categoria ?? 'clasica',
        nombreKey: r.nombreKey, ratio: r.ratio, cafeDefaultG: r.cafeDefaultG,
        origen: r.origen ?? 'custom', dificultad: r.dificultad, tags: r.tags,
        historiaKey: r.historiaKey, fases: r.fases, version: r.version ?? 1,
      });
      if (!base.success) continue;
      if (typeof r.name !== 'string' || !r.name.trim()) continue;
      out.push({ ...base.data, custom: true, name: r.name.trim(), notes: typeof r.notes === 'string' ? r.notes : undefined });
    }
    return out;
  } catch {
    return [];
  }
}

export function saveCustomRecipes(list: CustomRecipe[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    // storage full/blocked → keep in-memory only, no white screen
  }
}

export function recipeDisplayName(r: Recipe & { custom?: boolean; name?: string }, t: (k: string) => string): string {
  const c = r as CustomRecipe;
  if (c.custom && c.name) return c.name;
  return t(r.nombreKey);
}
