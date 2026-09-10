import { apiRequest } from "./client";
import type { IngredientHistoryItem } from "../types/ingredient";
import type { RecipeSummary, SearchHistoryItem } from "../types/recipe";

export function getFavorites(): Promise<RecipeSummary[]> {
  return apiRequest<RecipeSummary[]>("/api/v1/users/me/favorites");
}

export interface HistoryResponse {
  searches: SearchHistoryItem[];
  ingredients: IngredientHistoryItem[];
}

export function getHistory(): Promise<HistoryResponse> {
  return apiRequest<HistoryResponse>("/api/v1/users/me/history");
}
