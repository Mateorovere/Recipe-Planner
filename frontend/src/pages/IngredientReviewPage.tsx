import { useNavigate } from "react-router-dom";

import { Button } from "../components/common/Button";
import { EmptyState } from "../components/common/EmptyState";
import { IngredientReviewList } from "../components/ingredients/IngredientReviewList";
import { useIngredientDraftStore } from "../state/ingredientDraftStore";

export function IngredientReviewPage() {
  const ingredients = useIngredientDraftStore((s) => s.ingredients);
  const transcript = useIngredientDraftStore((s) => s.transcript);
  const navigate = useNavigate();

  if (ingredients.length === 0 && !transcript) {
    return (
      <EmptyState
        icon="🧺"
        title="Let's find your ingredients first"
        description="Head back home to scan a photo, describe, or type what you have."
        action={
          <Button onClick={() => navigate("/")} className="mt-2">
            Go to Home
          </Button>
        }
      />
    );
  }

  function handleFindRecipes() {
    const params = new URLSearchParams();
    for (const i of ingredients) params.append("ingredients", i.name);
    navigate(`/results?${params.toString()}`);
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Your ingredients</h1>
        <p className="mt-1 text-sm text-gray-500">
          Review what we found — add, remove, or fix anything before we search for recipes.
        </p>
      </div>

      {transcript && (
        <div className="rounded-xl bg-gray-100 p-4 text-sm text-gray-600">
          <p className="mb-1 font-medium text-gray-500">We heard:</p>
          <p className="italic">"{transcript}"</p>
        </div>
      )}

      <IngredientReviewList />

      <Button
        size="lg"
        onClick={handleFindRecipes}
        disabled={ingredients.length === 0}
        className="w-full sm:w-auto"
      >
        Find Recipes
      </Button>
    </div>
  );
}
