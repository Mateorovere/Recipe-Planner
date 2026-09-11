import { useNavigate, useSearchParams } from "react-router-dom";

import { ApiError } from "../api/client";
import { Button } from "../components/common/Button";
import { EmptyState } from "../components/common/EmptyState";
import { ErrorState } from "../components/common/ErrorState";
import { RecipeGridSkeleton } from "../components/common/Skeleton";
import { RecipeList } from "../components/recipes/RecipeList";
import { useRecipeSearchResults } from "../hooks/useRecipeSearch";
import { decodeIngredientQuery } from "../utils/ingredientQuery";

export function RecipeResultsPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const ingredients = decodeIngredientQuery(searchParams.get("q"));

  const { data, isLoading, isError, error, refetch } = useRecipeSearchResults(ingredients);

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

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-bold text-gray-900">Recipes for you</h1>
        <p className="text-sm text-gray-500">
          Based on:{" "}
          <span className="font-medium text-gray-700">
            {ingredients.map((i) => i.name).join(", ")}
          </span>
        </p>
      </div>

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
          />
        ) : (
          <ErrorState error={error} onRetry={() => void refetch()} />
        ))}

      {data && data.recipes.length > 0 && <RecipeList recipes={data.recipes} />}
    </div>
  );
}
