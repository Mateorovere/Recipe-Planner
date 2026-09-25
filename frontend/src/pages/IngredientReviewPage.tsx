import { MessageCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Button } from "../components/common/Button";
import { EmptyState } from "../components/common/EmptyState";
import { IngredientReviewList } from "../components/ingredients/IngredientReviewList";
import { useIngredientDraftStore } from "../state/ingredientDraftStore";
import { encodeIngredientQuery } from "../utils/ingredientQuery";

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
    const query = encodeIngredientQuery(
      ingredients.map((i) => ({ name: i.name, quantity: i.quantity, unit: i.unit })),
    );
    navigate(`/results?q=${query}`);
  }

  return (
    <div className="flex flex-col gap-6 pb-36 sm:pb-0">
      <div>
        <h1 className="font-display text-2xl font-semibold text-cream-900">Your ingredients</h1>
        <p className="mt-1 text-sm text-cream-600">
          Review what we found — add, remove, or fix anything before we search for recipes.
        </p>
      </div>

      {transcript && (
        <div className="flex items-start gap-3 rounded-2xl bg-cream-200/60 p-4 text-sm text-cream-700">
          <MessageCircle className="mt-0.5 h-4 w-4 flex-none text-brand-600" aria-hidden="true" />
          <div>
            <p className="mb-1 font-medium text-cream-500">I heard:</p>
            <p className="italic">"{transcript}"</p>
          </div>
        </div>
      )}

      <IngredientReviewList />

      {ingredients.length > 0 && (
        <p className="text-sm text-cream-600">
          <span className="font-semibold text-brand-700">{ingredients.length}</span> ingredient
          {ingredients.length === 1 ? "" : "s"} ready — let's find something delicious.
        </p>
      )}

      {/* A single action: sticky bottom bar on mobile, inline on desktop —
          one button, positioning handled entirely with responsive classes so
          there's never a duplicate accessible "Find Recipes" control. */}
      <div className="fixed inset-x-0 bottom-16 z-20 border-t border-cream-200 bg-white/95 p-4 backdrop-blur-md sm:static sm:border-0 sm:bg-transparent sm:p-0">
        <Button
          size="lg"
          onClick={handleFindRecipes}
          disabled={ingredients.length === 0}
          className="w-full sm:w-auto"
        >
          Find Recipes
        </Button>
      </div>
    </div>
  );
}
