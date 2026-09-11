import { motion, useReducedMotion } from "framer-motion";

interface ProgressBarProps {
  value: number;
  max: number;
  className?: string;
  label?: string;
}

/** Determinate progress track used by Cooking Mode and the AI analysis state. */
export function ProgressBar({ value, max, className = "", label }: ProgressBarProps) {
  const prefersReducedMotion = useReducedMotion();
  const percent = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;

  return (
    <div
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-label={label}
      className={`h-2 w-full overflow-hidden rounded-full bg-cream-200 ${className}`}
    >
      <motion.div
        className="h-full rounded-full bg-brand-500"
        initial={false}
        animate={{ width: `${percent}%` }}
        transition={{ duration: prefersReducedMotion ? 0 : 0.35, ease: "easeOut" }}
      />
    </div>
  );
}
