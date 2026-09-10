import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { favoriteRecipe, unfavoriteRecipe } from "../api/recipes";
import { getFavorites } from "../api/users";
import { useAuthStore } from "../state/authStore";

export function useFavorites() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: ["favorites"],
    queryFn: getFavorites,
    enabled: isAuthenticated,
  });
}

export function useToggleFavorite(recipeId: number) {
  const queryClient = useQueryClient();

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["favorites"] });
    void queryClient.invalidateQueries({ queryKey: ["recipe", recipeId] });
  };

  const add = useMutation({
    mutationFn: () => favoriteRecipe(recipeId),
    onSuccess: invalidate,
  });
  const remove = useMutation({
    mutationFn: () => unfavoriteRecipe(recipeId),
    onSuccess: invalidate,
  });

  return { add, remove };
}
