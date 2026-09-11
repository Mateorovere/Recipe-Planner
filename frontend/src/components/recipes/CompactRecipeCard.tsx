import { Clock } from "lucide-react";
import { Link } from "react-router-dom";

import { DIFFICULTY_ICON } from "../../utils/recipeDisplay";
import type { Difficulty } from "../../types/recipe";

interface CompactRecipeCardProps {
  id: number;
  title: string;
  image_url: string | null;
  total_time_minutes: number;
  difficulty: Difficulty;
}

/** Small card for horizontal "Continue where you left off" / "Recently
 * viewed" rows — lighter than the full RecipeCard used in search results. */
export function CompactRecipeCard({
  id,
  title,
  image_url,
  total_time_minutes,
  difficulty,
}: CompactRecipeCardProps) {
  return (
    <Link
      to={`/recipes/${id}`}
      className="group flex w-40 flex-none flex-col gap-2 sm:w-48"
    >
      <div className="relative h-28 w-full overflow-hidden rounded-2xl bg-gradient-to-br from-brand-100 to-brand-200 shadow-soft transition-transform duration-200 group-hover:-translate-y-1 group-hover:shadow-lifted sm:h-32">
        {image_url ? (
          <img
            src={image_url}
            alt=""
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-3xl" aria-hidden="true">
            🍽️
          </div>
        )}
      </div>
      <p className="line-clamp-2 text-sm font-semibold text-cream-900 group-hover:text-brand-700">
        {title}
      </p>
      <div className="flex items-center gap-2 text-xs text-cream-500">
        <span className="inline-flex items-center gap-1">
          <Clock className="h-3.5 w-3.5" aria-hidden="true" />
          {total_time_minutes} min
        </span>
        <span aria-hidden="true">·</span>
        <span>{DIFFICULTY_ICON[difficulty] ?? ""}</span>
      </div>
    </Link>
  );
}
