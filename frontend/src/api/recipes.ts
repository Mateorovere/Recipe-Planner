import { apiRequest } from "./client";
import type { IngredientQuantity } from "../types/ingredient";
import type { RecipeDetail, RecipeSearchFilters, RecipeSearchResponse } from "../types/recipe";

export function searchRecipes(
  ingredients: IngredientQuantity[],
  filters?: RecipeSearchFilters,
  count = 5,
): Promise<RecipeSearchResponse> {
  return apiRequest<RecipeSearchResponse>("/api/v1/recipes/search", {
    method: "POST",
    body: { ingredients, filters: filters ?? null, count },
  });
}

export function getRecipe(recipeId: number): Promise<RecipeDetail> {
  return apiRequest<RecipeDetail>(`/api/v1/recipes/${recipeId}`);
}

export function favoriteRecipe(recipeId: number): Promise<void> {
  return apiRequest<void>(`/api/v1/recipes/${recipeId}/favorite`, { method: "POST" });
}

export function unfavoriteRecipe(recipeId: number): Promise<void> {
  return apiRequest<void>(`/api/v1/recipes/${recipeId}/favorite`, { method: "DELETE" });
}
