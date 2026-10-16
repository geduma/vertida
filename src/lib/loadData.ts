import methods from '../data/methods.json';
import manifest from '../data/manifest.json';
import { ManifestSchema, MethodSchema, RecipeSchema, type Recipe } from './schemas';

// Vite: import all recipe/discovery JSON files
const recipeMods = import.meta.glob('../data/recipes/*.json', { eager: true }) as Record<string, { default: unknown }>;
const discoveryMods = import.meta.glob('../data/discovery/*.json', { eager: true }) as Record<string, { default: unknown }>;

export function loadCatalog() {
  const man = ManifestSchema.parse(manifest);
  const meths = (methods as unknown[]).map(m => MethodSchema.parse(m));
  const byFile = (mods: Record<string, { default: unknown }>) =>
    Object.entries(mods).map(([p, m]) => ({ file: p, data: RecipeSchema.parse(m.default) }));
  const recipes: ({ file: string; data: Recipe })[] = byFile(recipeMods);
  const discovery = byFile(discoveryMods);
  // Check that manifest covers files on disk
  const ids = new Set([...recipes, ...discovery].map(r => r.data.id));
  for (const id of [...man.recipes, ...man.discovery]) {
    if (!ids.has(id)) throw new Error(`manifest id missing file: ${id}`);
  }
  return { manifest: man, methods: meths, recipes: recipes.map(r => r.data), discovery: discovery.map(r => r.data) };
}
