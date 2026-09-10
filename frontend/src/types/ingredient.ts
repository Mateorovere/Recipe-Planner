export type IngredientSource = "image" | "audio" | "text" | "manual";

export interface DetectedIngredient {
  name: string;
  confidence: number | null;
  source: IngredientSource;
}

export interface IngredientExtractionResponse {
  ingredients: DetectedIngredient[];
  transcript: string | null;
}

export interface IngredientHistoryItem {
  id: number;
  raw_label: string;
  source: IngredientSource;
  confidence: number | null;
  created_at: string;
}

/** A locally-edited ingredient in the review screen — always has a stable client id
 * so chips can be added/removed/edited without index-shifting bugs. */
export interface DraftIngredient {
  id: string;
  name: string;
  confidence: number | null;
  source: IngredientSource;
}
