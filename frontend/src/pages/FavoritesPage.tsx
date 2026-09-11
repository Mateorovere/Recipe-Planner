import { Link } from "react-router-dom";

import { EmptyState } from "../components/common/EmptyState";
import { ErrorState } from "../components/common/ErrorState";
import { RecipeGridSkeleton } from "../components/common/Skeleton";
import { RecipeList } from "../components/recipes/RecipeList";
import { useFavorites } from "../hooks/useFavorites";
import { useAuthStore } from "../state/authStore";

export function FavoritesPage() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { data, isLoading, isError, error, refetch } = useFavorites();
  const favoritedIds = new Set(data?.map((r) => r.id));

  if (!isAuthenticated) {
    return (
      <EmptyState
        icon="🔐"
        title="Log in to see your favorites"
        description="Save recipes you love and find them here anytime."
        action={
          <Link
            to="/login"
            className="inline-flex items-center justify-center rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-soft transition-colors hover:bg-brand-700"
          >
            Log in
          </Link>
        }
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-2xl font-semibold text-cream-900">Your favorites</h1>
      {isLoading && <RecipeGridSkeleton />}
      {isError && <ErrorState error={error} onRetry={() => void refetch()} />}
      {data && data.length === 0 && (
        <EmptyState
          icon="🤍"
          title="No favorites yet"
          description="Tap the heart on any recipe to save it here."
          action={
            <Link
              to="/"
              className="inline-flex items-center justify-center rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-soft transition-colors hover:bg-brand-700"
            >
              Find recipes to try
            </Link>
          }
        />
      )}
      {data && data.length > 0 && <RecipeList recipes={data} favoritedIds={favoritedIds} />}
    </div>
  );
}
