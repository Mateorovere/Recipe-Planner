import { useMutation } from "@tanstack/react-query";

import { extractFromAudio, extractFromImage, extractFromText } from "../api/ingredients";
import { useIngredientDraftStore } from "../state/ingredientDraftStore";

export function useExtractFromImage() {
  const setFromExtraction = useIngredientDraftStore((s) => s.setFromExtraction);
  return useMutation({
    mutationFn: extractFromImage,
    onSuccess: (data) => setFromExtraction(data.ingredients, data.transcript),
  });
}

export function useExtractFromAudio() {
  const setFromExtraction = useIngredientDraftStore((s) => s.setFromExtraction);
  return useMutation({
    mutationFn: extractFromAudio,
    onSuccess: (data) => setFromExtraction(data.ingredients, data.transcript),
  });
}

export function useExtractFromText() {
  const setFromExtraction = useIngredientDraftStore((s) => s.setFromExtraction);
  return useMutation({
    mutationFn: extractFromText,
    onSuccess: (data) => setFromExtraction(data.ingredients, data.transcript),
  });
}
