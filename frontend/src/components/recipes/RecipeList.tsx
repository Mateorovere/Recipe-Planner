import { RecipeCard } from "./RecipeCard";
import type { RecipeSummary } from "../../types/recipe";

interface RecipeListProps {
  recipes: RecipeSummary[];
  ingredients: string[];
}

export function RecipeList({ recipes, ingredients }: RecipeListProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {recipes.map((recipe) => (
        <RecipeCard key={recipe.id} recipe={recipe} ingredients={ingredients} />
      ))}
    </div>
  );
}
