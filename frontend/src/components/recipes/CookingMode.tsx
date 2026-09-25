import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronLeft, ChevronRight, ListChecks, X } from "lucide-react";

import { ProgressBar } from "../common/ProgressBar";
import type { RecipeDetail } from "../../types/recipe";

interface CookingModeProps {
  recipe: RecipeDetail;
  onClose: () => void;
}

/** Full-screen, one-step-at-a-time cooking view. All progress here is local
 * and ephemeral (no backend endpoint tracks step completion) — closing or
 * refreshing resets it, which is fine for a single cooking session. */
export function CookingMode({ recipe, onClose }: CookingModeProps) {
  const steps = recipe.steps;
  const total = steps.length;
  const [stepIndex, setStepIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [checkedIngredients, setCheckedIngredients] = useState<Set<string>>(new Set());
  const [showIngredients, setShowIngredients] = useState(false);

  const isLastStep = stepIndex === total - 1;

  function goNext() {
    if (isLastStep) {
      onClose();
      return;
    }
    setDirection(1);
    setStepIndex((i) => Math.min(i + 1, total - 1));
  }

  function goPrev() {
    setDirection(-1);
    setStepIndex((i) => Math.max(i - 1, 0));
  }

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "ArrowRight") goNext();
      else if (e.key === "ArrowLeft") goPrev();
      else if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepIndex, total]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  function toggleIngredient(name: string) {
    setCheckedIngredients((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  const step = steps[stepIndex];
  if (!step) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Cooking ${recipe.title}`}
      className="fixed inset-0 z-50 flex flex-col bg-cream-50"
    >
      <div className="flex items-center gap-3 border-b border-cream-200 bg-white px-4 py-3 sm:px-6">
        <button
          type="button"
          onClick={onClose}
          aria-label="Exit cooking mode"
          className="flex h-10 w-10 flex-none items-center justify-center rounded-full text-cream-500 transition-colors hover:bg-cream-100"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
        <div className="flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-cream-400">
            Step {stepIndex + 1} of {total}
          </p>
          <ProgressBar value={stepIndex + 1} max={total} label="Cooking progress" />
        </div>
        <button
          type="button"
          onClick={() => setShowIngredients(true)}
          className="flex h-10 flex-none items-center gap-1.5 rounded-full border border-cream-200 px-3 text-sm font-medium text-cream-700 transition-colors hover:border-brand-300"
        >
          <ListChecks className="h-4 w-4" aria-hidden="true" />
          <span className="hidden sm:inline">Ingredients</span>
        </button>
      </div>

      <div className="relative flex flex-1 items-center justify-center overflow-hidden px-6 py-10">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={stepIndex}
            custom={direction}
            initial={{ opacity: 0, x: direction > 0 ? 60 : -60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction > 0 ? -60 : 60 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.15}
            onDragEnd={(_, info) => {
              if (info.offset.x < -80) goNext();
              else if (info.offset.x > 80) goPrev();
            }}
            className="flex w-full max-w-xl cursor-grab flex-col items-center gap-6 text-center active:cursor-grabbing"
          >
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-500 font-display text-2xl font-semibold text-white shadow-lifted">
              {step.step_number}
            </span>
            <p className="font-display text-2xl font-medium leading-snug text-cream-900 sm:text-3xl">
              {step.instruction}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-cream-200 bg-white px-4 py-4 sm:px-6">
        <button
          type="button"
          onClick={goPrev}
          disabled={stepIndex === 0}
          className="inline-flex items-center gap-1 rounded-xl px-4 py-2.5 font-semibold text-cream-600 transition-colors hover:bg-cream-100 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft className="h-5 w-5" aria-hidden="true" />
          Back
        </button>
        <div className="hidden gap-1.5 sm:flex" aria-hidden="true">
          {steps.map((s, i) => (
            <span
              key={s.step_number}
              className={`h-1.5 w-1.5 rounded-full transition-colors ${
                i === stepIndex ? "bg-brand-600" : "bg-cream-300"
              }`}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={goNext}
          className="inline-flex items-center gap-1 rounded-xl bg-brand-600 px-5 py-2.5 font-semibold text-white shadow-soft transition-all active:scale-[0.97] hover:bg-brand-700"
        >
          {isLastStep ? (
            <>
              Finish cooking
              <Check className="h-5 w-5" aria-hidden="true" />
            </>
          ) : (
            <>
              Next
              <ChevronRight className="h-5 w-5" aria-hidden="true" />
            </>
          )}
        </button>
      </div>

      <AnimatePresence>
        {showIngredients && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-10 bg-black/30"
              onClick={() => setShowIngredients(false)}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
              className="fixed inset-x-0 bottom-0 z-20 max-h-[70vh] overflow-y-auto rounded-t-3xl bg-white p-6 shadow-lifted"
            >
              <div
                className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-cream-200"
                aria-hidden="true"
              />
              <h2 className="mb-4 text-lg font-semibold text-cream-900">Ingredient checklist</h2>
              <ul className="flex flex-col gap-1">
                {recipe.ingredients.map((ing) => {
                  const checked = checkedIngredients.has(ing.name);
                  return (
                    <li key={ing.name}>
                      <button
                        type="button"
                        onClick={() => toggleIngredient(ing.name)}
                        className="flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left transition-colors hover:bg-cream-50"
                      >
                        <span
                          className={`flex h-5 w-5 flex-none items-center justify-center rounded-md border-2 transition-colors ${
                            checked ? "border-brand-600 bg-brand-600" : "border-cream-300"
                          }`}
                        >
                          {checked && (
                            <Check className="h-3.5 w-3.5 text-white" aria-hidden="true" />
                          )}
                        </span>
                        <span
                          className={`capitalize ${checked ? "text-cream-400 line-through" : "text-cream-800"}`}
                        >
                          {ing.name}
                          {ing.quantity !== null && (
                            <span className="text-cream-400">
                              {" "}
                              — {ing.quantity} {ing.unit ?? ""}
                            </span>
                          )}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
