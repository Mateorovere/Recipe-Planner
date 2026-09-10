import { apiRequest } from "./client";
import type { RecipeDetail, RecipeSearchFilters, RecipeSearchResponse } from "../types/recipe";

export function searchRecipes(
  ingredients: string[],
  filters?: RecipeSearchFilters,
  limit = 12,
): Promise<RecipeSearchResponse> {
  return apiRequest<RecipeSearchResponse>("/api/v1/recipes/search", {
    method: "POST",
    body: { ingredients, filters: filters ?? null, limit },
  });
}

export function getRecipe(recipeId: number, ingredients: string[]): Promise<RecipeDetail> {
  return apiRequest<RecipeDetail>(`/api/v1/recipes/${recipeId}`, {
    query: { ingredients },
  });
}

export function favoriteRecipe(recipeId: number): Promise<void> {
  return apiRequest<void>(`/api/v1/recipes/${recipeId}/favorite`, { method: "POST" });
}

export function unfavoriteRecipe(recipeId: number): Promise<void> {
  return apiRequest<void>(`/api/v1/recipes/${recipeId}/favorite`, { method: "DELETE" });
}
