import { useState } from "react";

import { IngredientChip } from "./IngredientChip";
import { Button } from "../common/Button";
import { EmptyState } from "../common/EmptyState";
import { useIngredientDraftStore } from "../../state/ingredientDraftStore";

export function IngredientReviewList() {
  const ingredients = useIngredientDraftStore((s) => s.ingredients);
  const removeIngredient = useIngredientDraftStore((s) => s.removeIngredient);
  const addIngredient = useIngredientDraftStore((s) => s.addIngredient);
  const [newIngredient, setNewIngredient] = useState("");

  function handleAdd() {
    if (newIngredient.trim()) {
      addIngredient(newIngredient);
      setNewIngredient("");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {ingredients.length === 0 ? (
        <EmptyState
          title="No ingredients yet"
          description="Add ingredients below to get recipe recommendations."
        />
      ) : (
        <div className="flex flex-wrap gap-2" role="list" aria-label="Your ingredients">
          {ingredients.map((ingredient) => (
            <div role="listitem" key={ingredient.id}>
              <IngredientChip ingredient={ingredient} onRemove={removeIngredient} />
            </div>
          ))}
        </div>
      )}

      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          handleAdd();
        }}
      >
        <input
          type="text"
          value={newIngredient}
          onChange={(e) => setNewIngredient(e.target.value)}
          placeholder="Add an ingredient"
          aria-label="Add an ingredient"
          className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
        />
        <Button type="submit" variant="secondary" disabled={!newIngredient.trim()}>
          + Add
        </Button>
      </form>
    </div>
  );
}
