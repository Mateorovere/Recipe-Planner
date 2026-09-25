import { useState } from "react";
import { Sparkles } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { ApiError } from "../api/client";
import { Button } from "../components/common/Button";
import { EmptyState } from "../components/common/EmptyState";
import { ErrorState } from "../components/common/ErrorState";
import { RecipeGridSkeleton } from "../components/common/Skeleton";
import { FilterBar } from "../components/recipes/FilterBar";
import { RecipeList } from "../components/recipes/RecipeList";
import { useFavorites } from "../hooks/useFavorites";
import { useRecipeSearchResults } from "../hooks/useRecipeSearch";
import { useAuthStore } from "../state/authStore";
import type { RecipeSearchFilters } from "../types/recipe";
import { decodeIngredientQuery } from "../utils/ingredientQuery";

export function RecipeResultsPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const ingredients = decodeIngredientQuery(searchParams.get("q"));
  const [filters, setFilters] = useState<RecipeSearchFilters | undefined>(undefined);

  const { data, isLoading, isError, error, refetch } = useRecipeSearchResults(ingredients, filters);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { data: favorites } = useFavorites();
  const favoritedIds = new Set(favorites?.map((r) => r.id));

  if (ingredients.length === 0) {
    return (
      <EmptyState
        icon="🔍"
        title="No ingredients to search with"
        description="Go back and tell us what you have first."
        action={<Button onClick={() => navigate("/")}>Go to Home</Button>}
      />
    );
  }

  const hasFilters = filters !== undefined;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-2xl font-semibold text-cream-900">Recipes for you</h1>
        <p className="text-sm text-cream-600">
          Based on:{" "}
          <span className="font-medium text-cream-800">
            {ingredients.map((i) => i.name).join(", ")}
          </span>
        </p>
      </div>

      <FilterBar filters={filters} onChange={setFilters} />

      {isLoading && <RecipeGridSkeleton />}

      {isError &&
        (error instanceof ApiError && error.code === "no_matching_recipes" ? (
          <EmptyState
            icon="🥲"
            title="No recipes matched those ingredients"
            description={error.message}
            action={
              <Button variant="secondary" onClick={() => navigate("/review")}>
                Edit ingredients
              </Button>
            }
            suggestions={
              hasFilters
                ? [{ label: "Clear filters and try again", onClick: () => setFilters(undefined) }]
                : undefined
            }
          />
        ) : (
          <ErrorState error={error} onRetry={() => void refetch()} />
        ))}

      {data && data.recipes.length > 0 && (
        <>
          <div className="flex items-start gap-3 rounded-2xl border border-brand-100 bg-brand-50 px-4 py-3 text-sm text-brand-800">
            <Sparkles className="mt-0.5 h-4 w-4 flex-none text-brand-600" aria-hidden="true" />
            <p>
              I found <span className="font-semibold">{data.recipes.length}</span> recipe
              {data.recipes.length === 1 ? "" : "s"} you can make with these ingredients.
              {!hasFilters && (
                <>
                  {" "}
                  Want something quicker?{" "}
                  <button
                    type="button"
                    className="font-semibold underline decoration-brand-300 underline-offset-2 hover:text-brand-900"
                    onClick={() => setFilters({ max_total_time_minutes: 30, dietary_tags: [] })}
                  >
                    Try 30 minutes or less
                  </button>
                  , or looking for{" "}
                  <button
                    type="button"
                    className="font-semibold underline decoration-brand-300 underline-offset-2 hover:text-brand-900"
                    onClick={() => setFilters({ dietary_tags: ["high-protein"] })}
                  >
                    high-protein
                  </button>
                  ?
                </>
              )}
            </p>
          </div>
          <RecipeList
            recipes={data.recipes}
            favoritedIds={isAuthenticated ? favoritedIds : undefined}
          />
        </>
      )}
    </div>
  );
}
