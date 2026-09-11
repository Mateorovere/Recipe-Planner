import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { Difficulty } from "../types/recipe";

const MAX_ITEMS = 8;

/** Just enough to render a compact card without re-fetching. Populated
 * client-side only (there's no "recently viewed" concept on the backend) —
 * purely a per-browser convenience, so it's fine that it lives in
 * localStorage and isn't shared across devices. */
export interface RecentlyViewedRecipe {
  id: number;
  title: string;
  image_url: string | null;
  total_time_minutes: number;
  difficulty: Difficulty;
  viewed_at: number;
}

interface RecentlyViewedState {
  items: RecentlyViewedRecipe[];
  record: (recipe: Omit<RecentlyViewedRecipe, "viewed_at">) => void;
}

export const useRecentlyViewedStore = create<RecentlyViewedState>()(
  persist(
    (set) => ({
      items: [],
      record: (recipe) =>
        set((state) => ({
          items: [
            { ...recipe, viewed_at: Date.now() },
            ...state.items.filter((i) => i.id !== recipe.id),
          ].slice(0, MAX_ITEMS),
        })),
    }),
    { name: "recipe-ai:recently-viewed" },
  ),
);
