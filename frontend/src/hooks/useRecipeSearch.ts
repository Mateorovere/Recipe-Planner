import { useQuery } from "@tanstack/react-query";

import { getRecipe, searchRecipes } from "../api/recipes";
import type { IngredientQuantity } from "../types/ingredient";
import type { RecipeSearchFilters } from "../types/recipe";

export function useRecipeSearchResults(
  ingredients: IngredientQuantity[],
  filters?: RecipeSearchFilters,
) {
  return useQuery({
    queryKey: ["recipe-search", ingredients, filters],
    queryFn: () => searchRecipes(ingredients, filters),
    enabled: ingredients.length > 0,
    retry: false,
  });
}

export function useRecipeDetail(recipeId: number | undefined) {
  return useQuery({
    queryKey: ["recipe", recipeId],
    queryFn: () => getRecipe(recipeId as number),
    enabled: recipeId !== undefined,
  });
}
