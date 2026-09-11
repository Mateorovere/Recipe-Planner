import { useState } from "react";

import { IngredientChip } from "./IngredientChip";
import { Button } from "../common/Button";
import { EmptyState } from "../common/EmptyState";
import { useIngredientDraftStore } from "../../state/ingredientDraftStore";

export function IngredientReviewList() {
  const ingredients = useIngredientDraftStore((s) => s.ingredients);
  const removeIngredient = useIngredientDraftStore((s) => s.removeIngredient);
  const addIngredient = useIngredientDraftStore((s) => s.addIngredient);
  const updateQuantity = useIngredientDraftStore((s) => s.updateQuantity);
  const [newIngredient, setNewIngredient] = useState("");
  const [newQuantity, setNewQuantity] = useState("");
  const [newUnit, setNewUnit] = useState("");

  function handleAdd() {
    if (newIngredient.trim()) {
      addIngredient(
        newIngredient,
        newQuantity === "" ? null : Number(newQuantity),
        newUnit || null,
      );
      setNewIngredient("");
      setNewQuantity("");
      setNewUnit("");
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
        <div className="flex flex-col gap-2" role="list" aria-label="Your ingredients">
          {ingredients.map((ingredient) => (
            <div role="listitem" key={ingredient.id}>
              <IngredientChip
                ingredient={ingredient}
                onRemove={removeIngredient}
                onQuantityChange={updateQuantity}
              />
            </div>
          ))}
        </div>
      )}

      <form
        className="flex flex-wrap gap-2"
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
          className="min-w-0 flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
        />
        <input
          type="number"
          inputMode="decimal"
          min={0}
          step="any"
          value={newQuantity}
          onChange={(e) => setNewQuantity(e.target.value)}
          placeholder="qty"
          aria-label="New ingredient quantity"
          className="w-16 rounded-xl border border-gray-200 px-2 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
        />
        <input
          type="text"
          value={newUnit}
          onChange={(e) => setNewUnit(e.target.value)}
          placeholder="unit"
          aria-label="New ingredient unit"
          className="w-20 rounded-xl border border-gray-200 px-2 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
        />
        <Button type="submit" variant="secondary" disabled={!newIngredient.trim()}>
          + Add
        </Button>
      </form>
    </div>
  );
}
