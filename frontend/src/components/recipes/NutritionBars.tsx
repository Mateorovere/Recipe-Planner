import { motion, useReducedMotion } from "framer-motion";

import type { NutritionView } from "../../types/recipe";

const NUTRITION_SOURCE_LABEL: Record<string, string> = {
  calculated: "Calculated from ingredients",
  estimated: "Estimated",
  database: "From our recipe database",
  ai_generated: "AI-estimated — not medically precise",
};

interface MacroBarProps {
  label: string;
  grams: number;
  caloriesPerGram: number;
  totalCalories: number;
  colorClass: string;
}

function MacroBar({ label, grams, caloriesPerGram, totalCalories, colorClass }: MacroBarProps) {
  const prefersReducedMotion = useReducedMotion();
  const share = totalCalories > 0 ? Math.min(100, ((grams * caloriesPerGram) / totalCalories) * 100) : 0;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between text-sm">
        <span className="font-medium text-cream-700">{label}</span>
        <span className="text-cream-500">{Math.round(grams)}g</span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-cream-200">
        <motion.div
          className={`h-full rounded-full ${colorClass}`}
          initial={{ width: 0 }}
          animate={{ width: `${share}%` }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.5, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

/** Visual macro breakdown — plain SVG/CSS bars, no chart dependency. */
export function NutritionBars({ nutrition }: { nutrition: NutritionView }) {
  return (
    <div className="flex flex-col gap-5 rounded-2xl border border-cream-200 bg-white p-5">
      <div className="flex items-baseline gap-2">
        <span className="font-display text-3xl font-semibold text-cream-900">
          {Math.round(nutrition.calories)}
        </span>
        <span className="text-sm text-cream-500">calories per serving</span>
      </div>
      <div className="flex flex-col gap-3">
        <MacroBar
          label="Protein"
          grams={nutrition.protein_g}
          caloriesPerGram={4}
          totalCalories={nutrition.calories}
          colorClass="bg-brand-500"
        />
        <MacroBar
          label="Carbs"
          grams={nutrition.carbs_g}
          caloriesPerGram={4}
          totalCalories={nutrition.calories}
          colorClass="bg-success-500"
        />
        <MacroBar
          label="Fat"
          grams={nutrition.fat_g}
          caloriesPerGram={9}
          totalCalories={nutrition.calories}
          colorClass="bg-amber-400"
        />
      </div>
      <div className="flex items-center justify-between border-t border-cream-100 pt-3 text-sm">
        <span className="text-cream-600">Fiber</span>
        <span className="font-medium text-cream-800">{Math.round(nutrition.fiber_g)}g</span>
      </div>
      <p className="text-xs text-cream-400">
        {NUTRITION_SOURCE_LABEL[nutrition.source] ?? nutrition.source} · per serving.
      </p>
    </div>
  );
}
