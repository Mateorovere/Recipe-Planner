import { apiRequest } from "./client";
import type { IngredientExtractionResponse } from "../types/ingredient";

export function extractFromImage(file: File): Promise<IngredientExtractionResponse> {
  const formData = new FormData();
  formData.append("file", file);
  return apiRequest<IngredientExtractionResponse>("/api/v1/ingredients/image", {
    method: "POST",
    formData,
  });
}

export function extractFromAudio(file: File | Blob): Promise<IngredientExtractionResponse> {
  const formData = new FormData();
  formData.append("file", file, "recording.webm");
  return apiRequest<IngredientExtractionResponse>("/api/v1/ingredients/audio", {
    method: "POST",
    formData,
  });
}

export function extractFromText(text: string): Promise<IngredientExtractionResponse> {
  return apiRequest<IngredientExtractionResponse>("/api/v1/ingredients/text", {
    method: "POST",
    body: { text },
  });
}
