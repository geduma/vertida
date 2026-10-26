import { RecipeSchema, type PhaseType, type Recipe } from './schemas';
import { mapLegacyMethodId } from './legacyIds';

const KEY = 'vertida-custom-recipes';

// Recipes created before the v2 data-contract rename used Spanish field names.
// They are still the user's own recipes: migrate them instead of purging them.
const LEGACY_PHASE_TYPES: Record<string, PhaseType> = {
  bloom: 'bloom',
  vertido: 'pour',
  pour: 'pour',
  espera: 'wait',
  wait: 'wait',
  revolver: 'stir',
  stir: 'stir',
  manual: 'manual',
  fin: 'done',
  done: 'done',
};

function normalizePhase(item: unknown): Record<string, unknown> | null {
  if (!item || typeof item !== 'object') return null;
  const p = item as Record<string, unknown>;
  const type = p.type ?? (typeof p.tipo === 'string' ? LEGACY_PHASE_TYPES[p.tipo] : undefined);
  return {
    type,
    waterAccumulatedG: p.waterAccumulatedG ?? p.aguaAcumuladaG,
    durationS: p.durationS ?? p.duracionS,
    instructionKey: p.instructionKey ?? p.instruccionKey,
  };
}

function normalizeRecipe(r: Record<string, unknown>): Record<string, unknown> | null {
  const rawPhases = Array.isArray(r.phases) ? r.phases : Array.isArray(r.fases) ? r.fases : null;
  if (!rawPhases) return null;
  const category = r.category ?? r.categoria;
  return {
    id: r.id,
    methodId: typeof r.methodId === 'string' ? mapLegacyMethodId(r.methodId) : r.methodId,
    category: category === 'atypical' || category === 'atipica' ? 'atypical' : 'classic',
    nameKey: r.nameKey ?? r.nombreKey,
    ratio: r.ratio,
    coffeeDefaultG: r.coffeeDefaultG ?? r.cafeDefaultG,
    origin: r.origin ?? r.origen ?? 'custom',
    difficulty: r.difficulty ?? r.dificultad,
    tags: r.tags,
    storyKey: r.storyKey ?? r.historiaKey,
    phases: rawPhases.map(normalizePhase).filter((p): p is Record<string, unknown> => p !== null),
    version: r.version ?? 1,
  };
}

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
    { type: 'bloom' as const, waterAccumulatedG: bloom, durationS: 30, instructionKey: 'phase.bloom' },
    { type: 'pour' as const, waterAccumulatedG: pour1, durationS: 60, instructionKey: 'phase.pour' },
    { type: 'pour' as const, waterAccumulatedG: total, durationS: 60, instructionKey: 'phase.pour' },
    { type: 'wait' as const, waterAccumulatedG: total, durationS: 30, instructionKey: 'phase.drain' },
    { type: 'done' as const, waterAccumulatedG: total, durationS: 0, instructionKey: 'phase.done' },
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
    category: 'classic' as const,
    nameKey: `custom.${id}.name`,
    ratio: input.ratio,
    coffeeDefaultG: input.coffeeDefaultG,
    origin: 'custom',
    difficulty: 'homemade',
    tags: ['homemade'],
    phases: buildDefaultPhases(input.coffeeDefaultG, input.ratio),
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
    let migrated = false;
    for (const item of arr) {
      if (!item || typeof item !== 'object') continue;
      const r = item as Record<string, unknown>;
      if (!Array.isArray(r.phases) || typeof r.coffeeDefaultG !== 'number' || typeof r.nameKey !== 'string') {
        migrated = true; // legacy shape, or corrupt enough to need normalization
      }
      // Re-validate base recipe shape (accepting the pre-v2 Spanish field names); purge corrupt
      const base = RecipeSchema.safeParse(normalizeRecipe(r));
      if (!base.success) continue;
      if (typeof r.name !== 'string' || !r.name.trim()) continue;
      out.push({ ...base.data, custom: true, name: r.name.trim(), notes: typeof r.notes === 'string' ? r.notes : undefined });
    }
    // Persist the normalized shape so the migration runs once.
    if (migrated) {
      try { localStorage.setItem(KEY, JSON.stringify(out)); } catch { /* keep working in-memory */ }
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
  return t(r.nameKey);
}
