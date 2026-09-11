export type Difficulty = "easy" | "medium" | "hard";
export type IngredientImportance = "critical" | "normal" | "optional";
export type NutritionSource = "calculated" | "estimated" | "database" | "ai_generated";

export interface RecipeSummary {
  id: number;
  title: string;
  slug: string;
  image_url: string | null;
  description: string;
  prep_time_minutes: number;
  cook_time_minutes: number;
  total_time_minutes: number;
  difficulty: Difficulty;
  servings: number;
  match_percentage: number;
  matched_ingredient_count: number;
  total_ingredient_count: number;
  missing_ingredients: string[];
}

export interface RecipeSearchResponse {
  recipes: RecipeSummary[];
}

export interface RecipeIngredientView {
  name: string;
  quantity: number | null;
  unit: string | null;
  importance: IngredientImportance;
  have: boolean;
}

export interface RecipeStepView {
  step_number: number;
  instruction: string;
}

export interface NutritionView {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  source: NutritionSource;
}

export interface SubstitutionView {
  ingredient: string;
  substitute: string;
  notes: string | null;
}

export interface RecipeDetail extends RecipeSummary {
  cuisine: string | null;
  ingredients: RecipeIngredientView[];
  steps: RecipeStepView[];
  nutrition: NutritionView | null;
  match_explanation: string;
  substitutions: SubstitutionView[];
  is_favorited: boolean;
}

export interface RecipeSearchFilters {
  max_total_time_minutes?: number;
  difficulty?: Difficulty;
  dietary_tags?: string[];
}

export interface SearchHistoryItem {
  id: number;
  query_ingredients: { name: string; quantity: number | null; unit: string | null }[];
  results_count: number;
  created_at: string;
}
