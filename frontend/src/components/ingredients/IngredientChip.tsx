import type { DraftIngredient } from "../../types/ingredient";

interface IngredientChipProps {
  ingredient: DraftIngredient;
  onRemove: (id: string) => void;
}

const LOW_CONFIDENCE_THRESHOLD = 0.5;

export function IngredientChip({ ingredient, onRemove }: IngredientChipProps) {
  const isLowConfidence =
    ingredient.confidence !== null && ingredient.confidence < LOW_CONFIDENCE_THRESHOLD;

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-medium capitalize ${
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
      {ingredient.name}
      <button
        type="button"
        aria-label={`Remove ${ingredient.name}`}
        onClick={() => onRemove(ingredient.id)}
        className="ml-1 rounded-full opacity-70 hover:opacity-100"
      >
        ×
      </button>
    </span>
  );
}
