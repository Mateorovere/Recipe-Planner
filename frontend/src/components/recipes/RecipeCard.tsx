import type { MouseEvent } from "react";
import { Clock, Heart, Users } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

import { Badge } from "../common/Badge";
import { IconButton } from "../common/IconButton";
import { toast } from "../common/toastClient";
import { useToggleFavorite } from "../../hooks/useFavorites";
import { useAuthStore } from "../../state/authStore";
import type { RecipeSummary } from "../../types/recipe";
import { DIFFICULTY_ICON } from "../../utils/recipeDisplay";

interface RecipeCardProps {
  recipe: RecipeSummary;
  /** Whether this recipe is already in the signed-in user's favorites —
   * computed by the caller from the shared `useFavorites()` query, since a
   * search-result summary doesn't carry this itself. */
  isFavorited?: boolean;
}

export function RecipeCard({ recipe, isFavorited = false }: RecipeCardProps) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { add, remove } = useToggleFavorite(recipe.id);
  const isToggling = add.isPending || remove.isPending;

  function handleFavoriteClick(e: MouseEvent) {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.info("Log in to save recipes to your favorites.");
      return;
    }
    if (isFavorited) {
      remove.mutate(undefined, { onError: () => toast.error("Couldn't remove that favorite.") });
    } else {
      add.mutate(undefined, {
        onSuccess: () => toast.success("Saved to favorites."),
        onError: () => toast.error("Couldn't save that recipe."),
      });
    }
  }

  return (
    <div className="relative">
      <Link
        to={`/recipes/${recipe.id}`}
        className="group flex h-full flex-col overflow-hidden rounded-2xl border border-cream-200 bg-white shadow-soft transition-all duration-200 hover:-translate-y-1 hover:shadow-lifted"
      >
        <div className="relative h-44 w-full overflow-hidden bg-gradient-to-br from-brand-100 to-brand-200">
          {recipe.image_url ? (
            <img
              src={recipe.image_url}
              alt={recipe.title}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-5xl" aria-hidden="true">
              🍽️
            </div>
          )}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-black/0 to-black/0" />
          <span className="absolute right-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-xs font-bold text-brand-700 shadow-soft">
            {Math.round(recipe.match_percentage)}% match
          </span>
          {recipe.tags.length > 0 && (
            <div className="absolute bottom-3 left-3 flex flex-wrap gap-1.5">
              {recipe.tags.slice(0, 2).map((tag) => (
                <Badge key={tag} variant="neutral" className="!bg-white/90">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
          {recipe.image_attribution && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                window.open(
                  recipe.image_attribution!.photographer_url,
                  "_blank",
                  "noopener,noreferrer",
                );
              }}
              className="absolute bottom-3 right-3 rounded-full bg-black/40 px-2 py-0.5 text-[10px] font-medium text-white/90 underline-offset-2 hover:underline"
            >
              📷 {recipe.image_attribution.photographer_name}
            </button>
          )}
        </div>
        <div className="flex flex-1 flex-col gap-2 p-4">
          <h3 className="font-semibold text-cream-900 group-hover:text-brand-700">
            {recipe.title}
          </h3>
          {recipe.description && (
            <p className="line-clamp-2 text-sm text-cream-500">{recipe.description}</p>
          )}
          <div className="flex flex-wrap items-center gap-3 text-xs text-cream-500">
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" aria-hidden="true" />⏱ {recipe.total_time_minutes} min
            </span>
            <span>
              {DIFFICULTY_ICON[recipe.difficulty] ?? ""} {recipe.difficulty[0]?.toUpperCase()}
              {recipe.difficulty.slice(1)}
            </span>
            <span className="inline-flex items-center gap-1">
              <Users className="h-3.5 w-3.5" aria-hidden="true" />
              🍽 {recipe.servings} servings
            </span>
          </div>
          <p className="text-sm text-cream-600">
            You already have {recipe.matched_ingredient_count}/{recipe.total_ingredient_count}{" "}
            ingredients
          </p>
          {recipe.missing_ingredients.length > 0 && (
            <p className="truncate text-xs text-cream-400">
              Missing: {recipe.missing_ingredients.join(", ")}
            </p>
          )}
          <span className="mt-auto pt-2 text-sm font-semibold text-brand-600 group-hover:underline">
            View Recipe →
          </span>
        </div>
      </Link>
      <IconButton
        aria-label={isFavorited ? `Remove ${recipe.title} from favorites` : `Save ${recipe.title}`}
        onClick={handleFavoriteClick}
        disabled={isToggling}
        className="absolute right-3 top-12 z-10"
      >
        <motion.span
          key={isFavorited ? "on" : "off"}
          initial={{ scale: 0.6 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 15 }}
        >
          <Heart
            className={`h-4 w-4 ${isFavorited ? "text-brand-600" : "text-cream-500"}`}
            fill={isFavorited ? "currentColor" : "none"}
            aria-hidden="true"
          />
        </motion.span>
      </IconButton>
    </div>
  );
}
