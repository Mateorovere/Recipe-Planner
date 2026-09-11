import { useParams } from "react-router-dom";

import { Button } from "../components/common/Button";
import { ErrorState } from "../components/common/ErrorState";
import { Skeleton } from "../components/common/Skeleton";
import { useFavorites, useToggleFavorite } from "../hooks/useFavorites";
import { useRecipeDetail } from "../hooks/useRecipeSearch";
import { useAuthStore } from "../state/authStore";
import { DIFFICULTY_ICON } from "../utils/recipeDisplay";

const NUTRITION_SOURCE_LABEL: Record<string, string> = {
  calculated: "Calculated from ingredients",
  estimated: "Estimated",
  database: "From our recipe database",
  ai_generated: "AI-estimated — not medically precise",
};

export function RecipeDetailPage() {
  const params = useParams<{ recipeId: string }>();
  const recipeId = params.recipeId ? Number(params.recipeId) : undefined;
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const { data: recipe, isLoading, isError, error, refetch } = useRecipeDetail(recipeId);
  useFavorites(); // warms the favorites cache so the toggle below feels instant
  const { add, remove } = useToggleFavorite(recipeId ?? -1);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-56 w-full" />
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    );
  }

  if (isError || !recipe) {
    return <ErrorState error={error} onRetry={() => void refetch()} title="Recipe not found" />;
  }

  const isFavoriting = add.isPending || remove.isPending;

  return (
    <article className="flex flex-col gap-6 pb-10">
      <div className="relative h-56 w-full overflow-hidden rounded-2xl bg-gradient-to-br from-brand-100 to-brand-200 sm:h-72">
        {recipe.image_url ? (
          <img src={recipe.image_url} alt={recipe.title} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-7xl" aria-hidden="true">
            🍽️
          </div>
        )}
      </div>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{recipe.title}</h1>
          <p className="mt-1 text-gray-600">{recipe.description}</p>
        </div>
        {isAuthenticated && (
          <Button
            variant={recipe.is_favorited ? "danger" : "secondary"}
            isLoading={isFavoriting}
            onClick={() => (recipe.is_favorited ? remove.mutate() : add.mutate())}
          >
            {recipe.is_favorited ? "♥ Saved" : "♡ Save"}
          </Button>
        )}
      </div>

      <div className="flex flex-wrap gap-4 rounded-2xl bg-gray-50 p-4 text-sm text-gray-700">
        <span>⏱ {recipe.total_time_minutes} min total</span>
        <span>
          {DIFFICULTY_ICON[recipe.difficulty]} {recipe.difficulty}
        </span>
        <span>🍽 {recipe.servings} servings</span>
        <span className="font-semibold text-brand-700">
          {Math.round(recipe.match_percentage)}% ingredient match
        </span>
      </div>

      <div className="rounded-2xl border border-brand-100 bg-brand-50 p-4 text-sm text-brand-900">
        <p className="font-semibold">Why this recipe?</p>
        <p className="mt-1">{recipe.match_explanation}</p>
      </div>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-gray-900">Ingredients</h2>
        <ul className="flex flex-col divide-y divide-gray-100 rounded-2xl border border-gray-100">
          {recipe.ingredients.map((ing) => (
            <li
              key={ing.name}
              className="flex items-center justify-between gap-2 px-4 py-3 text-sm"
            >
              <span className={ing.have ? "text-gray-800" : "text-gray-400"}>
                {ing.have ? "✅" : "⬜"} {ing.name}
                {ing.quantity !== null && (
                  <span className="text-gray-400">
                    {" "}
                    — {ing.quantity} {ing.unit ?? ""}
                  </span>
                )}
              </span>
              {ing.importance !== "normal" && (
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs capitalize text-gray-500">
                  {ing.importance}
                </span>
              )}
            </li>
          ))}
        </ul>
      </section>

      {recipe.substitutions.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold text-gray-900">Possible substitutions</h2>
          <ul className="flex flex-col gap-2 text-sm text-gray-600">
            {recipe.substitutions.map((s) => (
              <li key={`${s.ingredient}-${s.substitute}`}>
                Swap <span className="font-medium">{s.ingredient}</span> for{" "}
                <span className="font-medium">{s.substitute}</span>
                {s.notes && <span className="text-gray-400"> — {s.notes}</span>}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2 className="mb-3 text-lg font-semibold text-gray-900">Preparation steps</h2>
        <ol className="flex flex-col gap-3">
          {recipe.steps.map((step) => (
            <li key={step.step_number} className="flex gap-3">
              <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white">
                {step.step_number}
              </span>
              <p className="pt-0.5 text-sm text-gray-700">{step.instruction}</p>
            </li>
          ))}
        </ol>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-gray-900">Nutrition</h2>
        {recipe.nutrition ? (
          <div className="rounded-2xl border border-gray-100 p-4">
            <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-5">
              <NutritionStat label="Calories" value={Math.round(recipe.nutrition.calories)} />
              <NutritionStat label="Protein" value={`${Math.round(recipe.nutrition.protein_g)}g`} />
              <NutritionStat label="Carbs" value={`${Math.round(recipe.nutrition.carbs_g)}g`} />
              <NutritionStat label="Fat" value={`${Math.round(recipe.nutrition.fat_g)}g`} />
              <NutritionStat label="Fiber" value={`${Math.round(recipe.nutrition.fiber_g)}g`} />
            </div>
            <p className="mt-3 text-xs text-gray-400">
              {NUTRITION_SOURCE_LABEL[recipe.nutrition.source] ?? recipe.nutrition.source} · per
              serving.
            </p>
          </div>
        ) : (
          <p className="text-sm text-gray-500">
            Nutrition information isn't available for this recipe right now.
          </p>
        )}
      </section>
    </article>
  );
}

function NutritionStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex flex-col">
      <span className="text-lg font-bold text-gray-900">{value}</span>
      <span className="text-xs text-gray-500">{label}</span>
    </div>
  );
}
