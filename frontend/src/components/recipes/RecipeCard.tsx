import { Link } from "react-router-dom";

import type { RecipeSummary } from "../../types/recipe";
import { DIFFICULTY_ICON } from "../../utils/recipeDisplay";

interface RecipeCardProps {
  recipe: RecipeSummary;
}

export function RecipeCard({ recipe }: RecipeCardProps) {
  return (
    <Link
      to={`/recipes/${recipe.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="relative h-40 w-full bg-gradient-to-br from-brand-100 to-brand-200">
        {recipe.image_url ? (
          <img src={recipe.image_url} alt={recipe.title} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-5xl" aria-hidden="true">
            🍽️
          </div>
        )}
        <span className="absolute right-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-xs font-bold text-brand-700 shadow">
          {Math.round(recipe.match_percentage)}% match
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="font-semibold text-gray-900 group-hover:text-brand-700">{recipe.title}</h3>
        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
          <span>⏱ {recipe.total_time_minutes} min</span>
          <span>
            {DIFFICULTY_ICON[recipe.difficulty] ?? ""} {recipe.difficulty[0]?.toUpperCase()}
            {recipe.difficulty.slice(1)}
          </span>
          <span>🍽 {recipe.servings} servings</span>
        </div>
        <p className="text-sm text-gray-600">
          You already have {recipe.matched_ingredient_count}/{recipe.total_ingredient_count}{" "}
          ingredients
        </p>
        {recipe.missing_ingredients.length > 0 && (
          <p className="truncate text-xs text-gray-400">
            Missing: {recipe.missing_ingredients.join(", ")}
          </p>
        )}
        <span className="mt-auto pt-2 text-sm font-semibold text-brand-600 group-hover:underline">
          View Recipe →
        </span>
      </div>
    </Link>
  );
}
