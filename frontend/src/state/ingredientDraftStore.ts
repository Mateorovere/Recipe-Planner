import { create } from "zustand";

import type { DetectedIngredient, DraftIngredient } from "../types/ingredient";

function makeId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

interface IngredientDraftState {
  ingredients: DraftIngredient[];
  transcript: string | null;
  setFromExtraction: (ingredients: DetectedIngredient[], transcript?: string | null) => void;
  addIngredient: (name: string, quantity?: number | null, unit?: string | null) => void;
  removeIngredient: (id: string) => void;
  updateIngredient: (id: string, name: string) => void;
  updateQuantity: (id: string, quantity: number | null, unit: string | null) => void;
  clear: () => void;
}

export const useIngredientDraftStore = create<IngredientDraftState>((set) => ({
  ingredients: [],
  transcript: null,
  setFromExtraction: (ingredients, transcript = null) =>
    set({
      ingredients: ingredients.map((i) => ({
        id: makeId(),
        name: i.name,
        confidence: i.confidence,
        source: i.source,
        quantity: i.quantity,
        unit: i.unit,
      })),
      transcript,
    }),
  addIngredient: (name, quantity = null, unit = null) =>
    set((state) => {
      const trimmed = name.trim().toLowerCase();
      if (!trimmed || state.ingredients.some((i) => i.name === trimmed)) return state;
      return {
        ingredients: [
          ...state.ingredients,
          { id: makeId(), name: trimmed, confidence: null, source: "manual", quantity, unit },
        ],
      };
    }),
  removeIngredient: (id) =>
    set((state) => ({ ingredients: state.ingredients.filter((i) => i.id !== id) })),
  updateIngredient: (id, name) =>
    set((state) => ({
      ingredients: state.ingredients.map((i) =>
        i.id === id ? { ...i, name: name.trim().toLowerCase() } : i,
      ),
    })),
  updateQuantity: (id, quantity, unit) =>
    set((state) => ({
      ingredients: state.ingredients.map((i) => (i.id === id ? { ...i, quantity, unit } : i)),
    })),
  clear: () => set({ ingredients: [], transcript: null }),
}));
