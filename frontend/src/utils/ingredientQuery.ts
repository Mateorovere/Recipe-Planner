import type { IngredientQuantity } from "../types/ingredient";

/** Encodes/decodes the ingredient list carried in the `/results?q=...` URL so a
 * search is bookmarkable and survives a page refresh or the back button, without
 * needing one query param per ingredient (which can't cleanly carry
 * quantity/unit). */

export function encodeIngredientQuery(ingredients: IngredientQuantity[]): string {
  return encodeURIComponent(JSON.stringify(ingredients));
}

export function decodeIngredientQuery(raw: string | null): IngredientQuantity[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(decodeURIComponent(raw));
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is IngredientQuantity => {
      if (typeof item !== "object" || item === null) return false;
      return typeof (item as { name?: unknown }).name === "string";
    });
  } catch {
    return [];
  }
}
