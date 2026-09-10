import { useState } from "react";

import { Button } from "../common/Button";

interface TextInputFormProps {
  onSubmit: (text: string) => void;
  isSubmitting: boolean;
}

export function TextInputForm({ onSubmit, isSubmitting }: TextInputFormProps) {
  const [text, setText] = useState("");

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (text.trim()) onSubmit(text.trim());
      }}
    >
      <label htmlFor="ingredient-text" className="text-sm font-medium text-gray-700">
        What do you have on hand?
      </label>
      <textarea
        id="ingredient-text"
        className="min-h-32 rounded-xl border border-gray-200 p-4 text-base focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
        placeholder="e.g. I have chicken, rice, broccoli and soy sauce."
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={isSubmitting}
      />
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
