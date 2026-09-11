import { motion } from "framer-motion";

import { RecipeCard } from "./RecipeCard";
import type { RecipeSummary } from "../../types/recipe";

interface RecipeListProps {
  recipes: RecipeSummary[];
  /** Ids of recipes the signed-in user has already favorited — computed by
   * the caller from `useFavorites()` so cards can show accurate heart state
   * without each summary needing its own `is_favorited` field. */
  favoritedIds?: Set<number> | undefined;
}

export function RecipeList({ recipes, favoritedIds }: RecipeListProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {recipes.map((recipe, index) => (
        <motion.div
          key={recipe.id}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: Math.min(index * 0.05, 0.3), ease: "easeOut" }}
        >
          <RecipeCard recipe={recipe} isFavorited={favoritedIds?.has(recipe.id) ?? false} />
        </motion.div>
      ))}
    </div>
  );
}
