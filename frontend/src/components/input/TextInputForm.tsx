import { useState } from "react";

import { AIThinkingIndicator } from "../common/AIThinkingIndicator";
import { Button } from "../common/Button";
import { Chip } from "../common/Chip";

interface TextInputFormProps {
  onSubmit: (text: string) => void;
  isSubmitting: boolean;
}

const QUICK_ADD = ["eggs", "onion", "garlic", "rice", "chicken", "tomato", "olive oil", "cheese"];

export function TextInputForm({ onSubmit, isSubmitting }: TextInputFormProps) {
  const [text, setText] = useState("");

  function addQuickIngredient(name: string) {
    setText((prev) => {
      if (prev.toLowerCase().includes(name)) return prev;
      const trimmed = prev.trim();
      if (!trimmed) return `I have ${name}`;
      return `${trimmed}, ${name}`;
    });
  }

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (text.trim()) onSubmit(text.trim());
      }}
    >
      <label htmlFor="ingredient-text" className="text-sm font-medium text-cream-700">
        What do you have on hand?
      </label>
      <textarea
        id="ingredient-text"
        className="min-h-32 rounded-xl border border-cream-200 bg-white p-4 text-base text-cream-900 transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
        placeholder="e.g. I have chicken, rice, broccoli and soy sauce."
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={isSubmitting}
      />
      <div className="flex flex-wrap gap-2">
        {QUICK_ADD.map((name) => (
          <Chip
            key={name}
            type="button"
            onClick={() => addQuickIngredient(name)}
            disabled={isSubmitting}
            className="!px-3 !py-1.5 !text-xs"
          >
            + {name}
          </Chip>
        ))}
      </div>
      {isSubmitting && (
        <AIThinkingIndicator stages={["Reading your list…", "Matching ingredients…"]} />
      )}
      <Button
        type="submit"
        size="lg"
        isLoading={isSubmitting}
        disabled={!text.trim() || isSubmitting}
      >
        Find my ingredients
      </Button>
    </form>
  );
}
