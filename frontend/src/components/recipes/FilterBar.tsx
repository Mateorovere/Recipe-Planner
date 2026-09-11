import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, SlidersHorizontal, X } from "lucide-react";
import { useState } from "react";

import { Chip } from "../common/Chip";
import type { Difficulty, RecipeSearchFilters } from "../../types/recipe";

interface FilterBarProps {
  filters: RecipeSearchFilters | undefined;
  onChange: (next: RecipeSearchFilters | undefined) => void;
}

const DIFFICULTIES: { value: Difficulty; label: string }[] = [
  { value: "easy", label: "🟢 Easy" },
  { value: "medium", label: "🟡 Medium" },
  { value: "hard", label: "🔴 Hard" },
];

const TIME_PRESETS = [
  { value: 15, label: "Under 15 min" },
  { value: 30, label: "Under 30 min" },
  { value: 60, label: "Under 1 hour" },
];

const DIETARY_TAGS = ["vegetarian", "vegan", "high-protein", "low-carb", "gluten-free", "quick"];

function activeCount(filters: RecipeSearchFilters | undefined): number {
  if (!filters) return 0;
  return (
    (filters.difficulty ? 1 : 0) +
    (filters.max_total_time_minutes ? 1 : 0) +
    (filters.dietary_tags?.length ?? 0)
  );
}

function normalize(next: {
  difficulty?: Difficulty | undefined;
  max_total_time_minutes?: number | undefined;
  dietary_tags: string[];
}): RecipeSearchFilters | undefined {
  const isEmpty = !next.difficulty && !next.max_total_time_minutes && next.dietary_tags.length === 0;
  if (isEmpty) return undefined;

  // Build up only the keys that are actually set — avoids assigning explicit
  // `undefined` to optional fields under `exactOptionalPropertyTypes`.
  const result: RecipeSearchFilters = { dietary_tags: next.dietary_tags };
  if (next.difficulty) result.difficulty = next.difficulty;
  if (next.max_total_time_minutes) result.max_total_time_minutes = next.max_total_time_minutes;
  return result;
}

/** Difficulty / time / dietary-tag chips wired directly to the real
 * `RecipeSearchFilters` the backend accepts — nothing decorative. Collapses
 * to a single toggle button; the panel animates open/closed. */
export function FilterBar({ filters, onChange }: FilterBarProps) {
  const [expanded, setExpanded] = useState(false);
  const count = activeCount(filters);
  const tags = filters?.dietary_tags ?? [];

  function setDifficulty(value: Difficulty) {
    onChange(
      normalize({
        difficulty: filters?.difficulty === value ? undefined : value,
        max_total_time_minutes: filters?.max_total_time_minutes,
        dietary_tags: tags,
      }),
    );
  }

  function setMaxTime(value: number) {
    onChange(
      normalize({
        difficulty: filters?.difficulty,
        max_total_time_minutes: filters?.max_total_time_minutes === value ? undefined : value,
        dietary_tags: tags,
      }),
    );
  }

  function toggleTag(tag: string) {
    const nextTags = tags.includes(tag) ? tags.filter((t) => t !== tag) : [...tags, tag];
    onChange(
      normalize({
        difficulty: filters?.difficulty,
        max_total_time_minutes: filters?.max_total_time_minutes,
        dietary_tags: nextTags,
      }),
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          aria-expanded={expanded}
          className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
            expanded || count > 0
              ? "border-brand-300 bg-brand-50 text-brand-700"
              : "border-cream-200 bg-white text-cream-700 hover:border-brand-200"
          }`}
        >
          <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
          Filters
          {count > 0 && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">
              {count}
            </span>
          )}
          <ChevronDown
            className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`}
            aria-hidden="true"
          />
        </button>
        {count > 0 && (
          <button
            type="button"
            onClick={() => onChange(undefined)}
            className="inline-flex items-center gap-1 text-sm font-medium text-cream-500 hover:text-brand-700"
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
            Clear
          </button>
        )}
      </div>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-4 rounded-2xl border border-cream-200 bg-white p-4 shadow-soft">
              <div className="flex flex-col gap-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-cream-400">
                  Difficulty
                </p>
                <div className="flex flex-wrap gap-2">
                  {DIFFICULTIES.map((d) => (
                    <Chip
                      key={d.value}
                      variant={filters?.difficulty === d.value ? "selected" : "neutral"}
                      onClick={() => setDifficulty(d.value)}
                    >
                      {d.label}
                    </Chip>
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-cream-400">
                  Total time
                </p>
                <div className="flex flex-wrap gap-2">
                  {TIME_PRESETS.map((t) => (
                    <Chip
                      key={t.value}
                      variant={filters?.max_total_time_minutes === t.value ? "selected" : "neutral"}
                      onClick={() => setMaxTime(t.value)}
                    >
                      {t.label}
                    </Chip>
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-cream-400">
                  Dietary
                </p>
                <div className="flex flex-wrap gap-2">
                  {DIETARY_TAGS.map((tag) => (
                    <Chip
                      key={tag}
                      variant={tags.includes(tag) ? "selected" : "neutral"}
                      onClick={() => toggleTag(tag)}
                    >
                      {tag}
                    </Chip>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
