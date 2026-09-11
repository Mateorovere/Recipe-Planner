import type { ButtonHTMLAttributes, ReactNode } from "react";

type ChipVariant = "neutral" | "selected" | "warning";

interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ChipVariant;
  children: ReactNode;
}

const VARIANT_CLASSES: Record<ChipVariant, string> = {
  neutral: "border-cream-200 bg-white text-cream-700 hover:border-brand-300 hover:bg-brand-50",
  selected: "border-brand-500 bg-brand-500 text-white shadow-soft",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
};

/** Generic pill control. Selectable filter chips build on this directly;
 * components with richer content (IngredientChip) use it as a base surface. */
export function Chip({ variant = "neutral", className = "", children, ...rest }: ChipProps) {
  return (
    <button
      type="button"
      className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-medium transition-all duration-150 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 ${VARIANT_CLASSES[variant]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
