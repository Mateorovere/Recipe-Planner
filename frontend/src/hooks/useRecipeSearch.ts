import { useQuery } from "@tanstack/react-query";

import { getRecipe, searchRecipes } from "../api/recipes";
import type { RecipeSearchFilters } from "../types/recipe";

export function useRecipeSearchResults(ingredients: string[], filters?: RecipeSearchFilters) {
  return useQuery({
    queryKey: ["recipe-search", ingredients, filters],
    queryFn: () => searchRecipes(ingredients, filters),
    enabled: ingredients.length > 0,
    retry: false,
  });
}

export function useRecipeDetail(recipeId: number | undefined, ingredients: string[]) {
  return useQuery({
    queryKey: ["recipe", recipeId, ingredients],
    queryFn: () => getRecipe(recipeId as number, ingredients),
    enabled: recipeId !== undefined,
  });
}
