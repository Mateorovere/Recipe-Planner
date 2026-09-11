import type { DraftIngredient } from "../../types/ingredient";

interface IngredientChipProps {
  ingredient: DraftIngredient;
  onRemove: (id: string) => void;
  onQuantityChange: (id: string, quantity: number | null, unit: string | null) => void;
}

const LOW_CONFIDENCE_THRESHOLD = 0.5;

export function IngredientChip({ ingredient, onRemove, onQuantityChange }: IngredientChipProps) {
  const isLowConfidence =
    ingredient.confidence !== null && ingredient.confidence < LOW_CONFIDENCE_THRESHOLD;

  return (
    <div
      className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium ${
        isLowConfidence
          ? "border-amber-200 bg-amber-50 text-amber-800"
          : "border-brand-200 bg-brand-50 text-brand-800"
      }`}
      title={
        ingredient.confidence !== null
          ? `Detected confidence: ${Math.round(ingredient.confidence * 100)}%`
          : "Added manually"
      }
    >
      {isLowConfidence && (
        <span aria-hidden="true" title="Low confidence detection">
          ⚠️
        </span>
      )}
      <span className="min-w-0 flex-1 truncate capitalize">{ingredient.name}</span>
      <input
        type="number"
        inputMode="decimal"
        min={0}
        step="any"
        aria-label={`Quantity for ${ingredient.name}`}
        placeholder="qty"
        value={ingredient.quantity ?? ""}
        onChange={(e) => {
          const value = e.target.value;
          onQuantityChange(ingredient.id, value === "" ? null : Number(value), ingredient.unit);
        }}
        className="w-14 rounded-lg border border-white bg-white/70 px-1.5 py-1 text-center text-xs"
      />
      <input
        type="text"
        aria-label={`Unit for ${ingredient.name}`}
        placeholder="unit"
        value={ingredient.unit ?? ""}
        onChange={(e) =>
          onQuantityChange(ingredient.id, ingredient.quantity, e.target.value || null)
        }
        className="w-16 rounded-lg border border-white bg-white/70 px-1.5 py-1 text-xs"
      />
      <button
        type="button"
        aria-label={`Remove ${ingredient.name}`}
        onClick={() => onRemove(ingredient.id)}
        className="rounded-full px-1 text-base opacity-70 hover:opacity-100"
      >
        ×
      </button>
    </div>
  );
}
