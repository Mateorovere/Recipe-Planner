import { RecipeCard } from "./RecipeCard";
import type { RecipeSummary } from "../../types/recipe";

interface RecipeListProps {
  recipes: RecipeSummary[];
}

export function RecipeList({ recipes }: RecipeListProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {recipes.map((recipe) => (
        <RecipeCard key={recipe.id} recipe={recipe} />
      ))}
    </div>
  );
}
