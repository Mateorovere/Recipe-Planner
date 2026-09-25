import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ChefHat, Check, Clock, Flame, Heart, Share2, Users } from "lucide-react";
import { useParams } from "react-router-dom";

import { Badge } from "../components/common/Badge";
import { Button } from "../components/common/Button";
import { ErrorState } from "../components/common/ErrorState";
import { IconButton } from "../components/common/IconButton";
import { RecipeDetailSkeleton } from "../components/common/Skeleton";
import { toast } from "../components/common/toastClient";
import { CookingMode } from "../components/recipes/CookingMode";
import { NutritionBars } from "../components/recipes/NutritionBars";
import { useFavorites, useToggleFavorite } from "../hooks/useFavorites";
import { useRecipeDetail } from "../hooks/useRecipeSearch";
import { useAuthStore } from "../state/authStore";
import { useRecentlyViewedStore } from "../state/recentlyViewedStore";
import { DIFFICULTY_ICON } from "../utils/recipeDisplay";

export function RecipeDetailPage() {
  const params = useParams<{ recipeId: string }>();
  const recipeId = params.recipeId ? Number(params.recipeId) : undefined;
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const { data: recipe, isLoading, isError, error, refetch } = useRecipeDetail(recipeId);
  useFavorites(); // warms the favorites cache so the toggle below feels instant
  const { add, remove } = useToggleFavorite(recipeId ?? -1);
  const recordRecentlyViewed = useRecentlyViewedStore((s) => s.record);

  const [checkedIngredients, setCheckedIngredients] = useState<Set<string>>(new Set());
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [cookingMode, setCookingMode] = useState(false);

  useEffect(() => {
    if (recipe) {
      recordRecentlyViewed({
        id: recipe.id,
        title: recipe.title,
        image_url: recipe.image_url,
        total_time_minutes: recipe.total_time_minutes,
        difficulty: recipe.difficulty,
      });
    }
  }, [recipe, recordRecentlyViewed]);

  if (isLoading) {
    return <RecipeDetailSkeleton />;
  }

  if (isError || !recipe) {
    return <ErrorState error={error} onRetry={() => void refetch()} title="Recipe not found" />;
  }

  const isFavoriting = add.isPending || remove.isPending;

  function toggleIngredient(name: string) {
    setCheckedIngredients((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  function toggleStep(stepNumber: number) {
    setCompletedSteps((prev) => {
      const next = new Set(prev);
      if (next.has(stepNumber)) next.delete(stepNumber);
      else next.add(stepNumber);
      return next;
    });
  }

  async function handleShare() {
    if (!recipe) return;
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: recipe.title, url });
      } catch {
        // user cancelled the native share sheet — nothing to do
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard.");
    } catch {
      toast.error("Couldn't copy the link.");
    }
  }

  return (
    <article className="flex flex-col gap-6 pb-10">
      <div className="relative h-64 w-full overflow-hidden rounded-3xl bg-gradient-to-br from-brand-100 to-brand-200 sm:h-80">
        {recipe.image_url ? (
          <img src={recipe.image_url} alt={recipe.title} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-7xl" aria-hidden="true">
            🍽️
          </div>
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

        <div className="absolute right-4 top-4 flex gap-2">
          <IconButton aria-label="Share this recipe" onClick={() => void handleShare()}>
            <Share2 className="h-4 w-4 text-cream-700" aria-hidden="true" />
          </IconButton>
          {isAuthenticated && (
            <IconButton
              aria-label={recipe.is_favorited ? "Remove from favorites" : "Save recipe"}
              onClick={() =>
                recipe.is_favorited
                  ? remove.mutate(undefined, {
                      onError: () => toast.error("Couldn't remove that favorite."),
                    })
                  : add.mutate(undefined, { onSuccess: () => toast.success("Saved to favorites.") })
              }
              disabled={isFavoriting}
            >
              <motion.span
                key={recipe.is_favorited ? "on" : "off"}
                initial={{ scale: 0.6 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 15 }}
              >
                <Heart
                  className={`h-4 w-4 ${recipe.is_favorited ? "text-brand-600" : "text-cream-700"}`}
                  fill={recipe.is_favorited ? "currentColor" : "none"}
                  aria-hidden="true"
                />
              </motion.span>
            </IconButton>
          )}
        </div>

        <div className="absolute inset-x-0 bottom-0 flex flex-col gap-2 p-5 sm:p-6">
          <div className="flex flex-wrap gap-1.5">
            {recipe.cuisine && (
              <Badge variant="neutral" className="!bg-white/90">
                {recipe.cuisine}
              </Badge>
            )}
            {recipe.tags.slice(0, 4).map((tag) => (
              <Badge key={tag} variant="neutral" className="!bg-white/90">
                {tag}
              </Badge>
            ))}
          </div>
          <h1 className="font-display text-2xl font-semibold text-white sm:text-3xl">
            {recipe.title}
          </h1>
          {recipe.image_attribution && (
            <p className="text-xs text-white/70">
              Photo by{" "}
              <a
                href={recipe.image_attribution.photographer_url}
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-white"
              >
                {recipe.image_attribution.photographer_name}
              </a>{" "}
              on{" "}
              <a
                href="https://unsplash.com/?utm_source=ai-recipe-planner&utm_medium=referral"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-white"
              >
                Unsplash
              </a>
            </p>
          )}
        </div>
      </div>

      <p className="text-cream-600">{recipe.description}</p>

      <div className="flex flex-wrap gap-4 rounded-2xl bg-white p-4 text-sm text-cream-700 shadow-soft">
        <span className="inline-flex items-center gap-1.5">
          <Clock className="h-4 w-4 text-brand-500" aria-hidden="true" />
          {recipe.total_time_minutes} min total
        </span>
        <span className="inline-flex items-center gap-1.5">
          {DIFFICULTY_ICON[recipe.difficulty]} {recipe.difficulty}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Users className="h-4 w-4 text-brand-500" aria-hidden="true" />
          {recipe.servings} servings
        </span>
        <span className="ml-auto inline-flex items-center gap-1.5 font-semibold text-brand-700">
          <Flame className="h-4 w-4" aria-hidden="true" />
          {Math.round(recipe.match_percentage)}% ingredient match
        </span>
      </div>

      <div className="rounded-2xl border border-brand-100 bg-brand-50 p-4 text-sm text-brand-900">
        <p className="font-semibold">Why this recipe?</p>
        <p className="mt-1">{recipe.match_explanation}</p>
      </div>

      {recipe.steps.length > 0 && (
        <Button size="lg" onClick={() => setCookingMode(true)} className="w-full sm:w-auto">
          <ChefHat className="h-5 w-5" aria-hidden="true" />
          Start cooking
        </Button>
      )}

      <section>
        <h2 className="mb-3 text-lg font-semibold text-cream-900">Ingredients</h2>
        <ul className="flex flex-col divide-y divide-cream-100 rounded-2xl border border-cream-200 bg-white">
          {recipe.ingredients.map((ing) => {
            const isChecked = checkedIngredients.has(ing.name);
            return (
              <li key={ing.name}>
                <button
                  type="button"
                  onClick={() => toggleIngredient(ing.name)}
                  className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left text-sm transition-colors hover:bg-cream-50"
                >
                  <span className="flex items-center gap-2.5">
                    <span
                      className={`flex h-5 w-5 flex-none items-center justify-center rounded-md border-2 transition-colors ${
                        isChecked ? "border-brand-600 bg-brand-600" : "border-cream-300"
                      }`}
                      aria-hidden="true"
                    >
                      {isChecked && <Check className="h-3.5 w-3.5 text-white" />}
                    </span>
                    <span className={isChecked ? "text-cream-400 line-through" : "text-cream-800"}>
                      {ing.have ? "✅" : "⬜"} {ing.name}
                      {ing.quantity !== null && (
                        <span className="text-cream-400">
                          {" "}
                          — {ing.quantity} {ing.unit ?? ""}
                        </span>
                      )}
                    </span>
                  </span>
                  {ing.importance !== "normal" && (
                    <Badge variant={ing.importance === "critical" ? "amber" : "neutral"}>
                      {ing.importance}
                    </Badge>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      {recipe.substitutions.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold text-cream-900">Possible substitutions</h2>
          <ul className="flex flex-col gap-2 text-sm text-cream-600">
            {recipe.substitutions.map((s) => (
              <li key={`${s.ingredient}-${s.substitute}`}>
                Swap <span className="font-medium text-cream-800">{s.ingredient}</span> for{" "}
                <span className="font-medium text-cream-800">{s.substitute}</span>
                {s.notes && <span className="text-cream-400"> — {s.notes}</span>}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2 className="mb-3 text-lg font-semibold text-cream-900">Preparation steps</h2>
        <ol className="flex flex-col gap-3">
          {recipe.steps.map((step) => {
            const isDone = completedSteps.has(step.step_number);
            return (
              <li key={step.step_number}>
                <button
                  type="button"
                  onClick={() => toggleStep(step.step_number)}
                  className="flex w-full gap-3 rounded-2xl border border-cream-200 bg-white p-3 text-left transition-colors hover:border-brand-200"
                >
                  <span
                    className={`flex h-7 w-7 flex-none items-center justify-center rounded-full text-sm font-bold transition-colors ${
                      isDone ? "bg-success-500 text-white" : "bg-brand-600 text-white"
                    }`}
                  >
                    {isDone ? <Check className="h-4 w-4" aria-hidden="true" /> : step.step_number}
                  </span>
                  <p
                    className={`pt-0.5 text-sm ${isDone ? "text-cream-400 line-through" : "text-cream-700"}`}
                  >
                    {step.instruction}
                  </p>
                </button>
              </li>
            );
          })}
        </ol>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-cream-900">Nutrition</h2>
        {recipe.nutrition ? (
          <NutritionBars nutrition={recipe.nutrition} />
        ) : (
          <p className="text-sm text-cream-500">
            Nutrition information isn't available for this recipe right now.
          </p>
        )}
      </section>

      {cookingMode && <CookingMode recipe={recipe} onClose={() => setCookingMode(false)} />}
    </article>
  );
}
