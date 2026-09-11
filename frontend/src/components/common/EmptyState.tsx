import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";

interface Suggestion {
  label: string;
  onClick: () => void;
}

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  /** Optional quick-action chips offering a next step instead of a dead end. */
  suggestions?: Suggestion[] | undefined;
}

export function EmptyState({
  icon = "🍽️",
  title,
  description,
  action,
  suggestions,
}: EmptyStateProps) {
  const prefersReducedMotion = useReducedMotion();
  const iconMotionProps = prefersReducedMotion
    ? {}
    : {
        initial: { scale: 0.6, opacity: 0 },
        animate: { scale: 1, opacity: 1 },
        transition: { type: "spring" as const, stiffness: 260, damping: 16 },
      };

  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-cream-300 bg-white/60 p-10 text-center animate-fade-in">
      <motion.span className="text-5xl" aria-hidden="true" {...iconMotionProps}>
        {icon}
      </motion.span>
      <p className="text-lg font-semibold text-cream-900">{title}</p>
      {description && <p className="max-w-sm text-sm text-cream-600">{description}</p>}
      {action}
      {suggestions && suggestions.length > 0 && (
        <div className="mt-1 flex flex-wrap justify-center gap-2">
          {suggestions.map((s) => (
            <button
              key={s.label}
              type="button"
              onClick={s.onClick}
              className="rounded-full border border-cream-200 bg-white px-3.5 py-1.5 text-sm font-medium text-brand-700 transition-colors hover:border-brand-300 hover:bg-brand-50"
            >
              {s.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
