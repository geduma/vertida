import methods from '../data/methods.json';
import recipes from '../data/recipes.json';
import discovery from '../data/discovery.json';
import { MethodSchema, RecipeSchema, type Recipe, type AppMethod } from './schemas';

export function loadCatalog() {
  const methodsList = (methods.methods as unknown[]).map(m => MethodSchema.parse(m));
  const recipesList = (recipes.recipes as unknown[]).map(r => RecipeSchema.parse(r));
  const discoveryList = (discovery.recetas as unknown[]).map(r => RecipeSchema.parse(r));
  return { methods: methodsList, recipes: recipesList, discovery: discoveryList };
}

export type { Recipe, AppMethod };
