import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

const DEFAULT_STAGES = ["Uploading…", "Analyzing what's there…", "Matching ingredients…"];
const STAGE_INTERVAL_MS = 1400;

interface AIThinkingIndicatorProps {
  stages?: string[];
  className?: string;
}

/** Purely presentational "AI is working" state — cycles through staged copy
 * while a mutation is pending. Does not track real backend progress (there is
 * none to track); it exists to make a single request feel like an assistant
 * actively doing something instead of a frozen button. */
export function AIThinkingIndicator({
  stages = DEFAULT_STAGES,
  className = "",
}: AIThinkingIndicatorProps) {
  const [stageIndex, setStageIndex] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setStageIndex((i) => Math.min(i + 1, stages.length - 1));
    }, STAGE_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [stages.length]);

  return (
    <div
      role="status"
      className={`flex items-center gap-3 rounded-2xl border border-brand-100 bg-brand-50 px-4 py-3.5 text-sm font-medium text-brand-800 ${className}`}
    >
      <motion.span
        animate={{ rotate: 360 }}
        transition={{ duration: 1.6, repeat: Infinity, ease: "linear" }}
        className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-white text-brand-600 shadow-soft"
        aria-hidden="true"
      >
        <Sparkles className="h-4 w-4" />
      </motion.span>
      <motion.span
        key={stageIndex}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {stages[stageIndex]}
      </motion.span>
    </div>
  );
}
